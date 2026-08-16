import React, { useState, useEffect } from 'react';
import { 
  X, Check, Settings, Copy, MessageSquare, Instagram, ShoppingBag, Video, 
  FileText, Sparkles, User, Package, Truck, MapPin, Zap, ExternalLink, RefreshCw, Loader2
} from 'lucide-react';
import { useLanguage } from '../../../../../i18n/translations';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { select9RouterModel } from '../../../services/zeroClaw9RouterEngine';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function ModalBase({ isOpen, onClose, title, children }: ModalBaseProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// 1. Manage Integrations Modal
export function ManageIntegrationsModal({ isOpen, onClose, triggerToast }: { isOpen: boolean; onClose: () => void; triggerToast: (msg: string) => void }) {
  const { t } = useLanguage();
  const u = (t as any).umkmInbox || t.inboxView || {};

  const [channels, setChannels] = useState([
    { name: 'WhatsApp Business API', icon: MessageSquare, color: 'text-emerald-500', connected: true, webhook: 'https://zega-ai.onrender.com/webhooks/wa/store-123' },
    { name: 'Instagram Direct', icon: Instagram, color: 'text-pink-500', connected: true, webhook: 'https://zega-ai.onrender.com/webhooks/ig/store-123' },
    { name: 'Shopee Seller Chat', icon: ShoppingBag, color: 'text-orange-500', connected: true, webhook: 'https://zega-ai.onrender.com/webhooks/shopee/store-123' },
    { name: 'TikTok Shop Messaging', icon: Video, color: 'text-slate-900 dark:text-slate-100', connected: true, webhook: 'https://zega-ai.onrender.com/webhooks/tiktok/store-123' },
    { name: 'Email SMTP / IMAP', icon: FileText, color: 'text-blue-500', connected: true, webhook: 'support@toko-cikcik.com' },
    { name: 'Facebook Messenger', icon: MessageSquare, color: 'text-indigo-500', connected: false, webhook: 'Not Connected' },
  ]);

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={u.modalIntegrationsTitle || "Kelola Integrasi Multi-Channel"}>
      <div className="space-y-3 text-xs">
        <p className="text-slate-500 dark:text-slate-400">{u.modalIntegrationsSub || 'Hubungkan channel komunikasi pelanggan untuk menerima dan membalas pesan secara realtime.'}</p>
        
        <div className="space-y-2">
          {channels.map((ch, idx) => (
            <div key={idx} className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <ch.icon className={`size-5 ${ch.color} flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 truncate">{ch.name}</h4>
                  <p className="text-[10px] font-mono text-slate-400 truncate max-w-[140px] sm:max-w-[240px]">{ch.webhook}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  const updated = [...channels];
                  updated[idx].connected = !updated[idx].connected;
                  setChannels(updated);
                  triggerToast(`${ch.name} ${updated[idx].connected ? (u.connectedStatus || 'Terhubung') : (u.disconnectedStatus || 'Terputus')}`);
                }}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] cursor-pointer transition-all flex-shrink-0 ${
                  ch.connected 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {ch.connected ? (u.connectedStatus || 'Terhubung') : (u.connectAction || 'Hubungkan')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </ModalBase>
  );
}

// 2. Quick Create Order Modal
export function CreateOrderModal({ isOpen, onClose, onInsertText, triggerToast }: { isOpen: boolean; onClose: () => void; onInsertText: (txt: string) => void; triggerToast: (msg: string) => void }) {
  const { t } = useLanguage();
  const u = (t as any).umkmInbox || t.inboxView || {};

  const [product, setProduct] = useState('Paket Basic Skincare Remaja');
  const [price, setPrice] = useState(199000);
  const [qty, setQty] = useState(1);
  const [address, setAddress] = useState('Jl. Denpasar No. 45, Bali');

  const handleCreate = () => {
    const total = price * qty;
    const formatted = `📦 **KONFIRMASI ORDER BARU**\n\n• Produk: ${product}\n• Qty: ${qty}x\n• Total Belanja: Rp${total.toLocaleString('id-ID')}\n• Alamat Pengiriman: ${address}\n\nSilakan lakukan pembayaran melalui QRIS / Bank Transfer. Terima kasih! 😊`;
    onInsertText(formatted);
    triggerToast('Order berhasil dibuat & dimasukkan ke chat');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={u.createOrder || "Buat Order Cepat"}>
      <div className="space-y-3 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{u.selectProduct || 'Pilih Produk'}</label>
          <select 
            value={product}
            onChange={(e) => {
              setProduct(e.target.value);
              if (e.target.value.includes('Basic')) setPrice(199000);
              else if (e.target.value.includes('Premium')) setPrice(499000);
              else setPrice(899000);
            }}
            className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          >
            <option value="Paket Basic Skincare Remaja">Paket Basic Skincare Remaja - Rp199.000</option>
            <option value="Paket Premium Glowing">Paket Premium Glowing - Rp499.000</option>
            <option value="Paket Ultimate Anti-Aging">Paket Ultimate Anti-Aging - Rp899.000</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{u.qtyLabel || 'Jumlah (Qty)'}</label>
            <input 
              type="number" 
              min={1}
              value={qty} 
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>
          <div>
            <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{u.totalPriceLabel || 'Total Harga'}</label>
            <div className="p-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 font-extrabold text-orange-600 dark:text-orange-400">
              Rp{(price * qty).toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{u.deliveryAddressLabel || 'Alamat Tujuan'}</label>
          <textarea 
            value={address} 
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
          />
        </div>

        <button
          onClick={handleCreate}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold shadow-md cursor-pointer"
        >
          {u.createOrderSubmit || 'Buat Order & Masukkan Ke Chat'}
        </button>
      </div>
    </ModalBase>
  );
}

// 3. Cek Ongkir Modal
export function CheckOngkirModal({ isOpen, onClose, onInsertText, triggerToast }: { isOpen: boolean; onClose: () => void; onInsertText: (txt: string) => void; triggerToast: (msg: string) => void }) {
  const { t } = useLanguage();
  const u = (t as any).umkmInbox || t.inboxView || {};

  const [destination, setDestination] = useState('Denpasar, Bali');
  const [courier, setCourier] = useState('JNE Reguler');
  const [rate, setRate] = useState(15000);

  const handleSendRate = () => {
    const txt = `🚚 **INFORMASI ONGKOS KIRIM**\n\n• Tujuan: ${destination}\n• Ekspedisi: ${courier}\n• Tarif: Rp${rate.toLocaleString('id-ID')} (Estimasi 1-2 hari kerja)`;
    onInsertText(txt);
    triggerToast('Informasi ongkir dimasukkan ke chat');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={u.checkOngkirTitle || "Kalkulator Cek Ongkir"}>
      <div className="space-y-3 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{u.destinationCity || 'Kota Tujuan'}</label>
          <input 
            type="text" 
            value={destination} 
            onChange={(e) => setDestination(e.target.value)}
            className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{u.selectCourier || 'Pilih Ekspedisi'}</label>
          <select 
            value={courier}
            onChange={(e) => {
              setCourier(e.target.value);
              if (e.target.value.includes('JNE')) setRate(15000);
              else if (e.target.value.includes('J&T')) setRate(18000);
              else if (e.target.value.includes('SiCepat')) setRate(14000);
              else setRate(12000);
            }}
            className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          >
            <option value="JNE Reguler">JNE Reguler - Rp15.000 (1-2 hari)</option>
            <option value="J&T Express">J&T Express - Rp18.000 (1 hari)</option>
            <option value="SiCepat Halu">SiCepat Halu - Rp14.000 (2 hari)</option>
            <option value="Pos Indonesia">Pos Indonesia - Rp12.000 (2-3 hari)</option>
          </select>
        </div>

        <button
          onClick={handleSendRate}
          className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md cursor-pointer"
        >
          {u.sendRateToChat || 'Kirim Tarif Ongkir Ke Chat'}
        </button>
      </div>
    </ModalBase>
  );
}

// 4. Track Order Modal
export function TrackOrderModal({ isOpen, onClose, onInsertText, triggerToast }: { isOpen: boolean; onClose: () => void; onInsertText: (txt: string) => void; triggerToast: (msg: string) => void }) {
  const { t } = useLanguage();
  const u = (t as any).umkmInbox || t.inboxView || {};

  const resi = 'ZEGA-8821992';
  const status = 'Dalam Pengiriman (Out for Delivery)';

  const handleSendTracking = () => {
    const txt = `📍 **STATUS LACAK RESI**\n\n• No. Resi: ${resi}\n• Ekspedisi: JNE Reguler\n• Status: ${status}\n• Posisi Terakhir: Kurir menuju alamat penerima (Denpasar Selatan).`;
    onInsertText(txt);
    triggerToast('Status resi dimasukkan ke chat');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={u.trackOrderTitle || "Lacak Resi Pengiriman"}>
      <div className="space-y-3 text-xs">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">{u.resiNumberLabel || 'Nomor Resi:'}</span>
            <span className="font-mono font-extrabold text-orange-500">{resi}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{u.latestStatusLabel || 'Status Terbaru:'}</span>
            <span className="font-extrabold text-emerald-600">{status}</span>
          </div>
        </div>

        <button
          onClick={handleSendTracking}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md cursor-pointer"
        >
          {u.sendTrackingToChat || 'Kirim Update Resi Ke Chat'}
        </button>
      </div>
    </ModalBase>
  );
}

// 5. Product Catalog Modal
export function ProductCatalogModal({ isOpen, onClose, onInsertText, triggerToast }: { isOpen: boolean; onClose: () => void; onInsertText: (txt: string) => void; triggerToast: (msg: string) => void }) {
  const { t } = useLanguage();
  const u = (t as any).umkmInbox || t.inboxView || {};

  const products = [
    { name: 'Paket Basic Skincare Remaja', price: 199000, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&q=80' },
    { name: 'Paket Premium Glowing', price: 499000, img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=100&q=80' },
    { name: 'Paket Ultimate Anti-Aging', price: 899000, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&q=80' },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={u.productCatalogTitle || "Katalog Produk"}>
      <div className="space-y-3 text-xs">
        {products.map((p, idx) => (
          <div key={idx} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={p.img} alt={p.name} className="size-10 rounded-xl object-cover" />
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100">{p.name}</h4>
                <p className="font-bold text-orange-500">Rp{p.price.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <button
              onClick={() => {
                onInsertText(`📦 **PRODUK**: ${p.name} - Rp${p.price.toLocaleString('id-ID')}`);
                triggerToast(`Produk ${p.name} dimasukkan ke chat`);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-orange-500 text-white font-extrabold cursor-pointer"
            >
              {u.insertBtn || 'Sisipkan'}
            </button>
          </div>
        ))}
      </div>
    </ModalBase>
  );
}

// 6. AI Reasoning Log Modal
export function AiReasoningModal({ isOpen, onClose, conversation }: { isOpen: boolean; onClose: () => void; conversation?: any }) {
  const { t } = useLanguage();
  const iv = t.inboxView;

  const intent = conversation?.intent || 'General Inquiry';
  const sentiment = conversation?.sentiment || 'Neutral';
  const cName = conversation?.customer_name || iv.notSpecified || 'Pelanggan';
  const routerSelection = select9RouterModel(intent, sentiment);

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={iv.modalAiReasoningTitle || "AI Assistant Reasoning & Diagnostics Log"}>
      <div className="space-y-3 text-xs font-mono">
        <div className="p-3.5 rounded-2xl bg-slate-950 text-emerald-400 space-y-1.5 text-[11px] leading-relaxed border border-slate-800 shadow-inner">
          <div className="text-blue-400 font-bold border-b border-slate-800 pb-1 flex justify-between items-center">
            <span>[{iv.telemetryHeader || '9ROUTER OMNI-ORCHESTRATOR TELEMETRY'}]</span>
            <span className="text-[9.5px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 font-sans">{iv.realtimeBadge || 'LIVE REALTIME'}</span>
          </div>

          <p><span className="text-slate-500">[{iv.customerLabel || 'Customer:'}]</span> {cName} ({conversation?.channel?.toUpperCase() || 'WHATSAPP'})</p>
          <p><span className="text-slate-500">[{iv.modelSelectedLabel || 'Model Selected:'}]</span> <span className="text-purple-300 font-extrabold">{routerSelection.model}</span> (Provider: {routerSelection.provider})</p>
          <p><span className="text-slate-500">[{iv.routingRationaleLabel || 'Routing Rationale:'}]</span> {routerSelection.rationale}</p>
          <p><span className="text-slate-500">[{iv.intentLabel || 'Intent Detected:'}]</span> <span className="text-amber-300">{intent}</span> (Confidence: {conversation?.ai_confidence || 98}%)</p>
          <p><span className="text-slate-500">[{iv.sentimentLabel || 'Sentiment Evaluated:'}]</span> <span className="text-pink-300">{sentiment}</span></p>
          <p><span className="text-slate-500">[{iv.guardrailsLabel || 'Security Guardrails:'}]</span> ZeroClaw PII Filter <span className="text-emerald-300">ACTIVE</span></p>
          <p><span className="text-slate-500">[{iv.dbSyncLabel || 'Database Sync:'}]</span> Supabase DB (<span className="text-sky-300">umkm_inbox_messages</span>)</p>
          <p><span className="text-slate-500">[{iv.cdnStorageLabel || 'CDN Storage:'}]</span> Supabase Storage (<span className="text-teal-300">inbox-attachments</span>)</p>
          <p><span className="text-slate-500">[{iv.lastMessageLabel || 'Last Message:'}]</span> "{conversation?.last_message || '-'}"</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 space-y-1 font-sans text-[11px]">
          <p className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            9Router Multi-LLM & Supabase DB Realtime Engine
          </p>
          <p className="text-slate-500 text-[10.5px]">{iv.connectedEngineNote || 'Directly connected to 9Router Multi-LLM engine and Supabase backend database.'}</p>
        </div>
      </div>
    </ModalBase>
  );
}

// 7. Customer Full Profile Modal
export function CustomerFullProfileModal({ 
  isOpen, 
  onClose, 
  customer, 
  triggerToast 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  customer: any; 
  triggerToast: (msg: string) => void; 
}) {
  const { t, language } = useLanguage();
  const u = (t as any).umkmInbox || t.inboxView || {};

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && customer) {
      let isMounted = true;
      setLoadingOrders(true);
      SupabaseDashboardService.getUmkmCustomerOrders(customer.customer_name, customer.customer_phone)
        .then((fetchedOrders) => {
          if (isMounted) {
            setOrders(fetchedOrders || []);
          }
        })
        .catch(() => {
          if (isMounted) setOrders([]);
        })
        .finally(() => {
          if (isMounted) setLoadingOrders(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, customer]);

  if (!customer) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return u.notSpecified || 'Belum diisi';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const localeCode = language === 'id' ? 'id-ID' : language === 'zh' ? 'zh-CN' : 'en-US';
      return d.toLocaleDateString(localeCode, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formattedTotalSpent = customer.total_spent !== undefined && customer.total_spent !== null
    ? `Rp${Number(customer.total_spent).toLocaleString('id-ID')}`
    : `Rp0`;

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={u.customerProfileTitle || u.modalFullProfileTitle || "Profil Lengkap Pelanggan"}>
      <div className="space-y-4 text-xs">
        {/* Customer Avatar & Primary Metadata */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
          <img
            src={customer.customer_avatar || 'https://cdn.zegaai.site/assets/avatar/avatar_1.webp'}
            alt={customer.customer_name}
            className="size-14 rounded-full object-cover border-2 border-blue-600 shadow-xs"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">{customer.customer_name}</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-extrabold flex items-center gap-0.5">
                <Check size={10} /> {u.verifiedBadge || u.verifiedCustomer || 'Terverifikasi'}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">{customer.customer_phone || (u.notSpecified || 'Belum diisi')}</p>
            <p className="text-[10px] text-slate-400 truncate">{customer.customer_email || (u.notSpecified || 'Belum diisi')}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 font-bold">{u.totalOrder || 'Total Order'}</p>
            <p className="font-black text-sm text-slate-900 dark:text-slate-100 mt-0.5">{customer.total_orders || 0}x</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 font-bold">{u.totalSpent || 'Total Belanja'}</p>
            <p className="font-black text-sm text-blue-600 dark:text-blue-400 mt-0.5">{formattedTotalSpent}</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 font-bold">{u.memberSince || u.customerSince || 'Member Sejak'}</p>
            <p className="font-black text-xs text-slate-900 dark:text-slate-100 mt-0.5">{formatDate(customer.customer_since || customer.created_at)}</p>
          </div>
        </div>

        {/* Contact Info & Address */}
        <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1.5">{u.contactDetailsTitle || u.contactDetailShipping || 'Detail Kontak & Alamat Pengiriman'}</h4>
          <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
            <p><strong className="text-slate-400 font-medium">{u.waNumberLabel || u.waNumber || 'No. WhatsApp:'}</strong> {customer.customer_phone || (u.notSpecified || 'Belum diisi')}</p>
            <p><strong className="text-slate-400 font-medium">{u.emailLabel || 'Email:'}</strong> {customer.customer_email || (u.notSpecified || 'Belum diisi')}</p>
            <p><strong className="text-slate-400 font-medium">{u.addressLabel || 'Alamat:'}</strong> {customer.customer_address || customer.city_region || (u.notSpecified || 'Belum diisi')}</p>
            <p><strong className="text-slate-400 font-medium">{u.assignedAgentLabel || 'Agen Penanggung Jawab:'}</strong> <span className="font-bold text-blue-600 dark:text-blue-400">{customer.assigned_agent || (u.unassignedAgent || 'Belum ditugaskan')}</span></p>
          </div>
        </div>

        {/* Order History */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100">{u.transactionHistoryTitle || u.recentTransactionHistory || 'Riwayat Transaksi Terakhir'}</h4>
          {loadingOrders ? (
            <div className="p-4 flex items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 size={14} className="animate-spin" />
              <span>Memuat data riwayat...</span>
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-1.5">
              {orders.map((ord: any) => (
                <div key={ord.id} className="p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">{ord.id}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(ord.date)}</span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-0.5">{ord.items}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 block">Rp{Number(ord.total).toLocaleString('id-ID')}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                      {ord.status === 'Paid' || ord.status === 'Selesai' ? (u.orderStatusCompleted || 'Selesai') : ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-[11px]">
              {u.noTransactionHistory || 'Belum ada riwayat transaksi'}
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              triggerToast(`Menghubungi ${customer.customer_name} via WhatsApp...`);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer text-center"
          >
            {u.contactWaBtn || 'Hubungi WhatsApp'}
          </button>
          <button
            onClick={() => {
              triggerToast(`Kirim email ke ${customer.customer_name}...`);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer text-center"
          >
            {u.sendEmailBtn || 'Kirim Email'}
          </button>
        </div>
      </div>
    </ModalBase>
  );
}

// 8. Assign Agent Modal
export function AssignAgentModal({
  isOpen,
  onClose,
  onAssign,
  triggerToast
}: {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (agentName: string) => void;
  triggerToast: (msg: string) => void;
}) {
  const { t } = useLanguage();
  const u = (t as any).umkmInbox || t.inboxView || {};

  const agents = [
    { name: 'Cicik Berluk', role: 'Owner & CS Lead', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80' },
    { name: 'Andi Wijaya', role: 'Support Specialist', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&q=80' },
    { name: 'Siti Rahma', role: 'Sales Executive', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' },
    { name: 'ZEGA AI Co-Pilot', role: 'Autonomous AI Agent', avatar: 'https://cdn.zegaai.site/assets/logo/zega.png' },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={u.assignAgentTitle || "Tugaskan Agen CS"}>
      <div className="space-y-3 text-xs">
        <p className="text-slate-500 dark:text-slate-400">{u.assignAgentDesc || 'Pilih anggota tim atau AI Co-Pilot untuk menangani percakapan ini secara langsung.'}</p>
        <div className="space-y-2">
          {agents.map((agent, idx) => (
            <div key={idx} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={agent.avatar} alt={agent.name} className="size-9 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100">{agent.name}</h4>
                  <p className="text-[10px] text-slate-400">{agent.role}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onAssign(agent.name);
                  triggerToast(`Percakapan ditugaskan ke ${agent.name}`);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] cursor-pointer shadow-xs"
              >
                {u.selectAgentBtn || 'Pilih'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </ModalBase>
  );
}

// 9. Add Tag Modal
export function AddTagModal({
  isOpen,
  onClose,
  onAddTag,
  triggerToast
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddTag: (tagName: string) => void;
  triggerToast: (msg: string) => void;
}) {
  const { t } = useLanguage();
  const u = (t as any).umkmInbox || t.inboxView || {};

  const [tagInput, setTagInput] = useState('');
  const presetTags = ['High Priority', 'Order Inquiry', 'VIP Customer', 'Wholesale', 'Skincare', 'Restock', 'Retur / Garansi'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    onAddTag(tagInput.trim());
    triggerToast(`Tag "${tagInput.trim()}" ditambahkan`);
    setTagInput('');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={u.addTagTitle || "Tambah Tag Label Percakapan"}>
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{u.newTagNameLabel || 'Nama Tag Baru'}</label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder={u.tagInputPlaceholder || "Ketik nama tag (cth: High Priority, Retur...)"}
            className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-xs focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-400 block mb-1.5 text-[10px]">{u.orSelectPreset || 'Atau pilih tag rekomendasi:'}</label>
          <div className="flex flex-wrap gap-1.5">
            {presetTags.map((pt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onAddTag(pt);
                  triggerToast(`Tag "${pt}" ditambahkan`);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] border border-slate-200/80 dark:border-slate-700 cursor-pointer"
              >
                + {pt}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-xs cursor-pointer mt-2"
        >
          {u.saveNewTagBtn || 'Simpan Tag Baru'}
        </button>
      </form>
    </ModalBase>
  );
}
