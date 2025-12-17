import React from 'react';
import './FinalResults.css';

function FinalResults({ totalScore, roundResults, onPlayAgain, language = 'ru' }) {
  const maxScore = 5000 * roundResults.length;
  const percentage = Math.round((totalScore / maxScore) * 100);

  const isYakut = language === 'sah';

  const getOverallGrade = (perc) => {
    if (perc >= 80) {
      return {
        text: isYakut ? 'Салгыы хаһааран!' : 'Превосходно!',
        emoji: '🎉',
        color: '#34A853',
      };
    }
    if (perc >= 60) {
      return {
        text: isYakut ? 'Эһиги кытта!' : 'Отлично!',
        emoji: '🎊',
        color: '#4285F4',
      };
    }
    if (perc >= 40) {
      return {
        text: isYakut ? 'Ыраас!' : 'Хорошо!',
        emoji: '👍',
        color: '#FBBC04',
      };
    }
    return {
      text: isYakut ? 'Сөпкө!' : 'Неплохо!',
      emoji: '💪',
      color: '#EA4335',
    };
  };

  const grade = getOverallGrade(percentage);

  return (
    <div className="final-results">
      <div className="final-results-content">
        <h1 className="final-title">
          {isYakut ? 'Ойуун туһуллубут!' : 'Игра окончена!'}
        </h1>
        
        <div className="final-score-card">
          <div className="grade-emoji">{grade.emoji}</div>
          <div className="grade-text" style={{ color: grade.color }}>{grade.text}</div>
          <div className="total-score">{totalScore.toLocaleString()}</div>
          <div className="max-score">
            {isYakut
              ? `махсус ${maxScore.toLocaleString()} баллаакка`
              : `из ${maxScore.toLocaleString()} очков`}
          </div>
          <div className="percentage">{percentage}%</div>
        </div>

        <div className="rounds-summary">
          <h3>
            {isYakut ? 'Раундардын нәтижэлэрэ' : 'Результаты раундов'}
          </h3>
          {roundResults.map((result, index) => (
            <div key={index} className="round-summary">
              <div className="round-header">
                <span className="round-number">
                  {isYakut ? 'Раунд' : 'Раунд'} {result.round}
                </span>
                <span className="round-score">{result.score.toLocaleString()}</span>
              </div>
              <div className="round-stats">
                <span className="round-distance">
                  📍 {result.distance < 1 
                    ? `${Math.round(result.distance * 1000)} ${isYakut ? 'м' : 'м'}`
                    : `${result.distance.toFixed(1)} ${isYakut ? 'км' : 'км'}`}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button className="play-again-button" onClick={onPlayAgain}>
          {isYakut ? 'Хатылаа ойноо' : 'Играть снова'}
        </button>
      </div>
    </div>
  );
}

export default FinalResults;

