const express = require("express");  
const multer = require("multer");  
const path = require("path");  
const fs = require("fs");  
const db = require("../connection/database");  
const { extractTextFromFile } = require("../ImageProcessing/textextractor");  
const { detectFraud } = require('../utils/fraud-detection');  

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
        cb(null, `${Date.now()}-${file.originalname}`);  
    },  
});  

const upload = multer({ storage });  

// Upload File Route  
router.post("/upload", upload.single("file"), async (req, res) => {  
    if (!req.file) {  
        return res.status(400).json({ success: false, message: "No file uploaded" });  
    }  

    const { filename, mimetype, path: filePath } = req.file;  

    try {  
        await db.query(  
            "INSERT INTO documents (name, type, path) VALUES (?, ?, ?)",  
            [filename, mimetype, filePath]  
        );  
        res.json({ success: true, message: "File uploaded successfully", file: filename });  
    } catch (err) {  
        console.error("Database Error:", err);  
        res.status(500).json({ success: false, message: "Database error" });  
    }  
});  

// List Uploaded Documents  
router.get("/documents", async (req, res) => {  
    try {  
        const [results] = await db.promise().query("SELECT * FROM documents");  
        res.json({ success: true, data: results });  
    } catch (err) {  
        console.error("Database Error:", err);  
        res.status(500).json({ success: false, message: "Database error" });  
    }  
});  

// Serve Uploaded Files  
router.get("/uploads/:filename", (req, res) => {  
    const filePath = path.join(uploadDir, req.params.filename);  
    
    if (fs.existsSync(filePath)) {  
        res.sendFile(filePath);  
    } else {  
        res.status(404).json({ success: false, message: "File not found" });  
    }  
});  

// Extract Text and Validate Documents with Fraud Detection  
router.get("/validate-document/:filename", async (req, res) => {  
    const ownerName = req.query.ownerName;  
    const filePath = path.join(uploadDir, decodeURIComponent(req.params.filename));  

    try {  
        if (!fs.existsSync(filePath)) {  
            return res.status(404).json({ success: false, message: "File not found" });  
        }  

        // Step 1: Extract Text  
        const text = await extractTextFromFile(filePath);  
        console.log("Extracted Text:", text);  

        // Define Validation Patterns  
        const validations = {  
            feeReceipt: {  
                studentName: /Student Name:\s*([A-Z\s]+)/i,  
                rollNumber: /Roll No[:\s]+(\d{4,6})/i,  
                receiptNo: /Receipt No[:\s]+(E-\d{4}-\d{2}-\d+)/i,  
                date: /DATE[:\s]+(\d{2}-\d{2}-\d{4})/i,  
                transactionId: /TRANSACTION ID[:\s]+([A-Z0-9]+)/i,  
                amount: /Total Fee[\s\S]*?(\d{1,},?\d{2,}\.\d{2})/i,  
            },  
            sevenTwelve: {  
                surveyNumber: /(?:gat kramank v upavibhag | bhumapan kramank v upavibhag)[:\s]+([\d\/]+)/i,  
                ownerNames: /Name of the occupant[:\s]+([A-Z\s,]+)/gi,  
                landAreas: /Area[:\s]+([\d.]+\s*[A-Za-z]+)/gi,  
                villageName: /(?:ब्लॉक|Block)[.:\s]*[-\s]*([^\n]+?)(?=\s*(?:जिल्हा|जि\.|District)|$)/i,  
                districtName: /District\s*:-\s*([^\n\(\)]+)/i,  
                cropDetails: /Details of Area Under Crop[:\s]+([\w\s,]+)/i,  
            },  
            marathiSevenTwelve: {  
                surveyNumber: /(?:गट क्रमांक|गट क्रमांक व उपविभाग|गट नं\.|गट क्र\.|गट)[\.:।\s]*([०-९\d\/\-\s]+?)(?=[^\d\/\-]|$)/i,  
                ownerNames: /(?:भोगवटादाराचे नाव|मालकाचे नाव)[\.:\s]*([^\n]+?)(?=\s*क्षेत्र|$)/i,  
                landAreas: /क्षेत्र[\.:\s]*([^\n]+?)(?=\s*(?:गट|ब्लॉक|block|$))/i,  
                villageName: /(?:ब्लॉक|Block)[.:\s]*[-\s]*([^\n]+?)(?=\s*(?:जिल्हा|जि\.|District)|$)/i,  
                districtName: /(?:जिल्हा|जि\.|District)\s*:-\s*([^\n\(\)]+)/i,  
            }  
        };  

        // Step 3: Detect Document Type  
        let extractedData = {};  
        let errors = [];  

        const detectType = (text) => {  
            const feeReceiptMatches = Object.keys(validations.feeReceipt).filter(field => text.match(validations.feeReceipt[field])).length;  
            const sevenTwelveMatches = Object.keys(validations.sevenTwelve).filter(field => text.match(validations.sevenTwelve[field])).length;  
            const marathiSevenTwelveMatches = Object.keys(validations.marathiSevenTwelve).filter(field => text.match(validations.marathiSevenTwelve[field])).length;  

            if (feeReceiptMatches >= 3) return "Fee Receipt";  
            if (sevenTwelveMatches >= 2) return "7/12 Land Record";  
            if (marathiSevenTwelveMatches >= 2) return "Marathi 7/12 Land Record";  
            return "Unknown";  
        };  

        const documentType = detectType(text);  
        console.log("Detected Document Type:", documentType);  

        // Step 4: Apply Validation Based on Document Type  
        const applyValidation = (validations) => {  
            for (let field in validations) {  
                const match = text.match(validations[field]);  
                extractedData[field] = (match && match[1]) ? match[1].trim() : "";  
                if (!match) {  
                    errors.push(`Missing or invalid ${field}`);  
                    console.log(`Failed to match ${field} using pattern:`, validations[field]);  
                }  
            }  
        };  

        switch (documentType) {  
            case "Fee Receipt":  
                applyValidation(validations.feeReceipt);  
                break;  
            case "7/12 Land Record":  
                applyValidation(validations.sevenTwelve);  
                break;  
            case "Marathi 7/12 Land Record":  
                applyValidation(validations.marathiSevenTwelve);  
                break;  
            default:  
                return res.json({ success: false, message: "Unknown document type", errors });  
        }  

        console.log("Extraction Results:", extractedData);  
        console.log("Validation Errors:", errors);  

        // Step 5: Perform Fraud Detection (Only for 7/12 Land Records)  
        let fraudResults = {};  

        if (documentType.includes("7/12")) {  
            try {  
                const language = documentType === "Marathi 7/12 Land Record" ? 'mr' : 'en';  

                // Perform fraud detection  
                fraudResults = await detectFraud(extractedData, text, filePath, language, ownerName);  
                console.log('Fraud detection results:', fraudResults);  

                return res.json({  
                    success: true,  
                    verified: !fraudResults.isFraudulent,  
                    message: fraudResults.isFraudulent ? 'Document verification failed' : 'Document verification successful',  
                    details: {  
                        surveyNumber: fraudResults.details?.surveyNumber,  
                        ownerName: {  
                            database: fraudResults.details?.ownerName?.database,  
                            extracted: fraudResults.details?.ownerName?.extracted,  
                            input: ownerName  
                        },  
                        landArea: fraudResults.details?.landArea  
                    }  
                });  
            } catch (error) {  
                console.error('Error in fraud detection:', error);  
                return res.status(500).json({  
                    success: false,  
                    message: 'Error during document verification',  
                    error: error.message  
                });  
            }  
        }  

        // Step 6: Return Validation Results  
        if (errors.length > 0) {  
            return res.json({  
                success: false,  
                message: `${documentType} validation failed`,  
                errors,  
                extractedData,  
                fraudResults  
            });  
        }  

        console.log('Sending response:', { success: true, extractedData });  
        res.json({ success: true, extractedData });  
    } catch (err) {  
        console.error("Validation Error:", err);  
        res.status(500).json({ success: false, message: "Error processing document", error: err.message });  
    }  
});  

module.exports = router;  