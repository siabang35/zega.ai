import React from 'react';
import { Lock } from 'lucide-react';

export function RbacSsoView() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Lock size={16} className="text-indigo-600 dark:text-indigo-400" />
            Enterprise RBAC & SAML/Okta SSO Integration
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
            Hak akses granular, isolasi workspace, dan otentikasi single sign-on.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-mono space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-500">SSO Connection Status:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">● Okta SAML 2.0 (Active)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Enforced Multi-Factor Auth:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">FIDO2 / Hardware Security Key</span>
        </div>
      </div>
    </div>
  );
}
