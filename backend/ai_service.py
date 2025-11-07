from anthropic import Anthropic
import json
import re
import os

class AIService:
    """Service for interacting with Claude API for problem generation and checking"""

    def __init__(self, api_key):
        self.client = Anthropic(api_key=api_key)
        # Model can be configured via environment variable ANTHROPIC_MODEL
        # Common model names (try these if default doesn't work):
        # - "claude-sonnet-4-20250514" (Claude Sonnet 4)
        # - "claude-3-5-sonnet-20240620" (Claude 3.5 Sonnet - older but widely supported)
        # - "claude-opus-4-20250514" (Claude Opus 4)
        # Default: Try Claude 3.5 Sonnet first (most compatible)
        self.model = os.getenv('ANTHROPIC_MODEL', 'claude-3-5-sonnet-20240620')
        print(f"[AI Service] Initialized with model: {self.model}")
        print(f"[AI Service] To use a different model, set ANTHROPIC_MODEL environment variable")

    def generate_problem(self, difficulty, topic=None):
        """Generate a SQL problem based on difficulty and optional topic"""
        print(f"[AI Service] Generating problem - Difficulty: {difficulty}, Topic: {topic}")

        # Define difficulty descriptions
        difficulty_map = {
            'basic': 'Basic SELECT, WHERE, and simple filtering',
            'intermediate': 'JOINs, GROUP BY, HAVING, and aggregate functions',
            'advanced': 'Window functions, subqueries, CTEs, and complex multi-table queries',
            'expert': 'Recursive CTEs, advanced analytics, and performance optimization'
        }

        difficulty_desc = difficulty_map.get(difficulty, difficulty_map['basic'])

        prompt = f"""Generate a realistic SQL practice problem for a learning game. The database has these tables:

**customers**: customer_id, first_name, last_name, email, phone, city, state, country, registration_date, is_active
**products**: product_id, product_name, category, price, cost, stock_quantity, supplier
**orders**: order_id, customer_id, order_date, ship_date, total_amount, status
**order_items**: order_item_id, order_id, product_id, quantity, unit_price, discount
**employees**: employee_id, first_name, last_name, email, department, position, salary, hire_date, manager_id
**sales**: sale_id, employee_id, sale_date, amount, region

Create a problem at the {difficulty} level: {difficulty_desc}
{f"Focus on this topic: {topic}" if topic else ""}

Return a JSON object with:
- "title": Short problem title
- "description": Clear problem statement describing what to find
- "difficulty": The difficulty level
- "topic": Main SQL concept being tested
- "hints": Array of 3 progressive hints (from gentle to more specific)
- "solution": The correct SQL query
- "explanation": Brief explanation of the solution approach

Make it realistic and educational. The problem should test understanding, not just syntax memorization."""

        try:
            print(f"[AI Service] Calling Claude API with model: {self.model}")
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            # Parse the response
            print(f"[AI Service] Received response from Claude")
            content = response.content[0].text
            print(f"[AI Service] Raw response preview: {content[:200]}...")

            # Extract JSON from markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            print(f"[AI Service] Extracted JSON content: {content[:200]}...")
            problem = json.loads(content)
            print(f"[AI Service] Successfully parsed problem: {problem.get('title', 'No title')}")
            return problem
            
        except json.JSONDecodeError as e:
            print(f"[AI Service] JSON parsing error: {e}")
            print(f"[AI Service] Content that failed to parse: {content[:500]}")
            raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")
        except Exception as e:
            print(f"[AI Service] Error generating problem: {e}")
            print(f"[AI Service] Error type: {type(e).__name__}")
            raise

    def check_answer(self, user_query, problem_description, result, expected_result):
        """Check if the user's SQL query is correct using AI analysis"""

        prompt = f"""You are a SQL tutor checking a student's answer.

**Problem**: {problem_description}

**Student's Query**:
```sql
{user_query}
```

**Student's Query Result**: {json.dumps(result, indent=2) if result else "Query failed or returned no results"}

Analyze the student's query and provide feedback. Consider:
1. Does it solve the problem correctly?
2. Is the approach efficient and follows best practices?
3. Are there any errors or improvements needed?

Return a JSON object with:
- "correct": boolean (true if query is correct and efficient)
- "score": number 0-100 (quality of the solution)
- "message": string (encouraging feedback message)
- "improvements": array of strings (suggestions for improvement, empty if perfect)
- "praise": string (what they did well, even if incorrect)

Be encouraging and educational. Even incorrect answers should get constructive feedback."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        content = response.content[0].text

        # Extract JSON from markdown code blocks if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        feedback = json.loads(content)
        return feedback

    def generate_hint(self, problem_description, user_query, hint_level):
        """Generate a contextual hint based on the user's current progress"""

        hint_levels = {
            1: "Give a very gentle nudge in the right direction without revealing the solution",
            2: "Provide more specific guidance about which SQL concepts or clauses to use",
            3: "Give a detailed hint that almost reveals the solution but requires the student to put it together"
        }

        hint_instruction = hint_levels.get(hint_level, hint_levels[1])

        prompt = f"""You are a SQL tutor providing a hint to a student.

**Problem**: {problem_description}

**Student's Current Query** (may be empty or incomplete):
```sql
{user_query if user_query else "No query yet"}
```

**Hint Level**: {hint_level}/3

{hint_instruction}

Provide a single helpful hint as plain text. Be encouraging and Socratic - help them think through the problem rather than just giving the answer."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        hint = response.content[0].text.strip()
        # Remove any quotes that might wrap the hint
        if hint.startswith('"') and hint.endswith('"'):
            hint = hint[1:-1]

        return hint

    def generate_flashcard_explanation(self, concept, user_answer):
        """Generate an explanation for a flashcard concept"""

        prompt = f"""A student is learning SQL and practicing with flashcards.

**Concept**: {concept}

**Student's Answer**: {user_answer}

Provide a brief, clear explanation (2-3 sentences) of this SQL concept. Focus on when and why to use it.

Return plain text only, no JSON."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        return response.content[0].text.strip()

    def generate_wrong_answers(self, correct_answer, question, topic, difficulty):
        """Generate 3 plausible but incorrect answer options for a flashcard using Claude 4.5 Haiku"""
        
        print(f"Generating wrong answers for:")
        print(f"  Topic: {topic}")
        print(f"  Level: {difficulty}")
        print(f"  Question: {question}")
        print(f"  Correct Answer: {correct_answer}")
        
        prompt = f"""You are creating multiple choice options for a SQL learning flashcard.

**Topic**: {topic}
**Difficulty Level**: {difficulty}
**Question**: {question}
**Correct Answer**: {correct_answer}

Generate exactly 3 plausible but INCORRECT answer options. These should be:
- Related to the topic but factually wrong
- Common misconceptions or mistakes students make
- Similar in length and complexity to the correct answer
- Believable enough to test understanding, not just guessing

Return a JSON array with exactly 3 strings, each being one wrong answer option.
Example format: ["wrong answer 1", "wrong answer 2", "wrong answer 3"]

Make the wrong answers educational - they should help students learn by understanding why they're incorrect."""

        try:
            response = self.client.messages.create(
                model=self.model,  # Use same model as other methods
                max_tokens=500,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            content = response.content[0].text

            # Extract JSON from markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            # Try to find JSON array in the content
            # Look for the first [ and find matching ] using bracket counting
            start_idx = content.find('[')
            if start_idx != -1:
                # Find the matching closing bracket
                bracket_count = 0
                end_idx = start_idx
                in_string = False
                escape_next = False
                for i in range(start_idx, len(content)):
                    char = content[i]
                    if escape_next:
                        escape_next = False
                        continue
                    if char == '\\':
                        escape_next = True
                        continue
                    if char == '"' and not escape_next:
                        in_string = not in_string
                        continue
                    if not in_string:
                        if char == '[':
                            bracket_count += 1
                        elif char == ']':
                            bracket_count -= 1
                            if bracket_count == 0:
                                end_idx = i + 1
                                break
                if end_idx > start_idx:
                    content = content[start_idx:end_idx]

            try:
                wrong_answers = json.loads(content)
            except json.JSONDecodeError as e:
                # If JSON parsing still fails, try to extract strings manually
                print(f"JSON decode error: {e}, content preview: {content[:200]}")
                # Try to extract quoted strings
                string_matches = re.findall(r'"([^"]+)"', content)
                if len(string_matches) >= 3:
                    wrong_answers = string_matches[:3]
                else:
                    raise ValueError(f"Could not parse JSON from response")
            
            # Ensure we have exactly 3 answers
            if isinstance(wrong_answers, list) and len(wrong_answers) >= 3:
                return wrong_answers[:3]
            elif isinstance(wrong_answers, list):
                # If we got fewer than 3, pad with generic wrong answers
                while len(wrong_answers) < 3:
                    wrong_answers.append("Incorrect option")
                return wrong_answers[:3]
            else:
                # Fallback if response isn't a list
                return ["Incorrect option 1", "Incorrect option 2", "Incorrect option 3"]
                
        except Exception as e:
            # Fallback to simple wrong answers if AI fails
            print(f"Error generating wrong answers: {e}")
            return [
                f"Not {correct_answer}",
                "This is incorrect",
                "Wrong answer"
            ]
