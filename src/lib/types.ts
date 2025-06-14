
import type { Screen as PrismaScreen, Booking as PrismaBooking, Admin as PrismaAdmin } from '@prisma/client';

export type Screen = PrismaScreen;
export type Booking = PrismaBooking;
export type Admin = PrismaAdmin;

export interface ScreenWithBookings extends PrismaScreen {
  bookings: PrismaBooking[];
}

export const timeSlots = ["4th period class", "5th period class", "7th period class"] as const;
export type TimeSlot = typeof timeSlots[number];

export type BookingFormData = {
  screenId: string;
  date: Date | undefined;
  timeSlot: TimeSlot | '';
  userName: string;
  userContactNumber: string; // Changed from userEmail
};

export type DemandInfo = {
  level: 'low' | 'medium' | 'high';
  message?: string;
};
