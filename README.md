# Vocalis

npm install axios
npm install tailwindcss @tailwindcss/vite
pip install -r requirements.txt

# ACTIVAR VENV EN CMD
.\.venv\Scripts\Activate.bat

# EN VENV INSTALAR DEPENDENCIAS
pip install --upgrade pip
pip install fastapi corn python-multipart
choco install mkcert


## Backend
uvicorn main:app --reload #LOCAL
uvicorn main:app --reload --host 0.0.0.0 --port 8000 #HOST

## Frontend
npm run dev