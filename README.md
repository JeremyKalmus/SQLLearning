# SQL Learning Game

An interactive web application designed to help you master SQL through flashcards and AI-powered practice problems. Built with Python Flask, SQLite, and Claude AI.

## Features

### Flashcard Mode
- 40+ flashcards covering all SQL concepts from basic to expert level
- Organized by difficulty: Basic, Intermediate, Advanced, Expert
- Spaced repetition tracking for optimal learning
- Interactive flip cards with examples and explanations
- Progress tracking for each difficulty level

### Problem-Solving Mode
- AI-generated SQL problems based on real-world scenarios
- Multiple difficulty levels to match your skill level
- Live query execution against sample databases
- AI-powered answer checking and feedback
- Progressive hint system (3 hints per problem)
- View solutions with explanations
- XP and leveling system

### Progress Tracking
- Track problems solved and flashcards reviewed
- Level up system based on XP earned
- Current and longest streak tracking
- Detailed statistics by difficulty level
- Recent activity history

## Prerequisites

- Python 3.8 or higher
- Anthropic API key (for Claude AI)

## Installation

### 1. Clone or Navigate to the Project

```bash
cd /Volumes/CORSAIR/GitHub\ Projects/SQLLearning
```

### 2. Create a Virtual Environment (Recommended)

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables

Copy the example environment file and add your API key:

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your_actual_api_key_here
FLASK_SECRET_KEY=your_secret_key_here  # Generate with: python -c "import secrets; print(secrets.token_hex(16))"
FLASK_ENV=development
```

To get an Anthropic API key:
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key

### 5. Initialize the Database

The application will automatically create and populate the databases on first run, but you can verify:

```bash
cd backend
python3 sample_data.py
```

This creates:
- `database/practice.db` - Sample business data for SQL practice
- `database/progress.db` - User progress tracking (created on first use)

## Running the Application

### Start the Flask Server

From the project root directory:

```bash
cd backend
python3 app.py
```

The server will start on `http://localhost:5000`

### Access the Application

Open your web browser and navigate to:

```
http://localhost:5000
```

## Project Structure

```
SQLLearning/
├── backend/
│   ├── app.py                 # Flask application and routes
│   ├── models.py              # Progress tracking database models
│   ├── ai_service.py          # Claude API integration
│   ├── sql_checker.py         # SQL query validation and execution
│   ├── sample_data.py         # Sample database generator
│   └── flashcards.py          # Flashcard content from cheat sheet
├── frontend/
│   ├── static/
│   │   ├── css/style.css      # Application styling
│   │   └── js/app.js          # Frontend utilities
│   └── templates/
│       ├── index.html         # Home page
│       ├── flashcards.html    # Flashcard mode
│       └── problems.html      # Problem-solving mode
├── database/
│   ├── progress.db            # User progress (auto-created)
│   └── practice.db            # Sample data (auto-created)
├── requirements.txt           # Python dependencies
├── .env.example               # Environment variable template
├── .gitignore                 # Git ignore rules
├── SQL_Syntax_Cheat_Sheet.md  # SQL reference guide
└── README.md                  # This file
```

## Database Schema

The practice database includes realistic business data:

### Tables
- **customers**: Customer information (10 customers)
- **products**: Product catalog (10 products in various categories)
- **orders**: Customer orders (50 orders)
- **order_items**: Line items for each order
- **employees**: Company employees (8 employees with manager hierarchy)
- **sales**: Sales transactions (200 records)

Sample queries to explore:
```sql
-- View all tables
SELECT name FROM sqlite_master WHERE type='table';

-- Sample data
SELECT * FROM customers LIMIT 5;
SELECT * FROM products LIMIT 5;
SELECT * FROM orders LIMIT 5;
```

## API Endpoints

### Progress & Statistics
- `GET /api/progress/stats` - Get overall user statistics
- `POST /api/flashcards/progress` - Update flashcard progress

### Flashcards
- `GET /api/flashcards/all` - Get all flashcards by difficulty

### Problems
- `POST /api/problem/generate` - Generate new AI problem
- `POST /api/problem/check` - Check user's SQL query
- `POST /api/problem/hint` - Get contextual hint

### Database
- `GET /api/database/schema` - Get database schema
- `GET /api/database/sample-data?table=<name>&limit=<n>` - View sample data

## Usage Tips

### Flashcard Mode
- Use arrow keys to navigate between cards
- Press spacebar to flip a card
- Mark cards as "Got It!" or "Need More Practice" to track progress
- Start with Basic difficulty and progress upward

### Problem-Solving Mode
1. Select your difficulty level
2. Read the problem description carefully
3. Review the database schema if needed
4. Write your SQL query in the editor
5. Click "Run Query" to execute and get feedback
6. Use hints if you're stuck (3 available per problem)
7. View the solution to learn the optimal approach

### Best Practices
- Start with flashcards to learn syntax
- Progress through difficulty levels gradually
- Use hints strategically to learn, not just solve
- Review solutions even when you solve correctly
- Practice daily to maintain your streak

## Troubleshooting

### Issue: ModuleNotFoundError
**Solution**: Make sure you've activated your virtual environment and installed all dependencies:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: API Key Error
**Solution**: Verify your `.env` file has the correct Anthropic API key:
```bash
cat .env  # Check the file contents
```

### Issue: Database Not Found
**Solution**: The databases are created automatically on first run. Make sure the `database/` directory exists:
```bash
mkdir -p database
cd backend
python3 sample_data.py
```

### Issue: Port Already in Use
**Solution**: Either stop the other process using port 5000, or change the port in `app.py`:
```python
app.run(debug=True, port=5001)  # Use a different port
```

### Issue: Slow AI Responses
**Solution**: This is normal - Claude API calls can take a few seconds. The loading overlay will show while waiting.

## Development

### Adding New Flashcards
Edit `backend/flashcards.py` and add new cards to the appropriate difficulty level.

### Modifying Sample Data
Edit `backend/sample_data.py` to customize the practice database schema and data.

### Customizing Styling
Edit `frontend/static/css/style.css` to change colors, fonts, and layout.

## Learning Path

Recommended progression through the game:

1. **Week 1-2**: Basic Flashcards + Basic Problems
   - Focus: SELECT, WHERE, simple filtering, LIKE, NULL handling

2. **Week 3-4**: Intermediate Flashcards + Intermediate Problems
   - Focus: JOINs, GROUP BY, HAVING, aggregate functions

3. **Week 5-6**: Advanced Flashcards + Advanced Problems
   - Focus: Window functions, subqueries, CTEs

4. **Week 7+**: Expert Flashcards + Expert Problems
   - Focus: Recursive CTEs, complex analytics, optimization

## Credits

- **SQL Reference**: Based on comprehensive SQL Syntax Cheat Sheet
- **AI Integration**: Powered by Anthropic's Claude API
- **Sample Data**: Realistic business data for practical learning

## License

This project is for educational purposes. Feel free to use and modify as needed.

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review the SQL_Syntax_Cheat_Sheet.md for SQL reference
3. Ensure your Anthropic API key is valid and has available credits

Happy learning! Master SQL one query at a time!
