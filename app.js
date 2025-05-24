// Config Firebase (même config que game.js)
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

const appDiv = document.getElementById('appDiv');
const userPseudoSpan = document.getElementById('userPseudo');
const userEmailSpan = document.getElementById('userEmail');
const btnLogout = document.getElementById('btnLogout');
const friendInput = document.getElementById('friendPseudoInput');
const addFriendBtn = document.getElementById('addFriendBtn');
const addFriendMessage = document.getElementById('addFriendMessage');
const friendsList = document.getElementById('friendsList');
const btnPlayGame = document.getElementById('btnPlayGame');

let currentUser = null;
let friends = {}; // clé = uid, valeur = {pseudo, email}

// Vérification connexion
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    // Pas connecté, rediriger vers auth (à créer)
    window.location.href = 'auth.html';
    return;
  }
  currentUser = user;
  userPseudoSpan.textContent = user.displayName || 'Utilisateur';
  userEmailSpan.textContent = user.email || '';
  appDiv.style.display = 'block';
  loadFriends();
});

// Déconnexion
btnLogout.onclick = () => {
  firebase.auth().signOut();
};

// Charger liste amis depuis Firebase
function loadFriends() {
  // Stocker liste amis sous /users/{uid}/friends/{friendUid}: true
  db.ref(`users/${currentUser.uid}/friends`).on('value', snapshot => {
    const friendUids = snapshot.val() || {};
    friends = {};
    friendsList.innerHTML = '';
    const promises = [];
    for (const friendUid in friendUids) {
      // Charger infos ami
      promises.push(db.ref(`users/${friendUid}`).once('value').then(snap => {
        const data = snap.val();
        if (data) {
          friends[friendUid] = { pseudo: data.pseudo || 'Inconnu', email: data.email || '' };
          const li = document.createElement('li');
          li.textContent = `${friends[friendUid].pseudo} (${friends[friendUid].email})`;
          friendsList.appendChild(li);
        }
      }));
    }
    return Promise.all(promises);
  });
}

// Ajouter un ami par pseudo
addFriendBtn.onclick = () => {
  const pseudo = friendInput.value.trim();
  if (!pseudo) return alert("Entrez un pseudo valide");

  addFriendMessage.textContent = "Recherche en cours...";
  // Recherche user avec ce pseudo
  db.ref('users').orderByChild('pseudo').equalTo(pseudo).once('value').then(snapshot => {
    const users = snapshot.val();
    if (!users) {
      addFriendMessage.textContent = "Utilisateur introuvable.";
      return;
    }
    const friendUid = Object.keys(users)[0];
    if (friendUid === currentUser.uid) {
      addFriendMessage.textContent = "Vous ne pouvez pas vous ajouter vous-même.";
      return;
    }

    // Ajouter ami sous /users/{currentUser}/friends/{friendUid}
    db.ref(`users/${currentUser.uid}/friends/${friendUid}`).set(true)
      .then(() => {
        addFriendMessage.textContent = `Ami "${pseudo}" ajouté !`;
        friendInput.value = '';
      })
      .catch(err => {
        addFriendMessage.textContent = "Erreur ajout ami : " + err.message;
      });
  });
};

// Bouton jouer : création room + redirection vers game.html
btnPlayGame.onclick = () => {
  const friendUids = Object.keys(friends);
  if (friendUids.length === 0) {
    alert("Ajoutez au moins un ami pour jouer.");
    return;
  }
  const friendUid = friendUids[0]; // Prends le premier ami (à améliorer)

  // Crée un id de room unique (ordre trié des UIDs)
  const players = [currentUser.uid, friendUid].sort();
  const roomId = `room_${players[0]}_${players[1]}`;

  // Optionnel : créer la room dans la BDD (vide, juste pour init)
  db.ref(`gameRooms/${roomId}`).set({
    players,
    createdAt: Date.now()
  }).then(() => {
    window.location.href = `game.html?room=${roomId}`;
  });
};
