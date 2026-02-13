import React, { useState } from 'react';
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

  const shareUrl = (typeof window !== 'undefined' && window.location)
    ? window.location.href
    : '';

  const shareText = isYakut
    ? `Мин YktGuessr ойууната ${roundResults.length} раунд кыайан ${totalScore} / ${maxScore} балл улахан нүөнүуччүбүн!`
    : `Я прошёл YktGuessr по Якутии: ${roundResults.length} раундов и ${totalScore} из ${maxScore} очков!`;

  const fullShareMessage = `${shareText}${shareUrl ? `\n${shareUrl}` : ''}`;

  const [copied, setCopied] = useState(false);

  const handleCopyShare = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullShareMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setCopied(false);
    }
  };

  const openShareWindow = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    openShareWindow(url);
  };

  const handleShareVK = () => {
    const url = `https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
    openShareWindow(url);
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareMessage)}`;
    openShareWindow(url);
  };

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
              <div className="round-location">
                {result.location && result.location.city
                  ? result.location.city
                  : (isYakut ? 'Биллибэт населенный пункт' : 'Неизвестный населенный пункт')}
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

        <div className="share-section">
          <h3 className="share-title">
            {isYakut ? 'Нәтижэлэриҥи дьон кытта бөлөҕүн' : 'Поделиться результатом'}
          </h3>
          <p className="share-subtitle">
            {isYakut
              ? 'Кыайан туран баллары гыннык, другтарыҥгар көрдөр.'
              : 'Расскажи друзьям, сколько Якутии ты отгадал.'}
          </p>
          <div className="share-buttons">
            <button
              type="button"
              className="share-button primary"
              onClick={handleCopyShare}
            >
              {copied
                ? (isYakut ? 'Скопийдаанна' : 'Скопировано!')
                : (isYakut ? 'Скопировать текст' : 'Скопировать результат')}
            </button>
            <button
              type="button"
              className="share-button telegram"
              onClick={handleShareTelegram}
            >
              Telegram
            </button>
            <button
              type="button"
              className="share-button vk"
              onClick={handleShareVK}
            >
              VK
            </button>
            <button
              type="button"
              className="share-button twitter"
              onClick={handleShareTwitter}
            >
              X / Twitter
            </button>
          </div>
        </div>

        <button className="play-again-button" onClick={onPlayAgain}>
          {isYakut ? 'Хатылаа ойноо' : 'Играть снова'}
        </button>
      </div>
    </div>
  );
}

export default FinalResults;

