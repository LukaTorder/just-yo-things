import { useEffect, useState, useRef } from "react";
import * as turf from "@turf/turf";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SlugChaseLogicProps {
  userPosition: [number, number] | null;
  onCoinsEarned: (amount: number) => void;
  onDistanceUpdate: (distance: number) => void;
  onSlugPositionUpdate: (position: [number, number]) => void;
  onCaught: () => void;
}

const SlugChaseLogic = ({
  userPosition,
  onCoinsEarned,
  onDistanceUpdate,
  onSlugPositionUpdate,
  onCaught,
}: SlugChaseLogicProps) => {
  const [slugPosition, setSlugPosition] = useState<[number, number] | null>(null);
  const [distanceFromSlug, setDistanceFromSlug] = useState<number>(0);
  const [userSpeed, setUserSpeed] = useState<number>(0); // km/h
  const [slugSpeed, setSlugSpeed] = useState<number>(15); // km/h (constant for demo, clearly visible)
  const lastUserPosition = useRef<[number, number] | null>(null);
  const lastUpdateTime = useRef<number>(Date.now());
  const coinTimerRef = useRef<number>(0);
  const slugPosRef = useRef<[number, number] | null>(null);
  const userPosRef = useRef<[number, number] | null>(null);
  const moveIntervalRef = useRef<number | null>(null);
  const [isCaught, setIsCaught] = useState(false);

  // Initialize slug position 200 meters away from user
  useEffect(() => {
    if (!userPosition || slugPosition) return;

    // Spawn slug 200m away (roughly south-west)
    const from = turf.point([userPosition[0], userPosition[1]]);
    const bearing = 225; // South-west direction
    const slugPoint = turf.destination(from, 0.2, bearing, { units: "kilometers" });
    const initialSlugPos: [number, number] = [slugPoint.geometry.coordinates[0], slugPoint.geometry.coordinates[1]];
    setSlugPosition(initialSlugPos);
    slugPosRef.current = initialSlugPos;
    onSlugPositionUpdate(initialSlugPos);
  }, [userPosition]);

  // Keep refs in sync
  useEffect(() => {
    userPosRef.current = userPosition;
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
    const distanceMovedKm = turf.distance(from, to, { units: "kilometers" });
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

  // Move slug toward user (ref-driven, independent of state re-renders)
  useEffect(() => {
    if (!userPosRef.current || !slugPosRef.current) return;

    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }

    moveIntervalRef.current = window.setInterval(() => {
      if (!userPosRef.current || !slugPosRef.current) return;

      const from = turf.point([slugPosRef.current[0], slugPosRef.current[1]]);
      const to = turf.point([userPosRef.current[0], userPosRef.current[1]]);
      const distance = turf.distance(from, to, { units: "meters" });
      setDistanceFromSlug(distance);

      if (distance < 20 && !isCaught) {
        setIsCaught(true);
        if (moveIntervalRef.current) {
          clearInterval(moveIntervalRef.current);
          moveIntervalRef.current = null;
        }
        onCaught();
        return;
      }

      const slugDistanceKm = (slugSpeed / 3600) * 1; // km per 1 second
      const bearing = turf.bearing(from, to);
      const newPoint = turf.destination(from, slugDistanceKm, bearing, { units: "kilometers" });
      const newPos: [number, number] = [newPoint.geometry.coordinates[0], newPoint.geometry.coordinates[1]];

      slugPosRef.current = newPos;
      setSlugPosition(newPos);
      onSlugPositionUpdate(newPos);
    }, 1000);

    return () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }
    };
  }, [slugSpeed, userPosition, slugPosition]);

  const getStatusMessage = () => {
    if (distanceFromSlug < 10) return "⚠️ DANGER! Slug is very close!";
    if (distanceFromSlug < 30) return "⚡ Run! Slug is catching up!";
    if (userSpeed > slugSpeed) return "✅ You're outrunning the slug!";
    return "🏃 Keep moving!";
  };

  return (
    <>
      <div className="fixed top-20 left-4 bg-background/80 backdrop-blur-sm p-3 rounded-lg text-sm space-y-1 min-w-[200px]">
        <div className="font-semibold">🐌 Slug Chase</div>
        <div>Distance: {distanceFromSlug.toFixed(1)}m</div>
        <div>Your Speed: {userSpeed.toFixed(1)} km/h</div>
        <div>Slug Speed: {slugSpeed.toFixed(1)} km/h</div>
        <div className="text-xs text-muted-foreground pt-1 border-t">{getStatusMessage()}</div>
      </div>

    </>
  );
};

export default SlugChaseLogic;
