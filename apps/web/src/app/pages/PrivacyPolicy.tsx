import { ArrowLeft } from 'lucide-react';

export function PrivacyPolicy({ onBack }: { onBack: () => void }) {
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
            <h1 className="text-sm font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Last updated: July 29, 2026</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-10 md:py-14">
        <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">1. Introduction</h2>
            <p>
              ZEGA AI ("Company", "we", "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our
              platform at zegaai.site ("Service"). By using the Service, you consent to the data practices
              described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">2. Information We Collect</h2>

            <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-1.5">2.1 Information You Provide</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Account Data:</strong> Email address, full name, company name, and role when registering.</li>
              <li><strong>Communication Data:</strong> Messages, feedback, and support inquiries you send us.</li>
              <li><strong>Payment Data:</strong> Billing information processed through our third-party payment provider (Stripe). We do not store full card numbers.</li>
              <li><strong>Agent & Workflow Data:</strong> AI agent configurations, workflow definitions, and sandbox execution inputs/outputs you create.</li>
            </ul>

            <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-1.5">2.2 Automatically Collected Data</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Device Information:</strong> Browser type, operating system, screen resolution, and device identifiers.</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, session duration, and interaction patterns.</li>
              <li><strong>Network Data:</strong> IP address, approximate geolocation (country/region), and referring URL.</li>
              <li><strong>Security Data:</strong> Cloudflare Turnstile verification tokens and rate-limiting metadata.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Provide, maintain, and improve the Service and its features.</li>
              <li>Authenticate your identity and manage user sessions.</li>
              <li>Send transactional communications (OTP codes, password resets, account notifications).</li>
              <li>Monitor and prevent fraudulent activity, abuse, and security threats.</li>
              <li>Enforce rate limits and comply with OWASP ASVS 4.0 security standards.</li>
              <li>Generate aggregated, anonymized analytics to improve platform performance.</li>
              <li>Process payments and manage billing (via Stripe).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">4. Cookies & Local Storage</h2>
            <p className="mb-2">We use the following types of cookies and browser storage:</p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse mt-2">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                    <th className="py-2 pr-4 font-semibold text-slate-800 dark:text-slate-200">Category</th>
                    <th className="py-2 pr-4 font-semibold text-slate-800 dark:text-slate-200">Purpose</th>
                    <th className="py-2 font-semibold text-slate-800 dark:text-slate-200">Example</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 dark:text-slate-400">
                  <tr className="border-b border-slate-100 dark:border-slate-800/60">
                    <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300">Essential</td>
                    <td className="py-2 pr-4">Authentication, session management</td>
                    <td className="py-2 font-mono text-[10px]">zega_session, sb-access-token</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800/60">
                    <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300">Functional</td>
                    <td className="py-2 pr-4">Language preference, theme setting</td>
                    <td className="py-2 font-mono text-[10px]">zega_language, zega_theme</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800/60">
                    <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300">Analytics</td>
                    <td className="py-2 pr-4">Usage patterns, performance monitoring</td>
                    <td className="py-2 font-mono text-[10px]">zega_cache_*</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300">Personalization</td>
                    <td className="py-2 pr-4">Tailored content and recommendations</td>
                    <td className="py-2 font-mono text-[10px]">Optional, consent-based</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3">
              You can manage cookie preferences at any time through the cookie settings in the platform footer.
              Essential cookies cannot be disabled as they are required for the Service to function.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">5. Data Storage & Security</h2>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>User data is stored in <strong>Supabase PostgreSQL</strong> with Row-Level Security (RLS) enforced on all tables.</li>
              <li>All data is encrypted in transit (TLS 1.3) and at rest (AES-256).</li>
              <li>Session tokens are stored with secure cookie attributes (HttpOnly, SameSite, Secure).</li>
              <li>Static assets are served via <strong>Cloudflare CDN</strong> with DDoS protection.</li>
              <li>Security audit logs track authentication events, session changes, and admin actions.</li>
              <li>We conduct regular security reviews following OWASP guidelines.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">6. Data Sharing & Third Parties</h2>
            <p className="mb-2">We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Supabase:</strong> Database hosting and authentication infrastructure.</li>
              <li><strong>Cloudflare:</strong> CDN, DNS, DDoS protection, and Turnstile bot defense.</li>
              <li><strong>Brevo:</strong> Transactional email delivery (OTP codes).</li>
              <li><strong>Stripe:</strong> Payment processing (PCI DSS compliant).</li>
              <li><strong>AI Model Providers:</strong> OpenAI, Anthropic, Google AI — only the data you explicitly submit for agent processing.</li>
              <li><strong>Legal Obligations:</strong> When required by law, court order, or government regulation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">7. Your Rights</h2>
            <p className="mb-2">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete personal data.</li>
              <li><strong>Deletion:</strong> Request erasure of your personal data ("right to be forgotten").</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Objection:</strong> Object to processing of your data for specific purposes.</li>
              <li><strong>Restriction:</strong> Request limitation of data processing under certain conditions.</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact{' '}
              <a href="mailto:privacy@zegaai.site" className="font-medium underline underline-offset-2 hover:text-[#e05638] transition-colors">
                privacy@zegaai.site
              </a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">8. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide the Service.
              After account deletion, we retain anonymized usage data for analytics purposes.
              Security audit logs are retained for 12 months. Expired session tokens and cache data are automatically
              purged through scheduled database cleanup procedures.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">9. Children's Privacy</h2>
            <p>
              The Service is not directed to individuals under the age of 18.
              We do not knowingly collect personal information from children.
              If we become aware that we have collected data from a child, we will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">10. International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries outside your jurisdiction.
              We ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs)
              where required by applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. Material changes will be communicated via email
              or through a prominent notice on the platform. The "Last updated" date at the top indicates the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">12. Contact Us</h2>
            <p>
              For any privacy-related questions or concerns, contact our Data Protection team at{' '}
              <a href="mailto:privacy@zegaai.site" className="font-medium underline underline-offset-2 hover:text-[#e05638] transition-colors">
                privacy@zegaai.site
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
