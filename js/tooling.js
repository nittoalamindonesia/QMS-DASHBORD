// QC DASHBORD/js/tooling.js

import { 
  db, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from './firebaseConfig.js';

const toolingCol = collection(db, "tooling_orders");

// ==========================================
// HELPER: Kalkulasi Sisa Hari (Countdown ETA)
// ==========================================
export function calculateDaysLeft(etaDateString) {
  if (!etaDateString) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eta = new Date(etaDateString);
  if (isNaN(eta.getTime())) return null;
  
  eta.setHours(0, 0, 0, 0);

  const diffTime = eta.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getCountdownText(etaDateString) {
  const daysLeft = calculateDaysLeft(etaDateString);

  if (daysLeft === null) return 'ETA Belum Set';
  if (daysLeft < 0) return `Terlambat ${Math.abs(daysLeft)} Hari`;
  if (daysLeft === 0) return 'Hari ini ETA!';
  return `${daysLeft} Hari Lagi`;
}

// ==========================================
// FIREBASE REALTIME LISTENER
// ==========================================
export function listenToToolingOrders(callback) {
  const q = query(toolingCol, orderBy("created_at", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const targetEta = data.eta_date || data.eta || null;

      return {
        id: docSnap.id,
        ...data,
        days_left: calculateDaysLeft(targetEta),
        countdown_text: getCountdownText(targetEta)
      };
    });

    // Urutkan berdasarkan ETA TERDEKAT agar urutan kartu selalu presisi
    orders.sort((a, b) => {
      const dateA = new Date(a.eta_date || a.eta || '2099-12-31');
      const dateB = new Date(b.eta_date || b.eta || '2099-12-31');
      return dateA - dateB;
    });

    callback(orders);
  });
}

// ==========================================
// CRUD OPERATIONS
// ==========================================
export async function addToolingOrder(data) {
  try {
    await addDoc(toolingCol, {
      ...data,
      status: "ORDERED",
      created_via: "Web",
      created_at: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function updateToolingStatus(id, newStatus) {
  try {
    const orderDoc = doc(db, "tooling_orders", id);
    await updateDoc(orderDoc, { status: newStatus, updated_at: new Date().toISOString() });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function deleteToolingOrder(id) {
  try {
    const orderDoc = doc(db, "tooling_orders", id);
    await deleteDoc(orderDoc);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}