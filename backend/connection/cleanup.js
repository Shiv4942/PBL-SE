const fs = require("fs");
const path = require("path");
const cron = require("node-cron");

const uploadDir = path.join(__dirname, "../uploads");

// Function to delete old files
const deleteOldFiles = () => {
    console.log("Running daily file cleanup...");

    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error("Error reading upload directory:", err);
            return;
        }

        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        files.forEach((file) => {
            const filePath = path.join(uploadDir, file);

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error("Error getting file stats:", err);
                    return;
                }

                // Delete files older than one day
                if (now - stats.mtimeMs > oneDay) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error(`Error deleting file ${file}:`, err);
                        } else {
                            console.log(`Deleted old file: ${file}`);
                        }
                    });
                }
            });
        });
    });
};

// Schedule cleanup to run daily at midnight
cron.schedule("0 0 * * *", deleteOldFiles);

module.exports = deleteOldFiles;
