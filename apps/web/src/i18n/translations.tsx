import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'id' | 'zh';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'zh', name: 'Chinese', nativeName: '中文 (简体)', flag: '🇨🇳' },
];

export const TRANSLATIONS = {
  en: {
    nav: {
      home: 'Home',
      products: 'Products',
      docs: 'Docs',
      pricing: 'Pricing',
      console: 'Console',
      tryNow: 'Try Now',
    },
    hero: {
      title: 'Tailored Plans for Every Enterprise Need',
      subtitle: 'Flexible plans that fit your workflow and scale seamlessly with your enterprise.',
      tryFree: 'Try Free',
      enterEmail: 'Enter Your Email',
    },
    console: {
      dashboard: 'Overview Architecture',
      agentRoster: 'Agents & Swarm',
      sandbox: 'Sandbox Canvas v2',
      missionControl: 'Mission Control',
      integrations: 'Integrations',
      guardrails: 'AI Guardrails',
      analytics: 'Analytics & Models',
      billing: 'Billing & Usage',
      settings: 'Console Settings',
      activeAgents: 'Active Autonomous Agents',
      successfulRuns: 'Successful Runs',
      automatedActions: 'Automated Actions',
      creditsUsed: 'Credits Used',
      orchestrationTier: 'Orchestration Tier',
      addAgent: 'Add Agent',
      addConnector: 'Add Connector',
      connected: 'Connected',
      applyChanges: 'Apply Changes',
      liveSync: 'LIVE SUPABASE SYNC',
      searchIntegrations: 'Search integrations...',
      searchAgents: 'Search agents...',
      language: 'Language',
    },
    auth: {
      title: 'Sign In to ZEGA AI',
      individualTab: 'Individual & UMKM',
      enterpriseTab: 'Enterprise Scale',
      emailLabel: 'Email Address',
      passwordLabel: 'Password',
      signInBtn: 'Sign In',
      signUpBtn: 'Sign Up',
      orDivider: 'OR',
      continueWithGoogle: 'Continue with Google',
      continueWithGithub: 'Continue with GitHub',
      demoModeBtn: '1-Click Enterprise Demo',
    }
  },
  id: {
    nav: {
      home: 'Beranda',
      products: 'Produk',
      docs: 'Dokumentasi',
      pricing: 'Harga',
      console: 'Konsol',
      tryNow: 'Coba Sekarang',
    },
    hero: {
      title: 'Rencana yang Disesuaikan untuk Setiap Kebutuhan Enterprise',
      subtitle: 'Paket fleksibel yang sesuai dengan alur kerja Anda dan berkembang tanpa hambatan bersama bisnis Anda.',
      tryFree: 'Coba Gratis',
      enterEmail: 'Masukkan Email Anda',
    },
    console: {
      dashboard: 'Arsitektur Utama',
      agentRoster: 'Agen & Swarm',
      sandbox: 'Kanvas Sandbox v2',
      missionControl: 'Pusat Misi',
      integrations: 'Integrasi Tool',
      guardrails: 'Keamanan AI Guardrails',
      analytics: 'Analitik & Model',
      billing: 'Tagihan & Penggunaan',
      settings: 'Pengaturan Konsol',
      activeAgents: 'Agen Otonom Aktif',
      successfulRuns: 'Eksekusi Berhasil',
      automatedActions: 'Tindakan Otomatis',
      creditsUsed: 'Kredit Terpakai',
      orchestrationTier: 'Tingkat Orkestrasi',
      addAgent: 'Tambah Agen',
      addConnector: 'Tambah Konektor',
      connected: 'Terhubung',
      applyChanges: 'Terapkan Perubahan',
      liveSync: 'SINKRONISASI SUPABASE LANGSUNG',
      searchIntegrations: 'Cari integrasi...',
      searchAgents: 'Cari agen...',
      language: 'Bahasa',
    },
    auth: {
      title: 'Masuk ke ZEGA AI',
      individualTab: 'Individu & UMKM',
      enterpriseTab: 'Skala Enterprise',
      emailLabel: 'Alamat Email',
      passwordLabel: 'Kata Sandi',
      signInBtn: 'Masuk',
      signUpBtn: 'Daftar',
      orDivider: 'ATAU',
      continueWithGoogle: 'Lanjutkan dengan Google',
      continueWithGithub: 'Lanjutkan dengan GitHub',
      demoModeBtn: 'Demo Enterprise 1-Klik',
    }
  },
  zh: {
    nav: {
      home: '首页',
      products: '产品',
      docs: '文档',
      pricing: '定价',
      console: '控制台',
      tryNow: '立即体验',
    },
    hero: {
      title: '为各种企业需求量身定制的方案',
      subtitle: '灵活的方案适应您的工作流程，随企业规模无缝扩展。',
      tryFree: '免费体验',
      enterEmail: '输入您的电子邮件',
    },
    console: {
      dashboard: '核心架构',
      agentRoster: '代理群',
      sandbox: '沙盒画布 v2',
      missionControl: '任务控制中心',
      integrations: '工具集成',
      guardrails: 'AI 安全防护',
      analytics: '分析与模型',
      billing: '账单与使用量',
      settings: '控制台设置',
      activeAgents: '活跃自主代理',
      successfulRuns: '成功运行',
      automatedActions: '自动化操作',
      creditsUsed: '已用积分',
      orchestrationTier: '编排层级',
      addAgent: '添加代理',
      addConnector: '添加连接器',
      connected: '已连接',
      applyChanges: '应用更改',
      liveSync: 'SUPABASE 实时同步',
      searchIntegrations: '搜索集成...',
      searchAgents: '搜索代理...',
      language: '语言',
    },
    auth: {
      title: '登录 ZEGA AI',
      individualTab: '个人与中小微企业',
      enterpriseTab: '企业级规模',
      emailLabel: '电子邮件',
      passwordLabel: '密码',
      signInBtn: '登录',
      signUpBtn: '注册',
      orDivider: '或',
      continueWithGoogle: '使用 Google 账号登录',
      continueWithGithub: '使用 GitHub 账号登录',
      demoModeBtn: '一键企业版演示',
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof TRANSLATIONS['en'];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: TRANSLATIONS.en,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('zega_language');
    if (saved && (saved === 'en' || saved === 'id' || saved === 'zh')) {
      return saved as Language;
    }
    return 'en';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('zega_language', lang);
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return React.createElement(LanguageContext.Provider, { value: { language, setLanguage, t } }, children);
};

export const useLanguage = () => useContext(LanguageContext);
