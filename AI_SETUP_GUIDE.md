# AI Feature Integration - Setup Guide

## Python Flask AI Backend Setup

### 1. Navigate to AI backend directory

```bash
cd ai-backend
```

### 2. Create Python virtual environment (recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Get Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the generated key

### 5. Configure environment

```bash
# Copy example env file
copy .env.example .env

# Edit .env file and add your Gemini API key
GEMINI_API_KEY=your_actual_api_key_here
```

### 6. Start the AI backend server

```bash
python app.py
```

Server will run on `http://localhost:5001`

## Testing the AI Summarizer

### 1. Start all servers

- **Frontend**: `npm run dev` (port 8080)
- **Backend**: `cd backend && node server.js` (port 5000)
- **AI Backend**: `cd ai-backend && python app.py` (port 5001)

### 2. Test the feature

1. Login to the application
2. Go to Notes section
3. Create or open a note
4. Add some content
5. Click "AI Summarizer" button
6. View the AI-generated summary with:
   - Important Theory
   - Real-World Examples
   - Key Points
   - Study Tips

## Features

- **AI Summarizer**: Analyzes notes and provides structured summaries
- **Important Theory**: Extracts key concepts and definitions
- **Real-World Examples**: Provides practical examples
- **Key Points**: Lists important takeaways
- **Study Tips**: Suggests memory techniques

## Troubleshooting

**Error: "GEMINI_API_KEY not found"**

- Make sure .env file exists in ai-backend folder
- Verify GEMINI_API_KEY is set correctly

**Error: "Failed to summarize notes"**

- Check if AI backend is running on port 5001
- Verify Gemini API key is valid
- Check network connectivity

**Import errors in Python**

- Make sure virtual environment is activated
- Run `pip install -r requirements.txt` again
