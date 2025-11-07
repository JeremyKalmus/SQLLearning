# Quick Start Guide

Get up and running with SQL Learning Game in 3 simple steps!

## Step 1: Get Your API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Click on "API Keys" in the left sidebar
4. Click "Create Key"
5. Copy your new API key

## Step 2: Configure the Application

1. Create a `.env` file in this directory (copy from `.env.example` if it exists)
2. Add your API key and Flask secret key:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
   FLASK_SECRET_KEY=your_secret_key_here
   ```
   
   **To generate a Flask secret key**, run this command:
   ```bash
   python3 -c "import secrets; print(secrets.token_hex(16))"
   ```
   Copy the output and paste it as your `FLASK_SECRET_KEY` value.
   
   **Note**: If you don't set `FLASK_SECRET_KEY`, the app will generate one automatically, but it's recommended to set a fixed value for consistency.
3. Save the file

## Step 3: Run the Application

### Option A: Using the Startup Script (Recommended)
```bash
./run.sh
```

### Option B: Manual Start
```bash
# Activate virtual environment
source venv/bin/activate

# Start the server
cd backend
python3 app.py
```

## Access the Game

Open your browser and go to:
```
http://localhost:5000
```

## First Steps in the Game

### Learn with Flashcards
1. Click "Start Flashcards"
2. Select "Basic" difficulty
3. Read each question and try to recall the answer
4. Click "Show Answer" to check
5. Mark whether you got it correct or need more practice

### Practice with Problems
1. Click "Solve Problems"
2. Select "Intermediate" difficulty
3. Read the problem description
4. Write your SQL query in the editor
5. Click "Run Query" to execute and get AI feedback
6. Use hints if you get stuck (3 available per problem)

## Tips for Success

- **Start with Flashcards**: Build your foundation with the Basic flashcards before tackling problems
- **Use Hints Wisely**: Try to solve problems yourself first, use hints when genuinely stuck
- **Review Solutions**: Even when you solve a problem correctly, review the solution to learn best practices
- **Daily Practice**: Maintain your streak by practicing a little bit each day
- **Progress Gradually**: Move through difficulty levels: Basic → Intermediate → Advanced → Expert

## Need Help?

- Check the full [README.md](README.md) for detailed documentation
- Review [SQL_Syntax_Cheat_Sheet.md](SQL_Syntax_Cheat_Sheet.md) for SQL reference
- Ensure your Anthropic API key is valid and has available credits

## Common Issues

**Problem**: "API key not found" error
**Solution**: Make sure you edited `.env` and added your real API key

**Problem**: Slow responses
**Solution**: This is normal - AI responses can take a few seconds

**Problem**: Port 5000 already in use
**Solution**: Edit `backend/app.py` and change the port number at the bottom

## Database Notes

- The application automatically creates `database/practice.db` and `database/progress.db` on first run
- These files are ignored by Git, so each user gets their own fresh databases
- Your practice data and progress are stored locally and won't be shared
- If you want to reset your progress, simply delete `database/progress.db` and it will be recreated on next run

Happy learning!
