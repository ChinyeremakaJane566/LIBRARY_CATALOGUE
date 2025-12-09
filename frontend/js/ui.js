
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

if (document.body && location.pathname.endsWith('admin.html')) {

  const user = currentUser();
  if (!user || user.role !== 'admin') { alert('Please login as admin'); window.location.href = 'login.html'; }
  $('#adminGreet').innerText = user ? `Hello, ${user.name || user.username}` : '';

  $('#navBooks').addEventListener('click', ()=>{ showSection('books'); });
  $('#navBorrowHistory').addEventListener('click', ()=>{ showSection('borrowHistory'); renderBorrowHistory(); });
  $('#navOrders').addEventListener('click', ()=>{ showSection('orders'); renderOrders(); });

  $('#resetData').addEventListener('click', ()=>{ if(confirm('Reset all sample data?')){ localStorage.clear(); ensureDefaults(); location.reload(); }});

  $('#adminLogout').addEventListener('click', ()=>{ clearCurrentUser(); window.location.href='index.html'; });

  let editingId = null;
  $('#bookForm').addEventListener('submit', function(e){
    e.preventDefault();
    const title = $('#bookTitle').value.trim();
    const author = $('#bookAuthor').value.trim();
    const isbn = $('#bookISBN').value.trim();
    const category = $('#bookCategory').value.trim();
    const copies = Number($('#bookCopies').value) || 1;
    const price = Number($('#bookPrice').value) || 0;
    if (!title || !author) return alert('Please provide title and author');
    if (!editingId) {
      addBook({ id: genId('b'), title, author, isbn, category, copies, price, createdAt: Date.now() });
    } else {
      updateBook(editingId, { title, author, isbn, category, copies, price });
      editingId = null;
      $('#cancelEdit').style.display = 'none';
    }
    $('#bookForm').reset();
    renderAdminBooksList();
  });

  $('#cancelEdit').addEventListener('click', ()=>{ editingId = null; $('#bookForm').reset(); $('#cancelEdit').style.display='none'; });

  function showSection(name){
    $('#booksSection').style.display = (name === 'books') ? 'block' : 'none';
    $('#borrowHistorySection').style.display = (name === 'borrowHistory') ? 'block' : 'none';
    $('#ordersSection').style.display = (name === 'orders') ? 'block' : 'none';
  }

  function renderAdminBooksList(){
    const books = getBooks();
    const el = $('#adminBooksList');
    if (!books.length) { el.innerHTML = '<div>No books</div>'; return; }
    let html = '<table><thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Copies</th><th>Price</th><th>Actions</th></tr></thead><tbody>';
    books.forEach(b=>{
      html += `<tr><td>${b.title}</td><td>${b.author}</td><td>${b.category||'-'}</td><td>${b.copies||1}</td><td>GHS ${Number(b.price||0).toFixed(2)}</td><td>
        <button class="action-btn" data-edit="${b.id}">Edit</button>
        <button class="action-btn outline" data-del="${b.id}">Delete</button>
      </td></tr>`;
    });
    html += '</tbody></table>';
    el.innerHTML = html;

    el.querySelectorAll('[data-edit]').forEach(btn=>{
      btn.addEventListener('click', function(){ const id = this.dataset.edit; const b = getBooks().find(x=>x.id===id); if(!b) return; $('#bookTitle').value=b.title; $('#bookAuthor').value=b.author; $('#bookISBN').value=b.isbn; $('#bookCategory').value=b.category; $('#bookCopies').value=b.copies; $('#bookPrice').value=b.price; editingId = id; $('#cancelEdit').style.display='inline-block'; });
    });
    el.querySelectorAll('[data-del]').forEach(btn=>{
      btn.addEventListener('click', function(){ const id = this.dataset.del; if(!confirm('Delete book?')) return; removeBook(id); renderAdminBooksList(); });
    });
  }

  function renderBorrowHistory(){
    const list = getBorrows();
    const books = getBooks();
    const users = getUsers();
    const el = $('#borrowHistoryList');
    if (!list.length) { el.innerHTML = '<div>No borrow history</div>'; return; }
    el.innerHTML = list.slice().reverse().map(r=>{
      const b = books.find(x=>x.id===r.bookId) || {};
      const u = users.find(x=>x.id===r.userId) || {};
      return `<div class="history-item">${b.title || 'Unknown'} borrowed by ${u.name || u.username} on ${new Date(r.borrowedAt).toLocaleString()} - Due ${new Date(r.dueDate).toLocaleDateString()} - ${r.returned? 'Returned' : 'Not returned'}</div>`;
    }).join('');
  }

  function renderOrders(){
    const orders = getOrders();
    const users = getUsers();
    const el = $('#ordersList');
    if (!orders.length) { el.innerHTML = '<div>No orders yet</div>'; return; }
    el.innerHTML = orders.slice().reverse().map(o=>{
      const u = users.find(x=>x.id===o.userId) || {};
      return `<div class="history-item">Order ${o.id} by ${u.name||u.username} at ${new Date(o.createdAt).toLocaleString()} - Total GHS ${Number(o.total).toFixed(2)} - Items: ${o.items.map(i=>i.title).join(', ')}</div>`;
    }).join('');
  }

  showSection('books');
  renderAdminBooksList();
}
if (document.body && location.pathname.endsWith('student.html')) {
  const user = currentUser();
  if (!user || user.role !== 'student') { alert('Please login as a student'); window.location.href = 'login.html'; }
  $('#studentGreet').innerText = user ? `Hello, ${user.name || user.username}` : '';

  $('#logoutStudent').addEventListener('click', ()=>{ clearCurrentUser(); window.location.href = 'index.html'; });

  function renderCategoriesToFilter(){
    const cats = Array.from(new Set(getBooks().map(b=>b.category||'General')));
    const sel = $('#categoryFilter'); sel.innerHTML = '<option value="">All categories</option>' + cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  }
  $('#searchBox') && $('#searchBox').addEventListener('input', renderBooksGrid);
  $('#categoryFilter') && $('#categoryFilter').addEventListener('change', renderBooksGrid);

  $('#viewCartBtn') && $('#viewCartBtn').addEventListener('click', ()=>{ const cl = $('#cartList'); const cart = getCartForCurrentUser(); if(!cart.length) cl.innerText='Cart is empty'; else cl.innerHTML = cart.map((c,i)=>`<div>${c.title} — GHS ${Number(c.price).toFixed(2)} <button data-remove="${i}" class="action-btn outline">Remove</button></div>`).join(''); updateCartCount(); });
  $('#placeOrderBtn') && $('#placeOrderBtn').addEventListener('click', ()=>{
    const res = placeOrderForCurrentUser();
    if(!res.ok) return alert(res.msg || 'Error placing order');
    alert('Order placed! Order ID: ' + res.order.id);
    renderBooksGrid();
    updateCartCount();
  });

  $('#cartList') && $('#cartList').addEventListener('click', function(e){
    const rem = e.target.getAttribute('data-remove'); if(rem===null) return;
    const cart = getCartForCurrentUser(); cart.splice(Number(rem),1); saveCartForCurrentUser(cart); alert('Item removed'); $('#cartList').innerHTML = cart.length ? cart.map((c,i)=>`<div>${c.title} — GHS ${Number(c.price).toFixed(2)} <button data-remove="${i}" class="action-btn outline">Remove</button></div>`).join('') : 'Cart is empty'; updateCartCount();
  });


  function renderBooksGrid(){
    const q = ($('#searchBox') && $('#searchBox').value.toLowerCase()) || '';
    const cat = ($('#categoryFilter') && $('#categoryFilter').value) || '';
    const books = getBooks().filter(b=>{
      if(q && !(b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q))) return false;
      if(cat && b.category !== cat) return false;
      return true;
    });
    $('#booksGrid').innerHTML = books.map(b=>{
      
      const active = getBorrows().filter(r=>r.bookId===b.id && !r.returned).length;
      const available = active < (b.copies || 1);
      return `<div class="book">
         <div class="thumb">${(b.thumb||b.title.slice(0,2)).toUpperCase()}</div>
         <h4>${b.title}</h4>
         <div>${b.author}</div>
         <div style="font-weight:700;margin-top:6px">GHS ${Number(b.price||0).toFixed(2)}</div>
         <div style="margin-top:8px"><span class="pill ${available? 'available':'borrowed'}">${available? 'Available' : 'All Borrowed'}</span></div>
         <div style="margin-top:8px">${available? `<button class="action-btn" data-borrow="${b.id}">Borrow</button>` : ''} <button class="action-btn outline" data-order="${b.id}">Order</button></div>
      </div>`;
    }).join('');
    
    $('#booksGrid').querySelectorAll('[data-borrow]').forEach(btn=> btn.addEventListener('click', function(){ const id=this.dataset.borrow; const r = borrowBookById(id); if(!r.ok) return alert(r.msg); alert('Book borrowed — due in 14 days'); renderBooksGrid(); renderBorrowedList(); }));
    $('#booksGrid').querySelectorAll('[data-order]').forEach(btn=> btn.addEventListener('click', function(){ const id=this.dataset.order; const r = addToCart(id); if(!r.ok) return alert('Error adding to cart'); alert('Added to cart'); updateCartCount(); }));
  }

  function renderBorrowedList(){
    const borrows = getBorrows().filter(r=> r.userId === currentUser().id);
    $('#borrowList').innerHTML = borrows.length ? borrows.map((r,i)=>{
      const book = getBooks().find(b=>b.id===r.bookId) || {};
      return `<div>${book.title} — Due: ${new Date(r.dueDate).toLocaleDateString()} ${r.returned? ' (Returned)':' <button class="action-btn outline" data-return="'+r.id+'">Return</button>'}</div>`;
    }).join('') : 'You have no borrowed books';
    
    $('#borrowList').querySelectorAll('[data-return]').forEach(btn=> btn.addEventListener('click', function(){ const id=this.dataset.return; const s = returnBorrow(id); if(!s.ok) return alert(s.msg); alert('Returned successfully'); renderBooksGrid(); renderBorrowedList(); }));
  }

  function updateCartCount(){ $('#cartCount').innerText = getCartForCurrentUser().length; }

  renderCategoriesToFilter();
  renderBooksGrid();
  renderBorrowedList();
  updateCartCount();
}
