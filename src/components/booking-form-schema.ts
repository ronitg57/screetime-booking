
import { z } from 'zod';
import { timeSlots } from '@/lib/types';

export const bookingFormSchema = z.object({
  screenId: z.string().min(1, "Please select a screen."),
  date: z.date({ required_error: "Please select a date." }),
  timeSlot: z.enum(timeSlots, { required_error: "Please select a time slot." }),
  userName: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name is too long."),
  userEmail: z.string().email("Please enter a valid email address."),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
