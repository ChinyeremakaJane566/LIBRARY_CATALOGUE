
function currentUser() {
  try {
    return JSON.parse(localStorage.getItem('lib_current_user') || 'null');
  } catch { return null; }
}
function setCurrentUser(u){ localStorage.setItem('lib_current_user', JSON.stringify(u)); }
function clearCurrentUser(){ localStorage.removeItem('lib_current_user'); }


if (document.getElementById('regForm')) {
  document.getElementById('regForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    if (!name || !username || !password) return alert('Please fill all fields');
    const users = getUsers();
    if (users.find(u => u.username === username)) return alert('Username taken');
    const newUser = { id: genId('u'), name, username, password, role: 'student' };
    users.push(newUser);
    saveUsers(users);
    alert('Registered! You can now log in.');
    window.location.href = 'login.html';
  });
}

if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!username || !password) return alert('Please enter credentials');
    const users = getUsers();
    const user = users.find(u => (u.username === username || u.username.toLowerCase() === username.toLowerCase()) && u.password === password);
    if (!user) return alert('Invalid credentials (try testuser@example.com/password123 or student/student421)');
    setCurrentUser(user);
    // redirect
    if (user.role === 'admin') window.location.href = 'admin.html';
    else window.location.href = 'student.html';
  });
}
