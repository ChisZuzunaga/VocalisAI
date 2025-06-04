[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python 3.9](https://img.shields.io/badge/Python-3.9-green.svg)](https://shields.io/)

This repository contains the code for Vocalis, a FastAPI & React speech-to-text application.

## Usage

Do Not fork this code! It is meant to be used by pressing the  <span style=color:white;background:green>**Use this Template**</span> button in GitHub. This will copy the code to your own repository with no connection back to the original repository like a fork would. This is what you want.

## Development Environment

We target Windows and use a Python 3.9 virtual environment plus Node 14+.

1. Clone the repo
2. Open a **CMD** in the project root
3. Create and activate the Backedn Python Venv and install Python dependencies
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.bat
pip install -r requirements.txt
```

4. in another **CMD**, Install frontend dependencies (Deactivate Virtual Enviorement)
```bash
cd frontend
npm install
npm install tailwindcss @tailwindcss/vite
```

## Useful commands

### Activate the Python 3.9 virtual environment

You can activate the Python 3.9 environment with:

```bash
.\.venv\Scripts\Activate.bat
```

### Starting the backend (FastAPI + Uvicorn)

```bash
uvicorn main:app --reload         # local only
uvicorn main:app --host 0.0.0.0 --port 8000 --reload   # listen on all interfaces
```

### Expose your frontend via ngrok

```bash
./ngrok.exe http 5174
```

### Start the frontend (Vite + React)

```bash
npm run host
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

## Possible Errors

If you encounter the following error when running the project:

```js
[vite] http proxy error: /random
Error: connect ECONNREFUSED ::1:8000
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1615:16)
```

This usually means the Vite development server is attempting to proxy to localhost, which is being resolved as the IPv6 address ::1. However, the backend server might only be listening on the IPv4 address (127.0.0.1), causing the connection to be refused.

## Solution

To fix this, open the [vite.config.js] file inside the [frontend] folder and replace all instances of:

```js
target: 'http://localhost:8000'
```

with:

```js
target: 'http://127.0.0.1:8000'
```
This change forces the Vite proxy to use IPv4 instead of IPv6, ensuring proper communication with the backend.

## Author

[Ignacio Guerra](https://github.com/ChisZuzunaga), [Franco Muñoz](https://github.com/TheSniperS2), Team Vocalis

## License

Licensed under the Apache License. See [LICENSE](LICENSE)
