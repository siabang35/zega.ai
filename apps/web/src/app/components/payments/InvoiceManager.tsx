'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, Copy, Check, Clock, CheckCircle2, AlertCircle, RefreshCw, Plus, DollarSign } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: string;
  asset: string;
  recipient_address: string;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  description?: string;
  expires_at: string;
  paid_amount: string;
  created_at: string;
}

interface InvoiceManagerProps {
  userId: string;
  walletAddress: string;
  apiBaseUrl?: string;
}

export function InvoiceManager({ userId, walletAddress, apiBaseUrl = 'http://localhost:3001' }: InvoiceManagerProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form states
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState<'SOL' | 'USDC'>('SOL');
  const [description, setDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [userId]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/invoices/user/list`, {
        headers: { 'x-user-id': userId },
      });
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    setCreating(true);
    setMessage(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          amount,
          asset,
          description,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Invoice ${data.invoice.invoice_number} created!` });
        setSelectedInvoice(data.invoice);
        setShowCreateModal(false);
        setAmount('');
        setDescription('');
        fetchInvoices();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create invoice' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error creating invoice' });
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'PAID':
        return <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-medium"><CheckCircle2 className="w-3 h-3" /> Paid</span>;
      case 'PARTIALLY_PAID':
        return <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-medium"><Clock className="w-3 h-3" /> Partial</span>;
      case 'EXPIRED':
        return <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full text-xs font-medium"><AlertCircle className="w-3 h-3" /> Expired</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full text-xs font-medium"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            ZEGA Invoices & Payment Requests
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Receive SOL & USDC payments directly into your Privy-managed wallet.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition border border-slate-700 text-slate-300"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Create Invoice
          </button>
        </div>
      </div>

      {/* Global Alert Message */}
      {message && (
        <div className={`p-4 mb-6 rounded-xl border flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
        }`}>
          <span className="text-sm font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Invoice List */}
      <div className="space-y-3">
        {invoices.length === 0 && !loading ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
            <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No Invoices Created Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Create an invoice to request payments. Payment status is automatically verified on Solana.
            </p>
          </div>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              onClick={() => setSelectedInvoice(inv)}
              className="flex items-center justify-between p-4 bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800 rounded-xl transition cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-200">{inv.invoice_number}</span>
                  {getStatusBadge(inv.status)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {inv.description || 'Payment Invoice'} • Created {new Date(inv.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className="font-bold text-base text-slate-100">
                  {inv.amount} <span className="text-xs text-emerald-400">{inv.asset}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Paid: {inv.paid_amount || '0'} {inv.asset}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100">Create Receiving Invoice</h3>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Asset</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAsset('SOL')}
                    className={`py-2 rounded-xl text-sm font-semibold border transition ${
                      asset === 'SOL' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    SOL
                  </button>
                  <button
                    type="button"
                    onClick={() => setAsset('USDC')}
                    className={`py-2 rounded-xl text-sm font-semibold border transition ${
                      asset === 'USDC' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    USDC
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Amount ({asset})</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. AI Agent Subscription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Recipient Address (Server-Bound)</label>
                <input
                  type="text"
                  disabled
                  value={walletAddress}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="font-mono text-xs text-slate-400">{selectedInvoice.invoice_number}</span>
                <h3 className="text-lg font-bold text-slate-100 mt-0.5">{selectedInvoice.amount} {selectedInvoice.asset}</h3>
              </div>
              {getStatusBadge(selectedInvoice.status)}
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Deposit Address (Privy Wallet):</span>
                <div className="flex items-center justify-between font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="truncate mr-2 text-slate-200">{selectedInvoice.recipient_address}</span>
                  <button
                    onClick={() => copyToClipboard(selectedInvoice.recipient_address)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 transition"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div>Paid Amount: <span className="text-slate-200 font-semibold">{selectedInvoice.paid_amount} {selectedInvoice.asset}</span></div>
                <div>Expires: <span className="text-slate-200">{new Date(selectedInvoice.expires_at).toLocaleTimeString()}</span></div>
              </div>
            </div>

            <button
              onClick={() => setSelectedInvoice(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
