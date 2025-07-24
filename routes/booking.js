const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Classroom = require('../models/Classroom');
const Notification = require('../models/Notification');
const { authenticate, authorizeRoles } = require('../middlewares/auth');
const mongoose = require('mongoose');


// Helper: get week range from a date
const getWeekRange = (date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay()); // Sunday
  const end = new Date(start);
  end.setDate(end.getDate() + 6); // Saturday
  return { start, end };
};

// ✅ POST /api/bookings - Create booking
router.post('/', authenticate, async (req, res) => {
  let { classroom, date, startTime, endTime } = req.body;

    // If classroom is a name, look up its ID
    if (!mongoose.Types.ObjectId.isValid(classroom)) {
    const found = await Classroom.findOne({ name: classroom });
    if (!found) {
        return res.status(404).json({ message: 'Classroom not found by name' });
    }
    classroom = found._id;
    }

  const userId = req.user.id;
  const role = req.user.role;

  try {
    const bookingDate = new Date(date);
    const { start, end } = getWeekRange(bookingDate);

    // Count existing bookings this week
    const weeklyBookings = await Booking.find({
      user: userId,
      date: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' },
      refunded: false
    });

    // Custom rule: student = 1 per week
    if (role === 'student' && weeklyBookings.length >= 1) {
      return res.status(403).json({ message: 'Students can only book once per week.' });
    }

    // Custom rule: teacher = 5 per week, only 1 per day
    if (role === 'teacher') {
      const sameDay = weeklyBookings.find(b => new Date(b.date).toDateString() === bookingDate.toDateString());
      if (sameDay) {
        return res.status(403).json({ message: 'Teachers can only book once per day.' });
      }
      if (weeklyBookings.length >= 5) {
        return res.status(403).json({ message: 'Teachers can only book 5 times per week.' });
      }
    }

    // Check for time conflicts (approved bookings)
    const conflict = await Booking.findOne({
      classroom,
      date: bookingDate,
      status: 'approved',
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });

    if (conflict) {
      return res.status(409).json({ message: 'Classroom already booked for that time.' });
    }

    const booking = new Booking({
      user: userId,
      classroom,
      date: bookingDate,
      startTime,
      endTime
    });

    await booking.save();
    res.status(201).json({ message: 'Booking created (pending approval)', booking });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all pending bookings (admin only)
router.get('/admin/pending', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'pending' })
      .populate('user', 'name email role')
      .populate('classroom', 'name location level');

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve or reject a booking by ID (admin only)
router.put('/admin/:id/approve', authenticate, authorizeRoles('admin'), async (req, res) => {
  const { action, reason } = req.body; // action = 'approve' or 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action. Must be approve or reject.' });
  }

  // Including reason for rejection
  if (action === 'reject' && (!reason || reason.trim() === '')) {
    return res.status(400).json({ message: 'Rejection reason is required.' });
  }

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking already processed' });
    }

    booking.status = action === 'approve' ? 'approved' : 'rejected';

    // Store reason inside booking
    if (action === 'reject') {
      booking.rejectionReason = reason;
    }

    await booking.save();

    // ✅ Create notification
    const classroom = await Classroom.findById(booking.classroom);
    const formattedDate = new Date(booking.date).toLocaleDateString('en-MY');
    const formattedTime = `${booking.startTime} - ${booking.endTime}`;


    const message =
      action === 'approve'
        ? `Your booking for ${classroom.name} on ${formattedDate} at ${formattedTime} has been approved.`
        : `Your booking for ${classroom.name} on ${formattedDate} at ${formattedTime} was rejected. \nReason: ${reason}`;

    await Notification.create({
      user: booking.user,
      message
    });

    res.json({ message: `Booking ${booking.status}`, booking });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel a booking
router.put('/:id/cancel', authenticate, async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== userId) return res.status(403).json({ message: 'Not your booking' });
    if (booking.status !== 'approved') return res.status(400).json({ message: 'Only approved bookings can be cancelled' });

    // Set status to cancelled
    booking.status = 'cancelled';
    await booking.save();

    let message = 'Booking cancelled.';

    // Refund logic for teachers
    if (role === 'teacher') {
      message += ' Slot refunded. You can book another this week.';
      // nothing extra needed; teachers are allowed to rebook as logic checks weekly count
    }

    // Students: no refund needed (weekly limit logic already blocks rebooking)
    res.json({ message, booking });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/bookings/:id/refund - Admin manually refunds booking slot
router.put('/:id/refund', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.refunded) return res.status(400).json({ message: 'Booking already refunded' });

    booking.refunded = true;
    await booking.save();

    res.json({ message: 'Booking slot manually refunded', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET /api/bookings/my - View current user's bookings
router.get('/my', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('classroom', 'name location level')
      .sort({ date: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
