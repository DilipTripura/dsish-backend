// ================= FIREBASE =================
import {
  db,
  doc,
  getDoc,
  auth
} from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";


// ================= ELEMENTS =================
const input = document.getElementById("orderIdInput");
const trackBtn = document.getElementById("trackBtn");
const loading = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");


// ================= URL PARAM =================
const params = new URLSearchParams(window.location.search);
const urlOrderId = params.get("orderId");


// ================= AUTH CHECK =================
onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // auto track only if url contains orderId
  if (urlOrderId && urlOrderId.trim() !== "") {
    autoTrack(urlOrderId, user.uid);
  }

});


// ================= BUTTON EVENT =================
trackBtn.addEventListener("click", trackOrder);


// ================= ENTER KEY =================
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    trackOrder();
  }
});


// ================= TRACK ORDER =================
async function trackOrder() {

  const orderId = input.value.trim();

  if (!orderId) {
    showToast("Please enter ORDER ID");
    shakeInput(input);
    return;
  }

  showLoader("Checking your order...");

  try {

    const orderRef = doc(db, "orders", orderId);
    const snap = await getDoc(orderRef);

    hideLoader();

    if (!snap.exists()) {
      showToast("Order ID not found");
      shakeInput(input);
      return;
    }

    // redirect with id
    window.location.href = `order-tracking.html?orderId=${orderId}`;

  } catch (err) {

    hideLoader();
    console.error(err);
    showToast("Something went wrong");

  }

}


// ================= AUTO TRACK =================
async function autoTrack(orderId, userId) {

  showLoader("Loading your order...");

  try {

    const orderRef = doc(db, "orders", orderId);
    const snap = await getDoc(orderRef);

    hideLoader();

    if (!snap.exists()) {
      showToast("Invalid Order ID");
      return;
    }

    const order = snap.data();

    if (order.userId !== userId) {
      showToast("Unauthorized access");
      return;
    }

    processOrder(orderId, order);

  } catch (err) {

    hideLoader();
    console.error(err);
    showToast("Error loading order");

  }

}


// ================= LOADER =================
function showLoader(text) {

  loadingText.textContent = text;
  loading.classList.remove("hidden");

}

function hideLoader() {

  loading.classList.add("hidden");

}


// ================= PROCESS ORDER =================
function processOrder(orderId, order) {

  const createdAt = order.createdAt.toDate();
  const now = new Date();

  const diffDays = Math.floor(
    (now - createdAt) / (1000 * 60 * 60 * 24)
  );

  const status = getStatus(diffDays);
  const estimateDate = getEstimateDate(createdAt);

  showResult(orderId, status, estimateDate);
}


// ================= STATUS =================
function getStatus(days) {

  if (days <= 0) return { step: 1, text: "Order Confirmed" };

  if (days === 1) return { step: 2, text: "Dispatched" };

  if (days >= 2 && days <= 5) return { step: 3, text: "With Courier" };

  if (days === 6) return { step: 4, text: "Out for Delivery" };

  return { step: 5, text: "Delivered" };

}


// ================= DELIVERY DATE =================
function getEstimateDate(createdAt) {

  const estimate = new Date(createdAt);
  estimate.setDate(estimate.getDate() + 7);

  return estimate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

}


// ================= SHOW RESULT =================
function showResult(orderId, status, estimateDate) {

  const resultBox = document.getElementById("orderResult");
  resultBox.classList.remove("hidden");

  document.getElementById("resultOrderId").textContent = orderId;
  document.getElementById("resultStatus").textContent = status.text;
  document.getElementById("resultDelivery").textContent = estimateDate;

  updateTimeline(status.step);

}


// ================= TIMELINE =================
function updateTimeline(activeStep) {

  const steps = document.querySelectorAll(".step");

  steps.forEach(step => {

    const stepNumber = parseInt(step.dataset.step);

    step.classList.toggle("active", stepNumber <= activeStep);

  });

  const percentage = (activeStep / 5) * 100;

  document.getElementById("progressFill").style.width =
    percentage + "%";

}


// ================= TOAST =================
let toastTimer;

function showToast(message) {

  const toast = document.getElementById("toast");
  const msg = document.getElementById("toastMessage");

  msg.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);

}


// ================= SHAKE INPUT =================
function shakeInput(el) {

  el.classList.add("shake");

  setTimeout(() => {
    el.classList.remove("shake");
  }, 400);

}


// ================= CLOSE PAGE =================
const closeBtn = document.getElementById("closePageBtn");

closeBtn.addEventListener("click", () => {

  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.3s ease";

  setTimeout(() => {
    window.history.back();
  }, 300);

});