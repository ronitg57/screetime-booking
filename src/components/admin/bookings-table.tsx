
"use client";

import type { Booking, Screen } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card"; // Added import
import { deleteBooking } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Trash2, CalendarDays, Clock, Tv, User, Mail, Filter } from "lucide-react";
import { useState, useTransition, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


interface BookingsTableProps {
  bookings: (Booking & { screen: Screen })[];
  allScreens: Screen[];
}

export function BookingsTable({ bookings: initialBookings, allScreens }: BookingsTableProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [bookings, setBookings] = useState(initialBookings);
  const [filterText, setFilterText] = useState("");
  const [filterScreenIds, setFilterScreenIds] = useState<Set<string>>(new Set());

  const handleDelete = async (bookingId: string) => {
    startTransition(async () => {
      const result = await deleteBooking(bookingId);
      if (result.success) {
        setBookings(currentBookings => currentBookings.filter(b => b.id !== bookingId));
        toast({ title: "Success", description: "Booking deleted successfully." });
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete booking.", variant: "destructive" });
      }
    });
  };
  
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const searchText = filterText.toLowerCase();
      const matchesText = booking.userName.toLowerCase().includes(searchText) ||
                          booking.userEmail.toLowerCase().includes(searchText) ||
                          booking.screen.name.toLowerCase().includes(searchText) ||
                          booking.timeSlot.toLowerCase().includes(searchText);
      
      const matchesScreen = filterScreenIds.size === 0 || filterScreenIds.has(booking.screenId);

      return matchesText && matchesScreen;
    });
  }, [bookings, filterText, filterScreenIds]);

  const toggleScreenFilter = (screenId: string) => {
    setFilterScreenIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(screenId)) {
        newSet.delete(screenId);
      } else {
        newSet.add(screenId);
      }
      return newSet;
    });
  };


  if (initialBookings.length === 0 && bookings.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No bookings found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Input
          placeholder="Filter by name, email, screen..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filter by Screen ({filterScreenIds.size > 0 ? filterScreenIds.size : 'All'})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Screens</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allScreens.map((screen) => (
              <DropdownMenuCheckboxItem
                key={screen.id}
                checked={filterScreenIds.has(screen.id)}
                onCheckedChange={() => toggleScreenFilter(screen.id)}
              >
                {screen.name}
              </DropdownMenuCheckboxItem>
            ))}
             {filterScreenIds.size > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem onCheckedChange={() => setFilterScreenIds(new Set())} className="text-destructive hover:!bg-destructive/10">
                  Clear Screen Filters
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Screen</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="font-medium">{booking.userName}</div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Mail className="w-3 h-3 mr-1" />{booking.userEmail}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                     <Tv className="w-4 h-4 mr-2 text-primary hidden sm:inline-block" />
                    {booking.screen.name}
                  </div>
                  <div className="text-xs text-muted-foreground sm:pl-6">{booking.screen.location}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <CalendarDays className="w-4 h-4 mr-2 text-primary hidden sm:inline-block" />
                    {format(new Date(booking.date), "MMM dd, yyyy")}
                  </div>
                  <div className="text-xs text-muted-foreground sm:pl-6 flex items-center">
                     <Clock className="w-3 h-3 mr-1" /> {booking.timeSlot}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Delete booking" disabled={isPending}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the booking for {booking.userName} on {booking.screen.name}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(booking.id)}
                          disabled={isPending}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          {isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
           {filteredBookings.length === 0 && (
             <TableCaption>No bookings match your current filters.</TableCaption>
           )}
        </Table>
      </Card>
    </div>
  );
}
