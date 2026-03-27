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
const container = document.getElementById('queue-container');
const queueSizeEl = document.getElementById('queueSize');
const pauseBtn = document.getElementById('pauseBtn');

function render() {
  container.innerHTML = '';
  [...queue.heap].forEach((item) => {
    const div = document.createElement('div');
    div.className = `order-item ${item.order.type.toLowerCase()}`;
    div.innerHTML = `${item.order.id}<br><small>${item.order.type[0]}</small>`;
    container.appendChild(div);
  });
  queueSizeEl.textContent = `Queue: ${queue.size()}`;
}

function addOrder(type) {
  const id = `${type[0]}${Date.now().toString().slice(-4)}`;
  const prio = {VIP:1, Express:2, Regular:3}[type];
  queue.enqueue({id, type}, prio);
  render();
}

function flashSale() {
  const types = ['VIP','Express','Regular'];
  for (let i = 0; i < 15; i++) {
    setTimeout(() => addOrder(types[Math.floor(Math.random() * types.length)]), i * 50);
  }
}

function processNext() {
  if (queue.isEmpty()) return;
  const frontItem = container.children[0];
  if (frontItem) frontItem.classList.add('removing');
  setTimeout(() => {
    queue.dequeue();
    render();
  }, 600);
}

function togglePause() {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume ▶️' : 'Pause ⏸️';
  pauseBtn.classList.toggle('paused', isPaused);
  if (isPaused) {
    clearInterval(autoInterval);
  } else {
    startAutoProcess();
  }
}

function startAutoProcess() {
  clearInterval(autoInterval);
  const speed = document.getElementById('speed').value;
  autoInterval = setInterval(() => {
    if (!isPaused && !queue.isEmpty()) processNext();
  }, speed);
}

document.getElementById('speed').addEventListener('input', () => {
  document.documentElement.style.setProperty('--speed-ms', `${document.getElementById('speed').value}ms`);
  if (!isPaused) startAutoProcess();
});

render();
startAutoProcess();
