import React, { useEffect, useRef } from 'react';

// Simple Google Maps wrapper — requires adding the Google Maps JS script in index.html with VITE_GOOGLE_MAPS_API_KEY
export default function MapView({ center = { lat: 0, lng: 0 }, zoom = 2 }) {
  const refDiv = useRef(null);

  useEffect(() => {
    if (!window.google || !window.google.maps) {
      console.warn('Google Maps JS not loaded. Add <script src="https://maps.googleapis.com/maps/api/js?key=%REPLACE%&libraries=places"></script> to index.html or load dynamically.');
      return;
    }

    const map = new window.google.maps.Map(refDiv.current, {
      center,
      zoom,
    });

    return () => {
      // no-op cleanup for now
    };
  }, [center, zoom]);

  return <div ref={refDiv} style={{ width: '100%', height: 400, border: '1px solid #ddd' }} />;
}
