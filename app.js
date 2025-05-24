// --- Config Firebase ---
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
const db   = firebase.database();

// Sélecteurs pour **auth.html**
const emailInput       = document.getElementById('email');
const passwordInput    = document.getElementById('password');
const displayNameInput = document.getElementById('displayName');
const btnSignup        = document.getElementById('btnSignup');
const btnLogin         = document.getElementById('btnLogin');
const authMessage      = document.getElementById('authMessage');

// Sélecteurs pour **index.html**
const appDiv        = document.getElementById('appDiv');
const userEmailSpan = document.getElementById('userEmail');
const btnLogout     = document.getElementById('btnLogout');
const friendsList   = document.getElementById('friendsList');

// 1) Page auth.html : inscription / connexion
if (btnSignup && btnLogin) {
  // Inscription
  btnSignup.onclick = async () => {
    authMessage.textContent = "";
    const email       = emailInput.value.trim();
    const password    = passwordInput.value.trim();
    const displayName = displayNameInput.value.trim();
    if (!email || !password || !displayName) {
      authMessage.style.color = "red";
      authMessage.textContent = "Merci de remplir tous les champs.";
      return;
    }
    try {
      const { user } = await auth.createUserWithEmailAndPassword(email, password);
      await db.ref(`users/${user.uid}`).set({
        email, displayName, createdAt: Date.now(), friends: {}
      });
      authMessage.style.color = "green";
      authMessage.textContent = "Inscription réussie ! Redirection...";
      setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (e) {
      authMessage.style.color = "red";
      authMessage.textContent = e.message;
    }
  };

  // Connexion
  btnLogin.onclick = async () => {
    authMessage.textContent = "";
    const email    = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
      authMessage.style.color = "red";
      authMessage.textContent = "Merci de remplir tous les champs.";
      return;
    }
    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = 'index.html';
    } catch (e) {
      authMessage.style.color = "red";
      authMessage.textContent = e.message;
    }
  };
}

// 2) Page index.html : accueil
if (appDiv) {
  auth.onAuthStateChanged(async user => {
    if (!user) return window.location.href = 'auth.html';
    // Affiche et renseigne email
    appDiv.style.display = 'block';
    userEmailSpan.textContent = user.email;

    // Crée l'entrée si nouvelle session
    const snap = await db.ref(`users/${user.uid}`).once('value');
    if (!snap.exists()) {
      await db.ref(`users/${user.uid}`).set({
        email: user.email,
        displayName: user.email.split('@')[0],
        createdAt: Date.now(),
        friends: {}
      });
    }
    // Charge la liste d’amis
    db.ref(`users/${user.uid}/friends`).on('value', s => {
      friendsList.innerHTML = '';
      const f = s.val() || {};
      Object.keys(f).forEach(fid => {
        db.ref(`users/${fid}/displayName`).once('value').then(nSnap => {
          const li = document.createElement('li');
          li.textContent = nSnap.val();
          friendsList.appendChild(li);
        });
      });
    });
  });

  // Bouton déconnexion
  btnLogout.onclick = () => {
    auth.signOut().then(() => window.location.href = 'auth.html');
  };
}
