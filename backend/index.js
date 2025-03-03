const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./connection/database");
const userroutes = require("./routes/userroutes");
const fileroutes = require("./routes/fileroutes");
const app = express();
const PORT = 5000;
const cleanup = require("./connection/cleanup");
// Serve static files from the 'public' directory
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//routes
app.use("/users" , userroutes);
app.use("/files" , fileroutes);
app.use("/api", fileroutes);  // Ensure API is correctly mapped

//serve frontend html
app.get("/" , (req , res) => {
    res.sendFile(path.join(__dirname , "../frontend" , "home.html"));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    cleanup();
});
