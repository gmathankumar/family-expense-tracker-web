# Family Expense Tracker - Web App 🌐

A modern, mobile-friendly expense tracking web application built with React, Vite, Supabase, and Tailwind CSS.

## Features

### ✅ Complete Features Implemented

**Authentication**
- Email/password sign up and sign in
- Secure Supabase authentication
- Session management
- User-only data access

**Expense Management**
- ✨ Create, read, update, and delete expenses
- ✨ Add custom dates to expenses with date picker
- ✨ Real-time expense synchronization
- Support for 8 categories: Grocery, Transport, Food, Entertainment, Shopping, Bills, Health, Other

**Advanced Filtering**
- 🔍 Search by description or amount
- 📁 Filter by category
- 📅 Quick date filters (All Time, Today, This Week, This Month, Last Month)
- 🔄 Clear all filters with one click

**Pagination & Grouping**
- 📄 Paginated display (10 items per page)
- 📊 Group expenses by Day, Week, or Month
- Smart page navigation with ellipsis

**Bulk Operations**
- ☑️ Select individual expenses with checkboxes
- ☑️ Select all expenses at once
- 🗑️ Bulk delete selected expenses
- Works seamlessly on both mobile and desktop

**Data Visualization**
- 📈 Total expenses count card
- 💰 Total amount card for filtered results
- 📊 Monthly summary by category with percentages
- Category-based color coding

**AI-Powered Insights**
- 🤖 Personalized spending pattern analysis using OpenRouter AI
- Displays at the top of dashboard below navbar
- Analyzes last 30 days of spending
- Actionable recommendations
- One-click refresh to get new insights
- Works on both mobile and desktop

**Responsive Design**
- 📱 Mobile-optimized card view with full functionality
- 💻 Desktop table view with detailed columns
- Tailwind CSS responsive utilities
- Touch-friendly controls
- Optimized spacing and text sizes for all screen sizes

### 🎯 Project Structure

```
web-app/
├── src/
│   ├── components/
│   │   ├── Auth.jsx                # Authentication router
│   │   ├── SignIn.jsx              # Login form
│   │   ├── SignUp.jsx              # Registration form
│   │   ├── Navbar.jsx              # Navigation bar with user info
│   │   ├── SpendingInsights.jsx    # AI-powered spending analysis
│   │   ├── ExpenseList.jsx         # Main expense management UI
│   │   ├── ExpenseForm.jsx         # Create/edit expense form
│   │   ├── FilterBar.jsx           # Search and filter controls
│   │   └── Pagination.jsx          # Pagination controls
│   ├── lib/
│   │   └── supabase.js             # Supabase client and database functions
│   ├── App.jsx                     # Root component
│   ├── main.jsx                    # App entry point
│   └── index.css                   # Tailwind CSS
├── public/
├── .env                            # Environment variables
├── .env.example                    # Example env file
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Getting Started

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Environment

```bash
# Create .env file
cp .env.example .env
```

Add to `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_publishable_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

Get Supabase keys from: Supabase Dashboard → Project Settings → API

Get OpenRouter API key from: https://openrouter.ai/keys (free tier available)

### Step 3: Configure Supabase

#### Enable Email Authentication
1. Go to Supabase Dashboard
2. Authentication → Providers
3. Enable **Email** provider
4. Save

#### Configure URL Settings
1. Authentication → URL Configuration
2. Set Site URL: `http://localhost:5173`
3. Add Redirect URL: `http://localhost:5173/**`
4. Save

### Step 4: Run Development Server

```bash
npm run dev
```

Open http://localhost:5173

### Step 5: Create Your Account

1. Click "Don't have an account? Sign up"
2. Enter email and password (minimum 6 characters)
3. Check your email for confirmation link
4. Click confirmation link
5. Return to app and sign in

### Step 6: Link to Telegram (Optional)

If using the Telegram bot for expense tracking:

1. Get your auth user ID:
   ```sql
   SELECT id, email FROM auth.users;
   ```

2. Get your Telegram chat ID:
   - Message your Telegram bot: `/start`
   - Bot will reply with your Chat ID

3. Link them in Supabase:
   ```sql
   UPDATE authorized_users 
   SET auth_user_id = 'your-auth-user-id'
   WHERE telegram_chat_id = your-chat-id;
   ```

## Usage Guide

### Spending Insights (AI-Powered)
- **Automatic Analysis:** Insights appear at the top of the dashboard below the navbar
- **What it analyzes:** Last 30 days of spending patterns, categories, and trends
- **Refresh:** Click the refresh icon to get a new insight
- **Mobile & Desktop:** Fully responsive, works on all devices

### Adding Expenses
1. Click **+ Add Expense** button
2. Select date (defaults to today)
3. Enter amount
4. Choose category
5. Add description
6. Click Save

### Filtering Expenses
- **Search:** Type in the search box to find by description or amount
- **Category:** Select a category from dropdown
- **Quick Filters:** Click date filter buttons (Today, This Week, etc.)
- **Clear:** Click "Clear All Filters" to reset

### Managing Expenses
- **Edit:** Click "Edit" button on any expense
- **Delete:** Click "Delete" button or use bulk delete
- **Bulk Delete:** Select expenses with checkboxes, then click "Delete Selected"

### Organizing View
- **Grouping:** Choose Day, Week, or Month from "Group By" dropdown
- **Pagination:** Navigate pages using Previous/Next buttons
- **View:** Switch between "All Expenses" and "Monthly Summary"

## API Documentation

### Database Functions (supabase.js)

- `getCurrentUserRecord()` - Get current user's database record
- `getDateRange(filter)` - Parse quick date filters
- `getUserExpenses(page, pageSize, filters)` - Fetch paginated expenses with filters
- `getMonthlySummary(year, month)` - Get monthly breakdown by category
- `createExpense(expenseData)` - Add new expense
- `updateExpense(expenseId, updates)` - Edit existing expense
- `deleteExpense(expenseId)` - Remove expense

All functions include RLS protection and user authorization.

## Troubleshooting

### "User not found in authorized_users"
- Verify your account is registered in `authorized_users` table
- If linking from Telegram: ensure `auth_user_id` is set correctly

### "Invalid login credentials"
- Check email/password are correct
- Confirm you've verified your email
- Check Supabase Dashboard → Authentication → Users list

### Can't see expenses
1. Verify link: `SELECT * FROM authorized_users WHERE auth_user_id IS NOT NULL;`
2. Check RLS policies are created
3. Ensure expenses exist in database for your account

### Expenses appear on Telegram but not web
- Make sure `auth_user_id` is properly linked in database
- Refresh the browser

## Security

- ✅ Uses Supabase **UBLISHABLE_DEFAULT_KEY** key (safe for client-side)
- ✅ Row Level Security (RLS) protects all data access
- ✅ Users can only view/edit their own expenses
- ✅ Authentication required for all operations
- ✅ No console logs in production

## Deployment

### Vercel/Netlify

1. **Update Supabase URLs:**
   - Add production domain to Redirect URLs in Supabase
   - Update Site URL

2. **Set Environment Variables:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. **Build & Deploy:**
   ```bash
   npm run build
   vercel deploy --prod  # or netlify deploy --prod
   ```

## Technology Stack

- **Frontend:** React 18+ with Hooks
- **Styling:** Tailwind CSS with responsive utilities
- **Build Tool:** Vite
- **Backend:** Supabase (PostgreSQL + Auth)
- **State Management:** React local state with Hooks
- **Authentication:** Supabase Email Auth

## License

MIT

---

**Ready to use!** 🎉 Start tracking expenses across web and Telegram!
