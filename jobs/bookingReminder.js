const cron = require('node-cron');
const Booking = require('../models/Booking');
const Classroom = require('../models/Classroom');
const Notification = require('../models/Notification');

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();

    // Today's date string
    const todayStr = now.toISOString().split('T')[0];

    // Find all approved bookings for today
    const bookings = await Booking.find({
      status: 'approved',
      date: todayStr
    });

    for (const booking of bookings) {
      // Convert startTime string ("02:00") to full Date object
      const [hour, minute] = booking.startTime.split(':').map(Number);
      const bookingTime = new Date(booking.date);
      bookingTime.setHours(hour, minute, 0, 0);

      const timeUntilBooking = bookingTime.getTime() - now.getTime();

      // If booking starts in the next 60 minutes (but not past)
      if (timeUntilBooking > 0 && timeUntilBooking <= 60 * 60 * 1000) {
        // Check if reminder already sent
        const classroom = await Classroom.findById(booking.classroom);
        const reminderText = `Reminder: You have a booking for ${classroom.name} at ${booking.startTime} today.`;

        const duplicate = await Notification.findOne({
          user: booking.user,
          message: reminderText
        });

        if (!duplicate) {
          await Notification.create({
            user: booking.user,
            message: reminderText
          });
          console.log(`🔔 Reminder sent to user ${booking.user} for ${classroom.name}`);
        }
      }
    }
  } catch (err) {
    console.error('Reminder cron error:', err.message);
  }
});
