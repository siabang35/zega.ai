import React, { useState } from 'react';
import { 
  Clock, DollarSign, Rocket, CheckCircle, TrendingUp, ShoppingBag, 
  UserPlus, MessageSquare, Sparkles, Bot, Megaphone, FileText, Store, 
  Users, ExternalLink, Heart, CreditCard, X, ArrowRight, Send 
} from 'lucide-react';

interface HomeViewProps {
  displayName: string;
  onNavigateTab: (tab: string) => void;
  triggerToast: (msg: string) => void;
}

const ROBOT_VIDEO_CDN = "https://cdn.zega.ai/assets/3D/robotic.mp4";
const ROBOT_VIDEO_LOCAL = "/assets/3D/robotic.mp4";

export function HomeView({ displayName, onNavigateTab, triggerToast }: HomeViewProps) {
  const [isGreetingVisible, setIsGreetingVisible] = useState(false);

  return (
    <div className="space-y-5 font-sans">
      {/* Top Banner Row */}
      <div className="grid lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50">
                  Good Morning, {displayName} <span className="text-2xl sm:text-3xl">👋</span>
                </h1>

                {/* Interactive 3D Video Mascot Container (Enlarged & Prominent size-28 / sm:size-32) */}
                <div className="relative flex-shrink-0 flex items-center justify-center cursor-pointer group/robot">
                  {/* Interactive Click Popover Speech Bubble */}
                  {isGreetingVisible && (
                    <div className="absolute top-full mt-2.5 left-0 w-64 sm:w-72 z-40 p-4 rounded-2xl bg-slate-900/95 text-white shadow-2xl backdrop-blur-md border border-slate-700/80 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-300">ZEGA AI Copilot</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsGreetingVisible(false);
                          }} 
                          className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      <p className="text-xs text-slate-200 mt-2.5 font-medium leading-relaxed">
                        Halo {displayName}! 👋 AI Team Anda aktif dan telah menyelesaikan <span className="font-bold text-amber-300">126 tugas</span> hari ini!
                      </p>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsGreetingVisible(false);
                          onNavigateTab('my_agents');
                        }}
                        className="mt-3 w-full py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Lihat AI Employees</span> <ArrowRight size={12} />
                      </button>
                    </div>
                  )}

                  {/* High-Tech AI Screen Display Box (Enlarged size-28 / sm:size-32) */}
                  <div 
                    onClick={() => setIsGreetingVisible(!isGreetingVisible)}
                    className="relative size-28 sm:size-32 rounded-3xl bg-slate-950 border-2 border-orange-400/50 p-1 shadow-sm overflow-hidden group-hover/robot:scale-105 group-hover/robot:border-orange-500 transition-all duration-300 flex items-center justify-center"
                  >
                    {/* Subtle Screen Scanline Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 via-transparent to-black/50 pointer-events-none z-20" />
                    
                    {/* Live Animated Video */}
                    <video 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="w-full h-full object-cover rounded-2xl relative z-10 filter drop-shadow-lg cursor-pointer"
                    >
                      <source src="https://cdn.zegaai.site/assets/3D/robotic.mp4" type="video/mp4" />
                      <source src="/assets/3D/robotic.mp4" type="video/mp4" />
                    </video>

                    {/* AI Active Status Dot */}
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-700/80 backdrop-blur-xs">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[9px] font-extrabold text-slate-200 uppercase">3D AI</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
                Your AI Team has completed <span className="text-orange-600 dark:text-orange-400 font-bold">126</span> tasks today.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Estimated time saved</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">11 Hours</span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">+22% vs yesterday</span>
                </div>
              </div>
              <div className="size-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center flex-shrink-0"><Clock size={20} /></div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Revenue generated</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Rp4.850.000</span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">+18% vs yesterday</span>
                </div>
              </div>
              <div className="size-11 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center flex-shrink-0"><DollarSign size={20} /></div>
            </div>
          </div>
        </div>

        {/* Right Upgrade PRO Banner Card */}
        <div className="lg:col-span-4 bg-gradient-to-br from-orange-50/90 via-amber-50/60 to-orange-100/40 dark:from-orange-950/30 dark:to-orange-900/20 border border-orange-200/80 dark:border-orange-800/50 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden shadow-xs">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">You're saving</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">11 Hours/week</h3>
            <ul className="mt-3 space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500" /> Upgrade to PRO</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500" /> Unlimited AI Employees</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500" /> Unlimited Automation</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500" /> Priority AI</li>
            </ul>
          </div>
          <div className="absolute right-3 top-3 opacity-80 pointer-events-none"><Rocket size={52} className="text-orange-400 transform rotate-12" /></div>
          <button onClick={() => triggerToast('Upgrade initiated!')} className="mt-4 w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center justify-center gap-2">
            <Rocket size={16} /> Upgrade Now
          </button>
        </div>
      </div>

      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { title: "Today's Revenue", val: "Rp5.200.000", change: "+18% vs yesterday", icon: TrendingUp, iconBg: "bg-emerald-50 text-emerald-600" },
          { title: "Orders", val: "43", change: "+12% vs yesterday", icon: ShoppingBag, iconBg: "bg-orange-50 text-orange-600" },
          { title: "New Customers", val: "12", change: "+9% vs yesterday", icon: UserPlus, iconBg: "bg-purple-50 text-purple-600" },
          { title: "WhatsApp Response Rate", val: "98%", change: "+3% vs yesterday", icon: MessageSquare, iconBg: "bg-emerald-50 text-emerald-600" },
          { title: "Hours Saved", val: "9.2 Hours", change: "+15% vs yesterday", icon: Clock, iconBg: "bg-blue-50 text-blue-600" },
          { title: "Estimated AI Salary Saved", val: "Rp2.100.000", change: "+18% vs yesterday", icon: Sparkles, iconBg: "bg-amber-50 text-amber-600" },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 line-clamp-1">{m.title}</span>
                <div className={`size-8 rounded-xl ${m.iconBg} flex items-center justify-center flex-shrink-0`}><Icon size={16} /></div>
              </div>
              <div className="mt-3">
                <div className="text-lg font-black text-slate-900 dark:text-slate-100">{m.val}</div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{m.change}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Row: Your AI Employees (7 Active) & Daily Timeline */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Your AI Employees</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">7 Active</span>
            </div>
            <button onClick={() => onNavigateTab('my_agents')} className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Manage All Employees &gt;</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { name: 'Customer Service AI', status: 'Working', icon: Bot, bg: 'bg-emerald-100 text-emerald-600', m1: "Today's Chats", v1: '125', m2: 'Solved', v2: '118' },
              { name: 'Marketing AI', status: 'Working', icon: Megaphone, bg: 'bg-pink-100 text-pink-600', m1: 'Posts', v1: '12', m2: 'Leads', v2: '18' },
              { name: 'Finance AI', status: 'Working', icon: FileText, bg: 'bg-blue-100 text-blue-600', m1: 'Invoices', v1: '43', m2: 'Overdue', v2: '0' },
              { name: 'Store AI', status: 'Working', icon: Store, bg: 'bg-orange-100 text-orange-600', m1: 'Products', v1: '25', m2: 'Alerts', v2: '2' },
              { name: 'Sales AI', status: 'Working', icon: Users, bg: 'bg-purple-100 text-purple-600', m1: 'Leads', v1: '18', m2: 'Deals', v2: '7' },
            ].map((emp, i) => {
              const Icon = emp.icon;
              return (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`size-8 rounded-xl ${emp.bg} flex items-center justify-center flex-shrink-0`}><Icon size={16} /></div>
                    <div className="truncate">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{emp.name}</h4>
                      <span className="text-[9px] font-bold text-emerald-600">• {emp.status}</span>
                    </div>
                  </div>
                  <div className="text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-400"><span>{emp.m1}</span><span className="font-bold text-slate-800 dark:text-slate-200">{emp.v1}</span></div>
                    <div className="flex justify-between text-slate-400"><span>{emp.m2}</span><span className="font-bold text-slate-800 dark:text-slate-200">{emp.v2 || '0'}</span></div>
                  </div>
                  <button onClick={() => triggerToast(`Opening ${emp.name}`)} className="w-full py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer">Open</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Timeline */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Daily Timeline</h3>
            <span className="text-xs font-bold text-slate-400">View All</span>
          </div>
          <div className="space-y-2.5 text-xs font-mono">
            {[
              { time: '08.00', icon: <MessageSquare size={12} className="text-emerald-600 dark:text-emerald-400" />, bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-900/60', text: 'Customer asked price' },
              { time: '08.01', icon: <Bot size={12} className="text-indigo-600 dark:text-indigo-400" />, bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200/60 dark:border-indigo-900/60', text: 'AI replied' },
              { time: '08.02', icon: <ShoppingBag size={12} className="text-amber-600 dark:text-amber-400" />, bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200/60 dark:border-amber-900/60', text: 'Customer purchased' },
              { time: '08.03', icon: <FileText size={12} className="text-blue-600 dark:text-blue-400" />, bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200/60 dark:border-blue-900/60', text: 'Invoice generated' },
              { time: '08.04', icon: <CheckCircle size={12} className="text-emerald-500" />, bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'Payment confirmed' },
              { time: '08.05', icon: <Send size={12} className="text-sky-500" />, bg: 'bg-sky-500/10 border-sky-500/30', text: 'WhatsApp thank you sent' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-slate-400 text-[10px] font-bold w-9">{item.time}</span>
                <div className={`size-5 rounded-lg border flex items-center justify-center ${item.bg}`}>
                  {item.icon}
                </div>
                <span className="text-slate-700 dark:text-slate-300 font-sans font-medium text-[11px] truncate">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom 4 Widgets */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Widget 1: Revenue Center */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Revenue Center</h3>
            <span className="text-[10px] font-bold text-slate-400">This Month ∨</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Revenue', val: 'Rp13.500.000', color: 'stroke-emerald-500' },
              { label: 'AI Generated Revenue', val: 'Rp5.200.000', color: 'stroke-emerald-500' },
              { label: 'Recovery Revenue', val: 'Rp1.300.000', color: 'stroke-emerald-500' },
              { label: 'Abandoned Cart Recovery', val: '34%', color: 'stroke-orange-500' },
              { label: 'Upsell Success', val: '18%', color: 'stroke-blue-500' },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">{r.label}</span>
                  <span className="font-black text-slate-900 dark:text-slate-100">{r.val}</span>
                </div>
                <svg className="w-12 h-5" viewBox="0 0 50 20">
                  <path d="M 0 15 Q 12 5, 25 10 T 50 2" fill="none" className={r.color} strokeWidth="2" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 2: Automation Running */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Automation Running</h3>
            <button onClick={() => onNavigateTab('automation')} className="text-[10px] font-bold text-orange-500">Create New</button>
          </div>
          <div className="space-y-2.5 text-xs">
            {[
              { title: 'New order received', sub: 'Trigger: Online Store' },
              { title: 'Generate invoice', sub: 'Action: Invoice AI' },
              { title: 'Send WhatsApp message', sub: 'Action: WhatsApp AI' },
              { title: 'Save to Spreadsheet', sub: 'Action: Google Sheets' },
              { title: 'Update stock', sub: 'Action: Store AI' },
            ].map((step, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <h4 className="font-bold text-[11px] text-slate-900 dark:text-slate-100">{step.title}</h4>
                  <span className="text-[9px] text-slate-400">{step.sub}</span>
                </div>
                <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Widget 3: Recent Conversations */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Recent Conversations</h3>
            <button onClick={() => onNavigateTab('inbox')} className="text-[10px] font-bold text-slate-400">View Inbox</button>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { name: 'Siti Aisyah', tag: 'Replied', msg: 'Mau tanya ongkir ke...', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face&q=80' },
              { name: 'Budi Santoso', tag: 'Solved', msg: 'Terima kasih, sudah...', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&q=80' },
              { name: 'Dewi Lestari', tag: 'Replied', msg: 'Kapan ready stock...', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face&q=80' },
              { name: 'Rizky Pratama', tag: 'Waiting', msg: 'Apakah bisa COD?', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face&q=80' },
              { name: 'Maya Putri', tag: 'Replied', msg: 'Size M masih ada?', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face&q=80' },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <img src={c.avatar} alt={c.name} className="size-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs flex-shrink-0" />
                  <div className="truncate min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[11px] truncate">{c.name}</span>
                      <span className="text-[9px] text-emerald-600 font-bold flex-shrink-0">• {c.tag}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{c.msg}</p>
                  </div>
                </div>
                <div className="flex gap-1 text-slate-400 flex-shrink-0">
                  <MessageSquare size={12} />
                  <ExternalLink size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 4: Today's Recommendation & Marketplace */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-3xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Sparkles size={14} className="text-amber-300" /> Today's Recommendation
            </div>
            <p className="text-[11px] leading-relaxed text-purple-100">
              AI menemukan <span className="font-bold text-white">17 pelanggan</span> belum melakukan repeat order. Klik untuk kirim promo otomatis.
            </p>
            <button onClick={() => triggerToast('Automated Promo Campaign Started!')} className="w-full py-2 rounded-xl bg-white text-purple-700 font-bold text-xs shadow-xs hover:bg-purple-50 cursor-pointer">
              Run Campaign &gt;
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Marketplace</h3>
              <span className="text-[10px] font-bold text-slate-400">View All</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-medium">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800"><MessageSquare size={16} className="text-emerald-500 mx-auto mb-1" /> WhatsApp</div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800"><ShoppingBag size={16} className="text-orange-500 mx-auto mb-1" /> Shopee</div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800"><Heart size={16} className="text-pink-500 mx-auto mb-1" /> Instagram</div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800"><CreditCard size={16} className="text-purple-500 mx-auto mb-1" /> QRIS</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
