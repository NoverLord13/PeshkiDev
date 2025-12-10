import React, { useEffect, useRef, useState } from 'react';
import './GuessMap.css';

function GuessMap({ onGuess, disabled, actualLocation, guessedLocation }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const actualMarkerRef = useRef(null);
  const lineRef = useRef(null);
  const clickListenerRef = useRef(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(window.innerWidth > 600); 
  // На мобилке карта скрыта, на ПК видна сразу

  useEffect(() => {
    if (window.google && window.google.maps && isVisible) {
      initMap();
    }

    return () => {
      if (clickListenerRef.current) {
        window.google.maps.event.removeListener(clickListenerRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (mapInstanceRef.current && actualLocation && guessedLocation) {
      showResults();
    }
  }, [actualLocation, guessedLocation]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      if (clickListenerRef.current) {
        window.google.maps.event.removeListener(clickListenerRef.current);
      }

      if (!disabled) {
        clickListenerRef.current = mapInstanceRef.current.addListener('click', (e) => {
          handleMapClick(e.latLng);
        });
      }
    }
  }, [disabled]);

  const initMap = () => {
    if (mapRef.current && window.google && window.google.maps) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 62.5, lng: 127 },
        zoom: 5,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      if (!disabled) {
        clickListenerRef.current = mapInstanceRef.current.addListener('click', (e) => {
          handleMapClick(e.latLng);
        });
      }
    }
  };

  const handleMapClick = (latLng) => {
    if (disabled) return;

    const lat = latLng.lat();
    const lng = latLng.lng();

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3,
      },
    });
  };

  const showResults = () => {
    if (!mapInstanceRef.current) return;

    if (actualMarkerRef.current) {
      actualMarkerRef.current.setMap(null);
    }
    actualMarkerRef.current = new window.google.maps.Marker({
      position: actualLocation,
      map: mapInstanceRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#34A853',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3,
      },
    });

    if (lineRef.current) {
      lineRef.current.setMap(null);
    }
    lineRef.current = new window.google.maps.Polyline({
      path: [guessedLocation, actualLocation],
      geodesic: true,
      strokeColor: '#EA4335',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: mapInstanceRef.current,
    });

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(guessedLocation);
    bounds.extend(actualLocation);
    mapInstanceRef.current.fitBounds(bounds);
  };

  const handleGuess = () => {
    if (!markerRef.current || disabled) return;
    const pos = markerRef.current.getPosition();
    onGuess(pos.lat(), pos.lng());
  };

  return (
    <>
{/* Кнопка открытия карты на мобильных */}
{!isVisible && (
  <button className="open-map-btn" onClick={() => setIsVisible(true)}>
    Открыть карту
  </button>
)}

{isVisible && (
  <div className={`guess-map-container ${isExpanded ? 'expanded' : ''}`}>

    {/* Кнопка свернуть (только мобильная) */}
    <button 
      className="close-map-btn"
      onClick={() => {
        setIsExpanded(false)
        setIsVisible(false)
      }}
    >
      ✕
    </button>

    <div className="map-header">
      <button 
        className="expand-button"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '−' : '+'}
      </button>
    </div>

    <div ref={mapRef} className="guess-map"></div>

    {!disabled && isExpanded && (
      <button 
        className="guess-button"
        onClick={handleGuess}
        disabled={!markerRef.current}
      >
        Угадать
      </button>
    )}
  </div>
)}

    </>
  );
}

export default GuessMap;
