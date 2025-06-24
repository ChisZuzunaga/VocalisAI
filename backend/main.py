from fastapi import FastAPI, UploadFile, File, APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.services.test_service import get_random_number
from app.services.speech_service import transcribe_file
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()   # carga .env en os.environ
import os
import json
from datetime import datetime
from pathlib import Path
from pydantic import BaseModel
import requests

# from chatbot import router as chatbot_router

app = FastAPI()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatRequest(BaseModel):
    message: str

BASE_DIR = Path(__file__).resolve().parent
AUDIO_DIR = BASE_DIR / "audios"
AUDIO_DIR.mkdir(exist_ok=True)
TRANSCRIPTIONS_FILE = Path(__file__).parent / "Transcripciones.json"
 
# app.include_router(chatbot_router)

# Habilitar CORS para frontend (ajusta la URL si es diferente)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Vite default port
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/random")
def random_number():
    return get_random_number()

@app.get("/")
def home():
    return {"message": "API funcionando correctamente"}

@app.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"audio_{timestamp}.webm"
    file_path = AUDIO_DIR / filename

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return {"message": "Archivo recibido", "filename": filename}

@app.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    # igual que antes, guardas el webm
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"audio_{timestamp}.webm"
    file_path = AUDIO_DIR / filename
    with open(file_path, "wb") as f:
        f.write(await file.read())

    transcript = transcribe_file(str(file_path))
    record = {
        "timestamp": datetime.now().isoformat(),
        "transcript": transcript
    }
    if TRANSCRIPTIONS_FILE.exists():
        entries = json.loads(TRANSCRIPTIONS_FILE.read_text())
    else:
        entries = []
    entries.append(record)
    TRANSCRIPTIONS_FILE.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2)
    )
    file_path.unlink(missing_ok=True)
    return {"filename": filename, "transcript": transcript}

@app.get("/speech-to-text/{filename}")
async def re_transcribe(filename: str):
    file_path = AUDIO_DIR / filename
    if not file_path.exists():
        return JSONResponse(status_code=404, content={"message":"No encontrado"})
    transcript = transcribe_file(str(file_path))
    return {"filename": filename, "transcript": transcript}

@app.delete("/audio/{filename}")
async def delete_audio(filename: str):
    file_path = AUDIO_DIR / filename
    if file_path.exists():
        file_path.unlink()
        return {"message":"Archivo eliminado"}
    return JSONResponse(status_code=404, content={"message":"No encontrado"})

@app.post("/chat")
async def chat_with_bot(payload: ChatRequest):
    message = payload.message
    
    try:
        # Usa el nuevo formato de llamada
        response = client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=[{"role": "user", "content": message}]
        )
        # Y el nuevo formato de respuesta
        reply = response.choices[0].message.content
    except Exception as e:
        print(f"ERROR OpenAI: {str(e)}")  # Log detallado del error
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

    return {
        "conversation_id": "temp-id",
        "messages": [
            {"sender": "user", "text": message},
            {"sender": "bot", "text": reply}
        ]
    }

@app.get("/verify-api")
async def verify_api_key():
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.models.list()
        return {"status": "API key válida", "models_available": len(response.data)}
    except Exception as e:
        print(f"ERROR verificando API key: {str(e)}")
        return {"status": "Error", "message": str(e)}