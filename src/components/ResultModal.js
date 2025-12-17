import React, { useEffect, useRef } from 'react';
import './ResultModal.css';

function ResultModal({ distance, score, currentRound, totalRounds, onNext, location, guessedLocation, language = 'ru' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!window.google || !window.google.maps || !location || !guessedLocation) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: location,
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const actualMarker = new window.google.maps.Marker({
      position: location,
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

    const guessMarker = new window.google.maps.Marker({
      position: guessedLocation,
      map: mapInstanceRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#EA4335',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3,
      },
    });

    const line = new window.google.maps.Polyline({
      path: [guessedLocation, location],
      geodesic: true,
      strokeColor: '#EA4335',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: mapInstanceRef.current,
    });

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(guessedLocation);
    bounds.extend(location);
    mapInstanceRef.current.fitBounds(bounds);

    return () => {
      actualMarker.setMap(null);
      guessMarker.setMap(null);
      line.setMap(null);
      mapInstanceRef.current = null;
    };
  }, [location, guessedLocation]);

  const isYakut = language === 'sah';

  const formatDistance = (dist) => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)} ${isYakut ? 'м' : 'м'}`;
    }
    return `${dist.toFixed(1)} ${isYakut ? 'км' : 'км'}`;
  };

  const getGrade = (score) => {
    if (score >= 4500) {
      return {
        text: isYakut ? 'Эһиги кытта!' : 'Отлично!',
        color: '#34A853',
        emoji: '🎯',
      };
    }
    if (score >= 3000) {
      return {
        text: isYakut ? 'Ыраас!' : 'Хорошо!',
        color: '#4285F4',
        emoji: '👍',
      };
    }
    if (score >= 1500) {
      return {
        text: isYakut ? 'Сөпкө' : 'Неплохо',
        color: '#FBBC04',
        emoji: '✨',
      };
    }
    return {
      text: isYakut ? 'Хатылаа' : 'Попробуй еще',
      color: '#EA4335',
      emoji: '🎲',
    };
  };

  const grade = getGrade(score);

  return (
    <div className="result-modal-overlay">
      <div className="result-modal">
        <div className="grade-header">
          <span className="grade-emoji">{grade.emoji}</span>
          <h2 style={{ color: grade.color }}>{grade.text}</h2>
        </div>

        <div className="result-map" ref={mapRef}></div>
        
        <div className="result-stats">
          <div className="stat">
            <div className="stat-label">
              {isYakut ? 'Ырааһа' : 'Расстояние'}
            </div>
            <div className="stat-value">{formatDistance(distance)}</div>
          </div>
          
          <div className="stat">
            <div className="stat-label">
              {isYakut ? 'Балл' : 'Очки'}
            </div>
            <div className="stat-value score">{score.toLocaleString()}</div>
          </div>
        </div>

        <button className="next-button" onClick={onNext}>
          {currentRound >= totalRounds
            ? (isYakut ? 'Результаттарына көр' : 'Посмотреть результаты')
            : (isYakut ? 'Анараааччы раунд →' : 'Следующий раунд →')}
        </button>
      </div>
    </div>
  );
}

export default ResultModal;

