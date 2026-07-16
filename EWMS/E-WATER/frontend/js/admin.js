// ── Admin dashboard logic ──

requireAdmin();

const adminUser = getUser();
document.getElementById('welcomeMsg').textContent = adminUser.name || 'Admin';

let allUsers = [];

// ── Section switcher ──
function showSection(name) {
  ['overview','users','bills','meters'].forEach(s => {
    document.getElementById('section-' + s).style.display = s === name ? 'block' : 'none';
  });
  // Load data for the section we're switching to
  if (name === 'users')   loadUsers();
  if (name === 'bills')   loadBills();
  if (name === 'meters')  loadMeters();
}

function openModal(id) {
  document.getElementById(id).classList.add('show');
  // Populate client dropdowns whenever a modal opens
  populateClientDropdowns();
}

// ── Load overview stats ──
async function loadAdminDashboard() {
  try {
    const stats = await api('/admin/stats');
    document.getElementById('statUsers').textContent  = stats.totalUsers;
    document.getElementById('statMeters').textContent = stats.activeMeters;
    document.getElementById('statUnpaid').textContent = stats.unpaidBills;
    document.getElementById('statDisc').textContent   = stats.disconnected;
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// ── Load clients table ──
async function loadUsers() {
  try {
    allUsers = await api('/admin/users');
    renderUsersTable(allUsers);
  } catch (err) {
    console.error(err);
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTable');
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--gray-400)">No clients yet. Add one!</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(u => {
    const badge  = u.isActive
      ? '<span class="badge badge-green">Active</span>'
      : '<span class="badge badge-red">Suspended</span>';
    const action = u.isActive
      ? `<button class="btn btn-danger btn-sm" onclick="toggleUser('${u._id}',false)">Disconnect</button>`
      : `<button class="btn btn-outline btn-sm" onclick="toggleUser('${u._id}',true)">Reconnect</button>`;
    return `<tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.phone}</td>
      <td><code style="font-size:0.8rem;background:var(--gray-100);padding:2px 6px;border-radius:4px">${u.meterId}</code></td>
      <td>${badge}</td>
      <td>${action}</td>
    </tr>`;
  }).join('');
}

function filterUsers(q) {
  const query = q.toLowerCase();
  renderUsersTable(allUsers.filter(u =>
    u.name.toLowerCase().includes(query) ||
    u.email.toLowerCase().includes(query) ||
    u.meterId.toLowerCase().includes(query)
  ));
}

// ── Load bills table ──
async function loadBills() {
  try {
    const bills = await api('/admin/bills');
    const tbody = document.getElementById('billsTable');
    if (!bills.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--gray-400)">No bills yet.</td></tr>';
      return;
    }
    tbody.innerHTML = bills.map(b => {
      const badge = b.status === 'paid'
        ? '<span class="badge badge-green">Paid</span>'
        : b.status === 'overdue'
          ? '<span class="badge badge-red">Overdue</span>'
          : '<span class="badge badge-amber">Pending</span>';

      const markPaid = b.status !== 'paid'
        ? `<button class="btn btn-outline btn-sm" onclick="markBillPaid('${b._id}')">Mark paid</button>`
        : '—';

      return `<tr>
        <td>${b.userId?.name || 'Unknown'}</td>
        <td>${b.month} ${b.year}</td>
        <td>RWF ${b.amount.toLocaleString()}</td>
        <td>${new Date(b.dueDate).toLocaleDateString()}</td>
        <td>${badge}</td>
        <td>${markPaid}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    console.error(err);
  }
}

// ── Load meters table ──
async function loadMeters() {
  try {
    const meters = await api('/admin/meters');
    const tbody  = document.getElementById('metersTable');
    if (!meters.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--gray-400)">No meters yet.</td></tr>';
      return;
    }
    tbody.innerHTML = meters.map(m => {
      const lastUsage = m.monthlyUsage?.at(-1)?.usage ?? '—';
      const badge = m.isActive
        ? '<span class="badge badge-green">Active</span>'
        : '<span class="badge badge-red">Inactive</span>';
      return `<tr>
        <td><code style="font-size:0.8rem;background:var(--gray-100);padding:2px 6px;border-radius:4px">${m.meterId}</code></td>
        <td>${m.userId?.name || '—'}</td>
        <td>RWF ${m.balance?.toLocaleString() ?? 0}</td>
        <td>${lastUsage} L</td>
        <td>${badge}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    console.error(err);
  }
}

// ── Populate client dropdowns in modals ──
async function populateClientDropdowns() {
  try {
    const users = await api('/admin/users');
    const opts  = users.map(u => `<option value="${u._id}" data-meter="${u.meterId}">${u.name} — ${u.meterId}</option>`).join('');
    document.getElementById('b-user').innerHTML = '<option value="">— Choose client —</option>' + opts;
    document.getElementById('m-user').innerHTML = '<option value="">— Choose client —</option>' + opts;
  } catch (err) { console.error(err); }
}

// ── ADD CLIENT ──
async function addClient() {
  const name     = document.getElementById('c-name').value.trim();
  const email    = document.getElementById('c-email').value.trim();
  const phone    = document.getElementById('c-phone').value.trim();
  const meterId  = document.getElementById('c-meter').value.trim();
  const password = document.getElementById('c-password').value;
  const balance  = parseFloat(document.getElementById('c-balance').value) || 0;

  if (!name || !email || !meterId || !password) {
    return showAlert('client-error', 'Please fill in all required fields');
  }

  try {
    await api('/admin/add-client', 'POST', { name, email, phone, meterId, password, balance });
    showAlert('client-success', `Client "${name}" added successfully!`);
    // Clear form
    ['c-name','c-email','c-phone','c-meter','c-password','c-balance'].forEach(id => {
      document.getElementById(id).value = '';
    });
    loadAdminDashboard();
    loadUsers();
  } catch (err) {
    showAlert('client-error', err.message || 'Failed to add client');
  }
}

// ── CREATE BILL ──
async function createBill() {
  const userId  = document.getElementById('b-user').value;
  const month   = document.getElementById('b-month').value;
  const year    = parseInt(document.getElementById('b-year').value);
  const amount  = parseFloat(document.getElementById('b-amount').value);
  const dueDate = document.getElementById('b-due').value;

  if (!userId || !amount || !dueDate) {
    return showAlert('bill-error', 'Please fill in all fields');
  }

  // Get meterId from selected option
  const sel    = document.getElementById('b-user');
  const meterId = sel.options[sel.selectedIndex].dataset.meter;

  try {
    await api('/admin/create-bill', 'POST', { userId, meterId, month, year, amount, dueDate });
    showAlert('bill-success', 'Bill created successfully!');
    document.getElementById('b-amount').value = '';
    document.getElementById('b-due').value    = '';
    loadBills();
  } catch (err) {
    showAlert('bill-error', err.message || 'Failed to create bill');
  }
}

// ── ADD METER READING ──
async function addMeterReading() {
  const userId  = document.getElementById('m-user').value;
  const month   = parseInt(document.getElementById('m-month').value);
  const year    = parseInt(document.getElementById('m-year').value);
  const usage   = parseFloat(document.getElementById('m-usage').value);
  const balance = parseFloat(document.getElementById('m-balance').value);

  if (!userId || !month || !usage) {
    return showAlert('meter-error', 'Please fill in all fields');
  }

  // Get meterId from selected option
  const sel     = document.getElementById('m-user');
  const meterId = sel.options[sel.selectedIndex].dataset.meter;

  try {
    await api('/admin/add-reading', 'POST', { userId, meterId, month, year, usage, balance });
    showAlert('meter-success', 'Meter reading saved!');
    loadMeters();
  } catch (err) {
    showAlert('meter-error', err.message || 'Failed to save reading');
  }
}

// ── MARK BILL PAID ──
async function markBillPaid(billId) {
  if (!confirm('Mark this bill as paid?')) return;
  try {
    await api(`/admin/bills/${billId}/mark-paid`, 'PATCH');
    loadBills();
    loadAdminDashboard();
  } catch (err) {
    alert('Failed: ' + err.message);
  }
}

// ── TOGGLE USER (disconnect/reconnect) ──
async function toggleUser(userId, activate) {
  if (!confirm(`Are you sure you want to ${activate ? 'reconnect' : 'disconnect'} this account?`)) return;
  try {
    await api(`/admin/users/${userId}/toggle`, 'PATCH', { isActive: activate });
    loadUsers();
    loadAdminDashboard();
  } catch (err) {
    alert('Failed: ' + err.message);
  }
}

// Start
loadAdminDashboard();
