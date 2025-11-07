from flask import Flask, render_template, jsonify, request, session
import os
from dotenv import load_dotenv
import secrets

# Load environment variables
load_dotenv()

app = Flask(__name__,
            template_folder='../frontend/templates',
            static_folder='../frontend/static')
app.secret_key = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(16))

# Import routes after app initialization
from ai_service import AIService
from sql_checker import SQLChecker
from sample_data import SampleDataGenerator
from models import ProgressTracker

# Initialize services
ai_service = AIService(os.getenv('ANTHROPIC_API_KEY'))
sql_checker = SQLChecker()
progress_tracker = ProgressTracker()

# Ensure databases are initialized
sample_data = SampleDataGenerator()
sample_data.initialize_database()

@app.route('/')
def index():
    """Main landing page"""
    return render_template('index.html')

@app.route('/flashcards')
def flashcards():
    """Flashcard practice mode"""
    return render_template('flashcards.html')

@app.route('/problems')
def problems():
    """Problem-solving mode"""
    return render_template('problems.html')

@app.route('/api/flashcards/all', methods=['GET'])
def get_flashcards():
    """Get all flashcards organized by difficulty (without options - loaded lazily)"""
    from flashcards import get_all_flashcards
    return jsonify(get_all_flashcards(ai_service=None))  # Don't generate options upfront

@app.route('/api/flashcards/options', methods=['POST'])
def get_flashcard_options():
    """Generate multiple choice options for a specific flashcard"""
    from flashcards import _generate_options_for_card
    data = request.json
    card = data.get('card')
    
    if not card:
        return jsonify({'error': 'Card data required'}), 400
    
    card_id = card.get('id')
    
    try:
        # Check if options already exist in database
        cached_options = progress_tracker.get_flashcard_options(card_id)
        if cached_options:
            print(f"Using cached options for card {card_id}")
            return jsonify({'options': cached_options})
        
        # Generate new options
        print(f"Generating new options for card {card_id}")
        card_with_options = _generate_options_for_card(card, ai_service=ai_service)
        options = card_with_options.get('options', [])
        
        # Save to database
        if options:
            progress_tracker.save_flashcard_options(card_id, options)
        
        return jsonify({'options': options})
    except Exception as e:
        print(f"Error generating options: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/flashcards/progress', methods=['POST'])
def update_flashcard_progress():
    """Update user progress on a flashcard"""
    data = request.json
    card_id = data.get('card_id')
    correct = data.get('correct', False)
    topic = data.get('topic')
    level = data.get('level')

    progress_tracker.update_flashcard_progress(card_id, correct, topic=topic, level=level)
    return jsonify({'status': 'success'})

@app.route('/api/problem/generate', methods=['POST'])
def generate_problem():
    """Generate a new SQL problem based on difficulty level"""
    data = request.json
    difficulty = data.get('difficulty', 'basic')
    topic = data.get('topic', None)
    save = data.get('save', True)  # Save by default

    print(f"[API] /api/problem/generate called - Difficulty: {difficulty}, Topic: {topic}, Save: {save}")
    
    try:
        problem = ai_service.generate_problem(difficulty, topic)
        print(f"[API] Problem generated successfully: {problem.get('title', 'No title')}")
        
        # Save the problem for later reuse
        if save:
            problem_id = progress_tracker.save_problem(problem)
            problem['saved_id'] = problem_id
        
        return jsonify(problem)
    except Exception as e:
        print(f"[API] Error generating problem: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/problem/saved', methods=['GET'])
def get_saved_problems():
    """Get all saved problems"""
    try:
        limit = request.args.get('limit', 50, type=int)
        problems = progress_tracker.get_saved_problems(limit)
        return jsonify({'problems': problems})
    except Exception as e:
        print(f"[API] Error getting saved problems: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/problem/saved/<int:problem_id>', methods=['GET'])
def get_saved_problem(problem_id):
    """Get a specific saved problem by ID"""
    try:
        problem = progress_tracker.get_saved_problem(problem_id)
        if problem:
            return jsonify(problem)
        else:
            return jsonify({'error': 'Problem not found'}), 404
    except Exception as e:
        print(f"[API] Error getting saved problem: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/problem/saved/<int:problem_id>', methods=['DELETE'])
def delete_saved_problem(problem_id):
    """Delete a saved problem"""
    try:
        success = progress_tracker.delete_saved_problem(problem_id)
        if success:
            return jsonify({'status': 'success'})
        else:
            return jsonify({'error': 'Problem not found'}), 404
    except Exception as e:
        print(f"[API] Error deleting saved problem: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/problem/execute', methods=['POST'])
def execute_query():
    """Execute user's SQL query and return results (no AI feedback)"""
    data = request.json
    user_query = data.get('query')

    if not user_query:
        return jsonify({'error': 'Query is required'}), 400

    try:
        # Execute user's query
        result = sql_checker.execute_query(user_query)
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/problem/check', methods=['POST'])
def check_answer():
    """Check user's SQL query against the problem using AI feedback"""
    data = request.json
    user_query = data.get('query')
    problem_id = data.get('problem_id')
    expected_result = data.get('expected_result')
    problem_description = data.get('problem_description')

    try:
        # Execute user's query (or use provided result if available)
        result = data.get('result')
        if result is None:
            result = sql_checker.execute_query(user_query)

        # Check with AI if the approach is correct
        feedback = ai_service.check_answer(
            user_query=user_query,
            problem_description=problem_description,
            result=result,
            expected_result=expected_result
        )

        # Save the submission if we have problem info
        problem_title = problem_id  # problem_id is actually the title
        difficulty = data.get('difficulty')
        topic = data.get('topic')
        
        if problem_title:
            try:
                score = feedback.get('score', 0)
                correct = feedback.get('correct', False)
                
                progress_tracker.record_problem_attempt(
                    problem_title=problem_title,
                    difficulty=difficulty or 'basic',
                    topic=topic or 'General SQL',
                    query=user_query,
                    score=score,
                    correct=correct
                )
            except Exception as e:
                print(f"Error saving problem attempt: {e}")

        return jsonify({
            'feedback': feedback
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'feedback': {'correct': False, 'message': f'Query error: {str(e)}'}
        }), 400

@app.route('/api/problem/hint', methods=['POST'])
def get_hint():
    """Get a hint for the current problem"""
    data = request.json
    problem_description = data.get('problem_description')
    user_query = data.get('query', '')
    hint_level = data.get('hint_level', 1)

    try:
        hint = ai_service.generate_hint(problem_description, user_query, hint_level)
        return jsonify({'hint': hint})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/progress/stats', methods=['GET'])
def get_progress_stats():
    """Get user's overall progress statistics"""
    stats = progress_tracker.get_stats()
    return jsonify(stats)

@app.route('/api/database/schema', methods=['GET'])
def get_database_schema():
    """Get the schema of the practice database"""
    schema = sql_checker.get_schema()
    return jsonify(schema)

@app.route('/api/database/sample-data', methods=['GET'])
def get_sample_data():
    """Get sample data from tables for reference"""
    table = request.args.get('table')
    limit = int(request.args.get('limit', 5))

    data = sql_checker.get_sample_data(table, limit)
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_ENV') == 'development', port=5000)
