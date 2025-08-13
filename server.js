const express = require("express");
const app = express();

app.use(express.json());

// ===== In-memory databases =====
let userDatabase = [];
let scoreDatabase = [];
let prizeDatabase = [];

// ===== API Key =====
const API_KEY = "super-secret-key-123";

// ===== 1. Register =====
app.post("/register", (req, res) => {
    const { emailId, password } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailId)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Password length check
    if (!password || password.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    // Duplicate email check
    const exists = userDatabase.find(u => u.emailId === emailId);
    if (exists) {
        return res.status(409).json({ success: false, message: "Email already exists" });
    }

    userDatabase.push({ emailId, password });
    res.status(201).json({ success: true, message: "User registered successfully" });
});

// ===== 2. Login =====
app.post("/login", (req, res) => {
    const { emailId, password } = req.body;

    const user = userDatabase.find(u => u.emailId === emailId && u.password === password);
    if (!user) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    res.json({ success: true, message: "Login successful" });
});

// ===== 3. Find Score =====
app.post("/find-score", (req, res) => {
    const { emailId, profit, loss, time } = req.body;

    // Validate positive integers
    if ([profit, loss, time].some(v => !Number.isInteger(v) || v <= 0)) {
        return res.status(400).json({ success: false, message: "Values must be positive integers" });
    }

    const user = userDatabase.find(u => u.emailId === emailId);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const count = scoreDatabase.filter(s => s.emailId === emailId).length;
    if (count >= 2) {
        return res.status(429).json({ success: false, message: "API hit limit reached for this user" });
    }

    const score = (profit * 100) / (loss * time);
    scoreDatabase.push({ emailId, profit, loss, time, score });

    res.json({ success: true, message: "Score calculated", data: { emailId, score } });
});

// ===== 4. Leaderboard (All Data) =====
app.get("/leaderboard-dataAll", (req, res) => {
    const sortedScores = [...scoreDatabase].sort((a, b) => a.score - b.score);
    res.json({ success: true, data: sortedScores });
});

// ===== 5. Top Users Leaderboard (API key protected) =====
app.get("/top-user", (req, res) => {
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== API_KEY) {
        return res.status(401).json({ success: false, message: "Invalid or missing API key" });
    }

    const topUsers = scoreDatabase.reduce((acc, curr) => {
        const existing = acc.find(u => u.emailId === curr.emailId);
        if (!existing || curr.score > existing.score) {
            if (existing) acc = acc.filter(u => u.emailId !== curr.emailId);
            acc.push({ emailId: curr.emailId, score: curr.score });
        }
        return acc;
    }, []);

    topUsers.sort((a, b) => b.score - a.score);
    const prizes = [100, 50, 25];

    prizeDatabase = topUsers.slice(0, 3).map((u, idx) => ({
        emailId: u.emailId,
        score: u.score,
        prize: prizes[idx]
    }));

    res.json({ success: true, data: prizeDatabase });
});

// ===== Start Server =====
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
