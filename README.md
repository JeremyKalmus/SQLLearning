# SQL Learning Game

An interactive web application designed to help you master SQL through flashcards and AI-powered practice problems. Built with React, Vite, and Supabase.

## Features

### User Authentication
- Individual user accounts with email/password authentication
- Secure session management with Supabase Auth
- Password reset functionality

### Flashcard Mode
- 40+ flashcards covering SQL concepts from basic to expert level
- Interactive flip cards with examples and explanations
- Progress tracking for each card
- Multiple difficulty levels: Basic, Intermediate, Advanced, Expert
- Quiz mode with multiple choice options

### Problem-Solving Mode
- AI-generated SQL problems based on difficulty level
- Live query execution against practice databases
- AI-powered answer checking and feedback
- Progressive hint system (up to 3 hints per problem)
- Professional SQL editor with CodeMirror
- View solutions with explanations
- XP and leveling system

### API Key Management
- Secure storage of personal Anthropic API keys
- Each user manages their own API key
- Encrypted storage in Supabase
- API key validation

### Progress Tracking
- Track problems solved and flashcards reviewed
- Level up system based on XP earned
- Current and longest streak tracking
- Detailed statistics by difficulty level
- User-isolated progress data

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **AI**: Anthropic Claude API (user-provided keys)
- **SQL Editor**: CodeMirror with SQL syntax highlighting
- **Styling**: Custom CSS with CSS variables

## Project Structure

```
sql-learning-game/
├── src/
│   ├── components/        # Reusable React components
│   │   ├── Header.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── SchemaViewer.jsx
│   │   └── TablePreviewModal.jsx
│   ├── contexts/          # React contexts
│   │   └── AuthContext.jsx
│   ├── data/              # Static data
│   │   └── flashcards.json
│   ├── lib/               # Utility libraries
│   │   └── supabase.js
│   ├── pages/             # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Home.jsx
│   │   ├── Settings.jsx
│   │   ├── Flashcards.jsx
│   │   └── Problems.jsx
│   ├── styles/            # CSS styles
│   │   └── index.css
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── scripts/               # Utility scripts
│   └── seed-practice-data.js
├── supabase/
│   ├── functions/         # Edge Functions
│   │   ├── generate-problem/
│   │   ├── execute-query/
│   │   ├── check-answer/
│   │   ├── generate-hint/
│   │   └── generate-flashcard-options/
│   └── migrations/        # Database migrations
├── .env                   # Environment variables
├── package.json
└── vite.config.js
```

## Database Schema

### Practice Tables (Shared, Read-Only)
- **customers**: 100 customer records with realistic data
- **products**: Product catalog with categories and pricing
- **orders**: 200 order records
- **order_items**: Order line items
- **employees**: Employee hierarchy with manager relationships
- **sales**: 500 sales transaction records

### User Tables (Isolated per User)
- **user_profiles**: User account information
- **user_api_keys**: Encrypted API key storage
- **flashcard_progress**: Progress on individual flashcards
- **flashcard_options**: Cached multiple choice options
- **saved_problems**: AI-generated problems for reuse
- **problem_history**: Record of all problem attempts
- **user_statistics**: Aggregate user statistics

## Quick Start

See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

### Basic Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Seed practice data** (one-time):
   ```bash
   npm run seed
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Create account** and add your Anthropic API key in Settings

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

The following environment variables are configured in `.env`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Security Features

1. **Row Level Security (RLS)**: All user data is isolated using Supabase RLS policies
2. **API Key Encryption**: User API keys are encrypted before storage
3. **Read-Only SQL**: Only SELECT and WITH (CTE) queries are allowed
4. **Keyword Filtering**: Dangerous SQL operations are blocked
5. **Authentication Required**: All features require user authentication

## API Usage & Costs

This application uses the Anthropic Claude API with your personal API key. Typical costs:

- Problem generation: ~$0.01-0.02 per problem
- Answer checking: ~$0.005-0.01 per check
- Hints: ~$0.003-0.005 per hint

Expected cost for typical usage: ~$6-9/month for daily practice.

## Learning Path

Recommended progression:

1. **Week 1-2**: Basic Flashcards + Basic Problems
   - Focus: SELECT, WHERE, simple filtering

2. **Week 3-4**: Intermediate Flashcards + Intermediate Problems
   - Focus: JOINs, GROUP BY, HAVING, aggregate functions

3. **Week 5-6**: Advanced Flashcards + Advanced Problems
   - Focus: Window functions, subqueries, CTEs

4. **Week 7+**: Expert Flashcards + Expert Problems
   - Focus: Recursive CTEs, complex analytics

## Key Features

- ✅ Multi-user support with authentication
- ✅ Personal API key management
- ✅ Isolated progress tracking
- ✅ AI-powered problem generation
- ✅ Real-time SQL execution
- ✅ Intelligent feedback system
- ✅ Progressive hint system
- ✅ Professional SQL editor with autocomplete
- ✅ Gamification (XP, levels, streaks)
- ✅ Responsive design
- ✅ Secure data storage

## Support

For issues or questions:
1. Check that your API key is configured correctly in Settings
2. Ensure your Anthropic account has available credits
3. Verify you're using valid SQL syntax for queries
4. See QUICKSTART.md for setup help

## License

This project is for educational purposes.
