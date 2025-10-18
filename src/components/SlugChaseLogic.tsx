import { useEffect, useState } from 'react';

interface SlugChaseLogicProps {
  userPosition: [number, number] | null;
  onCoinsEarned: (amount: number) => void;
  onDistanceUpdate: (distance: number) => void;
}

/**
 * 🐌 SLUG CHASE LOGIC COMPONENT
 * 
 * TODO: Implement your chase logic here!
 * 
 * This component handles:
 * - Slug position calculation
 * - Distance tracking between user and slug
 * - Chase mechanics (speed, direction, behavior)
 * - Reward system when user runs/escapes
 * 
 * Current implementation is a placeholder.
 * Replace with your actual chase algorithm.
 */
const SlugChaseLogic = ({ 
  userPosition, 
  onCoinsEarned, 
  onDistanceUpdate 
}: SlugChaseLogicProps) => {
  const [slugPosition, setSlugPosition] = useState<[number, number] | null>(null);
  const [distanceFromSlug, setDistanceFromSlug] = useState<number>(0);

  useEffect(() => {
    if (!userPosition) return;

    // TODO: Replace this with your actual chase logic
    // For now, just initializing slug position nearby
    if (!slugPosition) {
      setSlugPosition([
        userPosition[0] + 0.001,
        userPosition[1] + 0.001
      ]);
    }

    // TODO: Implement chase algorithm
    // - Calculate slug's next position based on user position
    // - Apply chase speed and behavior rules
    // - Update slug position
    // - Calculate distance
    // - Award coins based on distance/time
    
    console.log('🐌 Chase logic placeholder - implement your algorithm here!');
  }, [userPosition]);

  return (
    <div className="fixed top-20 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg text-xs">
      <div>Distance from slug: {distanceFromSlug.toFixed(0)}m</div>
      <div className="text-muted-foreground">Chase logic: TODO</div>
    </div>
  );
};

export default SlugChaseLogic;
