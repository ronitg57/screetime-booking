
"use client";

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingFormSchema, type BookingFormValues } from './booking-form-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScreenCard } from './screen-card';
import { RecommendationDialog } from './recommendation-dialog';
import type { Screen, TimeSlot, DemandInfo } from '@/lib/types';
import { timeSlots } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft, ArrowRight, Loader2, CheckCircle, Phone } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { recommendTimeSlots, type RecommendTimeSlotsOutput } from '@/ai/flows/recommend-time-slots';
import { getScreens, createBooking, checkDemandForSlot, getBookedSlotsForScreenDate } from '@/lib/actions';

const steps = [
  { id: 1, name: 'Select Screen' },
  { id: 2, name: 'Select Date & Time' },
  { id: 3, name: 'Your Details' },
  { id: 4, name: 'Review & Confirm' },
];

export function BookingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [isLoadingScreens, setIsLoadingScreens] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDemand, setIsCheckingDemand] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<RecommendTimeSlotsOutput | null>(null);
  const [showRecommendationDialog, setShowRecommendationDialog] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<TimeSlot[]>([]);
  const [isLoadingBookedSlots, setIsLoadingBookedSlots] = useState(false);
  
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      screenId: '',
      date: undefined,
      timeSlot: '',
      userName: '',
      userContactNumber: '',
    },
  });
  const { control, handleSubmit, watch, setValue, trigger, formState: { errors } } = form;

  const watchedScreenId = watch('screenId');
  const watchedDate = watch('date');
  const watchedTimeSlot = watch('timeSlot');

  useEffect(() => {
    async function fetchScreensData() {
      setIsLoadingScreens(true);
      try {
        const fetchedScreens = await getScreens();
        setScreens(fetchedScreens);
      } catch (error) {
        toast({ title: "Error", description: "Could not load screens.", variant: "destructive" });
      } finally {
        setIsLoadingScreens(false);
      }
    }
    fetchScreensData();
  }, [toast]);

  const fetchBookedSlots = useCallback(async () => {
    if (watchedScreenId && watchedDate) {
      setIsLoadingBookedSlots(true);
      try {
        const result = await getBookedSlotsForScreenDate(watchedScreenId, watchedDate);
        setBookedSlots(result);
      } catch (error) {
        toast({ title: "Error", description: "Could not fetch booked slots.", variant: "destructive" });
        setBookedSlots([]);
      } finally {
        setIsLoadingBookedSlots(false);
      }
    } else {
      setBookedSlots([]);
    }
  }, [watchedScreenId, watchedDate, toast]);

  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);


  const nextStep = async () => {
    let isValid = false;
    if (currentStep === 1) isValid = await trigger("screenId");
    if (currentStep === 2) {
       isValid = await trigger(["date", "timeSlot"]);
       if (isValid && watchedTimeSlot && bookedSlots.includes(watchedTimeSlot as TimeSlot)) {
         toast({ title: "Slot Unavailable", description: "This time slot is already booked. Please select another.", variant: "destructive" });
         return; // Prevent advancing if selected slot is booked
       }
    }
    if (currentStep === 3) isValid = await trigger(["userName", "userContactNumber"]);
    
    if (isValid || currentStep === 4) {
      if (currentStep === 3) {
        await handleDemandCheckAndRecommendations();
      } else if (currentStep < steps.length) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleDemandCheckAndRecommendations = async () => {
    if (!watchedScreenId || !watchedDate || !watchedTimeSlot) return;
    
    setIsCheckingDemand(true);
    try {
      const demandInfo: DemandInfo = await checkDemandForSlot({
        screenId: watchedScreenId,
        date: watchedDate,
        timeSlot: watchedTimeSlot as TimeSlot, // Schema ensures it's a TimeSlot if not empty
      });

      if (demandInfo.level === 'high' || demandInfo.level === 'medium') {
        const nearbyScreenIds = screens.filter(s => s.id !== watchedScreenId).map(s => s.id);
        const recommendations = await recommendTimeSlots({
          selectedScreen: watchedScreenId,
          selectedDate: format(watchedDate, 'yyyy-MM-dd'),
          selectedTimePeriod: watchedTimeSlot,
          nearbyScreens: nearbyScreenIds,
          demandLevel: demandInfo.level,
        });
        setAiRecommendations(recommendations);
        setShowRecommendationDialog(true); 
      } else {
         setCurrentStep(prev => prev + 1);
      }
    } catch (error) {
      toast({ title: "Recommendation Error", description: "Could not get recommendations. Proceeding with booking.", variant: "destructive" });
      setCurrentStep(prev => prev + 1);
    } finally {
      setIsCheckingDemand(false);
    }
  };
  
  const handleSelectRecommendation = (type: 'time' | 'screen', value: string) => {
    if (type === 'time') {
      setValue('timeSlot', value as TimeSlot, { shouldValidate: true });
    } else if (type === 'screen') {
      setValue('screenId', value, { shouldValidate: true });
      // When screen changes, re-fetch booked slots
      setBookedSlots([]); // Clear old slots immediately
      // fetchBookedSlots will be called by its own useEffect dependency on watchedScreenId
    }
    setShowRecommendationDialog(false);
    setCurrentStep(4); 
  };

  const handleProceedWithOriginal = () => {
    setShowRecommendationDialog(false);
    setCurrentStep(4); 
  };

  const onSubmit = async (data: BookingFormValues) => {
    setIsSubmitting(true);
    startTransition(async () => {
      try {
        // Double check if the selected slot became booked in the meantime (race condition)
        if (data.screenId && data.date && data.timeSlot) {
            const currentBookedSlots = await getBookedSlotsForScreenDate(data.screenId, data.date);
            if (currentBookedSlots.includes(data.timeSlot as TimeSlot)) {
                toast({ title: "Slot Just Booked", description: "This time slot was booked while you were completing the form. Please select another.", variant: "destructive" });
                setIsSubmitting(false);
                setCurrentStep(2); // Go back to time selection
                fetchBookedSlots(); // Refresh booked slots
                return;
            }
        }

        const result = await createBooking(data);
        if (result.success && result.bookingId) {
          toast({ title: "Booking Successful!", description: "Your screen time has been confirmed.", className: "bg-green-500 text-white" });
          router.push(`/confirmation/${result.bookingId}`);
        } else {
          throw new Error(result.error || "Booking failed. Please try again.");
        }
      } catch (error: any) {
        toast({ title: "Booking Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    });
  };
  
  const selectedScreen = screens.find(s => s.id === watchedScreenId);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="shadow-2xl">
        <CardHeader className="bg-primary/10 p-6 rounded-t-lg">
          <CardTitle className="text-3xl font-headline text-primary text-center">ScreenTime Booking</CardTitle>
          <CardDescription className="text-center text-lg text-foreground/80">
            Book a video screen in just a few steps.
          </CardDescription>
          <div className="w-full bg-muted rounded-full h-2.5 mt-4">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>
          </div>
           <p className="text-center text-sm text-muted-foreground mt-1">{steps[currentStep-1].name}</p>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="p-6 space-y-8">
            {currentStep === 1 && (
              <section aria-labelledby="screen-selection-title">
                <h2 id="screen-selection-title" className="text-2xl font-semibold mb-6 text-center font-headline">Select a Screen</h2>
                {isLoadingScreens ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                ) : screens.length === 0 ? (
                  <p className="text-center text-muted-foreground">No screens available at the moment.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {screens.map(screen => (
                      <ScreenCard
                        key={screen.id}
                        screen={screen}
                        onSelect={() => setValue('screenId', screen.id, { shouldValidate: true })}
                        isSelected={watchedScreenId === screen.id}
                      />
                    ))}
                  </div>
                )}
                {errors.screenId && <p className="text-destructive mt-2 text-sm">{errors.screenId.message}</p>}
              </section>
            )}

            {currentStep === 2 && (
              <section aria-labelledby="date-time-selection-title" className="space-y-6">
                <h2 id="date-time-selection-title" className="text-2xl font-semibold mb-6 text-center font-headline">Choose Date & Time Slot</h2>
                <div>
                  <Label htmlFor="date-picker" className="text-md font-medium">Date (Mon-Sat only)</Label>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="date-picker"
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setValue('timeSlot', '', { shouldValidate: false }); // Reset time slot when date changes
                            }}
                            initialFocus
                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || date.getDay() === 0}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.date && <p className="text-destructive mt-1 text-sm">{errors.date.message}</p>}
                </div>

                <div>
                  <Label className="text-md font-medium">Time Slot</Label>
                   <Controller
                    name="timeSlot"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value} // Use value for controlled component
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2"
                      >
                        {timeSlots.map(slot => {
                          const isBooked = bookedSlots.includes(slot);
                          return (
                            <Label
                              key={slot}
                              htmlFor={slot}
                              className={cn(
                                "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                                field.value === slot && "border-primary ring-2 ring-primary",
                                isBooked && "bg-muted/50 cursor-not-allowed opacity-60 hover:bg-muted/50 line-through",
                                isLoadingBookedSlots && "opacity-50 cursor-default"
                              )}
                            >
                              <RadioGroupItem 
                                value={slot} 
                                id={slot} 
                                className="sr-only" 
                                disabled={isBooked || isLoadingBookedSlots}
                              />
                              {slot}
                              {isBooked && <span className="text-xs text-destructive">(Booked)</span>}
                            </Label>
                          );
                        })}
                      </RadioGroup>
                    )}
                  />
                  {isLoadingBookedSlots && (
                    <div className="flex items-center text-sm text-muted-foreground mt-2">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking slot availability...
                    </div>
                  )}
                  {errors.timeSlot && <p className="text-destructive mt-1 text-sm">{errors.timeSlot.message}</p>}
                </div>
              </section>
            )}

            {currentStep === 3 && (
              <section aria-labelledby="user-details-title" className="space-y-6">
                <h2 id="user-details-title" className="text-2xl font-semibold mb-6 text-center font-headline">Your Details</h2>
                <div>
                  <Label htmlFor="userName" className="text-md font-medium">Full Name</Label>
                  <Controller
                    name="userName"
                    control={control}
                    render={({ field }) => <Input id="userName" {...field} className="mt-1" placeholder="e.g. Jane Doe" />}
                  />
                  {errors.userName && <p className="text-destructive mt-1 text-sm">{errors.userName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="userContactNumber" className="text-md font-medium">Contact Number</Label>
                  <Controller
                    name="userContactNumber"
                    control={control}
                    render={({ field }) => <Input id="userContactNumber" type="tel" {...field} className="mt-1" placeholder="e.g. +1 555 123 4567" />}
                  />
                  {errors.userContactNumber && <p className="text-destructive mt-1 text-sm">{errors.userContactNumber.message}</p>}
                </div>
              </section>
            )}
            
            {currentStep === 4 && selectedScreen && (
              <section aria-labelledby="review-title" className="space-y-6">
                <h2 id="review-title" className="text-2xl font-semibold mb-6 text-center font-headline">Review Your Booking</h2>
                <Card className="bg-muted/50 p-6">
                  <CardContent className="space-y-3 text-md">
                    <p><strong>Screen:</strong> {selectedScreen.name} ({selectedScreen.location})</p>
                    <p><strong>Date:</strong> {watchedDate ? format(watchedDate, "PPP") : 'N/A'}</p>
                    <p><strong>Time Slot:</strong> {watchedTimeSlot || 'N/A'}</p>
                    <p><strong>Name:</strong> {watch('userName') || 'N/A'}</p>
                    <p><strong>Contact Number:</strong> {watch('userContactNumber') || 'N/A'}</p>
                  </CardContent>
                </Card>
              </section>
            )}
          </CardContent>

          <CardFooter className="p-6 flex justify-between border-t">
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1 || isSubmitting || isPending || isCheckingDemand || isLoadingBookedSlots}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {currentStep < steps.length -1 && ( 
                 <Button type="button" onClick={nextStep} disabled={isSubmitting || isPending || (currentStep === 3 && isCheckingDemand) || isLoadingBookedSlots || (currentStep === 2 && !watchedTimeSlot) }>
                {currentStep === 3 && isCheckingDemand ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {currentStep === 3 && isCheckingDemand ? "Checking..." : "Next"}
                {currentStep < 3 && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            )}
             {currentStep === steps.length-1 && (
              <Button type="button" onClick={nextStep} disabled={isSubmitting || isPending || isCheckingDemand || isLoadingBookedSlots}>
                {isCheckingDemand ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isCheckingDemand ? "Checking Availability..." : "Review Booking"}
                {!isCheckingDemand && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            )}
            {currentStep === steps.length && (
              <Button type="submit" disabled={isSubmitting || isPending || isLoadingBookedSlots}>
                {isSubmitting || isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Confirm Booking
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
      {showRecommendationDialog && aiRecommendations && selectedScreen && watchedDate && watchedTimeSlot && (
        <RecommendationDialog
          isOpen={showRecommendationDialog}
          onOpenChange={setShowRecommendationDialog}
          recommendations={aiRecommendations}
          currentSelection={{
            screenName: selectedScreen.name,
            date: format(watchedDate, 'PPP'),
            timeSlot: watchedTimeSlot,
          }}
          allScreens={screens}
          onSelectRecommendation={handleSelectRecommendation}
          onProceedWithOriginal={handleProceedWithOriginal}
        />
      )}
    </div>
  );
}
