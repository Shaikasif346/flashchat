# ⚡ FlashChat

A full-stack real-time chat application built with **React**, **Node.js**, **Socket.io**, and **MongoDB**.

![FlashChat Preview](https://via.placeholder.com/800x450/0d0f14/5865f2?text=FlashChat+Preview)

## ✨ Features

- 🔐 **User Authentication** — Register and login with JWT tokens
- 💬 **Real-Time Messaging** — Instant message delivery via WebSockets
- 🏠 **Chat Rooms** — Create and join public rooms
- 📜 **Message History** — Persisted messages loaded from MongoDB
- 🟢 **Online Status** — See who's currently online
- 🎨 **Dark UI** — Sleek, modern dark theme

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Backend | Node.js, Express |
| Real-Time | Socket.io |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Styling | Custom CSS |

## 📁 Project Structure

```
flashchat/
├── client/                   # React frontend
│   └── src/
│       ├── context/          # Auth context
│       ├── hooks/            # Custom hooks (useSocket)
│       ├── pages/            # AuthPage, ChatPage
│       └── App.js
├── server/                   # Node.js backend
│   ├── models/               # User, Room, Message schemas
│   ├── routes/               # REST API routes
│   ├── middleware/           # JWT auth middleware
│   ├── socket/               # Socket.io event handlers
│   └── index.js
├── package.json              # Root scripts (runs both)
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/flashchat.git
cd flashchat

# 2. Install all dependencies
npm run install:all

# 3. Set up server environment variables
cp server/.env.example server/.env
# Edit server/.env with your values

# 4. Start both client and server
npm run dev
```

The app will be running at:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000

### Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your-super-secret-jwt-key
CLIENT_URL=http://localhost:3000
```

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Sign in | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/rooms` | List all rooms | Yes |
| POST | `/api/rooms` | Create a room | Yes |
| POST | `/api/rooms/:id/join` | Join a room | Yes |
| GET | `/api/messages/:roomId` | Get room messages | Yes |

## ⚡ Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_room` | Client → Server | Join a chat room |
| `leave_room` | Client → Server | Leave a chat room |
| `send_message` | Client → Server | Send a message |
| `new_message` | Server → Client | Receive a message |
| `user_status` | Server → Client | User online/offline update |

## 🚢 Deployment

### Backend (Render / Railway)
1. Set environment variables in dashboard
2. Set build command: `npm install`
3. Set start command: `node index.js`

### Frontend (Vercel / Netlify)
1. Set build command: `npm run build`
2. Set publish directory: `build`
3. Update the Socket.io server URL in `ChatPage.js` to your deployed backend URL

## 🗺 Roadmap

- [ ] Direct messaging (DMs)
- [ ] File/image sharing
- [ ] Message reactions
- [ ] Typing indicators
- [ ] Push notifications
- [ ] Mobile app (React Native)

## 📄 License

MIT — feel free to use this project however you like.

---

Built with ❤️ using React + Socket.io
