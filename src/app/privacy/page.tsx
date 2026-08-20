import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | ShieldLayer",
  description: "Privacy policy for ShieldLayer parametric insurance on GenLayer.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: August 18, 2026</p>

      <div className="prose prose-slate mt-8 dark:prose-invert">
        <h2>1. Information We Collect</h2>
        <p>
          When you use ShieldLayer, we collect minimal information necessary to provide
          our parametric insurance services:
        </p>
        <ul>
          <li>
            <strong>Wallet Address:</strong> Your public blockchain address is
            used to identify your policies and claims. This is public information
            on the blockchain.
          </li>
          <li>
            <strong>Policy Data:</strong> Information you provide when purchasing
            policies (event data, coverage amounts, policy types).
          </li>
          <li>
            <strong>Transaction Data:</strong> Blockchain transactions are
            public and immutable. We do not control this data.
          </li>
          <li>
            <strong>Usage Data:</strong> We may collect anonymized usage
            statistics to improve our service.
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Process policy purchases and claims</li>
          <li>Verify claim validity through AI validators</li>
          <li>Communicate with you about your policies</li>
          <li>Improve our service and user experience</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>3. Data Storage</h2>
        <p>
          Your policy and claim data is stored on the GenLayer blockchain, which
          is decentralized and immutable. Once recorded, this data cannot be
          altered or deleted. We also maintain a local cache for faster access,
          but the blockchain remains the authoritative source.
        </p>

        <h2>4. Third-Party Services</h2>
        <p>We integrate with:</p>
        <ul>
          <li>
            <strong>GenLayer Network:</strong> Decentralized AI validators for
            claim verification
          </li>
          <li>
            <strong>MetaMask / WalletConnect:</strong> Wallet providers for
            transaction signing
          </li>
          <li>
            <strong>Blockchain Explorers:</strong> For transaction verification
          </li>
        </ul>
        <p>
          These services have their own privacy policies. We encourage you to
          review them.
        </p>

        <h2>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data (subject to blockchain limitations)</li>
          <li>Object to processing of your data</li>
          <li>Data portability</li>
        </ul>
        <p>
          Note: Due to the immutable nature of blockchain, some data cannot be
          deleted once recorded on-chain.
        </p>

        <h2>6. Security</h2>
        <p>
          We implement industry-standard security measures to protect your data.
          However, no method of transmission over the Internet is 100% secure.
          We cannot guarantee absolute security.
        </p>

        <h2>7. Children&apos;s Privacy</h2>
        <p>
          Our service is not intended for children under 18. We do not knowingly
          collect personal information from children.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. We will notify
          you of any changes by posting the new policy on this page with an
          updated &quot;Last updated&quot; date.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          If you have any questions about this privacy policy, please contact us
          through the GenLayer community channels or via the contact information
          provided on our website.
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
