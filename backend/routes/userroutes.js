const express = require("express");
const db = require("../connection/database");

const router = express.Router();//create express router

router.get("/", async (req, res) => {//get the date of document stored form /users
    try {
        const [results] = await db.promise().query("SELECT * FROM documents"); // ✅ Use promise-based query
        res.json(results);
    } catch (err) {
        console.error("Database query error:", err);
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;