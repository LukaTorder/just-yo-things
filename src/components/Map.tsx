import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface MapProps {
  userPosition: [number, number] | null;
}

const Map = ({ userPosition }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [tokenSet, setTokenSet] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !tokenSet) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: userPosition || [-74.5, 40],
      zoom: 15,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add user marker
    const el = document.createElement('div');
    el.className = 'user-marker';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#3b82f6';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';

    userMarker.current = new mapboxgl.Marker(el)
      .setLngLat(userPosition || [-74.5, 40])
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [tokenSet, mapboxToken]);

  useEffect(() => {
    if (userPosition && map.current && userMarker.current) {
      userMarker.current.setLngLat(userPosition);
      map.current.setCenter(userPosition);
    }
  }, [userPosition]);

  if (!tokenSet) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Enter Mapbox Token</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Get your public token from{' '}
            <a 
              href="https://mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              mapbox.com
            </a>
          </p>
          <Input
            type="text"
            placeholder="pk.ey..."
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="mb-4"
          />
          <button
            onClick={() => setTokenSet(true)}
            disabled={!mapboxToken}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50"
          >
            Start Game
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-8rem)]">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default Map;
