// ================= FIREBASE SETUP =================
import {
  auth,
  db,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";


// ================= INDIAN STATES =================
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"
];


// ================= DOM =================
const form = document.getElementById("address-form");
const loading = document.getElementById("loading-screen");

const stateInput = document.getElementById("state");
const stateBtn = document.getElementById("state-btn");
const stateList = document.getElementById("state-list");


const backBtn = document.getElementById("back-btn");
const exitOverlay = document.getElementById("exit-overlay");
const stayBtn = document.getElementById("stay-btn");
const leaveBtn = document.getElementById("leave-btn");

backBtn.addEventListener("click", () => {
  exitOverlay.style.display = "flex";
});

// Stay
stayBtn.addEventListener("click", () => {
  exitOverlay.style.display = "none";
});

//leave
leaveBtn.addEventListener("click", () => {

  document.body.style.transition = "opacity 0.3s ease";
  document.body.style.opacity = "0";

  setTimeout(() => {

    const source = localStorage.getItem("checkoutSource");
    const productId = localStorage.getItem("checkoutProductId");

    if (source === "product" && productId) {
      window.location.replace(`product.html?id=${productId}`);
    } else {
      window.location.replace("index.html");
    }

  }, 300);

});



// ================= HELPERS =================
const val = id => document.getElementById(id)?.value.trim() || "";

const err = (id, msg) => {
  const e = document.getElementById(id);
  if (e) e.textContent = msg;
};


// ================= STATE DROPDOWN =================
stateList.innerHTML = "";

INDIAN_STATES.forEach(state => {

  const li = document.createElement("li");

  li.textContent = state;

  li.onclick = () => {
    stateInput.value = state;
    stateList.style.display = "none";
    err("state-error", "");
  };

  stateList.appendChild(li);

});

stateBtn.onclick = () => {

  stateList.style.display =
    stateList.style.display === "block" ? "none" : "block";

};

document.onclick = e => {

  if (!e.target.closest(".form-group")) {

    stateList.style.display = "none";

  }

};


// ================= VALIDATION =================
function validateForm() {

  let ok = true;

  if (val("name").length < 3) {
    err("name-error","Enter valid name");
    ok = false;
  } else err("name-error","");

  if (!/^\d{10}$/.test(val("phone"))) {
    err("phone-error","Enter valid phone");
    ok = false;
  } else err("phone-error","");

  if (!val("line1")) {
    err("line1-error","Enter address");
    ok = false;
  } else err("line1-error","");

  if (!val("city")) {
    err("city-error","Enter city");
    ok = false;
  } else err("city-error","");

  if (!INDIAN_STATES.includes(val("state"))) {
    err("state-error","Select valid state");
    ok = false;
  } else err("state-error","");

  if (!/^\d{6}$/.test(val("pincode"))) {
    err("pincode-error","Enter valid pincode");
    ok = false;
  } else err("pincode-error","");

  return ok;

}


// ================= LOAD SAVED ADDRESS =================
async function loadSavedAddress(user) {

  try {

    const snap = await getDoc(doc(db,"users",user.uid));

    if (!snap.exists()) return;

    const data = snap.data();

    document.getElementById("name").value = data.name || "";
    document.getElementById("phone").value = data.phone || "";
    document.getElementById("line1").value = data.address || "";
    document.getElementById("city").value = data.city || "";
    document.getElementById("state").value = data.state || "";
    document.getElementById("pincode").value = data.pincode || "";

  }

  catch(e){

    console.warn("Autofill failed",e);

  }

}


// ================= AUTH =================
onAuthStateChanged(auth, user => {

  if (!user) {

    localStorage.setItem("postLoginRedirect", location.href);
    localStorage.setItem("loginMessage", "Please sign in to continue with your order");

    location.href = "login.html";

    return;

  }

  loadSavedAddress(user);
  startCheckout(user);

});


// ================= CHECKOUT =================
function startCheckout(user) {

  // ================= ESTIMATED DELIVERY =================
const deliveryDateEl = document.getElementById("delivery-date");

function calculateDeliveryDate() {
  const today = new Date();
  today.setDate(today.getDate() + 7);

  const options = { day: "numeric", month: "short", year: "numeric" };
  return today.toLocaleDateString("en-IN", options);
}

const estimatedDelivery = calculateDeliveryDate();
deliveryDateEl.textContent = estimatedDelivery;


  const rawCart = JSON.parse(localStorage.getItem("cart")) || [];

  if (!rawCart.length) {
    alert("Cart empty");
    location.href = "index.html";
    return;
  }

 const cart = rawCart.map(p => ({
  id: String(p.id),
  name: String(p.name),
  weight: String(p.weight || ""),
  thumbnail: String(p.image || p.thumbnail || ""),
  price: parseInt(p.price, 10) || 0,
  qty: parseInt(p.qty, 10) || 1
}));

  const orderItemsContainer = document.getElementById("order-items");
  const subtotalEl = document.getElementById("subtotal");
  const deliveryEl = document.getElementById("delivery");
  const totalEl = document.getElementById("total");

  // ================= RENDER ORDER SUMMARY =================
  function renderSummary() {

    orderItemsContainer.innerHTML = "";

    let subtotal = 0;

    cart.forEach(item => {

      subtotal += Number(item.price) * Number(item.qty);

      const div = document.createElement("div");
      div.className = "order-item";

     div.innerHTML = `
  <div class="order-item-card">

    <img src="${item.thumbnail}" class="order-item-img">

    <div class="order-item-info">

      <div class="order-item-top">
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-total">
          ₹${item.price * item.qty}
        </div>
      </div>

      <div class="order-item-meta">
        <span>${item.weight} Pack</span>
        <span>Qty: ${item.qty}</span>
      </div>

    </div>

  </div>
`;

      orderItemsContainer.appendChild(div);

    });

    // Delivery logic
   let delivery = 0;

subtotalEl.textContent = "₹" + subtotal;
deliveryEl.textContent = "Free";
totalEl.textContent = "₹" + subtotal;

return {
  subtotal,
  delivery,
  total: subtotal
};

  }

  const totals = renderSummary();

  const totalQty = cart.reduce((s, p) => s + p.qty, 0);

  // ================= SAVE ADDRESS =================
  async function saveAddress(address) {
    await setDoc(doc(db, "users", user.uid), {
      name: address.name,
      phone: address.phone,
      address: address.line1,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      email: user.email,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  // ================= SUBMIT =================
  form.onsubmit = async e => {

    e.preventDefault();

    if (!validateForm()) return;

    const address = {
      name: val("name"),
      phone: val("phone"),
      line1: val("line1"),
      city: val("city"),
      state: val("state"),
      pincode: val("pincode")
    };

    await saveAddress(address);




    const recalculated = renderSummary();

const order = {
  userId: user.uid,
  email: user.email,

  items: cart.map(p => ({
    id: p.id,
    name: p.name,
    weight: p.weight || "",
    thumbnail: p.thumbnail,
    price: p.price,
    qty: p.qty
  })),

  totalQty: totalQty,
  subtotal: recalculated.subtotal,
  delivery: recalculated.delivery,
  totalAmount: recalculated.total,

  estimatedDelivery: estimatedDelivery,

  paymentStatus: "pending", // cleaner
  orderStatus: "awaiting_payment",

  address,

  createdAt: Date.now() 
};


    loading.style.display = "flex";

    try {

     localStorage.setItem("pendingOrder", JSON.stringify(order));
     localStorage.setItem("lastOrderQty", totalQty);

      

      location.replace("payment.html");

    } catch (e) {

      console.error(e);
      alert("Order failed");
      loading.style.display = "none";

    }

  };


}


const TOTAL_STEPS = 5;

function setStep(stepNumber) {

  const stepText = document.getElementById("step-text");
  if (!stepText) return;

  stepText.style.opacity = "0";
  stepText.style.transform = "translateY(-4px)";

  setTimeout(() => {
    stepText.textContent = `Step ${stepNumber} of ${TOTAL_STEPS}`;
    stepText.style.opacity = "1";
    stepText.style.transform = "translateY(0)";
  }, 150);

}

// ================= PROGRESS + STEP =================
window.addEventListener("DOMContentLoaded", () => {

  const bar = document.getElementById("topProgressBar");
  const stepText = document.getElementById("step-text");

  if (bar) {
    bar.style.transition = "width 0.4s ease-in-out";
    bar.style.width = "30%";
  }

  if (stepText) {
    stepText.textContent = "Step 1 of 5";
  }

});
















