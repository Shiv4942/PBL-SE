const fs = require("fs");
const pdf = require("pdf-parse");
const Tesseract = require("tesseract.js");
const path = require("path");
const { convert } = require("pdf-poppler");
const sharp = require("sharp");

// Extract text from PDFs with selectable text
const extractTextFromPDF = async (filePath, lang = "eng+mar") => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        
        if (data.text.trim()) {
            return data.text; // If selectable text exists, return it
        } else {
            console.log("No selectable text found, trying OCR...");
            return await extractTextFromScannedPDF(filePath, lang);
        }
    } catch (error) {
        throw new Error("PDF Extraction Failed: " + error.message);
    }
};

// Convert PDF pages to images and apply OCR
const extractTextFromScannedPDF = async (filePath, lang = "eng+mar") => {
    const outputPath = filePath.replace(".pdf", "");

    try {
        // Convert PDF to image (PNG) with high resolution (300 DPI)
        await convert(filePath, {
            format: "png",
            out_dir: path.dirname(filePath),
            out_prefix: path.basename(outputPath),
            resolution: 300,
        });

        // Get all extracted images
        const files = fs.readdirSync(path.dirname(filePath))
            .filter(file => file.startsWith(path.basename(outputPath)) && file.endsWith(".png"));

        let extractedText = "";
        for (const file of files) {
            const imagePath = path.join(path.dirname(filePath), file);

            // Preprocess the image before OCR
            const processedImagePath = await preprocessImage(imagePath);

            // Use OCR for Marathi + English
            const { data: { text } } = await Tesseract.recognize(processedImagePath, lang, {
                logger: m => console.log(m), // Log OCR progress
            });

            extractedText += text + "\n";
            fs.unlinkSync(processedImagePath); // Delete processed image
        }

        return extractedText.trim() || "No text extracted via OCR.";
    } catch (error) {
        throw new Error("Failed to convert PDF to images for OCR: " + error.message);
    }
};

// Extract text from image files (JPG, PNG)
const extractTextFromImage = async (filePath, lang = "eng+mar") => {
    try {
         //Preprocess the image before OCR
        const processedImagePath = await preprocessImage(filePath);

        const { data: { text } } = await Tesseract.recognize(processedImagePath, lang);

        fs.unlinkSync(processedImagePath); // Delete temporary processed image
        return text.trim();
    } catch (error) {
        throw new Error("Image Text Extraction Failed: " + error.message);
    }
};

// Image Preprocessing Function (Sharp)
const preprocessImage = async (filePath) => {
    const processedPath = filePath.replace(/\.(jpg|jpeg|png)$/, "_processed.png");

    try {
        await sharp(filePath)
            .grayscale()        // Convert to grayscale
            .threshold(140)     // Binarization (converts to black & white)
            .sharpen()          // Enhance text edges
            .resize(2000, null) // Resize for better OCR accuracy
            .toFile(processedPath);

        return processedPath;
    } catch (error) {
        throw new Error("Image Preprocessing Failed: " + error.message);
    }
};

// Determine file type and extract text
const extractTextFromFile = async (filePath, lang = "eng+mar") => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".pdf") {
        return await extractTextFromPDF(filePath, lang);
    } else if ([".jpg", ".jpeg", ".png"].includes(ext)) {
        return await extractTextFromImage(filePath, lang);
    } else {
        throw new Error("Unsupported file type");
    }
};

module.exports = { extractTextFromFile };
