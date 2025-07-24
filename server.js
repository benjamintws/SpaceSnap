if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const path = require('path')
const app = express()

// Route files
const authRoutes = require('./routes/auth')
const classroomRoutes = require('./routes/classroom')
const bookingRoutes = require('./routes/booking')
const notificationRoutes = require('./routes/notification')

// Middleware
app.use(express.static(path.join(__dirname, 'public'))) // serve HTML, CSS, JS
app.use(express.json()) // parse JSON in request body

// MongoDB connection
const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to:', mongoose.connection.name);
});

const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose'))

// Serve login.html at root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'))
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/classrooms', classroomRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/notifications', notificationRoutes)

// Cron job
require('./jobs/bookingReminder')

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running on port', process.env.PORT || 3000)
})
