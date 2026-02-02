# MyFO Setup & Demo Guide

## Quick Start (2 minutes)

### 1. Install & Setup
```bash
# Dependencies are already installed
# Database is already migrated
# Server is already running at http://localhost:3003
```

### 2. Add OpenAI API Key
Edit `.env` file and add your OpenAI API key:
```env
OPENAI_API_KEY="sk-your-actual-key-here"
```

Get your key from: https://platform.openai.com/api-keys

**Note**: The chat assistant won't work without this key, but the rest of the app will function normally.

### 3. Open the App
Visit: http://localhost:3003

## Demo Flow (2-3 minutes)

### Option A: Load Demo Data (Fastest)
1. Open http://localhost:3003
2. Click **"Load Demo Data"** button on the dashboard
3. This instantly creates:
   - A sample semester plan
   - ~30 sample transactions over 6 weeks
   - 2 planned items (Spring Break Trip, New Laptop)
4. Explore the dashboard metrics!

### Option B: Complete Onboarding (5 minutes)
1. Open http://localhost:3003
2. You'll be redirected to `/onboarding`
3. Complete the 5-step wizard:
   - **Step 1 (Basics)**: Set semester dates and starting balance
   - **Step 2 (Funding)**: Enter grants, loans, and monthly income
   - **Step 3 (Fixed Costs)**: Set monthly expenses (rent, utilities, etc.)
   - **Step 4 (Variable Budgets)**: Set weekly spending budgets
   - **Step 5 (Planned Items)**: Add big planned purchases (optional)
4. Click **"Complete Setup"**

## Demo Script

### 1. Dashboard Overview (30 seconds)
Point out the 4 key metrics:
- **Safe-to-Spend This Week**: $X available without going over budget
- **Runway Date**: When funds will run out at current spending rate
- **Budget Status**: Ahead/On Track/Behind plan
- **Remaining Funds**: Total available today

Show:
- Upcoming planned items (next 7 days)
- Top spending categories (last 14 days)
- Semester progress bar
- FAFSA checklist

### 2. Transactions Page (1 minute)
1. Go to `/transactions`
2. Show existing transactions (if demo data loaded)
3. Demonstrate CSV import:
   - Prepare a CSV with columns: Date, Description, Amount
   - Click **"Choose File"** and select CSV
   - If columns aren't auto-detected, map them manually
   - Select amount convention (positive/negative = spending)
   - Click **"Import Transactions"**
4. Show inline category editing in the table

### 3. Ask MyFO (Chat Assistant) (1-2 minutes)
1. Go to `/assistant`
2. Try quick questions:
   - "Can I afford a $90 concert ticket?"
   - "How am I doing on my budget?"
   - "What should I cut back on?"
   - "Can I take a $400 spring break trip?"

3. Show how MyFO responds with:
   - Clear verdict (Safe/Risky/Not Recommended)
   - Impact on safe-to-spend and runway
   - Alternative options and strategies
   - Specific next actions

**Important**: If you see an OpenAI API key error, add your key to `.env` and restart the server.

## Key Features to Highlight

### 1. Deterministic Budget Engine
- All financial calculations are 100% math-based
- No AI hallucination on numbers
- AI only interprets and advises

### 2. Smart Transaction Categorization
- Automatic keyword-based categorization on import
- User can manually adjust categories
- 12 predefined categories for consistency

### 3. Runway Calculation
- Week-by-week simulation of spending
- Accounts for fixed costs, variable spending, and planned items
- Shows when funds will run out (or confirms fully funded)

### 4. AI Coaching
- Understands student financial situations
- Provides "make it work" alternatives
- Encourages but stays honest
- Includes disclaimers (not financial advice)

### 5. Privacy First
- No bank credentials needed
- CSV import only
- Local SQLite database
- Minimal data storage

## Sample CSV Format

Create a file called `transactions.csv`:

```csv
Date,Description,Amount
2025-01-15,Whole Foods,75.50
2025-01-16,Chipotle,12.50
2025-01-17,Shell Gas Station,45.00
2025-01-18,Netflix,15.99
2025-01-20,Campus Bookstore,125.00
2025-01-22,Trader Joes,68.20
2025-01-23,Starbucks,8.50
```

**Note**: Amount can be positive (spending) or negative (spending), depending on your bank's format. Select the right convention during import.

## Troubleshooting

### "No plan found. Please complete onboarding."
- You need to either complete the onboarding wizard OR click "Load Demo Data"

### "OpenAI API key not configured"
- Add `OPENAI_API_KEY="sk-..."` to your `.env` file
- Restart the dev server: `npm run dev`

### CSV import not working
- Ensure CSV has Date, Description, Amount columns
- Try the column mapper if auto-detection fails
- Check the amount convention (positive vs negative)

### Port already in use
- The app will automatically try ports 3001, 3002, 3003, etc.
- Check the terminal output for the actual port

### Watchpack errors (EMFILE)
- These are harmless system-level warnings
- The app works fine despite them
- On macOS: `ulimit -n 10000` can help

## Tech Stack Highlights

- **Next.js 14 App Router**: Modern React framework with server components
- **Prisma + SQLite**: Type-safe ORM with local database
- **OpenAI GPT-4o-mini**: Fast, affordable AI for chat
- **PapaParse**: Robust CSV parsing
- **TailwindCSS**: Utility-first styling
- **date-fns**: Modern date utilities
- **TypeScript**: Full type safety

## Architecture Highlights

### Separation of Concerns
- **Budget Engine** (`src/lib/budgetEngine.ts`): Pure math, no AI
- **API Routes** (`app/api/`): Backend logic
- **Pages** (`app/`): UI and user interactions
- **Components** (`src/components/`): Reusable UI elements

### Data Flow
1. User inputs plan data (onboarding)
2. User imports transactions (CSV)
3. Budget engine calculates metrics (deterministic)
4. Dashboard displays metrics
5. AI receives budget snapshot + user question
6. AI provides advice (never invents numbers)

## Demo Tips

1. **Start with demo data** for fastest demo
2. **Explain deterministic math** - this is unique
3. **Show the CSV import** - privacy-first approach
4. **Use the chat** - show AI that doesn't hallucinate numbers
5. **Highlight FAFSA** - student-specific feature
6. **Mention privacy** - no bank credentials needed

## Next Steps

After the demo, users can:
1. Clear demo data and start fresh with real onboarding
2. Import their actual bank transactions
3. Add planned purchases/trips
4. Check in weekly to see budget status
5. Use MyFO chat before making purchases

## Development Commands

```bash
# Start dev server
npm run dev

# Reset database
npx prisma migrate reset

# View database
npx prisma studio

# Build for production
npm run build

# Start production server
npm start
```

## Notes for Hackathon Judges

### What Makes This Different
- **Deterministic budgeting** - AI never invents financial numbers
- **Student-focused** - Semester-based planning, FAFSA tracking
- **Privacy-first** - CSV only, no bank credentials
- **Actionable advice** - Not just "you're over budget", but specific alternatives

### MVP Completeness
✅ Full onboarding wizard
✅ CSV import with smart categorization
✅ Real-time budget dashboard
✅ AI chat assistant with structured responses
✅ FAFSA checklist
✅ Demo data seeding
✅ Comprehensive documentation

### Production Readiness Gaps
⚠️ Single-user mode (would need multi-tenant auth)
⚠️ No recurring transaction detection
⚠️ No mobile optimization
⚠️ Basic error handling (would need Sentry, etc.)
⚠️ No caching layer

### Time to Build
This MVP was built in approximately 2-3 hours, demonstrating the power of:
- Modern frameworks (Next.js 14)
- Type safety (TypeScript + Prisma)
- AI assistance (for rapid development)

---

**Ready to demo!** 🎓💰
