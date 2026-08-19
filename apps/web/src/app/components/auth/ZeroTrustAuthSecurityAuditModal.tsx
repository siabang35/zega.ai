import React, { useState } from 'react';
import { securityAuditor, TestResult } from '../../../test_zero_trust_auth_strength';

interface ZeroTrustAuthSecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZeroTrustAuthSecurityAuditModal: React.FC<ZeroTrustAuthSecurityAuditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditResults, setAuditResults] = useState<{
    total: number;
    passed: number;
    failed: number;
    results: TestResult[];
  } | null>(null);

  if (!isOpen) return null;

  const handleRunAudit = () => {
    setAuditRunning(true);
    setTimeout(() => {
      const summary = securityAuditor.runFullAuditSuite();
      setAuditResults(summary);
      setAuditRunning(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-950 text-slate-100 shadow-2xl shadow-emerald-950/40">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              🛡️
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-lg">OWASP Zero-Trust Auth Security Auditor</h3>
              <p className="text-xs text-slate-400">Live multi-role isolation, anti-tamper, & zero-fallback strength audit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
          
          {/* Audit Controls & Status */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div>
              <p className="text-sm font-medium text-slate-200">Test Execution Control</p>
              <p className="text-xs text-slate-400">Executes storage tampering simulation, fallback audit, and role isolation checks.</p>
            </div>
            <button
              onClick={handleRunAudit}
              disabled={auditRunning}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer"
            >
              {auditRunning ? (
                <>
                  <span className="size-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Running Audit...
                </>
              ) : (
                '▶ Run Security Audit'
              )}
            </button>
          </div>

          {/* Results Summary Box */}
          {auditResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Audits</p>
                  <p className="text-2xl font-bold text-slate-200 mt-1">{auditResults.total}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-center">
                  <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">Passed</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{auditResults.passed}</p>
                </div>
                <div className={`rounded-xl border p-4 text-center ${auditResults.failed > 0 ? 'border-rose-500/30 bg-rose-950/20' : 'border-slate-800 bg-slate-900/50'}`}>
                  <p className={`text-xs uppercase tracking-wider font-semibold ${auditResults.failed > 0 ? 'text-rose-400' : 'text-slate-400'}`}>Failed</p>
                  <p className={`text-2xl font-bold mt-1 ${auditResults.failed > 0 ? 'text-rose-400' : 'text-slate-200'}`}>{auditResults.failed}</p>
                </div>
              </div>

              {/* Detailed Test Cases */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audit Log Output</h4>
                <div className="space-y-2">
                  {auditResults.results.map((res, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-4 transition-all ${
                        res.passed
                          ? 'border-emerald-500/20 bg-slate-900/60'
                          : 'border-rose-500/30 bg-rose-950/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            res.passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {res.passed ? 'PASS' : 'FAIL'}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">[{res.category}]</span>
                          <span className="text-sm font-medium text-slate-100">{res.testName}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 mt-2 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        {res.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 bg-slate-900/80 px-6 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
          >
            Close Auditor
          </button>
        </div>

      </div>
    </div>
  );
};
