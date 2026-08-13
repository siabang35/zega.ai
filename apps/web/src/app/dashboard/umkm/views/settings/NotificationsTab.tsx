import React, { useState, useEffect } from 'react';
import { 
  Bell, Mail, MessageSquare, Smartphone, Laptop, Clock, Moon, Edit2, X, Send, Bot, Building2, Shield, Sparkles
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { useLanguage } from '../../../../../i18n/translations';

interface NotificationsTabProps {
  triggerToast: (msg: string) => void;
}

export function NotificationsTab({ triggerToast }: NotificationsTabProps) {
  const { t } = useLanguage();
  const notifT = t.settingsView?.notificationsTab;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Channels
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailTarget, setEmailTarget] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappTarget, setWhatsappTarget] = useState('');
  const [browserEnabled, setBrowserEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsTarget, setSmsTarget] = useState('');

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

  // Modal Edit Target State
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<'Email' | 'WhatsApp' | 'SMS'>('Email');
  const [targetInputValue, setTargetInputValue] = useState('');

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
        if (data.weekly_summary_day) setWeeklySummaryDay(data.weekly_summary_day);
        if (data.weekly_summary_time) setWeeklySummaryTime(data.weekly_summary_time);

        if (data.quiet_hours_enabled !== undefined) setQuietHoursEnabled(data.quiet_hours_enabled);
        if (data.quiet_hours_start) setQuietHoursStart(data.quiet_hours_start);
        if (data.quiet_hours_end) setQuietHoursEnd(data.quiet_hours_end);
        if (data.quiet_hours_freq) setQuietHoursFreq(data.quiet_hours_freq);
      }
      
      const userProfile = await SupabaseDashboardService.getUmkmUserProfileOverview();
      if (!data?.email_target && userProfile?.profile?.email) {
        setEmailTarget(userProfile.profile.email);
      }
      if (!data?.whatsapp_target && userProfile?.profile?.phone) {
        setWhatsappTarget(userProfile.profile.phone);
      }
    } catch (e) {
      console.warn('Notifications load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    const unsub = SupabaseDashboardService.subscribeToNotificationSettingsRealtime('11111111-1111-1111-1111-111111111111', () => {
      loadSettings();
    });
    return () => unsub();
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
        weekly_summary_day: overrides?.weekly_summary_day ?? weeklySummaryDay,
        weekly_summary_time: overrides?.weekly_summary_time ?? weeklySummaryTime,
        quiet_hours_enabled: overrides?.quiet_hours_enabled ?? quietHoursEnabled,
        quiet_hours_start: overrides?.quiet_hours_start ?? quietHoursStart,
        quiet_hours_end: overrides?.quiet_hours_end ?? quietHoursEnd,
        quiet_hours_freq: overrides?.quiet_hours_freq ?? quietHoursFreq
      };

      await SupabaseDashboardService.updateUmkmNotificationSettings(payload);
      triggerToast(`✓ ${notifT?.toastSuccess || 'Notification settings saved and synchronized!'}`);
    } catch (e) {
      triggerToast(`✕ ${notifT?.toastSaveError || 'Failed to save notification settings.'}`);
    } finally {
      setSaving(false);
    }
  };

  const openEditTargetModal = (type: 'Email' | 'WhatsApp' | 'SMS') => {
    setTargetType(type);
    if (type === 'Email') setTargetInputValue(emailTarget);
    else if (type === 'WhatsApp') setTargetInputValue(whatsappTarget);
    else setTargetInputValue(smsTarget);
    setIsTargetModalOpen(true);
  };

  const handleSaveTarget = async () => {
    if (!targetInputValue.trim()) {
      triggerToast(`✕ ${notifT?.toastTargetEmpty || 'Notification destination cannot be empty!'}`);
      return;
    }

    if (targetType === 'Email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(targetInputValue.trim())) {
        triggerToast(`✕ ${notifT?.toastInvalidEmail || 'Invalid email format!'}`);
        return;
      }
      setEmailTarget(targetInputValue.trim());
      await handleSave({ email_target: targetInputValue.trim() });
    } else if (targetType === 'WhatsApp') {
      setWhatsappTarget(targetInputValue.trim());
      await handleSave({ whatsapp_target: targetInputValue.trim() });
    } else if (targetType === 'SMS') {
      setSmsTarget(targetInputValue.trim());
      await handleSave({ sms_target: targetInputValue.trim() });
    }

    setIsTargetModalOpen(false);
    triggerToast(`✓ ${notifT?.toastTargetSuccess || 'Notification destination updated!'}`);
  };

  const renderToggle = (checked: boolean, onChange: (val: boolean) => void) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
        checked ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white transition duration-200 ease-in-out ${
        checked ? 'translate-x-3.5' : 'translate-x-0'
      }`} />
    </button>
  );

  return (
    <div className="max-w-6xl space-y-5 font-sans">
      {/* Upper Grid: Channels & Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Notification Channels (5 cols on lg) */}
        <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bell size={15} className="text-orange-500" /> {notifT?.channelsTitle || 'Notification Channels'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {notifT?.channelsSubtitle || 'Manage channels to receive real-time notifications.'}
            </p>
          </div>

          <div className="space-y-2.5">
            {/* In-App */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-7 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center border border-orange-100 dark:border-orange-900/40 shrink-0">
                  <Bell size={14} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{notifT?.inAppTitle || 'In-App'}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{notifT?.inAppDesc || 'Inside application dashboard'}</p>
                </div>
              </div>
              <div className="ml-2 shrink-0">
                {renderToggle(inAppEnabled, (val) => {
                  setInAppEnabled(val);
                  handleSave({ in_app_enabled: val });
                })}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shrink-0">
                  <Mail size={14} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{notifT?.emailTitle || 'Email'}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{notifT?.emailDesc || 'Receive via email'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <button
                  onClick={() => openEditTargetModal('Email')}
                  className="max-w-[130px] sm:max-w-[160px] truncate text-[11px] font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium cursor-pointer bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 flex items-center gap-1 transition-colors"
                >
                  <span className="truncate">{emailTarget || (notifT?.notSet || 'Not set')}</span>
                  <Edit2 size={10} className="text-slate-400 shrink-0" />
                </button>
                {renderToggle(emailEnabled, (val) => {
                  setEmailEnabled(val);
                  handleSave({ email_enabled: val });
                })}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40 shrink-0">
                  <MessageSquare size={14} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{notifT?.waTitle || 'WhatsApp'}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{notifT?.waDesc || 'Receive via WhatsApp'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <button
                  onClick={() => openEditTargetModal('WhatsApp')}
                  className="max-w-[120px] truncate text-[11px] font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium cursor-pointer bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 flex items-center gap-1 transition-colors"
                >
                  <span className="truncate">{whatsappTarget || (notifT?.notSet || 'Not set')}</span>
                  <Edit2 size={10} className="text-slate-400 shrink-0" />
                </button>
                {renderToggle(whatsappEnabled, (val) => {
                  setWhatsappEnabled(val);
                  handleSave({ whatsapp_enabled: val });
                })}
              </div>
            </div>

            {/* Browser */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-7 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center border border-purple-100 dark:border-purple-900/40 shrink-0">
                  <Laptop size={14} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{notifT?.browserTitle || 'Browser'}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{notifT?.browserDesc || 'Browser push alerts'}</p>
                </div>
              </div>
              <div className="ml-2 shrink-0">
                {renderToggle(browserEnabled, (val) => {
                  setBrowserEnabled(val);
                  handleSave({ browser_enabled: val });
                })}
              </div>
            </div>

            {/* SMS */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-7 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                  <Smartphone size={14} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{notifT?.smsTitle || 'SMS'}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{notifT?.smsDesc || 'Receive via SMS'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <button
                  onClick={() => openEditTargetModal('SMS')}
                  className="max-w-[120px] truncate text-[11px] font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium cursor-pointer bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 flex items-center gap-1 transition-colors"
                >
                  <span className="truncate">{smsTarget || (notifT?.notSet || 'Not set')}</span>
                  <Edit2 size={10} className="text-slate-400 shrink-0" />
                </button>
                {renderToggle(smsEnabled, (val) => {
                  setSmsEnabled(val);
                  handleSave({ sms_enabled: val });
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Notification Preferences (7 cols on lg) */}
        <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {notifT?.prefsTitle || 'Notification Preferences'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {notifT?.prefsSubtitle || 'Select event types & activities to receive alerts.'}
            </p>
          </div>

          <div className="space-y-3">
            {/* AI & Automation */}
            <div className="space-y-1.5">
              <h4 className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Bot size={12} className="text-orange-500" />
                {notifT?.sectionAi || 'AI & Automation'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{notifT?.aiTaskDone || 'AI Employee completes task'}</span>
                  {renderToggle(aiTaskDone, (val) => { setAiTaskDone(val); handleSave({ ai_task_done: val }); })}
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{notifT?.aiInsights || 'AI insights & advice'}</span>
                  {renderToggle(aiInsights, (val) => { setAiInsights(val); handleSave({ ai_insights: val }); })}
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between md:col-span-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{notifT?.automationStatus || 'Automation task status'}</span>
                  {renderToggle(automationStatus, (val) => { setAutomationStatus(val); handleSave({ automation_status: val }); })}
                </div>
              </div>
            </div>

            {/* Business & Operational */}
            <div className="space-y-1.5 pt-1">
              <h4 className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Building2 size={12} className="text-blue-500" />
                {notifT?.sectionBiz || 'Business & Operational'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{notifT?.newOrder || 'New order received'}</span>
                  {renderToggle(newOrder, (val) => { setNewOrder(val); handleSave({ new_order: val }); })}
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{notifT?.invoicePaid || 'Invoice paid'}</span>
                  {renderToggle(invoicePaid, (val) => { setInvoicePaid(val); handleSave({ invoice_paid: val }); })}
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{notifT?.stockWarning || 'Low stock warning'}</span>
                  {renderToggle(stockWarning, (val) => { setStockWarning(val); handleSave({ stock_warning: val }); })}
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{notifT?.customerFollowup || 'Follow-up reminder'}</span>
                  {renderToggle(customerFollowup, (val) => { setCustomerFollowup(val); handleSave({ customer_followup: val }); })}
                </div>
              </div>
            </div>

            {/* System & Security */}
            <div className="space-y-1.5 pt-1">
              <h4 className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Shield size={12} className="text-emerald-500" />
                {notifT?.sectionSystem || 'System & Security'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{notifT?.productUpdates || 'Product updates'}</span>
                  {renderToggle(productUpdates, (val) => { setProductUpdates(val); handleSave({ product_updates: val }); })}
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{notifT?.systemMaintenance || 'System maintenance'}</span>
                  {renderToggle(systemMaintenance, (val) => { setSystemMaintenance(val); handleSave({ system_maintenance: val }); })}
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between md:col-span-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{notifT?.securityLogin || 'Account security & login alerts'}</span>
                  {renderToggle(securityLogin, (val) => { setSecurityLogin(val); handleSave({ security_login: val }); })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Grid: Schedules & Quiet Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Summary Schedule */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock size={15} className="text-orange-500" /> {notifT?.scheduleTitle || 'Summary Schedule'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {notifT?.scheduleSubtitle || 'Configure automated summary reports.'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{notifT?.dailySummary || 'Daily summary'}</h4>
                <p className="text-[10px] text-slate-400 truncate">{notifT?.dailySummaryDesc || 'Daily highlight summary'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={dailySummaryTime}
                  onChange={(e) => { setDailySummaryTime(e.target.value); handleSave({ daily_summary_time: e.target.value }); }}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-bold tabular-nums text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="08:00 WIB">08:00 WIB</option>
                  <option value="12:00 WIB">12:00 WIB</option>
                  <option value="18:00 WIB">18:00 WIB</option>
                  <option value="21:00 WIB">21:00 WIB</option>
                </select>
                {renderToggle(dailySummaryEnabled, (val) => { setDailySummaryEnabled(val); handleSave({ daily_summary_enabled: val }); })}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{notifT?.weeklySummary || 'Weekly summary'}</h4>
                <p className="text-[10px] text-slate-400 truncate">{notifT?.weeklySummaryDesc || 'Weekly performance summary'}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <select
                  value={weeklySummaryDay}
                  onChange={(e) => { setWeeklySummaryDay(e.target.value); handleSave({ weekly_summary_day: e.target.value }); }}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="Senin">{notifT?.monday || 'Monday'}</option>
                  <option value="Rabu">{notifT?.wednesday || 'Wednesday'}</option>
                  <option value="Jumat">{notifT?.friday || 'Friday'}</option>
                  <option value="Minggu">{notifT?.sunday || 'Sunday'}</option>
                </select>
                <select
                  value={weeklySummaryTime}
                  onChange={(e) => { setWeeklySummaryTime(e.target.value); handleSave({ weekly_summary_time: e.target.value }); }}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-bold tabular-nums text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="08:00 WIB">08:00 WIB</option>
                  <option value="09:00 WIB">09:00 WIB</option>
                  <option value="17:00 WIB">17:00 WIB</option>
                </select>
                {renderToggle(weeklySummaryEnabled, (val) => { setWeeklySummaryEnabled(val); handleSave({ weekly_summary_enabled: val }); })}
              </div>
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Moon size={15} className="text-orange-500" /> {notifT?.quietHoursTitle || 'Quiet Hours'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {notifT?.quietHoursSubtitle || 'Prevent disturbance during quiet hours.'}
              </p>
            </div>
            {renderToggle(quietHoursEnabled, (val) => { setQuietHoursEnabled(val); handleSave({ quiet_hours_enabled: val }); })}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <select
                value={quietHoursStart}
                onChange={(e) => { setQuietHoursStart(e.target.value); handleSave({ quiet_hours_start: e.target.value }); }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold tabular-nums text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="20:00">20:00</option>
                <option value="21:00">21:00</option>
                <option value="22:00">22:00</option>
                <option value="23:00">23:00</option>
              </select>
              <span className="text-xs text-slate-400 font-bold">-</span>
              <select
                value={quietHoursEnd}
                onChange={(e) => { setQuietHoursEnd(e.target.value); handleSave({ quiet_hours_end: e.target.value }); }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold tabular-nums text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="06:00">06:00</option>
                <option value="07:00">07:00</option>
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
              </select>
            </div>
            <select
              value={quietHoursFreq}
              onChange={(e) => { setQuietHoursFreq(e.target.value); handleSave({ quiet_hours_freq: e.target.value }); }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="Setiap hari">{notifT?.everyday || 'Every day'}</option>
              <option value="Hari kerja">{notifT?.weekdays || 'Weekdays (Mon - Fri)'}</option>
              <option value="Akhir pekan">{notifT?.weekends || 'Weekends (Sat - Sun)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* MODAL EDIT CHANNEL TARGET */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Send size={15} className="text-orange-500" />
                <span>{notifT?.modalEditTargetTitle || 'Edit Target:'} {targetType}</span>
              </h3>
              <button onClick={() => setIsTargetModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-medium">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                  {targetType === 'Email' ? (notifT?.targetEmailLabel || 'Destination Email Address') : targetType === 'WhatsApp' ? (notifT?.targetWaLabel || 'Connected WhatsApp Number') : (notifT?.targetSmsLabel || 'SMS Mobile Phone Number')}
                </label>
                <input
                  type={targetType === 'Email' ? 'email' : 'text'}
                  value={targetInputValue}
                  onChange={e => setTargetInputValue(e.target.value)}
                  placeholder={targetType === 'Email' ? 'nama@domain.com' : '+62 812-xxxx-xxxx'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono tabular-nums text-xs focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 text-[10.5px] text-blue-800 dark:text-blue-300 font-medium">
                {notifT?.targetVerificationNote || 'Destination Verification: System notifications & urgent alerts will be sent to this destination automatically.'}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                {notifT?.cancelBtn || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveTarget}
                className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer"
              >
                {notifT?.saveTargetBtn || 'Save Destination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
