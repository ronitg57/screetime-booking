
"use server";

import prisma from "./prisma";
import type { BookingFormValues } from "@/components/booking-form-schema";
import type { Screen, Booking, DemandInfo, TimeSlot } from "./types";
// ScreenUpsertSchema import removed
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import bcrypt from 'bcryptjs';
import { z } from "zod";
import { format } from "date-fns";

// Screen Actions
export async function getScreens(): Promise<Screen[]> {
  try {
    const screens = await prisma.screen.findMany({
      orderBy: { name: 'asc' },
    });
    return screens;
  } catch (error) {
    console.error("Error fetching screens:", error);
    return [];
  }
}

export async function getScreenById(screenId: string): Promise<Screen | null> {
  if (!screenId) return null;
  try {
    const screen = await prisma.screen.findUnique({
      where: { id: screenId },
    });
    return screen;
  } catch (error) {
    console.error(`Error fetching screen by ID (${screenId}):`, error);
    return null;
  }
}

// createScreenAction removed

// updateScreenAction removed

export async function deleteScreenAction(screenId: string) {
  try {
    // Check for existing bookings. Prevent deletion if bookings exist.
    const bookingCount = await prisma.booking.count({ where: { screenId } });
    if (bookingCount > 0) {
      return { success: false, error: "Cannot delete screen with existing bookings. Please delete bookings first." };
    }
    await prisma.screen.delete({
      where: { id: screenId },
    });
    revalidatePath("/admin/screens");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting screen:", error);
    return { success: false, error: "Failed to delete screen." };
  }
}


// Booking Actions
export async function createBooking(data: BookingFormValues) {
  try {
    const { screenId, date, timeSlot, userName, userContactNumber } = data;
    if (!screenId || !date || !timeSlot || !userName || !userContactNumber) {
      return { success: false, error: "Missing required fields." };
    }
    
    const existingBooking = await prisma.booking.findFirst({
      where: {
        screenId,
        date: new Date(date.setHours(0,0,0,0)),
        timeSlot,
      },
    });

    if (existingBooking) {
      return { success: false, error: "This time slot is already booked. Please select another." };
    }

    const booking = await prisma.booking.create({
      data: {
        screenId,
        date: new Date(date.setHours(12,0,0,0)), // Store date at noon UTC to avoid timezone issues with date part
        timeSlot,
        userName,
        userContactNumber,
      },
    });
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/booking-form`); 
    return { success: true, bookingId: booking.id };
  } catch (error) {
    console.error("Error creating booking:", error);
    return { success: false, error: "Failed to create booking. Please try again." };
  }
}

export async function getBookingById(bookingId: string): Promise<Booking & { screen: Screen } | null> {
  if (!bookingId) return null;
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { screen: true },
    });
    return booking;
  } catch (error) {
    console.error(`Error fetching booking by ID (${bookingId}):`, error);
    return null;
  }
}

export async function getBookedSlotsForScreenDate(screenId: string, date: Date): Promise<TimeSlot[]> {
  if (!screenId || !date) return [];
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        screenId: screenId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        timeSlot: true,
      },
    });
    return bookings.map(b => b.timeSlot as TimeSlot);
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    return [];
  }
}

export async function checkDemandForSlot(params: { screenId: string; date: Date; timeSlot: TimeSlot }): Promise<DemandInfo> {
  try {
    const { screenId, date, timeSlot } = params;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

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
    
    const dailyBookingsCount = await prisma.booking.count({
      where: {
        screenId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (dailyBookingsCount >= 2) { // Example threshold: if 2 or more slots on the same screen are booked for the day
      return { level: 'medium', message: 'This screen has multiple bookings today.' };
    }

    return { level: 'low' };
  } catch (error) {
    console.error("Error checking demand:", error);
    // Default to low demand on error to avoid blocking users unnecessarily
    return { level: 'low', message: 'Could not determine demand.' };
  }
}


// Admin Auth Actions
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

    const sessionToken = process.env.ADMIN_SESSION_TOKEN_VALUE;
    if (!sessionToken) {
        console.error("ADMIN_SESSION_TOKEN_VALUE is not set in .env");
        return { success: false, error: "Server configuration error." };
    }
    
    const cookieStore = await cookies(); 
    cookieStore.set("admin-auth-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, 
    });

    return { success: true };
  } catch (error) {
    console.error("Admin login error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin-auth-token");
  revalidatePath("/admin/login"); 
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
    revalidatePath("/"); // Also revalidate public pages if availability changes
    return { success: true };
  } catch (error) {
    console.error("Error deleting booking:", error);
    return { success: false, error: "Failed to delete booking." };
  }
}

export async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-auth-token');
  
  if (!token || token.value !== process.env.ADMIN_SESSION_TOKEN_VALUE) {
    return false;
  }
  return true;
}
