export type TelegramLanguage = 'en' | 'id' | 'zh';

export function resolveTelegramLanguage(lang?: string): TelegramLanguage {
  if (!lang) return 'id';
  const clean = String(lang).toLowerCase().trim();
  if (clean === 'en' || clean === 'english') return 'en';
  if (clean === 'zh' || clean === 'cn' || clean === 'chinese') return 'zh';
  return 'id';
}

export interface TelegramInvoiceTranslations {
  invoiceCaption: {
    headerTitle: string;
    headerSubtitle: string;
    customerLabel: string;
    orderDetailsLabel: string;
    amountLabel: string;
    refKeyLabel: string;
    merchantWalletLabel: string;
    owaspChecksumLabel: string;
    r2CdnAuditLabel: string;
    solanaPayUriLabel: string;
    instructionsTitle: string;
    instruction1: string;
    instruction2: string;
    instruction3: string;
    statusPending: string;
    payButtonText: (amount: string) => string;
  };
  receipt: {
    exact: {
      badge: string;
      title: string;
      notice: string;
    };
    underpaid: {
      badge: string;
      title: string;
      instruction: (shortageAmt: string) => string;
    };
    overpaid: {
      badge: string;
      title: string;
      info: (surplusAmt: string) => string;
    };
    labels: {
      targetAmount: string;
      paidAmount: string;
      shortageAmount: string;
      excessAmount: string;
      orderMemo: string;
      refKey: string;
      txHash: string;
      slot: string;
      status: string;
      statusExactVal: string;
      explorerBtn: string;
    };
  };
}

export const TELEGRAM_TRANSLATIONS: Record<TelegramLanguage, TelegramInvoiceTranslations> = {
  en: {
    invoiceCaption: {
      headerTitle: '🧾 <b>ZEGA ENTERPRISE SOLANA INVOICE</b>',
      headerSubtitle: '<i>Zero-Trust Solana Pay Settlement Request</i>',
      customerLabel: 'Customer',
      orderDetailsLabel: 'Order Details',
      amountLabel: 'Invoice Amount',
      refKeyLabel: 'Ref Key',
      merchantWalletLabel: 'Copy Merchant Wallet',
      owaspChecksumLabel: 'OWASP Checksum',
      r2CdnAuditLabel: 'R2 CDN Audit',
      solanaPayUriLabel: 'Solana Pay URI',
      instructionsTitle: '📌 <b>PAYMENT INSTRUCTIONS:</b>',
      instruction1: '1. Scan QR Code: Scan the QR image above via Phantom / Solflare Mobile.',
      instruction2: '2. Copy Wallet / URI: Copy the wallet address or URI above & paste into Phantom App.',
      instruction3: '3. Web Checkout: Tap the button below to pay via Web Checkout.',
      statusPending: '• <b>Status:</b> <code>AWAITING PAYMENT (PENDING)</code>',
      payButtonText: (amount: string) => `⚡ Pay ${amount} USDC (Web Checkout)`,
    },
    receipt: {
      exact: {
        badge: '⚡ <b>SOLANA DEVNET RECONCILED (100% EXACT)</b> ⚡',
        title: '🎉 <b>Payment Complete & Verified!</b>',
        notice: '✅ Thank you! Your order has been confirmed automatically via ZeroClaw On-Chain Settlement.',
      },
      underpaid: {
        badge: '⚠️ <b>SOLANA DEVNET RECONCILED (UNDERPAID)</b> ⚠️',
        title: '⚠️ <b>Payment Underpaid!</b>',
        instruction: (shortageAmt: string) =>
          `📌 <b>INSTRUCTION:</b> Your payment is incomplete. Please pay the remaining <b>${shortageAmt} USDC</b> to the merchant wallet to complete your order.`,
      },
      overpaid: {
        badge: '💡 <b>SOLANA DEVNET RECONCILED (OVERPAID)</b> 💡',
        title: '💡 <b>Payment Overpaid!</b>',
        info: (surplusAmt: string) =>
          `💡 <b>OVERPAYMENT INFO:</b> Your invoice is <b>PAID</b>. An excess payment of <b>+${surplusAmt} USDC</b> has been recorded by the merchant cashier system. You may contact the merchant for a refund or order adjustment.`,
      },
      labels: {
        targetAmount: 'Target Amount',
        paidAmount: 'Received Amount (On-Chain)',
        shortageAmount: 'Shortage Amount',
        excessAmount: 'Excess Amount',
        orderMemo: 'Order / Memo',
        refKey: 'Reference Key',
        txHash: 'Tx Hash',
        slot: 'Devnet Slot',
        status: 'Status',
        statusExactVal: 'PAID (VERIFIED ON-CHAIN)',
        explorerBtn: '🔍 View On Solana Explorer',
      },
    },
  },
  id: {
    invoiceCaption: {
      headerTitle: '🧾 <b>ZEGA ENTERPRISE SOLANA INVOICE</b>',
      headerSubtitle: '<i>Zero-Trust Solana Pay Settlement Request</i>',
      customerLabel: 'Pelanggan',
      orderDetailsLabel: 'Detail Pesanan',
      amountLabel: 'Tagihan',
      refKeyLabel: 'Ref Key',
      merchantWalletLabel: 'Copy Merchant Wallet',
      owaspChecksumLabel: 'OWASP Checksum',
      r2CdnAuditLabel: 'R2 CDN Audit',
      solanaPayUriLabel: 'Solana Pay URI',
      instructionsTitle: '📌 <b>PETUNJUK PEMBAYARAN:</b>',
      instruction1: '1. Scan QR Code: Pindai gambar QR Code di atas via Phantom / Solflare Mobile.',
      instruction2: '2. Copy Wallet / URI: Copy wallet atau URI di atas & paste ke Phantom App.',
      instruction3: '3. Web Checkout: Tap tombol di bawah untuk membayar via Web Checkout.',
      statusPending: '• <b>Status:</b> <code>PENGIRIMAN DANA DITUNGGU (PENDING)</code>',
      payButtonText: (amount: string) => `⚡ Bayar ${amount} USDC (Web Checkout)`,
    },
    receipt: {
      exact: {
        badge: '⚡ <b>SOLANA DEVNET RECONCILED (100% LUNAS)</b> ⚡',
        title: '🎉 <b>Pembayaran Lunas!</b>',
        notice: '✅ Terima kasih! Pesanan Anda telah terkonfirmasi secara otomatis via ZeroClaw On-Chain Settlement.',
      },
      underpaid: {
        badge: '⚠️ <b>SOLANA DEVNET RECONCILED (UNDERPAID)</b> ⚠️',
        title: '⚠️ <b>Pembayaran Belum Lunas (Kurang)!</b>',
        instruction: (shortageAmt: string) =>
          `📌 <b>PETUNJUK:</b> Pembayaran Anda belum lunas. Harap bayar sisa kekurangannya sebesar <b>${shortageAmt} USDC</b> ke wallet merchant agar pesanan dapat diselesaikan.`,
      },
      overpaid: {
        badge: '💡 <b>SOLANA DEVNET RECONCILED (OVERPAID)</b> 💡',
        title: '💡 <b>Pembayaran Lunas (Kelebihan Nominal)!</b>',
        info: (surplusAmt: string) =>
          `💡 <b>INFORMASI KELEBIHAN BAYAR:</b> Tagihan Anda telah <b>LUNAS</b>. Kelebihan pembayaran sebesar <b>+${surplusAmt} USDC</b> telah dicatat oleh sistem kasir merchant. Anda dapat menghubungi merchant untuk refund atau penyesuaian pesanan.`,
      },
      labels: {
        targetAmount: 'Total Tagihan (Target)',
        paidAmount: 'Nominal Masuk (On-Chain)',
        shortageAmount: 'Sisa Kekurangan',
        excessAmount: 'Kelebihan (Excess)',
        orderMemo: 'Order / Memo',
        refKey: 'Reference Key',
        txHash: 'Tx Hash',
        slot: 'Devnet Slot',
        status: 'Status',
        statusExactVal: 'LUNAS (VERIFIED ON-CHAIN)',
        explorerBtn: '🔍 Lihat Real Tx Explorer',
      },
    },
  },
  zh: {
    invoiceCaption: {
      headerTitle: '🧾 <b>ZEGA 企业级 SOLANA 发票</b>',
      headerSubtitle: '<i>零信任 Solana Pay 结算请求</i>',
      customerLabel: '客户',
      orderDetailsLabel: '订单详情',
      amountLabel: '账单金额',
      refKeyLabel: '参考键',
      merchantWalletLabel: '复制商家钱包',
      owaspChecksumLabel: 'OWASP 校验和',
      r2CdnAuditLabel: 'R2 CDN 审计',
      solanaPayUriLabel: 'Solana Pay URI',
      instructionsTitle: '📌 <b>付款说明:</b>',
      instruction1: '1. 扫描二维码: 使用 Phantom / Solflare 移动钱包扫描上方二维码。',
      instruction2: '2. 复制钱包/URI: 复制上方钱包地址或 URI 并粘贴到 Phantom 应用。',
      instruction3: '3. 网页结账: 点击下方按钮通过网页结账进行付款。',
      statusPending: '• <b>状态:</b> <code>等待付款 (PENDING)</code>',
      payButtonText: (amount: string) => `⚡ 支付 ${amount} USDC (网页结账)`,
    },
    receipt: {
      exact: {
        badge: '⚡ <b>SOLANA DEVNET 已对账 (100% 完全匹配)</b> ⚡',
        title: '🎉 <b>付款成功并已确认！</b>',
        notice: '✅ 谢谢！您的订单已通过 ZeroClaw 链上结算自动确认。',
      },
      underpaid: {
        badge: '⚠️ <b>SOLANA DEVNET 已对账 (付款不足)</b> ⚠️',
        title: '⚠️ <b>付款金额不足！</b>',
        instruction: (shortageAmt: string) =>
          `📌 <b>说明:</b> 您的付款未完成。请将剩余的 <b>${shortageAmt} USDC</b> 支付至商家钱包以完成订单。`,
      },
      overpaid: {
        badge: '💡 <b>SOLANA DEVNET 已对账 (收到超额付款)</b> 💡',
        title: '💡 <b>收到超额付款！</b>',
        info: (surplusAmt: string) =>
          `💡 <b>超额付款信息:</b> 您的账单已<b>付清</b>。商家系统已记录超额付款 <b>+${surplusAmt} USDC</b>。您可以联系商家办理退款或调整订单。`,
      },
      labels: {
        targetAmount: '目标账单金额',
        paidAmount: '链上实收金额',
        shortageAmount: '剩余欠款',
        excessAmount: '超额金额',
        orderMemo: '订单 / 备注',
        refKey: '参考键',
        txHash: '交易 Hash',
        slot: 'Devnet 区块槽',
        status: '状态',
        statusExactVal: '已付清 (链上已验证)',
        explorerBtn: '🔍 在 Solana 浏览器中查看',
      },
    },
  },
};

export function getTelegramTranslations(lang?: string): TelegramInvoiceTranslations {
  const resolved = resolveTelegramLanguage(lang);
  return TELEGRAM_TRANSLATIONS[resolved];
}
