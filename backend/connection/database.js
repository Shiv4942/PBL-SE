const mysql = require("mysql2/promise");

// ✅ Create a MySQL2 connection pool with promise-based API
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Shiv123@:", 
    database: "mydata",
    waitForConnections: true,
    connectionLimit: 100, 
    queueLimit: 0,
});

// ✅ Check if the database is connected
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to MySQL database!");
        connection.release();
    } catch (err) {
        console.error("Database connection failed:", err);
    }
})();

// ✅ Export the promise-based pool
module.exports = pool;  // No need for `.promise()`
