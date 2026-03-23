// ================= IMPORT =================
import { auth, db } from "./firebase.js";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";


// ================= ELEMENTS =================
const ordersListEl = document.getElementById("orders-list");
const logoutBtn = document.getElementById("logout-btn");
const searchInput = document.getElementById("search-orders");

const totalOrdersEl = document.getElementById("total-orders");
const totalRevenueEl = document.getElementById("total-revenue");
const pendingOrdersEl = document.getElementById("pending-orders");
const approvedOrdersEl = document.getElementById("verified-orders");
const todayOrdersEl = document.getElementById("today-orders");

const rejectModal = document.getElementById("rejectModal");
const rejectReasonInput = document.getElementById("rejectReasonInput");
const cancelRejectBtn = document.getElementById("cancelRejectBtn");
const confirmRejectBtn = document.getElementById("confirmRejectBtn");

let CURRENT_REJECT_ORDER_ID = null;

// ================= GLOBAL STATE =================
let CURRENT_ADMIN_UID = null;
let ALL_ORDERS = [];
let LAST_ORDER_COUNT = 0;
let unsubscribeListener = null;


// ================= LOGOUT =================
logoutBtn?.addEventListener("click", async () => {
  if (unsubscribeListener) unsubscribeListener();
  await signOut(auth);
  window.location.href = "/login.html";
});


// ================= ADMIN CHECK =================
async function isAdmin(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() && snap.data().role === "admin";
}


// ================= FORMAT DATE =================
function formatDate(timestamp) {
  if (!timestamp?.toDate) return "N/A";
  return timestamp.toDate().toLocaleString();
}


// ================= STATUS BADGE =================
function getStatusBadge(order) {
  if (order.paymentType === "cod") {
    return `<span class="badge cod">COD</span>`;
  }

  switch (order.paymentStatus) {
    case "approved":
      return `<span class="badge verified">Approved</span>`;
    case "rejected":
      return `<span class="badge rejected">Rejected</span>`;
    case "pending_verification":
      return `<span class="badge pending">Pending</span>`;
    default:
      return `<span class="badge pending">Unpaid</span>`;
  }
}


// ================= STATS =================
function calculateStats(orderWrappers) {
  let totalRevenue = 0;
  let pending = 0;
  let approved = 0;
  let todayOrders = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  orderWrappers.forEach(({ order }) => {
    const total = order.totalAmount || 0;
    totalRevenue += total;

    if (order.paymentStatus === "pending_verification") pending++;
    if (order.paymentStatus === "approved") approved++;

    if (order.createdAt?.toDate) {
      const date = order.createdAt.toDate();
      if (date >= today) todayOrders++;
    }
  });

  totalOrdersEl.textContent = orderWrappers.length;
  totalRevenueEl.textContent = `₹${totalRevenue}`;
  pendingOrdersEl.textContent = pending;
  approvedOrdersEl.textContent = approved;
  todayOrdersEl.textContent = todayOrders;
}


// ================= APPROVE ORDER =================
async function approveOrder(orderId) {
  const orderRef = doc(db, "orders", orderId);
  const snap = await getDoc(orderRef);
  if (!snap.exists()) return;

  const data = snap.data();

  // Update order status for all non-COD orders
  await updateDoc(orderRef, {
    paymentStatus: "approved",
    verificationStatus: "approved",
    orderStatus: "processing",
    paymentVerifiedBy: CURRENT_ADMIN_UID,
    paymentVerifiedAt: serverTimestamp()
  });

 
}

// ================= REJECT ORDER =================
async function rejectOrder(orderId) {

  const reason = prompt("Enter rejection reason:");
  if (!reason) return; // stop if admin cancels

  const orderRef = doc(db, "orders", orderId);

  await updateDoc(orderRef, {
    paymentStatus: "rejected",
    verificationStatus: "rejected",
    rejectionReason: reason,          // ✅ store reason
    orderStatus: "payment_failed",
    paymentVerifiedBy: CURRENT_ADMIN_UID,
    paymentVerifiedAt: serverTimestamp()
  });
}


// ================= APPROVE PARTIAL PAYMENT =================
async function approvePartialOrder(orderId) {

  const orderRef = doc(db, "orders", orderId);
  const snap = await getDoc(orderRef);

  if (!snap.exists()) return;

  const data = snap.data();

  await updateDoc(orderRef, {
    paymentStatus: "approved",
    verificationStatus: "approved",
    orderStatus: "processing",
    paymentVerifiedBy: CURRENT_ADMIN_UID,
    paymentVerifiedAt: serverTimestamp()
  });

  // 🔥 Increase user's advance paid total
  if (data.userId && data.paidAmount) {

    const userRef = doc(db, "users", data.userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {

      const currentAdvance =
        userSnap.data().advancePaidTotal || 0;

      await updateDoc(userRef, {
        advancePaidTotal: currentAdvance + data.paidAmount
      });

    }

  }

}
////// ================= RENDER ORDERS =================
function renderOrders(ordersArray) {
  if (!ordersListEl) return;

  ordersListEl.innerHTML = "";

  if (!ordersArray.length) {
    ordersListEl.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;">No orders found</td>
      </tr>
    `;
    calculateStats([]);
    return;
  }

ordersArray.forEach(orderWrapper => {
    const { order, orderId, isDuplicateUpi } = orderWrapper; // ← include isDuplicateUpi

    const tr = document.createElement("tr");

    // Highlight duplicate UPI rows
    if (isDuplicateUpi) {
        tr.classList.add("duplicate-upi"); // this class will style the row
    }

    const total = order.totalAmount || 0;
    const paid = order.paidAmount || 0;
    const upi = order.upiReferenceId || "-";

    tr.innerHTML = `
      <td>${orderId}</td>
      <td>${order.email || "N/A"}</td>
      <td>${order.paymentType || "N/A"}</td>
      <td>₹${total}</td>
      <td>₹${paid}</td>
      <td>
        ${upi}
        ${upi !== "-" ? `<button class="copy-btn" data-upi="${upi}">Copy</button>` : ""}
      </td>
      <td>${getStatusBadge(order)}</td>
      <td class="action-cell"></td>
    `;

    const actionCell = tr.querySelector(".action-cell");

    // ===== BUTTON LOGIC =====
 // ===== BUTTON LOGIC =====
if (order.paymentType === "partial") {

  const approveBtn = document.createElement("button");
  approveBtn.textContent = "Approve";
  approveBtn.className = "approve-btn";
  approveBtn.onclick = () => approvePartialOrder(orderId);

  const rejectBtn = document.createElement("button");
  rejectBtn.textContent = "Reject";
  rejectBtn.className = "reject-btn";
  rejectBtn.onclick = () => openRejectModal(orderId);

  actionCell.appendChild(approveBtn);
  actionCell.appendChild(rejectBtn);

}

    ordersListEl.appendChild(tr);
  });

  calculateStats(ordersArray);

  // ===== COPY UPI BUTTON =====
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(btn.dataset.upi);
      btn.textContent = "Copied!";
      setTimeout(() => btn.textContent = "Copy", 1500);
    });
  });
}

// ================= REJECT MODAL =================
function openRejectModal(orderId) {
  CURRENT_REJECT_ORDER_ID = orderId;
  rejectReasonInput.value = "";
  rejectModal.classList.remove("hidden");
}

cancelRejectBtn?.addEventListener("click", () => {
  rejectModal.classList.add("hidden");
  CURRENT_REJECT_ORDER_ID = null;
});

confirmRejectBtn?.addEventListener("click", async () => {
  const reason = rejectReasonInput.value.trim();

  if (!reason) {
    alert("Please enter a rejection reason.");
    return;
  }

  const orderRef = doc(db, "orders", CURRENT_REJECT_ORDER_ID);

  await updateDoc(orderRef, {
    paymentStatus: "rejected",
    verificationStatus: "rejected",
    rejectionReason: reason,
    orderStatus: "payment_failed",
    paymentVerifiedBy: CURRENT_ADMIN_UID,
    paymentVerifiedAt: serverTimestamp()
  });

  rejectModal.classList.add("hidden");
  CURRENT_REJECT_ORDER_ID = null;
});
// ================= SEARCH =================
searchInput?.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();

  const filtered = ALL_ORDERS.filter(({ order, orderId }) =>
    orderId.toLowerCase().includes(term) ||
    (order.email || "").toLowerCase().includes(term)
  );

  renderOrders(filtered);
});


// ================= REALTIME =================
function startRealtimeListener(adminUid) {

  CURRENT_ADMIN_UID = adminUid;

  if (unsubscribeListener) unsubscribeListener();

  const q = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
  );

  unsubscribeListener = onSnapshot(q, (snapshot) => {

    const newOrders = [];

    snapshot.forEach(docSnap => {
      newOrders.push({
        orderId: docSnap.id,
        order: docSnap.data()
      });
    });

    if (LAST_ORDER_COUNT !== 0 &&
        newOrders.length > LAST_ORDER_COUNT) {
      new Audio("/notification.mp3")
        .play()
        .catch(()=>{});
    }

    LAST_ORDER_COUNT = newOrders.length;
    // ===== DUPLICATE UPI DETECTION =====
const upiMap = {};

// Build a map of UPI -> array of orderIds
newOrders.forEach(o => {
  const upi = o.order.upiReferenceId;
  if (!upi) return;

  if (!upiMap[upi]) upiMap[upi] = [];
  upiMap[upi].push(o.orderId);
});

// Mark orders that have duplicate UPI
newOrders.forEach(o => {
  const upi = o.order.upiReferenceId;
  o.isDuplicateUpi = upi && upiMap[upi].length > 1;
});

ALL_ORDERS = newOrders;

renderOrders(ALL_ORDERS);
  });
}


// ================= INIT =================
function initAdmin() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/login.html";
      return;
    }

    const allowed = await isAdmin(user.uid);

    if (!allowed) {
      await signOut(auth);
      window.location.href = "/login.html";
      return;
    }

    startRealtimeListener(user.uid);
  });
}

initAdmin();

const navItems = document.querySelectorAll(".nav-item");

navItems.forEach(btn => {
  btn.addEventListener("click", () => {

    navItems.forEach(n => n.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;

    let filtered = ALL_ORDERS;

    if (tab === "pending") {
      filtered = ALL_ORDERS.filter(o =>
        o.order.paymentStatus === "pending_verification"
      );
    }

    if (tab === "approved") {
      filtered = ALL_ORDERS.filter(o =>
        o.order.paymentStatus === "approved"
      );
    }

    if (tab === "rejected") {
      filtered = ALL_ORDERS.filter(o =>
        o.order.paymentStatus === "rejected"
      );
    }

    if (tab === "cod") {
      filtered = ALL_ORDERS.filter(o =>
        o.order.paymentType === "cod"
      );
    }

    renderOrders(filtered);
  });
});







