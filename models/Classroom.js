const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  capacity: Number,
  location: {
    type: String,
    required: true // e.g., "West Building"
  },
  level: {
    type: Number,
    required: true // e.g., 2
  },
  equipment: [String] // e.g., ["Projector", "Speakers"]
});

module.exports = mongoose.model('Classroom', classroomSchema);
