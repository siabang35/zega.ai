import React, { useState } from 'react';
import { 
  X, Check, Settings, Copy, MessageSquare, Instagram, ShoppingBag, Video, 
  FileText, Sparkles, User, Package, Truck, MapPin, Zap, ExternalLink, RefreshCw
} from 'lucide-react';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function ModalBase({ isOpen, onClose, title, children }: ModalBaseProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// 1. Manage Integrations Modal
export function ManageIntegrationsModal({ isOpen, onClose, triggerToast }: { isOpen: boolean; onClose: () => void; triggerToast: (msg: string) => void }) {
  const [channels, setChannels] = useState([
    { name: 'WhatsApp Business API', icon: MessageSquare, color: 'text-emerald-500', connected: true, webhook: 'https://api.zega.ai/webhooks/wa/store-123' },
    { name: 'Instagram Direct', icon: Instagram, color: 'text-pink-500', connected: true, webhook: 'https://api.zega.ai/webhooks/ig/store-123' },
    { name: 'Shopee Seller Chat', icon: ShoppingBag, color: 'text-orange-500', connected: true, webhook: 'https://api.zega.ai/webhooks/shopee/store-123' },
    { name: 'TikTok Shop Messaging', icon: Video, color: 'text-slate-900 dark:text-slate-100', connected: true, webhook: 'https://api.zega.ai/webhooks/tiktok/store-123' },
    { name: 'Email SMTP / IMAP', icon: FileText, color: 'text-blue-500', connected: true, webhook: 'support@toko-cikcik.com' },
    { name: 'Facebook Messenger', icon: MessageSquare, color: 'text-indigo-500', connected: false, webhook: 'Not Connected' },
  ]);

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Kelola Integrasi Multi-Channel">
      <div className="space-y-3 text-xs">
        <p className="text-slate-500 dark:text-slate-400">Hubungkan channel komunikasi pelanggan untuk menerima dan membalas pesan secara realtime.</p>
        
        <div className="space-y-2">
          {channels.map((ch, idx) => (
            <div key={idx} className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ch.icon className={`size-5 ${ch.color}`} />
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100">{ch.name}</h4>
                  <p className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]">{ch.webhook}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  const updated = [...channels];
                  updated[idx].connected = !updated[idx].connected;
                  setChannels(updated);
                  triggerToast(`${ch.name} ${updated[idx].connected ? 'Terhubung' : 'Terputus'}`);
                }}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] cursor-pointer transition-all ${
                  ch.connected 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {ch.connected ? 'Terhubung' : 'Hubungkan'}
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
  const [product, setProduct] = useState('Paket Basic Skincare Remaja');
  const [price, setPrice] = useState(199000);
  const [qty, setQty] = useState(1);
  const [address, setAddress] = useState('Jl. Denpasar No. 45, Bali');

  const handleCreate = () => {
    const total = price * qty;
    const formatted = `⚡ **KONFIRMASI ORDER BARU**\n\n• Produk: ${product}\n• Qty: ${qty}x\n• Total Belanja: Rp${total.toLocaleString('id-ID')}\n• Alamat Pengiriman: ${address}\n\nSilakan lakukan pembayaran melalui QRIS / Bank Transfer. Terima kasih! 😊`;
    onInsertText(formatted);
    triggerToast('Order berhasil dibuat & dimasukkan ke chat');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Buat Order Cepat">
      <div className="space-y-3 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Pilih Produk</label>
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
            <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Jumlah (Qty)</label>
            <input 
              type="number" 
              min={1}
              value={qty} 
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>
          <div>
            <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Total Harga</label>
            <div className="p-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 font-extrabold text-orange-600 dark:text-orange-400">
              Rp{(price * qty).toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Alamat Tujuan</label>
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
          Buat Order & Masukkan Ke Chat
        </button>
      </div>
    </ModalBase>
  );
}

// 3. Cek Ongkir Modal
export function CheckOngkirModal({ isOpen, onClose, onInsertText, triggerToast }: { isOpen: boolean; onClose: () => void; onInsertText: (txt: string) => void; triggerToast: (msg: string) => void }) {
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
    <ModalBase isOpen={isOpen} onClose={onClose} title="Kalkulator Cek Ongkir">
      <div className="space-y-3 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Kota Tujuan</label>
          <input 
            type="text" 
            value={destination} 
            onChange={(e) => setDestination(e.target.value)}
            className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Pilih Ekspedisi</label>
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
          Kirim Tarif Ongkir Ke Chat
        </button>
      </div>
    </ModalBase>
  );
}

// 4. Track Order Modal
export function TrackOrderModal({ isOpen, onClose, onInsertText, triggerToast }: { isOpen: boolean; onClose: () => void; onInsertText: (txt: string) => void; triggerToast: (msg: string) => void }) {
  const resi = 'ZEGA-8821992';
  const status = 'Dalam Pengiriman (Out for Delivery)';

  const handleSendTracking = () => {
    const txt = `📍 **STATUS LACAK RESI**\n\n• No. Resi: ${resi}\n• Ekspedisi: JNE Reguler\n• Status: ${status}\n• Posisi Terakhir: Kurir menuju alamat penerima (Denpasar Selatan).`;
    onInsertText(txt);
    triggerToast('Status resi dimasukkan ke chat');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Lacak Resi Pengiriman">
      <div className="space-y-3 text-xs">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Nomor Resi:</span>
            <span className="font-mono font-extrabold text-orange-500">{resi}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status Terbaru:</span>
            <span className="font-extrabold text-emerald-600">{status}</span>
          </div>
        </div>

        <button
          onClick={handleSendTracking}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md cursor-pointer"
        >
          Kirim Update Resi Ke Chat
        </button>
      </div>
    </ModalBase>
  );
}

// 5. Product Catalog Modal
export function ProductCatalogModal({ isOpen, onClose, onInsertText, triggerToast }: { isOpen: boolean; onClose: () => void; onInsertText: (txt: string) => void; triggerToast: (msg: string) => void }) {
  const products = [
    { name: 'Paket Basic Skincare Remaja', price: 199000, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&q=80' },
    { name: 'Paket Premium Glowing', price: 499000, img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=100&q=80' },
    { name: 'Paket Ultimate Anti-Aging', price: 899000, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&q=80' },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Katalog Produk">
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
              Sisipkan
            </button>
          </div>
        ))}
      </div>
    </ModalBase>
  );
}

// 6. AI Reasoning Log Modal
export function AiReasoningModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="AI Assistant Reasoning & Diagnostics Log">
      <div className="space-y-3 text-xs font-mono">
        <div className="p-3 rounded-2xl bg-slate-900 text-emerald-400 space-y-1 text-[11px]">
          <p>[SYSTEM] Model: ZEGA-Copilot-v4-Turbine</p>
          <p>[INTENT] Detected: Order Inquiry (Confidence: 98%)</p>
          <p>[SENTIMENT] Positive (Score: +0.94)</p>
          <p>[KNOWLEDGE BASE] Matched: "Paket Skincare Basic Remaja Catalog"</p>
          <p>[REASONING] Customer asked for teenage skincare prices. Recommendation: Recommend Paket Basic for oily skin @ Rp199.000.</p>
        </div>
      </div>
    </ModalBase>
  );
}
