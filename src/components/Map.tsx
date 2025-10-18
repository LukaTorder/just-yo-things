import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface MapProps {
  userPosition: [number, number] | null;
}

const containerStyle = {
  width: '100%',
  height: '100%'
};

const Map = ({ userPosition }: MapProps) => {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [tokenSet, setTokenSet] = useState(false);

  if (!tokenSet) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Enter Google Maps API Key</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Get your API key from{' '}
            <a 
              href="https://console.cloud.google.com/google/maps-apis" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Google Cloud Console
            </a>
          </p>
          <Input
            type="text"
            placeholder="AIza..."
            value={googleMapsApiKey}
            onChange={(e) => setGoogleMapsApiKey(e.target.value)}
            className="mb-4"
          />
          <button
            onClick={() => setTokenSet(true)}
            disabled={!googleMapsApiKey}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50"
          >
            Start Game
          </button>
        </Card>
      </div>
    );
  }

  return <MapWithLoader apiKey={googleMapsApiKey} userPosition={userPosition} />;
};

const MapWithLoader = ({ apiKey, userPosition }: { apiKey: string; userPosition: [number, number] | null }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const center = userPosition ? { lat: userPosition[1], lng: userPosition[0] } : { lat: 40, lng: -74.5 };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (map && userPosition) {
      map.panTo({ lat: userPosition[1], lng: userPosition[0] });
    }
  }, [userPosition, map]);

  return (
    <div className="relative h-[calc(100vh-8rem)]">
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {userPosition && (
            <Marker
              position={{ lat: userPosition[1], lng: userPosition[0] }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#3b82f6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
              }}
            />
          )}
        </GoogleMap>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p>Loading map...</p>
        </div>
      )}
    </div>
  );
};

export default Map;
