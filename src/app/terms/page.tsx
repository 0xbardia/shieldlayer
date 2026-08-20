import Link from "next/link";

export const metadata = {
  title: "Terms of Service | ShieldLayer",
  description: "Terms of service for ShieldLayer parametric insurance on GenLayer.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: August 18, 2026</p>

      <div className="prose prose-slate mt-8 dark:prose-invert">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using ShieldLayer (&quot;the Service&quot;), you agree to be
          bound by these Terms of Service. If you do not agree to these terms,
          do not use the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          ShieldLayer is a parametric insurance platform built on the GenLayer network.
          It allows users to purchase insurance policies for flight delays,
          storms, and bankruptcy events. Claims are automatically verified by AI
          validators and settled on-chain.
        </p>

        <h2>3. User Responsibilities</h2>
        <p>You are responsible for:</p>
        <ul>
          <li>Maintaining the security of your wallet and private keys</li>
          <li>All transactions made from your wallet</li>
          <li>Providing accurate information when purchasing policies</li>
          <li>Understanding the risks of blockchain-based insurance</li>
          <li>Complying with all applicable laws and regulations</li>
        </ul>

        <h2>4. Risks and Disclaimers</h2>
        <p>
          <strong>This is NOT financial advice.</strong> By using this Service,
          you acknowledge and accept the following risks:
        </p>
        <ul>
          <li>
            <strong>Blockchain Risks:</strong> Transactions are irreversible.
            Once confirmed on the blockchain, they cannot be undone.
          </li>
          <li>
            <strong>Smart Contract Risks:</strong> Smart contracts may contain
            bugs or vulnerabilities. While we audit our code, no smart contract
            is 100% secure.
          </li>
          <li>
            <strong>AI Verification Risks:</strong> Claims are verified by AI
            validators. While we strive for accuracy, AI decisions may
            occasionally be incorrect.
          </li>
          <li>
            <strong>Market Risks:</strong> The value of tokens and premiums may
            fluctuate.
          </li>
          <li>
            <strong>Regulatory Risks:</strong> Blockchain regulations vary by
            jurisdiction and may change.
          </li>
        </ul>

        <h2>5. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, ShieldLayer and its operators shall
          not be liable for any indirect, incidental, special, consequential, or
          punitive damages, including but not limited to loss of profits, data,
          or other intangible losses, resulting from:
        </p>
        <ul>
          <li>Your use of or inability to use the Service</li>
          <li>Any unauthorized access to or alteration of your data</li>
          <li>Smart contract vulnerabilities or failures</li>
          <li>AI verification errors</li>
          <li>Blockchain network congestion or failures</li>
        </ul>

        <h2>6. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless ShieldLayer and its operators from
          any claims, losses, or damages arising from your use of the Service or
          violation of these Terms.
        </p>

        <h2>7. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with
          applicable laws, without regard to conflict of law principles.
        </p>

        <h2>8. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. Changes will
          be effective upon posting. Your continued use of the Service after
          changes constitutes acceptance of the modified Terms.
        </p>

        <h2>9. Severability</h2>
        <p>
          If any provision of these Terms is found to be unenforceable, the
          remaining provisions shall remain in full force and effect.
        </p>

        <h2>10. Contact</h2>
        <p>
          For questions about these Terms, contact us through the GenLayer
          community channels.
        </p>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
