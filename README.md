# ☕ Coffee House Loyalty System

A secure web application built for the Secure Software Development course.
Users can earn and redeem loyalty points. Admins can manage users and rewards.

---

## 👥 Roles

| Role | What They Can Do |
|------|-----------------|
| **User** | Register, Login, View profile, View & redeem rewards |
| **Admin** | Login, View all users, Add points, Add/Edit/Delete rewards |

---

## 🚀 How to Run

**Step 1 — Install dependencies (first time only)**
```
npm install
```

**Step 2 — Start the server**
```
node server/server.js
```

**Step 3 — Open in browser**
```
http://localhost:3000
```

**Default Admin Account**
```
Email:    admin@coffee.com
Password: admin123
```

---

## 🔒 Security Features

| Feature | How It's Implemented |
|--------|----------------------|
| Password Hashing | bcrypt (passwords are never stored in plain text) |
| Authentication | JWT — a signed token is issued after login |
| Authorization | Role-based access control (user vs admin) |
| Data Encryption | AES-256 encrypts sensitive data (phone number) in the database |
| Input Validation | express-validator checks all user inputs |
| Rate Limiting | Max 10 login attempts per 15 minutes per IP |
| Security Headers | Helmet sets HTTP headers (X-Frame-Options, etc.) |
| CORS Policy | Only requests from localhost are allowed |
| Error Handling | Stack traces are never sent to the client |

---

## 🗂️ Project Structure

```
CoffeeHouseLoyaltySystem/
├── server/
│   ├── server.js                 → Main entry point
│   ├── config/database.js        → SQLite database setup
│   ├── middleware/
│   │   ├── auth.js               → JWT verification & role check
│   │   ├── rateLimiter.js        → Brute-force protection
│   │   └── errorHandler.js       → Safe error responses
│   ├── routes/
│   │   ├── authRoutes.js         → Register & Login
│   │   ├── userRoutes.js         → Profile, Rewards, Redeem
│   │   └── adminRoutes.js        → Admin-only actions
│   └── utils/encryption.js       → AES encrypt/decrypt
└── public/
    ├── index.html                → Login & Register page
    ├── dashboard.html            → User dashboard
    ├── admin.html                → Admin panel
    └── style.css                 → Styles
```

---

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (via better-sqlite3)
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Security Libraries:** bcryptjs, jsonwebtoken, helmet, cors, express-validator, express-rate-limit

---

## 📋 Database Tables

**Users**
| Column | Description |
|--------|-------------|
| id | Auto-generated ID |
| name | User's full name |
| email | Unique email address |
| password_hash | bcrypt hashed password |
| encrypted_phone | AES-256 encrypted phone number |
| role | `user` or `admin` |
| loyalty_points | Current points balance |

**Rewards**
| Column | Description |
|--------|-------------|
| id | Auto-generated ID |
| reward_name | Name of the reward |
| points_required | Points needed to redeem |
