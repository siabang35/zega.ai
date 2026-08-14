-- ZEGA AI — Final Blocker Remediation Migration
-- Migration ID: 20260811_final_remediation.sql
-- Enforces transactional advisory locking (FINDING-01), schema type alignment (BLOCKER-03), and safe aggregations.

BEGIN;

-- 1. Align Column Data Types & Ensure Missing Fields
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS error_code TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS fee NUMERIC;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS wallet_id TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS privy_user_id TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS amount_base_units TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS sender TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS recipient TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

ALTER TABLE public.ledger_entries ADD COLUMN IF NOT EXISTS wallet_id TEXT;

DO $$
BEGIN
    -- Drop FK constraints on ledger_entries.wallet_id if present
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ledger_entries_wallet_id_fkey' 
        AND table_name = 'ledger_entries'
    ) THEN
        ALTER TABLE public.ledger_entries DROP CONSTRAINT ledger_entries_wallet_id_fkey;
    END IF;

    -- Drop FK constraints on withdrawals.wallet_id if present
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'withdrawals_wallet_id_fkey' 
        AND table_name = 'withdrawals'
    ) THEN
        ALTER TABLE public.withdrawals DROP CONSTRAINT withdrawals_wallet_id_fkey;
    END IF;

    -- Drop FK constraints on invoices.wallet_id if present
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'invoices_wallet_id_fkey' 
        AND table_name = 'invoices'
    ) THEN
        ALTER TABLE public.invoices DROP CONSTRAINT invoices_wallet_id_fkey;
    END IF;

    -- Safely convert wallet_id UUID to TEXT if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'withdrawals' 
        AND column_name = 'wallet_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.withdrawals ALTER COLUMN wallet_id TYPE TEXT USING wallet_id::text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'ledger_entries' 
        AND column_name = 'wallet_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.ledger_entries ALTER COLUMN wallet_id TYPE TEXT USING wallet_id::text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' 
        AND column_name = 'wallet_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.invoices ALTER COLUMN wallet_id TYPE TEXT USING wallet_id::text;
    END IF;

    -- Safely convert amount TEXT to NUMERIC by dropping existing default first
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'ledger_entries' 
        AND column_name = 'amount' AND data_type LIKE '%text%'
    ) THEN
        ALTER TABLE public.ledger_entries ALTER COLUMN amount DROP DEFAULT;
        ALTER TABLE public.ledger_entries ALTER COLUMN amount TYPE NUMERIC USING amount::numeric;
        ALTER TABLE public.ledger_entries ALTER COLUMN amount SET DEFAULT 0;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'withdrawals' 
        AND column_name = 'amount' AND data_type LIKE '%text%'
    ) THEN
        ALTER TABLE public.withdrawals ALTER COLUMN amount DROP DEFAULT;
        ALTER TABLE public.withdrawals ALTER COLUMN amount TYPE NUMERIC USING amount::numeric;
        ALTER TABLE public.withdrawals ALTER COLUMN amount SET DEFAULT 0;
    END IF;
END $$;

-- 2. Atomic Function: reserve_withdrawal_atomic WITH TRANSACTIONAL ADVISORY LOCK
-- Guarantees serial execution of concurrent withdrawal balance checks and fund reservations per account/asset.
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
    v_credit_sum NUMERIC := 0;
    v_debit_sum NUMERIC := 0;
    v_reserved_sum NUMERIC := 0;
    v_available NUMERIC := 0;
    v_new_withdrawal public.withdrawals;
BEGIN
    -- 🔒 FINDING-01 FIX: Acquire transaction-level advisory lock per user_id + asset.
    -- Automatically releases when the enclosing PostgreSQL transaction completes (COMMIT/ROLLBACK).
    PERFORM pg_advisory_xact_lock(hashtext('wdr_lock:' || p_user_id || ':' || p_asset));

    -- Idempotency check
    IF p_idempotency_key IS NOT NULL THEN
        SELECT * INTO v_existing FROM public.withdrawals
        WHERE idempotency_key = p_idempotency_key
        LIMIT 1;

        IF v_existing.id IS NOT NULL THEN
            RETURN v_existing;
        END IF;
    END IF;

    -- Calculate total credits from ledger (explicit numeric cast)
    SELECT COALESCE(SUM(amount::numeric), 0) INTO v_credit_sum
    FROM public.ledger_entries
    WHERE user_id = p_user_id AND asset = p_asset AND direction = 'CREDIT';

    -- Calculate total debits from ledger (explicit numeric cast)
    SELECT COALESCE(SUM(amount::numeric), 0) INTO v_debit_sum
    FROM public.ledger_entries
    WHERE user_id = p_user_id AND asset = p_asset AND direction = 'DEBIT';

    -- Calculate total active reserved withdrawals (not yet finalized or failed)
    SELECT COALESCE(SUM(amount::numeric), 0) INTO v_reserved_sum
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
        id,
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
        'wdr_' || extract(epoch from now())::bigint || '_' || floor(random()*1000000)::text,
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

-- 3. Update finalize_withdrawal_atomic with explicit numeric casts
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

-- 4. Atomic Function: release_withdrawal_reservation_atomic
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

COMMIT;
