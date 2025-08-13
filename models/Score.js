const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
    emailId: { type: String, required: true },
    profit: { type: Number, required: true },
    loss: { type: Number, required: true },
    time: { type: Number, required: true },
    score: { type: Number, required: true }
});

module.exports = mongoose.model("Score", scoreSchema);
