// ── Auth utilities shared across all pages ──

const API_BASE = 'http://localhost:5000/api';

// Central fetch wrapper — attaches token, handles errors
async function api(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body)  opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + endpoint, opts);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// Redirect to login if no token found
function requireAuth() {
  if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
  }
}

// Require admin role
function requireAdmin() {
  if (!localStorage.getItem('adminMode')) {
    window.location.href = 'admin-login.html';
  }
}

// Clear session and redirect
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('adminMode');
  window.location.href = 'login.html';
}

// Show/hide loading spinner on submit button
function showLoading(show) {
  document.getElementById('spinner').style.display = show ? 'block' : 'none';
  document.getElementById('btnText').style.opacity  = show ? '0.5' : '1';
  document.getElementById('submitBtn').disabled = show;
}

// Show an alert div with a message
function showAlert(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

// Close a modal by id
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

// Get the stored user object
function getUser() {
  return JSON.parse(localStorage.getItem('user') || '{}');
}

// Basic client-side form validation for registration
function validateRegisterForm() {
  let valid = true;
  const fields = ['fullname', 'email', 'phone', 'meter', 'password', 'confirm'];

  fields.forEach(f => {
    const input = document.getElementById(f);
    const err   = document.getElementById('err-' + f);
    if (!input || !err) return;
    input.classList.remove('error');
    err.classList.remove('show');
  });

  const name = document.getElementById('fullname').value.trim();
  if (name.length < 2) {
    markError('fullname'); valid = false;
  }
  const email = document.getElementById('email').value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    markError('email'); valid = false;
  }
  const pw  = document.getElementById('password').value;
  const cpw = document.getElementById('confirm').value;
  if (pw.length < 8) {
    markError('password'); valid = false;
  }
  if (pw !== cpw) {
    markError('confirm'); valid = false;
  }

  return valid;
}

function markError(fieldId) {
  document.getElementById(fieldId)?.classList.add('error');
  document.getElementById('err-' + fieldId)?.classList.add('show');
}
