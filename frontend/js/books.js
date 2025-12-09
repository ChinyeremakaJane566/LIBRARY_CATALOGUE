
function addBook(book) {
  const books = getBooks();
  books.unshift(book);
  saveBooks(books);
}
function updateBook(id, update) {
  const books = getBooks();
  const idx = books.findIndex(b => b.id === id);
  if (idx === -1) return false;
  books[idx] = { ...books[idx], ...update };
  saveBooks(books);
  return true;
}
function removeBook(id) {
  let books = getBooks();
  books = books.filter(b => b.id !== id);
  saveBooks(books);
}

function borrowBookById(bookId) {
  const user = currentUser();
  if (!user || user.role !== 'student') return { ok: false, msg: 'Please login as a student' };
  const books = getBooks();
  const book = books.find(b => b.id === bookId);
  if (!book) return { ok: false, msg: 'Book not found' };
  const borrows = getBorrows();
  const active = borrows.filter(r => r.bookId === bookId && !r.returned).length;
  if (active >= (book.copies || 1)) return { ok: false, msg: 'No copies available' };

  const due = new Date(); due.setDate(due.getDate() + 14);
  const rec = { id: genId('br'), bookId, userId: user.id, borrowedAt: new Date().toISOString(), dueDate: due.toISOString(), returned: false };
  borrows.push(rec);
  saveBorrows(borrows);

  const hist = loadHistory(); hist.push({ action: 'borrow', details: { bookId, bookTitle: book.title, user: user.username }, date: new Date().toLocaleString() }); localStorage.setItem('lib_history_v4', JSON.stringify(hist));

  return { ok: true, rec };
}

function returnBorrow(borrowId) {
  const borrows = getBorrows();
  const rec = borrows.find(r => r.id === borrowId);
  if (!rec) return { ok: false, msg: 'Borrow record not found' };
  if (rec.returned) return { ok: false, msg: 'Already returned' };
  rec.returned = true; rec.returnedAt = new Date().toISOString();
  saveBorrows(borrows);

  const hist = loadHistory(); hist.push({ action: 'return', details: rec, date: new Date().toLocaleString() }); localStorage.setItem('lib_history_v4', JSON.stringify(hist));
  return { ok: true };
}

function getCartForCurrentUser() {
  const user = currentUser(); const k = 'cart_' + (user ? user.id : 'guest'); return JSON.parse(localStorage.getItem(k) || '[]');
}
function saveCartForCurrentUser(arr) {
  const user = currentUser(); const k = 'cart_' + (user ? user.id : 'guest'); localStorage.setItem(k, JSON.stringify(arr));
}
function addToCart(bookId) {
  const books = getBooks(); const book = books.find(b => b.id === bookId); if (!book) return { ok: false };
  const cart = getCartForCurrentUser(); cart.push({ bookId: book.id, title: book.title, price: Number(book.price || 0) }); saveCartForCurrentUser(cart); return { ok: true };
}
function placeOrderForCurrentUser() {
  const user = currentUser(); if (!user) return { ok: false, msg: 'not logged in' };
  const cart = getCartForCurrentUser(); if (!cart.length) return { ok: false, msg: 'cart empty' };
  const orders = getOrders(); const total = cart.reduce((s, i) => s + Number(i.price || 0), 0);
  const order = { id: genId('o'), userId: user.id, items: cart, total, createdAt: new Date().toISOString(), status: 'Placed' };
  orders.push(order); saveOrders(orders);
  saveCartForCurrentUser([]); 

  const hist = loadHistory(); hist.push({ action: 'order', details: { orderId: order.id, user: user.username }, date: new Date().toLocaleString() }); localStorage.setItem('lib_history_v4', JSON.stringify(hist));
  return { ok: true, order };
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('lib_history_v4') || '[]'); } catch { return []; }
}
