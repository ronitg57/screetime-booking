
import { getAllBookings, getScreens } from "@/lib/actions";
import { BookingsTable } from "@/components/admin/bookings-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const bookings = await getAllBookings();
  const screens = await getScreens();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Booking Management</h1>
        <p className="text-muted-foreground">View and manage all screen bookings.</p>
      </div>
      
      <BookingsTable bookings={bookings} allScreens={screens} />
    </div>
  );
}

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request
