-- ZEGA AI — Lifecycle Consistency & Financial Remediation Migration
-- Migration File: supabase/migrations/20260811_remediate_lifecycle_consistency.sql
-- Strictly enforces financial invariants, payment atomicity, withdrawal reservation, and ledger consistency.

BEGIN;

-- 1. Ensure Table Schema & Unique Constraints

-- Guarantee UNIQUE(signature) on payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID,
    user_id TEXT NOT NULL,
    signature TEXT UNIQUE NOT NULL,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    asset TEXT NOT NULL DEFAULT 'SOL',
    token_mint TEXT,
    amount NUMERIC NOT NULL,
    amount_base_units TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED',
    block_slot BIGINT,
    block_time TIMESTAMPTZ,
    confirmation_status TEXT DEFAULT 'finalized',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guarantee UNIQUE(idempotency_key) on withdrawals
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id TEXT PRIMARY KEY DEFAULT ('wdr_' || extract(epoch from now())::bigint || '_' || floor(random()*1000)::text),
    user_id TEXT NOT NULL,
    wallet_id TEXT,
    privy_user_id TEXT,
    asset TEXT NOT NULL DEFAULT 'SOL',
    token_mint TEXT,
    amount NUMERIC NOT NULL,
    amount_base_units TEXT NOT NULL,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'REQUESTED',
    signature TEXT,
    fee NUMERIC,
    error_code TEXT,
    error_message TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guarantee ledger_entries schema
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    wallet_id TEXT,
    type TEXT NOT NULL,
    asset TEXT NOT NULL DEFAULT 'SOL',
    token_mint TEXT,
    amount NUMERIC NOT NULL,
    amount_base_units TEXT NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guarantee reconciliation_records schema
CREATE TABLE IF NOT EXISTS public.reconciliation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signature TEXT NOT NULL,
    expected_amount NUMERIC NOT NULL,
    actual_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'RECONCILED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for Performance and Anti-Replay
CREATE INDEX IF NOT EXISTS idx_payments_signature ON public.payments(signature);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_idempotency ON public.withdrawals(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_ledger_user_asset ON public.ledger_entries(user_id, asset);
CREATE INDEX IF NOT EXISTS idx_ledger_ref ON public.ledger_entries(reference_id, reference_type);

-- 3. Atomic Function: reserve_withdrawal_atomic
-- Validates available balance against internal ledger & active pending reservations,
-- and inserts withdrawal record with status 'VALIDATING'.
CREATE OR REPLACE FUNCTION public.reserve_withdrawal_atomic(
    p_user_id TEXT,
    p_wallet_id TEXT,
    p_privy_user_id TEXT,
    p_asset TEXT,
    p_token_mint TEXT,
    p_amount NUMERIC,
    p_amount_base_units TEXT,
    p_sender TEXT,
    p_recipient TEXT,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS public.withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_existing public.withdrawals;
    v_credit_sum NUMERIC;
    v_debit_sum NUMERIC;
    v_reserved_sum NUMERIC;
    v_available NUMERIC;
    v_new_withdrawal public.withdrawals;
BEGIN
    -- Idempotency check
    IF p_idempotency_key IS NOT NULL THEN
        SELECT * INTO v_existing FROM public.withdrawals
        WHERE idempotency_key = p_idempotency_key
        LIMIT 1;

        IF v_existing.id IS NOT NULL THEN
            RETURN v_existing;
        END IF;
    END IF;

    -- Calculate total credits from ledger
    SELECT COALESCE(SUM(amount), 0) INTO v_credit_sum
    FROM public.ledger_entries
    WHERE user_id = p_user_id AND asset = p_asset AND direction = 'CREDIT';

    -- Calculate total debits from ledger
    SELECT COALESCE(SUM(amount), 0) INTO v_debit_sum
    FROM public.ledger_entries
    WHERE user_id = p_user_id AND asset = p_asset AND direction = 'DEBIT';

    -- Calculate total active reserved withdrawals (not yet finalized or failed)
    SELECT COALESCE(SUM(amount), 0) INTO v_reserved_sum
    FROM public.withdrawals
    WHERE user_id = p_user_id 
      AND asset = p_asset 
      AND status IN ('REQUESTED', 'VALIDATING', 'BUILDING', 'AWAITING_SIGNATURE', 'SUBMITTED', 'CONFIRMING');

    v_available := (v_credit_sum - v_debit_sum - v_reserved_sum);

    -- Enforce balance safety
    IF v_available < p_amount THEN
        RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Available balance (%) is less than requested amount (%)', v_available, p_amount;
    END IF;

    -- Insert new withdrawal record with reserved funds (status VALIDATING)
    INSERT INTO public.withdrawals (
        user_id,
        wallet_id,
        privy_user_id,
        asset,
        token_mint,
        amount,
        amount_base_units,
        sender,
        recipient,
        status,
        idempotency_key,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_wallet_id,
        p_privy_user_id,
        p_asset,
        p_token_mint,
        p_amount,
        p_amount_base_units,
        p_sender,
        p_recipient,
        'VALIDATING',
        p_idempotency_key,
        NOW(),
        NOW()
    )
    RETURNING * INTO v_new_withdrawal;

    RETURN v_new_withdrawal;
END;
$$;

-- 4. Atomic Function: finalize_withdrawal_atomic
-- Marks withdrawal as CONFIRMED and inserts the ledger DEBIT in a single DB transaction.
CREATE OR REPLACE FUNCTION public.finalize_withdrawal_atomic(
    p_withdrawal_id TEXT,
    p_signature TEXT,
    p_fee NUMERIC DEFAULT NULL
)
RETURNS public.withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_wdr public.withdrawals;
    v_existing_debit UUID;
BEGIN
    SELECT * INTO v_wdr FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;

    IF v_wdr.id IS NULL THEN
        RAISE EXCEPTION 'WITHDRAWAL_NOT_FOUND: Withdrawal ID % does not exist', p_withdrawal_id;
    END IF;

    -- Update withdrawal status to CONFIRMED
    UPDATE public.withdrawals
    SET status = 'CONFIRMED',
        signature = p_signature,
        fee = COALESCE(p_fee, fee),
        updated_at = NOW()
    WHERE id = p_withdrawal_id
    RETURNING * INTO v_wdr;

    -- Guarantee ledger DEBIT entry is present
    SELECT id INTO v_existing_debit FROM public.ledger_entries
    WHERE reference_id = p_withdrawal_id AND reference_type = 'WITHDRAWAL'
    LIMIT 1;

    IF v_existing_debit IS NULL THEN
        INSERT INTO public.ledger_entries (
            user_id,
            wallet_id,
            type,
            asset,
            token_mint,
            amount,
            amount_base_units,
            reference_type,
            reference_id,
            direction,
            created_at
        ) VALUES (
            v_wdr.user_id,
            v_wdr.wallet_id,
            'WITHDRAWAL',
            v_wdr.asset,
            v_wdr.token_mint,
            v_wdr.amount,
            v_wdr.amount_base_units,
            'WITHDRAWAL',
            v_wdr.id,
            'DEBIT',
            NOW()
        );
    END IF;

    RETURN v_wdr;
END;
$$;

-- 5. Atomic Function: release_withdrawal_reservation_atomic
-- Marks withdrawal as FAILED and releases the reserved balance.
CREATE OR REPLACE FUNCTION public.release_withdrawal_reservation_atomic(
    p_withdrawal_id TEXT,
    p_error_code TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS public.withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_wdr public.withdrawals;
BEGIN
    SELECT * INTO v_wdr FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;

    IF v_wdr.id IS NULL THEN
        RAISE EXCEPTION 'WITHDRAWAL_NOT_FOUND: Withdrawal ID % does not exist', p_withdrawal_id;
    END IF;

    -- Terminal states cannot be released
    IF v_wdr.status IN ('CONFIRMED', 'FAILED', 'CANCELLED') THEN
        RETURN v_wdr;
    END IF;

    UPDATE public.withdrawals
    SET status = 'FAILED',
        error_code = COALESCE(p_error_code, 'WITHDRAWAL_RELEASED'),
        error_message = COALESCE(p_error_message, 'Withdrawal reservation released'),
        updated_at = NOW()
    WHERE id = p_withdrawal_id
    RETURNING * INTO v_wdr;

    RETURN v_wdr;
END;
$$;

-- 6. Atomic Function: settle_payment_atomic
-- Executes payment insert + invoice status update + ledger credit insert inside one atomic DB transaction.
CREATE OR REPLACE FUNCTION public.settle_payment_atomic(
    p_invoice_id UUID,
    p_user_id TEXT,
    p_wallet_id TEXT,
    p_signature TEXT,
    p_sender TEXT,
    p_recipient TEXT,
    p_asset TEXT,
    p_token_mint TEXT,
    p_amount NUMERIC,
    p_amount_base_units TEXT,
    p_slot BIGINT DEFAULT NULL,
    p_block_time TIMESTAMPTZ DEFAULT NULL
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_existing public.payments;
    v_payment public.payments;
    v_invoice public.invoices;
    v_new_paid NUMERIC;
    v_status TEXT;
    v_overpayment NUMERIC := 0;
BEGIN
    -- Anti-replay: If payment signature already processed, return existing record
    SELECT * INTO v_existing FROM public.payments WHERE signature = p_signature LIMIT 1;
    IF v_existing.id IS NOT NULL THEN
        RETURN v_existing;
    END IF;

    -- 1. Insert payment record
    INSERT INTO public.payments (
        invoice_id,
        user_id,
        signature,
        sender,
        recipient,
        asset,
        token_mint,
        amount,
        amount_base_units,
        status,
        block_slot,
        block_time,
        confirmation_status,
        created_at,
        confirmed_at
    ) VALUES (
        p_invoice_id,
        p_user_id,
        p_signature,
        p_sender,
        p_recipient,
        p_asset,
        p_token_mint,
        p_amount,
        p_amount_base_units,
        'CONFIRMED',
        p_slot,
        COALESCE(p_block_time, NOW()),
        'finalized',
        NOW(),
        NOW()
    )
    RETURNING * INTO v_payment;

    -- 2. Insert ledger CREDIT entry
    INSERT INTO public.ledger_entries (
        user_id,
        wallet_id,
        type,
        asset,
        token_mint,
        amount,
        amount_base_units,
        reference_type,
        reference_id,
        direction,
        created_at
    ) VALUES (
        p_user_id,
        p_wallet_id,
        'PAYMENT',
        p_asset,
        p_token_mint,
        p_amount,
        p_amount_base_units,
        'PAYMENT',
        v_payment.id::text,
        'CREDIT',
        NOW()
    );

    -- 3. Update invoice if associated
    IF p_invoice_id IS NOT NULL THEN
        SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;

        IF v_invoice.id IS NOT NULL THEN
            -- Check expiration
            IF v_invoice.expires_at < NOW() AND v_invoice.status = 'PENDING' THEN
                -- Expired invoice receiving payment
                UPDATE public.invoices
                SET status = 'EXPIRED',
                    payment_signature = p_signature,
                    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                        'expired_payment_signature', p_signature,
                        'expired_payment_amount', p_amount,
                        'received_at', NOW()
                    ),
                    updated_at = NOW()
                WHERE id = p_invoice_id;
            ELSE
                v_new_paid := COALESCE(v_invoice.paid_amount, 0) + p_amount;
                IF v_new_paid >= v_invoice.amount THEN
                    v_status := 'PAID';
                    IF v_new_paid > v_invoice.amount THEN
                        v_overpayment := v_new_paid - v_invoice.amount;
                    END IF;
                ELSE
                    v_status := 'PARTIALLY_PAID';
                END IF;

                UPDATE public.invoices
                SET status = v_status,
                    paid_amount = v_new_paid,
                    payment_signature = p_signature,
                    paid_at = CASE WHEN v_status = 'PAID' THEN NOW() ELSE paid_at END,
                    metadata = CASE 
                        WHEN v_overpayment > 0 THEN 
                            COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('overpayment_amount', v_overpayment)
                        ELSE metadata 
                    END,
                    updated_at = NOW()
                WHERE id = p_invoice_id;
            END IF;
        END IF;
    END IF;

    RETURN v_payment;
END;
$$;

COMMIT;
