# Migration Guide: Python Flask → Bolt.new (React + Supabase)

This guide explains the migration from the original Python/Flask SQL Learning Game to the new Bolt.new version.

## What Changed

### Architecture
- **Before**: Monolithic Python Flask application with SQLite
- **After**: Serverless React SPA with Supabase backend

### Key Differences

| Feature | Original | New Version |
|---------|----------|-------------|
| Users | Single user | Multi-user with authentication |
| Database | SQLite local files | PostgreSQL cloud database |
| API Keys | Shared in .env | Personal per user |
| Backend | Flask Python server | Supabase Edge Functions |
| Frontend | Jinja templates + vanilla JS | React components |
| Progress | Local SQLite | Cloud database with RLS |
| Deployment | Manual server setup | Bolt.new hosting |

## Database Migration

### Practice Data (Shared)
The Python script `backend/sample_data.py` has been converted to:
- JavaScript seed script: `scripts/seed-practice-data.js`
- Supabase migrations with same schema
- Can be seeded with `npm run seed`

### Progress Data (Per User)
- User progress now isolated by user_id
- Each user has their own statistics
- RLS policies ensure data privacy

## File Mappings

### Backend
```
backend/app.py → supabase/functions/
├── /api/problem/generate → generate-problem/
├── /api/problem/check → check-answer/
└── /api/problem/execute → execute-query/

backend/models.py → Supabase tables
└── ProgressTracker → user_statistics, problem_history, etc.

backend/flashcards.py → src/data/flashcards.json
└── get_all_flashcards() → Static JSON data

backend/ai_service.py → Edge Functions
└── Claude API calls → Direct fetch to Anthropic
```

### Frontend
```
frontend/templates/
├── index.html → src/pages/Home.jsx
├── flashcards.html → src/pages/Flashcards.jsx
└── problems.html → src/pages/Problems.jsx

frontend/static/
├── css/ → src/styles/index.css
└── js/ → React components
```

## API Endpoints Comparison

### Original Flask Routes
```python
GET  /                          # Home page
GET  /flashcards                # Flashcards page
GET  /problems                  # Problems page
GET  /api/flashcards/all        # Get flashcards
POST /api/problem/generate      # Generate problem
POST /api/problem/check         # Check answer
POST /api/progress/stats        # Get statistics
```

### New Supabase Functions
```javascript
POST /functions/v1/generate-problem   # Generate problem
POST /functions/v1/check-answer       # Check answer
POST /functions/v1/execute-query      # Execute SQL
```

### New Supabase Tables (Direct Access)
```
user_profiles           # SELECT, UPDATE
user_api_keys          # SELECT, INSERT, UPDATE, DELETE
flashcard_progress     # SELECT, INSERT, UPDATE
problem_history        # SELECT, INSERT
user_statistics        # SELECT, UPDATE
saved_problems         # SELECT, INSERT, UPDATE, DELETE
```

## Authentication Flow

### Before (No Auth)
```
User visits site → Immediate access
```

### After (With Auth)
```
User visits site
  → Redirected to login if not authenticated
  → Sign up / Sign in
  → Access protected routes
```

## API Key Management

### Before
```env
# .env file
ANTHROPIC_API_KEY=sk-ant-...  # Shared by all users
```

### After
```
Settings Page
  → User enters personal API key
  → Encrypted and stored in database
  → Used for their requests only
```

## Running the Application

### Original
```bash
cd backend
python3 app.py
```

### New
```bash
npm install
npm run dev
```

## Environment Variables

### Before
```env
ANTHROPIC_API_KEY=sk-ant-...
FLASK_SECRET_KEY=...
FLASK_ENV=development
```

### After
```env
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Data Seeding

### Before
```bash
cd backend
python3 sample_data.py
```

### After
```bash
npm run seed
```

## Feature Parity

All features from the original have been preserved:

✅ Flashcard system with multiple difficulty levels
✅ AI-powered problem generation
✅ SQL query execution and validation
✅ Answer checking with feedback
✅ Hint system
✅ Progress tracking (XP, levels, streaks)
✅ Statistics dashboard

## New Features Added

✨ User authentication and authorization
✨ Personal API key management
✨ Multi-user support with data isolation
✨ Cloud-based data storage
✨ Serverless architecture
✨ Modern React UI
✨ Mobile responsive design
✨ Real-time updates
✨ Scalable infrastructure

## Migration Checklist

If you're migrating existing users:

- [ ] Export user progress from SQLite
- [ ] Create user accounts in Supabase
- [ ] Import progress data with user_id associations
- [ ] Notify users to set up their API keys
- [ ] Test all features for each user
- [ ] Verify RLS policies work correctly
- [ ] Confirm API key encryption
- [ ] Test query execution permissions

## Breaking Changes

1. **No Backward Compatibility**: SQLite data must be manually migrated
2. **API Key Required**: Users must provide their own Anthropic API key
3. **Authentication Required**: All features require user login
4. **New URLs**: Frontend routes have changed (React Router)

## Troubleshooting

### Issue: "API key not configured"
**Solution**: Go to Settings and add your Anthropic API key

### Issue: "Unauthorized" errors
**Solution**: Log out and log back in to refresh session

### Issue: RLS policy denies access
**Solution**: Verify user_id is correctly set in queries

### Issue: Edge function timeout
**Solution**: Check Anthropic API key validity and account credits

## Performance Improvements

- ⚡ Serverless functions scale automatically
- ⚡ CDN-hosted static assets
- ⚡ Database connection pooling
- ⚡ Optimized React rendering
- ⚡ Lazy loading of components

## Security Improvements

- 🔒 Row Level Security on all tables
- 🔒 Encrypted API key storage
- 🔒 HTTPS by default
- 🔒 CORS properly configured
- 🔒 SQL injection prevention
- 🔒 Read-only query execution

## Cost Considerations

### Before
- Free (local SQLite)
- Shared API costs

### After
- Supabase free tier (generous limits)
- Each user pays for their own API usage
- Scales with user base

## Conclusion

This migration modernizes the SQL Learning Game with:
- Better scalability
- Enhanced security
- Modern architecture
- Multi-user support
- Cloud infrastructure

The core learning experience remains the same while providing a foundation for future enhancements.
