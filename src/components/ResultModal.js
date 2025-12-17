import React from 'react';
import './ResultModal.css';

function ResultModal({ distance, score, currentRound, totalRounds, onNext, location }) {
  const formatDistance = (dist) => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)} м`;
    }
    return `${dist.toFixed(1)} км`;
  };

  const getGrade = (score) => {
    if (score >= 4500) return { text: 'Отлично!', color: '#34A853', emoji: '🎯' };
    if (score >= 3000) return { text: 'Хорошо!', color: '#4285F4', emoji: '👍' };
    if (score >= 1500) return { text: 'Неплохо', color: '#FBBC04', emoji: '✨' };
    return { text: 'Попробуй еще', color: '#EA4335', emoji: '🎲' };
  };

  const grade = getGrade(score);

  console.log(`RESULT: Раунд 1 завершен. Дистанция: ${dist} км, Очки: ${score}`);

  return (
    <div className="result-modal-overlay">
      <div className="result-modal">
        <div className="grade-header">
          <span className="grade-emoji">{grade.emoji}</span>
          <h2 style={{ color: grade.color }}>{grade.text}</h2>
        </div>

        <div className="location-info">
          <div className="location-title">Это было:</div>
          <div className="location-city">{location.city}</div>
          <div className="location-place">{location.place}</div>
          <div className="location-hint">{location.hint}</div>
        </div>
        
        <div className="result-stats">
          <div className="stat">
            <div className="stat-label">Расстояние</div>
            <div className="stat-value">{formatDistance(distance)}</div>
          </div>
          
          <div className="stat">
            <div className="stat-label">Очки</div>
            <div className="stat-value score">{score.toLocaleString()}</div>
          </div>
        </div>

        <button className="next-button" onClick={onNext}>
          {currentRound >= totalRounds ? 'Посмотреть результаты' : 'Следующий раунд →'}
        </button>
      </div>
    </div>
  );
}

export default ResultModal;

