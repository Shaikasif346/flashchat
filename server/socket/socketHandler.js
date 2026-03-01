const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Room = require('../models/Room');

const connectedUsers = new Map(); // socketId -> user info

const initSocket = (io) => {
  // Auth middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 ${socket.user.username} connected`);

    // Mark user online
    await User.findByIdAndUpdate(socket.user._id, { isOnline: true });
    connectedUsers.set(socket.id, { userId: socket.user._id, username: socket.user.username });
    io.emit('user_status', { userId: socket.user._id, isOnline: true });

    // Join a room
    socket.on('join_room', async ({ roomId }) => {
      socket.join(roomId);
      socket.currentRoom = roomId;

      const systemMsg = await Message.create({
        content: `${socket.user.username} joined the room`,
        sender: socket.user._id,
        room: roomId,
        type: 'system',
      });
      await systemMsg.populate('sender', 'username avatar');
      io.to(roomId).emit('new_message', systemMsg);
    });

    // Leave a room
    socket.on('leave_room', async ({ roomId }) => {
      socket.leave(roomId);
      const systemMsg = await Message.create({
        content: `${socket.user.username} left the room`,
        sender: socket.user._id,
        room: roomId,
        type: 'system',
      });
      await systemMsg.populate('sender', 'username avatar');
      io.to(roomId).emit('new_message', systemMsg);
    });

    // Send message
    socket.on('send_message', async ({ roomId, content }) => {
      if (!content || !content.trim()) return;
      try {
        const message = await Message.create({
          content: content.trim(),
          sender: socket.user._id,
          room: roomId,
        });
        await message.populate('sender', 'username avatar');
        io.to(roomId).emit('new_message', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ ${socket.user.username} disconnected`);
      await User.findByIdAndUpdate(socket.user._id, { isOnline: false, lastSeen: new Date() });
      connectedUsers.delete(socket.id);
      io.emit('user_status', { userId: socket.user._id, isOnline: false });
    });
  });
};

module.exports = { initSocket };
