const mongoose = require("mongoose");

// Define schema for Classroom model
const classroomSchema = new mongoose.Schema({
    name: String,
    description: String,
    capacity: Number,
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'
    },
    students: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        }
    ]
});

const Classroom = mongoose.model('Classroom', classroomSchema);

module.exports = Classroom;
