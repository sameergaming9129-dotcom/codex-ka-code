const socket = io();

const joinModal = document.getElementById('joinModal');
const joinForm = document.getElementById('joinForm');
const usernameInput = document.getElementById('username');
const roomInput = document.getElementById('roomId');
const roomLabel = document.getElementById('roomLabel');
const onlineUsers = document.getElementById('onlineUsers');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');

let currentUser = '';

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

const appendSystemMessage = (text, time) => {
  const item = document.createElement('div');
  item.className = 'system';
  item.textContent = `${text} · ${formatTime(time)}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
};

const appendChatMessage = ({ sender, text, time }) => {
  const bubble = document.createElement('div');
  bubble.className = `message ${sender === currentUser ? 'self' : 'other'}`;

  bubble.innerHTML = `
    <div><strong>${sender}</strong></div>
    <div>${text}</div>
    <div class="meta">${formatTime(time)}</div>
  `;

  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
};

joinForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  const roomId = roomInput.value.trim().toLowerCase();
  if (!username || !roomId) return;

  currentUser = username;
  roomLabel.textContent = `#${roomId}`;
  joinModal.classList.add('hidden');

  socket.emit('join-room', { username, roomId });
});

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  socket.emit('send-message', text);
  messageInput.value = '';
});

socket.on('chat-history', (history) => {
  messages.innerHTML = '';
  history.forEach(appendChatMessage);
});

socket.on('new-message', appendChatMessage);
socket.on('system-message', ({ text, time }) => appendSystemMessage(text, time));

socket.on('online-users', (users) => {
  onlineUsers.innerHTML = '';
  users.forEach((name) => {
    const li = document.createElement('li');
    li.textContent = name;
    onlineUsers.appendChild(li);
  });
});
