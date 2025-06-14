
import { BookingForm } from '@/components/booking-form';

export default function HomePage() {
  return (
    <main className="min-h-screen py-8 md:py-12 bg-gradient-to-br from-background to-primary/5">
      <div className="container mx-auto px-4">
        <BookingForm />
      </div>
    </main>
  );
}
