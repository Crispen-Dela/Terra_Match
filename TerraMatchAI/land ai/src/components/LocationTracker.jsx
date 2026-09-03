import React, { useEffect, useRef, useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { ref, push, set, onDisconnect, serverTimestamp } from 'firebase/database';

export default function LocationTracker({ enabled = true }) {
  const watchIdRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported');
      return;
    }

    const handlePos = async (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
      setPosition(coords);

      const user = auth.currentUser;
      if (!user) return;

      try {
        // Write a live location node and a timestamped history entry
        const liveRef = ref(db, `liveLocations/${user.uid}`);
        await set(liveRef, { ...coords, updatedAt: serverTimestamp() });

        const histRef = push(ref(db, `userLocations/${user.uid}`));
        await set(histRef, { ...coords, ts: serverTimestamp() });

        // Ensure live node is removed on disconnect
        onDisconnect(liveRef).remove();
      } catch (err) {
        console.error('Failed to write location', err);
      }
    };

    const handleError = (err) => setError(err.message);

    const id = navigator.geolocation.watchPosition(handlePos, handleError, { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 });
    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [enabled]);

  return (
    <div>
      <h4>Location Tracker</h4>
      {error && <div style={{color:'red'}}>{error}</div>}
      {position ? (
        <div>Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)} (accuracy: {position.accuracy}m)</div>
      ) : (
        <div>Waiting for location…</div>
      )}
    </div>
  );
}
