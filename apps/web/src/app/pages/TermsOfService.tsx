import { ArrowLeft } from 'lucide-react';

export function TermsOfService({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl flex items-center gap-3 px-6 py-4">
          <button
            onClick={onBack}
            className="grid size-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={15} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Terms of Service</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Last updated: July 29, 2026</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-10 md:py-14">
        <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the ZEGA AI platform ("Service"), operated by ZEGA AI ("Company", "we", "us"),
              you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">2. Description of Service</h2>
            <p>
              ZEGA AI is an enterprise autonomous agent orchestration platform providing AI-powered workflow automation,
              multi-agent management, sandbox execution environments, and enterprise integration services.
              The Service includes web dashboards, API endpoints, and related tools.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">3. User Accounts & Registration</h2>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>You must provide accurate, complete registration information.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must be at least 18 years old or the age of majority in your jurisdiction.</li>
              <li>One person or entity may not maintain more than one free account.</li>
              <li>You are responsible for all activities that occur under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">4. Acceptable Use Policy</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Use the Service for any unlawful purpose or in violation of applicable laws.</li>
              <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
              <li>Deploy AI agents that generate harmful, misleading, or illegal content.</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Service.</li>
              <li>Transmit viruses, malware, or other malicious code through the platform.</li>
              <li>Bypass or circumvent rate limits, authentication mechanisms, or security controls.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">5. AI Agent Usage & Guardrails</h2>
            <p>
              AI agents deployed on the ZEGA AI platform operate within defined guardrails.
              You acknowledge that AI outputs are generated autonomously and may not always be accurate.
              You retain full responsibility for reviewing, validating, and acting on AI-generated outputs.
              The Company implements safety filters and content moderation but does not guarantee the prevention of all harmful outputs.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">6. Intellectual Property</h2>
            <p>
              The Service, including its design, architecture, code, and branding, is the property of ZEGA AI
              and is protected by intellectual property laws. You retain ownership of the data you submit to the platform.
              By using the Service, you grant us a limited license to process your data solely for the purpose of providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">7. Payment & Billing</h2>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Paid plans are billed in advance on a monthly or annual basis.</li>
              <li>All fees are non-refundable except as required by law or stated in our refund policy.</li>
              <li>We reserve the right to modify pricing with 30 days' prior notice.</li>
              <li>Credit usage is tracked per-account and is non-transferable between accounts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">8. Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption at rest and in transit,
              row-level security (RLS) policies, rate limiting, and OWASP ASVS 4.0 compliance.
              However, no system is 100% secure, and you acknowledge the inherent risks of transmitting data online.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">9. Service Availability & SLA</h2>
            <p>
              We strive for 99.9% uptime but do not guarantee uninterrupted availability.
              Scheduled maintenance windows will be communicated in advance.
              Enterprise customers may have separate SLA agreements with defined uptime guarantees and remedies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, ZEGA AI shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or any loss of profits or revenue,
              whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses
              resulting from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">11. Termination</h2>
            <p>
              We may terminate or suspend access to our Service immediately, without prior notice,
              for any breach of these Terms. Upon termination, your right to use the Service will cease immediately.
              You may export your data within 30 days of termination through the platform's export functionality.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of Indonesia,
              without regard to conflict of law provisions. Any disputes shall be resolved through binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be communicated via email
              or through a prominent notice on the platform at least 14 days before they take effect.
              Continued use of the Service after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">14. Contact</h2>
            <p>
              For questions about these Terms, contact us at{' '}
              <a href="mailto:legal@zegaai.site" className="font-medium underline underline-offset-2 hover:text-[#e05638] transition-colors">
                legal@zegaai.site
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">© 2026 ZEGA AI. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
