# 🚀 TerraMatch — Complete Startup & Deployment Guide

Welcome to **TerraMatch** — the full-stack land marketplace and verified construction matching platform built for Ghana and West Africa.

This package contains the entire production frontend, backend, database schema, AI recommendation algorithms, GIS mapping, and administrative portal.

---

## 📋 System Requirements

Before running the application, make sure your computer has:
1. **Node.js**: v18.0.0 or later ([Download Node.js](https://nodejs.org/))
2. **PostgreSQL**: v14.0 or later ([Download PostgreSQL](https://www.postgresql.org/download/))
3. **Git**: (Optional)

---

## ⚡ 1-Minute Quick Start

### Step 1: Start PostgreSQL & Create Database
Make sure PostgreSQL is running, then create the database `terramatch_db`:
```sql
CREATE DATABASE terramatch_db;
```
*(If you need to change your database username/password, update `server/.env`)*

### Step 2: Automatic Setup (Installs everything + seeds database)

- **On Windows**:
  Double-click `setup.bat` or run:
  ```cmd
  setup.bat
  ```

- **On Mac / Linux**:
  ```bash
  chmod +x setup.sh start.sh
  ./setup.sh
  ```

- **Or manually via npm**:
  ```bash
  npm run setup
  ```

### Step 3: Launch the Entire Platform!

- **On Windows**:
  Double-click `start.bat` or run:
  ```cmd
  start.bat
  ```

- **On Mac / Linux**:
  ```bash
  ./start.sh
  ```

- **Or manually via npm**:
  ```bash
  npm run dev:all
  ```

That's it! 
- 🌐 **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- 🔌 **Backend REST API**: [http://localhost:8082](http://localhost:8082)
- 📊 **Secret Admin Portal**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

---

## 🔑 Default Accounts & Credentials

### 1. Administrative Governance Portal
- **URL**: `http://localhost:5173/admin/login`
- **Email**: `tobiasatsyor@gmail.com`
- **Password**: `Admin1234`
- **Capabilities**: View real-time platform statistics, moderate land listings, review & approve submitted Ghana Cards, and suspend/activate users.

### 2. Verified Land Owner (Kwame Owusu)
- **Email**: `kwame.owusu@email.com`
- **Password**: `Password123!`
- **Capabilities**: Owner of listed lands in East Legon Hills, Oyarifa, Adenta, Tema, and Amasaman.

### 3. Client / Bidder Account
- You can register any new account instantly on the signup page with Firebase real email verification!

---

## 🏗️ Architecture & Features

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS | High-performance reactive UI with client routing and live state. |
| **Backend API** | Node.js, Express, Prisma ORM | Secure REST API with rate limiting, helmet, and CORS. |
| **Database** | PostgreSQL | Relational schema with ACID atomic transactions for bidding. |
| **Auth** | Firebase Authentication | Real email verification links, password reset, and session tokens. |
| **GIS Mapping** | Leaflet, OpenStreetMap | Interactive Ghana property map with pins and topographic stats. |
| **AI Matching** | Algorithmic Multi-Factor Scoring | Custom AI contractor recommendation scoring and project consultant. |

---

## 🧪 Running Automated Tests

To verify all 11 core systems and end-to-end integration:
```bash
node server/test_e2e.js
```

---

## 📞 Support & Contacts
Built with passion for Ghana's real estate & construction industry.
For inquiries, contact the team at **support@terramatch.gh**.
