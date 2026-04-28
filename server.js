const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      messages: [],
      users: new Map()
    });
  }
  return rooms.get(roomId);
}

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, username }) => {
    const safeRoomId = (roomId || 'general').trim().toLowerCase();
    const safeUsername = (username || 'Anonymous').trim().slice(0, 24) || 'Anonymous';

    socket.join(safeRoomId);
    socket.data.roomId = safeRoomId;
    socket.data.username = safeUsername;

    const room = getRoom(safeRoomId);
    room.users.set(socket.id, safeUsername);

    socket.emit('chat-history', room.messages);

    io.to(safeRoomId).emit('system-message', {
      text: `${safeUsername} joined the chat`,
      time: new Date().toISOString()
    });

    io.to(safeRoomId).emit('online-users', Array.from(room.users.values()));
  });

  socket.on('send-message', (text) => {
    const roomId = socket.data.roomId;
    const username = socket.data.username;
    if (!roomId || !username) return;

    const cleanText = String(text || '').trim();
    if (!cleanText) return;

    const room = getRoom(roomId);
    const message = {
      sender: username,
      text: cleanText.slice(0, 500),
      time: new Date().toISOString()
    };

    room.messages.push(message);
    if (room.messages.length > 200) room.messages.shift();

    io.to(roomId).emit('new-message', message);
  });

  socket.on('disconnect', () => {
    const { roomId, username } = socket.data;
    if (!roomId || !username || !rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    room.users.delete(socket.id);

    io.to(roomId).emit('system-message', {
      text: `${username} left the chat`,
      time: new Date().toISOString()
    });

    io.to(roomId).emit('online-users', Array.from(room.users.values()));

    if (room.users.size === 0 && room.messages.length === 0) {
      rooms.delete(roomId);
    }
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Chat app running on http://localhost:${PORT}`);
});
