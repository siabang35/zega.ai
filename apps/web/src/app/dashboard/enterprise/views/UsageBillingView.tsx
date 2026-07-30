import React, { useState } from 'react';
import { 
  CreditCard, Sparkles, Download, ArrowUpRight, ArrowDownRight, 
  ChevronDown, CheckCircle2, AlertCircle, Plus, Edit3, Building, Mail, MapPin, Eye, FileText
} from 'lucide-react';

interface UsageBillingViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function UsageBillingView({ onTriggerToast }: UsageBillingViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'methods' | 'history' | 'limits'>('overview');

  const invoices = [
    { id: 'INV-2025-00056', period: 'May 1 - May 31, 2025', status: 'Unpaid', amount: '$28,430.50', due: 'May 28, 2025', paid: '-' },
    { id: 'INV-2025-00055', period: 'Apr 1 - Apr 30, 2025', status: 'Paid', amount: '$24,892.10', due: 'Apr 28, 2025', paid: 'Apr 25, 2025' },
    { id: 'INV-2025-00054', period: 'Mar 1 - Mar 31, 2025', status: 'Paid', amount: '$21,345.80', due: 'Mar 28, 2025', paid: 'Mar 25, 2025' },
    { id: 'INV-2025-00053', period: 'Feb 1 - Feb 28, 2025', status: 'Paid', amount: '$18,892.30', due: 'Feb 28, 2025', paid: 'Feb 25, 2025' },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="text-indigo-600 dark:text-indigo-400 size-6" />
            Payments & Bills
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your subscription, payment methods and billing history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Current Plan Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="text-[10px] text-slate-400 font-mono">Current Plan</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">Enterprise Scale</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>

          {/* Upgrade Plan Action */}
          <button 
            onClick={() => onTriggerToast?.('Upgrade Plan Modal dibuka')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
          >
            <Sparkles size={14} />
            <span>Upgrade Plan</span>
          </button>
        </div>
      </div>

      {/* TOP 5 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Current Balance */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Current Balance</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">$0.00</span>
          </div>
          <span className="text-[9.5px] text-emerald-600 font-semibold block">No outstanding balance</span>
        </div>

        {/* Card 2: Monthly Spend (May) */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Monthly Spend (May)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">$28,430.50</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +14.3%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs Apr</span>
        </div>

        {/* Card 3: Yearly Spend (2025) */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Yearly Spend (2025)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">$246,742.20</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +18.7%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs 2024</span>
        </div>

        {/* Card 4: Next Invoice */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Next Invoice</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">May 28, 2025</span>
          </div>
          <span className="text-[9.5px] text-amber-600 font-semibold block">Due in 5 days</span>
        </div>

        {/* Card 5: Payment Method */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Payment Method</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Visa **** 4242</span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">Expires 08/28</span>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'invoices', label: 'Invoices' },
          { id: 'methods', label: 'Payment Methods' },
          { id: 'history', label: 'Billing History' },
          { id: 'limits', label: 'Usage & Limits' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MIDDLE SECTION (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Col 1: Usage vs Plan Limits */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Usage vs Plan Limits
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">May 1 – May 31, 2025</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Item 1 */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">AI Requests</span>
                <span className="font-mono text-slate-400">12.7M <span className="text-slate-500 font-bold">/ 50M</span></span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full w-[25%]" />
              </div>
            </div>

            {/* Item 2 */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Workflow Executions</span>
                <span className="font-mono text-slate-400">634K <span className="text-slate-500 font-bold">/ 2M</span></span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-[31%]" />
              </div>
            </div>

            {/* Item 3 */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Active AI Agents</span>
                <span className="font-mono text-slate-400">128 <span className="text-slate-500 font-bold">/ 250</span></span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full w-[51%]" />
              </div>
            </div>

            {/* Item 4 */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Storage</span>
                <span className="font-mono text-slate-400">2.34 TB <span className="text-slate-500 font-bold">/ 5 TB</span></span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[46%]" />
              </div>
            </div>

            {/* Item 5 */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Vector Storage</span>
                <span className="font-mono text-slate-400">1.52 TB <span className="text-slate-500 font-bold">/ 3 TB</span></span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-[50%]" />
              </div>
            </div>

            {/* Item 6 */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Data Transfer</span>
                <span className="font-mono text-slate-400">3.45 TB <span className="text-slate-500 font-bold">/ 10 TB</span></span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full w-[34%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Col 2: Spending Breakdown Donut Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Spending Breakdown (May 2025)
          </h3>

          <div className="flex items-center justify-center py-2 relative">
            <svg className="size-28 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3.8" className="dark:stroke-slate-800" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366F1" strokeWidth="3.8" strokeDasharray="43.7, 100" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3B82F6" strokeWidth="3.8" strokeDasharray="21.8, 100" strokeDashoffset="-43.7" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#8B5CF6" strokeWidth="3.8" strokeDasharray="15.2, 100" strokeDashoffset="-65.5" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="3.8" strokeDasharray="7.4, 100" strokeDashoffset="-80.7" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-black text-slate-900 dark:text-slate-100">$28,430.50</span>
              <span className="text-[8px] text-slate-400 font-semibold uppercase">Total Spend</span>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px]"><span className="size-2 rounded-full bg-indigo-500" /> LLM & Inference</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$12,430.20 <span className="text-slate-400 text-[9.5px] font-normal">(43.7%)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px]"><span className="size-2 rounded-full bg-blue-500" /> MCP Calls</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$6,210.10 <span className="text-slate-400 text-[9.5px] font-normal">(21.8%)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px]"><span className="size-2 rounded-full bg-purple-500" /> Storage</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$4,320.60 <span className="text-slate-400 text-[9.5px] font-normal">(15.2%)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px]"><span className="size-2 rounded-full bg-emerald-500" /> Data Transfer</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$2,110.30 <span className="text-slate-400 text-[9.5px] font-normal">(7.4%)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px]"><span className="size-2 rounded-full bg-amber-500" /> Other Services</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$3,359.30 <span className="text-slate-400 text-[9.5px] font-normal">(11.9%)</span></span>
            </div>
          </div>
        </div>

        {/* Col 3: Top Cost Drivers */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Top Cost Drivers
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">GPT-4o (OpenAI)</p>
                <p className="text-[10px] text-slate-400 font-mono">5.2M requests</p>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$9,432.10</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Claude 3.5</p>
                <p className="text-[10px] text-slate-400 font-mono">4.2M requests</p>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$3,210.80</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Vector Search</p>
                <p className="text-[10px] text-slate-400 font-mono">15.2M queries</p>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$4,120.50</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Supabase DB</p>
                <p className="text-[10px] text-slate-400 font-mono">2.34 TB storage</p>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$3,230.90</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Stripe MCP</p>
                <p className="text-[10px] text-slate-400 font-mono">1.8M calls</p>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$2,110.30</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION (2 Columns: Left 2/3 Recent Invoices, Right 1/3 Payment Methods) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2/3 width): Recent Invoices */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Recent Invoices
            </h3>
            <button className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              View all invoices
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2 px-3">Invoice ID</th>
                  <th className="py-2 px-3">Period</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3">Due Date</th>
                  <th className="py-2 px-3">Paid Date</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {invoices.map((inv, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {inv.id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {inv.period}
                    </td>
                    <td className="py-2.5 px-3">
                      {inv.status === 'Paid' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-[9.5px]">
                          <CheckCircle2 size={10} /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-[9.5px]">
                          <AlertCircle size={10} /> Unpaid
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {inv.amount}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                      {inv.due}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                      {inv.paid}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button 
                        onClick={() => onTriggerToast?.(`Mengunduh ${inv.id}`)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {inv.status === 'Unpaid' ? 'View' : 'Download'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1/3 width): Payment Methods & Billing Details */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
              Payment Methods
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/30">
                <div className="flex items-center gap-2">
                  <span className="font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px]">VISA</span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Visa **** 4242</p>
                    <p className="text-[9.5px] text-slate-400">Expires 08/28</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">Primary</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <span className="font-bold px-1.5 py-0.5 rounded bg-orange-600 text-white text-[9px]">MC</span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Mastercard **** 8888</p>
                    <p className="text-[9.5px] text-slate-400">Expires 11/27</p>
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">Exp 11/27</span>
              </div>
            </div>

            <button 
              onClick={() => onTriggerToast?.('Tambah Metode Pembayaran')}
              className="w-full py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus size={14} />
              <span>Add Payment Method</span>
            </button>
          </div>

          {/* Billing Details */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-wider">Billing Details</span>
              <button className="text-slate-400 hover:text-indigo-600"><Edit3 size={12} /></button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 space-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
              <p className="font-bold text-slate-900 dark:text-slate-100">PT Zenith Enterprise</p>
              <p>NPWP: 12.345.678.9-012.000</p>
              <p>billing@zenith.co.id</p>
              <p>Jl. Sudirman No. 123</p>
              <p>Jakarta, Indonesia 10220</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
