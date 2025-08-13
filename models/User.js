const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    emailId: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Email format validation
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    }
});

module.exports = mongoose.model("User", userSchema);
