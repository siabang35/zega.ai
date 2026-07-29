import React, { useState } from 'react';
import { 
  Activity, ArrowRight, Bot, ChevronLeft, ChevronRight, Maximize2, 
  MoreVertical, Plus, SlidersHorizontal, Sparkles, Send
} from 'lucide-react';

export function MissionControlView() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'user',
      text: `Why did our sales drop in Europe last month?\n\nPlease analyze our revenue, conversion rates, CRM pipeline, customer feedback, marketing performance, and competitor activity.`
    },
    {
      type: 'agent',
      text: `I'm on it!\n\nI've assigned this objective to 6 specialized AI agents. They're analyzing revenue data, market trends, CRM activity, customer feedback, and competitors.`
    },
    {
      type: 'agent',
      text: `I'll connect the findings and surface the key drivers, insights, and recommended actions.`
    }
  ]);

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setMessages(prev => [
      ...prev,
      { type: 'user', text: prompt },
      { type: 'agent', text: `Analyzing objective: "${prompt}". Assigning worker nodes and dispatching telemetry logs...` }
    ]);
    setPrompt('');
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100 font-sans select-none">
      
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TOP AGENT SWARM CANVAS (HERO SECTION)                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0f111a] p-6 relative overflow-hidden shadow-2xl backdrop-blur-2xl">
        
        {/* Ambient Dark Mesh Radial Background */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
          <div className="h-[400px] w-[700px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.15)_0%,rgba(238,86,56,0.12)_40%,transparent_75%)] blur-3xl" />
        </div>

        {/* Top Header Controls */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">
              EU Sales Decline
            </h2>
            <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-0.5 text-[10.5px] font-bold text-rose-300 uppercase tracking-wider">
              High Priority
            </span>
            <span className="text-xs font-mono text-slate-500 ml-2">
              Mission ID: INV-2026-05-24-001
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="size-8 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer">
              <Activity size={14} />
            </button>
            <button className="size-8 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer">
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* 6-AGENT NETWORK GRAPH SECTION */}
        <div className="relative z-10 my-8 py-2 min-h-[320px] flex items-center justify-center">
          
          {/* SVG Connector Lines Layer with Data Badges */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-40 stroke-slate-600" strokeWidth="1.5" strokeDasharray="3 3">
            {/* Left Top -> Center */}
            <path d="M 280 45 Q 400 45 450 150" fill="none" />
            {/* Left Middle -> Center */}
            <path d="M 280 150 L 450 150" fill="none" />
            {/* Left Bottom -> Center */}
            <path d="M 280 255 Q 400 255 450 150" fill="none" />
            
            {/* Right Top -> Center */}
            <path d="M 720 45 Q 600 45 550 150" fill="none" />
            {/* Right Middle -> Center */}
            <path d="M 720 150 L 550 150" fill="none" />
            {/* Right Bottom -> Center */}
            <path d="M 720 255 Q 600 255 550 150" fill="none" />
          </svg>

          {/* Symmetrical 3-Column Layout */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            
            {/* LEFT COLUMN: 3 AGENTS */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Research Agent */}
              <div className="rounded-xl border border-slate-800 bg-[#141724]/90 p-3.5 backdrop-blur-md shadow-lg relative group hover:border-emerald-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      ⚡
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Research Agent</div>
                      <div className="text-[10.5px] text-slate-400">Market & Industry research</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">16 Tasks</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">60%</span>
                </div>
              </div>

              {/* Sales Agent */}
              <div className="rounded-xl border border-slate-800 bg-[#141724]/90 p-3.5 backdrop-blur-md shadow-lg relative group hover:border-sky-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-xs">
                      SF
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Sales Agent</div>
                      <div className="text-[10.5px] text-slate-400">CRM & Pipeline</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">9 Tasks</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: '45%' }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-sky-400">45%</span>
                </div>
              </div>

              {/* Feedback Agent */}
              <div className="rounded-xl border border-slate-800 bg-[#141724]/90 p-3.5 backdrop-blur-md shadow-lg relative group hover:border-lime-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-lime-500/20 border border-lime-500/40 flex items-center justify-center text-lime-400 font-bold text-xs">
                      💬
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Feedback Agent</div>
                      <div className="text-[10.5px] text-slate-400">Customer Support AI</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">32 Tasks</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-lime-500 rounded-full" style={{ width: '58%' }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-lime-400">58%</span>
                </div>
              </div>

            </div>

            {/* CENTER COLUMN: MAIN OBJECTIVE QUESTION */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center px-2 py-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight max-w-sm">
                Why did our<br />sales drop in Europe<br />last month?
              </h1>
            </div>

            {/* RIGHT COLUMN: 3 AGENTS */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Data Analysis Agent */}
              <div className="rounded-xl border border-slate-800 bg-[#141724]/90 p-3.5 backdrop-blur-md shadow-lg relative group hover:border-amber-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                      Ai
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Data Analysis Agent</div>
                      <div className="text-[10.5px] text-slate-400">Data & Analysis</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">12 Tasks</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '67%' }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-400">67%</span>
                </div>
              </div>

              {/* Market Intelligence */}
              <div className="rounded-xl border border-slate-800 bg-[#141724]/90 p-3.5 backdrop-blur-md shadow-lg relative group hover:border-indigo-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-xs">
                      ✦
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Market Intelligence</div>
                      <div className="text-[10.5px] text-slate-400">Competitive Analysis</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">15 Tasks</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '81%' }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400">81%</span>
                </div>
              </div>

              {/* Operations Agent */}
              <div className="rounded-xl border border-slate-800 bg-[#141724]/90 p-3.5 backdrop-blur-md shadow-lg relative group hover:border-rose-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold text-xs">
                      Ui
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Operations Agent</div>
                      <div className="text-[10.5px] text-slate-400">Process & Automation</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">21 Tasks</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '75%' }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-rose-400">75%</span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* BOTTOM METRICS BAR */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/60">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            <span>6 agents collaborating in real-time</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">24</span>
              <span className="text-xs text-slate-400">Insights Found</span>
            </div>
            <div className="h-5 w-px bg-slate-800" />
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">68%</span>
              <span className="text-xs text-slate-400">Mission Progress</span>
            </div>
          </div>

          <button className="size-8 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer">
            <Maximize2 size={14} />
          </button>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* BOTTOM 3-COLUMN LAYOUT: LIVE ACTIVITY | KEY INSIGHTS | MISSION CONSOLE */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMN 1: LIVE ACTIVITY (3 Cols) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800/80 bg-[#0f111a] p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Live Activity
              </h3>
              <MoreVertical size={14} className="text-slate-400 cursor-pointer" />
            </div>

            <div className="mt-4 space-y-3">
              {[
                {
                  model: 'GPT-5.5',
                  time: '2 min ago',
                  title: 'Research Agent',
                  desc: 'Analyzing EU market data',
                  icon: '⚡',
                  bg: 'bg-emerald-500/20 text-emerald-400'
                },
                {
                  model: 'Claude Opus 4.6',
                  time: '3 min ago',
                  title: 'Data Analysis Agent',
                  desc: 'Comparing conversion by country',
                  icon: 'Ai',
                  bg: 'bg-amber-500/20 text-amber-400'
                },
                {
                  model: 'Intercom Fin',
                  time: '3 min ago',
                  title: 'Customer Feedback',
                  desc: 'Analyzing 2,418 conversations',
                  icon: '💬',
                  bg: 'bg-lime-500/20 text-lime-400'
                },
                {
                  model: 'Gemini 3.5 Pro',
                  time: '3 min ago',
                  title: 'Sales Agent',
                  desc: 'Auditing EU pipeline stage dropoffs',
                  icon: 'SF',
                  bg: 'bg-sky-500/20 text-sky-400'
                },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-800/60 bg-[#141724]/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Powered by {item.model}</span>
                    <span>• {item.time}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className={`size-6 rounded-md ${item.bg} flex items-center justify-center font-bold text-[10px] shrink-0`}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{item.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2: KEY INSIGHTS (5 Cols) — LIGHT CREAM CONTRAST CARDS */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800/80 bg-[#0f111a] p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Key Insights
              </h3>
              <div className="flex items-center gap-1 ml-2">
                <button className="size-5 rounded border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
                  <ChevronLeft size={12} />
                </button>
                <button className="size-5 rounded border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
            <button className="text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800/80 px-2.5 py-1 rounded-md cursor-pointer">
              View All <span className="font-bold text-white ml-0.5">24</span>
            </button>
          </div>

          {/* DUAL INSIGHT CARDS (CREAM BACKGROUND EXACT MATCH) */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* CARD 1: REVENUE VS LAST MONTH */}
            <div className="rounded-xl bg-[#e6eac8] text-slate-900 p-4 flex flex-col justify-between shadow-md">
              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  Revenue vs last month
                </h4>
                <p className="text-[10.5px] text-slate-700 mt-1.5 leading-relaxed font-normal">
                  Revenue decline is concentrated in Germany and France, which accounts for the largest share of the drop.
                </p>

                {/* Country Bars */}
                <div className="mt-4 space-y-2">
                  {[
                    { country: 'Germany', val: '-24%', width: '85%' },
                    { country: 'France', val: '-15%', width: '65%' },
                    { country: 'Spain', val: '-9%', width: '45%' },
                    { country: 'Italy', val: '-6%', width: '30%' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-800">{row.country}</span>
                      <span className="font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded text-[10px]">
                        {row.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-400/40 flex items-end justify-between">
                <div>
                  <div className="text-3xl font-black font-mono tracking-tight text-slate-900">-18%</div>
                  <div className="flex items-center gap-1.5 text-[9.5px] font-semibold text-slate-700 mt-1">
                    <span>Pricing Pressure ↑</span>
                    <span>•</span>
                    <span>Lower Conversion ↓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: NEGATIVE SENTIMENT IN EU */}
            <div className="rounded-xl bg-[#e6eac8] text-slate-900 p-4 flex flex-col justify-between shadow-md">
              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  Negative Sentiment in EU
                </h4>
                <p className="text-[10.5px] text-slate-700 mt-1.5 leading-relaxed font-normal">
                  Negative sentiment is concentrated around pricing and product-related issues, especially across EU accounts.
                </p>

                {/* Sentiment Factor Pills */}
                <div className="mt-4 space-y-2 text-[10.5px]">
                  <div className="p-1.5 rounded-md bg-slate-900/10 flex items-center justify-between font-medium">
                    <span>Pricing</span>
                    <span className="font-mono font-bold text-slate-900 bg-white/80 px-1.5 py-0.5 rounded">+18%</span>
                  </div>
                  <div className="p-1.5 rounded-md bg-slate-900/10 flex items-center justify-between font-medium">
                    <span>Product issues</span>
                    <span className="font-mono font-bold text-slate-900 bg-white/80 px-1.5 py-0.5 rounded">+11%</span>
                  </div>
                  <div className="p-1.5 rounded-md bg-slate-900/10 flex items-center justify-between font-medium">
                    <span>Competitors</span>
                    <span className="font-mono font-bold text-slate-900 bg-white/80 px-1.5 py-0.5 rounded">+8%</span>
                  </div>
                  <div className="p-1.5 rounded-md bg-slate-900/10 flex items-center justify-between font-medium">
                    <span>Support delays</span>
                    <span className="font-mono font-bold text-slate-900 bg-white/80 px-1.5 py-0.5 rounded">+3%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-400/40 flex items-end justify-between">
                <div>
                  <div className="text-3xl font-black font-mono tracking-tight text-slate-900">+12%</div>
                  <div className="flex items-center gap-1.5 text-[9.5px] font-semibold text-slate-700 mt-1">
                    <span>Value Perception ↓</span>
                    <span>•</span>
                    <span>Pricing Pressure ↑</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* COLUMN 3: MISSION CONSOLE (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800/80 bg-[#0f111a] p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Mission Console
              </h3>
              <MoreVertical size={14} className="text-slate-400 cursor-pointer" />
            </div>

            {/* Chat Thread */}
            <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    m.type === 'user'
                      ? 'border-slate-700/60 bg-[#1c2033] text-slate-100'
                      : 'border-slate-800 bg-[#131524] text-slate-300'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Console Input Bar */}
          <form onSubmit={handleSendPrompt} className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Anything..."
                className="w-full rounded-xl border border-slate-800 bg-[#131524] pl-3.5 pr-16 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#e05638]"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  className="size-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                >
                  <Plus size={13} />
                </button>
                <button
                  type="submit"
                  className="size-6 rounded-md bg-[#e05638] flex items-center justify-center text-white hover:bg-[#c8462b] cursor-pointer"
                >
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
