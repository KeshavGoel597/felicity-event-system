# Felicity Event Management System

A full-stack event management platform for **Felicity** (IIIT Hyderabad's annual fest), built with the **MERN stack** (MongoDB, Express.js, React, Node.js).

---

## Tech Stack

### Backend
| Library | Purpose |
|---------|---------|
| Express.js | Web framework / REST API |
| Mongoose | MongoDB ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT authentication |
| socket.io | Real-time WebSocket communication |
| multer | File upload handling |
| qrcode | QR code generation for tickets |
| json2csv | CSV export of participants |
| nodemailer | Email notifications |
| uuid | Unique ticket ID generation |
| dotenv | Environment variable management |
| cors | Cross-origin resource sharing |
| axios | HTTP client (Discord webhooks) |

### Frontend
| Library | Purpose |
|---------|---------|
| React (Vite) | UI framework with fast dev server |
| React Router DOM | Client-side routing |
| Axios | HTTP client for API calls |
| Tailwind CSS | Utility-first CSS framework |
| Lucide React | Icon library |
| html5-qrcode | QR code scanner (camera) |
| date-fns | Date formatting utilities |
| react-hook-form | Form handling |
| yup | Form validation |
| @headlessui/react | Accessible UI components |

---

## Advanced Features (30 marks)

### Tier A (8 marks each)
1. **QR Code Scanner for Attendance** — Organizers scan participant QR codes to mark attendance. Includes manual override for mismatched event IDs with full audit logging.
2. **Merchandise Payment Approval Workflow** — Participants submit payment proof, organizers approve/reject. Stock is decremented only upon approval. QR code ticket is generated and emailed after approval.

### Tier B (6 marks each)
3. **Real-Time Discussion Forum** — Socket.io-powered real-time messaging per event. Participants and organizers can chat, with message pinning for organizers and typing indicators.
4. **Organizer Password Reset via Admin** — Organizers request password resets with a reason. Admins approve/reject. On approval, a temporary password is generated and emailed.

### Tier C (2 marks)
5. **Anonymous Feedback & Ratings** — Participants submit anonymous feedback (1–5 star rating + optional text). Organizers see aggregate stats without knowing who submitted.

---

## Project Structure

```
felicity-event-system/
├── backend/
│   ├── config/          # Database, socket.io setup
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, file upload middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── seeds/           # Admin seeder
│   ├── uploads/         # Uploaded files (payment proofs)
│   ├── utils/           # Email, QR, Discord services
│   └── server.js        # Entry point
├── frontend/
│   ├── public/          # Static assets
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── contexts/    # React context (Auth)
│       ├── pages/       # Page components
│       ├── services/    # API service layer
│       ├── utils/       # Helper functions
│       └── App.jsx      # Root component with routes
├── deployment.txt       # Deployment URLs
└── README.md            # This file
```

---

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # Configure environment variables
npm run seed:admin      # Create admin account
npm run dev             # Start development server (port 5000)
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev             # Start development server (port 5173)
```

### Environment Variables (backend/.env)
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/felicity
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Participant** | Browse events, register, pay for merchandise, view tickets/QR codes, submit feedback, join discussions |
| **Organizer** | Create/manage events, view registrations, export CSV, scan QR for attendance, approve payments, manage discussions |
| **Admin** | Manage organizers (create/disable/delete), view all events, handle password reset requests |

---

## API Routes

- `POST /api/auth/signup` — Participant signup
- `POST /api/auth/login` — Participant login
- `POST /api/auth/organizer/login` — Organizer login
- `POST /api/auth/admin/login` — Admin login
- `GET /api/events/browse` — Browse published events
- `POST /api/registrations/event/:eventId` — Register for event
- `POST /api/registrations/merchandise/:eventId` — Purchase merchandise
- `POST /api/organizer/events/create` — Create event (draft)
- `POST /api/organizer/events/:eventId/publish` — Publish event
- `POST /api/organizer/events/:eventId/scan-qr` — QR attendance scan

---