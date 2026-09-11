import React from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-5 py-12 safe-top safe-bottom">
        <div className="flex items-center gap-3 mb-8">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-primary">
            <FileText className="w-6 h-6 text-primary-foreground" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Terms &amp; Conditions</h1>
            <p className="text-sm text-muted-foreground">Grab Talent — last updated 11 September 2026</p>
          </div>
        </div>

        <div className="max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground selectable-text">
          <p>
            These Terms &amp; Conditions ("Terms") govern your use of the Grab Talent mobile application and
            website (together, the "Service"), operated by Grab Talent ("we", "us", "our"). By creating an
            account or using the Service, you agree to these Terms. If you do not agree, please do not use
            the Service. You must be at least 18 years old to use the Service.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. How the Service Works</h2>
            <p>
              Grab Talent is a booking platform that connects people seeking performers ("Seekers") with
              performers ("Talent", e.g. DJs, musicians, dancers, entertainers). We provide the platform,
              booking tools, scheduling, messaging, and payment handling. We are not a party to the
              agreement formed between a Seeker and Talent when a booking is made — that agreement is
              between those two parties, and each party is responsible for honouring it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Your Account</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are responsible for keeping your login details secure and for all activity under your account.</li>
              <li>You must provide accurate and complete information when registering and creating a profile.</li>
              <li>You may use the Service as a Seeker, as Talent, or both.</li>
              <li>You may not use the Service on behalf of anyone else without their consent, or create accounts for people under 18.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. For Talent</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Bookings:</strong> only accept bookings you can genuinely perform. Once you accept a booking, you are expected to attend and perform as agreed.</li>
              <li><strong>Cancellations and the three-strike policy:</strong> late cancellations or no-shows are taken seriously. Each late cancellation or no-show counts as a strike; three strikes result in suspension of your talent profile and removal from the platform.</li>
              <li><strong>Availability:</strong> keep your availability calendar up to date so Seekers book dates you can actually attend.</li>
              <li><strong>Professionalism:</strong> arrive on time, perform professionally, and communicate promptly through the app.</li>
              <li><strong>Verification:</strong> if you choose to become verified, you agree that we may review the ID document and selfie you upload for identity-checking purposes only.</li>
              <li><strong>Licences, insurance, and compliance:</strong> you are solely responsible for holding any licences, certifications, or insurance your act requires — for example, public liability insurance (which many venues require), and specialist certification for pyrotechnics or similar acts. You are also responsible for any performance or venue-related licences that apply to your performances.</li>
              <li><strong>Venue requirements:</strong> comply with all venue rules, health and safety requirements, and the instructions of venue staff at every event.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. For Seekers</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Accurate event details:</strong> provide truthful event information, venue details, and timing so Talent can decide whether to accept your booking.</li>
              <li><strong>Payment:</strong> payment is collected through the Service when a booking is confirmed and held until the performance has taken place, at which point it is released to Talent (minus the platform commission).</li>
              <li><strong>Cancellations:</strong> if you cancel a confirmed booking, our refund policy in the app applies.</li>
              <li><strong>Event licences:</strong> you are responsible for any licences that apply to your event, including any music or entertainment licence the venue or event requires (such as PRS/PPL music licensing) — the platform does not provide these.</li>
              <li><strong>Respect:</strong> treat performers with respect. Harassment or abuse of any performer will result in removal from the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Fees, Commission &amp; Payments</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Booking prices are set by Talent as an hourly rate with a minimum booking duration.</li>
              <li>We charge a platform commission of 11% on each booking. Seekers pay the listed total; Talent receives the remaining amount.</li>
              <li>Payment is held securely and released to Talent after the performance has been confirmed as having taken place.</li>
              <li>You are responsible for any taxes applicable to amounts you earn or pay through the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Reviews &amp; Ratings</h2>
            <p>
              After a completed booking, Seekers may leave a review and rating. Reviews must be honest and
              based on genuine experiences. We may remove reviews that are fraudulent, abusive, or
              unrelated to the actual booking. Talent may not incentivise or pressure Seekers into leaving
              positive reviews.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Messaging &amp; Contact Details</h2>
            <p>
              To protect both parties, contact details (such as phone numbers) are restricted until a
              booking is confirmed. Do not attempt to bypass this by sharing contact details in messages
              before confirmation — messages containing such details are blocked. Do not use messaging to
              harass, spam, or defraud other users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Prohibited Use</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Do not use the Service for any unlawful purpose, or to arrange anything illegal.</li>
              <li>Do not misrepresent your identity, skills, or experience.</li>
              <li>Do not take bookings off-platform to avoid the platform's booking, payment, and protection features.</li>
              <li>Do not scrape, copy, resell, or misuse data from the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Suspension &amp; Termination</h2>
            <p>
              We may suspend or terminate accounts that breach these Terms, that accumulate three strikes
              under the cancellation policy, or that put other users or the platform at risk. You may stop
              using the Service and delete your account at any time from in-app Settings. Provisions that
              should survive termination (such as amounts owed) will do so.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">10. Our Role &amp; Liability</h2>
            <p>
              We do not perform at events and do not control how performances are carried out. We are not
              liable for the acts or omissions of Talent or Seekers, or for the outcome of any event. To the
              extent permitted by law, our liability for any claim relating to the Service is limited to the
              total commission we charged on the booking concerned. Nothing in these Terms excludes or
              limits liability that cannot lawfully be excluded.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">11. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes within the
              app and update the "last updated" date above. Continuing to use the Service after changes take
              effect means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">12. Contact</h2>
            <p>
              Questions about these Terms? Contact us at
              <a href="mailto:support@grabtalent.co.uk" className="text-primary hover:underline"> support@grabtalent.co.uk</a>.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} Grab Talent. All rights reserved. · <Link to="/" className="text-primary hover:underline">Back to app</Link> · <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}