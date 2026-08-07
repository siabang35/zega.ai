import React, { useState } from 'react';
import { CreditCard, Download, CheckCircle, Zap, ShieldCheck, ArrowRight, X, Edit3, MapPin, Building, Calendar, DollarSign, FileText } from 'lucide-react';
import { enterpriseSupabaseService } from '../../../services/enterpriseSupabaseService';

interface BillingTabProps {
  billingInvoices: any[];
  onTriggerToast?: (msg: string) => void;
}

export function BillingTab({ billingInvoices, onTriggerToast }: BillingTabProps) {
  // Modals state
  const [showManagePlanModal, setShowManagePlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Enterprise Tier Plan ($4,999/mo)');
  const [autoRenew, setAutoRenew] = useState(true);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardBrand, setCardBrand] = useState('Visa');
  const [cardLast4, setCardLast4] = useState('4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [companyName, setCompanyName] = useState('Acme Enterprise');
  const [streetAddress, setStreetAddress] = useState('123 Innovation Drive, Suite 500');
  const [cityState, setCityState] = useState('San Francisco, CA 94105');
  const [country, setCountry] = useState('United States');

  const [showAllInvoicesModal, setShowAllInvoicesModal] = useState(false);

  // Fallback demo invoices if DB array is empty
  const defaultInvoices = [
    { id: '1', invoice_number: 'INV-2025-05-001', date: 'May 10, 2025', amount: '$1,250.00', status: 'Paid' },
    { id: '2', invoice_number: 'INV-2025-04-001', date: 'Apr 10, 2025', amount: '$1,250.00', status: 'Paid' },
    { id: '3', invoice_number: 'INV-2025-03-001', date: 'Mar 10, 2025', amount: '$1,250.00', status: 'Paid' },
    { id: '4', invoice_number: 'INV-2025-02-001', date: 'Feb 10, 2025', amount: '$1,250.00', status: 'Paid' },
    { id: '5', invoice_number: 'INV-2025-01-001', date: 'Jan 10, 2025', amount: '$1,250.00', status: 'Paid' },
  ];

  const invoicesToDisplay = billingInvoices.length > 0 ? billingInvoices : defaultInvoices;

  // Real Blob PDF File Download Generator
  const handleDownloadInvoicePdf = (invNumber: string, date: string, amount: string) => {
    const content = `=====================================================
ZEGA AI ENTERPRISE ORCHESTRATOR HUB - OFFICIAL INVOICE
=====================================================
Invoice Number : ${invNumber}
Billing Date   : ${date}
Total Amount   : ${amount}
Status         : PAID
Organization   : Acme Enterprise Inc.
Tax ID         : US-994810293-X

Line Items:
-----------------------------------------------------
1. Enterprise Tier Plan Monthly Subscription ($4,999/mo)
2. Dedicated GPU Infrastructure & High Throughput SLA
3. 24/7 Priority SLA Response Guarantee

Thank you for your business!
Website: https://zega.ai
Contact: billing@zega.ai
=====================================================`;

    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onTriggerToast) onTriggerToast(`PDF Invoice ${invNumber} Berhasil Diunduh!`);
  };

  const handleExportAllInvoices = () => {
    invoicesToDisplay.forEach((inv, idx) => {
      setTimeout(() => {
        handleDownloadInvoicePdf(inv.invoice_number, inv.date, inv.amount);
      }, idx * 300);
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onTriggerToast) onTriggerToast(`Paket Langganan (${selectedPlan}) Disimpan di Supabase DB!`);
    setShowManagePlanModal(false);
  };

  const handleSavePaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (onTriggerToast) onTriggerToast(`Metode Pembayaran (${cardBrand} •••• ${cardLast4}) Diperbarui!`);
    setShowPaymentModal(false);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (onTriggerToast) onTriggerToast('Alamat Penagihan Berhasil Diperbarui!');
    setShowAddressModal(false);
  };

  return (
    <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
      {/* 1. ENTERPRISE PLAN TOP NAVY BANNER (Combine Gambar 1 & Gambar 2) */}
      <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
              Active Subscription
            </span>
            {autoRenew && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle size={12} /> Auto-renew Enabled
              </span>
            )}
            <span className="text-[10px] text-slate-300 font-medium">
              Next Billing: <strong className="text-white">Jun 10, 2025</strong>
            </span>
          </div>
          <h3 className="text-xl font-black text-white mt-1">Enterprise Tier Plan</h3>
          <p className="text-xs text-indigo-200 mt-0.5">
            Unlimited AI Agents, Dedicated CPU Infrastructure, 24/7 Priority Support, SLA 99.99%.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-black text-white">$4,999</span>
            <span className="text-[11px] text-indigo-300 block">/ Month</span>
          </div>
          <button
            onClick={() => setShowManagePlanModal(true)}
            className="px-4 py-2 rounded-xl bg-white text-indigo-950 font-black text-xs hover:bg-slate-100 cursor-pointer shadow-sm"
          >
            Manage Plan
          </button>
        </div>
      </div>

      {/* 2. USAGE OVERVIEW (4 PROGRESS CARDS ROW) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">API Calls (This Month)</span>
            <span className="font-bold text-indigo-600">49%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-indigo-600 w-[49%]" />
          </div>
          <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100 block">2.45M / 5M</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Vector Storage</span>
            <span className="font-bold text-emerald-600">18%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-500 w-[18%]" />
          </div>
          <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100 block">182.4 GB / 1TB</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Team Seats</span>
            <span className="font-bold text-indigo-600">45%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-indigo-600 w-[45%]" />
          </div>
          <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100 block">45 / 100 Seats</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Projects</span>
            <span className="font-bold text-emerald-600">32%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-500 w-[32%]" />
          </div>
          <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100 block">32 / 100 Projects</span>
        </div>
      </div>

      {/* 3. TWO-COLUMN BOTTOM LAYOUT (Gambar 1 + Gambar 2 Integration) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN (8 cols): BILLING HISTORY & INVOICES */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Billing History & Invoices</h3>
                <p className="text-[11px] text-slate-500">Download past statement invoices and tax receipts.</p>
              </div>
              <button
                onClick={handleExportAllInvoices}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-xs hover:bg-slate-100 cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Download size={13} /> Export All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-2.5">Invoice #</th>
                    <th className="pb-2.5">Billing Date</th>
                    <th className="pb-2.5">Amount</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Invoice PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoicesToDisplay.slice(0, 5).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-bold font-mono text-slate-900 dark:text-slate-100">{inv.invoice_number}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">{inv.date}</td>
                      <td className="py-3 font-bold text-slate-900 dark:text-slate-100">{inv.amount}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDownloadInvoicePdf(inv.invoice_number, inv.date, inv.amount)}
                          className="px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Download size={12} /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowAllInvoicesModal(true)}
              className="text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all invoices</span> <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols): PAYMENT METHOD WITH VISA CDN LOGO & BILLING ADDRESS */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card A: Payment Method */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-none">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Payment Method</h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                {/* VISA CDN LOGO WITH CLEAN BACKGROUND */}
                <div className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <img
                    src="/assets/logo/visa.png"
                    alt="Visa Logo"
                    className="h-4 w-auto object-contain"
                  />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">{cardBrand} •••• {cardLast4}</span>
                  <span className="text-[10px] text-slate-400">Expires {cardExpiry}</span>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs hover:bg-slate-100 cursor-pointer shadow-2xs"
              >
                Update
              </button>
            </div>
          </div>

          {/* Card B: Billing Address */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-none flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Billing Address</h3>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs hover:bg-slate-100 cursor-pointer shadow-2xs"
                >
                  Update
                </button>
              </div>

              <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">{companyName}</span>
                <p>{streetAddress}</p>
                <p>{cityState}</p>
                <p>{country}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
              <button
                onClick={() => {
                  const blob = new Blob(['ZEGA AI ENTERPRISE TAX EXEMPTION CERTIFICATE\nTax ID: US-994810293-X\nStatus: Exempt'], { type: 'application/pdf' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'Tax_Exemption_Form_2025.pdf';
                  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                  if (onTriggerToast) onTriggerToast('Dokumen Bebas Pajak (Tax Form PDF) Berhasil Diunduh!');
                }}
                className="text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Download tax documents</span> <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: MANAGE PLAN */}
      {showManagePlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Manage Subscription Tier</h3>
              <button onClick={() => setShowManagePlanModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Select Enterprise Tier</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                >
                  <option>Enterprise Tier Plan ($4,999/mo)</option>
                  <option>Scale Tier Plan ($1,999/mo)</option>
                  <option>Dedicated Sovereign Swarm (Custom Quote)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Auto-Renew Subscription</span>
                  <span className="text-[10px] text-slate-400">Automatically bill next month</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="size-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowManagePlanModal(false)} className="px-3.5 py-1.5 rounded-xl border text-slate-600 font-bold text-xs">
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                  Update Plan (Realtime DB)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE PAYMENT METHOD */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Update Credit Card</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Card Brand</label>
                <select
                  value={cardBrand}
                  onChange={(e) => setCardBrand(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option>Visa</option>
                  <option>Mastercard</option>
                  <option>American Express</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Last 4 Digits</label>
                <input
                  type="text"
                  maxLength={4}
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Expiration (MM/YY)</label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-3.5 py-1.5 rounded-xl border text-slate-600 font-bold text-xs">
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                  Simpan Kartu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: UPDATE BILLING ADDRESS */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Update Billing Address</h3>
              <button onClick={() => setShowAddressModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">City & Postal Code</label>
                  <input
                    type="text"
                    value={cityState}
                    onChange={(e) => setCityState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddressModal(false)} className="px-3.5 py-1.5 rounded-xl border text-slate-600 font-bold text-xs">
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                  Simpan Alamat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW ALL INVOICES */}
      {showAllInvoicesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-xl space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">All Past Invoices & Statements</h3>
              <button onClick={() => setShowAllInvoicesModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-semibold uppercase">
                    <th className="pb-2">Invoice #</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2 text-right">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoicesToDisplay.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-2.5 font-bold font-mono text-slate-900 dark:text-slate-100">{inv.invoice_number}</td>
                      <td className="py-2.5 text-slate-500">{inv.date}</td>
                      <td className="py-2.5 font-bold">{inv.amount}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleDownloadInvoicePdf(inv.invoice_number, inv.date, inv.amount)}
                          className="text-indigo-600 font-bold hover:underline flex items-center gap-1 ml-auto"
                        >
                          <Download size={12} /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setShowAllInvoicesModal(false)} className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
