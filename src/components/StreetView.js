import React, { useEffect, useRef } from 'react';
import './StreetView.css';

function StreetView({ location }) {
  const streetViewRef = useRef(null);
  const panoramaRef = useRef(null);

  useEffect(() => {
    if (window.google && window.google.maps) {
      initStreetView();
    }
  }, []);

  useEffect(() => {
    if (panoramaRef.current && location) {
      panoramaRef.current.setPosition({
        lat: location.lat,
        lng: location.lng
      });
      // Случайный угол обзора
      panoramaRef.current.setPov({
        heading: Math.random() * 360,
        pitch: 0
      });
    } else if (!panoramaRef.current && location && window.google && window.google.maps) {
      initStreetView();
    }
  }, [location]);

  const initStreetView = () => {
    if (streetViewRef.current && window.google && window.google.maps && location) {
      panoramaRef.current = new window.google.maps.StreetViewPanorama(
        streetViewRef.current,
        {
          position: { lat: location.lat, lng: location.lng },
          pov: { 
            heading: Math.random() * 360, 
            pitch: 0 
          },
          zoom: 0,
          addressControl: false,
          showRoadLabels: false,
          panControl: true,
          zoomControl: true,
          fullscreenControl: false,
          linksControl: true,
          enableCloseButton: false,
          motionTracking: false,
          motionTrackingControl: false,
        }
      );
    }
  };

  return <div ref={streetViewRef} className="street-view"></div>;
}

export default StreetView;

