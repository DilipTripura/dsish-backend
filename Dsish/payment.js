// ================= CONFIG =================
const RAZORPAY_KEY = "YOUR_RAZORPAY_KEY_ID"; // ⚠️ replace

let orderId = null;
let orderTotal = 0;
let quantity = 1;


// ================= FIREBASE =================
import { db, auth } from "./firebase.js";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";


// ================= ELEMENTS =================
const summaryQty = document.getElementById("summary-qty");
const summaryBase = document.getElementById("summary-base");
const summaryTotal = document.getElementById("summary-total");

const razorpayBtn = document.getElementById("razorpay-btn");
const codBtn = document.getElementById("cod-btn");

const codModal = document.getElementById("cod-modal-overlay");
const codYesBtn = document.getElementById("cod-yes-btn");
const codNoBtn = document.getElementById("cod-no-btn");

const paymentModal = document.getElementById("payment-modal");
const modalOkBtn = document.getElementById("modal-ok-btn");


// ================= UTILS =================
function redirect(url) {
  window.location.href = url;
}


// ================= LOAD ORDER =================
async function loadOrder(user) {
  try {
    orderId = localStorage.getItem("lastOrderId");

    if (!orderId) return redirect("index.html");

    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) return redirect("index.html");

    const orderData = orderSnap.data();

    // 🔐 SECURITY CHECK
    if (orderData.userId !== user.uid) {
      return redirect("index.html");
    }

    quantity = orderData.totalQty || 1;
    orderTotal = orderData.totalAmount || 0;

    // UI update
    summaryQty.textContent = quantity;
    summaryBase.textContent = `₹${orderTotal}`;
    summaryTotal.textContent = `₹${orderTotal}`;

  } catch (err) {
    console.error(err);
    redirect("index.html");
  }
}


// ================= COD FLOW =================
function showCodModal() {
  codModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function hideCodModal() {
  codModal.classList.remove("active");
  document.body.style.overflow = "auto";
}

codBtn?.addEventListener("click", showCodModal);

codNoBtn?.addEventListener("click", hideCodModal);

codYesBtn?.addEventListener("click", async () => {
  try {
    codYesBtn.disabled = true;
    codYesBtn.innerText = "Processing...";

    await updateDoc(doc(db, "orders", orderId), {
      paymentType: "cod",
      paymentStatus: "confirmed",
      paidAmount: 0,
      remainingAmount: orderTotal,
      paymentSubmittedAt: serverTimestamp()
    });

    localStorage.removeItem("cart");

    window.location.replace("myorder.html");

  } catch (err) {
    console.error(err);
    alert("Error placing COD order");

    codYesBtn.disabled = false;
    codYesBtn.innerText = "Confirm Order";
  }
});


// ================= RAZORPAY FLOW =================
razorpayBtn?.addEventListener("click", async () => {
  try {
    razorpayBtn.disabled = true;
    razorpayBtn.innerText = "Processing...";

    // 🔥 STEP 1: Create order from backend
    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: orderTotal,
        orderId: orderId
      })
    });

    const data = await res.json();

    if (!data.success) throw new Error("Order creation failed");

    // 🔥 STEP 2: Open Razorpay
    const options = {
      key: RAZORPAY_KEY,
      amount: data.amount,
      currency: "INR",
      name: "Dsish",
      description: "Order Payment",
      order_id: data.razorpayOrderId,

      handler: async function (response) {
        try {

          // 🔐 STEP 3: Verify payment (backend)
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId
            })
          });

          const verifyData = await verifyRes.json();

          if (!verifyData.success) {
            throw new Error("Verification failed");
          }

          // ✅ UPDATE FIREBASE
          await updateDoc(doc(db, "orders", orderId), {
            paymentType: "prepaid",
            paymentStatus: "paid",
            paidAmount: orderTotal,
            remainingAmount: 0,
            razorpayPaymentId: response.razorpay_payment_id,
            paymentSubmittedAt: serverTimestamp()
          });

          localStorage.removeItem("cart");

          showSuccessModal();

        } catch (err) {
          console.error(err);
          alert("Payment verification failed");
        }
      },

      theme: {
        color: "#000000"
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();

    razorpayBtn.disabled = false;
    razorpayBtn.innerText = "Pay Securely";

  } catch (err) {
    console.error(err);
    alert("Payment failed to start");

    razorpayBtn.disabled = false;
    razorpayBtn.innerText = "Pay Securely";
  }
});


// ================= SUCCESS MODAL =================
function showSuccessModal() {
  paymentModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

modalOkBtn?.addEventListener("click", () => {
  window.location.replace("myorder.html");
});


// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {
  if (!user) return redirect("login.html");

  await loadOrder(user);
});


// ================= BACK BUTTON =================
document.getElementById("back-btn")
  ?.addEventListener("click", () => {
    redirect("checkout.html");
  });








































