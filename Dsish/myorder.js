// ================= FIREBASE =================
import { auth, db } from "./firebase.js";

import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";


// ================= DOM =================
const pageWrapper = document.getElementById("pageWrapper");
const closeBtn = document.getElementById("closePageBtn");
const emptyCard = document.querySelector(".empty-order-card");
const ordersList = document.getElementById("ordersList");
const template = document.getElementById("orderCardTemplate");


// ================= PREVENT BACK =================
history.pushState(null, null, location.href);
window.addEventListener("popstate", () => {
  window.location.replace("index.html");
});


// ================= HELPERS =================
function formatDate(ts) {
  if (!ts?.toDate) return "Unknown";
  return ts.toDate().toLocaleDateString();
}

// 🔥 DELIVERY DATE (5 days default)
function getDeliveryDate(ts) {
  if (!ts?.toDate) return "Calculating...";

  const d = new Date(ts.toDate());
  d.setDate(d.getDate() + 5);

  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short"
  });
}


// ================= PAYMENT INFO =================
function getPaymentInfo(order) {

  const type = order.paymentType || "unknown";
  const status = order.paymentStatus || "pending";

  let typeText = "";
  let statusText = "";
  let badgeClass = "";

  if (type === "prepaid") {
    typeText = "Prepaid ";

    if (status === "paid") {
      statusText = "Paid";
      badgeClass = "status-paid";
    } else {
      statusText = "Pending";
      badgeClass = "status-pending";
    }
  }

  if (type === "cod") {
    typeText = "Cash on Delivery ";
    statusText = "Pay on Delivery";
    badgeClass = "status-pending";
  }

  return { typeText, statusText, badgeClass };
}


// ================= RENDER =================
function renderOrders(snapshot) {

  ordersList.innerHTML = "";
  let hasOrders = false;

  snapshot.forEach(docSnap => {

    const order = docSnap.data();
    const date = formatDate(order.createdAt);
    const deliveryDate = getDeliveryDate(order.createdAt);

    const { typeText, statusText, badgeClass } = getPaymentInfo(order);

    hasOrders = true;

    // ===== CLONE TEMPLATE =====
    const card = template.content.cloneNode(true);

    // ===== TOP =====
    card.querySelector(".order-date").textContent = `Ordered on ${date}`;

    const badge = card.querySelector(".status-badge");
    badge.textContent = statusText;
    badge.classList.add(badgeClass);

    // ===== DELIVERY =====
    card.querySelector(".delivery-date").textContent = deliveryDate;

    // ===== PRODUCTS =====
    const productsContainer = card.querySelector(".order-products");

    if (Array.isArray(order.items)) {
      order.items.forEach(item => {
        const div = document.createElement("div");
        div.className = "order-product-card";

        div.innerHTML = `
          <img src="${item.thumbnail || '/images/product-placeholder.png'}" />
          <div class="product-info">
            <span class="product-name">${item.name}</span>
            <span>Qty: ${item.qty}</span>
          </div>
        `;

        productsContainer.appendChild(div);
      });
    }

    // ===== PAYMENT =====
    card.querySelector(".total-amount").textContent = `₹${order.totalAmount || 0}`;
    card.querySelector(".payment-type").textContent = typeText;
    card.querySelector(".payment-status").textContent = statusText;

    // ===== APPEND =====
    ordersList.appendChild(card);

  });

  // ===== EMPTY =====
  if (!hasOrders) {
    emptyCard.style.display = "block";
    emptyCard.innerHTML = `
      <div class="empty-icon">📦</div>
      <h2>No Orders Yet</h2>
    `;
  } else {
    emptyCard.style.display = "none";
  }
}


// ================= FETCH =================
function fetchOrdersRealtime(uid) {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {
    renderOrders(snapshot);
  }, (err) => {
    console.error(err);
    emptyCard.innerHTML = `
      <div class="empty-icon"></div>
      <h2>Error loading orders</h2>
    `;
  });
}


// ================= AUTH =================
onAuthStateChanged(auth, (user) => {

  if (!user) {
    localStorage.setItem("postLoginRedirect", window.location.href);
    window.location.href = "login.html";
    return;
  }

  fetchOrdersRealtime(user.uid);

});


// ================= CLOSE =================
closeBtn.addEventListener("click", () => {
  pageWrapper.classList.add("closing");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 350);
});


