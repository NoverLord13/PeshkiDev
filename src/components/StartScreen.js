import React from 'react';
import './StartScreen.css';

function StartScreen({ onStart, language = 'ru', mode = 'all', onChangeMode }) {
  const isYakut = language === 'sah';

  const title = isYakut
    ? 'GeoGuessr: Саха Республиката (Саха Сирэ)'
    : 'GeoGuessr: Республика Саха (Якутия)';

  const description = isYakut
    ? 'Панорама көрөнүктэн моһуокканы табыы!\n5 раунд • Сотуллубут ордугар уоннара сыыһаарар — онтон эргэр балыыаххын кэтэһэр'
    : 'Угадай локацию на панораме!\n5 раундов • Чем ближе угадаешь, тем больше очков';

  const startLabel = isYakut ? 'Ойноону саҕалаа' : 'Начать игру';
  const allModeLabel = isYakut ? 'Барыта Якутия' : 'Вся Якутия';
  const yakutskModeLabel = isYakut ? 'Только Дьокуускай' : 'Только Якутск';

  return (
    <div className="start-screen">
      <div className="start-content">
        <img 
          src="https://trafaret.papik.pro/uploads/posts/2024-09/trafaret-papik-pro-hlf1-p-trafareti-sakhalii-ouordar-1.jpg" 
          alt={isYakut ? 'Саха Сирэ' : 'Якутия'}
          className="logo"
        />
        <h1>{title}</h1>
        <p className="description">
          {description.split('\n').map((line, idx) => (
            <React.Fragment key={idx}>
              {line}
              {idx === 0 && <br />}
            </React.Fragment>
          ))}
        </p>
        <div className="mode-buttons">
          <button
            type="button"
            className={`mode-button ${mode !== 'yakutsk' ? 'active' : ''}`}
            onClick={() => onChangeMode && onChangeMode('all')}
          >
            {allModeLabel}
          </button>
          <button
            type="button"
            className={`mode-button ${mode === 'yakutsk' ? 'active' : ''}`}
            onClick={() => onChangeMode && onChangeMode('yakutsk')}
          >
            {yakutskModeLabel}
          </button>
        </div>
        <button className="start-button" onClick={onStart}>
          {startLabel}
        </button>
      </div>
    </div>
  );
}

export default StartScreen;

