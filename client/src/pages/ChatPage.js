import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { user, token, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevRoomRef = useRef(null);

  // Connect socket
  useEffect(() => {
    if (!token) return;
    socketRef.current = io('https://flashchat-server-job2.onrender.com', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on('user_status', ({ userId, isOnline }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: isOnline }));
    });

    return () => socketRef.current?.disconnect();
  }, [token]);

  // Fetch rooms
  useEffect(() => {
    axios.get('/api/rooms').then((res) => setRooms(res.data));
  }, []);

  // Join room
  const joinRoom = useCallback(async (room) => {
    if (prevRoomRef.current) {
      socketRef.current?.emit('leave_room', { roomId: prevRoomRef.current._id });
    }
    setActiveRoom(room);
    prevRoomRef.current = room;
    setMessages([]);

    const res = await axios.get(`/api/messages/${room._id}`);
    setMessages(res.data);
    socketRef.current?.emit('join_room', { roomId: room._id });
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom) return;
    socketRef.current?.emit('send_message', { roomId: activeRoom._id, content: newMessage });
    setNewMessage('');
  };

  const createRoom = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/rooms', { name: newRoomName, description: newRoomDesc });
      setRooms((prev) => [...prev, res.data]);
      setNewRoomName('');
      setNewRoomDesc('');
      setShowCreateRoom(false);
      joinRoom(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name) => name?.slice(0, 2).toUpperCase() || '??';
  const getColor = (name) => {
    const colors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22'];
    let hash = 0;
    for (let c of (name || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">⚡ FlashChat</div>
          <div className="user-info">
            <div className="user-avatar" style={{ background: getColor(user?.username) }}>
              {getInitials(user?.username)}
            </div>
            <span className="user-name">{user?.username}</span>
            <button className="logout-btn" onClick={logout} title="Logout">⎋</button>
          </div>
        </div>

        <div className="rooms-section">
          <div className="rooms-header">
            <span>Rooms</span>
            <button className="create-room-btn" onClick={() => setShowCreateRoom(!showCreateRoom)}>+</button>
          </div>

          {showCreateRoom && (
            <form onSubmit={createRoom} className="create-room-form">
              <input
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                required
              />
              <input
                placeholder="Description (optional)"
                value={newRoomDesc}
                onChange={(e) => setNewRoomDesc(e.target.value)}
              />
              {error && <div className="form-error">{error}</div>}
              <div className="form-actions">
                <button type="submit">Create</button>
                <button type="button" onClick={() => setShowCreateRoom(false)}>Cancel</button>
              </div>
            </form>
          )}

          <ul className="rooms-list">
            {rooms.map((room) => (
              <li
                key={room._id}
                className={`room-item ${activeRoom?._id === room._id ? 'active' : ''}`}
                onClick={() => joinRoom(room)}
              >
                <span className="room-hash">#</span>
                <div className="room-info">
                  <span className="room-name">{room.name}</span>
                  {room.description && <span className="room-desc">{room.description}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="chat-main">
        {activeRoom ? (
          <>
            <div className="chat-header">
              <div>
                <h2># {activeRoom.name}</h2>
                {activeRoom.description && <p>{activeRoom.description}</p>}
              </div>
              <div className="chat-header-members">{activeRoom.members?.length || 0} members</div>
            </div>

            <div className="messages-area">
              {messages.length === 0 && (
                <div className="empty-messages">
                  <span>🗨️</span>
                  <p>No messages yet. Say hello!</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id;
                const isSystem = msg.type === 'system';
                if (isSystem) {
                  return (
                    <div key={msg._id || i} className="system-message">
                      <span>{msg.content}</span>
                    </div>
                  );
                }
                return (
                  <div key={msg._id || i} className={`message ${isOwn ? 'own' : ''}`}>
                    {!isOwn && (
                      <div className="msg-avatar" style={{ background: getColor(msg.sender?.username) }}>
                        {getInitials(msg.sender?.username)}
                      </div>
                    )}
                    <div className="msg-bubble">
                      {!isOwn && <span className="msg-sender">{msg.sender?.username}</span>}
                      <p>{msg.content}</p>
                      <span className="msg-time">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="message-form">
              <input
                type="text"
                placeholder={`Message #${activeRoom.name}`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                autoFocus
              />
              <button type="submit" disabled={!newMessage.trim()}>
                <span>Send</span> ➤
              </button>
            </form>
          </>
        ) : (
          <div className="no-room">
            <div className="no-room-content">
              <span>⚡</span>
              <h2>Welcome to FlashChat</h2>
              <p>Select a room on the left to start chatting, or create a new one.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
