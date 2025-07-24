const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');
const Booking = require('../models/Booking');
const { authenticate, authorizeRoles } = require('../middlewares/auth'); // 🔐 Auth check

// GET /api/classrooms/levels - View all distinct levels
router.get('/levels', authenticate, async (req, res) => {
  try {
    const levels = await Classroom.distinct('level');
    res.json(levels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/classrooms - Filter by level
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};
    if (req.query.level !== undefined) {
      filter.level = Number(req.query.level); // e.g. ?level=0
    }

    const classrooms = await Classroom.find(filter);

    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/classrooms/filter - Advanced filtering
router.get('/filter', authenticate, async (req, res) => {
  try {
    let { level, location, capacity, start, end, status, equipment } = req.query;

    const filter = {};

    // Fix: support arrays for multi-select filters
    if (level) {
      const levels = Array.isArray(level) ? level.map(Number) : [Number(level)];
      filter.level = { $in: levels };
    }

    if (location) {
      const locations = Array.isArray(location) ? location : [location];
      filter.location = { $in: locations };
    }

    if (capacity) {
      filter.capacity = { $gte: Number(capacity) };
    }

    if (equipment) {
      const eqList = Array.isArray(equipment) ? equipment : [equipment];
      filter.equipment = { $all: eqList }; // classroom must have ALL selected
    }

    let classrooms = await Classroom.find(filter);

    // Optional: availability check (status = "available")
    if (status === 'available' && start && end) {
      const today = new Date().toISOString().split('T')[0];

      classrooms = await Promise.all(classrooms.map(async (classroom) => {
        const conflict = await Booking.findOne({
          classroom: classroom._id,
          date: today,
          status: 'approved',
          $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }]
        });
        return conflict ? null : classroom;
      }));

      classrooms = classrooms.filter(Boolean);
    }

    res.json(classrooms);
  } catch (err) {
    console.error('[FILTER ERROR]', err);
    res.status(500).json({ message: 'Filter failed', error: err.message });
  }
});


// Optional: GET classroom by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/classrooms/add - Admin only
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
