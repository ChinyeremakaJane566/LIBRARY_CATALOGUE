# Database Setup Instructions

## Creating Tables in pgAdmin

Follow these steps to create the required tables in your PostgreSQL database:

### Step 1: Open pgAdmin
1. Launch pgAdmin
2. Connect to your PostgreSQL server
3. Navigate to your database (e.g., `library_catalogue`)

### Step 2: Open Query Tool
1. Right-click on your database
2. Select **Query Tool** from the context menu

### Step 3: Run the SQL Script
1. Open the `schema.sql` file in the Query Tool
2. Click the **Execute** button (or press F5) to run the script
3. You should see a success message for each table creation

### Step 4: Verify Tables
1. In pgAdmin, expand your database
2. Expand **Schemas** → **public** → **Tables**
3. You should see three tables:
   - `users`
   - `books`
   - `borrow_records`

## Tables Created

### users
- Stores user information (students and admins)
- Fields: id, full_name, email, password, role, created_at

### books
- Stores book information
- Fields: id, title, author, category, description, total_copies, available_copies, created_at

### borrow_records
- Stores borrowing history
- Fields: id, user_id, book_id, borrow_date, return_date, status
- References: users(id) and books(id)

## Notes
- The script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times
- Indexes are created for better query performance
- Foreign key constraints ensure data integrity

