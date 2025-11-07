import sqlite3
import os
from datetime import datetime
import json

class ProgressTracker:
    """Track user progress, scores, and statistics"""

    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(__file__), '../database/progress.db')
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._initialize_database()

    def _initialize_database(self):
        """Create progress tracking tables if they don't exist"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Flashcard progress table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS flashcard_progress (
                card_id TEXT PRIMARY KEY,
                times_seen INTEGER DEFAULT 0,
                times_correct INTEGER DEFAULT 0,
                last_seen TIMESTAMP,
                next_review TIMESTAMP,
                difficulty INTEGER DEFAULT 0,
                topic TEXT,
                level TEXT
            )
        ''')
        
        # Add topic and level columns if they don't exist (migration for existing databases)
        try:
            cursor.execute('ALTER TABLE flashcard_progress ADD COLUMN topic TEXT')
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            cursor.execute('ALTER TABLE flashcard_progress ADD COLUMN level TEXT')
        except sqlite3.OperationalError:
            pass  # Column already exists

        # Flashcard options table (stores AI-generated multiple choice options)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS flashcard_options (
                card_id TEXT PRIMARY KEY,
                options TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Saved problems table (stores AI-generated problems for reuse)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS saved_problems (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                problem_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Problem solving history
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS problem_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                problem_title TEXT,
                difficulty TEXT,
                topic TEXT,
                query TEXT,
                score INTEGER,
                correct INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Overall statistics
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS statistics (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                total_problems_attempted INTEGER DEFAULT 0,
                total_problems_solved INTEGER DEFAULT 0,
                total_flashcards_reviewed INTEGER DEFAULT 0,
                total_xp INTEGER DEFAULT 0,
                current_streak INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                last_activity_date DATE
            )
        ''')

        # Initialize statistics row if it doesn't exist
        cursor.execute('INSERT OR IGNORE INTO statistics (id) VALUES (1)')

        conn.commit()
        conn.close()

    def update_flashcard_progress(self, card_id, correct, topic=None, level=None):
        """Update progress for a flashcard"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        now = datetime.now().isoformat()

        # Get current progress
        cursor.execute('SELECT times_seen, times_correct, difficulty FROM flashcard_progress WHERE card_id = ?', (card_id,))
        row = cursor.fetchone()

        if row:
            times_seen, times_correct, difficulty = row
            times_seen += 1
            if correct:
                times_correct += 1
                difficulty = max(0, difficulty - 1)  # Make easier
            else:
                difficulty = min(5, difficulty + 1)  # Make harder

            cursor.execute('''
                UPDATE flashcard_progress
                SET times_seen = ?, times_correct = ?, last_seen = ?, difficulty = ?, topic = ?, level = ?
                WHERE card_id = ?
            ''', (times_seen, times_correct, now, difficulty, topic, level, card_id))
        else:
            # First time seeing this card
            times_correct = 1 if correct else 0
            difficulty = 0 if correct else 1

            cursor.execute('''
                INSERT INTO flashcard_progress (card_id, times_seen, times_correct, last_seen, difficulty, topic, level)
                VALUES (?, 1, ?, ?, ?, ?, ?)
            ''', (card_id, times_correct, now, difficulty, topic, level))

        # Update statistics
        cursor.execute('''
            UPDATE statistics
            SET total_flashcards_reviewed = total_flashcards_reviewed + 1,
                total_xp = total_xp + ?,
                last_activity_date = DATE('now')
            WHERE id = 1
        ''', (5 if correct else 2,))

        self._update_streak(cursor)

        conn.commit()
        conn.close()

    def record_problem_attempt(self, problem_title, difficulty, topic, query, score, correct):
        """Record a problem attempt"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO problem_history (problem_title, difficulty, topic, query, score, correct)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (problem_title, difficulty, topic, query, score, 1 if correct else 0))

        # Update statistics
        xp_earned = score // 5  # 20 XP for perfect score
        cursor.execute('''
            UPDATE statistics
            SET total_problems_attempted = total_problems_attempted + 1,
                total_problems_solved = total_problems_solved + ?,
                total_xp = total_xp + ?,
                last_activity_date = DATE('now')
            WHERE id = 1
        ''', (1 if correct else 0, xp_earned))

        self._update_streak(cursor)

        conn.commit()
        conn.close()

    def _update_streak(self, cursor):
        """Update the current streak"""
        cursor.execute('SELECT last_activity_date, current_streak, longest_streak FROM statistics WHERE id = 1')
        last_date, current_streak, longest_streak = cursor.fetchone()

        today = datetime.now().date().isoformat()

        if last_date == today:
            # Already counted today
            return
        elif last_date:
            last = datetime.fromisoformat(last_date).date()
            today_date = datetime.now().date()
            days_diff = (today_date - last).days

            if days_diff == 1:
                # Consecutive day
                current_streak += 1
            else:
                # Streak broken
                current_streak = 1
        else:
            current_streak = 1

        longest_streak = max(longest_streak or 0, current_streak)

        cursor.execute('''
            UPDATE statistics
            SET current_streak = ?, longest_streak = ?
            WHERE id = 1
        ''', (current_streak, longest_streak))

    def get_stats(self):
        """Get overall statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM statistics WHERE id = 1')
        row = cursor.fetchone()

        if row:
            stats = {
                'total_problems_attempted': row[1],
                'total_problems_solved': row[2],
                'total_flashcards_reviewed': row[3],
                'total_xp': row[4],
                'current_streak': row[5],
                'longest_streak': row[6],
                'level': self._calculate_level(row[4]),  # Based on XP
                'xp_for_next_level': self._xp_for_next_level(row[4])
            }
        else:
            stats = {
                'total_problems_attempted': 0,
                'total_problems_solved': 0,
                'total_flashcards_reviewed': 0,
                'total_xp': 0,
                'current_streak': 0,
                'longest_streak': 0,
                'level': 1,
                'xp_for_next_level': 100
            }

        # Get problem accuracy by difficulty
        cursor.execute('''
            SELECT difficulty,
                   COUNT(*) as total,
                   SUM(correct) as solved
            FROM problem_history
            GROUP BY difficulty
        ''')
        accuracy_by_difficulty = {}
        for diff, total, solved in cursor.fetchall():
            accuracy_by_difficulty[diff] = {
                'total': total,
                'solved': solved,
                'accuracy': (solved / total * 100) if total > 0 else 0
            }

        stats['accuracy_by_difficulty'] = accuracy_by_difficulty

        # Recent activity
        cursor.execute('''
            SELECT problem_title, difficulty, score, timestamp
            FROM problem_history
            ORDER BY timestamp DESC
            LIMIT 5
        ''')
        stats['recent_problems'] = []
        for title, diff, score, timestamp in cursor.fetchall():
            stats['recent_problems'].append({
                'title': title,
                'difficulty': diff,
                'score': score,
                'timestamp': timestamp
            })

        # Add flashcard stats by topic and level
        stats['flashcard_stats_by_topic_level'] = self.get_flashcard_stats_by_topic_level()

        conn.close()
        return stats

    def _calculate_level(self, xp):
        """Calculate level based on XP (100 XP per level)"""
        return (xp // 100) + 1

    def _xp_for_next_level(self, xp):
        """Calculate XP needed for next level"""
        current_level = self._calculate_level(xp)
        next_level_xp = current_level * 100
        return next_level_xp - xp

    def get_flashcard_stats(self):
        """Get flashcard-specific statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT
                COUNT(*) as total_cards,
                SUM(times_seen) as total_reviews,
                SUM(times_correct) as total_correct,
                AVG(CAST(times_correct AS FLOAT) / NULLIF(times_seen, 0)) as avg_accuracy
            FROM flashcard_progress
        ''')

        row = cursor.fetchone()
        conn.close()

        if row and row[0]:
            return {
                'total_cards_reviewed': row[0],
                'total_reviews': row[1] or 0,
                'total_correct': row[2] or 0,
                'average_accuracy': round((row[3] or 0) * 100, 1)
            }
        else:
            return {
                'total_cards_reviewed': 0,
                'total_reviews': 0,
                'total_correct': 0,
                'average_accuracy': 0
            }

    def get_flashcard_stats_by_topic_level(self):
        """Get flashcard statistics grouped by topic and level"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT
                topic,
                level,
                COUNT(*) as total_attempts,
                SUM(CASE WHEN times_correct > 0 THEN 1 ELSE 0 END) as cards_with_correct,
                SUM(times_seen) as total_reviews,
                SUM(times_correct) as total_correct,
                AVG(CAST(times_correct AS FLOAT) / NULLIF(times_seen, 0)) as avg_accuracy
            FROM flashcard_progress
            WHERE topic IS NOT NULL AND level IS NOT NULL
            GROUP BY topic, level
            ORDER BY level, topic
        ''')

        stats_by_topic_level = {}
        for topic, level, total_attempts, cards_with_correct, total_reviews, total_correct, avg_accuracy in cursor.fetchall():
            if level not in stats_by_topic_level:
                stats_by_topic_level[level] = {}
            
            stats_by_topic_level[level][topic] = {
                'total_attempts': total_attempts,
                'cards_with_correct': cards_with_correct,
                'total_reviews': total_reviews or 0,
                'total_correct': total_correct or 0,
                'accuracy': round((avg_accuracy or 0) * 100, 1) if avg_accuracy else 0
            }

        conn.close()
        return stats_by_topic_level

    def get_flashcard_options(self, card_id):
        """Get stored options for a flashcard"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('SELECT options FROM flashcard_options WHERE card_id = ?', (card_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            try:
                return json.loads(row[0])
            except json.JSONDecodeError:
                return None
        return None

    def save_flashcard_options(self, card_id, options):
        """Save options for a flashcard"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        options_json = json.dumps(options)
        now = datetime.now().isoformat()

        cursor.execute('''
            INSERT OR REPLACE INTO flashcard_options (card_id, options, updated_at)
            VALUES (?, ?, ?)
        ''', (card_id, options_json, now))

        conn.commit()
        conn.close()

    def save_problem(self, problem_data):
        """Save a generated problem for later reuse"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        problem_json = json.dumps(problem_data)
        now = datetime.now().isoformat()

        cursor.execute('''
            INSERT INTO saved_problems (problem_data, created_at, last_accessed)
            VALUES (?, ?, ?)
        ''', (problem_json, now, now))

        problem_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return problem_id

    def get_best_score_for_problem(self, problem_title):
        """Get the best score for a problem by title"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT MAX(score), COUNT(*), MAX(CASE WHEN correct = 1 THEN 1 ELSE 0 END)
            FROM problem_history
            WHERE problem_title = ?
        ''', (problem_title,))

        row = cursor.fetchone()
        conn.close()

        if row and row[0] is not None:
            return {
                'best_score': row[0],
                'attempts': row[1],
                'solved': bool(row[2])
            }
        return None

    def get_saved_problems(self, limit=50):
        """Get all saved problems, ordered by most recently accessed"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT id, problem_data, created_at, last_accessed
            FROM saved_problems
            ORDER BY last_accessed DESC
            LIMIT ?
        ''', (limit,))

        problems = []
        for row in cursor.fetchall():
            try:
                problem_data = json.loads(row[1])
                problem_title = problem_data.get('title', '')
                
                # Get best score for this problem
                score_info = self.get_best_score_for_problem(problem_title)
                
                problem_entry = {
                    'id': row[0],
                    'problem': problem_data,
                    'created_at': row[2],
                    'last_accessed': row[3]
                }
                
                if score_info:
                    problem_entry['best_score'] = score_info['best_score']
                    problem_entry['attempts'] = score_info['attempts']
                    problem_entry['solved'] = score_info['solved']
                
                problems.append(problem_entry)
            except json.JSONDecodeError:
                continue

        conn.close()
        return problems

    def get_saved_problem(self, problem_id):
        """Get a specific saved problem by ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT problem_data, last_accessed
            FROM saved_problems
            WHERE id = ?
        ''', (problem_id,))

        row = cursor.fetchone()
        if row:
            try:
                problem_data = json.loads(row[0])
                # Update last_accessed
                now = datetime.now().isoformat()
                cursor.execute('''
                    UPDATE saved_problems
                    SET last_accessed = ?
                    WHERE id = ?
                ''', (now, problem_id))
                conn.commit()
                conn.close()
                return problem_data
            except json.JSONDecodeError:
                conn.close()
                return None

        conn.close()
        return None

    def delete_saved_problem(self, problem_id):
        """Delete a saved problem"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('DELETE FROM saved_problems WHERE id = ?', (problem_id,))
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
