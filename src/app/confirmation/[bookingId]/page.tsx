
import { getBookingById } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, CalendarDays, Clock, Tv, User, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface ConfirmationPageProps {
  params: {
    bookingId: string;
  };
}

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const booking = await getBookingById(params.bookingId);

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-primary/5 p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-destructive">Booking Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              We could not find the booking you're looking for. It might have been cancelled or the link may be incorrect.
            </p>
            <Button asChild>
              <Link href="/">Back to Booking</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-primary/5 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center bg-primary/10 p-8 rounded-t-lg">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">Booking Confirmed!</CardTitle>
          <CardDescription className="text-lg text-foreground/80">
            Your screen time has been successfully booked.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-4">
          <h3 className="text-xl font-semibold mb-4 text-center font-headline">Booking Details:</h3>
          <div className="space-y-3 text-md">
            <div className="flex items-center">
              <Tv className="w-5 h-5 mr-3 text-primary" />
              <span><strong>Screen:</strong> {booking.screen.name} ({booking.screen.location})</span>
            </div>
            <div className="flex items-center">
              <CalendarDays className="w-5 h-5 mr-3 text-primary" />
              <span><strong>Date:</strong> {format(new Date(booking.date), 'EEEE, MMMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-3 text-primary" />
              <span><strong>Time Slot:</strong> {booking.timeSlot}</span>
            </div>
             <hr className="my-4" />
            <div className="flex items-center">
              <User className="w-5 h-5 mr-3 text-primary" />
              <span><strong>Name:</strong> {booking.userName}</span>
            </div>
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-3 text-primary" />
              <span><strong>Email:</strong> {booking.userEmail}</span>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Button asChild size="lg" className="font-semibold">
              <Link href="/">Book Another Screen</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
       <p className="mt-8 text-sm text-muted-foreground">A confirmation email has been notionally sent to {booking.userEmail}.</p>
    </div>
  );
}

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request
