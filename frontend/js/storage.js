

const USERS_KEY = 'lib_users_v4';
const BOOKS_KEY = 'lib_books_v4';
const BORROWS_KEY = 'lib_borrows_v4';
const ORDERS_KEY = 'lib_orders_v4';

function ensureDefaults() {
  if (!localStorage.getItem(USERS_KEY)) {
    const admin = { id: 'u_admin', name: 'Admin', username: 'Read@books.com', password: 'build567', role: 'admin' };
    const student = { id: 'u_student', name: 'Demo Student', username: 'student', password: 'student421', role: 'student' };
    localStorage.setItem(USERS_KEY, JSON.stringify([admin, student]));
  }
  if (!localStorage.getItem(BOOKS_KEY)) {
    const sample = [
      { id: 'b1', title: 'Introduction to Algorithms', author: 'Cormen', isbn: '9780262033848', category: 'Computer Science', copies: 2, price: 180.00, thumb: 'IA', createdAt: Date.now() },
      { id: 'b2', title: 'Principles of Economics', author: 'Mankiw', isbn: '9780321837347', category: 'Economics', copies: 3, price: 120.50, thumb: 'PE', createdAt: Date.now() },
      { id: 'b3', title: 'African Literature', author: 'Achebe', isbn: '9780143105428', category: 'Literature', copies: 4, price: 75.00, thumb: 'AL', createdAt: Date.now() }
    ];
    localStorage.setItem(BOOKS_KEY, JSON.stringify(sample));
  }
  if (!localStorage.getItem(BORROWS_KEY)) localStorage.setItem(BORROWS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(ORDERS_KEY)) localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
}

function read(key) { return JSON.parse(localStorage.getItem(key) || 'null'); }
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function getUsers() { return read(USERS_KEY) || []; }
function saveUsers(u){ write(USERS_KEY, u); }

function getBooks(){ return read(BOOKS_KEY) || []; }
function saveBooks(b){ write(BOOKS_KEY, b); }

function getBorrows(){ return read(BORROWS_KEY) || []; }
function saveBorrows(b){ write(BORROWS_KEY, b); }

function getOrders(){ return read(ORDERS_KEY) || []; }
function saveOrders(o){ write(ORDERS_KEY, o); }

function genId(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }

ensureDefaults();
