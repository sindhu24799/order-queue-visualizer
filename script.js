class PriorityQueue {
  constructor() { this.heap = []; }
  enqueue(order, priority) {
    this.heap.push({order, priority});
    this._siftUp(this.heap.length - 1);
  }
  dequeue() {
    if (this.isEmpty()) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (!this.isEmpty()) {
      this.heap[0] = bottom;
      this._siftDown(0);
    }
    return top;
  }
  peek() { return this.isEmpty() ? null : this.heap[0]; }
  size() { return this.heap.length; }
  isEmpty() { return this.heap.length === 0; }
  _parent(i) { return Math.floor((i - 1) / 2); }
  _left(i) { return 2 * i + 1; }
  _right(i) { return 2 * i + 2; }
  _swap(i, j) { [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]]; }
  _siftUp(i) {
    while (i > 0 && this.heap[this._parent(i)].priority > this.heap[i].priority) {
      this._swap(i, this._parent(i));
      i = this._parent(i);
    }
  }
  _siftDown(i) {
    const n = this.heap.length;
    let child = this._left(i);
    while (child < n) {
      const right = this._right(i);
      if (right < n && this.heap[right].priority < this.heap[child].priority) child = right;
      if (this.heap[i].priority <= this.heap[child].priority) break;
      this._swap(i, child);
      i = child; child = this._left(i);
    }
  }
}

const queue = new PriorityQueue();
let isPaused = false;
let autoInterval = null;
let processedCount = 0;
let totalWaitTime = 0;
let orderCount = 0;
let audioCtx = null;

const container = document.getElementById('queue-container');
const queueSizeEl = document.getElementById('queueSize');
const pauseBtn = document.getElementById('pauseBtn');
const processedEl = document.getElementById('processedCount');
const waitTimeEl = document.getElementById('waitTime');
const needleEl = document.getElementById('needle');
const speedValEl = document.getElementById('speedVal');

function saveQueue() {
  localStorage.setItem('orderQueue', JSON.stringify(queue.heap.map(h => ({...h.order, priority: h.priority}))));
  localStorage.setItem('stats', JSON.stringify({processedCount, totalWaitTime, orderCount}));
}

function loadQueue() {
  const savedQueue = localStorage.getItem('orderQueue');
  const savedStats = localStorage.getItem('stats');
  if (savedQueue) {
    JSON.parse(savedQueue).forEach(item => queue.enqueue(item, item.priority));
  }
  if (savedStats) {
    const stats = JSON.parse(savedStats);
    processedCount = stats.processedCount;
    totalWaitTime = stats.totalWaitTime;
    orderCount = stats.orderCount;
  }
  updateStats();
}

function playPop() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.frequency.value = 800; osc.type = 'sine';
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.1);
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

function updateSpeedometer(speed) {
  const deg = Math.max(0, Math.min(360, (2000 - speed) / 2000 * 360));
  document.documentElement.style.setProperty('--speed-deg', `${deg}deg`);
  needleEl.style.transform = `translate(-50%, -100%) rotate(${deg - 90}deg)`;
  speedValEl.textContent = `${speed}ms`;
}

function updateStats() {
  processedEl.textContent = `Processed: ${processedCount}`;
  const avgWait = orderCount > 0 ? Math.round(totalWaitTime / orderCount) : 0;
  waitTimeEl.textContent = `Avg Wait: ${avgWait}s`;
  queueSizeEl.textContent = `Queue: ${queue.size()}`;
}

function render() {
  container.innerHTML = '';
  [...queue.heap].forEach((item) => {
    const div = document.createElement('div');
    div.className = `order-item ${item.order.type.toLowerCase()}`;
    div.innerHTML = `${item.order.id}<br><small>${item.order.type[0]}</small>`;
    container.appendChild(div);
  });
  updateStats();
}

function addOrder(type) {
  const id = `${type[0]}${Date.now().toString().slice(-4)}`;
  const prio = {VIP:1, Express:2, Regular:3}[type];
  queue.enqueue({id, type}, prio);
  orderCount++;
  render();
  saveQueue();
}

function flashSale() {
  const types = ['VIP','Express','Regular'];
  for (let i = 0; i < 15; i++) {
    setTimeout(() => addOrder(types[Math.floor(Math.random() * types.length)]), i * 50);
  }
}

function processNext() {
  if (queue.isEmpty()) return;
  const item = queue.peek();
  const frontItem = container.children[0];
  if (frontItem) frontItem.classList.add('removing');
  setTimeout(() => {
    queue.dequeue();
    processedCount++;
    // Simulate wait time (entry to process)
    const wait = Math.floor(Math.random() * 10) + 1;
    totalWaitTime += wait;
    playPop();
    render();
    saveQueue();
  }, 600);
}

function togglePause() {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume ▶️' : 'Pause ⏸️';
  pauseBtn.classList.toggle('paused', isPaused);
  if (isPaused) clearInterval(autoInterval);
  else startAutoProcess();
}

function startAutoProcess() {
  clearInterval(autoInterval);
  const speed = document.getElementById('speed').value;
  updateSpeedometer(speed);
  autoInterval = setInterval(() => {
    if (!isPaused && !queue.isEmpty()) processNext();
  }, speed);
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  loadQueue();
  render();
  const speedSlider = document.getElementById('speed');
  speedSlider.addEventListener('input', () => {
    if (!isPaused) startAutoProcess();
  });
  startAutoProcess();
});