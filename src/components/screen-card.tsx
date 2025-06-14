
"use client";

import Image from 'next/image';
import type { Screen } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, MapPin, Settings } from 'lucide-react';

interface ScreenCardProps {
  screen: Screen;
  onSelect: (screenId: string) => void;
  isSelected: boolean;
}

export function ScreenCard({ screen, onSelect, isSelected }: ScreenCardProps) {
  return (
    <Card 
      className={`transition-all duration-300 ease-in-out hover:shadow-xl cursor-pointer ${isSelected ? 'ring-2 ring-primary shadow-xl' : 'shadow-md'}`}
      onClick={() => onSelect(screen.id)}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(screen.id); }}
    >
      <CardHeader className="p-4">
        <div className="relative w-full h-40 rounded-t-md overflow-hidden mb-3">
          <Image
            src={screen.imageUrl || "https://placehold.co/300x200.png"}
            alt={screen.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint="digital screen display"
          />
        </div>
        <CardTitle className="text-xl font-headline">{screen.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2 text-sm">
        <div className="flex items-center text-muted-foreground">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{screen.location}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Settings className="w-4 h-4 mr-2" />
          <span>{screen.specs}</span>
        </div>
        <Button 
          variant={isSelected ? "default" : "outline"} 
          className="w-full mt-3"
          aria-label={`Select screen ${screen.name}`}
        >
          {isSelected ? 'Selected' : 'Select Screen'}
        </Button>
      </CardContent>
    </Card>
  );
}
