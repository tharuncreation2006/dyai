# Dynamic AI Chatbot Platform

A full-stack AI chatbot platform featuring customizable chatbots, knowledge base integration (RAG), conversational analytics, and embeddable web chat widgets.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, React Router, Tailwind CSS / Vanilla CSS, Lucide Icons
- **Backend**: FastAPI (Python), MongoDB (PyMongo), Ollama (LLM & Embeddings), JWT Authentication
- **Deployment**: Vercel (Frontend), Docker / Render / Railway / Cloud VPS (Backend)

---

## 📁 Project Structure

```text
├── backend/
│   ├── auth.py              # User authentication & JWT
│   ├── chatbots.py          # Chatbot configuration & management
│   ├── chat.py              # Chat endpoints & conversation handling
│   ├── database.py          # MongoDB client connection
│   ├── documents.py         # Knowledge base document upload
│   ├── ollama_service.py    # Ollama integration (chat & embeddings)
│   ├── rag_service.py       # Retrieval-Augmented Generation logic
│   ├── main.py              # FastAPI application entrypoint
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── public/
│   │   └── widget.js        # Embeddable script for external websites
│   ├── src/
│   │   ├── components/      # UI Layout & Navbar components
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Dashboard, Chatbots, Analytics, etc.
│   │   └── services/        # Axios API client
│   ├── vercel.json          # Vercel SPA routing rewrites
│   └── package.json
│
└── README.md
```

---

## 🛠️ Local Development Setup

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
# Update .env with your MongoDB and Ollama configuration

# Start FastAPI server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Create .env from template
cp .env.example .env

# Start Vite dev server
npm run dev
```

---

## 🌐 Deploying Frontend to Vercel

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com):
   - Import your repository.
   - Set **Root Directory** to `frontend`.
   - Add environment variable `VITE_API_URL` pointing to your deployed backend URL.
   - Click **Deploy**.
