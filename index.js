const express = require("express");
const router = express.Router();

const User = require("./models/User");
const Score = require("./models/Score");
const Prize = require("./models/Prize");

// ===== 1. Register =====
router.post("/register", async (req, res) => {
    try {
        const { emailId, password } = req.body;
        const exists = await User.findOne({ emailId });

        if (exists) return res.status(409).json({ success: false, message: "Email already exists" });

        const user = new User({ emailId, password });
        await user.save();

        res.status(201).json({ success: true, message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ===== 2. Login =====
router.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;
        const user = await User.findOne({ emailId, password });

        if (!user) return res.status(401).json({ success: false, message: "Invalid email or password" });

        res.json({ success: true, message: "Login successful" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ===== 3. Find Score =====
router.post("/find-score", async (req, res) => {
    try {
        const { emailId, profit, loss, time } = req.body;

        if ([profit, loss, time].some(v => !Number.isInteger(v) || v <= 0)) {
            return res.status(400).json({ success: false, message: "Values must be positive integers" });
        }

        const user = await User.findOne({ emailId });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const count = await Score.countDocuments({ emailId });
        if (count >= 2) {
            return res.status(429).json({ success: false, message: "API hit limit reached for this user" });
        }

        const score = (profit * 100) / (loss * time);
        const newScore = new Score({ emailId, profit, loss, time, score });
        await newScore.save();

        res.json({ success: true, message: "Score calculated", data: { emailId, score } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ===== 4. Leaderboard (All Data) =====
router.get("/leaderboard-dataAll", async (req, res) => {
    try {
        const scores = await Score.find().sort({ score: 1 });
        res.json({ success: true, data: scores });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ===== 5. Top Users Leaderboard (API key protected) =====
router.get("/top-user", async (req, res) => {
    try {
        const apiKey = req.headers["x-api-key"];
        if (apiKey !== process.env.API_KEY) {
            return res.status(401).json({ success: false, message: "Invalid or missing API key" });
        }

        const topUsers = await Score.aggregate([
            { $group: { _id: "$emailId", score: { $max: "$score" } } },
            { $sort: { score: -1 } },
            { $limit: 3 }
        ]);

        const prizes = [100, 50, 25];
        const prizeDocs = topUsers.map((u, idx) => ({
            emailId: u._id,
            score: u.score,
            prize: prizes[idx]
        }));

        await Prize.deleteMany({});
        await Prize.insertMany(prizeDocs);

        res.json({ success: true, data: prizeDocs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
