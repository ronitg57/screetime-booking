
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingFormSchema, type BookingFormValues } from './booking-form-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScreenCard } from './screen-card';
import { RecommendationDialog } from './recommendation-dialog';
import type { Screen, TimeSlot, DemandInfo } from '@/lib/types';
import { timeSlots } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft, ArrowRight, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { recommendTimeSlots, type RecommendTimeSlotsOutput } from '@/ai/flows/recommend-time-slots';
import { getScreens, createBooking, checkDemandForSlot } from '@/lib/actions'; // Assuming actions are in one file

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
      userEmail: '',
    },
  });
  const { control, handleSubmit, watch, setValue, trigger, formState: { errors } } = form;

  const watchedScreenId = watch('screenId');
  const watchedDate = watch('date');
  const watchedTimeSlot = watch('timeSlot');

  useEffect(() => {
    async function fetchScreens() {
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
    fetchScreens();
  }, [toast]);

  const nextStep = async () => {
    let isValid = false;
    if (currentStep === 1) isValid = await trigger("screenId");
    if (currentStep === 2) isValid = await trigger(["date", "timeSlot"]);
    if (currentStep === 3) isValid = await trigger(["userName", "userEmail"]);
    
    if (isValid || currentStep === 4) { // Step 4 is review, no validation needed to proceed TO it
      if (currentStep === 3) { // Moving from User Details to Review
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
        timeSlot: watchedTimeSlot,
      });

      if (demandInfo.level === 'high' || demandInfo.level === 'medium') { // Trigger AI for high or medium
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
        // Don't advance step automatically, wait for dialog interaction
      } else {
         setCurrentStep(prev => prev + 1); // No high demand, proceed to review
      }
    } catch (error) {
      toast({ title: "Recommendation Error", description: "Could not get recommendations. Proceeding with booking.", variant: "destructive" });
      setCurrentStep(prev => prev + 1); // Error, proceed to review
    } finally {
      setIsCheckingDemand(false);
    }
  };
  
  const handleSelectRecommendation = (type: 'time' | 'screen', value: string) => {
    if (type === 'time') {
      setValue('timeSlot', value as TimeSlot, { shouldValidate: true });
    } else if (type === 'screen') {
      setValue('screenId', value, { shouldValidate: true });
    }
    setShowRecommendationDialog(false);
    setCurrentStep(4); // Go to review step
  };

  const handleProceedWithOriginal = () => {
    setShowRecommendationDialog(false);
    setCurrentStep(4); // Go to review step
  };


  const onSubmit = async (data: BookingFormValues) => {
    setIsSubmitting(true);
    startTransition(async () => {
      try {
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
          {/* Progress Bar */}
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
                            onSelect={(date) => field.onChange(date)}
                            initialFocus
                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || date.getDay() === 0 /* Sunday */}
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
                        defaultValue={field.value}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2"
                      >
                        {timeSlots.map(slot => (
                          <Label
                            key={slot}
                            htmlFor={slot}
                            className={cn(
                              "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                              field.value === slot && "border-primary ring-2 ring-primary"
                            )}
                          >
                            <RadioGroupItem value={slot} id={slot} className="sr-only" />
                            {slot}
                          </Label>
                        ))}
                      </RadioGroup>
                    )}
                  />
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
                  <Label htmlFor="userEmail" className="text-md font-medium">Email Address</Label>
                  <Controller
                    name="userEmail"
                    control={control}
                    render={({ field }) => <Input id="userEmail" type="email" {...field} className="mt-1" placeholder="e.g. jane.doe@example.com" />}
                  />
                  {errors.userEmail && <p className="text-destructive mt-1 text-sm">{errors.userEmail.message}</p>}
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
                    <p><strong>Email:</strong> {watch('userEmail') || 'N/A'}</p>
                  </CardContent>
                </Card>
              </section>
            )}
          </CardContent>

          <CardFooter className="p-6 flex justify-between border-t">
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1 || isSubmitting || isPending || isCheckingDemand}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {currentStep < steps.length -1 && ( // -1 because step 3 has a special next handling
                 <Button type="button" onClick={nextStep} disabled={isSubmitting || isPending || (currentStep === 3 && isCheckingDemand) }>
                {currentStep === 3 && isCheckingDemand ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {currentStep === 3 && isCheckingDemand ? "Checking..." : "Next"}
                {currentStep < 3 && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            )}
             {currentStep === steps.length-1 && ( // On User Details step, "Next" leads to Review or AI Dialog
              <Button type="button" onClick={nextStep} disabled={isSubmitting || isPending || isCheckingDemand}>
                {isCheckingDemand ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isCheckingDemand ? "Checking Availability..." : "Review Booking"}
                {!isCheckingDemand && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            )}
            {currentStep === steps.length && (
              <Button type="submit" disabled={isSubmitting || isPending}>
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

