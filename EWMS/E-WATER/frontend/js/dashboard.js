// ── Homeowner dashboard logic ──

requireAuth(); // kick out unauthenticated users

const user = getUser();

// Greet by name and time of day
(function greet() {
  const h = new Date().getHours();
  const greetings = { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' };
  const time = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  document.getElementById('pageTitle').textContent = `${greetings[time]}, ${user.name?.split(' ')[0] || 'User'} 👋`;
  document.getElementById('welcomeMsg').textContent = user.name || 'Homeowner';
})();

// Month names for labels
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Load all dashboard data on page load
async function loadDashboard() {
  try {
    const [summary, bills] = await Promise.all([
      api('/meters/summary'),
      api('/bills/my-bills'),
    ]);

    // Fill stat cards
    document.getElementById('statUsage').textContent   = summary.usageThisMonth?.toLocaleString() + ' L';
    document.getElementById('statBalance').textContent = 'RWF ' + summary.balance?.toLocaleString();
    document.getElementById('statBill').textContent    = 'RWF ' + summary.pendingBill?.toLocaleString();
    document.getElementById('statCard').textContent    = summary.cardActive ? 'Active ✓' : 'Inactive';

    renderUsageBars(summary.monthlyUsage || []);
    renderBillsTable(bills);
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

// Render monthly usage as horizontal bars
function renderUsageBars(usageData) {
  const wrap = document.getElementById('usageBars');
  const now  = new Date();
  document.getElementById('monthLabel').textContent = MONTHS[now.getMonth()] + ' ' + now.getFullYear();

  if (!usageData.length) {
    wrap.innerHTML = '<p style="color:var(--gray-400);font-size:0.9rem">No usage data yet.</p>';
    return;
  }

  const max = Math.max(...usageData.map(d => d.usage), 1);
  wrap.innerHTML = usageData.map(d => {
    const pct = Math.round((d.usage / max) * 100);
    const cls = pct > 80 ? 'danger' : pct > 60 ? 'warning' : '';
    return `
      <div class="usage-bar-wrap">
        <div class="usage-bar-label">
          <span>${MONTHS[d.month - 1]} ${d.year}</span>
          <span><strong>${d.usage.toLocaleString()} L</strong></span>
        </div>
        <div class="usage-bar">
          <div class="usage-bar-fill ${cls}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

// Render recent bills table
function renderBillsTable(bills) {
  const tbody = document.getElementById('billsTable');
  if (!bills.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:20px">No bills found</td></tr>';
    return;
  }
  tbody.innerHTML = bills.slice(0, 5).map(b => {
    const badge = b.status === 'paid'
      ? '<span class="badge badge-green">Paid</span>'
      : b.status === 'overdue'
        ? '<span class="badge badge-red">Overdue</span>'
        : '<span class="badge badge-amber">Pending</span>';

    const action = b.status !== 'paid'
      ? `<button class="btn btn-primary btn-sm" onclick="openPayModal('${b._id}', ${b.amount})">Pay</button>`
      : '—';

    return `<tr>
      <td>${b.month} ${b.year}</td>
      <td>RWF ${b.amount.toLocaleString()}</td>
      <td>${new Date(b.dueDate).toLocaleDateString()}</td>
      <td>${badge}</td>
      <td>${action}</td>
    </tr>`;
  }).join('');
}

// Open payment modal for a specific bill
function openPayModal(billId, amount) {
  document.getElementById('payAmount').value = 'RWF ' + amount.toLocaleString();
  document.getElementById('payModal').classList.add('show');
  document.getElementById('payModal').dataset.billId = billId;
}

// Submit payment via API
async function submitPayment() {
  const billId = document.getElementById('payModal').dataset.billId;
  const method = document.getElementById('payMethod').value;
  const phone  = document.getElementById('payPhone').value;

  if (!phone) return showAlert('pay-error', 'Enter your phone number');

  try {
    await api('/payments/pay', 'POST', { billId, method, phone });
    showAlert('pay-success', 'Payment submitted! You will receive an SMS confirmation.');
    setTimeout(() => { closeModal('payModal'); loadDashboard(); }, 2000);
  } catch (err) {
    showAlert('pay-error', err.message || 'Payment failed');
  }
}

loadDashboard();
