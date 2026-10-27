import React from 'react';
import { CalendarClock } from 'lucide-react';
import BookingAlertPopup from './BookingAlertPopup';

// The amendBookingDate function notifies the talent when a client moves the date.
export const DATE_CHANGED_TITLE = 'Booking date changed by the client';

export default function BookingDateChangedAlert({ user }) {
  return (
    <BookingAlertPopup
      user={user}
      notificationTitle={DATE_CHANGED_TITLE}
      heading="New date requested"
      hint="The client moved this booking to a new date, so it's back to pending. Accept it again if you're free."
      ctaLabel="Review the booking"
      icon={CalendarClock}
    />
  );
}