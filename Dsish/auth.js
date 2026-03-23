// ================= IMPORT FIREBASE =================
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";


// ================= AUTH STATE CACHE =================
let currentUser = null;


// ================= CHECK LOGIN STATUS =================
export function isLoggedIn() {
  return !!currentUser;
}


// ================= GET CURRENT USER =================
export function getCurrentUser() {
  return currentUser;
}


// ================= LOGIN REDIRECT =================
export function openLoginModal() {
  localStorage.setItem("postLoginRedirect", window.location.href);
  window.location.href = "login.html";
}


// ================= LOGOUT USER =================
export async function logoutUser() {

  try {

    await signOut(auth);

    // clear local cache
    currentUser = null;

    // clear storage
    localStorage.removeItem("currentUser");

    // show modal if available
    if (typeof showModal === "function") {

      showModal("You have been logged out.");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);

    } else {

      window.location.href = "index.html";

    }

  } catch (error) {

    console.error("Logout error:", error);
    alert("Logout failed. Try again.");

  }

}


// ================= NAV USER BADGE =================
function renderNavUser(user) {

  const navUser = document.getElementById("nav-user");

  if (!navUser) return;

  if (user) {

    navUser.innerHTML = `
      <span class="nav-user-badge">
        You’re logged in as 
        <strong>${user.displayName || user.email}</strong>
      </span>
    `;

  } else {

    navUser.innerHTML = "";

  }

}


// ================= FIREBASE AUTH LISTENER =================
onAuthStateChanged(auth, (user) => {

  if (user) {

    currentUser = user;

    // store safe copy locally (optional)
    localStorage.setItem("currentUser", JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: user.displayName || ""
    }));

  } else {

    currentUser = null;

    localStorage.removeItem("currentUser");

  }

  renderNavUser(user);

});


// ================= REQUIRE LOGIN HELPER =================
export function requireLogin() {

  if (!currentUser) {

    localStorage.setItem("postLoginRedirect", window.location.href);

    window.location.href = "login.html";

    return false;

  }

  return true;

}


// ================= AUTO REDIRECT AFTER LOGIN =================
export function handlePostLoginRedirect() {

  const redirect = localStorage.getItem("postLoginRedirect");

  if (redirect) {

    localStorage.removeItem("postLoginRedirect");

    window.location.href = redirect;

  }

}








