import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Laptop, Clock, Moon, Check, RefreshCw } from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';

interface NotificationsTabProps {
  triggerToast: (msg: string) => void;
}

export function NotificationsTab({ triggerToast }: NotificationsTabProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // States matching design mockup 2
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailTarget, setEmailTarget] = useState('cikberluk@gmail.com');
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappTarget, setWhatsappTarget] = useState('+62 812-3456-7890');
  const [browserEnabled, setBrowserEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsTarget, setSmsTarget] = useState('+62 812-3456-7890');

  // Category Preferences
  const [aiTaskDone, setAiTaskDone] = useState(true);
  const [aiInsights, setAiInsights] = useState(true);
  const [automationStatus, setAutomationStatus] = useState(true);

  const [newOrder, setNewOrder] = useState(true);
  const [invoicePaid, setInvoicePaid] = useState(true);
  const [stockWarning, setStockWarning] = useState(true);
  const [customerFollowup, setCustomerFollowup] = useState(false);

  const [productUpdates, setProductUpdates] = useState(true);
  const [systemMaintenance, setSystemMaintenance] = useState(true);
  const [securityLogin, setSecurityLogin] = useState(true);

  // Schedules & Quiet Hours
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(true);
  const [dailySummaryTime, setDailySummaryTime] = useState('08:00 WIB');
  const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(true);
  const [weeklySummaryDay, setWeeklySummaryDay] = useState('Senin');
  const [weeklySummaryTime, setWeeklySummaryTime] = useState('09:00 WIB');

  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [quietHoursFreq, setQuietHoursFreq] = useState('Setiap hari');

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await SupabaseDashboardService.getUmkmNotificationSettings();
      if (data) {
        if (data.in_app_enabled !== undefined) setInAppEnabled(data.in_app_enabled);
        if (data.email_enabled !== undefined) setEmailEnabled(data.email_enabled);
        if (data.email_target) setEmailTarget(data.email_target);
        if (data.whatsapp_enabled !== undefined) setWhatsappEnabled(data.whatsapp_enabled);
        if (data.whatsapp_target) setWhatsappTarget(data.whatsapp_target);
        if (data.browser_enabled !== undefined) setBrowserEnabled(data.browser_enabled);
        if (data.sms_enabled !== undefined) setSmsEnabled(data.sms_enabled);
        if (data.sms_target) setSmsTarget(data.sms_target);

        if (data.ai_task_done !== undefined) setAiTaskDone(data.ai_task_done);
        if (data.ai_insights !== undefined) setAiInsights(data.ai_insights);
        if (data.automation_status !== undefined) setAutomationStatus(data.automation_status);

        if (data.new_order !== undefined) setNewOrder(data.new_order);
        if (data.invoice_paid !== undefined) setInvoicePaid(data.invoice_paid);
        if (data.stock_warning !== undefined) setStockWarning(data.stock_warning);
        if (data.customer_followup !== undefined) setCustomerFollowup(data.customer_followup);

        if (data.product_updates !== undefined) setProductUpdates(data.product_updates);
        if (data.system_maintenance !== undefined) setSystemMaintenance(data.system_maintenance);
        if (data.security_login !== undefined) setSecurityLogin(data.security_login);

        if (data.daily_summary_enabled !== undefined) setDailySummaryEnabled(data.daily_summary_enabled);
        if (data.daily_summary_time) setDailySummaryTime(data.daily_summary_time);
        if (data.weekly_summary_enabled !== undefined) setWeeklySummaryEnabled(data.weekly_summary_enabled);

        if (data.quiet_hours_enabled !== undefined) setQuietHoursEnabled(data.quiet_hours_enabled);
        if (data.quiet_hours_start) setQuietHoursStart(data.quiet_hours_start);
        if (data.quiet_hours_end) setQuietHoursEnd(data.quiet_hours_end);
        if (data.quiet_hours_freq) setQuietHoursFreq(data.quiet_hours_freq);
      }
    } catch (e) {
      console.warn('Notifications load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (overrides?: any) => {
    try {
      setSaving(true);
      const payload = {
        in_app_enabled: overrides?.in_app_enabled ?? inAppEnabled,
        email_enabled: overrides?.email_enabled ?? emailEnabled,
        email_target: overrides?.email_target ?? emailTarget,
        whatsapp_enabled: overrides?.whatsapp_enabled ?? whatsappEnabled,
        whatsapp_target: overrides?.whatsapp_target ?? whatsappTarget,
        browser_enabled: overrides?.browser_enabled ?? browserEnabled,
        sms_enabled: overrides?.sms_enabled ?? smsEnabled,
        sms_target: overrides?.sms_target ?? smsTarget,

        ai_task_done: overrides?.ai_task_done ?? aiTaskDone,
        ai_insights: overrides?.ai_insights ?? aiInsights,
        automation_status: overrides?.automation_status ?? automationStatus,

        new_order: overrides?.new_order ?? newOrder,
        invoice_paid: overrides?.invoice_paid ?? invoicePaid,
        stock_warning: overrides?.stock_warning ?? stockWarning,
        customer_followup: overrides?.customer_followup ?? customerFollowup,

        product_updates: overrides?.product_updates ?? productUpdates,
        system_maintenance: overrides?.system_maintenance ?? systemMaintenance,
        security_login: overrides?.security_login ?? securityLogin,

        daily_summary_enabled: overrides?.daily_summary_enabled ?? dailySummaryEnabled,
        daily_summary_time: overrides?.daily_summary_time ?? dailySummaryTime,
        weekly_summary_enabled: overrides?.weekly_summary_enabled ?? weeklySummaryEnabled,
        quiet_hours_enabled: overrides?.quiet_hours_enabled ?? quietHoursEnabled,
        quiet_hours_start: overrides?.quiet_hours_start ?? quietHoursStart,
        quiet_hours_end: overrides?.quiet_hours_end ?? quietHoursEnd,
        quiet_hours_freq: overrides?.quiet_hours_freq ?? quietHoursFreq
      };

      await SupabaseDashboardService.updateUmkmNotificationSettings(payload);
      triggerToast('✓ Pengaturan notifikasi berhasil disimpan!');
    } catch (e) {
      triggerToast('✕ Gagal menyegarkan pengaturan notifikasi.');
    } finally {
      setSaving(false);
    }
  };

  const renderToggle = (checked: boolean, onChange: (val: boolean) => void) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
        checked ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Top Grid: Channel Notifikasi & Preferensi Notifikasi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Channel Notifikasi */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bell size={16} className="text-orange-500" /> Channel Notifikasi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Kelola saluran untuk menerima notifikasi.
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* In-App */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center">
                  <Bell size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">In-App</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Notifikasi di dalam aplikasi</p>
                </div>
              </div>
              {renderToggle(inAppEnabled, (val) => {
                setInAppEnabled(val);
                handleSave({ in_app_enabled: val });
              })}
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center">
                  <Mail size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Email</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Terima notifikasi melalui email</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-400 font-medium hidden sm:inline">{emailTarget}</span>
                {renderToggle(emailEnabled, (val) => {
                  setEmailEnabled(val);
                  handleSave({ email_enabled: val });
                })}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center">
                  <MessageSquare size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">WhatsApp</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Terima notifikasi melalui WhatsApp</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-400 font-medium hidden sm:inline">{whatsappTarget}</span>
                {renderToggle(whatsappEnabled, (val) => {
                  setWhatsappEnabled(val);
                  handleSave({ whatsapp_enabled: val });
                })}
              </div>
            </div>

            {/* Browser */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center">
                  <Laptop size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Browser</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Notifikasi push di browser</p>
                </div>
              </div>
              {renderToggle(browserEnabled, (val) => {
                setBrowserEnabled(val);
                handleSave({ browser_enabled: val });
              })}
            </div>

            {/* SMS */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 flex items-center justify-center">
                  <Smartphone size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">SMS</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Terima notifikasi melalui SMS</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-400 font-medium hidden sm:inline">{smsTarget}</span>
                {renderToggle(smsEnabled, (val) => {
                  setSmsEnabled(val);
                  handleSave({ sms_enabled: val });
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Preferensi Notifikasi */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Preferensi Notifikasi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Pilih jenis notifikasi yang ingin Anda terima.
            </p>
          </div>

          <div className="space-y-4">
            {/* AI & Automation */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">AI & Automation</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">AI Employee menyelesaikan tugas</span>
                  {renderToggle(aiTaskDone, (val) => { setAiTaskDone(val); handleSave({ ai_task_done: val }); })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">AI memberikan insight / rekomendasi</span>
                  {renderToggle(aiInsights, (val) => { setAiInsights(val); handleSave({ ai_insights: val }); })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Task otomasi berhasil / gagal</span>
                  {renderToggle(automationStatus, (val) => { setAutomationStatus(val); handleSave({ automation_status: val }); })}
                </div>
              </div>
            </div>

            {/* Bisnis & Operasional */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Bisnis & Operasional</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Pesanan baru masuk</span>
                  {renderToggle(newOrder, (val) => { setNewOrder(val); handleSave({ new_order: val }); })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Invoice dibayar</span>
                  {renderToggle(invoicePaid, (val) => { setInvoicePaid(val); handleSave({ invoice_paid: val }); })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Peringatan stok produk</span>
                  {renderToggle(stockWarning, (val) => { setStockWarning(val); handleSave({ stock_warning: val }); })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Pengingat follow up pelanggan</span>
                  {renderToggle(customerFollowup, (val) => { setCustomerFollowup(val); handleSave({ customer_followup: val }); })}
                </div>
              </div>
            </div>

            {/* Sistem */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Sistem</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Update produk & fitur baru</span>
                  {renderToggle(productUpdates, (val) => { setProductUpdates(val); handleSave({ product_updates: val }); })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Pemeliharaan sistem</span>
                  {renderToggle(systemMaintenance, (val) => { setSystemMaintenance(val); handleSave({ system_maintenance: val }); })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Keamanan akun & login</span>
                  {renderToggle(securityLogin, (val) => { setSecurityLogin(val); handleSave({ security_login: val }); })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Jadwal Ringkasan & Quiet Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Jadwal Ringkasan */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock size={16} className="text-orange-500" /> Jadwal Ringkasan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Atur ringkasan notifikasi yang dikirim secara berkala.
            </p>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Kirim ringkasan harian</h4>
                <p className="text-[10px] text-slate-400 font-medium">Terima ringkasan aktivitas penting setiap hari.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={dailySummaryTime}
                  onChange={(e) => { setDailySummaryTime(e.target.value); handleSave({ daily_summary_time: e.target.value }); }}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 text-[10px] font-bold cursor-pointer"
                >
                  <option value="08:00 WIB">08:00 WIB</option>
                  <option value="18:00 WIB">18:00 WIB</option>
                </select>
                {renderToggle(dailySummaryEnabled, (val) => { setDailySummaryEnabled(val); handleSave({ daily_summary_enabled: val }); })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Kirim ringkasan mingguan</h4>
                <p className="text-[10px] text-slate-400 font-medium">Terima ringkasan aktivitas setiap minggu.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={weeklySummaryDay}
                  onChange={(e) => setWeeklySummaryDay(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 text-[10px] font-bold cursor-pointer"
                >
                  <option value="Senin">Senin</option>
                  <option value="Jumat">Jumat</option>
                </select>
                <select
                  value={weeklySummaryTime}
                  onChange={(e) => setWeeklySummaryTime(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 text-[10px] font-bold cursor-pointer"
                >
                  <option value="09:00 WIB">09:00 WIB</option>
                </select>
                {renderToggle(weeklySummaryEnabled, (val) => { setWeeklySummaryEnabled(val); handleSave({ weekly_summary_enabled: val }); })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Quiet Hours */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Moon size={16} className="text-orange-500" /> Quiet Hours
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Atur jam tenang agar tidak terganggu oleh notifikasi.
              </p>
            </div>
            {renderToggle(quietHoursEnabled, (val) => { setQuietHoursEnabled(val); handleSave({ quiet_hours_enabled: val }); })}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <select
              value={quietHoursStart}
              onChange={(e) => setQuietHoursStart(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 text-xs font-bold cursor-pointer"
            >
              <option value="22:00">22:00</option>
              <option value="23:00">23:00</option>
            </select>
            <span className="text-xs text-slate-400 font-bold">-</span>
            <select
              value={quietHoursEnd}
              onChange={(e) => setQuietHoursEnd(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 text-xs font-bold cursor-pointer"
            >
              <option value="07:00">07:00</option>
              <option value="08:00">08:00</option>
            </select>
            <select
              value={quietHoursFreq}
              onChange={(e) => setQuietHoursFreq(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 text-xs font-bold cursor-pointer"
            >
              <option value="Setiap hari">Setiap hari</option>
              <option value="Hari kerja">Hari kerja</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
