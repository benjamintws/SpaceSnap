if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')

// Route files
const indexRouter = require('./routes/index') 
const authRoutes = require('./routes/auth') 
const classroomRoutes = require('./routes/classroom'); 
const bookingRoutes = require('./routes/booking');
const notificationRoutes = require('./routes/notification');

// Middleware setup
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.set('layout', 'layouts/layout')
app.use(expressLayouts)
app.use(express.static('public'))
app.use(express.json()); // parses JSON in request body

// MongoDB connection
const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose'))

// Routes
app.use('/', indexRouter)
app.use('/api/auth', authRoutes)
app.use('/api/classrooms', classroomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);


require('./jobs/bookingReminder'); // 🔔 Start reminder cron


app.listen(process.env.PORT || 3000)