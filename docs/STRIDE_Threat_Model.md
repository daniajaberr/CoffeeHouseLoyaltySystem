# STRIDE Threat Model — Coffee House Loyalty System

STRIDE is a framework used to identify security threats in a system.
Each letter stands for a different type of threat.

---

## What is STRIDE?

| Letter | Threat | Simple Meaning |
|--------|--------|----------------|
| S | Spoofing | Pretending to be someone else |
| T | Tampering | Changing data you're not supposed to change |
| R | Repudiation | Denying that you did something |
| I | Information Disclosure | Leaking private data |
| D | Denial of Service | Crashing or overloading the system |
| E | Elevation of Privilege | A normal user acting like an admin |

---

## S — Spoofing

**Threat:** An attacker tries to log in as another user by guessing their password or stealing their JWT token.

**Example:** Someone keeps trying different passwords on a user's account until they get in.

**How we handle it:**
- Passwords are hashed using **bcrypt** so even if the database leaks, passwords can't be read
- **Rate limiting** blocks an IP after 10 failed login attempts in 15 minutes
- **JWT tokens expire after 24 hours** so stolen tokens don't work forever

---

## T — Tampering

**Threat:** An attacker tries to modify data — for example, changing their own loyalty points or editing someone else's account.

**Example:** A user sends a fake API request to set their points to 99999.

**How we handle it:**
- All database queries use **parameterized statements** (no direct string input into SQL)
- Only admins can add points — the route `/api/admin/users/:id/add-points` requires an admin token
- **Input validation** with express-validator rejects unexpected or out-of-range values

---

## R — Repudiation

**Threat:** A user does something (like redeeming a reward) and then denies doing it.

**Example:** A user redeems a "Free Coffee" reward and then claims they never did it.

**How we handle it:**
- Every action requires a valid **JWT token** which contains the user's ID
- The server knows exactly which user made the request
- Server-side logging records errors and actions (console logs on the server)

---

## I — Information Disclosure

**Threat:** Private user data gets exposed — like phone numbers, passwords, or internal server details.

**Example:** The database file gets stolen, or an error message accidentally shows the file path of the server.

**How we handle it:**
- Phone numbers are **AES-256 encrypted** before being stored in the database
- Passwords are **bcrypt hashed** — they can never be reversed
- The **global error handler** never sends stack traces or internal details to the client
- **Helmet** sets HTTP headers that prevent browsers from exposing internal info

---

## D — Denial of Service

**Threat:** An attacker floods the login or register endpoint with thousands of requests to crash the server or lock out real users.

**Example:** A bot sends 10,000 login requests per minute.

**How we handle it:**
- **express-rate-limit** limits login to 10 requests per 15 minutes per IP
- **express-rate-limit** limits registration to 5 requests per 15 minutes per IP
- Attackers get a `429 Too Many Requests` response and are blocked

---

## E — Elevation of Privilege

**Threat:** A regular user tries to access admin-only features like viewing all users or deleting rewards.

**Example:** A logged-in user manually sends a request to `/api/admin/users` hoping the server doesn't check their role.

**How we handle it:**
- Every admin route uses **two middleware checks**: `verifyToken` + `requireAdmin`
- `verifyToken` checks the JWT is valid
- `requireAdmin` checks the role inside the token is `admin`
- If role is `user`, the server returns `403 Forbidden` immediately
- Users cannot change their own role — it is set server-side on registration

---

## Summary Table

| Threat | Risk Level | Status |
|--------|------------|--------|
| Spoofing (password guessing) | High | Mitigated — bcrypt + rate limiting |
| Tampering (fake requests) | High | Mitigated — validation + role checks |
| Repudiation (deny actions) | Low | Mitigated — JWT identifies every user |
| Information Disclosure (data leak) | High | Mitigated — AES encryption + error handler |
| Denial of Service (flooding) | Medium | Mitigated — rate limiting |
| Elevation of Privilege (user → admin) | High | Mitigated — middleware RBAC |
