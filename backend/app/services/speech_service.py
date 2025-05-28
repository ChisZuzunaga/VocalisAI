import os
from google.oauth2 import service_account
from google.cloud import speech_v1 as speech

# construye la ruta al JSON
CRED_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or \
    os.path.join(os.path.dirname(__file__), "../../secrets/google_credentials.json")

def transcribe_file(path: str) -> str:
    # Inicializa el cliente con credenciales
    creds = service_account.Credentials.from_service_account_file(CRED_PATH)
    client = speech.SpeechClient(credentials=creds)

    # Lee el audio
    with open(path, "rb") as audio_file:
        content = audio_file.read()
    audio = speech.RecognitionAudio(content=content)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
        sample_rate_hertz=48000,
        language_code="es-ES",
    )
    
    # Llama a la API
    response = client.recognize(config=config, audio=audio)
    texts = [res.alternatives[0].transcript for res in response.results]
    return " ".join(texts) if texts else "(no se detectó voz)"