[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python 3.12.4](https://img.shields.io/badge/python-3.12.4-blue)](https://shields.io/)

This repository contains the code for Vocalis, a FastAPI & React speech-to-text application.

## Usage

Do Not fork this code! It is meant to be used by pressing the  <span style=color:white;background:green>**Use this Template**</span> button in GitHub. This will copy the code to your own repository with no connection back to the original repository like a fork would. This is what you want.

## Development Environment

We target Windows and use a Python 3.12.4 virtual environment plus Node 14+.

1. Clone the repo
2. Open a **CMD** in the project root
3. Activate the Python venv and install Python dependencies
```bash
.\.venv\Scripts\Activate.bat
pip install --upgrade pip
pip install -r requirements.txt
```

4. Install frontend dependencies
```bash
npm install
npm install tailwindcss @tailwindcss/vite
```

## Useful commands

### Activate the Python 3.12.4 virtual environment

You can activate the Python 3.12.4 environment with:

```bash
.\.venv\Scripts\Activate.bat
```

### Installing Python dependencies

Install Python dependencies (again, if needed)

```bash
pip install -r requirements.txt
```

### Starting the backend (FastAPI + Uvicorn)

```bash
uvicorn main:app --reload         # local only
uvicorn main:app --reload --host 0.0.0.0 --port 8000   # listen on all interfaces
```

### Expose your frontend via ngrok

```bash
./ngrok.exe http 5174
```

### Start the frontend (Vite + React)

```bash
npm run dev
```

## Project layout

```text
├── backend
│   ├── .venv/               ← Python virtual environment
│   ├── app/                 ← FastAPI application package
│   ├── secrets/             ← service account JSON
│   ├── main.py              ← FastAPI entrypoint
│   └── requirements.txt     ← Python dependencies
├── frontend
│   ├── src/                 ← React application source
│   ├── public/              ← static assets
│   ├── package.json         ← NPM scripts & deps
│   └── tailwind.config.js   ← Tailwind CSS config
└── README.md                ← this file
```

## Author

[Ignacio Guerra](https://github.com/ChisZuzunaga), Software Developer [Franco Muñoz](https://github.com/TheSniperS2), Software Engineer (Team Vocalis)

## License

Licensed under the Apache License. See [LICENSE](LICENSE)

## <h3 align="center"> © Vocalis 2025. All rights reserved. <h3/>
