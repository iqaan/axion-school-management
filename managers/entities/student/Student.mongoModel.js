const mongoose = require("mongoose");

// Define schema for Student model
const studentSchema = new mongoose.Schema({
    rollNumber: {
        type: String,
        unique: true
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'
    },
    classrooms: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Classroom'
        }
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true
    }
});

// Create the Student model
const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
