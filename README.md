# CRM Plus - Order Management System

A comprehensive CRM system for managing orders with role-based access control, financial tracking, and profit calculations.

## Features

### User Roles

1. **Owner (Admin)**
   - Full access to all features
   - Can view and manage financial information
   - Can see costs, exchange rates, expenses, selling prices, and profits
   - Access to reports and analytics

2. **Worker (Order Entry)**
   - Can create and edit orders
   - Can manage customer and product information
   - Cannot see financial data (costs, prices, profits, reports)

### Pages

1. **Orders Page** (`/orders`)
   - List all orders in a table
   - View order details
   - Create new orders
   - Edit existing orders
   - Accessible by both Owner and Worker

2. **Owner Page** (`/owner`)
   - Financial overview with profit/expense summaries
   - Orders list with financial columns
   - Reports with filters (by date, status)
   - Owner only

3. **Order Detail Page** (`/orders/[id]`)
   - Full order information
   - Financial section (Owner only)
   - Expense management (Owner only)
   - Profit calculations

## Database Schema

### Tables

1. **users**
   - Stores user accounts with roles (owner/worker)
   - Default users created on first run

2. **orders**
   - Customer and product information
   - Order status (New, Shipped, Delivered, Cancelled)
   - Safe for workers to view/edit

3. **order_finance**
   - Financial data (1-1 with orders)
   - Cost in TRY, exchange rate, cost in LYD
   - Shipping costs, selling price, profit
   - Owner only

4. **expenses**
   - Additional expenses per order
   - Can be added after order creation
   - Reduces profit when calculated

5. **exchange_rates**
   - Daily exchange rates (TRY → LYD)
   - Can be used to quickly fill finance forms

6. **order_payments**
   - Payment/refund ledger per order
   - `orders.amount_paid` and `orders.deposit_paid` are cached from this table
   - Workers can add payments; owners can refund or delete entries

7. **order_events**
   - Order timeline: status changes, payments, product edits, and related updates
   - Finance/expense events are owner-only on the order page

Run [`sql/001_order_events_and_payments.sql`](sql/001_order_events_and_payments.sql) in the Supabase SQL editor to create these tables and backfill existing `amount_paid` values.

## Profit Calculation

```
Total Cost (LYD) = (Cost TRY × Exchange Rate) + Shipping LYD + Sum of Order Expenses
Order Profit (LYD) = Selling Price LYD - Total Cost LYD
Net Profit (LYD) = Order Profit - General Business Expenses
```

Order profit already includes per-order expenses. The owner report still shows those expenses as their own total, but net profit only subtracts general business expenses.

## Getting Started

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login Credentials

**Owner Account:**
- Username: `admin`
- Password: `admin123`

**Worker Account:**
- Username: `worker`
- Password: `worker123`

⚠️ **Important:** Change these passwords in production!

## Project Structure

```
crmPlus/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── orders/       # Order CRUD operations
│   │   ├── finance/      # Financial data endpoints
│   │   ├── expenses/     # Expense management
│   │   ├── exchange-rates/ # Exchange rate management
│   │   └── reports/      # Reports and analytics
│   ├── components/       # React components
│   ├── login/           # Login page
│   ├── orders/          # Orders pages
│   ├── owner/           # Owner dashboard
│   └── page.js          # Home page (redirects)
├── lib/
│   ├── db.js            # Database initialization
│   ├── auth.js          # Authentication utilities
│   ├── orders.js        # Order operations
│   ├── finance.js       # Financial calculations
│   ├── payments.js      # Payment ledger
│   └── orderEvents.js   # Order timeline
├── sql/
│   └── 001_order_events_and_payments.sql
└── crmplus.db           # SQLite database (created automatically)
```

## Usage Guide

### Creating an Order (Worker/Owner)

1. Navigate to "صفحة الطلبات" (Orders Page)
2. Click "إدخال طلب جديد" (New Order)
3. Fill in customer and product information
4. Save the order

### Adding Financial Information (Owner Only)

1. Open an order from the orders list
2. Scroll to "المعلومات المالية" (Financial Information) section
3. Enter:
   - Cost in TRY
   - Exchange rate (or use latest rate button)
   - Shipping cost in LYD
   - Selling price in LYD
4. Profit will be calculated automatically
5. Add expenses if needed

### Managing Expenses

1. In the order detail page (Owner only)
2. Scroll to "المصروفات الإضافية" (Additional Expenses)
3. Enter expense title and amount
4. Click "إضافة مصروفات" (Add Expense)
5. Expenses automatically reduce profit

### Recording Payments

1. Open an order
2. Use "سجل الدفعات" to add a payment (cash, transfer, or other)
3. Owners can also record a refund or delete a ledger row
4. Total paid and deposit status are calculated from the ledger
5. Remaining balance is shown to owners only in the finance section
6. Status changes and edits appear in "سجل الطلب"

### Viewing Reports (Owner Only)

1. Navigate to "صفحة المالك" (Owner Page)
2. View summary cards:
   - Total Profit (already after per-order expenses)
   - Order Expenses
   - General Expenses
   - Net Profit (total profit minus general expenses only)
3. Use filters:
   - Date range (All, Last Week, Last Month)
   - Status (All, Delivered only)

## Technology Stack

- **Next.js 14** - React framework
- **SQLite (better-sqlite3)** - Database
- **bcryptjs** - Password hashing
- **React** - UI library

## Security Notes

- Passwords are hashed using bcrypt
- Role-based access control enforced on both frontend and backend
- Financial data is completely hidden from workers
- Session-based authentication using HTTP-only cookies

## Production Considerations

1. Change default passwords
2. Use environment variables for sensitive data
3. Consider using PostgreSQL for production
4. Implement proper session management (JWT or NextAuth)
5. Add rate limiting
6. Enable HTTPS
7. Regular database backups
8. Add input validation and sanitization

## License

Private project
