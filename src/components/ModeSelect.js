import React from 'react';
import './ModeSelect.css';

function ModeSelect({ onSelectMode, onBack }) {
  return (
    <div className="mode-screen">
      <div className="mode-content">
        <h1>Выбери режим игры</h1>
        <p className="mode-description">
          Классический — угадывай точку на карте.<br />
          Упрощенный — выбирай населённый пункт из списка.
        </p>
        <div className="mode-buttons">
          <button
            className="mode-button primary"
            onClick={() => onSelectMode('classic')}
          >
            Классический
          </button>
          <button
            className="mode-button secondary"
            onClick={() => onSelectMode('simple')}
          >
            Упрощенный
          </button>
        </div>
        <button className="mode-back" onClick={onBack}>
          ← Назад
        </button>
      </div>
    </div>
  );
}

export default ModeSelect;


