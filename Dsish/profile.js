// ================= FIREBASE =================
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc
} from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";


// ================= ELEMENTS =================
const profileInfo = document.getElementById("profile-info");
const logoutBtn = document.getElementById("logout-btn");
const editAddressBtn = document.getElementById("edit-address-btn");
const addressForm = document.getElementById("address-form");
const savedAddressView = document.getElementById("saved-address-view");
const cancelAddressBtn = document.getElementById("cancel-address-btn");
const closeBtn = document.getElementById("close-profile-btn");

// Inputs
const nameInput = document.getElementById("address-name");
const phoneInput = document.getElementById("address-phone");
const addressInput = document.getElementById("address-line");
const cityInput = document.getElementById("address-city");
const stateInput = document.getElementById("address-state");
const pincodeInput = document.getElementById("address-pincode");

let currentUser = null;


// ================= TOAST =================
function showToast(message, type = "success") {

  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2500);

}


// ================= AUTH STATE =================
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    localStorage.setItem("postLoginRedirect", window.location.href);
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  logoutBtn.style.display = "block";

  profileInfo.innerHTML = `
    <strong>${user.displayName || "Customer"}</strong>
    <span>${user.email}</span>
  `;

  await loadAddress();

});


// ================= LOAD ADDRESS =================
async function loadAddress() {

  try {

    const ref = doc(db, "users", currentUser.uid);
    const snap = await getDoc(ref);

    if (!snap.exists() || !snap.data().address) {
      savedAddressView.innerHTML =
        `<p class="empty-address">No address saved yet.</p>`;
      return;
    }

    const data = snap.data();

    savedAddressView.innerHTML = `
      <strong>${data.name}</strong><br>
      ${data.address}<br>
      ${data.city}, ${data.state} - ${data.pincode}<br>
      Phone: ${data.phone}
    `;

    // Autofill form
    nameInput.value = data.name || "";
    phoneInput.value = data.phone || "";
    addressInput.value = data.address || "";
    cityInput.value = data.city || "";
    stateInput.value = data.state || "";
    pincodeInput.value = data.pincode || "";

  } catch (err) {
    console.error(err);
    showToast("Failed to load address", "error");
  }

}


// ================= ADDRESS TOGGLE =================
editAddressBtn.addEventListener("click", () => {
  addressForm.classList.add("active");
  editAddressBtn.style.display = "none";
});

cancelAddressBtn.addEventListener("click", () => {
  addressForm.classList.remove("active");
  editAddressBtn.style.display = "block";
});


// ================= SAVE ADDRESS =================
addressForm.addEventListener("submit", async (e) => {

  e.preventDefault();
  if (!currentUser) return;

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const address = addressInput.value.trim();
  const city = cityInput.value.trim();
  const state = stateInput.value.trim();
  const pincode = pincodeInput.value.trim();

  if (!name || !phone || !address || !city || !state || !pincode) {
    showToast("Please fill all fields", "error");
    return;
  }

  try {

    await setDoc(doc(db, "users", currentUser.uid), {
      name,
      phone,
      address,
      city,
      state,
      pincode,
      email: currentUser.email,
      updatedAt: new Date()
    }, { merge: true });

    await loadAddress();

    addressForm.classList.remove("active");
    editAddressBtn.style.display = "block";

    showToast("Address saved successfully");

  } catch (err) {
    console.error(err);
    showToast("Failed to save address", "error");
  }

});


// ================= LOGOUT =================
logoutBtn.addEventListener("click", async () => {

  await signOut(auth);
  window.location.href = "index.html";

});


// ================= CLOSE BUTTON =================
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}


// ================= POST LOGIN REDIRECT =================
document.addEventListener("DOMContentLoaded", () => {

  const redirect = localStorage.getItem("postLoginRedirect");

  if (redirect) {
    localStorage.removeItem("postLoginRedirect");
    if (window.location.href !== redirect) {
      window.location.href = redirect;
    }
  }

});






