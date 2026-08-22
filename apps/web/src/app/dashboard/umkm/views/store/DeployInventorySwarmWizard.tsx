import React, { useState } from 'react';
import {
  Bot, ShieldCheck, Zap, AlertTriangle, CheckCircle2, ChevronRight,
  ChevronLeft, Sparkles, Cpu, Lock, X
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { useLanguage } from '../../../../../i18n/translations';
import { getR2CdnUrl } from '../../../../utils/cdn';

interface DeployInventorySwarmWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onDeployed?: (swarm: any) => void;
  storeId?: string;
}

const SWARM_I18N = {
  id: {
    modalTitle: 'Deploy AI Inventory Swarm',
    multiTenantSecure: 'Multi-Tenant Secure',
    stepOf: (step: number) => `Langkah ${step} dari 6:`,
    steps: [
      'Pilih Target & Objek Swarm',
      'Kustomisasi Nama & Workforce',
      'Alokasi AI Model Engine',
      'Konfigurasi Skill & Tool Matrix',
      'Akses Data & Wewenang Exec',
      'Review & Peluncuran Swarm'
    ],
    deploymentFailed: 'Deployment Gagal',
    step1Title: '1. Pilih Objek & Target Utama AI Swarm',
    step1Desc: 'Tentukan fokus tugas spesifik yang akan dijalankan oleh workforce AI inventaris Anda.',
    recommendedBadge: 'Rekomendasi Utama',
    workforceCount: (count: number) => `Workforce: ${count} Sub-Agen AI`,
    selected: 'Terpilih',
    clickToSelect: 'Klik Pilih',
    step2Title: '2. Kustomisasi Nama & Struktur Workforce',
    step2Desc: 'Beri nama identitas Swarm dan tinjau struktur agen otonom yang dikerahkan.',
    swarmNameLabel: 'Nama AI Swarm',
    swarmNamePlaceholder: 'Contoh: Swarm Intel Inventaris Cabang Utama',
    swarmDescLabel: 'Deskripsi Operasional',
    swarmDescPlaceholder: 'Deskripsi singkat peran swarm',
    structureLabel: 'Struktur Sub-Agen AI Swarm (5 Sub-Agents):',
    defaultModel: 'Model Default:',
    step3Title: '3. Alokasi Model Engine per Agen',
    step3Desc: 'Pilih provider LLM terbaik untuk masing-masing peran agen sesuai kebutuhan kecepatan & kedalaman penalaran.',
    step4Title: '4. Matriks Skill & Tool Khusus Inventaris',
    step4Desc: 'Seluruh agen dilindungi oleh sandbox tool terkontrol. Hanya tool terverifikasi yang diperbolehkan dieksekusi.',
    toolCategory: 'Tool Kategori Inventaris',
    autoStatus: 'Status Otomatis',
    step5Title: '5. Akses Data & Batas Wewenang Eksekusi',
    step5Desc: 'Atur tingkat wewenang agen dan jaminan isolasi tenant Supabase Row Level Security (RLS).',
    readOnlyTitle: 'READ-ONLY (Mode Analisis)',
    readOnlyDesc: 'Swarm hanya dapat membaca data stok & kalkulasi laporan. Tidak dapat mengubah stok secara langsung.',
    readOnlyBadge: 'Aman (Default)',
    writeTitle: 'WRITE WITH APPROVAL',
    writeDesc: 'Agen dapat memperbarui stok barang setelah mendapat verifikasi atau instruksi langsung.',
    writeBadge: 'Wewenang Tulis',
    securityGuaranteeTitle: 'Jaminan Keamanan Tenant Graph ZEGA',
    securityGuaranteeDesc: 'Seluruh kueri inventaris diisolasi secara ketat berdasarkan store_id & organization_id. Agen dari toko lain tidak dapat mengakses data toko ini.',
    step6Title: '6. Review Akhir & Peluncuran AI Swarm',
    step6Desc: 'Konfirmasi konfigurasi sebelum AI Swarm dikerahkan ke toko Anda.',
    readyToDeploy: 'Siap Dideploy',
    totalSubAgents: 'TOTAL SUB-AGEN',
    agentsUnit: 'Agen AI',
    authority: 'WEWENANG',
    costEst: 'ESTIMASI BIAYA',
    costPerRun: '0.05 Kredi/Run',
    tenantIso: 'ISOLASI TENANT',
    rlsEnforced: 'RLS Enforced',
    back: 'Kembali',
    next: 'Lanjutkan',
    deployNow: 'Deploy AI Swarm Sekarang',
    deploying: 'Mendeploy Swarm...',
    defaultSwarmName: 'Workforce Intelligence Inventaris Toko',
    defaultSwarmDesc: 'Swarm AI Otonom untuk monitoring stok, deteksi dead stock, dan rekomendasi restok otomatis.',
  },
  en: {
    modalTitle: 'Deploy AI Inventory Swarm',
    multiTenantSecure: 'Multi-Tenant Secure',
    stepOf: (step: number) => `Step ${step} of 6:`,
    steps: [
      'Select Target & Objective',
      'Customize Name & Workforce',
      'Allocate AI Model Engines',
      'Configure Skill & Tool Matrix',
      'Data Access & Exec Authority',
      'Review & Launch Swarm'
    ],
    deploymentFailed: 'Deployment Failed',
    step1Title: '1. Select AI Swarm Primary Target & Objective',
    step1Desc: 'Define the specific focus of tasks to be executed by your AI inventory workforce.',
    recommendedBadge: 'Top Recommendation',
    workforceCount: (count: number) => `Workforce: ${count} AI Sub-Agents`,
    selected: 'Selected',
    clickToSelect: 'Click to Select',
    step2Title: '2. Customize Name & Workforce Structure',
    step2Desc: 'Give your Swarm an operational identity and review the deployed sub-agent structure.',
    swarmNameLabel: 'AI Swarm Name',
    swarmNamePlaceholder: 'Example: Main Branch Inventory Intel Swarm',
    swarmDescLabel: 'Operational Description',
    swarmDescPlaceholder: 'Brief description of the swarm role',
    structureLabel: 'AI Sub-Agent Structure (5 Sub-Agents):',
    defaultModel: 'Default Model:',
    step3Title: '3. Allocate Model Engine per Agent',
    step3Desc: 'Choose the best LLM provider for each agent role based on latency & reasoning depth.',
    step4Title: '4. Inventory Skill & Tool Matrix',
    step4Desc: 'All agents are protected by a controlled tool sandbox. Only verified tools can execute.',
    toolCategory: 'Inventory Tool Category',
    autoStatus: 'Automated Status',
    step5Title: '5. Data Access & Execution Authority',
    step5Desc: 'Set agent authority level and Supabase Row Level Security (RLS) tenant isolation guarantee.',
    readOnlyTitle: 'READ-ONLY (Analysis Mode)',
    readOnlyDesc: 'Swarm can only read stock data & compute reports. Cannot mutate stock directly.',
    readOnlyBadge: 'Secure (Default)',
    writeTitle: 'WRITE WITH APPROVAL',
    writeDesc: 'Agents can update product stock levels upon direct verification or instruction.',
    writeBadge: 'Write Access',
    securityGuaranteeTitle: 'ZEGA Tenant Graph Security Guarantee',
    securityGuaranteeDesc: 'All inventory queries are strictly tenant-isolated by store_id & organization_id. Agents from other stores cannot access this store data.',
    step6Title: '6. Final Review & AI Swarm Launch',
    step6Desc: 'Confirm configuration before deploying the AI Swarm workforce to your store.',
    readyToDeploy: 'Ready to Deploy',
    totalSubAgents: 'TOTAL SUB-AGENTS',
    agentsUnit: 'AI Agents',
    authority: 'AUTHORITY',
    costEst: 'COST ESTIMATE',
    costPerRun: '0.05 Credits/Run',
    tenantIso: 'TENANT ISOLATION',
    rlsEnforced: 'RLS Enforced',
    back: 'Back',
    next: 'Continue',
    deployNow: 'Deploy AI Swarm Now',
    deploying: 'Deploying Swarm...',
    defaultSwarmName: 'Store Inventory Intelligence Workforce',
    defaultSwarmDesc: 'Autonomous AI Swarm for stock monitoring, dead-stock detection, and automated reorder recommendations.',
  },
  zh: {
    modalTitle: '部署 AI 库存 Agent Swarm 集群',
    multiTenantSecure: '多租户安全隔离',
    stepOf: (step: number) => `第 ${step} 步（共 6 步）：`,
    steps: [
      '选择 Swarm 目标与核心任务',
      '自定义 Swarm 名称与团队',
      '分配 AI 模型引擎',
      '配置技能与工具矩阵',
      '数据访问与执行权限',
      '预览与部署 Swarm'
    ],
    deploymentFailed: '部署失败',
    step1Title: '1. 选择 AI Swarm 核心目标',
    step1Desc: '确定库存 AI 团队要执行的具体业务任务重心。',
    recommendedBadge: '官方推荐',
    workforceCount: (count: number) => `团队规模：${count} 个 AI 子代理`,
    selected: '已选择',
    clickToSelect: '点击选择',
    step2Title: '2. 自定义名称与团队结构',
    step2Desc: '命名 Swarm 身份标识并检查部署的自主代理结构。',
    swarmNameLabel: 'AI Swarm 名称',
    swarmNamePlaceholder: '例如：主店库存智能分析 Swarm',
    swarmDescLabel: '运营描述',
    swarmDescPlaceholder: '简短描述该 Swarm 的职责',
    structureLabel: 'AI 子代理结构（5 个子代理）：',
    defaultModel: '默认模型：',
    step3Title: '3. 为代理分配模型引擎',
    step3Desc: '根据速度与推理深度需求，为每个代理角色选择最佳 LLM 服务商。',
    step4Title: '4. 库存专用技能与工具矩阵',
    step4Desc: '所有代理均由受控工具沙盒保护。仅允许执行已验证的工具。',
    toolCategory: '库存工具类别',
    autoStatus: '自动状态',
    step5Title: '5. 数据访问与执行权限',
    step5Desc: '设置代理权限级别与 Supabase 行级安全 (RLS) 多租户隔离保障。',
    readOnlyTitle: '只读模式（分析模式）',
    readOnlyDesc: 'Swarm 仅能读取库存数据与计算分析报告。无法直接修改库存。',
    readOnlyBadge: '安全（默认）',
    writeTitle: '授权写入模式',
    writeDesc: '代理可在获得直接验证或指令后更新商品库存数量。',
    writeBadge: '写入权限',
    securityGuaranteeTitle: 'ZEGA 租户图谱安全保障',
    securityGuaranteeDesc: '所有库存查询均根据 store_id & organization_id 严格隔离。其他店铺的代理无法访问本店铺数据。',
    step6Title: '6. 最终审查与 AI Swarm 发布',
    step6Desc: '在将 AI Swarm 团队部署到您的店铺前确认配置。',
    readyToDeploy: '准备部署',
    totalSubAgents: '子代理总数',
    agentsUnit: '个 AI 代理',
    authority: '执行权限',
    costEst: '预估费用',
    costPerRun: '0.05 积分/次',
    tenantIso: '租户隔离',
    rlsEnforced: 'RLS 强制执行',
    back: '返回',
    next: '下一步',
    deployNow: '立即部署 AI Swarm',
    deploying: '正在部署 Swarm...',
    defaultSwarmName: '店铺库存智能 AI 团队',
    defaultSwarmDesc: '自主 AI Swarm 负责库存监控、死存检测和自动补货建议。',
  }
};

const OBJECTIVE_PRESETS_DATA: Record<string, { id: string; name: string; description: string; badge?: string; icon: any; agentsCount: number }[]> = {
  id: [
    {
      id: 'FULL_WORKFORCE',
      name: 'Workforce Inventaris Komprehensif',
      description: 'Tim AI lengkap (5 Agen) untuk pemantauan, deteksi stok mati, proyeksi permintaan, dan saran restok otomatis.',
      badge: 'Rekomendasi Utama',
      icon: Sparkles,
      agentsCount: 5,
    },
    {
      id: 'LOW_STOCK_MONITOR',
      name: 'Pemantauan & Deteksi Stok Menipis',
      description: 'Fokus pada monitoring realtime unit persediaan, peringatan dini saat persediaan di bawah batas minimum.',
      icon: AlertTriangle,
      agentsCount: 2,
    },
    {
      id: 'DEMAND_FORECASTING',
      name: 'Proyeksi Permintaan & Restok',
      description: 'Fokus pada kalkulasi estimasi hari stok habis dan perhitungan kuantitas pesanan ulang (reorder qty).',
      icon: Zap,
      agentsCount: 3,
    },
    {
      id: 'DEAD_STOCK_OPTIMIZER',
      name: 'Deteksi Stok Mati & Optimasi Modal',
      description: 'Analisis produk lambat terjual (slow-moving) dan modal terendap untuk promosi bundel clearance.',
      icon: ShieldCheck,
      agentsCount: 2,
    },
  ],
  en: [
    {
      id: 'FULL_WORKFORCE',
      name: 'Comprehensive Inventory Workforce',
      description: 'Full AI team (5 Agents) for stock monitoring, dead-stock detection, demand forecasting, and automated reorder recommendations.',
      badge: 'Top Recommendation',
      icon: Sparkles,
      agentsCount: 5,
    },
    {
      id: 'LOW_STOCK_MONITOR',
      name: 'Low Stock Monitoring & Alerts',
      description: 'Focus on real-time inventory monitoring and early alerts when stock falls below minimum thresholds.',
      icon: AlertTriangle,
      agentsCount: 2,
    },
    {
      id: 'DEMAND_FORECASTING',
      name: 'Demand Forecasting & Restock',
      description: 'Focus on calculating days-to-stockout and optimal reorder quantities.',
      icon: Zap,
      agentsCount: 3,
    },
    {
      id: 'DEAD_STOCK_OPTIMIZER',
      name: 'Dead Stock Detection & Capital Optimization',
      description: 'Analyze slow-moving items and tied-up capital for clearance bundle promotions.',
      icon: ShieldCheck,
      agentsCount: 2,
    },
  ],
  zh: [
    {
      id: 'FULL_WORKFORCE',
      name: '全功能库存 AI 团队',
      description: '完整 AI 团队（5 个代理）负责库存监控、死存检测、需求预测和自动补货建议。',
      badge: '官方推荐',
      icon: Sparkles,
      agentsCount: 5,
    },
    {
      id: 'LOW_STOCK_MONITOR',
      name: '低库存监控与预警',
      description: '专注于实时库存监控，并在库存低于最低门槛时发出预警。',
      icon: AlertTriangle,
      agentsCount: 2,
    },
    {
      id: 'DEMAND_FORECASTING',
      name: '需求预测与补货',
      description: '专注于计算库存耗尽天数与最佳补货数量 (Reorder Qty)。',
      icon: Zap,
      agentsCount: 3,
    },
    {
      id: 'DEAD_STOCK_OPTIMIZER',
      name: '滞销死存检测与资金优化',
      description: '分析滞销商品和沉淀资金，以便开展清仓促销。',
      icon: ShieldCheck,
      agentsCount: 2,
    },
  ]
};

const DEFAULT_AGENTS = [
  { role: 'COORDINATOR', name: 'Agent Director Swarm', modelId: 'groq/llama-3.3-70b-versatile', status: 'ACTIVE' },
  { role: 'INVENTORY_MONITOR', name: 'Agent Monitor Stok Realtime', modelId: 'groq/llama-3.3-70b-versatile', status: 'ACTIVE' },
  { role: 'DEMAND_FORECASTER', name: 'Agent Proyeksi Permintaan', modelId: 'google/gemini-2.5-flash', status: 'ACTIVE' },
  { role: 'STOCK_ANALYST', name: 'Agent Analis Stok Mati & Velositas', modelId: 'google/gemini-2.5-flash', status: 'ACTIVE' },
  { role: 'REORDER_ADVISOR', name: 'Agent Rekomendasi Restok', modelId: 'groq/llama-3.3-70b-versatile', status: 'ACTIVE' },
];

const AVAILABLE_MODELS = [
  { id: 'groq/llama-3.3-70b-versatile', name: 'Groq Llama 3.3 70B', provider: 'Groq', tier: 'Fast & Precise' },
  { id: 'google/gemini-2.5-flash', name: 'Google Gemini 2.5 Flash', provider: 'Google', tier: 'Analytical Engine' },
  { id: 'openrouter/deepseek-v3', name: 'DeepSeek V3 Reasoning', provider: 'OpenRouter', tier: 'Deep Reasoning' },
];

export const DeployInventorySwarmWizard: React.FC<DeployInventorySwarmWizardProps> = ({
  isOpen,
  onClose,
  onDeployed,
  storeId,
}) => {
  const { language, setLanguage } = useLanguage();
  const langKey = (language === 'zh' ? 'zh' : language === 'en' ? 'en' : 'id') as 'id' | 'en' | 'zh';
  const txt = SWARM_I18N[langKey];
  const presets = OBJECTIVE_PRESETS_DATA[langKey] || OBJECTIVE_PRESETS_DATA.id;

  const [step, setStep] = useState<number>(1);
  const [selectedObjective, setSelectedObjective] = useState<string>('FULL_WORKFORCE');
  const [swarmName, setSwarmName] = useState<string>(txt.defaultSwarmName);
  const [swarmDescription, setSwarmDescription] = useState<string>(txt.defaultSwarmDesc);
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [authorityMode, setAuthorityMode] = useState<'READ_ONLY' | 'WRITE_WITH_APPROVAL'>('READ_ONLY');
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNext = () => setStep((s) => Math.min(6, s + 1));
  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  const handleModelChange = (role: string, modelId: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.role === role ? { ...a, modelId } : a))
    );
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setErrorMsg(null);

    try {
      const idempotencyKey = `idem-swarm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const payload = {
        name: swarmName,
        description: swarmDescription,
        objective: selectedObjective,
        idempotencyKey,
        storeId,
        agents: agents.map((a) => ({
          ...a,
          authorityLevel: authorityMode,
        })),
      };

      const result = await SupabaseDashboardService.deployInventorySwarm(payload);

      if (result && result.success) {
        if (onDeployed) onDeployed(result.data?.swarm);
        onClose();
      } else {
        setErrorMsg(result?.error?.message || 'Gagal menyebarkan Swarm AI. Silakan coba lagi.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem saat mendeploy Swarm.');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 dark:bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-emerald-500 flex items-center justify-center shadow-md text-white shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-base md:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="truncate">{txt.modalTitle}</span>
                <span className="hidden xs:inline-block px-2 py-0.5 text-[9px] sm:text-xs font-black rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  {txt.multiTenantSecure}
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                {txt.stepOf(step)} {txt.steps[step - 1]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Responsive Language Switcher Badge */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 text-[10px] font-black">
              {(['id', 'en', 'zh'] as const).map((langCode) => (
                <button
                  key={langCode}
                  type="button"
                  onClick={() => setLanguage(langCode)}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-lg transition-all cursor-pointer uppercase ${
                    language === langCode
                      ? 'bg-orange-500 text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {langCode}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <div
            className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 h-1 transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 overflow-y-auto max-h-[60vh] sm:max-h-[65vh]">
          {errorMsg && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-bold">{txt.deploymentFailed}</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* STEP 1: Objective Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs sm:text-base font-black text-slate-900 dark:text-slate-100">{txt.step1Title}</h4>
                <p className="text-xs text-slate-500 font-medium">{txt.step1Desc}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {presets.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedObjective === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedObjective(preset.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-orange-50/60 dark:bg-orange-950/30 border-orange-500 dark:border-orange-500 shadow-md ring-1 ring-orange-500'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-orange-500 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          {preset.badge && (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                              {preset.badge}
                            </span>
                          )}
                        </div>
                        <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{preset.name}</h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">{preset.description}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 font-semibold">
                        <span>{txt.workforceCount(preset.agentsCount)}</span>
                        <span className={`font-black ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
                          {isSelected ? txt.selected : txt.clickToSelect}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Swarm & Workforce Setup */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs sm:text-base font-black text-slate-900 dark:text-slate-100">{txt.step2Title}</h4>
                <p className="text-xs text-slate-500 font-medium">{txt.step2Desc}</p>
              </div>

              <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{txt.swarmNameLabel}</label>
                  <input
                    type="text"
                    value={swarmName}
                    onChange={(e) => setSwarmName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-medium shadow-xs"
                    placeholder={txt.swarmNamePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{txt.swarmDescLabel}</label>
                  <input
                    type="text"
                    value={swarmDescription}
                    onChange={(e) => setSwarmDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-medium shadow-xs"
                    placeholder={txt.swarmDescPlaceholder}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{txt.structureLabel}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {agents.map((agent) => (
                    <div key={agent.role} className="p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-start gap-3 shadow-xs">
                      <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-500 shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">{agent.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0">{agent.role}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{txt.defaultModel} {agent.modelId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: AI Model Selection */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>{txt.step3Title}</span>
                  <span className="text-[11px] font-mono text-orange-500">Real AI Engine CDN</span>
                </h4>
                <p className="text-xs text-slate-500 font-medium">{txt.step3Desc}</p>
              </div>

              {/* Model Cards Selection matching Screenshot */}
              <div className="space-y-3">
                {[
                  {
                    id: 'groq/llama-3.3-70b-versatile',
                    name: '9Router Layer 5 Model Router',
                    description: 'Inference cost optimization & lowest multi-LLM auto-routing for inventory analytics',
                    badge: 'Selected',
                    logo: getR2CdnUrl('/assets/logo/9router.png'),
                    localLogo: '/assets/logo/9router.png',
                  },
                  {
                    id: 'openrouter/deepseek-v3',
                    name: 'DeepSeek R1 Demand Forecaster',
                    description: 'High-level reasoning model for predicting weekend product demand spikes.',
                    logo: getR2CdnUrl('/assets/logo/deepseek.webp'),
                    localLogo: '/assets/logo/deepseek.webp',
                  },
                  {
                    id: 'zeroclaw/realtime-rust',
                    name: 'ZeroClaw Realtime Inventory Audit',
                    description: 'Pure Rust ultra-lightweight agent for ultra-low latency real-time stock monitoring',
                    logo: getR2CdnUrl('/assets/logo/zeroclaw.jpeg'),
                    localLogo: '/assets/logo/zeroclaw.jpeg',
                  },
                  {
                    id: 'google/gemini-2.5-flash',
                    name: 'Google Gemini 2.5 Flash Analytical Engine',
                    description: 'High throughput multimodal model for instant catalog & image inventory analysis',
                    logo: getR2CdnUrl('/assets/logo/gemini.png'),
                    localLogo: '/assets/logo/gemini.png',
                  },
                ].map((m) => {
                  const isSelected = agents.some((a) => a.modelId === m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setAgents((prev) => prev.map((a) => ({ ...a, modelId: m.id })));
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex items-start gap-3.5 shadow-xs ${
                        isSelected
                          ? 'bg-orange-50/70 dark:bg-orange-950/30 border-orange-500 ring-1 ring-orange-500'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {/* Real Cloudflare R2 CDN Logo Container */}
                      <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-xs p-1">
                        <img
                          src={getR2CdnUrl(m.localLogo)}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            if (!img.src.endsWith(m.localLogo)) {
                              img.src = m.localLogo;
                            }
                          }}
                          className="size-7 rounded-lg object-contain"
                          alt={m.name}
                        />
                      </div>

                      {/* Info & Badge */}
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                            {m.name}
                          </h5>
                          {isSelected && (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-orange-500 text-white shadow-xs shrink-0">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">
                          {m.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Per-Agent Model Allocation Dropdown Matrix */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Alokasi Model Spesifik per Sub-Agen AI:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {agents.map((agent) => (
                    <div
                      key={agent.role}
                      className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate">
                        {agent.name}
                      </span>
                      <select
                        value={agent.modelId}
                        onChange={(e) => handleModelChange(agent.role, e.target.value)}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer shrink-0"
                      >
                        <option value="groq/llama-3.3-70b-versatile">9Router Layer 5</option>
                        <option value="openrouter/deepseek-v3">DeepSeek R1</option>
                        <option value="zeroclaw/realtime-rust">ZeroClaw Rust</option>
                        <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Skills & Tools Matrix */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs sm:text-base font-black text-slate-900 dark:text-slate-100">{txt.step4Title}</h4>
                <p className="text-xs text-slate-500 font-medium">{txt.step4Desc}</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                    <span>{txt.toolCategory}</span>
                    <span>{txt.autoStatus}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                    {[
                      'inventory.get_stock_metrics',
                      'inventory.get_low_stock_products',
                      'inventory.detect_dead_stock',
                      'inventory.get_sales_velocity',
                      'inventory.forecast_demand',
                      'inventory.get_reorder_recommendations'
                    ].map((toolName) => (
                      <div key={toolName} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
                        <span className="font-mono text-[10px] sm:text-[11px] truncate pr-2">{toolName}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Data Access & Permissions */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs sm:text-base font-black text-slate-900 dark:text-slate-100">{txt.step5Title}</h4>
                <p className="text-xs text-slate-500 font-medium">{txt.step5Desc}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div
                  onClick={() => setAuthorityMode('READ_ONLY')}
                  className={`p-4 sm:p-4.5 rounded-2xl border cursor-pointer transition-all ${
                    authorityMode === 'READ_ONLY'
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-500 shadow-md ring-1 ring-emerald-500'
                      : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black">{txt.readOnlyBadge}</span>
                  </div>
                  <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{txt.readOnlyTitle}</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">{txt.readOnlyDesc}</p>
                </div>

                <div
                  onClick={() => setAuthorityMode('WRITE_WITH_APPROVAL')}
                  className={`p-4 sm:p-4.5 rounded-2xl border cursor-pointer transition-all ${
                    authorityMode === 'WRITE_WITH_APPROVAL'
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-500 dark:border-amber-500 shadow-md ring-1 ring-amber-500'
                      : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black">{txt.writeBadge}</span>
                  </div>
                  <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{txt.writeTitle}</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">{txt.writeDesc}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <Lock className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 font-medium">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{txt.securityGuaranteeTitle}</p>
                  <p>{txt.securityGuaranteeDesc}</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Review & Deploy */}
          {step === 6 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs sm:text-base font-black text-slate-900 dark:text-slate-100">{txt.step6Title}</h4>
                <p className="text-xs text-slate-500 font-medium">{txt.step6Desc}</p>
              </div>

              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h5 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100">{swarmName}</h5>
                    <p className="text-xs text-slate-500 font-medium">{swarmDescription}</p>
                  </div>
                  <span className="px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-black rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                    {txt.readyToDeploy}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                  <div className="p-2.5 sm:p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="text-slate-400 block text-[10px] font-bold">{txt.totalSubAgents}</span>
                    <span className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm mt-0.5 block">{agents.length} {txt.agentsUnit}</span>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="text-slate-400 block text-[10px] font-bold">{txt.authority}</span>
                    <span className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm mt-0.5 block truncate">{authorityMode}</span>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="text-slate-400 block text-[10px] font-bold">{txt.costEst}</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm mt-0.5 block truncate">{txt.costPerRun}</span>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="text-slate-400 block text-[10px] font-bold">{txt.tenantIso}</span>
                    <span className="font-black text-orange-600 dark:text-orange-400 text-xs sm:text-sm mt-0.5 block truncate">{txt.rlsEnforced}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 1 || isDeploying}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              step === 1 || isDeploying
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            {txt.back}
          </button>

          {step < 6 ? (
            <button
              onClick={handleNext}
              className="px-4.5 sm:px-5 py-2.5 rounded-xl text-xs font-black bg-orange-500 hover:bg-orange-600 text-white shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
            >
              {txt.next}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="px-5 sm:px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isDeploying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {txt.deploying}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {txt.deployNow}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
