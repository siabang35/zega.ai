import React, { useState } from 'react';
import { 
  Search, Filter, Send, MessageSquare, Instagram, 
  ShoppingBag, Video, Phone, CheckCircle2, Bot, ChevronDown, UserCheck 
} from 'lucide-react';

interface InboxViewProps {
  triggerToast: (msg: string) => void;
}

export function InboxView({ triggerToast }: InboxViewProps) {
  const [filterTab, setFilterTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState('siti');
  const [chatInput, setChatInput] = useState('');

  const conversations = [
    { 
      id: 'siti', 
      name: 'Siti Aisyah', 
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face&q=80',
      time: '06.12', 
      preview: 'Halo, saya mau tanya harga...', 
      channel: 'WhatsApp', 
      badge: 'High Priority', 
      unread: true 
    },
    { 
      id: 'budi', 
      name: 'Budi Santoso', 
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&q=80',
      time: '06.45', 
      preview: 'Apakah masih ada stok?', 
      channel: 'WhatsApp', 
      unread: false 
    },
    { 
      id: 'dewi', 
      name: 'Dewi Lestari', 
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face&q=80',
      time: '06.30', 
      preview: 'Terima kasih, pesanan sudah...', 
      channel: 'Instagram', 
      unread: false 
    },
    { 
      id: 'rizky', 
      name: 'Rizky Pratama', 
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face&q=80',
      time: '06.25', 
      preview: 'Bisa kirim hari ini?', 
      channel: 'Shopee', 
      unread: false 
    },
    { 
      id: 'maya', 
      name: 'Maya Putri', 
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face&q=80',
      time: '07.30', 
      preview: 'Mau retur produk', 
      channel: 'TikTok', 
      unread: false 
    },
    { 
      id: 'andi', 
      name: 'Andi Wijaya', 
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&q=80',
      time: '07.10', 
      preview: 'Berapa ongkir ke Bali?', 
      channel: 'WhatsApp', 
      unread: false 
    },
  ];

  const activeChat = conversations.find(c => c.id === selectedChatId) || conversations[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    triggerToast(`Message sent to ${selectedChatId}`);
    setChatInput('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Inbox</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Semua percakapan dari pelanggan di satu tempat.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs font-bold">
          {[
            { label: 'All', count: null },
            { label: 'WhatsApp', count: 32 },
            { label: 'Instagram', count: 5 },
            { label: 'Shopee', count: 2 },
            { label: 'TikTok', count: 2 },
          ].map((t) => (
            <button
              key={t.label}
              onClick={() => setFilterTab(t.label)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === t.label
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>{t.label}</span>
              {t.count && <span className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 rounded-full text-[10px]">{t.count}</span>}
            </button>
          ))}
        </div>
        <button 
          onClick={() => triggerToast('Filter settings...')} 
          className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
        >
          <Filter size={14} /> Filter
        </button>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid lg:grid-cols-12 gap-5 h-[620px]">
        {/* Left Column: Conversation List */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..." 
                className="w-full pl-8 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              {conversations.map((c) => (
                <div 
                  key={c.id}
                  onClick={() => setSelectedChatId(c.id)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-center gap-3 ${
                    selectedChatId === c.id 
                      ? 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50 shadow-xs' 
                      : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img 
                      src={c.avatar} 
                      alt={c.name} 
                      className="size-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs" 
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{c.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400 flex-shrink-0 ml-1">{c.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.preview}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => triggerToast('Loading more conversations...')} className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer">
            Load more conversations...
          </button>
        </div>

        {/* Center Column: Active Chat Window */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <img 
                src={activeChat.avatar} 
                alt={activeChat.name} 
                className="size-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{activeChat.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[9px] font-bold">{activeChat.channel}</span>
                  {activeChat.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 text-[9px] font-bold">{activeChat.badge}</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">+62 812-3456-7890</p>
              </div>
            </div>
            <button onClick={() => triggerToast('Calling customer...')} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer">
              <Phone size={14} />
            </button>
          </div>

          {/* Chat History Messages */}
          <div className="flex-1 space-y-3.5 overflow-y-auto pr-1 text-xs">
            {/* User Message */}
            <div className="flex items-start gap-2.5">
              <img 
                src={activeChat.avatar} 
                alt={activeChat.name} 
                className="size-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 mt-0.5" 
              />
              <div className="p-3 rounded-2xl rounded-tl-xs bg-slate-100 dark:bg-slate-800 max-w-[85%] text-slate-800 dark:text-slate-200 leading-relaxed">
                Halo, saya mau tanya harga paket skincare...
              </div>
            </div>

            {/* AI Agent Reply */}
            <div className="flex items-start justify-end gap-2.5">
              <div className="p-3.5 rounded-2xl rounded-tr-xs bg-orange-500 text-white max-w-[85%] space-y-2 leading-relaxed shadow-xs">
                <p>Halo Kak {activeChat.name.split(' ')[0]}! 👋 Berikut harga produk yang kakak tanyakan:</p>
                <ul className="space-y-1 font-semibold text-[11px]">
                  <li>• Paket Basic: <span className="font-extrabold text-amber-200">Rp199.000</span></li>
                  <li>• Paket Premium: <span className="font-extrabold text-amber-200">Rp499.000</span></li>
                  <li>• Paket Ultimate: <span className="font-extrabold text-amber-200">Rp899.000</span></li>
                </ul>
                <p className="text-[11px] pt-1">Mau saya bantu buatkan order sekarang?</p>
              </div>
              <div className="size-7 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0 font-black text-[10px] mt-0.5 shadow-xs">
                AI
              </div>
            </div>
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-xs rounded-2xl focus:outline-none focus:border-orange-500 border border-slate-200 dark:border-slate-700"
            />
            <button type="submit" className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center cursor-pointer shadow-xs">
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Right Column: AI Assistant Status */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">AI Assistant Status</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold">Working</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <Bot size={18} className="text-orange-500 mt-0.5" />
                <p className="text-slate-600 dark:text-slate-300 font-medium">AI sedang menangani percakapan ini secara otomatis.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Action:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Memberikan informasi harga</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="font-bold text-emerald-600">98%</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => triggerToast('Manual Takeover activated')}
              className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <UserCheck size={14} /> Take Over (Manual)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
