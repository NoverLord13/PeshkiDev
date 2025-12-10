import React from 'react';
import './FinalResults.css';

function FinalResults({ totalScore, roundResults, onPlayAgain }) {
  const maxScore = 5000 * roundResults.length;
  const percentage = Math.round((totalScore / maxScore) * 100);

  const getOverallGrade = (perc) => {
    if (perc >= 80) return { text: 'Превосходно!', emoji: '🎉', color: '#34A853' };
    if (perc >= 60) return { text: 'Отлично!', emoji: '🎊', color: '#4285F4' };
    if (perc >= 40) return { text: 'Хорошо!', emoji: '👍', color: '#FBBC04' };
    return { text: 'Неплохо!', emoji: '💪', color: '#EA4335' };
  };

  const grade = getOverallGrade(percentage);

  return (
    <div className="final-results">
      <div className="final-results-content">
        <h1 className="final-title">Игра окончена!</h1>
        
        <div className="final-score-card">
          <div className="grade-emoji">{grade.emoji}</div>
          <div className="grade-text" style={{ color: grade.color }}>{grade.text}</div>
          <div className="total-score">{totalScore.toLocaleString()}</div>
          <div className="max-score">из {maxScore.toLocaleString()} очков</div>
          <div className="percentage">{percentage}%</div>
        </div>

        <div className="rounds-summary">
          <h3>Результаты раундов</h3>
          {roundResults.map((result, index) => (
            <div key={index} className="round-summary">
              <div className="round-header">
                <span className="round-number">Раунд {result.round}</span>
                <span className="round-score">{result.score.toLocaleString()}</span>
              </div>
              <div className="round-location">
                <strong>{result.location?.city}</strong> • {result.location?.place}
              </div>
              <div className="round-stats">
                <span className="round-distance">
                  📍 {result.distance < 1 
                    ? `${Math.round(result.distance * 1000)} м`
                    : `${result.distance.toFixed(1)} км`
                  }
                </span>
                {result.hintPenalty > 0 && (
                  <span className="hint-penalty">💡 -{result.hintPenalty}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button className="play-again-button" onClick={onPlayAgain}>
          Играть снова
        </button>
      </div>
    </div>
  );
}

export default FinalResults;

