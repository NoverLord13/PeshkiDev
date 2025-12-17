import React, { useEffect, useRef, useState } from 'react';
import './GuessMap.css';

function GuessMap({ onGuess, disabled, actualLocation, guessedLocation, helpActive = false, helpRadiusKm = 100, helpCenter, language = 'ru' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const actualMarkerRef = useRef(null);
  const lineRef = useRef(null);
  const helpCircleRef = useRef(null);
  const clickListenerRef = useRef(null);
  const [hasMarker, setHasMarker] = useState(false); // Новое состояние для отслеживания маркера
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(window.innerWidth > 600); 
  
   useEffect(() => {
    if (!guessedLocation && isExpanded) {
      setIsExpanded(false);
    }
  }, [guessedLocation]);

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
    if (!mapInstanceRef.current) return;

    // Удаляем визуализации прошлого раунда, если начинаем новый
    if (!guessedLocation) {
      if (actualMarkerRef.current) {
        actualMarkerRef.current.setMap(null);
        actualMarkerRef.current = null;
      }
      if (lineRef.current) {
        lineRef.current.setMap(null);
        lineRef.current = null;
      }
      // Сбрасываем состояние маркера при новом раунде
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      setHasMarker(false);
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

  useEffect(() => {
    if (!mapInstanceRef.current || !actualLocation) return;

    if (helpCircleRef.current) {
      helpCircleRef.current.setMap(null);
      helpCircleRef.current = null;
    }

    if (helpActive) {
      helpCircleRef.current = new window.google.maps.Circle({
        map: mapInstanceRef.current,
        center: helpCenter || actualLocation,
        radius: helpRadiusKm * 1000,
        strokeColor: '#4285F4',
        strokeOpacity: 0.5,
        strokeWeight: 2,
        fillColor: '#4285F4',
        fillOpacity: 0.08,
        clickable: false,
      });
      mapInstanceRef.current.panTo(actualLocation);
    }
  }, [helpActive, helpRadiusKm, actualLocation]);

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
    
    // Устанавливаем состояние, что маркер создан
    setHasMarker(true);
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

  const isYakut = language === 'sah';

  const handleGuess = () => {
    if (!markerRef.current || disabled) return;
    const pos = markerRef.current.getPosition();
    onGuess(pos.lat(), pos.lng());
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Кнопка открытия карты на мобильных */}
      {!isVisible && (
        <button className="open-map-btn" onClick={() => setIsVisible(true)}>
          {isYakut ? 'Картаны ас' : 'Открыть карту'}
        </button>
      )}

      {isVisible && (
        <div className={`guess-map-container ${isExpanded ? 'expanded' : ''}`}>

          {/* Кнопка свернуть (только мобильная) */}
          <button 
            className="close-map-btn"
            onClick={() => {
              setIsExpanded(false);
              setIsVisible(false);
            }}
          >
            ✕
          </button>

          <div className="map-header">
            <button 
              className="expand-button"
              onClick={handleExpand}
            >
              {isExpanded ? '−' : '+'}
            </button>
          </div>

          <div ref={mapRef} className="guess-map"></div>

          {/* Кнопка Угадать теперь отображается всегда, когда карта не развернута */}
          {!disabled && !isExpanded && (
            <button 
              className="guess-button small-map-btn"
              onClick={handleGuess}
              disabled={!hasMarker}
            >
              {isYakut ? 'Билиир' : 'Угадать'}
            </button>
          )}

          {/* Кнопка Угадать для развернутого режима */}
          {!disabled && isExpanded && (
            <button 
              className="guess-button expanded-btn"
              onClick={handleGuess}
              disabled={!hasMarker}
            >
              {isYakut ? 'Билиир' : 'Угадать'}
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default GuessMap;