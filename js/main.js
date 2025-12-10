let score = 0;
let panorama;
let places = [];
let currentPlace;
let coordinates;
let country;

// Загрузка мест из JSON
async function loadPlaces() {
  try {
    const response = await fetch('data/places.json');
    places = await response.json();
    return places;
  } catch (error) {
    console.error('Ошибка загрузки places.json:', error);
    return [];
  }
}

// Перезапуск игры после окончания
let reconfigure = async () => { 
  document.getElementById("score").innerHTML = "Твой текущий счет: " + score;
  
  if (places.length === 0) {
    await loadPlaces();
  }
  
  currentPlace = places[Math.floor(Math.random() * places.length)];
  coordinates = { lat: currentPlace.lat, lng: currentPlace.lng };
  country = currentPlace.name;

  initialize();
}

// Показать модальное окно для ввода ответа
const guess = () => {
  showGuessModal();
}

// Модальное окно для ввода ответа
function showGuessModal() {
  const modal = document.getElementById('guessModal');
  const input = document.getElementById('guessInput');
  const submitBtn = document.getElementById('guessSubmit');
  
  // Сбрасываем поле ввода
  input.value = '';
  
  // Показываем модальное окно
  modal.style.display = 'flex';
  
  // Фокус на поле ввода
  input.focus();
  
  // Обработчик отправки
  const handleSubmit = () => {
    const userGuess = input.value.trim();
    if (userGuess) {
      modal.style.display = 'none';
      checkAnswer(userGuess);
    }
  };
  
  // Обработчики событий
  submitBtn.onclick = handleSubmit;
  
  input.onkeypress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  
  // Закрытие по клику вне окна
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };
}

// Проверка ответа и показ результата
function checkAnswer(userGuess) {
  const isCorrect = userGuess.toLowerCase() === country.toLowerCase();
  
  if (isCorrect) {
    score++;
    showResultModal(
      "Правильно! ✅", 
      `Это место: ${country}.<br>Твой текущий счет: ${score}`,
      true
    );
  } else {
    showResultModal(
      "Неправильно! ❌", 
      `Это место: ${country}.<br>Твой финальный счет: ${score}`,
      false
    );
    score = 0;
  }
}

// Модальное окно с результатом
function showResultModal(title, message, isCorrect) {
  const modal = document.getElementById('resultModal');
  const titleEl = document.getElementById('resultTitle');
  const messageEl = document.getElementById('resultMessage');
  const nextBtn = document.getElementById('resultNext');
  
  // Устанавливаем содержимое
  titleEl.textContent = title;
  messageEl.innerHTML = message;
  
  // Меняем цвет заголовка в зависимости от результата
  titleEl.style.color = isCorrect ? '#4CAF50' : '#f44336';
  
  // Показываем модальное окно
  modal.style.display = 'flex';
  
  // Обработчик кнопки "Далее"
  nextBtn.onclick = () => {
    modal.style.display = 'none';
    reconfigure();
  };
  
  // Закрытие по клику вне окна
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      reconfigure();
    }
  };
}

// Настройка стритвью
function initialize() {
  if (!panorama) {
    panorama = new google.maps.StreetViewPanorama(
      document.getElementById("street-view"),
      {
        position: coordinates,
        pov: { heading: 165, pitch: 0 },
        zoom: 1,
      }
    );
  } else {
    panorama.setPosition(coordinates);
  }
}

// Инициализация игры
async function initializeGame() {
  await loadPlaces();
  await reconfigure();
}

// Загрузка Google Maps API
async function initializeWithToken() {
  const response = await fetch('tocenJS.txt');
  const token = (await response.text()).trim();
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${token}&callback=initializeGame&libraries=&v=weekly`;
  script.async = true;
  document.head.appendChild(script);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWithToken);
} else {
  initializeWithToken();
}