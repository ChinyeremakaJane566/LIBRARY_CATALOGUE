
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());


const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/library_catalogue";
const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});


app.get("/", (req, res) => res.send("Library Catalogue API Running"));


app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const exists = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (exists.rows.length > 0)
      return res.status(409).json({ error: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (full_name,email,password,role) VALUES ($1,$2,$3,$4) RETURNING id,full_name,email,role",
      [name, email, hash, "student"]
    );

    res.status(201).json({
      message: "Registration successful",
      user: result.rows[0],
    });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (!result.rows.length)
      return res.status(404).json({ error: "User not found" });

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: "Incorrect password" });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role || "student"
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/books", async (req, res) => {
  try {
    const { title, author, category, copies = 1, isbn, description } = req.body;

    if (!title || !author || !category)
      return res.status(400).json({ error: "Title, author & category required" });

    const result = await pool.query(
      `INSERT INTO books (title,author,category,copies,isbn,description)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, author, category, copies, isbn, description]
    );

    res.status(201).json({ message: "Book added", book: result.rows[0] });

  } catch (err) {
    console.error("Add Book Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.get("/api/books", async (req, res) => {
  try {
    const books = await pool.query("SELECT * FROM books ORDER BY title");
    res.json({ books: books.rows });
  } catch (err) {
    console.error("Get Books Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.post("/api/borrow", async (req, res) => {
  const client = await pool.connect();
  try {
    const { user_id, book_id } = req.body;
    if (!user_id || !book_id) return res.status(400).json({ message: "user_id and book_id are required" });

  
    const userQ = await client.query("SELECT id FROM users WHERE id = $1", [user_id]);
    if (userQ.rows.length === 0) return res.status(404).json({ message: "User not found" });

   
    const bookQ = await client.query("SELECT id, copies FROM books WHERE id = $1", [book_id]);
    if (bookQ.rows.length === 0) return res.status(404).json({ message: "Book not found" });
    const copies = bookQ.rows[0].copies;
    if (copies <= 0) return res.status(400).json({ message: "No copies available" });

  
    const alreadyQ = await client.query(
      "SELECT id FROM borrowed_books WHERE user_id=$1 AND book_id=$2",
      [user_id, book_id]
    );
    if (alreadyQ.rows.length > 0) return res.status(409).json({ message: "You already borrowed this book" });

  
    await client.query("BEGIN");
    const insertQ = await client.query(
      "INSERT INTO borrowed_books (user_id, book_id) VALUES ($1, $2) RETURNING id, borrow_date",
      [user_id, book_id]
    );
    await client.query("UPDATE books SET copies = copies - 1 WHERE id = $1", [book_id]);
    await client.query("COMMIT");

    res.status(201).json({ message: "Book borrowed", borrow_id: insertQ.rows[0].id });

  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    console.error("Borrow Error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});


app.get("/api/borrowed/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const q = `
      SELECT bb.id AS borrow_id, bb.borrow_date, b.id AS book_id, b.title, b.author
      FROM borrowed_books bb
      JOIN books b ON b.id = bb.book_id
      WHERE bb.user_id = $1
      ORDER BY bb.borrow_date DESC
    `;
    const result = await pool.query(q, [userId]);
    res.json({ borrowedBooks: result.rows });
  } catch (err) {
    console.error("Get Borrowed Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.post("/api/return", async (req, res) => {
  const client = await pool.connect();
  try {
    const { borrow_id } = req.body;
    if (!borrow_id) return res.status(400).json({ error: "borrow_id is required" });

    await client.query("BEGIN");
    const found = await client.query("SELECT * FROM borrowed_books WHERE id=$1 FOR UPDATE", [borrow_id]);
    if (!found.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Record not found" });
    }

    const book_id = found.rows[0].book_id;
    await client.query("DELETE FROM borrowed_books WHERE id=$1", [borrow_id]);
    await client.query("UPDATE books SET copies = copies + 1 WHERE id = $1", [book_id]);

    await client.query("COMMIT");
    res.json({ message: "Book returned" });

  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    console.error("Return Error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

pool.connect()
  .then(c => { console.log(" Database connected"); c.release(); })
  .catch(e => console.error(" DB failed:", e));

app.listen(4000, () => console.log(" Server running on port 4000"));
