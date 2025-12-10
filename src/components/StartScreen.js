import React from 'react';
import './StartScreen.css';

function StartScreen({ onStart }) {
  return (
    <div className="start-screen">
      <div className="start-content">
        <img 
          src="https://trafaret.papik.pro/uploads/posts/2024-09/trafaret-papik-pro-hlf1-p-trafareti-sakhalii-ouordar-1.jpg" 
          alt="Якутия"
          className="logo"
        />
        <h1>GeoGuessr: Республика Саха (Якутия)</h1>
        <p className="description">
          Угадай локацию на панораме!<br />
          5 раундов • Чем ближе угадаешь, тем больше очков
        </p>
        <button className="start-button" onClick={onStart}>
          Начать игру
        </button>
      </div>
    </div>
  );
}

export default StartScreen;

