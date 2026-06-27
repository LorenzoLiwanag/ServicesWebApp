import { Link } from "react-router-dom";
import "../styles/privacyPolicy.css";

const LAST_UPDATED = "June 27, 2026";

const PrivacyPolicyPage = () => {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <header className="privacy-header">
          <Link to="/" className="privacy-back">&larr; Back to home</Link>
          <h1>Privacy Policy</h1>
          <p className="privacy-updated">Last updated: {LAST_UPDATED}</p>
        </header>

        <section className="privacy-section">
          <p>
            Subic Bay Home Services ("we", "us", or "our") is committed to
            protecting your privacy. This Privacy Policy explains how we collect,
            use, share, and safeguard your information when you use our website and
            services to connect clients with home service providers.
          </p>
        </section>

        <section className="privacy-section">
          <h2>1. Information We Collect</h2>
          <ul>
            <li>
              <strong>Account information</strong> you provide when registering,
              such as your name, email address, phone number, and password.
            </li>
            <li>
              <strong>Profile and service details</strong>, including the services
              you offer or request, locations, and booking history.
            </li>
            <li>
              <strong>Contact form submissions</strong>, including your name,
              email, subject, and message.
            </li>
            <li>
              <strong>Usage data</strong>, such as pages visited, device and
              browser information, and approximate location, collected
              automatically to help us improve the platform.
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To create and manage your account and provide our services.</li>
            <li>To connect clients with providers and facilitate bookings.</li>
            <li>To respond to your inquiries and contact form messages.</li>
            <li>To send service-related notifications and updates.</li>
            <li>To maintain the security, integrity, and performance of the platform.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. How We Share Information</h2>
          <p>
            We do not sell your personal information. We share information only as
            necessary to operate the platform — for example, sharing relevant
            booking details between a client and the provider they engage, or with
            trusted service providers who help us run our infrastructure (such as
            hosting and email delivery). We may also disclose information where
            required by law.
          </p>
        </section>

        <section className="privacy-section">
          <h2>4. Data Security</h2>
          <p>
            We use reasonable technical and organizational measures to protect your
            information against unauthorized access, alteration, disclosure, or
            destruction. Passwords are stored using industry-standard hashing. No
            method of transmission or storage is completely secure, so we cannot
            guarantee absolute security.
          </p>
        </section>

        <section className="privacy-section">
          <h2>5. Data Retention</h2>
          <p>
            We retain your information for as long as your account is active or as
            needed to provide our services, comply with our legal obligations,
            resolve disputes, and enforce our agreements. You may request deletion
            of your account and associated data at any time.
          </p>
        </section>

        <section className="privacy-section">
          <h2>6. Your Rights</h2>
          <p>
            Depending on your location, you may have the right to access, correct,
            update, or delete your personal information, and to object to or
            restrict certain processing. To exercise these rights, contact us using
            the details below.
          </p>
        </section>

        <section className="privacy-section">
          <h2>7. Cookies</h2>
          <p>
            We use cookies and similar technologies to keep you signed in, remember
            your preferences, and understand how the platform is used. You can
            control cookies through your browser settings, though some features may
            not function properly if cookies are disabled.
          </p>
        </section>

        <section className="privacy-section">
          <h2>8. Children's Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 18, and
            we do not knowingly collect personal information from children.
          </p>
        </section>

        <section className="privacy-section">
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will
            revise the "Last updated" date above. Your continued use of the platform
            after changes take effect constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="privacy-section">
          <h2>10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or how we handle your
            information, please reach out through our{" "}
            <Link to="/#contact">contact form</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
