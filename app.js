const firebaseConfig = {
  apiKey: "AIzaSyBN3DK2hoQvHg3DYnHGiHf3uDuf_zc0424",
  authDomain: "baby-foot-f0353.firebaseapp.com",
  databaseURL: "https://baby-foot-f0353-default-rtdb.firebaseio.com",
  projectId: "baby-foot-f0353",
  storageBucket: "baby-foot-f0353.appspot.com",
  messagingSenderId: "490861743314",
  appId: "1:490861743314:web:1568d43898909b807ef10b",
  measurementId: "G-2C5C0PWGN3"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

// Sélecteurs communs
const emailInput       = document.getElementById('email');
const passwordInput    = document.getElementById('password');
const displayNameInput = document.getElementById('displayName');
const btnSignup        = document.getElementById('btnSignup');
const btnLogin         = document.getElementById('btnLogin');
const authMessage      = document.getElementById('authMessage');

// index.html
const appDiv          = document.getElementById('appDiv');
const userEmailSpan   = document.getElementById('userEmail');
const userPseudoSpan  = document.getElementById('userPseudo');
const btnLogout       = document.getElementById('btnLogout');
const friendsList     = document.getElementById('friendsList');
const friendInput     = document.getElementById('friendPseudoInput');
const addFriendBtn    = document.getElementById('addFriendBtn');
const addFriendMsg    = document.getElementById('addFriendMessage');

// INSCRIPTION
if (btnSignup) {
  btnSignup.onclick = async () => {
    authMessage.textContent = "";
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const displayName = displayNameInput.value.trim();

    if (!email || !password || !displayName) {
      authMessage.style.color = "red";
      authMessage.textContent = "Tous les champs sont requis.";
      return;
    }

    try {
      const { user } = await auth.createUserWithEmailAndPassword(email, password);
      await db.ref(`users/${user.uid}`).set({
        email, displayName, createdAt: Date.now(), friends: {}
      });
      authMessage.style.color = "green";
      authMessage.textContent = "Inscription réussie. Redirection...";
      setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (err) {
      let msg = "Erreur inconnue.";
      if (err.code === "auth/email-already-in-use") msg = "Email déjà utilisé.";
      if (err.code === "auth/invalid-email") msg = "Email invalide.";
      if (err.code === "auth/weak-password") msg = "Mot de passe trop faible.";
      authMessage.style.color = "red";
      authMessage.textContent = msg;
    }
  };
}

// CONNEXION
if (btnLogin) {
  btnLogin.onclick = async () => {
    authMessage.textContent = "";
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      authMessage.style.color = "red";
      authMessage.textContent = "Remplis tous les champs.";
      return;
    }

    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = 'index.html';
    } catch (err) {
      let msg = "Erreur de connexion.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Email ou mot de passe incorrect.";
      }
      authMessage.style.color = "red";
      authMessage.textContent = msg;
    }
  };
}

// PAGE INDEX.HTML
if (appDiv) {
  auth.onAuthStateChanged(async user => {
    if (!user) return location.href = 'auth.html';
    appDiv.style.display = "block";

    const userSnap = await db.ref(`users/${user.uid}`).once('value');
    const userData = userSnap.val();
    userEmailSpan.textContent = user.email;
    userPseudoSpan.textContent = userData.displayName;

    // Ajout d'amis
    if (addFriendBtn) {
      addFriendBtn.onclick = async () => {
        const pseudo = friendInput.value.trim();
        addFriendMsg.textContent = "";
        if (!pseudo) return addFriendMsg.textContent = "Pseudo requis.";

        const usersSnap = await db.ref(`users`).once('value');
        let foundUid = null;

        usersSnap.forEach(child => {
          if (child.val().displayName.toLowerCase() === pseudo.toLowerCase()) {
            foundUid = child.key;
          }
        });

        if (!foundUid) {
          addFriendMsg.textContent = "Utilisateur introuvable.";
          return;
        }

        if (foundUid === user.uid) {
          addFriendMsg.textContent = "Tu ne peux pas t’ajouter toi-même.";
          return;
        }

        await db.ref(`users/${user.uid}/friends/${foundUid}`).set(true);
        addFriendMsg.style.color = "green";
        addFriendMsg.textContent = "Ami ajouté !";
        friendInput.value = '';
      };
    }

    // Liste des amis
    db.ref(`users/${user.uid}/friends`).on('value', snap => {
      friendsList.innerHTML = '';
      const friends = snap.val() || {};
      Object.keys(friends).forEach(friendId => {
        db.ref(`users/${friendId}/displayName`).once('value').then(nameSnap => {
          const li = document.createElement('li');
          li.textContent = nameSnap.val();
          friendsList.appendChild(li);
        });
      });
    });
  });

  // Déconnexion
  if (btnLogout) {
    btnLogout.onclick = () => {
      auth.signOut().then(() => location.href = 'auth.html');
    };
  }
}
