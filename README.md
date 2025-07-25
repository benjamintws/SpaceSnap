
# SpaceSnap - Classroom Booking System

SpaceSnap is a classroom booking web application built using **Node.js**, **Express**, and **MongoDB**. It supports different roles for students, teachers, and admins.

---

## 🚀 Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/spacesnap.git
cd spacesnap
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and add:

```env
PORT=3000
DATABASE_URL=mongodb+srv://<username>:<password>@<your-cluster>.mongodb.net/spacesnap
JWT_SECRET=your_jwt_secret
```

Replace `<username>`, `<password>`, and `<your-cluster>` with your MongoDB credentials. `JWT_SECRET` can be any long random string.

### 4. Start MongoDB (if local)

If using a local MongoDB instance:

```bash
mongod
```

If using MongoDB Atlas, ensure your `.env` has the correct connection string.

### 5. Run the Development Server

Start with nodemon (auto-restarts on changes):

```bash
npm run devStart
```

Or run once manually:

```bash
node server.js
```

---

## 🌐 Access the App

Once running, go to:

```
http://localhost:3000
```

---

## 👥 User Roles

- **Students:** Can book 1 slot/week (non-refundable if cancelled)
- **Teachers:** Can book 5 slots/week, max 1 per day (refundable on cancel)
- **Admins:** Can approve/reject bookings and manage notifications

---

## 📚 API Routes Overview

- `/api/auth/login` – User login
- `/api/classrooms` – View & filter classrooms
- `/api/bookings` – Create, approve, cancel bookings
- `/api/notifications` – View and delete booking notifications

---

## 🖥️ Frontend Pages

- `public/user_index.html` – Dashboard (student/teacher)
- `public/user_classrooms.html` – Classroom filtering
- `public/user_notification.html` – Notifications
- `public/admin_index.html` – Admin dashboard

---

## 📁 Folder Structure

```
SpaceSnap/
├── jobs/
│   └── bookingReminder.js
├── middlewares/
│   └── auth.js
├── models/
│   ├── Booking.js
│   ├── Classroom.js
│   ├── Notification.js
│   └── User.js
├── public/
│   ├── admin_index.html
│   ├── login.html
│   ├── student.html
│   ├── user_classrooms.html
│   ├── user_index.html
│   ├── user_notification.html
│   ├── css/
│   ├── images/
│   └── js/
├── routes/
│   ├── auth.js
│   ├── booking.js
│   ├── classroom.js
│   ├── index.js
│   └── notification.js
├── views/
│   ├── index.ejs
│   └── layouts/
│       └── layout.ejs
├── server.js
├── .env
├── package.json
└── README.md
```

---

## 🛠️ Useful Commands

- `npm install` : Install dependencies
- `npm run devStart` : Start server with nodemon
- `node server.js` : Run server manually

---

## ⚠️ Notes

- Ensure MongoDB is running and accessible before starting the server
- Admin accounts can be manually added to the database or pre-seeded
- No registration page – login only

---

## 📄 License

MIT License

