import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { sanitizeText, normalizeTime } from '../../shared/emailSanitize.ts';

// Sends a reminder email to both the talent and the client one day before each
// active booking, with the event date, start time, venue and each other's
// contact details, so nobody forgets or turns up at the wrong place.
// Called daily by the "Event Reminder Emails" scheduled workflow.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Tomorrow's date in the app's home timezone (Europe/London) as yyyy-mm-dd
    const ukToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
    const tomorrow = new Date(`${ukToday}T12:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const targetDate = tomorrow.toISOString().slice(0, 10);

    const bookings = await base44.asServiceRole.entities.Booking.filter(
      { event_date: targetDate, status: { $in: ['pending', 'accepted', 'confirmed'] } }
    );

    const getUser = async (userId) => {
      const users = await base44.asServiceRole.entities.User.filter({ id: userId });
      return users.length > 0 ? users[0] : null;
    };

    const formatEventDate = (dateStr) => {
      try {
        return new Intl.DateTimeFormat('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
          .format(new Date(`${dateStr}T12:00:00Z`));
      } catch { return dateStr; }
    };

    let emailsSent = 0;
    const details = [];

    for (const booking of bookings) {
      const eventName = sanitizeText(booking.event_name, 120) || 'Your event';
      const eventDate = formatEventDate(booking.event_date);
      const startT = normalizeTime(booking.start_time) || 'TBD';
      const endT = normalizeTime(booking.end_time) || 'TBD';
      const venueName = sanitizeText(booking.venue_name, 100) || 'TBD';
      const venueAddress = sanitizeText(booking.venue_address, 200) || 'TBD';
      const venueCity = sanitizeText(booking.venue_city, 80) || 'TBD';
      const seekerName = sanitizeText(booking.seeker_name, 100) || 'Your client';
      const talentName = sanitizeText(booking.talent_stage_name, 100) || 'Your talent';
      const seekerPhone = sanitizeText(booking.seeker_phone, 30) || 'Not provided';

      const talentUser = booking.talent_user_id ? await getUser(booking.talent_user_id) : null;
      const seekerUser = booking.seeker_id ? await getUser(booking.seeker_id) : null;

      const shared = {
        event_name: eventName,
        event_date: eventDate,
        start_time: startT,
        end_time: endT,
        venue_name: venueName,
        venue_address: venueAddress,
        venue_city: venueCity,
      };

      const sends = [];
      if (talentUser) {
        sends.push(base44.asServiceRole.integrations.Core.SendEmail({
          to: talentUser.email,
          template_name: 'EventReminder',
          variables: {
            first_name: talentName,
            ...shared,
            counterpart_role: 'Client',
            counterpart_name: seekerName,
            counterpart_email: seekerUser ? seekerUser.email : 'Not provided',
            counterpart_phone: seekerPhone,
          },
        }));
      }
      if (seekerUser) {
        sends.push(base44.asServiceRole.integrations.Core.SendEmail({
          to: seekerUser.email,
          template_name: 'EventReminder',
          variables: {
            first_name: seekerName,
            ...shared,
            counterpart_role: 'Talent',
            counterpart_name: talentName,
            counterpart_email: talentUser ? talentUser.email : 'Not provided',
            counterpart_phone: 'Not provided',
          },
        }));
      }

      const results = await Promise.allSettled(sends);
      const ok = results.filter(r => r.status === 'fulfilled').length;
      emailsSent += ok;
      details.push({ booking_id: booking.id, emails_sent: ok });
    }

    return Response.json({ ok: true, target_date: targetDate, bookings: bookings.length, emails_sent: emailsSent, details });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}