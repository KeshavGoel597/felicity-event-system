# Felicity Event Management System - Complete Manual

## 1. Project Overview

### 1.1 Introduction

The **Felicity Event Management System** is a comprehensive, full-stack event management platform developed for **Felicity**, IIIT Hyderabad's annual festival. This system revolutionizes event organization by providing an integrated platform for event creation, participant management, merchandise sales, real-time communication, and advanced analytics.

### 1.2 Purpose & Objectives

The system serves the following primary objectives:

- **Enable Event Organization**: Provide student clubs and councils with a user-friendly platform to create and manage events
- **Streamline Participant Registration**: Allow students to discover, register, and participate in events seamlessly
- **Merchandise Management**: Implement a robust merchandise sales workflow with payment verification and approval
- **Real-Time Communication**: Enable instant interaction between organizers and participants through discussion forums
- **Attendance Tracking**: Implement modern QR-based attendance tracking for accurate event analytics
- **Data Analytics**: Provide comprehensive insights into event performance and participant engagement
- **Payment Processing**: Manage secure payment verification and merchandise approval workflows
- **Access Control**: Implement role-based access control for three distinct user types

### 1.3 Key Features at a Glance

| Feature | Category | Status |
|---------|----------|--------|
| User Authentication | Basic | ✓ Complete |
| Event Management | Basic | ✓ Complete |
| Registration System | Basic | ✓ Complete |
| QR Code Attendance | Advanced | ✓ Implemented |
| Merchandise Workflow | Advanced | ✓ Implemented |
| Real-Time Forum | Advanced | ✓ Implemented |
| Admin Password Reset | Advanced | ✓ Implemented |
| Feedback System | Advanced | ✓ Implemented |

---

## 2. Technology Stack

### 2.1 Backend Architecture

The backend is built on Node.js with Express.js framework, providing a RESTful API architecture with real-time capabilities.

**Core Components:**

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript runtime environment |
| **Framework** | Express.js | Latest | REST API framework |
| **Database** | MongoDB | 4.4+ | NoSQL document database |
| **ODM** | Mongoose | Latest | MongoDB object modeling |
| **Real-Time** | Socket.io | Latest | WebSocket communication |
| **Authentication** | JWT | Latest | Token-based authentication |
| **Password Hash** | bcryptjs | Latest | Secure password hashing |
| **File Upload** | Multer | Latest | Multipart form handling |

**Utility Libraries:**

| Library | Purpose |
|---------|---------|
| qrcode | QR code generation for tickets |
| nodemailer | Email sending for notifications |
| json2csv | Export participant data |
| uuid | Generate unique identifiers |
| axios | HTTP requests to external services |
| dotenv | Environment configuration |
| cors | Cross-origin resource sharing |

### 2.2 Frontend Architecture

The frontend is a single-page application (SPA) built with React and Vite, providing a responsive and interactive user interface.

**Core Components:**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 18+ | UI component library |
| **Build Tool** | Vite | Fast build and dev server |
| **Routing** | React Router v6+ | Client-side navigation |
| **HTTP Client** | Axios | API communication |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Icons** | Lucide React | Beautiful SVG icons |
| **Forms** | react-hook-form | Efficient form management |
| **Validation** | Yup | Schema validation |
| **QR Scanner** | html5-qrcode | Browser-based QR scanning |
| **Dates** | date-fns | Date utilities |
| **UI Components** | @headlessui/react | Accessible components |

---

## 3. Core Features

### 3.1 Basic Features (40 marks)

#### 3.1.1 Authentication & Authorization
- **Participant Registration**: Email-based signup with validation
- **Password Security**: bcryptjs hashing with configurable salt rounds
- **JWT Authentication**: Stateless token-based auth with expiry
- **Role-Based Access Control**: Three roles - Participant, Organizer, Admin
- **Session Management**: Token refresh and logout functionality
- **Account Status**: Active/Disabled account management

#### 3.1.2 Event Management
- **Event Creation**: Draft event creation with full details
- **Event Publishing**: Workflow to publish draft events
- **Event Categories**: Organize events by domain (Technical, Cultural, Sports)
- **Event Search**: Fuzzy matching on event titles and descriptions
- **Event Status**: Automatic status determination based on current time
- **Event Deletion**: Remove events with participant restrictions
- **Event Analytics**: Registration, attendance, and completion stats

#### 3.1.3 Event Registration
- **Individual Registration**: Single-person event registration
- **Team Registration**: Multi-person team registration support
- **Registration Management**: View, modify, cancel registrations
- **Paid Events**: Payment proof submission and verification
- **Event Capacity**: Respect maximum participant limits
- **Registration Deadlines**: Enforce registration cutoff dates

#### 3.1.4 Organizer Features
- **Event Dashboard**: Overview of created events
- **Registration Viewer**: Detailed participant list with filters
- **CSV Export**: Download participant data for analysis
- **Attendance Marking**: Manual and QR-based attendance tracking
- **Event Analytics**: Detailed statistics and performance metrics
- **Discussion Management**: Moderate event discussions

#### 3.1.5 Admin Features
- **Organizer Management**: Create, update, disable, delete organizers
- **Password Reset Workflow**: Approve/reject reset requests
- **System Overview**: Dashboard with key metrics
- **Data Management**: Manage all system data

### 3.2 Advanced Features (30 marks)

#### 3.2.1 Tier A Features (8 marks each)

**Feature 1: QR Code Scanner for Attendance**
- Real-time QR code scanning using device camera
- Browser-based scanning with html5-qrcode
- Participant verification against event registration
- Manual override for mismatched event IDs
- Complete audit logging of attendance marks
- Batch attendance import/export capabilities
- Error handling and retry mechanisms
- Attendance report generation

**Feature 2: Merchandise Payment Approval Workflow**
- Participant submits payment proof (image/document)
- Organizer reviews payment proof
- Approve/Reject decision with feedback
- Stock management (decremented only on approval)
- QR code generation for approved merchandise
- Email confirmation with ticket details
- Merchandise delivery tracking

#### 3.2.2 Tier B Features (6 marks each)

**Feature 3: Real-Time Discussion Forum**
- Socket.io-powered real-time messaging
- Event-specific discussion channels
- Participants and organizers communication
- Message pinning by organizers
- Typing indicators for active participants
- User presence indicators
- Message history and persistence
- Search in messages

**Feature 4: Organizer Password Reset via Admin**
- Organizer password reset request workflow
- Request submission with reason
- Admin review and decision interface
- Temporary password generation
- Email notification with new credentials
- First-login password change requirement
- Password reset audit trail

#### 3.2.3 Tier C Features (2 marks)

**Feature 5: Anonymous Feedback & Ratings**
- 1-5 star rating system
- Optional text feedback
- Anonymous submission (no user tracking)
- Organizers view aggregated statistics
- Rating distribution charts
- Comment themes and patterns

---

## 4. System Architecture

### 4.1 Architecture Overview

The system follows a three-tier architecture:

1. **Presentation Layer**: React SPA frontend with Tailwind CSS
2. **Application Layer**: Express.js REST API with business logic
3. **Data Layer**: MongoDB database with Mongoose ODM

### 4.2 Database Schema Design

**User Collection**
- Stores all users (participants, organizers, admins)
- Password stored as bcryptjs hash
- Role-based access control
- Account status management

**Event Collection**
- Complete event information
- Organizer reference
- Registration and capacity management
- Status tracking and timeline

**Registration Collection**
- User-Event relationship
- Form responses and custom data
- Payment and merchandise status
- Attendance tracking

**Message Collection**
- Real-time discussion storage
- Event-specific messaging
- Message pinning functionality

**Feedback Collection**
- Anonymous feedback storage
- Rating and comments
- Aggregate statistics

### 4.3 API Architecture

**RESTful Design Principles:**
- Resource-based endpoints
- Standard HTTP methods
- Consistent response format
- Proper HTTP status codes

**Real-Time Architecture:**
- Socket.io for WebSocket communication
- Room-based message broadcasting
- Event-specific channels
- Real-time presence indicators

---

## 5. User Roles & Workflows

### 5.1 Participant Workflow

**Typical User Journey:**
1. Sign up with email and password
2. Complete profile with interests
3. Browse events using search and filters
4. Select event and view details
5. Register (individual or team)
6. Submit payment proof if required
7. Receive confirmation and QR code
8. Participate in event discussions
9. Attend event and get marked present
10. Receive ticket/merchandise via email
11. Submit feedback after event

**Permissions:**
- ✓ Create account
- ✓ Browse published events
- ✓ Register for events
- ✓ View own registrations
- ✓ Submit payment proofs
- ✓ Join discussions
- ✓ Submit feedback
- ✗ Create events
- ✗ Approve payments
- ✗ Manage organizers

### 5.2 Organizer Workflow

**Typical User Journey:**
1. Receive login credentials from admin
2. Login with auto-generated credentials
3. Change password on first login
4. Create new event (draft)
5. Add event details and custom fields
6. Configure merchandise and fees
7. Publish event when ready
8. Monitor registrations in real-time
9. Review and approve merchandise payments
10. At event time, scan QR codes for attendance
11. View analytics and participant feedback
12. Export data for reporting

**Permissions:**
- ✓ Create and manage events
- ✓ View registrations
- ✓ Approve merchandise
- ✓ Mark attendance
- ✓ Manage discussions
- ✓ View analytics
- ✓ Export data
- ✓ Request password reset
- ✗ Create organizers
- ✗ Manage admins

### 5.3 Admin Workflow

**Typical User Journey:**
1. Login as admin
2. Navigate to organizer management
3. Create new organizer account
4. Generate credentials
5. Share credentials with organizer
6. Monitor password reset requests
7. Review reset reasons
8. Approve/reject requests
9. Generate temporary password
10. Email credentials to organizer
11. Monitor system health

**Permissions:**
- ✓ Create organizers
- ✓ Manage organizer status
- ✓ Delete organizers
- ✓ Handle password resets
- ✓ View all events
- ✓ View all registrations
- ✓ System administration
- ✗ Create events
- ✗ Register for events
- ✗ Participate as organizer

---

## 6. Installation & Setup Guide

### 6.1 System Requirements

**Minimum Requirements:**
- Node.js v18.0 or higher
- MongoDB v4.4 or higher
- npm v9.0 or higher
- 2GB RAM
- 500MB disk space

**Recommended:**
- Node.js v20.0+
- MongoDB v6.0+
- 4GB+ RAM
- SSD storage

### 6.2 Backend Installation

**Step 1: Navigate to Backend**
```bash
cd backend
```

**Step 2: Install Dependencies**
```bash
npm install
```

**Step 3: Environment Configuration**
```bash
cp .env.example .env
```

**Step 4: Configure .env File**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/felicity

# JWT
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
JWT_EXPIRY=7d

# Frontend
FRONTEND_URL=http://localhost:5173

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**Step 5: Initialize Database**
```bash
npm run seed:admin
```

**Step 6: Start Backend**
```bash
npm run dev
```

Backend will be available at: `http://localhost:5000`

### 6.3 Frontend Installation

**Step 1: Navigate to Frontend**
```bash
cd frontend
```

**Step 2: Install Dependencies**
```bash
npm install
```

**Step 3: Environment Configuration**
```bash
cat > .env.local << EOF
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
EOF
```

**Step 4: Start Frontend**
```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 6.4 Database Setup

**MongoDB Local Setup:**
```bash
# macOS
brew services start mongodb-community

# Ubuntu/Linux
sudo systemctl start mongod

# Windows
mongod
```

**MongoDB Atlas Setup:**
1. Visit https://www.mongodb.com/cloud/atlas
2. Create account and cluster
3. Create database user
4. Get connection string
5. Add to MONGO_URI in .env

---

## 7. API Documentation

### 7.1 Authentication Endpoints

#### Sign Up
```
POST /api/auth/signup
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

Response: 200 OK
{
  "success": true,
  "token": "******",
  "user": {
    "_id": "userId",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "participant"
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "success": true,
  "token": "******",
  "user": { ... }
}
```

### 7.2 Event Endpoints

#### Browse Events
```
GET /api/events/browse?page=1&limit=10&category=Technical
Authorization: ******

Response: 200 OK
{
  "success": true,
  "events": [ ... ],
  "totalCount": 50,
  "page": 1,
  "totalPages": 5
}
```

#### Create Event
```
POST /api/organizer/events/create
Authorization: ******
Content-Type: application/json

Request:
{
  "title": "Web Development Workshop",
  "description": "Learn modern web development",
  "startTime": "2024-06-01T10:00:00Z",
  "endTime": "2024-06-01T12:00:00Z",
  "venue": "Tech Lab",
  "participantLimit": 50,
  "isPaid": true,
  "registrationFee": 100
}

Response: 201 Created
{
  "success": true,
  "event": { ... }
}
```

### 7.3 Registration Endpoints

#### Register for Event
```
POST /api/registrations/event/:eventId
Authorization: ******
Content-Type: application/json

Request:
{
  "registrationType": "individual",
  "formResponses": { ... }
}

Response: 201 Created
{
  "success": true,
  "registration": { ... }
}
```

### 7.4 QR Code Endpoints

#### Scan QR Code
```
POST /api/organizer/events/:eventId/scan-qr
Authorization: ******
Content-Type: application/json

Request:
{
  "qrCode": "EVENT_ID_QR_CODE_DATA"
}

Response: 200 OK
{
  "success": true,
  "participant": { ... },
  "marked": true
}
```

---

## 8. Security Features

### 8.1 Authentication Security
- JWT token-based authentication
- Token expiration and refresh
- Secure password hashing with bcryptjs
- Role-based access control
- Account status verification

### 8.2 Data Protection
- MongoDB parameterized queries (prevent injection)
- Input validation on all endpoints
- HTML escaping for XSS prevention
- CORS whitelist configuration
- Rate limiting on sensitive endpoints

### 8.3 Payment Security
- Payment proof verification by organizers
- No direct credit card processing
- Audit logging of all payment actions
- Stock protection (inventory decremented only on approval)

### 8.4 File Upload Security
- File type validation
- File size limits
- Virus scanning (if implemented)
- Secure storage with access control

---

## 9. Deployment Guide

### 9.1 Docker Deployment

**Backend Dockerfile**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**Frontend Dockerfile**
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 9.2 Cloud Deployment Options

**Heroku:**
- Use Procfile for startup
- Set environment variables via CLI
- Deploy via git push

**AWS:**
- Use EC2 for compute
- Use RDS or Atlas for database
- Use S3 for file storage
- Use CloudFront for CDN

**Google Cloud:**
- Use Cloud Run for serverless
- Use Cloud SQL for database
- Use Cloud Storage for files

---

## 10. Testing Guide

### 10.1 Manual Testing Scenarios

1. **User Registration & Authentication**
   - Sign up with valid email
   - Login with correct credentials
   - Reject invalid credentials
   - Verify token expiration

2. **Event Management**
   - Create event as draft
   - Publish event
   - Search events
   - View event details
   - Update event
   - Delete event

3. **Event Registration**
   - Register for event
   - Submit payment proof
   - View registration
   - Cancel registration

4. **QR Code Attendance**
   - Generate QR code
   - Scan QR code
   - Mark attendance
   - View attendance report

5. **Merchandise Workflow**
   - Submit merchandise payment
   - Approve merchandise
   - Reject merchandise
   - Receive confirmation

6. **Discussion Forum**
   - Send message
   - Pin message
   - Delete message
   - View typing indicators

7. **Admin Functions**
   - Create organizer
   - Reset organizer password
   - View system stats

### 10.2 API Testing

Use tools like Postman or curl for API testing:

```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login   -H "Content-Type: application/json"   -d '{"email":"test@example.com","password":"password"}'

# Test event creation
curl -X POST http://localhost:5000/api/organizer/events/create   -H "Authorization: ******"   -H "Content-Type: application/json"   -d '{"title":"Test Event", ...}'
```

---

## 11. Troubleshooting Guide

### 11.1 Common Issues & Solutions

**MongoDB Connection Error**
- Check if MongoDB service is running
- Verify MONGO_URI format
- Check network/firewall settings

**Email Not Sending**
- Verify EMAIL_USER and EMAIL_PASS
- Enable "Less secure app access" for Gmail
- Check spam folder
- Verify SMTP settings

**QR Code Scan Fails**
- Check camera permissions in browser
- Ensure good lighting
- Verify QR code was generated correctly
- Check browser compatibility (Chrome, Firefox, Safari)

**CORS Errors**
- Add frontend URL to FRONTEND_URL
- Check CORS middleware in backend
- Verify API requests include correct headers

**Token Expiration Issues**
- Clear browser cache
- Request new login
- Implement token refresh logic

---

## 12. Support & Contact

### 12.1 Getting Help

For technical issues and support:

**Email Support:**
- support@felicity.iiit.ac.in
- Technical queries and bug reports

**GitHub Issues:**
- https://github.com/KeshavGoel597/felicity-event-system/issues
- Feature requests and bug tracking

**Documentation:**
- Full API documentation in code comments
- Architecture diagrams in docs folder
- Setup guides for each platform

---

## 13. Version Information

- **System Version**: 1.0.0
- **Release Date**: 2024
- **Status**: Production Ready
- **Last Updated**: May 2024

---

## 14. License & Attribution

This project is proprietary software developed for IIIT Hyderabad. All rights reserved.

**© 2024 IIIT Hyderabad - Felicity Event Management System**

---

**Document Information:**
- Total Pages: This document contains comprehensive documentation
- Format: PDF (Professional Format)
- Generated: May 27, 2024
- Status: Ready for Submission
