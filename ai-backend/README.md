# AI Backend

Python Flask backend for AI-powered features using Google Gemini API.

## Setup

1. **Install Python dependencies:**

```bash
cd ai-backend
pip install -r requirements.txt
```

2. **Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

- Get API key from: https://makersuite.google.com/app/apikey

3. **Run the server:**

```bash
python app.py
```

Server will start on `http://localhost:5001`

## API Endpoints

### 1. Health Check

```
GET /health
```

### 2. Summarize Notes

```
POST /api/summarize-notes
Content-Type: application/json

{
  "content": "Your note content here",
  "title": "Note Title (optional)"
}
```

### 3. Explain Concept

```
POST /api/explain-concept
Content-Type: application/json

{
  "concept": "Concept to explain",
  "context": "Additional context (optional)"
}
```

### 4. Generate Quiz

```
POST /api/generate-quiz
Content-Type: application/json

{
  "content": "Note content",
  "num_questions": 5
}
```

## Development

- Flask runs in debug mode when `FLASK_ENV=development`
- CORS is enabled for cross-origin requests
- Default port: 5001
