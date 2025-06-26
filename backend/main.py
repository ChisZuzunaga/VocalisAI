from fastapi import FastAPI, UploadFile, File, APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.services.test_service import get_random_number
from app.services.speech_service import transcribe_file
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from openai import OpenAI
from fastapi.responses import RedirectResponse, JSONResponse
from dotenv import load_dotenv
load_dotenv()   # carga .env en os.environ
import os
import json
import time
import torch
import wave
import numpy as np
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

# Rutas para el sistema de entrenamiento del modelo
DATA_DIR = BASE_DIR / "app" / "services" / "data"
SI_DIR = DATA_DIR / "si"
NO_DIR = DATA_DIR / "no"
MODEL_PATH = BASE_DIR / "app" / "services" / "model" / "model.pt"

# Crear directorios si no existen
SI_DIR.mkdir(exist_ok=True, parents=True)
NO_DIR.mkdir(exist_ok=True, parents=True)
 
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

@app.post("/api/chat")  # Cambiar de /chat a /api/chat
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

@app.get("/chat")
async def chat_get():
    """
    Manejador para las solicitudes GET a /chat
    Esto ocurre cuando alguien navega directamente a la URL /chat
    """
    # Opción 1: Redireccionar a la página principal
    return RedirectResponse(url="/")
    
    # Opción 2: Mostrar un mensaje explicativo
    # return {"message": "Esta es la API del chatbot. Por favor, usa el método POST para enviar mensajes o accede a través de la interfaz web."}

@app.get("/verify-api")
async def verify_api_key():
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.models.list()
        return {"status": "API key válida", "models_available": len(response.data)}
    except Exception as e:
        print(f"ERROR verificando API key: {str(e)}")
        return {"status": "Error", "message": str(e)}
    
@app.post("/training/save-training-audio/")
async def save_training_audio(class_type: str, audio: UploadFile = File(...)):
    """
    Guarda un archivo de audio para entrenar el modelo.
    'class_type' debe ser 'si' o 'no'
    """
    if class_type not in ["si", "no"]:
        return {"success": False, "error": "La clase debe ser 'si' o 'no'"}
    
    try:
        # Determinar directorio según clase
        class_dir = SI_DIR if class_type == "si" else NO_DIR
        
        # Asegurar que el directorio existe
        os.makedirs(class_dir, exist_ok=True)
        
        # Guardar el archivo recibido con extensión .webm
        timestamp = int(time.time())
        filename = f"{class_type}_{timestamp}.webm"
        file_path = class_dir / filename
        
        # Leer el contenido del archivo
        content = await audio.read()
        print(f"Recibido audio de {len(content)} bytes, content-type: {audio.content_type}")
        
        if len(content) < 100:
            return {"success": False, "error": "El archivo recibido está vacío o es demasiado pequeño"}
        
        # Guardar el archivo
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        print(f"Archivo guardado en {file_path}, tamaño: {os.path.getsize(file_path)} bytes")
        
        return {
            "success": True,
            "filename": filename,
            "path": str(file_path)
        }
    except Exception as e:
        print(f"Error al guardar el audio: {str(e)}")
        import traceback
        traceback.print_exc()  # Mostrar stack trace completo
        return {"success": False, "error": str(e)}
    
    
@app.post("/training/train-model/")
async def start_training(background_tasks: BackgroundTasks):
    """
    Inicia el entrenamiento del modelo en segundo plano
    """
    print(f"DEBUG: Iniciando entrenamiento con datos en {DATA_DIR}")
    print(f"DEBUG: El modelo se guardará en {MODEL_PATH}")
    
    # Importar aquí para evitar la carga circular
    from app.services.model.train import train_model
    
    # Verificar que existen las carpetas y contienen archivos
    # CAMBIADO: .wav -> .webm
    si_files = [f for f in os.listdir(SI_DIR) if f.endswith('.webm')] if SI_DIR.exists() else []
    no_files = [f for f in os.listdir(NO_DIR) if f.endswith('.webm')] if NO_DIR.exists() else []
    
    print(f"DEBUG: Encontrados {len(si_files)} archivos 'sí' y {len(no_files)} archivos 'no'")
    
    if len(si_files) < 5 or len(no_files) < 5:
        return {
            "success": False, 
            "message": f"No hay suficientes datos para entrenar (se requieren al menos 5 archivos de cada tipo, actualmente hay {len(si_files)} 'sí' y {len(no_files)} 'no')"
        }
    
    # Entrenar en segundo plano para no bloquear la respuesta
    background_tasks.add_task(
        train_model, 
        data_dir=str(DATA_DIR), 
        model_save_path=str(MODEL_PATH),
        num_epochs=5
    )
    
    return {"success": True, "message": "Entrenamiento iniciado en segundo plano"}

@app.get("/training/training-data-stats/")
async def get_training_data_stats():
    """
    Devuelve estadísticas sobre los datos de entrenamiento y el modelo
    """
    try:
        # Contar archivos por clase
        si_files = [f for f in os.listdir(SI_DIR) if f.endswith('.webm')] if os.path.exists(SI_DIR) else []
        no_files = [f for f in os.listdir(NO_DIR) if f.endswith('.webm')] if os.path.exists(NO_DIR) else []
        
        # Info del modelo
        model_exists = os.path.exists(MODEL_PATH)
        model_size = os.path.getsize(MODEL_PATH) / 1024 if model_exists else 0
        model_modified = os.path.getmtime(MODEL_PATH) if model_exists else None
        
        return {
            "samples": {
                "si": len(si_files),
                "no": len(no_files),
                "total": len(si_files) + len(no_files)
            },
            "model": {
                "exists": model_exists,
                "size_kb": round(model_size, 2),
                "last_modified": model_modified
            }
        }
    except Exception as e:
        print(f"Error al obtener estadísticas: {str(e)}")
        return {"error": str(e)}
    

@app.post("/training/predict-custom/")
async def predict_custom(audio: UploadFile = File(...)):
    """
    Predice usando el modelo personalizado con archivos WebM
    """
    # Verificar si el modelo existe
    if not MODEL_PATH.exists():
        return {"success": False, "error": "El modelo no existe. Entrena el modelo primero."}
    
    # Guardar el audio temporalmente con formato correcto
    temp_path = DATA_DIR / "temp_prediction.webm"
    with open(temp_path, "wb") as buffer:
        buffer.write(await audio.read())
    
    try:
        # Importar aquí para evitar la carga circular
        from app.services.model.train import SimpleNN
        import librosa
        
        # Cargar audio con librosa (maneja WebM)
        data, samplerate = librosa.load(str(temp_path), sr=16000, mono=True)
        waveform = torch.tensor(data, dtype=torch.float32)
        
        # Normalizar amplitud
        if waveform.abs().max() > 0:
            waveform = waveform / waveform.abs().max()
        
        # Ajustar longitud
        waveform = waveform[:16000]
        if waveform.shape[0] < 16000:
            waveform = torch.nn.functional.pad(waveform, (0, 16000 - waveform.shape[0]))
        
        # Cargar modelo y realizar predicción
        model = SimpleNN()
        model.load_state_dict(torch.load(MODEL_PATH))
        model.eval()
        
        with torch.no_grad():
            outputs = model(waveform.unsqueeze(0))
            _, predicted = torch.max(outputs, 1)
            prediction = "sí" if predicted.item() == 0 else "no"
        
        # Resto del código para guardar transcripción...
        
        return {
            "success": True,
            "prediction": prediction
        }
    except Exception as e:
        print(f"Error en la predicción: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
    finally:
        # Limpiar archivo temporal
        if temp_path.exists():
            temp_path.unlink()

    
@app.get("/training/debug-paths")
async def debug_paths():
    """
    Endpoint de depuración para verificar las rutas del sistema
    """
    return {
        "base_dir": str(BASE_DIR),
        "data_dir": str(DATA_DIR),
        "si_dir": str(SI_DIR),
        "no_dir": str(NO_DIR),
        "model_path": str(MODEL_PATH),
        "si_dir_exists": SI_DIR.exists(),
        "no_dir_exists": NO_DIR.exists(),
        "si_files": [f for f in os.listdir(SI_DIR)] if SI_DIR.exists() else [],
        "no_files": [f for f in os.listdir(NO_DIR)] if NO_DIR.exists() else [],
    }

@app.get("/training/check-audio-files")
async def check_audio_files():
    """
    Verifica los archivos de audio en los directorios
    """
    try:
        si_files = []
        no_files = []
        
        # Verificar directorio "si"
        if SI_DIR.exists():
            for file in os.listdir(SI_DIR):
                if file.endswith(".webm"):
                    file_path = SI_DIR / file
                    si_files.append({
                        "name": file,
                        "size_bytes": os.path.getsize(file_path),
                        "exists": os.path.exists(file_path)
                    })
        
        # Verificar directorio "no"
        if NO_DIR.exists():
            for file in os.listdir(NO_DIR):
                if file.endswith(".webm"):
                    file_path = NO_DIR / file
                    no_files.append({
                        "name": file,
                        "size_bytes": os.path.getsize(file_path),
                        "exists": os.path.exists(file_path)
                    })
        
        return {
            "success": True,
            "si_files": si_files,
            "no_files": no_files,
            "si_count": len(si_files),
            "no_count": len(no_files)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }