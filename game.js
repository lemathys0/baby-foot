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

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');
if (!roomId) {
  alert("Room non spécifiée");
  throw new Error("Missing room ID");
}

let currentUserUid = null;
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "auth.html";
    return;
  }
  currentUserUid = user.uid;
  initGame();
});

const config = {
  type: Phaser.AUTO,
  parent: 'gameContainer',
  width: 800,
  height: 600,
  backgroundColor: '#006600',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: { preload, create, update }
};
let game;

function initGame() {
  game = new Phaser.Game(config);
}

let playerBar, opponentBar, ball, cursors;

function preload() {
  this.load.image('ball', 'https://labs.phaser.io/assets/sprites/shinyball.png');
}

function create() {
  const players = roomId.split('_').slice(1); // [uid1, uid2]
  if (players.length < 2) {
    alert("Room invalide");
    throw new Error("Invalid room format");
  }

  const isPlayer1 = currentUserUid === players[0];
  const myId = players[isPlayer1 ? 0 : 1];
  const oppId = players[isPlayer1 ? 1 : 0];

  const xMy = isPlayer1 ? 50 : 750;
  const xOpp = isPlayer1 ? 750 : 50;

  playerBar = this.add.rectangle(xMy, 300, 20, 100, 0xffffff);
  opponentBar = this.add.rectangle(xOpp, 300, 20, 100, 0xff0000);
  this.physics.add.existing(playerBar, true);
  this.physics.add.existing(opponentBar, true);

  ball = this.physics.add.image(400, 300, 'ball')
    .setCollideWorldBounds(true)
    .setBounce(1)
    .setVelocity(150, 150);

  this.physics.add.collider(ball, playerBar);
  this.physics.add.collider(ball, opponentBar);

  cursors = this.input.keyboard.createCursorKeys();

  db.ref(`gameRooms/${roomId}/${oppId}Pos`).on('value', snap => {
    const y = snap.val();
    if (y !== null) {
      opponentBar.y = y;
      opponentBar.body.updateFromGameObject();
    }
  });

  if (!isPlayer1) {
    db.ref(`gameRooms/${roomId}/ballPos`).on('value', snap => {
      const pos = snap.val();
      if (pos) {
        ball.setPosition(pos.x, pos.y);
        ball.body.setVelocity(pos.vx, pos.vy);
      }
    });
  } else {
    this.time.addEvent({
      delay: 50, loop: true, callback: () => {
        db.ref(`gameRooms/${roomId}/ballPos`).set({
          x: ball.x, y: ball.y,
          vx: ball.body.velocity.x,
          vy: ball.body.velocity.y
        });
      }
    });
  }
}

function update() {
  let moved = false;
  if (cursors.up.isDown && playerBar.y > 50) {
    playerBar.y -= 5; moved = true;
  } else if (cursors.down.isDown && playerBar.y < 550) {
    playerBar.y += 5; moved = true;
  }
  if (moved) {
    playerBar.body.updateFromGameObject();
    db.ref(`gameRooms/${roomId}/${currentUserUid}Pos`).set(playerBar.y);
  }
}
