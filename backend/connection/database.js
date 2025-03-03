const mysql = require("mysql2");//to connect mysql

// Create a connection pool (better for multiple connections)
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Shiv123@:", 
    database: "mydata",
    waitForConnections: true,
    connectionLimit: 100, 
    queueLimit: 0,
});

// Check if database is connected
pool.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("Connected to MySQL database!");
        connection.release();//returns the connection back to pool after it has been used
    }
});

module.exports = pool; // Use promise-based queries
