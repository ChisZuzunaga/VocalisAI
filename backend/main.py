from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.test_service import get_random_number

app = FastAPI()

# Habilitar CORS para frontend (ajusta la URL si es diferente)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],  # Vite default port
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/random")
def random_number():
    return get_random_number()

@app.get("/")
def home():
    return {"message": "API funcionando correctamente"}