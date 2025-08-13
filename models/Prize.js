const mongoose = require("mongoose");

const prizeSchema = new mongoose.Schema({
    emailId: { type: String, required: true },
    score: { type: Number, required: true },
    prize: { type: Number, required: true }
});

module.exports = mongoose.model("Prize", prizeSchema);
