import { sanitizeText, icsEscape, normalizeTime } from './emailSanitize.ts';

// Builds a universal .ics calendar invite from a booking — opens directly in
// Google Calendar, Apple Calendar, Outlook and phones. All booking free-text is
// sanitized + RFC 5545-escaped so no injected properties or events can be added.
export function buildBookingIcs(booking, opts = {}) {
  const method = opts.method || 'PUBLISH';
  const status = opts.status || 'CONFIRMED';

  const icsDate = booking.event_date ? String(booking.event_date).replace(/-/g, '') : '';
  const startT = normalizeTime(booking.start_time);
  const endT = normalizeTime(booking.end_time);
  const startTime = (startT ? startT.replace(':', '') : '0900') + '00';
  const endTime = (endT ? endT.replace(':', '') : '1800') + '00';
  const dtStart = icsDate ? `${icsDate}T${startTime}` : '';
  const dtEnd = icsDate ? `${icsDate}T${endTime}` : '';
  const uid = `grabtalent-${booking.id}@grabtalent.app`;

  const eventName = sanitizeText(booking.event_name, 120) || 'Event';
  const venuePlain = sanitizeText([booking.venue_name, booking.venue_address, booking.venue_city].filter(Boolean).join(', '), 200);
  const extra = sanitizeText(opts.description, 300);
  const description = ('Booked on Grab Talent. ' + (extra ? extra + ' ' : '') + 'Details: https://grabtalent.co.uk').slice(0, 400);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Grab Talent//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${icsEscape(eventName)}`,
    `LOCATION:${icsEscape(venuePlain)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    'ORGANIZER:mailto:noreply@grabtalent.app',
    ...(opts.attendeeEmail ? [`ATTENDEE:mailto:${opts.attendeeEmail}`] : []),
    `STATUS:${status}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const slug = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'event';
  return { icsContent: lines.join('\r\n'), filename: `grab-talent-${slug}.ics` };
}

// Base64 of the invite, UTF-8 safe (btoa alone breaks on accented names).
export function toBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}