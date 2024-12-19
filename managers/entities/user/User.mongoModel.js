const mongoose = require("mongoose");

// Define schema for User model
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    name: String,
    email: {type: String, required: true},
    password: {
        type: String,
        select: false
    },

    // maybe: can move to another document, if number of roles grows
    roles: {
        type: {
            isSuper: { type: Boolean },
            schoolAdmin: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'School'
            }]
        },
        default: { isSuper: false }
    }
});

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
