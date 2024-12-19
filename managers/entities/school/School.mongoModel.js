const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: String,
  address: String,
  classrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }]
});

const School = mongoose.model('School', schoolSchema);

module.exports = School;

