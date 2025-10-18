import { useEffect, useState, useRef } from 'react';
import * as turf from '@turf/turf';

interface SlugChaseLogicProps {
  userPosition: [number, number] | null;
  onCoinsEarned: (amount: number) => void;
  onDistanceUpdate: (distance: number) => void;
  onSlugPositionUpdate: (position: [number, number]) => void;
}

const SlugChaseLogic = ({ 
  userPosition, 
  onCoinsEarned, 
  onDistanceUpdate,
  onSlugPositionUpdate 
}: SlugChaseLogicProps) => {
  const [slugPosition, setSlugPosition] = useState<[number, number] | null>(null);
  const [distanceFromSlug, setDistanceFromSlug] = useState<number>(0);
  const [userSpeed, setUserSpeed] = useState<number>(0); // km/h
  const [slugSpeed, setSlugSpeed] = useState<number>(4.5); // km/h
  const lastUserPosition = useRef<[number, number] | null>(null);
  const lastUpdateTime = useRef<number>(Date.now());
  const coinTimerRef = useRef<number>(0);

  // Initialize slug position 200 meters away from user
  useEffect(() => {
    if (!userPosition || slugPosition) return;
    
    // Spawn slug 200m away (roughly south-west)
    const from = turf.point([userPosition[0], userPosition[1]]);
    const bearing = 225; // South-west direction
    const slugPoint = turf.destination(from, 0.2, bearing, { units: 'kilometers' });
    const initialSlugPos: [number, number] = [
      slugPoint.geometry.coordinates[0],
      slugPoint.geometry.coordinates[1]
    ];
    setSlugPosition(initialSlugPos);
    onSlugPositionUpdate(initialSlugPos);
  }, [userPosition]);

  // Calculate user speed and track movement (filter GPS drift)
  useEffect(() => {
    if (!userPosition) {
      lastUserPosition.current = userPosition;
      lastUpdateTime.current = Date.now();
      return;
    }

    if (!lastUserPosition.current) {
      lastUserPosition.current = userPosition;
      lastUpdateTime.current = Date.now();
      return;
    }

    const now = Date.now();
    const timeDiff = (now - lastUpdateTime.current) / 1000; // seconds

    if (timeDiff < 2) return; // Update every 2 seconds

    const from = turf.point([lastUserPosition.current[0], lastUserPosition.current[1]]);
    const to = turf.point([userPosition[0], userPosition[1]]);
    const distanceMovedKm = turf.distance(from, to, { units: 'kilometers' });
    const distanceMovedM = distanceMovedKm * 1000;

    // Filter GPS drift - only count movement > 5 meters
    if (distanceMovedM < 5) {
      setUserSpeed(0); // Consider as stationary
      lastUpdateTime.current = now;
      return;
    }

    // Calculate speed in km/h
    const speed = (distanceMovedKm / timeDiff) * 3600;
    setUserSpeed(speed);

    // Award coins for movement (1 coin per 10 meters)
    onDistanceUpdate(distanceMovedM);
    
    coinTimerRef.current += distanceMovedM;
    if (coinTimerRef.current >= 10) {
      const coinsToAward = Math.floor(coinTimerRef.current / 10);
      onCoinsEarned(coinsToAward);
      coinTimerRef.current = coinTimerRef.current % 10;
    }

    lastUserPosition.current = userPosition;
    lastUpdateTime.current = now;
  }, [userPosition]);

  // Calculate slug speed based on user speed
  useEffect(() => {
    if (userSpeed === 0) {
      setSlugSpeed(4.5); // Minimum speed when user is stationary
      return;
    }

    let calculatedSpeed: number;

    if (userSpeed > 10) {
      // Running too fast - slug speeds up slightly to catch up
      calculatedSpeed = userSpeed * 0.75 + 0.5;
    } else {
      // Normal case: slug is 0.75x user speed
      calculatedSpeed = userSpeed * 0.75;
    }

    // Enforce minimum speed of 4.5 km/h
    calculatedSpeed = Math.max(calculatedSpeed, 4.5);

    setSlugSpeed(calculatedSpeed);
  }, [userSpeed]);

  // Move slug toward user based on calculated speed
  useEffect(() => {
    if (!userPosition || !slugPosition) return;

    const interval = setInterval(() => {
      const from = turf.point([slugPosition[0], slugPosition[1]]);
      const to = turf.point([userPosition[0], userPosition[1]]);
      const distance = turf.distance(from, to, { units: 'meters' });
      
      setDistanceFromSlug(distance);

      // Don't move slug if already caught user
      if (distance < 3) {
        console.log('🐌 The slug caught you! Distance:', distance.toFixed(2), 'm');
        return;
      }

      // Calculate how far slug moves in 2 seconds at current slug speed
      const slugDistanceKm = (slugSpeed / 3600) * 2; // km per 2 seconds
      
      console.log(`🐌 Moving slug: ${slugSpeed.toFixed(1)} km/h = ${(slugDistanceKm * 1000).toFixed(2)}m per 2sec`);
      
      // Calculate direction and move slug toward user
      const bearing = turf.bearing(from, to);
      const newSlugPoint = turf.destination(from, slugDistanceKm, bearing, { units: 'kilometers' });
      const newSlugPos: [number, number] = [
        newSlugPoint.geometry.coordinates[0],
        newSlugPoint.geometry.coordinates[1]
      ];
      
      setSlugPosition(newSlugPos);
      onSlugPositionUpdate(newSlugPos);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [userPosition, slugPosition, slugSpeed]);

  // Determine status message
  const getStatusMessage = () => {
    if (distanceFromSlug < 3) return '💀 CAUGHT! Game Over!';
    if (distanceFromSlug < 20) return '🚨 DANGER! Run faster!';
    if (distanceFromSlug < 50) return '⚠️ Too close! Speed up!';
    if (userSpeed === 0) return '🐢 Standing still - slug approaching at 4.5 km/h!';
    if (userSpeed < 4) return '🐢 Too slow! Slug catching up!';
    if (userSpeed > 10) return '🏃‍♂️ Too fast! Slug speeding up!';
    return '✅ Perfect pace!';
  };

  return (
    <div className="fixed top-20 left-4 bg-background/80 backdrop-blur-sm p-3 rounded-lg text-sm space-y-1 min-w-[200px]">
      <div className="font-semibold">🐌 Slug Chase</div>
      <div>Distance: {distanceFromSlug.toFixed(1)}m</div>
      <div>Your Speed: {userSpeed.toFixed(1)} km/h</div>
      <div>Slug Speed: {slugSpeed.toFixed(1)} km/h</div>
      <div className="text-xs text-muted-foreground pt-1 border-t">
        {getStatusMessage()}
      </div>
    </div>
  );
};

export default SlugChaseLogic;
