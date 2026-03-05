import React, { useEffect, useRef } from 'react';
import './ResultModal.css';

function ResultModal({ distance, score, currentRound, totalRounds, onNext, location, guessedLocation, language = 'ru' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!window.google || !window.google.maps || !location || !guessedLocation) return;

    // Создаём карту с начальным центром и умеренным зумом
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: location,
      zoom: 5, // начальный зум, но будет скорректирован ниже
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Маркер actual (зелёный)
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

    // Маркер guessed (красный)
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

    // Линия между точками
    const line = new window.google.maps.Polyline({
      path: [guessedLocation, location],
      geodesic: true,
      strokeColor: '#EA4335',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: mapInstanceRef.current,
    });

    // Вычисляем расстояние между точками (в км)
    const R = 6371; // Радиус Земли
    const dLat = (location.lat - guessedLocation.lat) * Math.PI / 180;
    const dLng = (location.lng - guessedLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(guessedLocation.lat * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    // Если расстояние очень маленькое (меньше 0.1 км) — точки практически совпадают (тайм-аут)
    if (dist < 0.1) {
      // Устанавливаем фиксированный зум, чтобы показать окрестности
      mapInstanceRef.current.setZoom(12); // подберите комфортное значение (12-13)
      mapInstanceRef.current.setCenter(location);
    } else {
      // Иначе подгоняем границы, чтобы были видны обе точки
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(guessedLocation);
      bounds.extend(location);
      mapInstanceRef.current.fitBounds(bounds);
    }

    // Очистка при размонтировании
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