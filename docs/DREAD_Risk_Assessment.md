# DREAD Risk Assessment — Coffee House Loyalty System

DREAD is a scoring system used to measure how serious each security risk is.
Each threat gets a score from 1 to 10 in five categories.
The final score is the average — the higher the score, the more dangerous the threat.

---

## How DREAD Scoring Works

| Letter | Category | Question to Ask |
|--------|----------|-----------------|
| D | Damage Potential | How bad is the damage if this attack succeeds? |
| R | Reproducibility | How easy is it to repeat the attack? |
| E | Exploitability | How much skill does the attacker need? |
| A | Affected Users | How many users are impacted? |
| D | Discoverability | How easy is it for an attacker to find this vulnerability? |

**Score:** 1 = Low, 5 = Medium, 10 = High

---

## Threat 1 — Brute Force Login (Password Guessing)

An attacker keeps trying different passwords until they get into someone's account.

| Category | Score | Reason |
|----------|-------|--------|
| Damage Potential | 8 | Full access to the user's account and points |
| Reproducibility | 9 | Can be scripted and run repeatedly |
| Exploitability | 6 | Only needs basic scripting knowledge |
| Affected Users | 3 | Targets one user at a time |
| Discoverability | 8 | Login page is publicly visible |
| **Average** | **6.8 — High** | |

**Mitigation:** Rate limiting (10 attempts per 15 min) + bcrypt slows down each guess

---

## Threat 2 — JWT Token Theft

An attacker steals a user's JWT token (e.g. from localStorage) and uses it to access the account.

| Category | Score | Reason |
|----------|-------|--------|
| Damage Potential | 7 | Full access until the token expires |
| Reproducibility | 5 | Requires access to the victim's browser or network |
| Exploitability | 5 | Needs some technical knowledge (XSS or network sniffing) |
| Affected Users | 2 | Only affects the specific user whose token was stolen |
| Discoverability | 4 | Token is stored in localStorage — visible in DevTools |
| **Average** | **4.6 — Medium** | |

**Mitigation:** Tokens expire after 24 hours so they don't work forever

---

## Threat 3 — SQL Injection

An attacker enters malicious SQL code into an input field to manipulate the database.

**Example:** Entering `' OR 1=1 --` in the email field to bypass login.

| Category | Score | Reason |
|----------|-------|--------|
| Damage Potential | 10 | Could read, modify, or delete the entire database |
| Reproducibility | 9 | Easy to automate with known payloads |
| Exploitability | 5 | Many tools exist that do this automatically |
| Affected Users | 10 | Could affect every single user in the database |
| Discoverability | 7 | Input fields are always visible and easy to test |
| **Average** | **8.2 — Critical** | |

**Mitigation:** All SQL queries use parameterized statements (`?` placeholders) — user input never touches the query directly

---

## Threat 4 — Elevation of Privilege (User Accessing Admin Routes)

A regular user manually sends requests to admin-only API endpoints.

| Category | Score | Reason |
|----------|-------|--------|
| Damage Potential | 9 | Could view all users, delete rewards, add fake points |
| Reproducibility | 9 | Any logged-in user can try this at any time |
| Exploitability | 4 | Just needs to know the API route names |
| Affected Users | 10 | Admin actions affect all users |
| Discoverability | 5 | Route names can be guessed or found in source code |
| **Average** | **7.4 — High** | |

**Mitigation:** Every admin route checks `role === 'admin'` via middleware — returns 403 if not admin

---

## Threat 5 — Sensitive Data Exposure (Phone Number Leak)

The database file gets accessed by an unauthorized person and phone numbers are exposed.

| Category | Score | Reason |
|----------|-------|--------|
| Damage Potential | 7 | Personal data exposure, privacy violation |
| Reproducibility | 4 | Requires physical or remote access to the server |
| Exploitability | 4 | Needs server access which is harder to get |
| Affected Users | 10 | All users who provided a phone number |
| Discoverability | 3 | Database file is not publicly accessible |
| **Average** | **5.6 — Medium** | |

**Mitigation:** Phone numbers are encrypted with AES-256 before storing — even if the database leaks, the data is unreadable without the secret key

---

## Threat 6 — Denial of Service (Flooding the Server)

An attacker sends thousands of requests to crash the server or slow it down for real users.

| Category | Score | Reason |
|----------|-------|--------|
| Damage Potential | 6 | Server becomes unavailable for all users |
| Reproducibility | 9 | Easy to automate with basic tools |
| Exploitability | 3 | Many free tools exist to flood requests |
| Affected Users | 10 | No one can use the app while it's down |
| Discoverability | 8 | The login endpoint is publicly accessible |
| **Average** | **7.2 — High** | |

**Mitigation:** express-rate-limit blocks excessive requests per IP address

---

## Overall Risk Summary

| Threat | DREAD Score | Risk Level |
|--------|-------------|------------|
| SQL Injection | 8.2 | Critical |
| Elevation of Privilege | 7.4 | High |
| Denial of Service | 7.2 | High |
| Brute Force Login | 6.8 | High |
| Sensitive Data Exposure | 5.6 | Medium |
| JWT Token Theft | 4.6 | Medium |

All identified threats have been addressed through the security features implemented in this project.
