const fs = require("fs");
const pdf = require("pdf-parse");
const Tesseract = require("tesseract.js");
const path = require("path");
const { convert } = require("pdf-poppler");
const sharp = require("sharp");

// Configure Tesseract parameters optimized for form documents
const tesseractConfig = {
    logger: m => console.log(m),
    psm: 6,  // Assume uniform block of text (better for tables)
    oem: 3,  // Default OCR Engine Mode
    preserve_interword_spaces: 1,
    tessjs_create_pdf: 0,
    tessjs_parameters: [
        "--dpi", "300",
        "-c", "preserve_interword_spaces=1",
        "-c", "textord_tabfind_find_tables=1",
        "-c", "textord_tablefind_recognize_tables=1",
        "-c", "textord_min_linesize=1.2"
    ]
};


// Extract text from PDFs with selectable text
const extractTextFromPDF = async (filePath, lang = "eng+mar") => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer, {
            pagerender: render_page,  // Custom renderer for better text extraction
            max: 0,  // No page limit
        });
        
        const extractedText = data.text.trim();
        return extractedText || await extractTextFromScannedPDF(filePath, lang);
    } catch (error) {
        console.error(`Error extracting text from PDF: ${error.message}`);
        return await extractTextFromScannedPDF(filePath, lang);
    }
};

// Custom PDF page renderer
const render_page = async (pageData) => {
    try {
        const renderOptions = {
            normalizeWhitespace: true,
            disableCombineTextItems: false
        };
        return await pageData.getTextContent(renderOptions);
    } catch (error) {
        console.error(`Error rendering PDF page: ${error.message}`);
        return null;
    }
};


// Convert PDF pages to images and apply OCR  
const extractTextFromScannedPDF = async (filePath, lang = "eng+mar") => {  
    const outputPath = filePath.replace(".pdf", "");  
    await convert(filePath, {  
        format: "png",  
        out_dir: path.dirname(filePath),  
        out_prefix: path.basename(outputPath),  
        resolution: 300,  
    });  

    const imageFiles = fs.readdirSync(path.dirname(filePath))  
        .filter(file => file.startsWith(path.basename(outputPath)) && file.endsWith(".png"));  

    const extractedTexts = await Promise.all(imageFiles.map(file => processImageForOCR(file)));  
    return extractedTexts.join("\n").trim() || "No text extracted via OCR.";  
};  

// Process a single image file for OCR with table structure preservation
const processImageForOCR = async (file) => {
    const imagePath = path.join(path.dirname(file), file);
    const processedImagePath = await preprocessImage(imagePath);
    
    try {
        // First pass: detect table structure
        const { data: { hocr, confidence } } = await Tesseract.recognize(
            processedImagePath,
            'eng+mar',
            { ...tesseractConfig, psm: 6 }
        );

        // Second pass: detailed text recognition
        const { data: { text } } = await Tesseract.recognize(
            processedImagePath,
            'eng+mar',
            { ...tesseractConfig, psm: 4 }
        );

        console.log(`OCR Confidence: ${confidence}%`);

        // Combine and post-process the extracted text
        const cleanedText = postProcessText(text, hocr);
        
        fs.unlinkSync(processedImagePath); // Clean up processed image
        return cleanedText;
    } catch (error) {
        console.error(`OCR Error: ${error.message}`);
        fs.unlinkSync(processedImagePath); // Ensure cleanup on error
        return '';
    }
};

// Post-process extracted text with table structure preservation
const postProcessText = (text, hocr = '') => {
    // Extract table structure from hOCR if available
    const tableStructure = hocr ? extractTableStructure(hocr) : null;

    let processedText = text
        // Preserve table structure
        .split('\n')
        .map(line => {
            // Clean up the line while preserving structure
            return line
                .replace(/[\|\[\]\{\}]/g, '') // Remove unwanted characters
                .replace(/\s+/g, ' ')  // Normalize spaces
                .trim();
        })
        .filter(line => line.length > 0)  // Remove empty lines
        .join('\n');

    // Apply table structure if available
    if (tableStructure) {
        processedText = applyTableStructure(processedText, tableStructure);
    }

    // Fix common OCR mistakes
    processedText = processedText
        // Fix number/letter confusions
        .replace(/([A-Za-z])1([A-Za-z])/g, '$1l$2')
        .replace(/([A-Za-z])0([A-Za-z])/g, '$1o$2')
        // Fix common Marathi character confusions
        .replace(/॰/g, '.')
        .replace(/०/g, '0')
        .trim();

    return processedText;
};

// Extract table structure from hOCR data
const extractTableStructure = (hocr) => {
    // Parse hOCR to identify table cells and their positions
    const lines = hocr.split('\n');
    const tableData = [];

    lines.forEach(line => {
        if (line.includes('ocrx_word')) {
            const bbox = line.match(/bbox\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/i);
            if (bbox) {
                tableData.push({
                    text: line.match(/>(.*?)<\/span>/)[1],
                    x1: parseInt(bbox[1]),
                    y1: parseInt(bbox[2]),
                    x2: parseInt(bbox[3]),
                    y2: parseInt(bbox[4])
                });
            }
        }
    });

    return tableData;
};

// Apply table structure to extracted text
const applyTableStructure = (text, structure) => {
    // Sort table cells by vertical position first, then horizontal
    structure.sort((a, b) => {
        const rowDiff = a.y1 - b.y1;
        return rowDiff !== 0 ? rowDiff : a.x1 - b.x1;
    });

    // Group cells into rows based on vertical position
    const rows = [];
    let currentRow = [];
    let currentY = -1;

    structure.forEach(cell => {
        if (currentY === -1 || Math.abs(cell.y1 - currentY) < 10) {
            currentRow.push(cell);
        } else {
            if (currentRow.length > 0) {
                rows.push([...currentRow]);
            }
            currentRow = [cell];
        }
        currentY = cell.y1;
    });

    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    // Format rows into table structure
    return rows
        .map(row => row
            .sort((a, b) => a.x1 - b.x1)
            .map(cell => cell.text)
            .join('\t')
        )
        .join('\n');
};


// Extract text from image files (JPG, PNG)
const extractTextFromImage = async (filePath, lang = "eng+mar") => {
    const processedImagePath = await preprocessImage(filePath);
    
    try {
        const { data: { text, confidence } } = await Tesseract.recognize(
            processedImagePath,
            lang,
            tesseractConfig
        );

        console.log(`OCR Confidence: ${confidence}%`);
        const cleanedText = postProcessText(text);
        
        fs.unlinkSync(processedImagePath); // Clean up processed image
        return cleanedText;
    } catch (error) {
        console.error(`Image OCR Error: ${error.message}`);
        fs.unlinkSync(processedImagePath); // Ensure cleanup on error
        return '';
    }
};


// Preprocess Image for better OCR results - optimized for forms
const preprocessImage = async (filePath) => {
    const processedPath = filePath.replace(/\.(jpg|jpeg|png)$/, "_processed.png");

    // Simple but effective preprocessing for form documents
    await sharp(filePath)
        .grayscale()
        // Enhance contrast
        .modulate({
            brightness: 1.2,
            saturation: 1.0,
            contrast: 1.3
        })
        // Clean noise
        .median(3)
        // Normalize for better black and white separation
        .normalize()
        // Resize for better OCR
        .resize(3500, null, {
            kernel: sharp.kernel.lanczos3,
            fit: 'inside',
        })
        .toFile(processedPath);

    return processedPath;
};


// Determine file type and extract text  
const extractTextFromFile = async (filePath, lang = "eng+mar") => {  
    const ext = path.extname(filePath).toLowerCase();  
    
    switch (ext) {  
        case ".pdf":  
            return await extractTextFromPDF(filePath, lang);  
        case ".jpg":  
        case ".jpeg":  
        case ".png":  
            return await extractTextFromImage(filePath, lang);  
        default:  
            throw new Error("Unsupported file type");  
    }  
};  

module.exports = { extractTextFromFile };  