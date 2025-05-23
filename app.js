const firebaseConfig = {
  apiKey: "AIzaSyBN3DK2hoQvHg3DYnHGiHf3uDuf_zc0424",
  authDomain: "baby-foot-f0353.firebaseapp.com",
  projectId: "baby-foot-f0353",
  storageBucket: "baby-foot-f0353.appspot.com",
  messagingSenderId: "490861743314",
  appId: "1:490861743314:web:e4088571e39def7a7ef10b",
  measurementId: "G-5YCN1JFS"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

let currentUser = null;

const authMessage = document.getElementById("authMessage");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnSignup = document.getElementById("btnSignup");
const btnLogin = document.getElementById("btnLogin");
const userEmailSpan = document.getElementById("userEmail");
const friendsList = document.getElementById("friendsList");

auth.onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;
    if (userEmailSpan) userEmailSpan.textContent = user.email;

    const userRef = database.ref(`users/${user.uid}`);
    const userSnap = await userRef.once('value');
    if (!userSnap.exists()) {
      await userRef.set({ email: user.email, createdAt: Date.now(), friends: {} });
    }

    if (friendsList) loadFriends();
    if (window.location.pathname.endsWith("auth.html")) {
      window.location.href = "index.html";
    }
  } else {
    currentUser = null;
    if (userEmailSpan) userEmailSpan.textContent = "";
    if (friendsList) friendsList.innerHTML = "";
    if (window.location.pathname.endsWith("index.html")) {
      window.location.href = "auth.html";
    }
  }
});

function loadFriends() {
  const ref = database.ref(`users/${currentUser.uid}/friends`);
  ref.once("value", snapshot => {
    friendsList.innerHTML = "";
    snapshot.forEach(child => {
      const li = document.createElement("li");
      li.textContent = child.val().name || "Ami";
      friendsList.appendChild(li);
    });
  });
}

if (btnSignup) {
  btnSignup.onclick = () => {
    authMessage.textContent = "";
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
      authMessage.style.color = "red";
      authMessage.textContent = "Email et mot de passe requis.";
      return;
    }
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        authMessage.style.color = "green";
        authMessage.textContent = "Inscription réussie !";
      })
      .catch(err => {
        authMessage.style.color = "red";
        authMessage.textContent = "Erreur: " + err.message;
      });
  };
}

if (btnLogin) {
  btnLogin.onclick = () => {
    authMessage.textContent = "";
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
      authMessage.style.color = "red";
      authMessage.textContent = "Email et mot de passe requis.";
      return;
    }
    auth.signInWithEmailAndPassword(email, password)
      .catch(err => {
        authMessage.style.color = "red";
        authMessage.textContent = "Erreur: " + err.message;
      });
  };
}