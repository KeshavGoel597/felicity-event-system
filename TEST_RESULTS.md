# Manual Testing Results

**Date:** February 17, 2026  
**Tester:** Keshav Goel  
**Deadline:** February 19, 2026

---

## Authentication Tests (§4)

| Test ID | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| AUTH-1 | Signup with IIIT email | ⬜ Not Tested | |
| AUTH-2 | Signup with Non-IIIT email | ⬜ Not Tested | |
| AUTH-3 | Login as Participant | ⬜ Not Tested | |
| AUTH-4 | Login as Organizer | ⬜ Not Tested | |
| AUTH-5 | Login as Admin | ⬜ Not Tested | |
| AUTH-6 | Session persistence | ⬜ Not Tested | |

---

## Onboarding Tests (§5)

| Test ID | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| ONB-1 | Select areas of interest | ⬜ Not Tested | |
| ONB-2 | Follow clubs | ⬜ Not Tested | |
| ONB-3 | Skip onboarding | ⬜ Not Tested | |

---

## Admin Tests (§11)

| Test ID | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| ADM-1 | View dashboard stats | ⬜ Not Tested | |
| ADM-2 | Create organizer | ⬜ Not Tested | |
| ADM-3 | Disable/Enable organizer | ⬜ Not Tested | |
| ADM-4 | Password reset approval | ⬜ Not Tested | |

---

## Organizer Tests (§10)

| Test ID | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| ORG-1 | View dashboard | ⬜ Not Tested | |
| ORG-2 | Create event (Draft) | ⬜ Not Tested | |
| ORG-3 | Publish event | ⬜ Not Tested | |
| ORG-4 | Custom registration form | ⬜ Not Tested | |
| ORG-5 | View participants | ⬜ Not Tested | |
| ORG-6 | Export CSV | ⬜ Not Tested | |
| ORG-7 | Request password reset | ⬜ Not Tested | |

---

## Participant Tests (§9)

| Test ID | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| PAR-1 | Browse events | ⬜ Not Tested | |
| PAR-2 | Search events | ⬜ Not Tested | |
| PAR-3 | Filter by category | ⬜ Not Tested | |
| PAR-4 | Filter by eligibility | ⬜ Not Tested | |
| PAR-5 | Register for event | ⬜ Not Tested | |
| PAR-6 | Receive email with QR | ⬜ Not Tested | |
| PAR-7 | View ticket | ⬜ Not Tested | |
| PAR-8 | Cancel registration | ⬜ Not Tested | |
| PAR-9 | Follow/Unfollow clubs | ⬜ Not Tested | |
| PAR-10 | Update profile | ⬜ Not Tested | |

---

## Advanced Feature: QR Scanner (Tier A - 8 marks)

| Test ID | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| QR-1 | Open QR scanner | ⬜ Not Tested | |
| QR-2 | Scan valid QR code | ⬜ Not Tested | |
| QR-3 | View attendance list | ⬜ Not Tested | |
| QR-4 | Prevent duplicate check-in | ⬜ Not Tested | |

---

## Advanced Feature: Payment Approval (Tier A - 8 marks)

| Test ID | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| PAY-1 | Create event with merchandise | ⬜ Not Tested | |
| PAY-2 | Purchase merchandise | ⬜ Not Tested | |
| PAY-3 | Upload payment proof | ⬜ Not Tested | |
| PAY-4 | Approve payment | ⬜ Not Tested | |
| PAY-5 | Reject payment | ⬜ Not Tested | |

---

## Advanced Feature: Password Reset (Tier B - 6 marks)

| Test ID | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| RST-1 | Request password reset | ⬜ Not Tested | |
| RST-2 | Admin approves reset | ⬜ Not Tested | |
| RST-3 | Organizer receives temp password | ⬜ Not Tested | |
| RST-4 | Login with temp password | ⬜ Not Tested | |

---

## Advanced Feature: Discussion Forum (Tier B - 6 marks)

| Test ID | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| DIS-1 | Send message | ⬜ Not Tested | |
| DIS-2 | Real-time message sync | ⬜ Not Tested | |
| DIS-3 | Organizer participation | ⬜ Not Tested | |
| DIS-4 | Pin message | ⬜ Not Tested | |
| DIS-5 | Delete message | ⬜ Not Tested | |

---

## Advanced Feature: Anonymous Feedback (Tier C - 2 marks)

| Test ID | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| FDB-1 | Submit feedback for completed event | ⬜ Not Tested | |
| FDB-2 | Feedback is anonymous | ⬜ Not Tested | |
| FDB-3 | Organizer views feedback | ⬜ Not Tested | |

---

## Summary

**Total Tests:** TBD  
**Passed:** 0  
**Failed:** 0  
**Not Tested:** TBD

**Critical Issues:** 0  
**Major Issues:** 0  
**Minor Issues:** 0

---

## Testing Environment

- **Backend URL:** http://localhost:5000
- **Frontend URL:** http://localhost:3000
- **Database:** MongoDB Atlas (felicity_db)
- **Admin Credentials:** admin@felicity.iiit.ac.in / admin123
- **Node Version:** 22.14.0
- **React Version:** 19.2.0

---

## Legend

- ✅ = Passed
- ❌ = Failed
- ⚠️ = Passed with issues
- ⬜ = Not tested yet
