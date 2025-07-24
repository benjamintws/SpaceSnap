const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticate } = require('../middlewares/auth');

// GET /api/notifications - View current user's notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ DELETE /api/notifications/:id - Delete a specific notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format first
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid notification ID format' });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // 🔒 Make sure the user owns this notification
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this notification' });
    }

    await notification.deleteOne();
    return res.json({ message: 'Notification deleted successfully' });

  } catch (err) {
    console.error('❌ Error deleting notification:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
