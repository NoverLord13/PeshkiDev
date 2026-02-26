import React, { useEffect, useRef, useState } from 'react';
import './GuessMap.css';

const YAKUTSK_VIEW = { center: { lat: 62.027575, lng: 129.731505 }, zoom: 10 };
const YAKUTIA_VIEW = { center: { lat: 62.5, lng: 127 }, zoom: 5 };

function GuessMap({
  onGuess,
  disabled,
  actualLocation,
  guessedLocation,
  helpActive = false,
  onHelp,
  helpRadiusKm = 100,
  helpCenter,
  language = 'ru',
  mode = 'all',
  onVisibilityChange,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const actualMarkerRef = useRef(null);
  const lineRef = useRef(null);
  const helpCircleRef = useRef(null);
  const clickListenerRef = useRef(null);

  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [hasMarker, setHasMarker] = useState(false); // Отслеживаем наличие маркера для активации кнопки
  // Карта открывается по кнопке и сразу в full-screen (без миникарты)

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

  // Сообщаем родителю об изменении видимости карты
  useEffect(() => {
    if (typeof onVisibilityChange === 'function') {
      onVisibilityChange(isVisible);
    }
  }, [isVisible, onVisibilityChange]);

  const getInitialView = () => (mode === 'yakutsk' ? YAKUTSK_VIEW : YAKUTIA_VIEW);

  const resetMapView = () => {
    if (!mapInstanceRef.current) return;
    const view = getInitialView();
    mapInstanceRef.current.setCenter(view.center);
    mapInstanceRef.current.setZoom(view.zoom);
  };

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
      // Сбрасываем маркер и состояние при новом раунде
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
        setHasMarker(false);
      }
      resetMapView();
    }
  }, [actualLocation, guessedLocation, mode]);

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

  const restoreGuessMarker = () => {
    if (!mapInstanceRef.current) return;

    let position = null;
    if (guessedLocation) {
      position = guessedLocation;
    } else if (markerRef.current && markerRef.current.getPosition) {
      const currentPosition = markerRef.current.getPosition();
      if (currentPosition) {
        position = { lat: currentPosition.lat(), lng: currentPosition.lng() };
      }
    }
    if (!position) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new window.google.maps.Marker({
      position,
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
    setHasMarker(true);
  };

  const syncHelpCircle = () => {
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
  };

  useEffect(() => {
    syncHelpCircle();
  }, [helpActive, helpRadiusKm, actualLocation, helpCenter]);

  const initMap = () => {
    if (mapRef.current && window.google && window.google.maps) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: getInitialView().center,
        zoom: getInitialView().zoom,
        mapTypeControl: false,
        streetViewControl: false,
        zoomControl: false,
        fullscreenControl: false,
      });

      syncHelpCircle();

      if (actualLocation && guessedLocation) {
        showResults();
      } else {
        restoreGuessMarker();
        if (!markerRef.current) {
          setHasMarker(false);
        }
      }

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
    
    // Обновляем состояние для активации кнопки
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

  return (
    <>
      {/* Кнопка открытия карты (и ПК, и мобилка) */}
      {!isVisible && (
        <button
          className="open-map-btn"
          onClick={() => {
            setIsVisible(true);
            setIsExpanded(true);
          }}
        >
          {isYakut ? 'Картаны ас' : 'Открыть карту'}
        </button>
      )}

      {isVisible && (
        <div className={`guess-map-container ${isExpanded ? 'expanded' : ''}`}>

          {/* Кнопка закрыть карту */}
          <button 
            className="close-map-btn"
            onClick={() => {
              setIsExpanded(false);
              setIsVisible(false);
            }}
          >
            ✕
          </button>

          <div ref={mapRef} className="guess-map"></div>

          {!disabled && isExpanded && (
            <button
              type="button"
              className={`help-button ${helpActive ? 'used' : ''}`}
              onClick={onHelp}
              disabled={helpActive}
            >
              {helpActive ? (isYakut ? 'Көмө түбэһин көстүбүт' : 'Подсказка включена') : (isYakut ? 'Көмө (радиус)' : 'Помощь (радиус)')}
            </button>
          )}

          {!disabled && isExpanded && (
            <button 
              className="guess-button"
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
