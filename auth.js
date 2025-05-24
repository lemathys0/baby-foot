// --- Initialisation Firebase ---
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
const db = firebase.database();

// Références aux éléments HTML
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const displayNameInput = document.getElementById('displayName');
const btnSignup = document.getElementById('btnSignup');
const btnLogin = document.getElementById('btnLogin');
const authMessage = document.getElementById('authMessage');

// Fonction inscription
btnSignup.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const pseudo = displayNameInput.value.trim();

  if (!email || !password || !pseudo) {
    authMessage.textContent = "Merci de remplir tous les champs.";
    return;
  }

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(({ user }) => {
      // Met à jour le pseudo dans Firebase Auth
      return user.updateProfile({ displayName: pseudo })
        .then(() => {
          // Sauvegarde pseudo + email dans Realtime Database
          return db.ref(`users/${user.uid}`).set({
            pseudo: pseudo,
            email: email
          });
        });
    })
    .then(() => {
      authMessage.style.color = "green";
      authMessage.textContent = "Inscription réussie, redirection...";
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    })
    .catch(error => {
      authMessage.style.color = "red";
      authMessage.textContent = "Erreur inscription : " + error.message;
    });
});

// Fonction connexion
btnLogin.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    authMessage.style.color = "red";
    authMessage.textContent = "Merci de remplir email et mot de passe.";
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      authMessage.style.color = "green";
      authMessage.textContent = "Connexion réussie, redirection...";
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    })
    .catch(error => {
      authMessage.style.color = "red";
      authMessage.textContent = "Erreur connexion : " + error.message;
    });
});
