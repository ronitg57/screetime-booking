
"use server";

import prisma from "./prisma";
import type { BookingFormValues } from "@/components/booking-form-schema";
import type { Screen, Booking, DemandInfo, TimeSlot } from "./types";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import bcrypt from 'bcryptjs';
import { z } from "zod";
import { format } from "date-fns";

// Screen and Booking Actions
export async function getScreens(): Promise<Screen[]> {
  try {
    const screens = await prisma.screen.findMany({
      orderBy: { name: 'asc' },
    });
    return screens;
  } catch (error) {
    console.error("Error fetching screens:", error);
    return []; // Gracefully return empty array on error
  }
}

export async function createBooking(data: BookingFormValues) {
  try {
    // Validate input again on server-side (optional if using form validation strictly)
    const { screenId, date, timeSlot, userName, userEmail } = data;
    if (!screenId || !date || !timeSlot || !userName || !userEmail) {
      return { success: false, error: "Missing required fields." };
    }
    
    // Optional: Check if slot is already booked (can be more complex with counts)
    const existingBooking = await prisma.booking.findFirst({
      where: {
        screenId,
        date: new Date(date.setHours(0,0,0,0)), // Ensure only date part is used for comparison
        timeSlot,
      },
    });

    if (existingBooking) {
      return { success: false, error: "This time slot is already booked. Please select another." };
    }

    const booking = await prisma.booking.create({
      data: {
        screenId,
        date: new Date(date.setHours(12,0,0,0)), // Store date with a neutral time e.g. midday UTC
        timeSlot,
        userName,
        userEmail,
      },
    });
    revalidatePath("/"); // Revalidate homepage if it lists bookings or availability
    revalidatePath("/admin");
    return { success: true, bookingId: booking.id };
  } catch (error) {
    console.error("Error creating booking:", error);
    return { success: false, error: "Failed to create booking. Please try again." };
  }
}

export async function getBookingById(bookingId: string): Promise<Booking & { screen: Screen } | null> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { screen: true },
    });
    return booking;
  } catch (error) {
    console.error("Error fetching booking by ID:", error);
    return null;
  }
}

export async function checkDemandForSlot(params: { screenId: string; date: Date; timeSlot: TimeSlot }): Promise<DemandInfo> {
  try {
    const { screenId, date, timeSlot } = params;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Count bookings for the specific slot
    const specificSlotBookings = await prisma.booking.count({
      where: {
        screenId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        timeSlot,
      },
    });

    if (specificSlotBookings > 0) {
      return { level: 'high', message: 'This specific slot is already booked or has high interest.' };
    }
    
    // Count total bookings for the screen on that day
    const dailyBookingsCount = await prisma.booking.count({
      where: {
        screenId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (dailyBookingsCount >= 2) { // Example threshold: 2 bookings on the same screen for the day
      return { level: 'medium', message: 'This screen has multiple bookings today.' };
    }

    return { level: 'low' };
  } catch (error) {
    console.error("Error checking demand:", error);
    // Default to low demand on error to not block booking flow
    return { level: 'low', message: 'Could not determine demand.' };
  }
}


// Admin Actions
const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function adminLogin(formData: FormData) {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const { username, password } = parsed.data;

  try {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return { success: false, error: "Invalid username or password." };
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return { success: false, error: "Invalid username or password." };
    }

    // Simplified session: Set a cookie. Use JWT in production.
    const sessionToken = process.env.ADMIN_SESSION_TOKEN_VALUE;
    if (!sessionToken) {
        console.error("ADMIN_SESSION_TOKEN_VALUE is not set in .env");
        return { success: false, error: "Server configuration error." };
    }
    cookies().set("admin-auth-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return { success: true };
  } catch (error) {
    console.error("Admin login error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function adminLogout() {
  cookies().delete("admin-auth-token");
  revalidatePath("/admin/login"); // to ensure redirect if middleware runs
  revalidatePath("/admin");
}

export async function getAllBookings(): Promise<(Booking & { screen: Screen })[]> {
  try {
    const bookings = await prisma.booking.findMany({
      include: { screen: true },
      orderBy: { createdAt: 'desc' },
    });
    return bookings;
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    return [];
  }
}

export async function deleteBooking(bookingId: string) {
  try {
    await prisma.booking.delete({
      where: { id: bookingId },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error deleting booking:", error);
    return { success: false, error: "Failed to delete booking." };
  }
}

// Helper to verify admin session, can be used in Server Components or other actions
export async function verifyAdminSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('admin-auth-token');
  
  if (!token || token.value !== process.env.ADMIN_SESSION_TOKEN_VALUE) {
    return false;
  }
  return true;
}
