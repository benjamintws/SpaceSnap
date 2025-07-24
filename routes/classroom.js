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
    const { level, location, capacity, start, end, status } = req.query;

    const filter = {};
    if (level) filter.level = Number(level);
    if (location) filter.location = { $regex: new RegExp(location, 'i') };
    if (capacity) filter.capacity = { $gte: Number(capacity) };

    let classrooms = await Classroom.find(filter);

    if (status === 'available' && start && end) {
      const today = new Date().toISOString().split('T')[0];
      const availableClassrooms = [];

      for (let classroom of classrooms) {
        const conflict = await Booking.findOne({
          classroom: classroom._id,
          date: today,
          status: 'approved',
          $or: [
            { startTime: { $lt: end }, endTime: { $gt: start } }
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
