import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Map from '@/components/Map';
import SlugChaseLogic from '@/components/SlugChaseLogic';
import { Coins, Target, Trophy } from 'lucide-react';

const Game = () => {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [coins, setCoins] = useState(0);
  const [dailyDistance, setDailyDistance] = useState(0);
  const [dailyGoal] = useState(5000); // 5km daily goal
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Get user's geolocation
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setUserPosition([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError(error.message || 'Location unavailable.');
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const requestCurrentPosition = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition([position.coords.longitude, position.coords.latitude]);
        setLocationError(null);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError(error.message || 'Location unavailable.');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
    );
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

        {!userPosition && (
          <div className="p-4">
            <Card className="p-3">
              <p className="text-sm">Waiting for GPS... Please allow location access.</p>
              {locationError && <p className="text-sm text-destructive mt-2">{locationError}</p>}
              <Button onClick={requestCurrentPosition} className="mt-2" variant="outline">
                Use my location
              </Button>
            </Card>
          </div>
        )}
        
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
