-- ============================================================================
-- SQL MIGRATION 52: FINANCIAL RECEIPTS & INVOICE CDN ATTACHMENTS
-- ============================================================================
-- Purpose: Enable single and bulk uploading of invoice PDFs, receipts, and 
-- photo proofs into financial transactions, integrated with R2 CDN resolution.
-- ============================================================================

BEGIN;

-- 1. Add attachment columns to umkm_financial_transactions
ALTER TABLE public.umkm_financial_transactions 
ADD COLUMN IF NOT EXISTS receipt_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS invoice_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS attachment_type TEXT DEFAULT 'RECEIPT';

-- 2. Update create_financial_transaction RPC
CREATE OR REPLACE FUNCTION public.create_financial_transaction(
    p_store_id TEXT,
    p_description TEXT,
    p_tx_type TEXT DEFAULT 'income',
    p_amount_idr NUMERIC DEFAULT 0,
    p_category TEXT DEFAULT 'General',
    p_payment_method TEXT DEFAULT 'Transfer Bank',
    p_receipt_url TEXT DEFAULT NULL,
    p_invoice_url TEXT DEFAULT NULL,
    p_attachment_type TEXT DEFAULT 'RECEIPT'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tx_id UUID;
    v_result JSONB;
BEGIN
    INSERT INTO public.umkm_financial_transactions (
        store_id, description, tx_type, amount_idr, category, payment_method, 
        tx_date, receipt_url, invoice_url, attachment_type
    ) VALUES (
        p_store_id, p_description, p_tx_type, ABS(p_amount_idr), p_category, p_payment_method, 
        TO_CHAR(NOW(), 'DD Mon'), p_receipt_url, p_invoice_url, p_attachment_type
    ) RETURNING id INTO v_tx_id;

    -- Recalculate financial intelligence
    PERFORM public.recalculate_umkm_ai_finance_intelligence(p_store_id);

    SELECT jsonb_build_object(
        'status', 'success',
        'transaction_id', v_tx_id,
        'message', 'Transaksi keuangan beserta bukti invoice/receipt berhasil dicatat ke Supabase!'
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 3. Bulk Create Financial Transactions RPC
CREATE OR REPLACE FUNCTION public.bulk_create_financial_transactions(
    p_store_id TEXT,
    p_transactions JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tx JSONB;
    v_inserted_count INT := 0;
    v_result JSONB;
BEGIN
    FOR v_tx IN SELECT * FROM jsonb_array_elements(p_transactions)
    LOOP
        INSERT INTO public.umkm_financial_transactions (
            store_id, description, tx_type, amount_idr, category, payment_method,
            tx_date, receipt_url, invoice_url, attachment_type
        ) VALUES (
            p_store_id,
            COALESCE(v_tx->>'description', 'Bulk Imported Transaction'),
            COALESCE(v_tx->>'tx_type', 'income'),
            ABS(COALESCE((v_tx->>'amount_idr')::NUMERIC, 0)),
            COALESCE(v_tx->>'category', 'General'),
            COALESCE(v_tx->>'payment_method', 'Transfer Bank'),
            COALESCE(v_tx->>'tx_date', TO_CHAR(NOW(), 'DD Mon')),
            v_tx->>'receipt_url',
            v_tx->>'invoice_url',
            COALESCE(v_tx->>'attachment_type', 'RECEIPT')
        );
        v_inserted_count := v_inserted_count + 1;
    END LOOP;

    -- Recalculate financial intelligence
    PERFORM public.recalculate_umkm_ai_finance_intelligence(p_store_id);

    SELECT jsonb_build_object(
        'status', 'success',
        'inserted_count', v_inserted_count,
        'message', CONCAT('Berhasil mengimpor & mencatat ', v_inserted_count, ' transaksi invoice & receipt secara bulk!')
    ) INTO v_result;

    RETURN v_result;
END;
$$;

COMMIT;
