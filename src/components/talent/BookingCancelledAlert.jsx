import React from 'react';
import { AlertTriangle } from 'lucide-react';
import BookingAlertPopup from './BookingAlertPopup';

// The server writes a notification titled CANCELLED_TITLE to the talent when the
// client backs out of a booking.
export const CANCELLED_TITLE = 'Booking cancelled by the client';

export default function BookingCancelledAlert({ user }) {
  return (
    <BookingAlertPopup
      user={user}
      notificationTitle={CANCELLED_TITLE}
      heading="Booking cancelled"
      hint="Cancellations like this are sometimes sent by mistake. You can open the booking to message the client and check."
      ctaLabel="View the booking"
      icon={AlertTriangle}
    />
  );
}