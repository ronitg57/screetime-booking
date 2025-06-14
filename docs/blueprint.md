# **App Name**: ScreenTime Booking

## Core Features:

- Screen Selection: Display available video screens for booking, including location and specs.
- Date Selection: Calendar interface to select dates (Monday to Saturday only).
- Time Slot Selection: Restricted time slot selection, showing only periods 4, 5, and 7.
- Booking Submission: Submission system linked to MariaDB/MySQL database via Prisma ORM.
- Admin Panel: Admin page to view, manage, and filter bookings, password protected.
- Booking confirmation: Confirmation page that books the selection made by the user.
- Coverage Maximization Recommendation: Automated system to recommend which time-slots maximize screen coverage. The system is a tool: when booking is highly demanded the model may recommend bookings from a user across different screens.  The system may recommend using the same time-slots in nearby screens in case redundancy may happen.

## Style Guidelines:

- Primary color: Soft blue (#64B5F6) evoking trust and calm.
- Background color: Light grey (#F0F4F8), very desaturated.
- Accent color: Muted violet (#9575CD), a close analogue of the primary.
- Body and headline font: 'Inter', a grotesque-style sans-serif with a modern look.
- Clean and structured form layout inspired by Google Forms. Generous whitespace and clear sections to guide the user.
- Simple, intuitive icons to represent each screen type and booking option.
- Subtle transition animations for form elements and confirmations.