# Felicity Event Management System - Complete Manual

## 1. Project Overview

The **Felicity Event Management System** is a comprehensive, full-stack event management platform designed for **Felicity** - IIIT Hyderabad's annual festival. This system enables seamless event organization, participant registration, merchandise management, real-time communication, and advanced analytics.

### 1.1 Key Objectives

- Enable event organizers (student clubs/councils) to create and manage events
- Allow participants to browse, register, and participate in events
- Support merchandise sales with approval workflows
- Provide real-time discussion forums for event participants
- Implement QR-based attendance tracking
- Enable secure payment processing and management
- Provide comprehensive analytics and reporting
- Maintain data security and access control

### 1.2 Platform Architecture

The system is built using the **MERN Stack** (MongoDB, Express.js, React, Node.js), providing a scalable, modern web application architecture.

---

## 2. Technology Stack

### 2.1 Backend Technologies

| Technology | Purpose |
|-----------|---------|
| Node.js + Express.js | Web framework & REST API |
| MongoDB + Mongoose | Database & ODM |
| Socket.io | Real-time communication |
| JWT | Authentication |
| bcryptjs | Password security |
| Multer | File upload handling |
| QR Code | QR code generation |
| Nodemailer | Email notifications |

### 2.2 Frontend Technologies

| Technology | Purpose |
|-----------|---------|
| React (Vite) | UI framework |
| React Router DOM | Client-side routing |
| Axios | HTTP client |
| Tailwind CSS | Styling framework |
| Lucide React | Icon library |
| html5-qrcode | QR scanner |

---

## 3. Core Features

### 3.1 Basic Features (40 marks)

- Authentication & Authorization
- Event Management (Creation, Publishing, Search)
- Event Registration (Individual & Team)
- Organizer Features (Dashboard, Analytics, CSV Export)
- Admin Features (User Management, Password Reset)

### 3.2 Advanced Features (30 marks)

**Tier A (8 marks each):**
- QR Code Scanner for Attendance
- Merchandise Payment Approval Workflow

**Tier B (6 marks each):**
- Real-Time Discussion Forum
- Organizer Password Reset via Admin

**Tier C (2 marks):**
- Anonymous Feedback & Ratings

---

## 4. User Roles & Workflows

### 4.1 Participant
- Browse and search events
- Register for events
- Submit payment proofs
- Purchase merchandise
- Participate in discussions
- Submit feedback
- View tickets and QR codes

### 4.2 Organizer
- Create and manage events
- View registrations
- Mark attendance via QR
- Approve merchandise payments
- Manage discussions
- View analytics
- Export participant data

### 4.3 Admin
- Create organizers
- Manage user status
- Handle password resets
- View system analytics

---

## 5. Installation & Setup

### 5.1 Prerequisites
- Node.js v18+
- MongoDB v4.4+
- npm v9+

### 5.2 Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with configuration
npm run seed:admin
npm run dev
```

### 5.3 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 6. API Endpoints

### Authentication
- `POST /api/auth/signup` - Participant registration
- `POST /api/auth/login` - Participant login
- `POST /api/auth/organizer/login` - Organizer login
- `POST /api/auth/admin/login` - Admin login

### Events
- `GET /api/events/browse` - Browse events
- `POST /api/organizer/events/create` - Create event
- `POST /api/organizer/events/:id/publish` - Publish event

### Registrations
- `POST /api/registrations/event/:eventId` - Register for event
- `GET /api/registrations/my-registrations` - View registrations

### QR & Attendance
- `POST /api/organizer/events/:eventId/scan-qr` - Scan QR code
- `GET /api/registrations/:id/qr-code` - Get QR code

---

## 7. Security Features

- JWT Token-Based Authentication
- Password Hashing with bcryptjs
- Role-Based Access Control
- Input Validation
- CORS Protection
- Rate Limiting
- Audit Logging

---

## 8. Deployment

Supports deployment on:
- Heroku
- Docker Containers
- AWS, GCP, DigitalOcean
- Traditional VPS

---

## 9. Testing & Troubleshooting

### Common Issues

- **MongoDB Connection**: Verify MongoDB is running and MONGO_URI is correct
- **Email Not Sending**: Check EMAIL_USER and EMAIL_PASS credentials
- **QR Scan Fails**: Ensure camera permissions and browser compatibility
- **CORS Errors**: Verify FRONTEND_URL in environment

---

## 10. Support

For technical support:
- Email: support@felicity.iiit.ac.in
- GitHub Issues: https://github.com/KeshavGoel597/felicity-event-system/issues

---

**Felicity Event Management System © 2024 IIIT Hyderabad**
