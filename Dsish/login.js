// ================= FIREBASE SETUP =================
import {
  auth,
  db,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "./firebase.js";

import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";


// ================= INIT =================
const provider = new GoogleAuthProvider();



// ================= ELEMENTS =================
const googleLoginBtn = document.getElementById("googleLoginBtn");
const errorEl = document.getElementById("login-error");


// ================= CREATE USER DOC IF NOT EXISTS =================
async function ensureUserDocument(user) {

  if (!user || !user.uid) return;

  try {

    const userRef = doc(db, "users", user.uid);

    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {

      await setDoc(userRef, {

        uid: user.uid,

        name: user.displayName || "User",

        email: user.email || "",

        phone: user.phoneNumber || "",

        addresses: [],

        defaultAddressIndex: null,

        createdAt: serverTimestamp(),

        lastLogin: serverTimestamp()

      });

      console.log("User document created");

    } 
    else {

      await setDoc(userRef, {
        lastLogin: serverTimestamp()
      }, { merge: true });

      console.log("User last login updated");

    }

  } catch (error) {

    console.error("Error creating user doc:", error);

  }

}


// ================= GOOGLE LOGIN =================
if (googleLoginBtn) {

  googleLoginBtn.addEventListener("click", async () => {

    try {

      if (errorEl) errorEl.style.display = "none";

      googleLoginBtn.disabled = true;
googleLoginBtn.querySelector(".btn-text").style.opacity = "0";
googleLoginBtn.querySelector(".spinner").style.display = "block";



      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      const userData = {

        uid: user.uid,

        name: user.displayName || "User",

        email: user.email || "",

        photo: user.photoURL || ""

      };


      // Save locally
      localStorage.setItem("currentUser", JSON.stringify(userData));


      // Create Firestore document
      await ensureUserDocument(user);


      // Redirect
      const redirect = localStorage.getItem("postLoginRedirect") || "index.html";

      localStorage.removeItem("postLoginRedirect");

      window.location.href = redirect;


    } catch (error) {

      console.error("Login failed:", error);

      if (errorEl) {

        errorEl.innerText = "Login failed. Try again.";
        errorEl.style.display = "block";

      } else {

        alert("Login failed");

      }

    } finally {

      googleLoginBtn.disabled = false;
googleLoginBtn.querySelector(".btn-text").style.opacity = "1";
googleLoginBtn.querySelector(".spinner").style.display = "none";


    }

  });

}


// ================= AUTH STATE LISTENER =================
onAuthStateChanged(auth, async (user) => {

  if (user) {

    const userData = {

      uid: user.uid,

      name: user.displayName || "User",

      email: user.email || "",

      photo: user.photoURL || ""

    };

    localStorage.setItem("currentUser", JSON.stringify(userData));

    await ensureUserDocument(user);

  } 
  else {

    localStorage.removeItem("currentUser");

  }

});


// ================= LOGOUT =================
window.googleLogout = async function () {

  try {

    await signOut(auth);

    localStorage.removeItem("currentUser");

    window.location.href = "login.html";

  } 
  catch (error) {

    console.error("Logout error:", error);

    alert("Logout failed");

  }

};


// ================= HELPER =================
window.getCurrentUser = function () {

  return JSON.parse(localStorage.getItem("currentUser"));

};


window.addEventListener("DOMContentLoaded", () => {

  const loginMessage = localStorage.getItem("loginMessage");

  if (loginMessage && errorEl) {
    errorEl.innerText = loginMessage;
    errorEl.style.display = "block";
    localStorage.removeItem("loginMessage");
  }

});







