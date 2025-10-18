import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Map from '@/components/Map';
import SlugChaseLogic from '@/components/SlugChaseLogic';
import { Coins, Target, Trophy, Navigation } from 'lucide-react';

const Game = () => {
  const navigate = useNavigate();
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [slugPosition, setSlugPosition] = useState<[number, number] | null>(null);
  const [coins, setCoins] = useState(0);
  const [dailyDistance, setDailyDistance] = useState(0);
  const [dailyGoal] = useState(5000); // 5km daily goal
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [isCaught, setIsCaught] = useState(false);
  const [finalCoins, setFinalCoins] = useState(0);
  const [finalDistance, setFinalDistance] = useState(0);

  // Start GPS tracking (works on phone browsers!)
  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('GPS not supported on this device');
      return;
    }

    setLocationError(null);
    setIsTracking(true);

    // Get current position first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition([position.coords.longitude, position.coords.latitude]);
        setAccuracy(position.coords.accuracy);
        setLocationError(null);
      },
      (error) => {
        console.error('GPS error:', error);
        setLocationError(error.message);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );

    // Watch position for continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition([position.coords.longitude, position.coords.latitude]);
        setAccuracy(position.coords.accuracy);
        setLocationError(null);
      },
      (error) => {
        console.error('GPS error:', error);
        setLocationError(error.message);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Stop tracking
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  // Auto-start tracking on mount
  useEffect(() => {
    startTracking();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleCaught = () => {
    setFinalCoins(coins);
    setFinalDistance(dailyDistance);
    setIsCaught(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Stats Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="container flex items-center justify-between py-3">
          <Card className="flex items-center gap-2 px-3 py-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="font-bold">{coins}</span>
          </Card>
          <Card className="flex items-center gap-2 px-3 py-2">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-sm">{(dailyDistance / 1000).toFixed(2)}km / {(dailyGoal / 1000).toFixed(0)}km</span>
          </Card>
          <Card className="flex items-center gap-2 px-3 py-2">
            <Trophy className="w-4 h-4 text-purple-500" />
          </Card>
        </div>
      </div>

      {/* Map with Slug */}
      <div className="pt-16">
        <Map userPosition={userPosition} slugPosition={slugPosition} />

        <div className="fixed top-20 left-4 z-10">
          <Card className="p-2 flex items-center gap-2">
            <Navigation className={`w-4 h-4 ${isTracking ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
            <span className="text-xs font-medium">
              {isTracking ? 'GPS' : 'Off'}
            </span>
            {accuracy && isTracking && (
              <span className="text-xs text-muted-foreground">±{accuracy.toFixed(0)}m</span>
            )}
          </Card>
        </div>
        
        {/* Slug Chase Logic Component */}
        <SlugChaseLogic 
          userPosition={userPosition}
          onCoinsEarned={(amount) => setCoins(prev => prev + amount)}
          onDistanceUpdate={(distance) => setDailyDistance(prev => prev + distance)}
          onSlugPositionUpdate={setSlugPosition}
          onCaught={handleCaught}
        />
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4">
        <div className="container flex justify-center">
          <div className="text-sm text-muted-foreground">🐌 Keep running to stay ahead of the slug!</div>
        </div>
      </div>

      {/* Game Over Dialog */}
      <AlertDialog open={isCaught} onOpenChange={setIsCaught}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🐌 The Slug Caught You!</AlertDialogTitle>
            <AlertDialogDescription>
              Game Over! The immortal slug has caught up with you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">Coins Earned</span>
              </span>
              <span className="text-xl font-bold">{finalCoins}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Distance Traveled</span>
              </span>
              <span className="text-xl font-bold">{(finalDistance / 1000).toFixed(2)} km</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate('/')}>
              Main Menu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Game;
