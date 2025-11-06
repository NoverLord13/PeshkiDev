from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import random
import json
from typing import List, Optional

app = FastAPI()


# Модели Pydantic
class Place(BaseModel):
    id: int
    lat: float
    lng: float
    name: str
    hint: Optional[str] = None

class GuessRequest(BaseModel):
    place_id: int
    user_guess: str

class GuessResponse(BaseModel):
    correct: bool
    correct_answer: str
    user_guess: str
    distance: Optional[float] = None

class GameState(BaseModel):
    score: int = 0
    current_round: int = 1
    total_rounds: int = 5

# Загрузка мест из JSON файла или использование дефолтных
def load_places():
    try:
        with open('data/places.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        # Дефолтные места (ваш массив)
        return [
            {"id": 1, "lat": 62.027575, "lng": 129.731505, "name": "Ленин", "hint": "Площадь в центре Якутска"},
            {"id": 2, "lat": 62.016897, "lng": 129.705356, "name": "КФЕН", "hint": "Университетский корпус"},
            {"id": 3, "lat": 62.157122, "lng": 117.650234, "name": "Сунтар", "hint": "Районный центр"},
            {"id": 4, "lat": 61.999261, "lng": 132.433982, "name": "Чурапча", "hint": "Село с музеем"},
            {"id": 5, "lat": 61.479675, "lng": 129.146294, "name": "Покровск", "hint": "Город на Лене"},
            {"id": 6, "lat": 62.533585, "lng": 113.976676, "name": "Мирный", "hint": "Алмазная столица"},
            {"id": 7, "lat": 62.723927, "lng": 129.658311, "name": "Намцы", "hint": "Намский улус"},
            {"id": 8, "lat": 62.160856, "lng": 129.834377, "name": "Жатай", "hint": "Речной порт"}
        ]

# Загружаем места при старте
PLACES = load_places()

# Глобальное состояние игры (в памяти)
# В реальном приложении используйте Redis или БД
game_states = {}

def get_random_place():
    """Возвращает случайное место"""
    return random.choice(PLACES)

def calculate_similarity(str1: str, str2: str) -> bool:
    """Проверяет схожесть строк (можно улучшить)"""
    str1_clean = str1.lower().strip()
    str2_clean = str2.lower().strip()
    return str1_clean == str2_clean

# API endpoints
@app.get("/")
async def root():
    return {"message": "Geoguessr Clone API", "version": "1.0.0"}

@app.get("/api/random-place", response_model=Place)
async def get_random_location():
    """Получить случайное место для угадывания"""
    place = get_random_place()
    return place

@app.get("/api/places", response_model=List[Place])
async def get_all_places():
    """Получить все доступные места"""
    return PLACES

@app.get("/api/places/{place_id}", response_model=Place)
async def get_place_by_id(place_id: int):
    """Получить конкретное место по ID"""
    place = next((p for p in PLACES if p["id"] == place_id), None)
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return place

@app.post("/api/check-answer", response_model=GuessResponse)
async def check_answer(guess: GuessRequest):
    """Проверить ответ пользователя"""
    place = next((p for p in PLACES if p["id"] == guess.place_id), None)
    
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    
    is_correct = calculate_similarity(guess.user_guess, place["name"])
    
    return GuessResponse(
        correct=is_correct,
        correct_answer=place["name"],
        user_guess=guess.user_guess
    )

@app.post("/api/check-answer-flexible", response_model=GuessResponse)
async def check_answer_flexible(guess: GuessRequest):
    """Проверить ответ с более гибкой проверкой"""
    place = next((p for p in PLACES if p["id"] == guess.place_id), None)
    
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    
    # Более гибкая проверка
    user_guess_clean = guess.user_guess.lower().strip()
    correct_answer_clean = place["name"].lower().strip()
    
    # Простая проверка на вхождение
    is_correct = (user_guess_clean in correct_answer_clean or 
                  correct_answer_clean in user_guess_clean or
                  user_guess_clean == correct_answer_clean)
    
    return GuessResponse(
        correct=is_correct,
        correct_answer=place["name"],
        user_guess=guess.user_guess
    )

@app.get("/api/game/start")
async def start_game():
    """Начать новую игру"""
    game_id = random.randint(1000, 9999)
    game_states[game_id] = GameState()
    
    first_place = get_random_place()
    
    return {
        "game_id": game_id,
        "first_place": first_place,
        "game_state": game_states[game_id]
    }

@app.get("/api/game/{game_id}/next-round")
async def next_round(game_id: int):
    """Следующий раунд игры"""
    if game_id not in game_states:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game_state = game_states[game_id]
    
    if game_state.current_round >= game_state.total_rounds:
        raise HTTPException(status_code=400, detail="Game finished")
    
    game_state.current_round += 1
    next_place = get_random_place()
    
    return {
        "place": next_place,
        "game_state": game_state
    }

@app.get("/api/game/{game_id}/finish")
async def finish_game(game_id: int):
    """Завершить игру и получить финальный счет"""
    if game_id not in game_states:
        raise HTTPException(status_code=404, detail="Game not found")
    
    final_score = game_states[game_id].score
    del game_states[game_id]  # Очищаем состояние
    
    return {"final_score": final_score, "message": "Game completed"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8000)