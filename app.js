// --- Config Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyBN3DK2hoQvHg3DYnHGiHf3uDuf_zc0424",
  authDomain: "baby-foot-f0353.firebaseapp.com",
  projectId: "baby-foot-f0353",
  storageBucket: "baby-foot-f0353.appspot.com",
  messagingSenderId: "490861743314",
  appId: "1:490861743314:web=e4088571e39def10b",
  measurementId: "G-5YCN1JFS"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.database();

// Sélecteurs pour auth.html
const emailInput       = document.getElementById('email');
const passwordInput    = document.getElementById('password');
const displayNameInput = document.getElementById('displayName');
const btnSignup        = document.getElementById('btnSignup');
const btnLogin         = document.getElementById('btnLogin');
const authMessage      = document.getElementById('authMessage');

// Sélecteurs pour index.html
const appDiv            = document.getElementById('appDiv');
const userNameSpan      = document.getElementById('userName');
const btnLogout         = document.getElementById('btnLogout');
const friendNameInput   = document.getElementById('friendNameInput');
const btnAddFriend      = document.getElementById('btnAddFriend');
const friendMessage     = document.getElementById('friendMessage');
const friendsList       = document.getElementById('friendsList');

// -------------------------------
// 1) Page auth.html : inscription / connexion
// -------------------------------
if (btnSignup && btnLogin) {
  // Inscription
  btnSignup.onclick = async () => {
    authMessage.textContent = "";
    const email       = emailInput.value.trim();
    const password    = passwordInput.value.trim();
    const displayName = displayNameInput.value.trim();

    // Validation client
    if (!email || !password || !displayName) {
      authMessage.style.color = "red";
      authMessage.textContent = "Tous les champs sont obligatoires.";
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      authMessage.style.color = "red";
      authMessage.textContent = "Adresse email invalide.";
      return;
    }
    if (password.length < 6) {
      authMessage.style.color = "red";
      authMessage.textContent = "Le mot de passe doit faire au moins 6 caractères.";
      return;
    }

    try {
      const { user } = await auth.createUserWithEmailAndPassword(email, password);
      await db.ref(`users/${user.uid}`).set({
        email,
        displayName,
        createdAt: Date.now(),
        friends: {}
      });
      authMessage.style.color = "green";
      authMessage.textContent = "Inscription réussie ! Redirection…";
      setTimeout(() => window.location.href = 'index.html', 1000);

    } catch (err) {
      let msg;
      switch (err.code) {
        case 'auth/email-already-in-use':
          msg = "Cet email est déjà utilisé.";
          break;
        case 'auth/invalid-email':
          msg = "Adresse email non valide.";
          break;
        case 'auth/weak-password':
          msg = "Mot de passe trop faible (6 caractères min.).";
          break;
        case 'auth/too-many-requests':
          msg = "Trop de tentatives. Réessayez plus tard.";
          break;
        default:
          msg = err.message;
      }
      authMessage.style.color = err.code === 'auth/email-already-in-use' ? "orange" : "red";
      authMessage.textContent = msg;
    }
  };

  // Connexion
  btnLogin.onclick = async () => {
    authMessage.textContent = "";
    const email    = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      authMessage.style.color = "red";
      authMessage.textContent = "Tous les champs sont obligatoires.";
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      authMessage.style.color = "red";
      authMessage.textContent = "Adresse email invalide.";
      return;
    }

    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = 'index.html';

    } catch (err) {
      let msg;
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-login-credentials':
          msg = "Email ou mot de passe incorrect.";
          break;
        case 'auth/invalid-email':
          msg = "Adresse email non valide.";
          break;
        case 'auth/too-many-requests':
          msg = "Trop de tentatives. Réessayez plus tard.";
          break;
        default:
          msg = err.message;
      }
      authMessage.style.color = "red";
      authMessage.textContent = msg;
    }
  };
}

// -------------------------------
// 2) Page index.html : accueil & amis
// -------------------------------
if (appDiv) {
  auth.onAuthStateChanged(async user => {
    if (!user) return window.location.href = 'auth.html';

    // Afficher UI et pseudo
    appDiv.style.display  = 'block';
    const userSnap        = await db.ref(`users/${user.uid}`).once('value');
    const me              = userSnap.val();
    userNameSpan.textContent = me.displayName;

    // Charger et écouter la liste d’amis
    listenFriends(user.uid);
  });

  // Déconnexion
  btnLogout.onclick = () => auth.signOut().then(() => window.location.href = 'auth.html');

  // Ajout d’un ami
  btnAddFriend.onclick = async () => {
    friendMessage.textContent = "";
    const pseudo = friendNameInput.value.trim();
    if (!pseudo) {
      friendMessage.style.color = "red";
      friendMessage.textContent = "Saisis un pseudo valide.";
      return;
    }

    try {
      // Recherche par displayName
      const usersSnap = await db.ref('users')
        .orderByChild('displayName')
        .equalTo(pseudo)
        .once('value');

      if (!usersSnap.exists()) {
        friendMessage.style.color = "red";
        friendMessage.textContent = `Aucun utilisateur "${pseudo}".`;
        return;
      }

      let friendUid;
      usersSnap.forEach(child => friendUid = child.key);

      const meUid = auth.currentUser.uid;
      if (friendUid === meUid) {
        friendMessage.style.color = "red";
        friendMessage.textContent = "Tu ne peux pas t'ajouter toi-même.";
        return;
      }

      // Mise à jour bilatérale
      const updates = {};
      updates[`users/${meUid}/friends/${friendUid}`] = true;
      updates[`users/${friendUid}/friends/${meUid}`] = true;
      await db.ref().update(updates);

      friendMessage.style.color = "green";
      friendMessage.textContent = `${pseudo} ajouté(e) !`;
      friendNameInput.value = "";

    } catch (err) {
      friendMessage.style.color = "red";
      friendMessage.textContent = "Erreur : " + err.message;
    }
  };

  // Fonction d’écoute de la liste d’amis
  function listenFriends(uid) {
    db.ref(`users/${uid}/friends`).on('value', async snap => {
      friendsList.innerHTML = "";
      const list = snap.val() || {};

      for (const fid in list) {
        const fSnap = await db.ref(`users/${fid}/displayName`).once('value');
        const name = fSnap.val();
        const li   = document.createElement('li');
        li.textContent = name;
        friendsList.appendChild(li);
      }
    });
  }
}
