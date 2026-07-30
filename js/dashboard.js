// QC DASHBORD/js/dashboard.js

import { listenToToolingOrders, deleteToolingOrder } from './tooling.js';

// Inisialisasi Dashboard Grid
export function initDashboardGrid() {
  const container = document.getElementById('tooling-grid-container');
  if (!container) {
    console.error("Elemen 'tooling-grid-container' tidak ditemukan di HTML!");
    return;
  }

  // Realtime listener
  listenToToolingOrders((orders) => {
    renderCards(orders, container);
  });
}

// Fungsi Render Kartu ke HTML
function renderCards(orders, container) {
  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>ℹ️ Belum ada order Tooling atau Wire yang aktif saat ini.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = ''; // Kosongkan container sebelum render ulang

  orders.forEach((item) => {
    // 1. Tentukan Indikator Warna berdasarkan Sisa Hari (Countdown)
    const daysLeft = item.days_left;
    let statusClass = 'status-safe';     // Default Hijau (> 7 Hari)

    if (daysLeft !== null && daysLeft <= 3) {
      statusClass = 'status-danger';     // Merah Urgent (<= 3 Hari atau Terlambat)
    } else if (daysLeft !== null && daysLeft <= 7) {
      statusClass = 'status-warning';    // Kuning Warning (4 - 7 Hari)
    }

    // 2. Format Teks ETA & PO Date
    const poDate = item.order_date || '-';
    const etaDate = item.eta_date || item.eta || '-';

    // 3. Buat Elemen Kartu
    const cardHTML = `
      <div class="tooling-card ${statusClass}" data-id="${item.id}">
        <div class="card-header">
          <h3 class="card-title">🔧 ${item.item_name}</h3>
          <span class="card-type-badge">${item.item_type || 'Tooling'}</span>
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="label">📦 Qty:</span>
            <span class="value"><b>${item.qty || 1}</b> pcs</span>
          </div>
          <div class="info-row">
            <span class="label">📅 PO Date:</span>
            <span class="value">${poDate}</span>
          </div>
          <div class="info-row">
            <span class="label">🎯 ETA Date:</span>
            <span class="value">${etaDate}</span>
          </div>
        </div>

        <div class="card-footer">
          <div class="countdown-pill">
            ⏰ ${item.countdown_text}
          </div>
          <button class="btn-delete-card" onclick="handleDeleteOrder('${item.id}', '${item.item_name}')" title="Hapus Order">
            🗑️
          </button>
        </div>
      </div>
    `;

    container.innerHTML += cardHTML;
  });
}

// Global Event Handler untuk Hapus via Web UI
window.handleDeleteOrder = async (id, itemName) => {
  if (confirm(`Apakah Anda yakin ingin menghapus order "${itemName}"?`)) {
    const res = await deleteToolingOrder(id);
    if (!res.success) {
      alert("❌ Gagal menghapus order!");
    }
  }
};

// Auto Start jika DOM sudah siap
document.addEventListener('DOMContentLoaded', () => {
  initDashboardGrid();
});