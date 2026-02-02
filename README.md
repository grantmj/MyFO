# MyFO - My Financial Officer

A student financial health copilot that helps college students plan their semester budget, track spending, and make informed financial decisions with deterministic math + AI coaching.

## Features

### Core Functionality
- **Semester Budget Planning**: 5-step onboarding wizard to set up your semester finances
- **Transaction Import**: CSV import from your bank with automatic categorization
- **Real-time Budget Dashboard**: See your financial health at a glance
- **AI Chat Assistant**: Ask "Can I afford this?" and get honest, math-based answers
- **FAFSA Checklist**: Track your financial aid application progress

### Key Metrics
- **Safe-to-Spend This Week**: How much you can safely spend without going off-budget
- **Runway Date**: When your funds will run out if you continue current spending
- **Budget Status**: Whether you're ahead, on track, or behind your plan
- **Category Tracking**: See where your money is actually going

### What Makes MyFO Special
- **Deterministic Math**: All financial calculations are 100% deterministic - no AI hallucination on numbers
- **Privacy First**: No bank credentials needed. CSV import only. Minimal data storage.
- **Student-Focused**: Built specifically for semester-based budgeting and financial aid cycles
- **Actionable Advice**: AI provides alternatives and "make it work" strategies when purchases are risky

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: TailwindCSS (custom design system)
- **Database**: SQLite via Prisma ORM
- **AI**: OpenAI API (GPT-4o-mini)
- **CSV Parsing**: PapaParse
- **Date Utilities**: date-fns

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the `.env.example` or use the existing `.env` file and add your OpenAI API key:

```env
DATABASE_URL="file:./prisma/dev.db"
OPENAI_API_KEY="sk-your-key-here"
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

### 3. Initialize Database

```bash
npx prisma migrate dev
```

This will:
- Create the SQLite database
- Run all migrations
- Generate the Prisma Client

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Quick Start Demo

1. Click **"Load Demo Data"** on the dashboard to instantly populate the app with sample data
2. Explore the dashboard to see your budget metrics
3. Visit **Transactions** to see imported spending
4. Ask **MyFO** a question like "Can I afford a $90 concert ticket?"

## Usage Guide

### Onboarding (First Time Setup)

1. **Basics**: Enter semester dates and starting balance
2. **Funding**: Input grants, loans, and monthly income
3. **Fixed Costs**: Set monthly expenses (rent, utilities, etc.)
4. **Variable Budgets**: Set weekly spending budgets
5. **Planned Items**: Add big planned purchases/trips

### Importing Transactions

1. Export CSV from your bank (must include Date, Description, Amount)
2. Go to **Transactions** page
3. Upload CSV file
4. Map columns if auto-detection doesn't work
5. Select amount convention (positive = spend or negative = spend)
6. Import!

### Using the Chat Assistant

Ask questions like:
- "Can I buy a $90 concert ticket?"
- "How am I doing on my budget?"
- "What should I cut back on?"
- "Can I take a $400 spring break trip?"

MyFO will:
- Give you a clear verdict (Safe/Risky/Not Recommended)
- Show impact on your runway and safe-to-spend
- Suggest alternatives and strategies
- Recommend specific actions

## How the Budget Engine Works

MyFO uses **100% deterministic math** to calculate your budget metrics. No AI is involved in the numbers.

### Key Calculations:

1. **Safe-to-Spend This Week**:
   ```
   (Remaining Funds - Upcoming Planned Items) / Remaining Weeks - Fixed Costs Per Week
   ```

2. **Runway Date**:
   - Simulates week-by-week spending
   - Subtracts weekly fixed + variable costs
   - Adds weekly income
   - Finds when balance hits $0

3. **Budget Status**:
   - Expected Spend = (Fixed + Variable) * Weeks Elapsed + Planned Items To Date
   - Actual Spend = Sum of all transactions
   - Status = Expected - Actual (positive = ahead, negative = behind)

4. **AI Role**:
   - AI ONLY interprets numbers and provides advice
   - AI receives the exact budget snapshot
   - AI NEVER invents financial numbers

## Project Structure

```
my-app-hackathon2026/
├── app/
│   ├── api/                      # API routes
│   │   ├── user/                 # User management
│   │   ├── plan/                 # Budget plan CRUD
│   │   ├── transactions/         # Transaction import/management
│   │   ├── planned-items/        # Planned purchases
│   │   ├── budget-snapshot/      # Real-time budget calculations
│   │   ├── assistant/            # AI chat endpoint
│   │   ├── fafsa-checklist/      # FAFSA tracking
│   │   └── seed-demo/            # Demo data seeding
│   ├── page.tsx                  # Dashboard
│   ├── onboarding/page.tsx       # Setup wizard
│   ├── transactions/page.tsx     # CSV import & transaction list
│   └── assistant/page.tsx        # MyFO chat interface
├── src/
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   ├── Layout.tsx            # App layout wrapper
│   │   ├── Navbar.tsx            # Navigation
│   │   └── Footer.tsx            # Footer
│   └── lib/
│       ├── budgetEngine.ts       # Deterministic budget calculations
│       ├── categorize.ts         # Transaction categorization
│       ├── constants.ts          # Categories & labels
│       ├── types.ts              # TypeScript types
│       └── db.ts                 # Prisma client singleton
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── dev.db                    # SQLite database (generated)
└── package.json
```

## Data Model

### User
- Single-user mode by default (can extend to multi-user)

### Plan
- Semester dates (start, end, disbursement)
- Funding (starting balance, grants, loans, income)
- Fixed costs (monthly: rent, utilities, subscriptions, transportation)
- Variable budgets (weekly: groceries, dining, entertainment, misc)

### Transaction
- Date, description, amount, category
- Auto-categorized on import using keyword matching
- User can manually adjust categories

### PlannedItem
- Name, date, amount, category
- Used for big purchases/trips that affect runway calculations

### FafsaChecklist
- 8 checklist items to track FAFSA progress

## Categories

Fixed enum for consistency:
- Rent
- Utilities
- Groceries
- Dining Out
- Transportation
- Books & Supplies
- Health
- Subscriptions
- Entertainment
- Travel
- Miscellaneous
- Income

## Privacy & Disclaimers

- **No Bank Credentials**: CSV import only, no direct bank connections
- **Local Data**: SQLite database stored locally
- **Not Financial Advice**: MyFO is an educational budgeting tool
- **Minimal Data**: Only stores what's needed for calculations

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Prisma commands
npx prisma migrate dev       # Create migration
npx prisma generate         # Generate Prisma Client
npx prisma studio           # Open database GUI
```

## Troubleshooting

### "OpenAI API key not configured"
- Make sure you've added `OPENAI_API_KEY` to your `.env` file
- Restart the dev server after adding the key

### "No plan found"
- Complete the onboarding wizard first
- Or click "Load Demo Data" to skip onboarding

### CSV import not working
- Check that your CSV has Date, Description, Amount columns
- Try using the column mapper if auto-detection fails
- Verify the amount convention matches your bank's format

### Database errors
- Run `npx prisma migrate reset` to reset the database
- Run `npx prisma migrate dev` to recreate tables

## Future Enhancements

Potential features for future versions:
- Multiple semester plans
- Recurring transaction detection
- Budget templates by major/location
- Peer spending comparisons (anonymized)
- Mobile app
- Receipt scanning
- Bill reminders
- Savings goals

## License

MIT

## Support

For issues or questions about this MVP, please open an issue in the repository.

---

Built for students, by students. Budget smarter, not harder. 🎓💰
