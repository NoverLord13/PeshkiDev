from fastapi import FastAPI

app = FastAPI()


@app.get("/", summary="Тестовый рут", tags=["Основные руты"])
def root():
    return "Hello World"