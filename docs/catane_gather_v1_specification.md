# Catane Gather V1 — Product & Feature Specification

**Document purpose:** A build-ready product specification for the first version of Catane Gather. It describes the product, user journeys, pages, features, behaviour, business rules, and V1 boundaries. It is intended to be shared with a developer or used as the working product blueprint.

---

## 1. Product Definition

**Catane Gather** is a pay-per-event web application that gives an organiser one shareable digital space for a real-world gathering.

The organiser creates a Gather, adds event details, schedule, venue, RSVP, and other important information, previews the complete guest experience, pays a small one-time fee, publishes the Gather, and shares its unique link or QR code.

Guests can open the Gather instantly without creating an account or installing an application. The same Gather remains useful before, during, and after the event through event information, live updates, and a photo gallery.

### Core product flow

`Create → Preview → Pay → Publish → Share → Attend → Remember`

### V1 business model

- Each Gather is a separate paid event.
- Organisers can create, edit, and preview a Gather for free.
- Payment is required before a Gather can be published publicly.
- Suggested starting price: **₹99 per Gather**.
- The price should be configurable on the backend rather than hardcoded throughout the application.
- One successful payment covers one Gather.
- Guests never pay and do not need accounts.
- No consumer subscription in V1.
- The active period and post-event retention policy must be clearly defined before launch. Do not promise permanent hosting until storage and hosting costs have been considered.

## 2. User Types

### 2.1 Organiser

The person who creates and manages a Gather. The organiser must have an account.

The organiser can:

- Create a Gather.
- Edit its content and appearance.
- Preview the guest-facing page.
- Pay to publish the Gather.
- Copy and share its link.
- Display or download its QR code.
- View and manage RSVP responses.
- Publish event updates.
- Upload, reorder, and delete gallery photos.
- Mark the event completed or archive it.
- Delete the Gather.

### 2.2 Guest

A person invited to an event. A guest does **not** need an account.

The guest can:

- Open a public Gather link or QR code.
- View event details, schedule, venue, and important information.
- Open directions in an external map application.
- Submit an RSVP if enabled.
- Read updates.
- View the photo gallery.

Guests cannot edit the Gather or publish updates.

---

## 3. Application Structure

### Public pages

- Landing page
- Demo Gather
- Public Gather page
- RSVP interaction
- Privacy Policy
- Terms of Service
- Contact page or contact method
- Error pages, including not found and unavailable/expired Gather pages

### Organiser pages

- Sign up
- Login
- Forgot password
- Reset password
- Dashboard
- Create Gather
- Gather editor
- Preview
- Payment
- Publish/share confirmation
- Gather management
- RSVP management
- Updates management
- Gallery management
- Gather settings
- Account settings

---

# 4. Public Pages

## 4.1 Landing Page

### Purpose

Explain what Gather does quickly and encourage an organiser to create a Gather.

### Sections

**Hero**
- Brand/logo.
- Headline: “One place for everything about your gathering.”
- Brief explanation of the product.
- `Create a Gather` call to action.
- `View Demo` call to action.

**How it works**

`Create → Preview → Pay → Share`

Explain that creating and previewing are free and payment is requested when the organiser is ready to publish.

**Feature overview**
- Event details
- Schedule
- Venue and directions
- RSVP
- Important information
- Live updates
- Photo gallery
- Shareable link
- QR code

**Use cases**
- Weddings
- Birthdays
- Family gatherings
- Reunions
- Trips
- Workshops
- Conferences
- School events
- Community events
- Other gatherings

**Demo preview**
- Show an example Gather so visitors can understand the guest experience.

**Pricing**
- Show the one-time price, initially proposed as ₹99 per Gather.
- Explain what the payment includes.
- Do not imply that the page remains online forever unless the retention policy supports that promise.

**Footer**
- Catane Labs
- Privacy Policy
- Terms of Service
- Contact

## 4.2 Demo Gather Page

### Purpose

Let visitors experience a completed guest-facing Gather before creating an account.

### Requirements

- Use a realistic sample event, such as a wedding.
- Include event details, schedule, venue, RSVP demonstration, updates, and gallery.
- The demo must be read-only. Submitting the demo RSVP must not create production data.
- The page must be responsive and usable on mobile devices.

## 4.3 Public Gather Page

### Purpose

Provide guests with one place to find the information they need before, during, and after the event.

### URL

Each published Gather receives a unique public URL, for example:

`/g/arun-priya`

The exact route format can change during implementation. The public slug must be unique and stable after sharing unless the organiser explicitly changes it.

### Access rules

- Public page requires no login.
- Guests cannot edit event content.
- Draft Gathers must not be publicly accessible through the normal public route.
- Published content must be available on mobile and desktop.

### Page structure

1. Hero
2. Event details
3. Schedule
4. Venue and directions
5. RSVP
6. Important information
7. Updates
8. Gallery
9. Footer

### Hero section

Display:
- Cover image
- Event title
- Event date
- Main location
- Short welcome message
- Prominent RSVP button when RSVP is enabled

Example:

> Arun & Priya's Wedding  
> 18 December 2026 · Chennai

### Event details section

Display:
- Event title
- Description
- Date and time
- General location
- Event type, where useful

### Public page state

The page should reflect the Gather's status. For example, RSVP may be disabled after the event is completed, while updates and gallery content can remain visible.

---

# 5. Event Schedule

## Purpose

Show guests what is happening and when.

### Schedule item fields

- Title — required
- Date — required
- Start time — required
- End time — optional
- Description — optional
- Location — optional
- Dress code — optional

### Example

- **10:00 AM:** Wedding ceremony, Main Hall
- **12:30 PM:** Lunch, Dining Hall
- **6:00 PM:** Reception, Garden

### Organiser actions

- Add a schedule item
- Edit an item
- Delete an item
- Reorder items

### Guest view

- Display items chronologically.
- Group by date when the Gather spans multiple days.
- Ensure the timeline is easy to scan on mobile.

### Business rule

One Gather may include multiple functions or activities. For example:

```text
Gather
├── Haldi
├── Mehendi
├── Wedding
└── Reception
```

Per-function RSVP is not mandatory for V1 and should be added only if product research confirms that it is necessary.

---

# 6. Venue and Directions

## Purpose

Help guests understand where to go and how to get there.

### Main venue fields

- Venue name
- Address
- External map URL or map location
- Additional directions/instructions

### Optional venue information

- Parking
- Landmark
- Accommodation
- Transportation information
- Other instructions

### Guest actions

- View the venue details
- Open the map link
- Get directions

### Scope boundary

Gather does not build a navigation or mapping system in V1. It uses a link to an external map provider.

---

# 7. RSVP

## Purpose

Allow guests to communicate attendance without creating an account.

### Guest form

- Attendance response: `Attending`, `Maybe`, or `Can't attend`
- Name — required
- Number of guests — required, with sensible validation
- Message — optional

### Submission behaviour

- Validate the submitted data on both client and server.
- Associate each response with its Gather.
- Show a confirmation after a successful submission.
- Prevent invalid values, such as negative guest counts.
- Provide a clear error if the submission fails.

### Organiser RSVP dashboard

Show summary values:
- Total responses
- Attending responses
- Maybe responses
- Not-attending responses
- Total guest count indicated by responses

Display a table containing:

- Name
- Response
- Guest count
- Message
- Submission date/time

Organiser actions:
- Search responses
- Filter by attendance response
- View response details
- Export responses as CSV

### Identity and privacy

- Guests do not need an account.
- Do not require guest email or phone number for V1 unless testing establishes a clear need.
- Do not publicly expose the RSVP list.
- Do not collect more personal information than the product requires.

### V1 scope boundary

Do not build complex family/group account management in V1. A guest's number-of-guests response is sufficient for the initial release.

---

# 8. Important Information

## Purpose

Let organisers add useful details without requiring a rigid form for every possible event type.

### Information block fields

- Title
- Content

Possible block examples:
- Dress Code
- Parking
- Accommodation
- Transportation
- Contact
- Instructions
- Other

### Organiser actions

- Add a block
- Edit a block
- Delete a block
- Reorder blocks

### Example

**Dress Code**  
Traditional attire.

**Parking**  
Parking is available behind the venue.

---

# 9. Updates and Announcements

## Purpose

Give guests a current source of truth when plans change. This is a central part of Gather's value, not just an optional news feed.

### Organiser creates an update

Fields:
- Title
- Message

The system records:
- Associated Gather
- Author/organiser
- Publication date and time

### Example

**Venue update**  
The reception has moved to Grand Palace Hall.

### Guest view

- Show published updates, newest first.
- Display the update title, content, and publication time.
- Do not display drafts or unpublished updates publicly.

### Business rule

Event information and updates are separate concepts:

- **Event information** describes the current planned event.
- **Update** communicates a change or announcement over time.

When a venue changes, the organiser should update the venue details and can also publish an update explaining the change.

---

# 10. Photo Gallery

## Purpose

Keep the Gather useful after the event by giving guests a place to view shared memories.

### Organiser actions

- Upload photos
- Preview uploaded photos
- Delete photos
- Reorder photos

### Guest actions

- View the gallery
- Open an image
- View an image in a larger/full-screen presentation

### Validation and storage

- Validate allowed file types.
- Enforce file-size and total-storage limits.
- Store media in file/object storage rather than putting image binaries directly into relational database rows.
- Make only successfully uploaded and published images visible publicly.

### V1 exclusions

- Guest photo uploads
- Comments
- Likes
- Social feeds
- Video hosting

---

# 11. Appearance and Themes

## Purpose

Make Gathers look polished without requiring organisers to design a website from scratch.

### V1 customisation

- Cover image
- Theme selection
- Accent colour
- Curated font combination
- Layout style, if needed

### Initial theme ideas

- Elegant
- Minimal
- Warm
- Classic
- Modern

Start with a small number of well-designed themes. Do not build a full invitation design editor or Canva-level customisation system in V1.

### Design principle

The organiser should get an attractive result with minimal effort. Themes must preserve readability, responsive behaviour, and accessibility.

---

# 12. Event Lifecycle

Use explicit lifecycle states to control what organisers and guests can do.

```text
DRAFT → LIVE → COMPLETED → ARCHIVED
```

## DRAFT

- Editable by the owner
- Previewable by the owner
- Not publicly accessible through the public Gather route
- Not shareable as a live event
- Does not require payment until publication is requested

## LIVE

- Publicly accessible
- Link and QR code can be shared
- RSVP is available if enabled
- Organiser can publish updates
- Gallery can be managed

## COMPLETED

- Event has finished
- Public page remains accessible during the configured retention period
- RSVP can be disabled
- Existing updates remain visible
- Gallery remains available
- Organiser can still make permitted edits

## ARCHIVED

- Inactive state
- Public access follows the retention policy defined for V1
- Organiser can still see the Gather in their dashboard if the product's retention rules permit it

### Important decision before launch

Define exactly how long a paid Gather remains active and what happens when that period ends. Any extension fee should be a later feature, not an unclear surprise at launch.

---

# 13. Organiser Authentication

## 13.1 Sign Up

Fields:
- Name
- Email
- Password
- Confirm password

Validation:
- Valid email format
- Unique email address
- Password requirements
- Password confirmation match

On success:
- Create organiser account
- Establish an authenticated session/token according to the chosen authentication design
- Redirect to the dashboard

## 13.2 Login

Fields:
- Email
- Password

Actions:
- Log in
- Navigate to sign up
- Navigate to forgot password

On success, redirect to the dashboard or the originally requested protected page.

## 13.3 Forgot Password

- Accept the account email.
- Start a secure password-reset flow.
- Do not reveal whether an email is registered through an overly specific response.
- Expire reset tokens after a defined period.

## 13.4 Reset Password

- Accept a new password and confirmation.
- Validate the reset token on the backend.
- Invalidate the token after use or expiry.

---

# 14. Organiser Dashboard

## Purpose

Give organisers one place to see and access their Gathers.

### Main content

- Page title: `My Gathers`
- `Create a Gather` button
- List/grid of the organiser's Gathers

Each Gather card displays:
- Event name
- Event date
- Status
- RSVP summary, if available
- Last updated time, if useful
- Actions appropriate to the status

Example:

```text
Arun & Priya's Wedding
18 December 2026
LIVE · 110 responses
[Manage] [View]
```

### Empty state

If the organiser has no Gathers, explain the next step and show a `Create a Gather` CTA.

### Access rule

The dashboard only shows Gathers owned by the currently authenticated organiser.

---

# 15. Create Gather

## Purpose

Create a draft quickly without requiring all optional details upfront.

### Initial fields

- Event title — required
- Event type — required or defaulted to `Other`
- Description — optional
- Cover image — optional
- Event date — required
- Start time — optional or required based on final product decision
- End time — optional

### Event type options

- Wedding
- Birthday
- Reunion
- Trip
- Workshop
- Conference
- School
- Community
- Other

### Behaviour

- Save the new Gather as a draft.
- Allow the organiser to continue to the editor.
- Do not require venue, schedule, gallery, and information blocks before the draft can be created.

---

# 16. Gather Editor

The organiser should use one central editing area with clearly named sections.

```text
Gather Editor
├── Details
├── Schedule
├── Venue
├── RSVP
├── Information
├── Appearance
└── Gallery
```

### Editor behaviour

- Sections can be edited independently.
- Saved changes persist when the organiser returns later.
- Show clear save state and errors.
- Prevent accidental loss of unsaved changes.
- Validate data on the backend even if the frontend also validates it.
- Preview the same content structure that guests will see.

---

# 17. Preview

## Purpose

Let the organiser see the complete guest experience before paying.

### Preview must include

- Cover image
- Event details
- Schedule
- Venue
- RSVP
- Information blocks
- Published updates, if any are supported before publication
- Gallery presentation
- Footer

### Preview modes

- Desktop-sized preview
- Mobile-sized preview

### Preview RSVP

Provide a test interaction that does not create a real RSVP in production data. Clearly separate preview/test submissions from actual guest submissions.

### Key rule

The organiser can fully preview and revise the Gather before paying.

---

# 18. Payment and Publication

## Purpose

Convert a completed draft into a public Gather.

### Entry condition

Payment begins when the organiser chooses to publish the Gather.

### Payment screen

Display:

- Event title
- One-time price, initially ₹99
- What the payment includes
- `Pay & Publish` action

Included capabilities should be described clearly, such as:
- Public Gather page
- Shareable link
- QR code
- RSVP collection
- Updates
- Gallery
- Defined active period

### Payment flow

```text
Organiser clicks Publish
        ↓
Backend creates payment order
        ↓
Payment provider checkout
        ↓
Payment provider reports result
        ↓
Backend verifies the payment
        ↓
Backend records confirmed payment
        ↓
Gather becomes LIVE
        ↓
Public URL becomes accessible
```

### Security and reliability requirements

- Never rely solely on a frontend success screen.
- Verify payment through the provider's supported server-side verification mechanism.
- Validate payment amount, currency, order, and Gather association.
- Handle provider callbacks/webhooks safely if used.
- Make confirmation idempotent so repeated callbacks do not duplicate publication or payment records.
- Do not publish a Gather after a failed, pending, or unverified payment.
- Keep the Gather in DRAFT after a failed or cancelled payment.
- Allow a safe retry.
- Do not store raw card or payment credentials.

### Pricing configuration

Store the configured price in backend configuration or a suitable pricing model. Do not trust a price submitted by the browser.

---

# 19. Publish and Share

After the backend confirms payment and publication, display a success screen.

### Display

- Confirmation that the Gather is live
- Public URL
- QR code
- Share actions

### Actions

- Copy link
- Display QR code
- Download QR code
- Share using browser/device share support where available
- View public Gather

### Share message

Provide an editable or copyable message such as:

> You're invited to Arun & Priya's wedding. View the event details, schedule, location and RSVP here: [Gather link]

### QR requirements

- QR encodes the public Gather URL.
- QR can be displayed and downloaded as an image.
- It must not encode an organiser-only editor or preview URL.

---

# 20. Gather Management

After publication, the organiser gets a management area.

```text
Arun & Priya's Wedding · LIVE
[View Gather]

Overview
Details
Schedule
Venue
RSVP
Information
Updates
Gallery
Settings
```

### Requirements

- The organiser can return to the management area from the dashboard.
- The organiser can edit permitted content after publication.
- Saved public content updates should be reflected on the public page.
- Destructive actions require confirmation.
- Organiser-only routes must enforce ownership on the backend, not merely hide UI controls.

---

# 21. Overview and Basic Analytics

## Purpose

Show practical information about how the Gather is being used.

### V1 metrics

- Total page views
- RSVP responses
- Attending responses
- Maybe responses
- Not-attending responses
- Total guest count indicated by responses

Example:

```text
Page views          428
RSVP responses      110
Attending            82
Maybe                11
Not attending        17
Guest count          Based on submitted responses
```

### Analytics requirements

- Clearly define what counts as a page view.
- Avoid describing total page views as unique visitors unless unique visitor tracking is actually implemented.
- Keep analytics simple in V1.

---

# 22. RSVP Management

### Features

- Response summary
- Response table
- Search
- Filters
- CSV export

### Filters

- All responses
- Attending
- Maybe
- Not attending

### CSV export

Allow the organiser to download RSVP data in CSV format. Ensure exported data is only available to the authorised Gather owner.

---

# 23. Updates Management

### List view

Display:
- Update title
- Message preview
- Publication date/time
- Status, if drafts are supported

### Actions

- Create
- Edit
- Publish
- Delete

### Public behaviour

- Only published updates are visible.
- Newest updates appear first.
- Updates belong to exactly one Gather.

---

# 24. Gallery Management

### Features

- Upload images
- Preview uploaded images
- Delete images
- Reorder images

### Validation

- Validate file type and size on the server.
- Enforce per-file and per-Gather storage limits.
- Reject unsupported files safely.
- Handle upload failures without showing broken gallery items publicly.

### Public behaviour

Only successfully uploaded and published media should be displayed.

---

# 25. Gather Settings

### Basic settings

- View/edit event details
- Manage public state
- Mark event completed
- Archive
- Delete

### Public URL

- Keep the public slug stable after sharing by default.
- If slug editing is allowed, warn that changing it will break previously shared links unless redirects are implemented.
- Ensure every slug is unique.

### Delete

- Require an explicit confirmation.
- Clearly explain what will be deleted.
- Prevent a deleted Gather from remaining publicly accessible.
- Consider media deletion and payment-record retention requirements when implementing deletion.

---

# 26. Account Settings

Organiser can:
- View/update name
- View/update email, with verification if email changes
- Change password
- Log out
- Request account deletion

Account deletion must not accidentally expose or transfer ownership of the user's Gathers. Define the associated Gather/media handling policy before implementing it.

---

# 27. Error and System Pages

Provide clear user-facing states for:

### Gather not found

The Gather does not exist or the URL is incorrect.

### Gather unpublished/unavailable

The Gather is not currently public.

### Gather expired

The Gather has reached the end of its configured active period.

### Payment failed or cancelled

Explain that the Gather has not been published and provide a safe retry route.

### Generic error

Provide a friendly fallback without exposing stack traces, database details, secrets, or internal error messages.

---

# 28. Sharing Experience

Gather should work naturally with:
- WhatsApp
- Copy/paste
- QR code
- Browser/device sharing where supported

A custom messaging system is not required.

### Link previews

Where supported, public Gather pages should provide useful title, description, and cover image metadata so shared links display meaningful previews in messaging apps and social platforms.

---

# 29. Complete Guest Journey

```text
Receives invitation through WhatsApp or another channel
        ↓
Opens Gather link or scans QR
        ↓
Views event overview
        ↓
Checks date/time and schedule
        ↓
Checks venue and directions
        ↓
Submits RSVP, if enabled
        ↓
Leaves the page
        ↓
Returns later to check updated information
        ↓
Uses directions to attend
        ↓
Returns after the event to view photos
```

The guest journey must not be interrupted by a login or account-creation requirement.

---

# 30. Complete Organiser Journey

```text
Visits Gather
        ↓
Creates account / logs in
        ↓
Creates a Gather draft
        ↓
Adds event details
        ↓
Adds schedule
        ↓
Adds venue
        ↓
Adds important information
        ↓
Configures RSVP
        ↓
Selects appearance
        ↓
Previews the full Gather
        ↓
Makes final edits
        ↓
Pays the one-time fee
        ↓
Backend verifies payment
        ↓
Gather becomes LIVE
        ↓
Receives public link and QR code
        ↓
Shares with guests
        ↓
Monitors RSVPs
        ↓
Publishes updates as needed
        ↓
Uploads photos
        ↓
Marks event completed
        ↓
Gather remains available according to the retention policy
```

---

# 31. Core Business Rules

1. **Drafts are free.** Organisers may create, edit, and preview without paying.
2. **Publication requires verified payment.** A frontend success callback alone is insufficient.
3. **One payment covers one Gather.** The payment record must reference a specific Gather.
4. **Guests are free.** No guest fee is charged.
5. **Guest accounts are not required.** Public event viewing and RSVP are accessible without login.
6. **Only the owner can manage a Gather.** Ownership must be enforced by backend authorization.
7. **Public page content is read-only for guests.** RSVP is the primary guest-submitted action.
8. **Updates are organiser-controlled.** Only authorised organisers can create or publish them.
9. **RSVPs belong to one Gather.** A response must not be associated with the wrong event.
10. **Payment verification occurs on the server.** Verify order, amount, currency, payment status, and Gather association.
11. **Payment handling is idempotent.** Repeated callbacks must not duplicate publication or confirmed payment handling.
12. **Public URLs are unique.** Two Gathers cannot use the same slug.
13. **Drafts do not leak.** Public endpoints must not return draft-only content.
14. **Backend validation is mandatory.** Client-side validation improves usability but is not a security boundary.
15. **Personal data is protected.** RSVP lists and organiser data must not be publicly retrievable.
16. **Lifecycle behaviour is explicit.** Rules for LIVE, COMPLETED, ARCHIVED, and expired Gathers must be enforced consistently.
17. **The active period must be transparent.** Organisers should know how long their paid Gather remains accessible.

---

# 32. V1 Feature Summary

## Organiser features

- Sign up and login
- Password recovery
- Dashboard
- Create/edit/delete Gather
- Event details
- Cover image upload
- Multiple schedule items
- Venue and directions link
- Important information blocks
- RSVP configuration
- Curated appearance themes
- Full preview
- One-time payment
- Server-side payment verification
- Publication and unique public URL
- QR code generation/download
- Link sharing
- RSVP management
- RSVP CSV export
- Updates management
- Gallery management
- Basic analytics
- Complete/archive Gather
- Account settings

## Guest features

- Open public Gather without an account
- View event overview
- View schedule
- View venue and directions
- Submit RSVP
- Read important information
- Read published updates
- View gallery

---

# 33. Explicitly Out of Scope for V1

Do not build the following in the first release:

- Guest accounts or profiles
- Chat or direct messaging
- Comments or likes
- Social feed
- AI event planning
- Ticket selling
- Guest payments
- Vendor marketplace
- Seating management
- Hotel booking
- Transport booking
- Native Android/iOS app
- Custom domains
- Advanced invitation designer
- Guest photo uploads
- Video hosting or live streaming
- Advanced analytics
- Consumer subscription tiers
- Complex family/group accounts
- Full WhatsApp API integration
- A custom mapping/navigation system

These features may be reconsidered after the core product is tested with real users.

---

# 34. Suggested URL Structure

The exact paths can be adjusted during implementation. The separation between public and authenticated routes should remain clear.

```text
PUBLIC
/
    Landing page
/demo
    Demo Gather
/g/{slug}
    Public Gather
/privacy
    Privacy Policy
/terms
    Terms of Service

AUTHENTICATION
/signup
/login
/forgot-password
/reset-password

ORGANISER
/dashboard
    My Gathers
/gather/new
    Create Gather
/gather/{id}/edit
    Gather editor
/gather/{id}/preview
    Preview
/gather/{id}/payment
    Payment flow
/gather/{id}/share
    Publish/share confirmation
/gather/{id}/manage
    Overview
/gather/{id}/manage/rsvps
    RSVP management
/gather/{id}/manage/updates
    Updates management
/gather/{id}/manage/gallery
    Gallery management
/gather/{id}/manage/settings
    Gather settings
/account
    Account settings
```

---

# 35. Technical Scope Implied by the Product

This section identifies likely engineering requirements. It does not prescribe the complete implementation before the domain model and API design have been worked out.

## Frontend

- React
- Client-side routing
- Authenticated organiser area
- Public Gather pages
- Forms and client-side validation
- Responsive/mobile-first design
- Image upload UI
- RSVP interaction
- Payment checkout integration
- Dashboard and management tables
- Preview mode
- Loading, empty, success, and error states

## Backend

- Java and Spring Boot
- REST APIs
- Spring Security
- Authentication and authorisation
- DTO-based request/response models
- Server-side validation
- Controller/service/repository separation
- JPA/Hibernate
- Transaction management
- Consistent global exception handling
- Payment order creation and verification
- Payment webhook/callback handling as supported by the provider
- Public/private access control
- File/media handling
- QR generation
- Event lifecycle management
- Structured logging
- API documentation
- Automated tests

## Database domain candidates

Likely entities include:

```text
User
Gather
ScheduleItem
Venue
InformationBlock
RSVP
Announcement
Media
Payment
```

This is only an initial list. The final entity structure, relationships, indexes, constraints, and deletion rules should be derived from the agreed flows and business rules.

## Infrastructure

- Relational database
- Image/object storage
- Frontend hosting
- Backend hosting
- HTTPS
- Environment-based configuration
- Secret management
- Logs and error monitoring appropriate to the chosen platform
- Database backup strategy appropriate to the service

---

# 36. Product Design Principles

Gather is a digital home for an event, not another social network and not another invitation editor.

The organiser should think:

> I can put everything about my event here.

The guest should think:

> I can find everything I need here.

The product should reduce the need to search through invitation images, chat messages, map links, schedule updates, and scattered photos.

```text
                 ONE GATHER
                    │
       ┌────────────┼────────────┐
       ↓            ↓            ↓
     BEFORE        DURING       AFTER
       │            │            │
     Details       Updates      Photos
     Schedule      Changes      Memories
     RSVP          Directions
     Venue
```

## V1 success condition

The core journey must work smoothly:

```text
Create for free
      ↓
See exactly what guests will see
      ↓
Pay a small one-time amount
      ↓
Publish instantly
      ↓
Share one link or QR
      ↓
Guests can use it without an account
```

The number of screens is not the measure of success. The goal is a genuinely useful product with a reliable payment/publishing flow, a low-friction guest experience, and enough engineering depth to demonstrate sound full-stack development.

---

# 37. Decisions to Finalise Before Implementation

These details should be settled during detailed design rather than silently guessed by the implementation:

1. **Active period:** How long a paid Gather stays publicly available.
2. **After-event retention:** Whether completed Gathers remain available indefinitely, for a fixed period, or until manually archived.
3. **Media limits:** Maximum file size, allowed image types, and total storage per Gather.
4. **RSVP editing:** Whether guests can amend a response and how they identify the existing response without an account.
5. **RSVP guest count:** Whether the count includes the person submitting the form.
6. **Schedule model:** Whether separate schedule items can each have a different venue and whether event dates can span multiple days.
7. **Publication rules:** Whether any minimum fields are required before payment/publication.
8. **Payment provider:** Select a provider and implement its verified server-side flow.
9. **Refund/cancellation policy:** Define what happens if payment succeeds but publication fails.
10. **Slug policy:** Decide whether organisers can change a public slug after sharing.
11. **Privacy/legal content:** Publish appropriate privacy and terms pages before accepting real users and payments.
12. **Analytics definition:** Decide how views are counted and whether unique visitors are in scope.

These are product decisions, not reasons to delay basic development. Finalise them when the related feature is being designed.
