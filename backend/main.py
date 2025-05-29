from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.services.test_service import get_random_number
from app.services.speech_service import transcribe_file
from fastapi.responses import JSONResponse
import os
import json
from datetime import datetime
from pathlib import Path

app = FastAPI()
BASE_DIR = Path(__file__).resolve().parent
AUDIO_DIR = BASE_DIR / "audios"
AUDIO_DIR.mkdir(exist_ok=True)
TRANSCRIPTIONS_FILE = Path(__file__).parent / "Transcripciones.json"
 

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