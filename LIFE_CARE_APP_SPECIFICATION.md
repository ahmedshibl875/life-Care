# Life‑Care Mobile Application – Full Specification

## 1. Overview
The **Life‑Care** app is a cross‑platform mobile solution that helps patients, caregivers and health‑care professionals manage health‑related information, schedule appointments, receive notifications and view personal medical records.  The current implementation is a **React‑Native (TypeScript)** front‑end that communicates with a **RESTful Node.js/Express** back‑end and stores data in a **PostgreSQL** database.

---

## 2. Core Screens (User‑Facing UI)
| Screen | Primary Purpose | Key UI Elements |
|--------|----------------|-----------------|
| **Login / Sign‑Up** | Authenticate users, create new accounts | Email / Phone field, password, social‑login placeholders, "Forgot password" link |
| **Home Dashboard** | Overview of upcoming appointments, recent notifications, quick actions | Greeting banner, cards for **Upcoming Appointments**, **Medication Reminder**, **Latest Lab Results**, bottom navigation bar |
| **Profile** | View / edit personal details and health settings | Avatar, name, contact info, emergency contacts, health preferences, **Profile type selector** (Patient / Doctor / Admin) |
| **Appointments** | List, book and manage medical appointments | Calendar view, list view, filter by status, **Book Appointment** button, swipe‑to‑cancel |
| **Medical Records** | Access lab results, prescriptions, imaging reports | Tabbed view (Lab, Prescription, Imaging), download PDF, share secure link |
| **Messaging / Chat** | Direct communication between patient and assigned doctor | Chat bubble UI, attachment support, read‑receipts, push notifications |
| **Settings** | Configure app behaviour, security, notification preferences | Toggle for **Biometric login**, **Push notifications**, **Language**, **Theme (light/dark)** |
| **Admin Console** (only for admin profile) | Manage users, view analytics, moderate content | User list, role assignment, system health metrics, logs |

---

## 3. Front‑End Architecture
- **Framework**: React‑Native 0.74+ with **TypeScript** for static typing.
- **State Management**: **Riverpod** (provider‑like) for global state (auth, user profile, appointments) combined with **Flutter Hooks**‑style pattern for local component state.
- **Navigation**: `react‑navigation` v6 – stack navigator for auth flow, bottom‑tab navigator for main app sections, and modal screens for forms.
- **UI Library**: Custom component library built on **React Native Paper** + **styled‑components** for theming.
- **Networking**: `axios` with an **Interceptor** that automatically attaches a **JWT access token** to every request and refreshes it when needed.
- **Secure Storage**: `react‑native‑keychain` stores the refresh token and sensitive user preferences; the keystore generated during the build signs the APK.
- **Code Generation**: Reanimated 2‑new‑arch enabled (`newArchEnabled=true`) — `generate_codegen_artifacts_from_schema` script runs before each release build.

---

## 4. Back‑End Architecture
| Layer | Technology | Responsibility |
|------|------------|----------------|
| **API Gateway** | Node.js + Express (v4) | Route incoming HTTP requests, apply authentication middleware, rate‑limit, request validation (Joi). |
| **Authentication Service** | JWT + Refresh‑Token stored in HttpOnly cookies (or encrypted storage) | Issue access tokens (`exp: 15 min`), validate, rotate refresh tokens. |
| **Business Logic** | Service classes (UserService, AppointmentService, RecordService) | Encapsulate domain rules (e.g., only a doctor can write a prescription). |
| **Data Access** | **Sequelize** ORM for PostgreSQL | CRUD on tables: `users`, `profiles`, `appointments`, `medical_records`, `messages`, `audit_logs`. |
| **Real‑time** | Socket.io (rooms per patient‑doctor pair) | Push chat messages and live appointment status updates. |
| **Security Layer** | Helmet, CORS, rate‑limit, CSRF tokens for web‑based admin portal | Harden HTTP headers, limit brute‑force attacks. |
| **Logging & Monitoring** | Winston + Elastic Stack | Structured logs, error tracking, health‑check endpoint (`/health`). |

---

## 5. User Profiles & Permissions
| Profile Type | Description | Main Permissions |
|--------------|-------------|-----------------|
| **Patient** | End‑user who consumes health data, books appointments. | View own records, request appointments, chat with assigned doctor, edit personal profile. |
| **Doctor** | Health‑care provider linked to one or more patients. | View patients assigned to them, create/edit **prescriptions** and **medical notes**, accept/decline appointments, chat with patients. |
| **Admin** | System administrator (internal staff). | Full CRUD on any user, view audit logs, manage app‑wide settings, generate reports, access admin console. |

Permissions are enforced on the back‑end via middleware that checks the JWT `role` claim.

---

## 6. Security Model
1. **Transport Security** – All API traffic uses **HTTPS** (TLS 1.3). 
2. **Authentication** – **JWT** access token (short‑lived) + **Refresh token** (long‑lived) stored in **Secure Enclave/Keychain** on the device. 
3. **Authorization** – Role‑based checks (Patient/Doctor/Admin) on each endpoint. 
4. **Data‑at‑Rest** – Sensitive fields (SSN, medical identifiers) are encrypted using **AES‑256‑GCM** before persisting to PostgreSQL. 
5. **Keystore** – Android release APK is signed with a **private keystore** (`lifecare-release.keystore`). The keystore password is never committed; it is supplied via CI secret variables. 
6. **Secure Storage on Device** – `react‑native‑keychain` protects tokens; backup disabled for the keystore. 
7. **Input Validation** – All incoming JSON is validated with **Joi** (backend) and **Yup** (frontend) to prevent injection attacks. 
8. **Logging** – No sensitive data (passwords, tokens) are ever logged. 
9. **Privacy** – GDPR‑compliant data‑deletion endpoint (`/users/:id`) that anonymizes records after a configurable retention period.

---

## 7. Required Data Model (Core Entities)
```mermaid
classDiagram
    class User {
        +uuid id
        +string email
        +string phone
        +string passwordHash
        +enum role {PATIENT,DOCTOR,ADMIN}
        +Date createdAt
        +Date updatedAt
    }
    class Profile {
        +uuid userId
        +string fullName
        +date birthDate
        +string gender
        +string address
        +string emergencyContact
    }
    class Appointment {
        +uuid id
        +uuid patientId
        +uuid doctorId
        +datetime startTime
        +datetime endTime
        +enum status {PENDING,CONFIRMED,CANCELLED,COMPLETED}
    }
    class MedicalRecord {
        +uuid id
        +uuid patientId
        +enum type {LAB, PRESCRIPTION, IMAGING}
        +string title
        +string description
        +date recordDate
        +string fileUrl
    }
    class Message {
        +uuid id
        +uuid fromUserId
        +uuid toUserId
        +string content
        +datetime sentAt
    }
    User "1" -- "1" Profile : has
    User "1" -- "*" Appointment : patient/doctor
    User "1" -- "*" MedicalRecord : owns
    User "1" -- "*" Message : sends/receives
```

---

## 8. Data Flow (Typical Use‑Case)
1. **User opens app → Splash Screen** (checks secure storage for a valid refresh token).
2. **If token exists** → auto‑refresh flow → app navigates to **Home Dashboard**.
3. **If not** → user lands on **Login** screen → credentials sent to **/auth/login** → server returns **access + refresh token**.
4. **Home Dashboard** fetches data in parallel:
   - `GET /appointments?status=upcoming`
   - `GET /medical-records?latest=true`
   - `GET /notifications`
5. When user taps **Book Appointment** → form data posted to `POST /appointments` → server validates doctor‑patient relationship → creates record → pushes **Socket.io** event to doctor’s device.
6. **Chat** uses Socket.io: client emits `message:new` → server stores it, acknowledges, broadcasts to receiver.
7. **Logout** clears secure storage and revokes refresh token via `POST /auth/logout`.

---

## 9. Deployment & Runtime Overview
- **Backend** runs on a Docker container (Node + PostgreSQL) behind an **NGINX** reverse proxy.
- **CI/CD** (GitHub Actions) builds the Android APK, signs it with the keystore, runs unit & integration tests, then publishes the artifact to **Google Play Console**.
- **Monitoring** – Health‑check endpoint (`/health`) scraped by **Prometheus**, dashboards in **Grafana**.
- **Versioning** – Semantic versioning (`MAJOR.MINOR.PATCH`) reflected in `package.json` and Android `versionCode`.

---

## 10. Glossary of Key Terms
- **JWT** – JSON Web Token used for stateless authentication.
- **Keystore** – Android signing key that guarantees the integrity of the APK.
- **Riverpod** – Modern state‑management solution for Flutter/React‑Native.
- **Socket.io** – Real‑time bidirectional communication library.
- **GDPR** – European data‑privacy regulation; our app provides data‑deletion and consent flows.

---

### 📌 Summary
The **Life‑Care** mobile app combines a **React‑Native front‑end** with a **Node.js/Express back‑end**, secured by JWT authentication, role‑based authorization, and encrypted storage. It supports three distinct user profiles (Patient, Doctor, Admin) each with tailored screens and permissions. All sensitive data is protected both in‑transit (HTTPS) and at‑rest (AES‑256), and the Android build is signed with a dedicated keystore. The architecture is modular, allowing future expansion (e.g., adding tele‑health video, analytics, or multilingual support).

---

*Prepared by Antigravity – your AI coding assistant.*
