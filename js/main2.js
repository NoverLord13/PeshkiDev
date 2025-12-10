let score = 0;
let currentGameId = null;
let currentPlace = null;

// Инициализация игры
async function initGame() {
    try {
        const response = await fetch('/api/game/start');
        const gameData = await response.json();
        
        currentGameId = gameData.game_id;
        currentPlace = gameData.first_place;
        
        // Обновляем интерфейс
        document.getElementById("score").innerHTML = `Твой текущий счет: ${score}`;
        
        // Загружаем Street View
        loadStreetView(currentPlace.lat, currentPlace.lng);
        
    } catch (error) {
        console.error('Ошибка инициализации игры:', error);
        alert('Ошибка загрузки игры');
    }
}

// Загрузка Street View
function loadStreetView(lat, lng) {
    if (window.panorama) {
        // Если панорама уже существует, обновляем позицию
        window.panorama.setPosition({ lat: lat, lng: lng });
    } else {
        // Создаем новую панораму
        window.panorama = new google.maps.StreetViewPanorama(
            document.getElementById("street-view"),
            {
                position: { lat: lat, lng: lng },
                pov: { heading: 165, pitch: 0 },
                zoom: 1,
                addressControl: false,
                showRoadLabels: false
            }
        );
    }
}

// Проверка ответа
async function guess() {
    if (!currentPlace || !currentGameId) {
        alert('Игра не инициализирована');
        return;
    }

    const userGuess = prompt("Где это место?");
    if (!userGuess) return;

    try {
        const response = await fetch('/api/check-answer-flexible', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                place_id: currentPlace.id,
                user_guess: userGuess
            })
        });

        const result = await response.json();

        if (result.correct) {
            score++;
            alert(`Правильно! Текущие очки: ${score}`);
            
            // Переход к следующему раунду
            await nextRound();
        } else {
            alert(`Неправильно! Правильный ответ: ${result.correct_answer}. Ваш ответ: ${result.user_guess}`);
            score = 0;
            await initGame(); // Начинаем заново
        }

    } catch (error) {
        console.error('Ошибка проверки ответа:', error);
        alert('Ошибка при проверке ответа');
    }
}

// Следующий раунд
async function nextRound() {
    try {
        const response = await fetch(`/api/game/${currentGameId}/next-round`);
        const roundData = await response.json();
        
        currentPlace = roundData.place;
        loadStreetView(currentPlace.lat, currentPlace.lng);
        
        // Обновляем счет
        document.getElementById("score").innerHTML = `Твой текущий счет: ${score}`;
        
    } catch (error) {
        if (error.status === 400) {
            // Игра завершена
            await finishGame();
        } else {
            console.error('Ошибка перехода к следующему раунду:', error);
            alert('Ошибка загрузки следующего раунда');
        }
    }
}

// Завершение игры
async function finishGame() {
    try {
        const response = await fetch(`/api/game/${currentGameId}/finish`);
        const result = await response.json();
        
        alert(`Игра завершена! Ваш финальный счет: ${result.final_score}`);
        score = 0;
        await initGame(); // Начинаем новую игру
        
    } catch (error) {
        console.error('Ошибка завершения игры:', error);
    }
}

// Инициализация Google Maps
async function initializeGoogleMaps() {
    try {
        // Загружаем API ключ (если нужно)
        let apiKey = 'YOUR_GOOGLE_MAPS_API_KEY'; // Замените на ваш ключ
        
        // Или загружаем из файла, если у вас есть tocenJS.txt
        // const response = await fetch('/static/tocenJS.txt');
        // const apiKey = (await response.text()).trim();
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGame&libraries=&v=weekly`;
        script.async = true;
        document.head.appendChild(script);
        
    } catch (error) {
        console.error('Ошибка загрузки Google Maps:', error);
    }
}

// Глобальная функция для callback Google Maps
window.initGame = initGame;

// Запуск при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGoogleMaps);
} else {
    initializeGoogleMaps();
}