const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../connection/database");
const { extractTextFromFile } = require("../ImageProcessing/textextractor");

const router = express.Router();
const uploadDir = path.join(__dirname, "../uploads");

// Ensure 'uploads' folder exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage });

// ✅ Upload File
router.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { filename, mimetype, path: filePath } = req.file;
    
    try {
        await db.promise().query("INSERT INTO documents (name, type, path) VALUES (?, ?, ?)", [
            filename, mimetype, filePath
        ]);
        res.json({ success: true, message: "File uploaded successfully", file: filename });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// ✅ List Uploaded Documents
router.get("/documents", async (req, res) => {
    try {
        const [results] = await db.promise().query("SELECT * FROM documents");
        res.json({ success: true, data: results });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// ✅ Serve Uploaded Files
router.get("/uploads/:filename", (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ success: false, message: "File not found" });
    }
});

// ✅ Extract Text and Validate Documents
router.get("/validate-document/:filename", async (req, res) => {
    const filePath = path.join(uploadDir, decodeURIComponent(req.params.filename));

    try {
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: "File not found" });
        }

        // Step 1: Extract Text
        const text = await extractTextFromFile(filePath);

        // Step 2: Define Validation Criteria for General Fee Receipt
        const feeReceiptValidations = {
            studentName: /Student Name:\s*([A-Z\s]+)/i,
            rollNumber: /Roll No[:\s]+(\d{4,6})/i, 
            receiptNo: /Receipt No[:\s]+(E-\d{4}-\d{2}-\d+)/i,
            date: /DATE[:\s]+(\d{2}-\d{2}-\d{4})/i,
            transactionId: /TRANSACTION ID[:\s]+([A-Z0-9]+)/i,
            amount: /Total Fee[\s\S]*?(\d{1,},?\d{2,}\.\d{2})/i
        };

        // Step 3: Define Validation Criteria for 7/12 Land Record Document
        const sevenTwelveValidations = {
            surveyNumber: /Survey No[:\s]+([\d\/]+)/i,  
            ownerName: /Owner Name[:\s]+([A-Z\s]+)/i,  
            landArea: /Area[:\s]+([\d.]+\s*[A-Za-z]+)/i, 
            villageName: /Village[:\s]+([A-Z\s]+)/i, 
            cropDetails: /Crop Details[:\s]+([\w\s,]+)/i 
        };

        // Step 4: Identify Document Type (Fee Receipt vs. 7/12 Document)
        let extractedData = {};
        let errors = [];
        let documentType = "Unknown";

        // Check if it contains Fee Receipt structure
        let feeReceiptMatches = Object.keys(feeReceiptValidations).filter(field => text.match(feeReceiptValidations[field])).length;
        
        // Check if it contains 7/12 Document structure
        let sevenTwelveMatches = Object.keys(sevenTwelveValidations).filter(field => text.match(sevenTwelveValidations[field])).length;
        
        if (feeReceiptMatches >= 3) {
            documentType = "Fee Receipt";
            for (let field in feeReceiptValidations) {
                const match = text.match(feeReceiptValidations[field]);
                if (match) {
                    extractedData[field] = match[1].trim();
                } else {
                    errors.push(`Missing or invalid ${field}`);
                }
            }
        } else if (sevenTwelveMatches >= 3) {
            documentType = "7/12 Land Record";
            for (let field in sevenTwelveValidations) {
                const match = text.match(sevenTwelveValidations[field]);
                if (match) {
                    extractedData[field] = match[1].trim();
                } else {
                    errors.push(`Missing or invalid ${field}`);
                }
            }
        } else {
            return res.json({ success: false, message: "Unknown document type", errors });
        }

        // Step 5: Return Validation Results
        if (errors.length > 0) {
            return res.json({ success: false, message: `${documentType} validation failed`, errors, extractedData });
        }

        return res.json({ success: true, message: `${documentType} is valid`, extractedData });

    } catch (err) {
        console.error("Validation Error:", err);
        res.status(500).json({ success: false, message: "Error processing document", error: err.message });
    }
});

module.exports = router;
