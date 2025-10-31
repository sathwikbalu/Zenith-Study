from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize the Gemini model
model = genai.GenerativeModel('gemini-2.5-flash')

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'AI Backend is running'
    }), 200

@app.route('/api/summarize-notes', methods=['POST'])
def summarize_notes():
    """
    Summarize notes and extract important information
    Expected request body:
    {
        "content": "note content here",
        "title": "note title (optional)"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({
                'error': 'Missing required field: content'
            }), 400
        
        note_content = data['content']
        note_title = data.get('title', 'Untitled Note')
        
        if not note_content.strip():
            return jsonify({
                'error': 'Note content cannot be empty'
            }), 400
        
        # Create a comprehensive prompt for Gemini
        prompt = f"""
You are an educational assistant helping students understand their notes better. 
Analyze the following notes and provide a comprehensive summary with these sections:

Note Title: {note_title}

Note Content:
{note_content}

Please provide your response in the following structured format:

## Important Theory
[Extract and explain the key theoretical concepts, definitions, and foundational knowledge from the notes. Make it clear and easy to understand.]

## Real-World Examples
[Provide 3-5 practical, real-world examples that demonstrate how these concepts are applied in everyday life or professional scenarios. Be specific and relatable.]

## Key Points
[List 5-10 most important takeaways, facts, or points that students must remember. Use bullet points for clarity.]

## Study Tips
[Provide 2-3 actionable study tips or memory techniques to help students retain this information better.]

Make your response educational, engaging, and easy to understand for students.
"""
        
        # Generate content using Gemini
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            return jsonify({
                'error': 'Failed to generate summary from AI'
            }), 500
        
        # Parse the response to extract sections
        summary_text = response.text
        
        # Return the structured response
        return jsonify({
            'success': True,
            'summary': summary_text,
            'note_title': note_title,
            'timestamp': data.get('timestamp')
        }), 200
    
    except ValueError as ve:
        return jsonify({
            'error': f'Invalid input: {str(ve)}'
        }), 400
    
    except Exception as e:
        print(f"Error in summarize_notes: {str(e)}")
        return jsonify({
            'error': f'An error occurred while processing your request: {str(e)}'
        }), 500

@app.route('/api/explain-concept', methods=['POST'])
def explain_concept():
    """
    Explain a specific concept from notes
    Expected request body:
    {
        "concept": "concept to explain",
        "context": "surrounding context (optional)"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'concept' not in data:
            return jsonify({
                'error': 'Missing required field: concept'
            }), 400
        
        concept = data['concept']
        context = data.get('context', '')
        
        prompt = f"""
Explain the following concept in a simple, student-friendly way:

Concept: {concept}

{"Context: " + context if context else ""}

Provide:
1. A clear definition
2. Why it's important
3. A simple example
4. Common misconceptions (if any)

Keep the explanation concise but thorough.
"""
        
        response = model.generate_content(prompt)
        
        return jsonify({
            'success': True,
            'explanation': response.text,
            'concept': concept
        }), 200
    
    except Exception as e:
        print(f"Error in explain_concept: {str(e)}")
        return jsonify({
            'error': f'An error occurred: {str(e)}'
        }), 500

@app.route('/api/generate-quiz', methods=['POST'])
def generate_quiz():
    """
    Generate quiz questions from notes
    Expected request body:
    {
        "content": "note content",
        "num_questions": 5
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({
                'error': 'Missing required field: content'
            }), 400
        
        content = data['content']
        num_questions = data.get('num_questions', 5)
        
        prompt = f"""
Based on the following notes, generate {num_questions} multiple-choice quiz questions to test understanding:

{content}

For each question, provide:
1. The question
2. Four answer options (A, B, C, D)
3. The correct answer
4. A brief explanation of why that's the correct answer

Format each question clearly and make them educational and thought-provoking.
"""
        
        response = model.generate_content(prompt)
        
        return jsonify({
            'success': True,
            'quiz': response.text,
            'num_questions': num_questions
        }), 200
    
    except Exception as e:
        print(f"Error in generate_quiz: {str(e)}")
        return jsonify({
            'error': f'An error occurred: {str(e)}'
        }), 500

@app.route('/api/generate-session-notes', methods=['POST'])
def generate_session_notes():
    """
    Generate comprehensive notes from study session details
    Expected request body:
    {
        "title": "Session title",
        "subject": "Subject name",
        "description": "Session description"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'title' not in data or 'subject' not in data:
            return jsonify({
                'error': 'Missing required fields: title and subject'
            }), 400
        
        title = data['title']
        subject = data['subject']
        description = data.get('description', '')
        
        prompt = f"""
You are an educational assistant helping students by creating comprehensive study notes.

Based on the following study session information, create detailed, well-structured notes that students can use for learning and revision:

Session Title: {title}
Subject: {subject}
Session Description: {description}

Please generate comprehensive notes with the following structure:

# {title}

## Overview
[Provide a brief introduction to the topic and its importance]

## Key Concepts
[List and explain the main concepts, theories, and principles related to this topic]

## Detailed Explanation
[Provide in-depth explanation of the topic with clear subsections]

## Important Definitions
[List important terms and their definitions]

## Real-World Applications
[Explain how this topic is applied in real-world scenarios with examples]

## Common Misconceptions
[Address common misunderstandings students might have]

## Study Tips
[Provide tips for understanding and remembering this material]

## Practice Questions
[Suggest 3-5 questions students should be able to answer after studying this material]

## Additional Resources
[Suggest types of resources students can explore for deeper understanding]

Make the notes clear, educational, well-organized, and suitable for student learning.
"""
        
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            return jsonify({
                'error': 'Failed to generate notes from AI'
            }), 500
        
        return jsonify({
            'success': True,
            'content': response.text,
            'title': title,
            'subject': subject
        }), 200
    
    except Exception as e:
        print(f"Error in generate_session_notes: {str(e)}")
        return jsonify({
            'error': f'An error occurred while generating notes: {str(e)}'
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print(f"Starting AI Backend on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=debug)
