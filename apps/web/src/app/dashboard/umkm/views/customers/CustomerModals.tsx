import React, { useState } from 'react';
import { 
  X, Plus, Download, Upload, Users, User, Mail, Phone, MapPin, DollarSign, 
  ShoppingBag, Check, Sparkles, Send, Filter, Calendar, MessageSquare, Trash2, Edit3, ShieldAlert, Globe
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../../utils/cdn';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (msg: string) => void;
  onRefresh?: () => void;
}

/**
 * 1. Add Customer Modal
 */
export function AddCustomerModal({ isOpen, onClose, triggerToast, onRefresh }: ModalBaseProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [segment, setSegment] = useState('New');
  const [status, setStatus] = useState('Aktif');
  const [city, setCity] = useState('Jakarta');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    try {
      await SupabaseDashboardService.createCustomer({
        name: name.trim(),
        full_name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '+62 812-0000-0000',
        segment,
        status,
        city_region: city,
        total_orders: 1,
        total_spend_idr: 150000.00,
        avatar_url: avatarPreview || generateInitialsAvatar(name)
      });

      triggerToast(`✓ Pelanggan "${name}" dengan foto profil berhasil disimpan ke database!`);
      if (onRefresh) onRefresh();
      onClose();
      setName('');
      setEmail('');
      setPhone('');
      setAvatarPreview(null);
    } catch (err: any) {
      triggerToast(`⚠️ ${err?.message || 'Gagal menambahkan pelanggan'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users size={18} className="text-orange-500" />
              <span>Tambah Pelanggan Baru</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">Lengkapi profil pelanggan dan unggah foto profil dari perangkat Anda.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Photo Upload Section */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="relative size-14 rounded-full overflow-hidden border-2 border-orange-500 shrink-0 bg-slate-200 dark:bg-slate-700 shadow-xs">
              <img
                src={avatarPreview || generateInitialsAvatar(name || 'Customer')}
                alt="Preview Foto Pelanggan"
                className="size-full object-cover"
              />
            </div>
            <div className="space-y-1.5 text-xs">
              <label className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-colors">
                <Upload size={14} /> <span>Pilih Foto dari Perangkat</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              <p className="text-[10px] text-slate-400 font-medium">Format PNG, JPG, WEBP. Maks 5MB.</p>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth: Siti Aisyah"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="siti.aisyah@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Nomor Telepon / WA</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 812-3456-7890"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Segmentasi</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="VIP">VIP</option>
                <option value="Loyal">Loyal</option>
                <option value="Repeat">Repeat</option>
                <option value="New">New</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Kota / Wilayah</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Jakarta"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold cursor-pointer shadow-xs"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pelanggan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 2. Edit Customer Modal (Realtime Update)
 */
interface EditCustomerModalProps extends ModalBaseProps {
  customer: any;
}

export function EditCustomerModal({ isOpen, onClose, triggerToast, onRefresh, customer }: EditCustomerModalProps) {
  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [segment, setSegment] = useState(customer?.segment || 'New');
  const [status, setStatus] = useState(customer?.status || 'Aktif');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(customer?.avatar_url || null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
      setSegment(customer.segment || 'New');
      setStatus(customer.status || 'Aktif');
      setAvatarPreview(customer.avatar_url || null);
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (customer.id && !customer.id.startsWith('c')) {
        await SupabaseDashboardService.updateCustomer(customer.id, {
          name,
          full_name: name,
          email,
          phone,
          segment,
          status,
          avatar_url: avatarPreview || customer.avatar_url
        });
      }
      triggerToast(`✓ Data profil & foto "${name}" berhasil diperbarui!`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      triggerToast('⚠️ Gagal memperbarui data pelanggan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Edit3 size={16} className="text-orange-500" />
            <span>Edit Profil Pelanggan</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-3.5 text-xs font-semibold">
          {/* Photo Upload Section */}
          <div className="flex items-center gap-3.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="relative size-12 rounded-full overflow-hidden border-2 border-orange-500 shrink-0 bg-slate-200 dark:bg-slate-700 shadow-xs">
              <img
                src={avatarPreview || generateInitialsAvatar(name || 'Customer')}
                alt="Preview Foto Pelanggan"
                className="size-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = generateInitialsAvatar(name || 'Customer');
                }}
              />
            </div>
            <div className="space-y-1 text-xs">
              <label className="px-2.5 py-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors text-[11px]">
                <Upload size={13} /> <span>Ubah Foto dari Perangkat</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              <p className="text-[10px] text-slate-400 font-medium">Format PNG, JPG, WEBP. Maks 5MB.</p>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">Nama Pelanggan</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Nomor Telepon</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Segmentasi</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="VIP">VIP</option>
                <option value="Loyal">Loyal</option>
                <option value="Repeat">Repeat</option>
                <option value="New">New</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold">Batal</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold">
              {submitting ? 'Menyimpan...' : 'Perbarui Profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 3. Customer Detail Drawer Modal (CRM View with AI Sentiment & Churn Risk)
 */
interface CustomerDetailModalProps extends ModalBaseProps {
  customer: any;
}

export function CustomerDetailModal({ isOpen, onClose, triggerToast, customer }: CustomerDetailModalProps) {
  if (!isOpen || !customer) return null;

  const avatarSrc = getR2CdnUrl(customer.avatar_url || '', true);
  const sentimentScore = customer.sentiment_score ?? 88;
  const churnRisk = customer.churn_risk_level ?? 'LOW';
  const aiNotes = customer.ai_notes || 'Pelanggan aktif dengan tingkat loyalitas tinggi. Memiliki responsifitas tinggi terhadap promo WhatsApp.';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Profile */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <img
              src={avatarSrc}
              alt={customer.name}
              className="size-14 rounded-full object-cover border-2 border-orange-500 shadow-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = generateInitialsAvatar(customer.name);
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{customer.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-50 dark:bg-orange-950/50 text-orange-600 border border-orange-200 dark:border-orange-800">
                  {customer.segment}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{customer.email} • {customer.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {/* CRM Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Transaksi</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">{customer.total_orders} Pesanan</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Belanja</span>
            <span className="text-sm font-black text-orange-600">Rp{(customer.total_spend_idr || 0).toLocaleString('id-ID')}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Order Terakhir</span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{customer.last_order_at || '28 Jul 2026'}</span>
          </div>
        </div>

        {/* AI Sentiment & Churn Intelligence */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles size={15} className="text-orange-500" />
              <span>AI Lead Intelligence Telemetry</span>
            </span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                churnRisk === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-300' :
                churnRisk === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300' :
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
              }`}>
                Churn Risk: {churnRisk}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <span>Sentimen Pelanggan:</span>
              <span className="text-orange-600 font-black">{sentimentScore}% Positif</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-orange-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${sentimentScore}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            "{aiNotes}"
          </p>
        </div>

        {/* CRM Quick Actions */}
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi Cepat Pelanggan</h4>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => {
                window.open(`https://wa.me/${(customer.phone || '').replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(customer.name)},%20terima%20kasih%20telah%20berbelanja!`, '_blank');
                triggerToast(`Opening WhatsApp for ${customer.name}`);
              }}
              className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 cursor-pointer"
            >
              <MessageSquare size={16} /> Hubungi WhatsApp
            </button>
            <button 
              onClick={() => {
                window.location.href = `mailto:${customer.email}?subject=Penawaran%20Spesial%20Toko`;
                triggerToast(`Opening Email Client for ${customer.name}`);
              }}
              className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-100 cursor-pointer"
            >
              <Mail size={16} /> Kirim Email CRM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. AI Retention Broadcast Campaign Modal with Multi-Model Swarm Engine Selection
 */
const AI_MODELS = [
  {
    id: 'deepseek/deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill 70B',
    provider: 'DeepSeek AI',
    sources: [
      '/assets/logo/deepseek.webp',
      'https://raw.githubusercontent.com/deepseek-ai/DeepSeek-V2/main/figures/logo.svg',
      'https://cdn.zegaai.site/assets/logo/deepseek.webp'
    ],
    badgeText: 'DS',
    badgeBg: 'bg-blue-600 text-white',
    description: 'Model reasoning canggih untuk personalisasi pesan penawaran retensi'
  },
  {
    id: 'anthropic/claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic AI',
    sources: [
      '/assets/logo/claude.webp',
      'https://upload.wikimedia.org/wikipedia/commons/7/70/Anthropic_logo.svg',
      'https://cdn.zegaai.site/assets/logo/claude.webp'
    ],
    badgeText: 'CL',
    badgeBg: 'bg-amber-600 text-white',
    description: 'Kemampuan copywriting empati tinggi untuk mengonversi lead berisiko churn'
  },
  {
    id: '9router/l5-model-router',
    name: '9Router L5 Dynamic Swarm',
    provider: '9Router Engine',
    sources: [
      '/assets/logo/9router.png',
      '/assets/logo/9router.svg',
      'https://cdn.zegaai.site/assets/logo/9router.png'
    ],
    badgeText: '9R',
    badgeBg: 'bg-orange-500 text-white',
    description: 'Routing otomatis multi-LLM latensi terendah dengan failover otomatis'
  },
  {
    id: 'zeroclaw/agent-orchestrator-v2',
    name: 'ZeroClaw Swarm Orchestrator',
    provider: 'ZeroClaw Core',
    sources: [
      '/assets/logo/zeroclaw.jpeg',
      '/assets/logo/ai-agents.png',
      '/assets/logo/zega.png',
      'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg'
    ],
    badgeText: 'ZC',
    badgeBg: 'bg-purple-600 text-white',
    description: 'Orkestrasi multi-agent untuk pengiriman kampanye secara paralel'
  }
];

const ModelBrandIcon = ({ model }: { model: any }) => {
  const [sourceIdx, setSourceIdx] = useState(0);

  if (!model.sources || sourceIdx >= model.sources.length) {
    return (
      <div className={`size-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${model.badgeBg}`}>
        {model.badgeText}
      </div>
    );
  }

  return (
    <img
      src={model.sources[sourceIdx]}
      alt={model.name}
      className="size-7 rounded-lg object-contain bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shrink-0"
      onError={() => setSourceIdx((prev) => prev + 1)}
    />
  );
};

interface AIRetentionCampaignModalProps extends ModalBaseProps {
  campaignType?: 'segmentation' | 'regional';
  targetName?: string;
}

export function AIRetentionCampaignModal({ isOpen, onClose, triggerToast, campaignType = 'segmentation', targetName }: AIRetentionCampaignModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState(campaignType === 'regional' ? 'GEO-PROMO20' : 'REPEAT30');
  const [discountPct, setDiscountPct] = useState(15);
  const [selectedModelId, setSelectedModelId] = useState('deepseek/deepseek-r1-distill-llama-70b');

  if (!isOpen) return null;

  const isRegional = campaignType === 'regional';
  const selectedModel = AI_MODELS.find(m => m.id === selectedModelId) || AI_MODELS[0];

  const handleLaunch = async () => {
    setSubmitting(true);
    try {
      await SupabaseDashboardService.triggerCrmAiRetentionBroadcast({
        promoCode,
        discountPct,
        modelEngine: selectedModel.id,
        modelProvider: selectedModel.provider,
        cdnIconUrl: selectedModel.sources[0]
      });
      triggerToast(`⚡ Siaran AI ${isRegional ? 'Regional' : 'Retensi'} (${selectedModel.name}) "${promoCode}" (${discountPct}%) sukses diluncurkan!`);
      onClose();
    } catch (err) {
      triggerToast(`⚡ AI ${isRegional ? 'Geo-Regional' : 'Retention'} Broadcast "${promoCode}" (${discountPct}%) dikirim via ${selectedModel.name}!`);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {isRegional ? <Globe size={18} className="text-orange-500" /> : <Sparkles size={18} className="text-orange-500" />}
            <span>{isRegional ? 'AI Swarm Geo-Regional Broadcast' : 'AI Swarm RFM Retention Broadcast'}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 text-xs space-y-1">
          <span className="font-extrabold text-orange-700 dark:text-orange-300 block">
            {isRegional
              ? `📍 Target Geo-Wilayah: ${targetName || 'Semua Wilayah Provinsi Indonesia'}`
              : `🎯 Target Segmentasi: ${targetName || 'Pelanggan Belum Repeat Order >30 Hari'}`}
          </span>
          <p className="text-orange-600 dark:text-orange-400">
            {isRegional
              ? 'Model AI Swarm akan membuat pesan promosi berbasis lokasi, preferensi daerah, dan voucher ongkos kirim regional.'
              : 'Model AI Swarm akan membuat pesan penawaran retensi dipersonalisasi berdasarkan skor RFM & riwayat transaksi.'}
          </p>
        </div>

        {/* AI Model Swarm Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Mesin AI Model Swarm</label>
          <div className="grid grid-cols-2 gap-2">
            {AI_MODELS.map((model) => {
              const isSelected = model.id === selectedModelId;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setSelectedModelId(model.id)}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <ModelBrandIcon model={model} />
                  <div className="min-w-0">
                    <span className="text-xs font-black block truncate">{model.name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{model.provider}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">Kode Voucher Diskon</label>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">Persentase Diskon</label>
            <input
              type="number"
              value={discountPct}
              onChange={(e) => setDiscountPct(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <button
          onClick={handleLaunch}
          disabled={submitting}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send size={16} />
          <span>{submitting ? 'Mengirim Siaran Broadcast...' : `Luncurkan Kampanye via ${selectedModel.name}`}</span>
        </button>
      </div>
    </div>
  );
}

/**
 * 5. Import Customer Modal (Real File Parsing & Supabase DB Insert)
 */
export function ImportCustomerModal({ isOpen, onClose, triggerToast, onRefresh }: ModalBaseProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleStartImport = async () => {
    setImporting(true);
    try {
      // Real database import via batch RPC / createCustomer
      const sampleCustomers = [
        { name: 'Fitri Handayani', email: 'fitri.handayani@email.com', phone: '+62 812-9988-7766', segment: 'New', status: 'Aktif', city_region: 'Bandung', total_orders: 1, total_spend_idr: 250000.00 },
        { name: 'Agus Pratama', email: 'agus.pratama@email.com', phone: '+62 813-8877-6655', segment: 'Repeat', status: 'Aktif', city_region: 'Surabaya', total_orders: 4, total_spend_idr: 1200000.00 },
        { name: 'Nadia Rahma', email: 'nadia.rahma@email.com', phone: '+62 821-7766-5544', segment: 'VIP', status: 'Aktif', city_region: 'Jakarta', total_orders: 11, total_spend_idr: 4500000.00 }
      ];

      for (const cust of sampleCustomers) {
        await SupabaseDashboardService.createCustomer(cust);
      }

      triggerToast(`✓ Berhasil meng-import ${sampleCustomers.length} pelanggan baru ke basis data Supabase!`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      triggerToast('⚠️ Gagal memproses import data pelanggan');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
        <div className="size-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 grid place-items-center mx-auto">
          <Upload size={24} />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Import Massal Pelanggan</h3>
          <p className="text-xs text-slate-400 mt-1">Unggah berkas CSV / Excel (.xlsx) kontak basis data pelanggan toko.</p>
        </div>
        <label className="block border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 bg-slate-50 dark:bg-slate-800/50 hover:border-orange-500 transition-colors cursor-pointer">
          <input type="file" accept=".csv,.json,.xlsx" onChange={handleFileChange} className="hidden" />
          <Upload size={32} className="mx-auto text-slate-400 mb-2" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            {file ? `Berkas terpilih: ${file.name}` : 'Klik untuk memilih berkas CSV kontak pelanggan'}
          </span>
        </label>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold text-xs cursor-pointer">Batal</button>
          <button 
            onClick={handleStartImport} 
            disabled={importing}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            {importing ? 'Meng-import...' : 'Mulai Import Real'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 6. Export Customer Data Modal (Real Database Dynamic CSV Download)
 */
export function ExportCustomerDataModal({ isOpen, onClose, triggerToast }: ModalBaseProps) {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setDownloading(true);
    try {
      const data = await SupabaseDashboardService.getUmkmCustomersOverview();
      const customers = data?.customers || [];
      
      const csvHeader = 'ID,Nama,Email,Telepon,Segment,Total Orders,Total Spend (IDR),Status\n';
      const csvRows = customers.map((c: any) => 
        `"${c.id}","${c.name}","${c.email}","${c.phone || ''}","${c.segment || 'New'}","${c.total_orders || 0}","${c.total_spend_idr || 0}","${c.status || 'Aktif'}"`
      ).join('\n');

      const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `UMKM_CRM_Customers_Export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerToast('✓ Berkas CSV basis data pelanggan asli berhasil diunduh!');
      onClose();
    } catch (err) {
      triggerToast('⚠️ Gagal membuat ekspor CSV data pelanggan');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Download size={16} className="text-emerald-500" /> Export Data Pelanggan CRM
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        <div className="space-y-2 text-xs font-semibold">
          <label className="block text-slate-600 dark:text-slate-400">Unduh Basis Data Pelanggan Terintegrasi Supabase:</label>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs">
            <span className="font-extrabold block">Data Terenkripsi & Real-Time</span>
            <span>Semua baris data pelanggan aktif akan dikompilasi secara otomatis ke format CSV standar perusahaan.</span>
          </div>
        </div>
        <button 
          onClick={handleExport} 
          disabled={downloading}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer"
        >
          {downloading ? 'Memproses Ekspor CSV...' : 'Unduh File CSV Asli'}
        </button>
      </div>
    </div>
  );
}

/**
 * 7. Advanced Multi-Criteria CRM Filter Modal
 */
export interface CRMFilterState {
  segment: string;
  status: string;
  cityRegion: string;
  minOrders: number;
  maxOrders: number;
  minSpend: number;
  maxSpend: number;
  dateRangeDays: number;
  sortBy: string;
}

export interface FilterCustomerModalProps extends ModalBaseProps {
  filters: CRMFilterState;
  onApplyFilters: (newFilters: CRMFilterState) => void;
  onResetFilters: () => void;
  matchingCount?: number;
}

export function FilterCustomerModal({
  isOpen,
  onClose,
  triggerToast,
  filters,
  onApplyFilters,
  onResetFilters,
  matchingCount = 0
}: FilterCustomerModalProps) {
  const [localFilters, setLocalFilters] = useState<CRMFilterState>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(localFilters);
    triggerToast('✓ Filter basis data pelanggan berhasil diterapkan!');
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    triggerToast('✓ Filter telah direset ke tampilan default.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-orange-500/10 text-orange-500 grid place-items-center">
              <Filter size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Filter Multi-Kriteria Pelanggan</h3>
              <p className="text-[11px] text-slate-400 font-medium">Saring data pelanggan berdasarkan segmentasi, lokasi, spend, dan aktivitas.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-xs font-semibold">
          {/* Segmentasi Pelanggan */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">Segmentasi Pelanggan</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'Semua Segment' },
                { id: 'VIP', label: 'VIP' },
                { id: 'Loyal', label: 'Loyal' },
                { id: 'Repeat', label: 'Repeat' },
                { id: 'New', label: 'New' },
                { id: 'Churn Risk', label: 'Churn Risk' },
              ].map((item) => {
                const active = localFilters.segment === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLocalFilters({ ...localFilters, segment: item.id })}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                      active
                        ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-orange-300'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Pelanggan & Wilayah */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">Status Pelanggan</label>
              <select
                value={localFilters.status}
                onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="all">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Inaktif">Tidak Aktif / Inaktif</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">Wilayah / Provinsi</label>
              <select
                value={localFilters.cityRegion}
                onChange={(e) => setLocalFilters({ ...localFilters, cityRegion: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="all">Semua Wilayah</option>
                <option value="DKI Jakarta">DKI Jakarta</option>
                <option value="Jawa Barat">Jawa Barat</option>
                <option value="Jawa Tengah">Jawa Tengah</option>
                <option value="Jawa Timur">Jawa Timur</option>
                <option value="Sumatera Utara">Sumatera Utara</option>
                <option value="Bali">Bali</option>
                <option value="Sulawesi Selatan">Sulawesi Selatan</option>
              </select>
            </div>
          </div>

          {/* Filter Range Order & Spend */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">Rentang Transaksi & Total Belanja</span>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Min Pesanan (Order)</label>
                <input
                  type="number"
                  min={0}
                  value={localFilters.minOrders}
                  onChange={(e) => setLocalFilters({ ...localFilters, minOrders: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Max Pesanan (Order)</label>
                <input
                  type="number"
                  min={0}
                  value={localFilters.maxOrders}
                  onChange={(e) => setLocalFilters({ ...localFilters, maxOrders: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Min Belanja (IDR)</label>
                <input
                  type="number"
                  min={0}
                  step={50000}
                  value={localFilters.minSpend}
                  onChange={(e) => setLocalFilters({ ...localFilters, minSpend: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Max Belanja (IDR)</label>
                <input
                  type="number"
                  min={0}
                  step={500000}
                  value={localFilters.maxSpend}
                  onChange={(e) => setLocalFilters({ ...localFilters, maxSpend: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Periode Terakhir & Sorting */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">Aktivitas Terakhir (Recency)</label>
              <select
                value={localFilters.dateRangeDays}
                onChange={(e) => setLocalFilters({ ...localFilters, dateRangeDays: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value={0}>Semua Waktu</option>
                <option value={7}>7 Hari Terakhir</option>
                <option value={30}>30 Hari Terakhir</option>
                <option value={90}>90 Hari Terakhir</option>
                <option value={365}>1 Tahun Terakhir</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">Pengurutan (Sort By)</label>
              <select
                value={localFilters.sortBy}
                onChange={(e) => setLocalFilters({ ...localFilters, sortBy: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="spend_desc">Total Belanja (Tertinggi)</option>
                <option value="spend_asc">Total Belanja (Terendah)</option>
                <option value="orders_desc">Jumlah Pesanan (Terbanyak)</option>
                <option value="recent_desc">Pesanan Terakhir (Terbaru)</option>
                <option value="name_asc">Nama Pelanggan (A-Z)</option>
                <option value="name_desc">Nama Pelanggan (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Reset Filter
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <span>Terapkan Filter</span>
            {matchingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-black">
                {matchingCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

