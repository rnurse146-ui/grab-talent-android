import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-5 py-12 safe-top safe-bottom">
        <div className="flex items-center gap-3 mb-8">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-primary">
            <Shield className="w-6 h-6 text-primary-foreground" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Grab Talent — last updated 1 September 2026</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground selectable-text">
          <p>
            Grab Talent ("we", "us", "our") operates the Grab Talent mobile application and website
            (together, the "Service"). This Privacy Policy explains how we collect, use, and protect
            your personal information when you use the Service. By using the Service, you agree to the
            practices described below.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account information:</strong> name, email address, and password (stored securely and hashed).</li>
              <li><strong>Profile information:</strong> stage name, talent category, bio, location city, profile photo and media, hourly rate, and social links you choose to add.</li>
              <li><strong>Booking information:</strong> event details, venue address, contact phone number, and booking messages.</li>
              <li><strong>Usage data:</strong> device identifiers, app interactions, and approximate location used to match talent by city.</li>
              <li><strong>Identity verification:</strong> if you choose to become a verified talent, an uploaded ID document and verification selfie.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and manage your account and authenticate you.</li>
              <li>To display talent profiles and enable seekers to discover, save, and book talent.</li>
              <li>To process booking requests, calculate pricing and platform commission, and facilitate payments.</li>
              <li>To allow messaging between seekers and talent, with contact details restricted until a booking is confirmed.</li>
              <li>To verify the identity of talent and maintain trust and safety, including a three-strike policy for late cancellations.</li>
              <li>To send service notifications, such as booking updates and reminders.</li>
              <li>To comply with legal obligations and prevent fraud or abuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Sharing Your Information</h2>
            <p>
              We do not sell your personal data. We share information only as necessary to operate the Service:
              with the other party in a booking (e.g., venue address after confirmation), with payment processors
              to handle transactions, with cloud hosting and infrastructure providers, and when required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Retention</h2>
            <p>
              We retain your account and booking data for as long as your account is active, and afterwards as
              needed to meet legal, accounting, or reporting requirements. You may request deletion of your
              account at any time from the in-app Settings, which removes your profile and associated data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Your Rights</h2>
            <p>
              Depending on your location (including under the UK GDPR), you may have the right to access, correct,
              export, or delete your personal data, and to object to or restrict certain processing. To exercise
              these rights, contact us using the details below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Security</h2>
            <p>
              We use reasonable technical and organisational measures to protect your data, including encrypted
              password storage and access controls. However, no method of transmission over the internet is
              completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Children's Privacy</h2>
            <p>
              The Service is not intended for anyone under 18. We do not knowingly collect personal data from
              children. If you believe a child has provided us with personal data, contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes within
              the app and update the "last updated" date above.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or your personal data, please contact us at
              <a href="mailto:support@grabtalent.co.uk" className="text-primary hover:underline"> support@grabtalent.co.uk</a>.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} Grab Talent. All rights reserved. · <Link to="/" className="text-primary hover:underline">Back to app</Link>
        </div>
      </div>
    </div>
  );
}