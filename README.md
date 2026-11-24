# 💬 WhatsApp Web Clone (Full-Stack)

A feature-rich, production-ready WhatsApp Web clone built with **React 18**, **TypeScript**, **Tailwind CSS**, **Node.js / Express**, **Socket.IO**, **WebRTC**, and **PostgreSQL (via Prisma ORM)**.

Includes real-time messaging, group chats, typing indicators, online/offline presence, message read receipts (blue ticks), in-chat search, voice note recording & waveform playback, and peer-to-peer WebRTC audio/video calling.

---

## 🚀 Key Features

### 💬 Messaging & Chats
- **1-on-1 Chats:** Start instant conversations with any registered user.
- **Group Chats:** Create groups with custom subjects, participant selection with removable chips, and a group details info drawer.
- **Rich Media Sharing:** Upload and send photos and images with an interactive modal lightbox preview.
- **Emoji Picker:** Integrated emoji selector with quick reactions.

### ⚡ Real-Time Socket.IO Collaboration
- **Live Typing Indicators:** WhatsApp-style *"typing..."* animation appearing in the chat list and chat header.
- **Presence & Online Status:** Real-time online/offline indicator for active contacts.
- **Read Receipts:** Dynamic status ticks:
  - 🕒 Pending (clock icon)
  - ✔️ Sent (single grey check)
  - ✔️ Delivered (double grey check)
  - 🔵 Read (double blue check when recipient views the conversation)

### 🎙️ Browser Voice Notes
- **Interactive Audio Recording:** WhatsApp-style recording bar with live duration timer, pulsing recording dot, cancel button, and instant send.
- **Custom Voice Note Player:** Waveform visualization, play/pause controls, elapsed duration counter, and playback speed toggles (1x, 1.5x, 2x).

### 📞 WebRTC 1-on-1 Audio & Video Calling
- **Peer-to-Peer Calling:** High-quality voice and video calling powered by browser `RTCPeerConnection`.
- **STUN + OpenRelay TURN:** Traversal across NATs, firewalls, and Wi-Fi networks with client isolation.
- **Call Controls:** Microphone mute/unmute, camera toggle, and call minimize/picture-in-picture widget.
- **Web Audio Ringtones:** Synthesized browser ringtones for incoming and outgoing ringing states without external audio assets.

### 🔍 In-Chat Message Search
- **Instant Search Bar:** WhatsApp-style search drawer in chat header with auto-focus.
- **Substring Highlighting:** Matches are highlighted in the message feed with match counter (`2 of 5`) and Up/Down chevron navigation smoothly scrolling each result into view.

### 👤 Profile Settings
- **Profile Drawer:** Slide-out drawer to view and edit display name, "About" status, and profile avatar.
- **Live Avatar Uploads:** Upload profile pictures with immediate real-time broadcast to all connected contacts.

### 🎨 WhatsApp Web UI & Theming
- **Exact WhatsApp Design:** Authentic green branding (`#00a884`), chat bubble styling, and layout.
- **Dark / Light Theme:** Instant theme switching stored in `localStorage`.
- **LAN & Cross-Device Ready:** Automatically detects host IP address for testing across multiple laptops and mobile devices on the same Wi-Fi network.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Axios |
| **Backend** | Node.js, Express, TypeScript, Socket.IO, Multer, Helmet, Morgan, Zod |
| **Database** | PostgreSQL, Prisma ORM (schema migrations & seeding) |
| **Real-Time & RTC** | Socket.IO (WebSockets), WebRTC (`RTCPeerConnection`), Google STUN, OpenRelay TURN |
| **Deployment** | Vercel / Netlify (Frontend), Render (Backend), Neon (Database) |

---

## 📁 Repository Structure

```text
whatsapp-clone/
├── client/                     # React Frontend SPA (Vite + Tailwind CSS)
│   ├── public/
│   │   └── _redirects          # SPA fallback for Netlify deployments
│   ├── src/
│   │   ├── components/         # Chat, Sidebar, Auth, and Layout components
│   │   ├── context/            # AuthContext, SocketContext, WebRTCContext, ThemeContext
│   │   ├── services/           # Axios API instance with JWT interceptors
│   │   └── types/              # TypeScript interfaces for Chat, Message, User
│   ├── .env.example            # Client environment variables documentation
│   ├── vercel.json             # SPA routing rewrite for Vercel deployments
│   └── vite.config.ts
├── server/                     # Express & Socket.IO Backend API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (User, Chat, Message, ChatParticipant)
│   │   └── seed.ts             # Demo users & test conversation seed data
│   ├── src/
│   │   ├── config/             # Prisma client & database health check
│   │   ├── controllers/        # Auth, Chat, User, and Upload controllers
│   │   ├── middlewares/        # JWT Authentication middleware
│   │   ├── routes/             # REST endpoints (/api/auth, /api/chats, etc.)
│   │   ├── sockets/            # Real-time message, status & WebRTC signaling
│   │   └── server.ts           # Express & Socket.IO server setup with CORS
│   ├── uploads/                # Dynamic uploaded media files (gitignored)
│   ├── .env.example            # Server environment variables documentation
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

---

## 💻 Local Setup & Development

### 1. Prerequisites
- **Node.js** v18+ and **npm**
- A **PostgreSQL** database (local Postgres instance or free [Neon](https://neon.tech) cloud database)

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/whatsapp-clone.git
cd whatsapp-clone
```

### 3. Install Dependencies
```bash
# Install root, backend, and frontend packages
npm install
npm --prefix server install
npm --prefix client install
```

### 4. Configure Backend Environment
Copy the example environment file in `server/`:
```bash
cp server/.env.example server/.env
```
Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
DATABASE_URL="postgresql://user:password@localhost:5432/whatsapp_clone?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
```

### 5. Run Database Migrations & Seed Demo Users
```bash
npm --prefix server run prisma:migrate
npm --prefix server run prisma:seed
```
*The database will be populated with 4 preconfigured demo users:*
- **Alice Johnson** (`alice@whatsapp.dev` / `Password123!`)
- **Bob Smith** (`bob@whatsapp.dev` / `Password123!`)
- **Charlie Brown** (`charlie@whatsapp.dev` / `Password123!`)
- **Diana Prince** (`diana@whatsapp.dev` / `Password123!`)

### 6. Start Development Servers
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
npm --prefix server run dev
```
*Backend runs on `http://localhost:5000` (and `http://<your-lan-ip>:5000`).*

**Terminal 2 (Frontend Client):**
```bash
npm --prefix client run dev
```
*Frontend runs on `http://localhost:3000` (and `http://<your-lan-ip>:3000`).*

Open `http://localhost:3000` in your browser. You can click any **Demo Login** chip to sign in instantly with one click.

---

## 🌐 Free Cloud Hosting Deployment Guide

### Step 1: Database on Neon PostgreSQL (Free Tier)
1. Sign up at [neon.tech](https://neon.tech) and create a new project.
2. Under **Dashboard > Connection Details**, select **Prisma** or **PostgreSQL** and copy your `DATABASE_URL` connection string:
   ```env
   DATABASE_URL="postgresql://<user>:<password>@<endpoint>.neon.tech/neondb?sslmode=require"
   ```

---

### Step 2: Backend on Render (Free Web Service)
1. Push your repository to GitHub.
2. Sign up at [render.com](https://render.com) and click **New > Web Service**.
3. Connect your GitHub repository and configure:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
4. Add the following **Environment Variables** in Render:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *Your Neon PostgreSQL connection string* |
   | `JWT_SECRET` | *A random 32+ character string* |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | `https://your-app.vercel.app` *(update once frontend is deployed)* |
5. Click **Deploy**. Note your backend URL (e.g., `https://whatsapp-clone-backend.onrender.com`).
6. Run Prisma migration on Render:
   - Go to Render **Shell** tab and run: `npx prisma migrate deploy && npm run prisma:seed`.

---

### Step 3: Frontend on Vercel or Netlify (Free Tier)

#### Option A: Deploy on Vercel
1. Sign up at [vercel.com](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In **Environment Variables**, add:
   ```env
   VITE_API_URL=https://whatsapp-clone-backend.onrender.com
   ```
5. Click **Deploy**. Vercel will build the SPA and use the included `client/vercel.json` rewrite rule to support single-page routing without 404 errors.

#### Option B: Deploy on Netlify
1. Sign up at [netlify.com](https://netlify.com) and click **Add new site > Import an existing project**.
2. Select your repository and set:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Add Environment Variable:
   ```env
   VITE_API_URL=https://whatsapp-clone-backend.onrender.com
   ```
4. Click **Deploy Site**. The included `client/public/_redirects` ensures all routes redirect to `/index.html` cleanly.

*After deploying the frontend, update `CLIENT_URL` in Render environment variables with your deployed frontend URL so CORS allows requests.*

---

## 🔒 Security Best Practices
- **Environment Isolation:** `.env` files are excluded from Git via `.gitignore`.
- **JWT Protection:** State-checked Bearer token verification on all protected endpoints and Socket.IO handshake connections.
- **Input Validation:** Request payload schema validation powered by **Zod**.
- **CORS Protection:** Dynamic origin validation for trusted localhost, private LAN IPv4 ranges, and production domains.
- **Media Sanitization:** File-type filtering on uploads (images and audio only) with size limits.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
