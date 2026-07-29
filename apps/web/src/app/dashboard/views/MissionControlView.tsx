import React, { useState } from 'react';
import { 
  Target, Bot, MessageSquare, ArrowUpRight, ArrowDownRight, 
  Send, Sparkles, AlertTriangle, ShieldCheck, Activity
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';

export function MissionControlView() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'USER', text: 'Why did our sales drop in Europe last month?' },
    { sender: 'ZEGA AI COORDINATOR', text: 'I have assigned this objective to 6 specialized AI agents. They are analyzing revenue data, market trends, CRM activity, customer feedback, and competitors.' }
  ]);

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setMessages(prev => [
      ...prev,
      { sender: 'USER', text: prompt },
      { sender: 'ZEGA AI COORDINATOR', text: `Analyzing objective: "${prompt}". Assigning worker nodes and dispatching telemetry logs...` }
    ]);
    setPrompt('');
  };

  // Chart.js data for Revenue vs Last Month
  const revenueChartData = {
    labels: ['W1', 'W2', 'W3', 'W4'],
    datasets: [
      {
        label: 'Germany (-24%)',
        data: [100, 85, 70, 76],
        backgroundColor: '#e05638',
        borderRadius: 4,
      },
      {
        label: 'France (-15%)',
        data: [100, 90, 82, 85],
        backgroundColor: '#F59E0B',
        borderRadius: 4,
      },
    ],
  };

  // Chart.js data for Negative Sentiment
  const sentimentChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sentiment Score',
        data: [12, 15, 22, 28, 35, 42, 40],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100">
      {/* Objective Hero Banner (Design 4) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-[#e05638]/10 border border-[#e05638]/30 px-2.5 py-1 text-[10px] font-mono font-bold text-[#e05638] uppercase">
              HIGH PRIORITY MISSION
            </span>
            <span className="text-xs font-mono text-slate-400">MISSION ID: INV-2026-05-24-001</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500">Collaborating Agents: <strong className="text-slate-900 dark:text-slate-100">6 Active</strong></span>
            <span className="text-slate-500">Insights Found: <strong className="text-slate-900 dark:text-slate-100">24</strong></span>
            <span className="text-slate-500">Mission Progress: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">68%</strong></span>
          </div>
        </div>

        <div className="mt-6 text-center max-w-2xl mx-auto py-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            "Why did our sales drop in Europe last month?"
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Autonomous multi-agent task distribution and cross-model reasoning network
          </p>
        </div>

        {/* 6 Collaborating Agent Progress Cards Grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: 'Research Agent', desc: 'Market & Industry research', tasks: '16 Tasks', progress: 68, color: 'bg-emerald-500' },
            { name: 'Data Analysis Agent', desc: 'Data & Analytics', tasks: '12 Tasks', progress: 67, color: 'bg-amber-500' },
            { name: 'Sales Agent', desc: 'CRM & Pipeline', tasks: '9 Tasks', progress: 45, color: 'bg-blue-500' },
            { name: 'Feedback Agent', desc: 'Customer Support AI', tasks: '32 Tasks', progress: 58, color: 'bg-emerald-500' },
            { name: 'Operations Agent', desc: 'Process & Automation', tasks: '21 Tasks', progress: 75, color: 'bg-purple-500' },
            { name: 'Market Intelligence', desc: 'Competitive Analysis', tasks: '16 Tasks', progress: 81, color: 'bg-cyan-500' },
          ].map((agent, i) => (
            <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{agent.name}</div>
                  <span className="text-[10px] font-mono text-slate-400">{agent.tasks}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{agent.desc}</div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Progress</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{agent.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${agent.color}`} style={{ width: `${agent.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Live Activity Stream, Key Insights with Chart.js, Mission Console */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live Activity Stream */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">LIVE ACTIVITY STREAM</h3>
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <div className="mt-4 space-y-3">
            {[
              { agent: 'Research Agent', text: 'Analyzing EU market data & Germany drop', time: '2 min ago', model: 'GPT-4o' },
              { agent: 'Data Analysis Agent', text: 'Comparing conversion by country', time: '3 min ago', model: 'Claude 3.5' },
              { agent: 'Customer Feedback', text: 'Analyzing 2,418 customer conversations', time: '3 min ago', model: 'Intercom Engine' },
              { agent: 'Sales Agent', text: 'Auditing EU pipeline stage dropoffs', time: '5 min ago', model: 'HubSpot API' },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#e05638]">{item.agent}</span>
                  <span className="text-[10px] font-mono text-slate-400">{item.time}</span>
                </div>
                <div className="text-xs text-slate-800 dark:text-slate-200 mt-1 font-medium">{item.text}</div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">Powered by {item.model}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Insights Findings with Chart.js Integration */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">KEY INSIGHTS FINDINGS</h3>
            <span className="text-[11px] font-bold text-slate-500">View All 24</span>
          </div>

          <div className="mt-4 space-y-4">
            {/* Finding Card 1: Revenue vs Last Month */}
            <div className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Revenue vs Last Month</h4>
                <span className="text-xs font-bold font-mono text-rose-500">-18%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Revenue decline is concentrated in Germany and France.</p>
              
              {/* Mini Chart.js */}
              <div className="mt-3 h-20 w-full">
                <Bar data={revenueChartData} options={miniChartOptions} />
              </div>
            </div>

            {/* Finding Card 2: Negative Sentiment in EU */}
            <div className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Negative Sentiment in EU</h4>
                <span className="text-xs font-bold font-mono text-rose-500">+12%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Negative sentiment concentrated around pricing structure.</p>
              
              {/* Mini Chart.js */}
              <div className="mt-3 h-20 w-full">
                <Line data={sentimentChartData} options={miniChartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Mission Console Prompt Terminal */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">MISSION CONSOLE</h3>
              <Bot size={15} className="text-[#e05638]" />
            </div>

            <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {messages.map((m, i) => (
                <div key={i} className={`p-3 rounded-lg border text-xs ${
                  m.sender === 'USER' 
                    ? 'border-[#e05638]/30 bg-[#e05638]/5 text-slate-900 dark:text-slate-100' 
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}>
                  <div className="text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">{m.sender}</div>
                  <div>{m.text}</div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendPrompt} className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask ZEGA AI Coordinator..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-3 pr-10 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#e05638]"
            />
            <button
              type="submit"
              className="absolute right-2 top-4.5 text-[#e05638] hover:text-[#c8462b] cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
