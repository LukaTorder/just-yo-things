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
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const lastUserPosition = useRef<[number, number] | null>(null);
  const coinTimerRef = useRef<number>(0);

  // Initialize slug position 100 meters away from user
  useEffect(() => {
    if (!userPosition || slugPosition) return;
    
    const initialSlugPos: [number, number] = [
      userPosition[0] - 0.0009, // ~100m west
      userPosition[1] - 0.0009  // ~100m south
    ];
    setSlugPosition(initialSlugPos);
    onSlugPositionUpdate(initialSlugPos);
  }, [userPosition]);

  // Chase logic - slug moves toward user every 2 seconds
  useEffect(() => {
    if (!userPosition || !slugPosition) return;

    const interval = setInterval(() => {
      const from = turf.point([slugPosition[0], slugPosition[1]]);
      const to = turf.point([userPosition[0], userPosition[1]]);
      const distance = turf.distance(from, to, { units: 'meters' });
      
      setDistanceFromSlug(distance);

      // Slug speed: 0.5 meters per second = 1m every 2 seconds
      const slugSpeed = 0.00001; // degrees (~1m)
      
      // Calculate direction and move slug toward user
      const bearing = turf.bearing(from, to);
      const newSlugPoint = turf.destination(from, slugSpeed, bearing, { units: 'degrees' });
      const newSlugPos: [number, number] = [
        newSlugPoint.geometry.coordinates[0],
        newSlugPoint.geometry.coordinates[1]
      ];
      
      setSlugPosition(newSlugPos);
      onSlugPositionUpdate(newSlugPos);

      // Game over if slug catches you (within 5 meters)
      if (distance < 5) {
        console.log('🐌 The slug caught you!');
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [userPosition, slugPosition]);

  // Track user movement and award coins
  useEffect(() => {
    if (!userPosition || !lastUserPosition.current) {
      lastUserPosition.current = userPosition;
      return;
    }

    const from = turf.point([lastUserPosition.current[0], lastUserPosition.current[1]]);
    const to = turf.point([userPosition[0], userPosition[1]]);
    const distanceMoved = turf.distance(from, to, { units: 'meters' });

    if (distanceMoved > 1) { // Only count if moved more than 1 meter
      const newTotal = totalDistance + distanceMoved;
      setTotalDistance(newTotal);
      onDistanceUpdate(distanceMoved);
      
      // Award 1 coin per 10 meters
      coinTimerRef.current += distanceMoved;
      if (coinTimerRef.current >= 10) {
        const coinsToAward = Math.floor(coinTimerRef.current / 10);
        onCoinsEarned(coinsToAward);
        coinTimerRef.current = coinTimerRef.current % 10;
      }
    }

    lastUserPosition.current = userPosition;
  }, [userPosition]);

  return (
    <div className="fixed top-20 left-4 bg-background/80 backdrop-blur-sm p-3 rounded-lg text-sm space-y-1">
      <div className="font-semibold">🐌 Slug Status</div>
      <div>Distance: {distanceFromSlug.toFixed(1)}m</div>
      <div className="text-xs text-muted-foreground">
        {distanceFromSlug < 10 ? '⚠️ Too close!' : distanceFromSlug < 50 ? '🏃 Keep moving!' : '✅ Safe distance'}
      </div>
    </div>
  );
};

export default SlugChaseLogic;
