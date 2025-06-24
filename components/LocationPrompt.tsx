'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUserLocation } from '@/lib/utils';

interface LocationPromptProps {
  onLocationGranted: (location: string) => void;
  onSkip: () => void;
  language: string;
}

export default function LocationPrompt({ onLocationGranted, onSkip, language }: LocationPromptProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationRequest = async () => {
    setIsLoading(true);
    try {
      const position = await getUserLocation();
      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding to get location name
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY || 'demo'}`
      );
      
      let locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results[0]) {
          locationName = data.results[0].formatted;
        }
      }
      
      // Store location in localStorage
      localStorage.setItem('userLocation', locationName);
      localStorage.setItem('userCoords', JSON.stringify({ latitude, longitude }));
      
      onLocationGranted(locationName);
    } catch (error) {
      console.error('Location error:', error);
      toast.error('Unable to get your location. You can still use the app without location services.');
      onSkip();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-white/10 backdrop-blur-md border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center text-center justify-center text-white">
            <MapPin className="h-5 w-5 mr-2 text-emerald-400" />
            Where are you exploring today?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-gray-300 text-center">
            Share your location to get personalized museum recommendations and enhanced artwork context.
          </p>
          
          <div className="space-y-3">
            <h4 className="font-medium text-white">Benefits:</h4>
            <ul className="space-y-2">
              {[
                "Discover nearby museums and galleries",
                "Get location-specific artwork context",
                "Receive personalized recommendations"
              ].map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <div className="bg-emerald-500/20 rounded-full p-1 mr-3 mt-0.5 border border-emerald-400/30">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleLocationRequest}
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Allow Location
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={onSkip}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm"
            >
              Skip for now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}