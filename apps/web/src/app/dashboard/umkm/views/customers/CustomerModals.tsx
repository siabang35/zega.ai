import React, { useState } from 'react';
import { 
  X, Plus, Download, Upload, Users, User, Mail, Phone, MapPin, DollarSign, 
  ShoppingBag, Check, Sparkles, Send, Filter, Calendar, MessageSquare, Trash2, Edit3, ShieldAlert
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
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

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
        avatar_url: '/assets/avatars/female1.png'
      });

      triggerToast(`✓ Pelanggan "${name}" berhasil disimpan ke database!`);
      if (onRefresh) onRefresh();
      onClose();
      setName('');
      setEmail('');
      setPhone('');
    } catch (err) {
      triggerToast('⚠️ Gagal menambahkan pelanggan');
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
            <p className="text-xs text-slate-400 font-medium">Lengkapi profil pelanggan untuk basis data CRM toko Anda.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
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
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
      setSegment(customer.segment || 'New');
      setStatus(customer.status || 'Aktif');
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

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
          status
        });
      }
      triggerToast(`✓ Data profil "${name}" berhasil diperbarui!`);
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
 * 3. Customer Detail Drawer Modal (CRM View)
 */
interface CustomerDetailModalProps extends ModalBaseProps {
  customer: any;
}

export function CustomerDetailModal({ isOpen, onClose, triggerToast, customer }: CustomerDetailModalProps) {
  if (!isOpen || !customer) return null;

  const avatarSrc = getR2CdnUrl(customer.avatar_url || '', true);

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
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-50 text-orange-600 border border-orange-200">
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
 * 4. AI Retention Broadcast Campaign Modal
 */
export function AIRetentionCampaignModal({ isOpen, onClose, triggerToast }: ModalBaseProps) {
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState('REPEAT30');
  const [discountPct, setDiscountPct] = useState(15);

  if (!isOpen) return null;

  const handleLaunch = () => {
    setSubmitting(true);
    setTimeout(() => {
      triggerToast(`⚡ AI Retention Broadcast "${promoCode}" (${discountPct}%) berhasil dikirim ke 312 pelanggan!`);
      setSubmitting(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles size={18} className="text-orange-500" />
            <span>AI Retention Broadcast</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 text-xs space-y-1.5">
          <span className="font-extrabold text-orange-700 dark:text-orange-300 block">312 Pelanggan Belum Repeat Order &gt;30 Hari</span>
          <p className="text-orange-600 dark:text-orange-400">AI merekomendasikan penawaran diskon khusus via WhatsApp & Email untuk mengaktifkan kembali pelanggan ini.</p>
        </div>

        <div className="space-y-3 text-xs font-semibold">
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
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send size={16} />
          <span>{submitting ? 'Mengirim Siaran Broadcast...' : 'Luncurkan Kampanye Broadcast AI'}</span>
        </button>
      </div>
    </div>
  );
}

/**
 * 5. Import Customer Modal
 */
export function ImportCustomerModal({ isOpen, onClose, triggerToast }: ModalBaseProps) {
  if (!isOpen) return null;

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
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 bg-slate-50 dark:bg-slate-800/50 hover:border-orange-500 transition-colors cursor-pointer">
          <Upload size={32} className="mx-auto text-slate-400 mb-2" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tarik berkas CSV kontak ke sini</span>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold text-xs cursor-pointer">Batal</button>
          <button onClick={() => { triggerToast('✓ 1.248 Pelanggan Berhasil Di-import!'); onClose(); }} className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs cursor-pointer">Mulai Import</button>
        </div>
      </div>
    </div>
  );
}

/**
 * 6. Export Customer Data Modal
 */
export function ExportCustomerDataModal({ isOpen, onClose, triggerToast }: ModalBaseProps) {
  if (!isOpen) return null;

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
          <label className="block text-slate-600 dark:text-slate-400">Pilih Format Berkas Export:</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { triggerToast('✓ Mengunduh laporan pelanggan format .CSV'); onClose(); }} className="p-3 rounded-xl border border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 font-bold text-left cursor-pointer">CSV (.csv)</button>
            <button onClick={() => { triggerToast('✓ Mengunduh laporan pelanggan format .XLSX'); onClose(); }} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold text-left cursor-pointer">Excel (.xlsx)</button>
          </div>
        </div>
        <button onClick={() => { triggerToast('✓ Laporan Basis Data Pelanggan berhasil diunduh!'); onClose(); }} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer">Unduh Sekarang</button>
      </div>
    </div>
  );
}
