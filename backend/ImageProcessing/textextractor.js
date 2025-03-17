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

            try {
                // Preprocess the image before OCR
                const processedImagePath = await preprocessImage(imagePath);

                // Use OCR for Marathi + English
                const { data: { text } } = await Tesseract.recognize(processedImagePath, lang, {
                    logger: m => console.log(m), // Log OCR progress
                });

                extractedText += text + "\n";
                
                // Safely delete processed image
                try {
                    if (fs.existsSync(processedImagePath)) {
                        fs.unlinkSync(processedImagePath);
                    }
                } catch (unlinkError) {
                    console.warn(`Warning: Could not delete temporary file ${processedImagePath}:`, unlinkError.message);
                }
            } catch (imageError) {
                console.error(`Error processing image ${imagePath}:`, imageError);
                // Continue with next image even if one fails
            }
        }

        return extractedText.trim() || "No text extracted via OCR.";
    } catch (error) {
        throw new Error("Failed to convert PDF to images for OCR: " + error.message);
    }
};

// Extract text from image files (JPG, PNG)
const extractTextFromImage = async (filePath, lang = "eng+mar") => {
    try {
        // Preprocess the image before OCR
        const processedImagePath = await preprocessImage(filePath);

        // Use OCR for Marathi + English
        const { data: { text } } = await Tesseract.recognize(processedImagePath, lang, {
            logger: m => console.log(m), // Log OCR progress
        });

        // Safely delete processed image
        try {
            if (fs.existsSync(processedImagePath)) {
                fs.unlinkSync(processedImagePath);
            }
        } catch (unlinkError) {
            console.warn(`Warning: Could not delete temporary file ${processedImagePath}:`, unlinkError.message);
        }
        
        return text.trim() || "No text extracted.";
    } catch (error) {
        throw new Error("Image Text Extraction Failed: " + error.message);
    }
};

// Image Preprocessing Function (Sharp)
const preprocessImage = async (filePath) => {
    // Fix the path handling by using path.parse
    const parsedPath = path.parse(filePath);
    const processedPath = path.join(
        parsedPath.dir,
        `${parsedPath.name}_processed.png`
    );

    try {
        // Check if the source file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`Source file not found: ${filePath}`);
        }
        
        // Ensure we can write to the destination
        const destinationDir = path.dirname(processedPath);
        if (!fs.existsSync(destinationDir)) {
            fs.mkdirSync(destinationDir, { recursive: true });
        }

        await sharp(filePath)
            .grayscale()        // Convert to grayscale
            .threshold(140)     // Binarization (converts to black & white)
            .sharpen()          // Enhance text edges
            .resize(2000, null) // Resize for better OCR accuracy
            .toFile(processedPath);

        // Verify the processed file was created
        if (!fs.existsSync(processedPath)) {
            throw new Error(`Failed to create processed image at ${processedPath}`);
        }

        return processedPath;
    } catch (error) {
        console.error("Image Preprocessing Error:", error);
        // If processing fails, copy the original file as a fallback
        try {
            fs.copyFileSync(filePath, processedPath);
            return processedPath;
        } catch (copyError) {
            throw new Error(`Image Preprocessing Failed and fallback copy failed: ${error.message}, Copy error: ${copyError.message}`);
        }
    }
};

// Determine file type and extract text
const extractTextFromFile = async (filePath, lang = "eng+mar") => {
    try {
        // Validate file existence first
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        const ext = path.extname(filePath).toLowerCase();
        if (ext === ".pdf") {
            return await extractTextFromPDF(filePath, lang);
        } else if ([".jpg", ".jpeg", ".png"].includes(ext)) {
            return await extractTextFromImage(filePath, lang);
        } else {
            throw new Error(`Unsupported file type: ${ext}`);
        }
    } catch (error) {
        console.error("Text Extraction Error:", error);
        throw new Error(`Text Extraction Failed: ${error.message}`);
    }
};

module.exports = { extractTextFromFile };