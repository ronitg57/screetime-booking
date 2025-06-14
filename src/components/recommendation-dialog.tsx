
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { RecommendTimeSlotsOutput } from '@/ai/flows/recommend-time-slots';
import { Screen } from "@/lib/types";

interface RecommendationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recommendations: RecommendTimeSlotsOutput | null;
  currentSelection: { screenName: string; date: string; timeSlot: string };
  allScreens: Screen[];
  onSelectRecommendation: (type: 'time' | 'screen', value: string) => void;
  onProceedWithOriginal: () => void;
}

export function RecommendationDialog({
  isOpen,
  onOpenChange,
  recommendations,
  currentSelection,
  allScreens,
  onSelectRecommendation,
  onProceedWithOriginal,
}: RecommendationDialogProps) {
  if (!recommendations) return null;

  const getScreenName = (screenId: string) => {
    return allScreens.find(s => s.id === screenId)?.name || screenId;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-headline text-2xl">High Demand Alert & Recommendations</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            The slot you selected ({currentSelection.screenName} on {currentSelection.date} for {currentSelection.timeSlot}) is experiencing high demand.
            Here are some AI-powered suggestions to help maximize screen coverage:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="my-4 space-y-4">
          <p className="font-medium text-muted-foreground italic">{recommendations.reasoning}</p>

          {recommendations.alternativeTimeSlots.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Alternative Time Slots (same screen):</h4>
              <div className="space-y-2">
                {recommendations.alternativeTimeSlots.map((slot) => (
                  <Button key={slot} variant="outline" className="w-full justify-start" onClick={() => onSelectRecommendation('time', slot)}>
                    Book {slot} instead
                  </Button>
                ))}
              </div>
            </div>
          )}

          {recommendations.nearbyScreenRecommendations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Nearby Screens (same time slot):</h4>
              <div className="space-y-2">
                {recommendations.nearbyScreenRecommendations.map((screenId) => (
                  <Button key={screenId} variant="outline" className="w-full justify-start" onClick={() => onSelectRecommendation('screen', screenId)}>
                    Book screen: {getScreenName(screenId)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onProceedWithOriginal}>Proceed with Original</AlertDialogCancel>
          {/* The actions are handled by buttons above, this is mainly for proceeding or closing. */}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
