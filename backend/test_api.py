import os
import requests

# Ajusta si tu servidor está en otra URL/puerto
BASE_URL = "http://localhost:8000"

# Carpeta donde guardas los .webm de prueba
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "audios", "test")

def main():
    for fname in os.listdir(AUDIO_DIR):
        if not fname.endswith(".webm"):
            continue
        path = os.path.join(AUDIO_DIR, fname)
        print(f"\n=== Probando {fname} ===")
        # 1) POST /speech-to-text
        with open(path, "rb") as f:
            files = {"file": (fname, f, "audio/webm")}
            resp = requests.post(f"{BASE_URL}/speech-to-text", files=files)
        print("POST /speech-to-text →", resp.status_code, resp.text)
        if resp.status_code != 200:
            continue
        data = resp.json()
        gen_name = data["filename"]

        # 2) GET /speech-to-text/{filename}
        resp2 = requests.get(f"{BASE_URL}/speech-to-text/{gen_name}")
        print(f"GET /speech-to-text/{gen_name} →", resp2.status_code, resp2.text)

        # 3) DELETE /audio/{filename}
        resp3 = requests.delete(f"{BASE_URL}/audio/{gen_name}")
        print(f"DELETE /audio/{gen_name} →", resp3.status_code, resp3.text)

if __name__ == "__main__":
    main()