# 🎓 Campus Fish Tank (MERN Stack)
> **A live virtual aquarium gamification platform for university courses and classrooms where each student has their own fish that grows as they complete problem sets, lab assignments, and homework!**
>
> *Made with care by Zihan* 🐠

[![Live Demo](https://img.shields.io/badge/Live%20Demo-campus--fish--tank.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://campus-fish-tank.vercel.app/#login)
[![Backend Status](https://img.shields.io/badge/Backend-Render%20Live-blue?style=for-the-badge&logo=render)](https://campus-fish-tank.onrender.com)

🚀 **Live App (Vercel):** [https://campus-fish-tank.vercel.app/#login](https://campus-fish-tank.vercel.app/#login)  
⚡ **Real-Time API Server (Render):** [https://campus-fish-tank.onrender.com](https://campus-fish-tank.onrender.com)

---

### 1. 🔐 High-Impact Faculty & Teacher Login Portal
- **Email Authentication**: Instructors can log in with their institutional email (`professor@university.edu`) or sign up with their department and university affiliation.
- **Privacy-First Direct Access**: No predefined or demo accounts. Anyone can log in with their institutional or Gmail email address.
- **One-Time Setup & Direct Login**: First-time teachers set their Name and Institute once; all future logins require only their email for immediate, passwordless entry directly into their private course tanks.
- **High-Converting Hero Section**: Features institutional metrics (*+86% On-Time Submissions, 42,000+ Lab Briefs Graded, 4.9/5 Faculty Rating*), live glowing visual accents, and educator testimonials.
- **Persistent Sessions**: Logged-in instructor session stored securely in `localStorage` with header avatar and one-click Logout.

### 2. 🎓 University Course Portal (Home Page)
- **Multi-Course Management**: Instructors and professors can create and manage aquariums for any university course (e.g. *CS 301 Algorithms*, *BIO 210 Genetics*, *STAT 200 Applied Statistics*, *ENG 102 Technical Writing*).
- **Faculty Dashboard**:
  - Live metrics for Active Courses, Total Enrolled Students, Total Homework Points, and Top Engaged Course.
  - Search filter by course code (`CS 301`), title, or department.
  - Semester filters (`All`, `Fall 2026`, `Spring 2027`, `Summer 2026`).
- **Create Course Modal**:
  - Course Code & Title
  - Department selector (Computer Science, Engineering, Mathematics, Biological Sciences, Business, etc.)
  - Term / Semester
  - Aquarium Theme & Color Gradient Customization
  - Roster Importer (paste student names or insert sample roster)
- **One-Click Launch**: Seamlessly launch into any course's live aquarium with instant navigation back to the course hub.

### 3. 🌊 Interactive 60 FPS HTML5 Canvas Aquarium
- **Dynamic Fish Growth**: Every student has a unique, colorful fish that dynamically grows larger as they complete homework assignments and earn points.
- **Top 3 Royal Crowns**:
  - 🥇 **Rank 1**: Royal 5-point Golden Crown with rubies
  - 🥈 **Rank 2**: Silver Crown with sapphires
  - 🥉 **Rank 3**: Bronze Crown with emeralds
- **Realistic Swimming Physics**: Autonomous flocking, gentle sine-wave tail fin wiggling, fluttering pectoral fins, and smooth edge-bouncing.
- **Cute Anime Aesthetic**: Expressive eyes with glossy reflections, rosy blush cheeks, opening mouths when eating, and custom skin patterns:
  - 🌸 *Floral Daisies* (as seen on Husanboy and Rayhona in the reference!)
  - ⚪ *Polka Dots*
  - 🐟 *Arched Fish Scales*
  - ✨ *Glimmering Sparkles*
  - 🌊 *Smooth Soft Shading*
- **Seabed Scenery & Animations**:
  - Center underwater grotto cave with warm internal ambient glow
  - Giant Pearl Oyster on the cliff shelf that gently opens and closes
  - Vintage Golden Pirate Treasure Chest that pops open with coins & bubbles when tapped
  - Pink and Red Coral Fans with swaying tips
  - Emerald Seaweed / Kelp undulating with the current
  - Ambient rising air bubbles with wobble physics

### 4. 🍙 Feeding & Rewards System
- **Tap Any Fish**: Drops delicious food pellets into the tank! Nearby fish sense the food and eagerly rush over to chomp it ("nom nom!").
- **Homework & Praise Presets**:
  - 📝 *Homework Completed* (+10 pts)
  - ⭐ *Extra Credit Challenge* (+15 pts)
  - 🤝 *Helping a Classmate* (+5 pts)
  - 📖 *20-Min Reading Time* (+8 pts)
  - 🎯 *100% Quiz Score* (+12 pts)
  - ✍️ *Custom Points & Reason*
- **"Feed Everyone" Celebration**: Drops a shower of food flakes across the entire tank, sending all fish into an excited feeding frenzy with celebratory chimes and badge bursts!

### 5. 🏆 Sidebar Navigation (Matches Reference Design)
- **Leaderboard Tab**:
  - Real-time ranked student list with gold/silver/bronze highlights
  - Timeframe toggles: `Today`, `7 days`, and `Calendar`
  - Day carousel (`Wed Oct 21`, `Thu Oct 22`, `Fri Oct 23`, `Today Oct 24`)
  - Clicking any student highlights and spotlights their fish in the aquarium!
- **Students Management Tab**:
  - Search filter by student name
  - Quick point reward buttons (`+1`, `+5`, `+10`)
  - Single student addition (choose custom color and pattern)
  - Batch / Bulk Roster Import (paste column directly from Google Sheets or Excel)
- **Decorate Tab**:
  - Aquarium item toggles (Treasure Chest, Giant Pearl Clam, Castle, Corals, Seaweed)
  - Collective classroom points milestone bar (e.g. 3,000 pts to unlock new reef treasures)

### 6. 🎛️ Header & Teacher Controls
- **Classroom Name**: Inline editable on click (default: `2-A SINF`)
- **Themes**:
  - 🌙 *Night Glow* (bioluminescent midnight reef with caustics and glowing corals)
  - ☀️ *Sunny Reef* (sun-drenched tropical turquoise lagoon)
  - 🌅 *Sunset Lagoon* (warm violet twilight)
- **Multi-language Support**: `EN` (English), `UZ` (Uzbek), and `ES` (Spanish)
- **Name Visibility Modes**: `Names: always`, `Names: hover`, or `Names: never`
- **Fullscreen Mode**: Optimized for classroom projectors and smartboards
- **Web Audio Sound Effects**: Ambient bubbly hum, munching "nom nom" crunches, and celebratory fanfares synthesized with the browser's Web Audio API (zero broken audio links).

---

## 🛠️ Architecture (MERN Stack)

```
├── client/                     # Frontend (React 19, Vite, Tailwind CSS v4)
│   ├── src/
│   │   ├── audio/              # Web Audio API sound synthesizer
│   │   │   └── soundEngine.js
│   │   ├── components/         # Modular UI & Canvas components
│   │   │   ├── FishTankCanvas.jsx  # 60 FPS HTML5 Canvas aquarium engine
│   │   │   ├── Header.jsx          # Top toolbar & language/theme controls
│   │   │   ├── LeaderboardTab.jsx  # Leaderboard with crowns & time filters
│   │   │   ├── StudentsTab.jsx     # Student roster & quick feed buttons
│   │   │   ├── DecorateTab.jsx     # Aquarium items & milestone progress
│   │   │   ├── FeedModal.jsx       # Individual reward popup
│   │   │   ├── AddStudentModal.jsx # Single & bulk student modal
│   │   │   └── SettingsModal.jsx   # Classroom settings & daily reset
│   │   ├── translations/       # Multi-language dictionary (EN, UZ, ES)
│   │   ├── App.jsx             # Main container with Socket.io listeners
│   │   └── index.css           # Styling, typography & animations
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend (Node.js, Express, Mongoose, Socket.io)
│   ├── models/
│   │   ├── Classroom.js        # Classroom Mongoose model
│   │   └── Student.js          # Student & feed history Mongoose model
│   ├── data/
│   │   ├── initialData.js      # Authentic seed data matching reference
│   │   └── store.js            # Resilient store (MongoDB + Zero-config JSON fallback)
│   ├── server.js               # REST API & Socket.io WebSocket server
│   └── package.json
└── README.md
```

### ⚡ Resilient Zero-Config Data Layer
- If a MongoDB instance (e.g. MongoDB Atlas or local daemon) is provided via `MONGO_URI`, the app connects to MongoDB via Mongoose.
- If MongoDB is not yet running or offline, the server seamlessly switches to a high-performance persistent local JSON store (`server/data/database.json`). This ensures the app is **100% plug-and-play** for any teacher or developer without requiring initial database setup!

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm**

### 2. Install Dependencies
In the root directory, run:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Run the Application
Open two terminal windows:

**Terminal 1 (Backend API & WebSockets):**
```bash
cd server
npm start
# Server starts on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Frontend starts on http://localhost:5173
```

Now open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 📡 REST API & WebSocket Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/classroom` | Get classroom details and decorations |
| `PUT` | `/api/classroom` | Update classroom name, theme, or settings |
| `GET` | `/api/students` | Get all students sorted by score |
| `POST` | `/api/students` | Add a new student |
| `POST` | `/api/students/bulk` | Bulk import an array of student names |
| `POST` | `/api/students/:id/feed` | Award points & feed a specific fish |
| `POST` | `/api/students/feed-all` | Whole-classroom feeding reward |
| `PUT` | `/api/students/:id` | Update student profile or fish styling |
| `DELETE`| `/api/students/:id` | Remove student from aquarium |
| `POST` | `/api/decorations/:id/toggle` | Toggle decoration visibility |
| `POST` | `/api/students/reset-today` | Reset daily points to 0 |

### Real-Time WebSocket Events (Socket.io)
- `fish:fed`: Broadcasts point awards and feeding drops to all connected screens (smartboards, projector, teacher tablet).
- `fish:fed_all`: Triggers whole-class food storm.
- `classroom:updated`: Syncs theme and classroom name changes immediately.
