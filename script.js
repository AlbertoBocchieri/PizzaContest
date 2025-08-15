import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = { /* config tua */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ENTRIES = [
  { id: 'margherita', name: 'Margherita', author: 'Giuseppe', img: './img/margherita.jpg' },
  { id: 'norma', name: 'Norma', author: 'Alessio', img: './img/norma.jpg' },
  // altre pizze...
];

let currentUser = null;
let votesCache = [];
let myVote = null;
let votingClosed = false;

signInAnonymously(auth);
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  subscribeVotes();
  renderAll();
});

function subscribeVotes() {
  onSnapshot(collection(db, 'contests/ferragosto2025/votes'), (snap) => {
    votesCache = snap.docs.map(d => d.data());
    renderResults();
  });
}

async function vote(entryId, pizzaiolo) {
  if (votingClosed) return;
  await setDoc(doc(db, `contests/ferragosto2025/votes/${currentUser.uid}`), {
    entryId, pizzaiolo, ts: serverTimestamp()
  });
  myVote = { entryId, pizzaiolo };
  renderCards();
}

function tallyPizzaioli() {
  let giuseppe = 0, alessio = 0;
  for (const v of votesCache) {
    if (v.pizzaiolo === 'Giuseppe') giuseppe++;
    if (v.pizzaiolo === 'Alessio') alessio++;
  }
  return { giuseppe, alessio };
}

function renderCards() {
  const wrap = document.getElementById('cards');
  wrap.innerHTML = '';
  ENTRIES.forEach(entry => {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-lg-3';
    col.innerHTML = `
      <div class="dark-card pizza-card h-100">
        <img src="${entry.img}" alt="${entry.name}">
        <h5>${entry.name}</h5>
        <div class="d-flex mt-2">
          <button class="vote-btn vote-giuseppe" onclick="vote('${entry.id}', 'Giuseppe')">Vota Giuseppe</button>
          <button class="vote-btn vote-alessio" onclick="vote('${entry.id}', 'Alessio')">Vota Alessio</button>
        </div>
      </div>
    `;
    wrap.appendChild(col);
  });
}

function renderChart() {
  const canvas = document.getElementById('resultsCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { giuseppe, alessio } = tallyPizzaioli();
  const data = [
    { name: 'Giuseppe', votes: giuseppe, color: '#ff6b6b' },
    { name: 'Alessio', votes: alessio, color: '#1dd1a1' }
  ];
  const maxVotes = Math.max(1, giuseppe, alessio);
  const barHeight = 40;
  const gap = 20;

  data.forEach((d, i) => {
    const y = i * (barHeight + gap);
    ctx.fillStyle = '#ccc';
    ctx.fillRect(0, y, canvas.width, barHeight);
    ctx.fillStyle = d.color;
    ctx.fillRect(0, y, (d.votes / maxVotes) * canvas.width, barHeight);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${d.name}: ${d.votes}`, 10, y + 25);
  });
}

function renderResults() {
  renderCards();
  renderChart();
}

function renderAll() {
  renderCards();
  renderChart();
}

window.vote = vote; // per usare onclick
