const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');
const Booking = require('../models/Booking');
const { authenticate, authorizeRoles } = require('../middlewares/auth'); // 🔐 Auth check


// ✅ GET /api/classrooms - View all classrooms (auth required)
router.get('/', authenticate, async (req, res) => {
  try {
    const classrooms = await Classroom.find();
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/classrooms/filter - Filter classrooms (auth required)
router.get('/filter', authenticate, async (req, res) => {
  try {
    const { level, location, capacity, start, end, status } = req.query;

    // Step 1: Build base classroom filter
    const filter = {};
    if (level) filter.level = Number(level);
    if (location) filter.location = { $regex: new RegExp(location, 'i') };
    if (capacity) filter.capacity = { $gte: Number(capacity) };

    let classrooms = await Classroom.find(filter);

    // Step 2: If status = "available", filter based on time
    if (status === 'available' && start && end) {
      const startTime = start;
      const endTime = end;
      const today = new Date().toISOString().split('T')[0]; // today's date (YYYY-MM-DD)

      const availableClassrooms = [];

      for (let classroom of classrooms) {
        const conflict = await Booking.findOne({
          classroom: classroom._id,
          date: today,
          status: 'approved',
          $or: [
            { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
          ]
        });

        if (!conflict) {
          availableClassrooms.push(classroom);
        }
      }

      classrooms = availableClassrooms;
    }

    res.json(classrooms);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// (Optional: GET /:id to view a specific classroom)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ TEMP: POST /api/classrooms/add - Add classroom (admin only)
router.post('/add', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const classroom = new Classroom(req.body);
    await classroom.save();
    res.status(201).json({ message: 'Classroom added', classroom });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/classrooms/:id - Admin only
router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    res.json({ message: 'Classroom deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
