import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Map from '@/components/Map';
import SlugChaseLogic from '@/components/SlugChaseLogic';
import { Coins, Target, Trophy, Navigation } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';

const Game = () => {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [coins, setCoins] = useState(0);
  const [dailyDistance, setDailyDistance] = useState(0);
  const [dailyGoal] = useState(5000); // 5km daily goal
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<string | null>(null);

  // Start GPS tracking with Capacitor (better for mobile)
  const startTracking = async () => {
    try {
      setLocationError(null);
      setIsTracking(true);

      // Request permissions first
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          setLocationError('Location permission denied');
          setIsTracking(false);
          return;
        }
      }

      // Get current position first
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      
      setUserPosition([position.coords.longitude, position.coords.latitude]);

      // Watch position for continuous tracking
      watchIdRef.current = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        },
        (position, err) => {
          if (err) {
            console.error('GPS error:', err);
            setLocationError(err.message);
            return;
          }
          if (position) {
            setUserPosition([position.coords.longitude, position.coords.latitude]);
            setLocationError(null);
          }
        }
      );
    } catch (error: any) {
      console.error('Error starting GPS:', error);
      setLocationError(error.message || 'Failed to start GPS tracking');
      setIsTracking(false);
    }
  };

  // Stop tracking
  const stopTracking = async () => {
    if (watchIdRef.current) {
      await Geolocation.clearWatch({ id: watchIdRef.current });
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  // Auto-start tracking on mount
  useEffect(() => {
    startTracking();
    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
      }
    };
  }, []);

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
            <span className="text-sm">{dailyDistance}m / {dailyGoal}m</span>
          </Card>
          <Card className="flex items-center gap-2 px-3 py-2">
            <Trophy className="w-4 h-4 text-purple-500" />
          </Card>
        </div>
      </div>

      {/* Map with Slug */}
      <div className="pt-16">
        <Map userPosition={userPosition} />

        <div className="fixed top-20 left-4 right-4 z-10">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className={`w-4 h-4 ${isTracking ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">
                  {isTracking ? 'GPS Active' : 'GPS Inactive'}
                </span>
              </div>
              <Button 
                onClick={isTracking ? stopTracking : startTracking} 
                size="sm"
                variant={isTracking ? 'destructive' : 'default'}
              >
                {isTracking ? 'Stop' : 'Start GPS'}
              </Button>
            </div>
            {locationError && (
              <p className="text-sm text-destructive mt-2">{locationError}</p>
            )}
            {!userPosition && isTracking && (
              <p className="text-sm text-muted-foreground mt-2">Acquiring GPS signal...</p>
            )}
            {userPosition && (
              <p className="text-xs text-muted-foreground mt-1">
                📍 {userPosition[1].toFixed(6)}, {userPosition[0].toFixed(6)}
              </p>
            )}
          </Card>
        </div>
        
        {/* Slug Chase Logic Component */}
        <SlugChaseLogic 
          userPosition={userPosition}
          onCoinsEarned={(amount) => setCoins(prev => prev + amount)}
          onDistanceUpdate={(distance) => setDailyDistance(prev => prev + distance)}
        />
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4">
        <div className="container flex gap-2">
          <Button className="flex-1" variant="outline">Profile</Button>
          <Button className="flex-1" variant="outline">Skins</Button>
          <Button className="flex-1" variant="outline">Stats</Button>
        </div>
      </div>
    </div>
  );
};

export default Game;
