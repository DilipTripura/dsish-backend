// ================= FIREBASE =================
import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";


// ================= DOM =================
const form = document.getElementById("manualOrderForm");
const statusText = document.getElementById("status");
const ADMIN_UID = "yUOqkK1RNsRzag2n60RlLDIiI682";



// ================= AUTH CHECK =================
onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (user.uid !== ADMIN_UID) {
    alert("Unauthorized access");
    window.location.href = "index.html";
    return;
  }

});


// ================= FIND USER BY EMAIL =================
async function findUserByEmail(email) {

  const q = query(
    collection(db, "users"),
    where("email", "==", email)
  );

  const snap = await getDocs(q);

  if (snap.empty) return null;

  return snap.docs[0].id; // user UID

}


// ================= CREATE ORDER =================
form.addEventListener("submit", async (e) => {

  e.preventDefault();

  statusText.textContent = "Creating order...";

  try {

    // ================= GET FORM DATA =================
    const email = document.getElementById("email").value.trim();
    const productName = document.getElementById("productName").value.trim();
    const thumbnail = document.getElementById("thumbnail").value.trim();
    const size = document.getElementById("size").value.trim();
    const price = parseInt(document.getElementById("price").value);
    const qty = parseInt(document.getElementById("qty").value);
    const paidAmountInput = parseInt(document.getElementById("paidAmount").value) || 0;

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const line1 = document.getElementById("line1").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value.trim();
    const pincode = document.getElementById("pincode").value.trim();

    const paymentType = document.getElementById("paymentType").value;


    // ================= FIND CUSTOMER UID =================
    const userId = await findUserByEmail(email);

    if (!userId) {

      statusText.textContent = "User not found. Customer must register first.";
      return;

    }


    // ================= BUILD ITEMS ARRAY =================
    const items = [
      {
        id: "manual-product",
        name: productName,
        size: size || "",
        thumbnail: thumbnail,
        price: price,
        qty: qty
      }
    ];


    // ================= CALCULATE TOTAL =================
   const subtotal = price * qty;
const delivery = 0;
const totalAmount = subtotal;

const paidAmount = paidAmountInput;
const remainingAmount = totalAmount - paidAmount;


    // ================= DELIVERY DATE =================
    const today = new Date();
    today.setDate(today.getDate() + 7);

    const estimatedDelivery = today.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });


    // ================= ADDRESS OBJECT =================
    const address = {
      name,
      phone,
      line1,
      city,
      state,
      pincode
    };


    // ================= ORDER OBJECT =================
    const order = {

      userId: userId,
      email: email,

      items: items,

      totalQty: qty,
      subtotal: subtotal,
      delivery: delivery,
      totalAmount: totalAmount,

      estimatedDelivery: estimatedDelivery,

      paymentType: paymentType,
     paymentStatus: paidAmount === totalAmount ? "paid" : "pending",
verificationStatus: "approved",
orderStatus: "confirmed",

paidAmount: paidAmount,
remainingAmount: remainingAmount,

      address: address,

      createdBy: "admin",
      adminUid: ADMIN_UID,

      createdAt: serverTimestamp()

    };


    // ================= SAVE ORDER =================
    await addDoc(collection(db, "orders"), order);


    statusText.textContent = "Order created successfully.";

    form.reset();

  }

  catch (err) {

    console.error(err);
    statusText.textContent = "Order creation failed.";

  }

});

