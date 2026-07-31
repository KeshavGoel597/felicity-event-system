# Testing Issues Log

**Date:** February 17, 2026  
**Updated:** February 18, 2026  
**Project:** Felicity Event Management System  
**Assignment:** DASS Assignment 1

---

## Issues Found During Testing

### 1. ✅ FIXED — Admin not able to delete an organizer
**Root Cause:** Backend `deleteOrganizer` expected `req.body.confirm === 'DELETE'` but HTTP DELETE requests don't send a body.  
**Fix:** Removed the `confirm` body requirement. The frontend already has a confirmation modal where the user types the organizer name.

### 2. ✅ FIXED — Admin comments not sent to organizer on password reset
**Root Cause:** The approve endpoint didn't accept admin comments. Emails for temp password and rejection reason were already being sent via SMTP.  
**Fix:** Added optional `adminComments` field to approve flow — stored in DB and included in the email to the organizer.  
**Note:** If emails aren't arriving, check your SMTP credentials in `.env` — Outlook/IIIT SMTP may require an app password.

### 3. ✅ FIXED — Password reset request taking a long time
**Root Cause:** The `requestPasswordReset` endpoint was `await`ing the confirmation email send (SMTP connection + handshake takes 2-5 seconds).  
**Fix:** Made the confirmation email non-blocking (fire-and-forget). The response now returns immediately.

### 4. ℹ️ NOT A BUG — Browser password manager dialog
**Explanation:** This is your **browser's built-in password manager** (Chrome/Firefox/Edge). When you change a password on a form, the browser detects the password field and asks which saved login to update. This is purely a browser feature — **nothing to do with our app**. You can safely dismiss it or choose to update the saved password.

### 5. ✅ FIXED — Admin should not manually enter email for new organizer
**Root Cause:** The create organizer form required admin to enter `contactEmail` which was used as `loginEmail`.  
**Fix:** Backend now auto-generates login email from organizer name (e.g., "Tech Club" → `techclub@felicity.iiit.ac.in`). Frontend form no longer requires email — only name, category, description, and optional contact info. System shows auto-generated credentials after creation.

### 6. ℹ️ ALREADY IMPLEMENTED — JWT authentication on all protected routes
**How it works:** Every API request from the frontend includes `Authorization: Bearer <token>` via the axios interceptor in `api.js`. The backend `protect` middleware in `auth.js` verifies the JWT on every protected route.  
**How to test:**  
1. Open browser DevTools → Network tab  
2. Make any action (browse events, register, etc.)  
3. Click any API request → Headers → see `Authorization: Bearer eyJ...`  
4. To test protection: Open a new incognito window, go to `http://localhost:5000/api/participant/profile` directly → should get 401 Unauthorized  
5. Try removing the token from localStorage (DevTools → Application → Local Storage → delete `token`) → app redirects to login

### 7. ✅ FIXED — Participant unable to skip onboarding
**Root Cause:** The "Skip" button just navigated to `/participant/events` without calling the API. Since `isOnboarded` remained `false`, the `ProtectedRoute` kept redirecting back to `/onboarding` (infinite loop).  
**Fix:** "Skip" button now calls `completeOnboarding({ areasOfInterest: [], followedClubs: [] })` which sets `isOnboarded = true` on the server, then navigates.

### 8. ✅ FIXED — No club follow option during onboarding
**Root Cause:** The onboarding page only showed "Areas of Interest" selection. It never fetched or displayed the list of approved organizers/clubs.  
**Fix:** Added a `useEffect` to fetch all approved organizers from `GET /api/organizers`. The onboarding page now shows both areas of interest AND a list of clubs to follow.

### 9. ℹ️ ALREADY IMPLEMENTED — Preferences influence event ordering
**How it works:** In `browseEvents` controller, when a `userId` is provided, each event gets a preference score:  
- +10 points if the organizer is in the user's `followedClubs`  
- +5 points if the organizer's category matches the user's `areasOfInterest`  
- Events are sorted by preference score (descending), then by event date  
**How to test:** Follow some clubs and select interests → Browse events → events from followed clubs and matching categories appear first.

### 10. ✅ FIXED — Organizer unable to create an event
**Root Cause:** `TypeError: next is not a function` — The Event model's `pre('save')` hook used the callback-style `function(next)` pattern. Mongoose 9.x dropped callback support for middleware — only async/throw is supported.  
**Fix:** Changed the pre-save hook to use the modern pattern: `function()` without `next`, throwing errors directly with `throw new Error(...)` instead of `return next(new Error(...))`.

---

## Summary

| # | Issue | Status |
|---|-------|--------|
| 1 | Delete organizer fails | ✅ Fixed |
| 2 | Admin comments not emailed | ✅ Fixed |
| 3 | Password reset request slow | ✅ Fixed |
| 4 | Browser password manager dialog | ℹ️ Not a bug |
| 5 | Auto-generate organizer email | ✅ Fixed |
| 6 | JWT auth on protected routes | ℹ️ Already working |
| 7 | Cannot skip onboarding | ✅ Fixed |
| 8 | No club follow on onboarding | ✅ Fixed |
| 9 | Preferences influence ordering | ℹ️ Already working |
| 10 | Cannot create event | ✅ Fixed |
| 11 | StrictPopulateError on registration | ✅ Fixed |
| 12 | Participant not visible to organizer | ✅ Fixed |
| 13 | Date changes on event edit | ✅ Fixed |
| 14 | Multiple event creation issues | ✅ Fixed |
| 15 | First-time create+publish fails | ✅ Fixed |
| 16 | Comma vs semicolon display | ℹ️ Not a bug |
| 17 | Followed clubs filter shows all | ✅ Fixed |
| 18 | Merchandise registration endpoint error | ✅ Fixed |
| 19 | What are event tags? | ℹ️ Clarification |
| 20 | What is dynamic form builder? | ℹ️ Clarification |
| 21 | Eligibility missing on create | ✅ Fixed |
| 22 | Checkbox/radio not rendered | ✅ Fixed |
| 23 | Same as Issue 18 | ✅ Fixed |
| 24 | Purchase limit per participant missing | ✅ Fixed |
| 25 | Organizer dashboard shows 0 registrations | ✅ Fixed |
| 26 | "View Event" returns "Event not found" | ✅ Fixed |
| 27 | Closed events in upcoming | ✅ Fixed |


### 11. ✅ FIXED — StrictPopulateError on registration + email auth failure
**Error:** `StrictPopulateError: Cannot populate path 'organizerId'` in `registrationController.js` at line 212.  
**Root Cause:** After saving a registration, the code did `await registration.populate('eventId organizerId')`. The `Registration` model has no `organizerId` field — `organizerId` lives on the `Event` model. The registration was saved successfully, but the response crashed with a 500 error.  
**Fix:** Changed populate to nested populate: `await registration.populate({ path: 'eventId', populate: { path: 'organizerId', select: 'organizerName' } })`. This populates `eventId` on the registration, then populates `organizerId` within the event.  
**Email Note:** The `535 5.7.139 Authentication unsuccessful` SMTP error is a credential issue with Outlook/IIIT SMTP — the email send is already wrapped in try/catch and non-blocking, so it doesn't affect registration. Check your SMTP credentials or use an app password.

### 12. ✅ FIXED — Participant registered but not visible to organizer
**Root Cause (two-part):**  
1. The StrictPopulateError from Issue 11 caused the registration API to return a 500 error, making it seem like registration failed (though the data WAS saved).  
2. There was no "View Event" detail page for organizers — clicking "View" on an event navigated to `/organizer/events/:eventId` which had no registered route, so the organizer saw a blank page.  
**Fix:**  
- Issue 11's populate fix now prevents the 500 error.  
- Created `EventDetailPage.jsx` for organizers with event details + full participants list (searchable, with CSV export). Registered the route in `App.jsx`.

### 13. ✅ FIXED — Date changes automatically when editing event
**Root Cause:** `CreateEditEventPage.jsx` `fetchEvent` used `new Date(event.eventStartDate).toISOString().slice(0, 16)` to format dates for `datetime-local` inputs. `toISOString()` converts to **UTC**, which shifts dates by the timezone offset (IST = UTC+5:30). For example, `2026-02-20T10:00` IST → `2026-02-20T04:30` UTC → displayed as `2026-02-20T04:30`.  
**Fix:** Replaced with a `toLocalDatetime()` helper that builds `YYYY-MM-DDTHH:MM` using `getFullYear()`, `getMonth()`, `getDate()`, `getHours()`, `getMinutes()` — which use local timezone. Dates now display exactly as entered.

### 14. ✅ FIXED — Multiple event creation issues
**Sub-issues fixed:**  

1. **Registration fee 0 = "not entered"**  
   **Root Cause:** `publishEvent` validated required fields with `!event[field]`. Since `!0 === true`, a free event (fee=0) was flagged as "missing".  
   **Fix:** Changed to `event[field] === undefined || event[field] === null || event[field] === ''` which correctly treats `0` as a valid value.

2. **Can't add commas in custom field dropdown options**  
   **Root Cause:** Dropdown options were comma-separated, so typing a comma created a new option instead of being part of the option text.  
   **Fix:** Changed delimiter from comma (`,`) to semicolon (`;`). Label updated to "Options (semicolon-separated)" with placeholder `e.g., Option A; Option B; Option C`.

3. **Details vanish when editing**  
   **Root Cause:** Two issues: (a) Date fields appeared shifted due to UTC conversion (Issue 13). (b) `eventTags` was sent by the frontend but not in the backend's `allowedUpdates` list for Draft events, so tags were silently dropped.  
   **Fix:** Added `eventTags` to Draft `allowedUpdates` list. Date formatting fixed via Issue 13.

4. **"Details missing" on publish despite all fields filled**  
   **Root Cause:** The `registrationFee: 0` bug (sub-issue 1) and the removed requirement for custom form fields on Normal events. Not all Normal events need custom form fields, so the mandatory validation was overly strict.  
   **Fix:** Removed the custom form requirement for Normal events. Free events (fee=0) no longer fail validation.


### 15. ✅ FIXED — First-time event create+publish fails with "Missing required fields"
**Root Cause:** The `createEvent` controller only saved `eventName` and `eventType` to the database, ignoring ALL other fields (description, eligibility, dates, fees, location, etc.) sent by the frontend. So after creating and immediately publishing, the event only had name and type — all other required fields were empty.  
**Fix:** Updated `createEvent` in `organizerEventController.js` to save ALL provided fields (eventDescription, eligibility, dates, location, fees, tags, customForm, merchandiseItems, purchaseLimitPerParticipant). Now you can fill out the full form, create, and publish in one flow.

### 16. ℹ️ NOT A BUG — Comma vs semicolon display
**Explanation:** Custom form dropdown/checkbox/radio options use **semicolons** as delimiters (`;`) — this is intentional to allow commas within option text. Merchandise sizes/colors/variants use **commas** as delimiters (`,`) — this is also intentional since these are simple values like `S, M, L, XL`. Both labels in the create form correctly indicate which delimiter to use.

### 17. ✅ FIXED — "Followed clubs only" filter shows all events
**Root Cause:** When `followedOnly=true` but the user has no followed clubs (`followedClubs.length === 0`), the backend didn't set any `organizerId` filter — so ALL events were returned instead of an empty list.  
**Fix:** When user follows no clubs and `followedOnly` is enabled, the API now returns an empty result set `{ events: [] }` instead of all events.

### 18. ✅ FIXED — "This endpoint is for normal events only" for merchandise registration
**Root Cause:** The frontend `EventRegistrationPage.jsx` called `participantAPI.registerForEvent()` for ALL event types. The backend `registerForEvent` endpoint checks `event.eventType !== 'Normal'` and rejects merchandise events.  
**Fix:** Updated `handleSubmit` to call `participantAPI.purchaseMerchandise(eventId, { items })` for Merchandise events (with proper `merchandiseId`, size, color, variant) and `participantAPI.registerForEvent(eventId, { formResponses })` for Normal events. Also added UI for size/color/variant selection in merchandise items.

### 19. ℹ️ CLARIFICATION — What are event tags?
**Explanation:** Event tags are descriptive labels/keywords for events (per Assignment Section 8). Examples: `hackathon`, `AI`, `workshop`, `beginner-friendly`, `competition`. They help participants discover events through search and filtering. Added a tags input field to the Create Event form and display on the Event Details page.

### 20. ℹ️ CLARIFICATION — What is "dynamic form builder"?
**Explanation:** The dynamic form builder (Assignment Section 10.4) is the Custom Form Fields section in the Create Event page. Organizers can dynamically add fields of various types (text, number, email, date, dropdown, checkbox, radio, file upload), mark them as required, and add options for dropdown/checkbox/radio. The form is then rendered to participants during registration. Once a participant registers, the form is locked to protect existing data.

### 21. ✅ FIXED — "Open to All" eligibility treated as missing field
**Root Cause:** Same as Issue 15 — `createEvent` only saved name+type, so `eligibility` was never persisted to the database even though the user selected "Open to All" in the form.  
**Fix:** Fixed by the same fix as Issue 15. `createEvent` now saves all provided fields including `eligibility`.

### 22. ✅ FIXED — Checkbox/radio custom fields not rendered during registration
**Root Cause:** The `EventRegistrationPage.jsx` custom form rendering only handled 5 field types: `text`, `number`, `textarea`, `dropdown`, `file`. It was missing `checkbox`, `radio`, `email`, and `date`.  
**Fix:** Added rendering for all missing field types:
- **checkbox**: Shows a list of checkboxes; value is stored as an array of selected options
- **radio**: Shows radio buttons; value is a single selected option  
- **email**: Shows an email input with type="email" validation
- **date**: Shows a date picker input
Also fixed validation to properly handle checkbox arrays (empty array = not filled).

### 23. ✅ FIXED — Same as Issue 18
**See Issue 18.** The frontend now correctly routes merchandise registrations to `purchaseMerchandise` endpoint.

### 24. ✅ FIXED — Purchase limit per participant missing for merchandise events
**Root Cause:** The `Event` model already had `purchaseLimitPerParticipant` field and the `purchaseMerchandise` controller already checked it, but the Create Event form had no UI input for it.  
**Fix:** Added "Purchase Limit Per Participant" input to the Merchandise Items section in `CreateEditEventPage.jsx`. Also added `purchaseLimitPerParticipant` to the Draft `allowedUpdates` list in `updateEvent` so it can be edited.

### 25. ✅ FIXED — Organizer dashboard shows 0 registrations
**Root Cause:** The `getDashboard` endpoint's `Event.find()` query used `.select('eventName eventType status eventStartDate eventEndDate registrationFee')` — it did NOT include `currentRegistrations` or `registrationLimit`. So the frontend received these as `undefined`, displaying `0 / ∞`.  
**Fix:** Added `currentRegistrations`, `registrationLimit`, `eligibility`, and `eventDescription` to the `.select()` query.

### 26. ✅ FIXED — Participant "View Event" from dashboard returns "Event not found"
**Root Cause:** The dashboard controller built `regData` with `_id: registration._id` (the registration ID). The frontend's "View Event" button navigated to `/participant/events/${item._id}`, using the registration ID as the event ID. The event controller then couldn't find an event with that registration ID.  
**Fix:**  
1. Added `eventId: registration.eventId._id` to the dashboard response `regData`
2. Changed frontend to use `navigate(\`/participant/events/${item.eventId}\`)` instead of `item._id`

### 27. ✅ FIXED — Closed/deleted events still show in upcoming events
**Root Cause:** The participant dashboard only checked `participationStatus === 'Registered'` and `eventStartDate > currentDate` for categorizing upcoming events. It did NOT check the event's own status. So if an organizer closed/deleted an event, the registration's `participationStatus` stayed `Registered` and the event appeared in upcoming.  
**Fix:** Added event status checking to the dashboard categorization:
- If `eventId.status === 'Closed'` → move to `cancelledRejected` regardless of participationStatus
- Upcoming events now also require `event.status` to be `Published` or `Ongoing`

### 28. ❌ Email sending failed: Invalid login: 535 5.7.139 Authentication unsuccessful, federated STS service was unreachable. [BM1P287CA0020.INDP287.PROD.OUTLOOK.COM 2026-02-19T06:44:31.322Z 08DE6F46DA82A19A]  (participant not ablle to recieve email after registering for an event)

### 29. Custom fields checkbox instruction says enter values semi-colon separated in the box. but I am not able to type semi-colon in that box. as a result I am only able to give one option and not a list of options from which to check.

### 30. The events in my event dashboard (participant account) do not have a clickable ticket id. Not sure how the participant will fetch the qr code and view it again (it is visible when he registers but what if he wants to view it again in another session?) There is basically no way of going to my registrations page from the main page (browse events) or even from the dashboard. The participant must be ale to view participation history as mentioned in the requirements of the assignment

### 31. Fuzzy matching missing in browse events (participant account) {not really sure, but might be}.

### 32. This concern is for me and not for copilot: remove 17 July

### 33. Event records must also contain the participation status visible to the participant

### 34. payment is shown as pending (to the organizer) while participant has already clicked on the pay button (he has actually paid the merchandise money but not the registration fees); like the major doubt is how even does the participant pay the registration fees for the merchandise events?
Also, in event detail, the organizer sees 1 registrations (though registration payment is pending) but in the list of those events (page: organizer/events) it shows 0/3 registered. Similarly for all the participants it shows 3 spots left (which is the total number of spots and not 2 spots left)

### 35. Even when all the stock of an item has been purchased by 1 participant, still the other participants are able to buy those items (which should ideally have been out of stock)

### 36. Ticket with qr must be generated for merchandise events as well





