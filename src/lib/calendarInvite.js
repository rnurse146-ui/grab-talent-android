// Universal .ics calendar invite for a booking — Google Calendar, Apple
// Calendar, Outlook and phone calendar apps all open these directly.
function icsEscape(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function normTime(t) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t || ''));
  return m ? `${String(Number(m[1])).padStart(2, '0')}:${m[2]}` : null;
}

export function buildBookingIcs(booking) {
  const icsDate = booking.event_date ? String(booking.event_date).replace(/-/g, '') : '';
  const startT = normTime(booking.start_time);
  const endT = normTime(booking.end_time);
  const dtStart = icsDate ? `${icsDate}T${(startT || '09:00').replace(':', '')}00` : '';
  const dtEnd = icsDate ? `${icsDate}T${(endT || '18:00').replace(':', '')}00` : '';
  const eventName = booking.event_name || 'Event';
  const venue = [booking.venue_name, booking.venue_address, booking.venue_city].filter(Boolean).join(', ');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Grab Talent//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:grabtalent-${booking.id}@grabtalent.app`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${icsEscape(eventName)}`,
    `LOCATION:${icsEscape(venue)}`,
    `DESCRIPTION:${icsEscape(`Booked on Grab Talent. ${booking.event_name ? eventName + '. ' : ''}Details: https://grabtalent.co.uk`)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadBookingIcs(booking) {
  const icsContent = buildBookingIcs(booking);
  const slug = (booking.event_name || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grab-talent-${slug}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}