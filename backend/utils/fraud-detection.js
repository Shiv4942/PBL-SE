const crypto = require('crypto');//used to create hash of the document
const fs = require('fs');
const levenshtein = require('fast-levenshtein');   // For fuzzy matching
const pool = require('../connection/database');

// ✅ Function to calculate document hash for integrity verification
const calculateDocumentHash = async (filePath) => {
    try {
        const hash = crypto.createHash('sha256');
        const fileBuffer = await fs.promises.readFile(filePath);
        hash.update(fileBuffer);
        return hash.digest('hex');
    } catch (error) {
        console.error("Error calculating document hash:", error);
        throw new Error("Failed to calculate document hash.");
    }
};

// ✅ Function to fetch all survey numbers from the database
const getAllSurveyNumbers = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(
            `SELECT survey_number FROM land_records`
        );
        connection.release();
        return rows.map(row => row.survey_number);
    } catch (error) {
        console.error("Error fetching survey numbers:", error);
        if (connection) connection.release();
        return [];
    }
};

// ✅ Function to normalize survey number format
// Enhanced survey number normalization
const normalizeSurveyNumber = (surveyNumber) => {
    if (!surveyNumber) return '';
    
    // First pass - normalize basic characters
    let normalized = surveyNumber
        .toString()
        // Convert Devanagari numerals to English
        .replace(/[०-९]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0966 + 0x30))
        // Remove all spaces
        .replace(/\s+/g, '')
        // Handle "plot n.X" format by removing "plot" and keeping number
        .replace(/plot[nN]\.?(\d+)/i, '$1')
        // Remove any characters that aren't numbers, forward slashes, periods, or hyphens
        .replace(/[^0-9\/\.\-]/g, '')
        // Remove leading/trailing slashes
        .replace(/^\/+|\/+$/g, '')
        // Ensure consistent format for comparison
        .replace(/\/{2,}/g, '/');
    
    // Handle special case - sometimes the format might have 'plot' indicators
    if (surveyNumber.toLowerCase().includes('plot')) {
        const plotMatch = surveyNumber.match(/plot\s*n?\.?\s*(\d+)/i);
        if (plotMatch && plotMatch[1]) {
            // Add plot number at the end with consistent format
            normalized = normalized + '/p' + plotMatch[1];
        }
    }
    
    console.log(`Original: ${surveyNumber}, Normalized: ${normalized}`);
    return normalized;
};

// ✅ Function to find the closest valid survey number using fuzzy matching
// Enhanced fuzzy matching for complex survey numbers
const findClosestSurveyNumber = async (extractedSurvey, allSurveys = []) => {
    if (!extractedSurvey) return '';
    
    // Normalize the extracted survey number
    const normalizedExtracted = normalizeSurveyNumber(extractedSurvey);
    console.log('Normalized extracted survey number:', normalizedExtracted);
    
    if (allSurveys.length === 0) {
        allSurveys = await getAllSurveyNumbers();
    }
    
    // First try exact match after normalization
    for (const dbSurvey of allSurveys) {
        const normalizedDb = normalizeSurveyNumber(dbSurvey);
        
        // Try exact match
        if (normalizedExtracted === normalizedDb) {
            console.log('Exact match found:', dbSurvey);
            return dbSurvey;
        }
    }
    
    // If no exact match, try segment matching
    // Break down survey numbers into segments for partial matching
    const extractedSegments = normalizedExtracted.split('/');
    let bestMatch = null;
    let highestMatchScore = 0;
    
    for (const dbSurvey of allSurveys) {
        const dbSegments = normalizeSurveyNumber(dbSurvey).split('/');
        
        // Calculate matching segments
        let matchCount = 0;
        for (const segment of extractedSegments) {
            if (dbSegments.includes(segment)) {
                matchCount++;
            }
        }
        
        // Calculate match score as percentage of matching segments
        const matchScore = matchCount / Math.max(extractedSegments.length, dbSegments.length);
        
        if (matchScore > highestMatchScore) {
            highestMatchScore = matchScore;
            bestMatch = dbSurvey;
        }
    }
    
    // Only return if match score is above threshold
    console.log('Best partial match:', bestMatch, 'with score:', highestMatchScore);
    return highestMatchScore > 0.6 ? bestMatch : extractedSurvey;
};

// ✅ Function to validate extracted data against the database
// Enhanced validation function with debug logging
const validateDocumentData = async (extractedData, ownerName = null) => {
    console.log('Starting validation with data:', JSON.stringify(extractedData));
    console.log('Owner name provided:', ownerName);
    
    // Initialize validation result
    const validationResult = {
        isValid: false,
        details: {
            surveyNumber: {
                extracted: extractedData.surveyNumber || '',
                matched: ''
            }
        },
        message: ''
    };

    try {
        // 1. Survey Number Validation
        const allSurveyNumbers = await getAllSurveyNumbers();
        const normalizedExtracted = normalizeSurveyNumber(extractedData.surveyNumber);
        const matchedSurveyNumber = await findClosestSurveyNumber(extractedData.surveyNumber, allSurveyNumbers);

        // Log survey number comparison
        console.log('Survey number comparison:', {
            extracted: extractedData.surveyNumber,
            normalized: normalizedExtracted,
            matched: matchedSurveyNumber,
            allSurveys: allSurveyNumbers
        });

        // If no match found for survey number
        if (!matchedSurveyNumber) {
            validationResult.isValid = false;
            validationResult.message = 'Invalid survey number';
            validationResult.details = {
                surveyNumber: {
                    extracted: extractedData.surveyNumber,
                    matched: null,
                    reason: 'No matching survey number found'
                }
            };
            return validationResult;
        }

        // 2. Owner Name Validation (if provided)
        if (ownerName) {
            let connection;
            try {
                connection = await pool.getConnection();
                const [rows] = await connection.execute(
                    'SELECT owner_name FROM land_records WHERE survey_number = ?',
                    [matchedSurveyNumber]
                );
                connection.release();

                if (rows.length > 0) {
                    const dbOwnerName = rows[0].owner_name;
                    const normalizedInput = ownerName.toLowerCase().trim();
                    const normalizedDb = dbOwnerName.toLowerCase().trim();

                    // Log owner name comparison
                    console.log('Owner name comparison:', {
                        input: normalizedInput,
                        database: normalizedDb,
                        isMatch: normalizedInput === normalizedDb
                    });

                    validationResult.details.ownerName = {
                        input: ownerName,
                        database: dbOwnerName,
                        extracted: extractedData.ownerNames || 'Not extracted'
                    };

                    // Fuzzy match for owner names
                    const distance = levenshtein.get(normalizedInput, normalizedDb);
                    const similarity = 1 - (distance / Math.max(normalizedInput.length, normalizedDb.length));

                    if (similarity >= 0.8) {
                        validationResult.isValid = true;
                        validationResult.message = 'Document validated successfully';
                    } else {
                        validationResult.isValid = false;
                        validationResult.message = 'Owner name mismatch';
                        validationResult.details.ownerName.reason = 'Owner name does not match records';
                    }
                } else {
                    validationResult.isValid = false;
                    validationResult.message = 'Survey number not found in database';
                }
            } catch (error) {
                console.error('Database error during owner validation:', error);
                if (connection) connection.release();
                throw error;
            }
        } else {
            // If no owner name provided, only validate survey number
            validationResult.isValid = true;
            validationResult.message = 'Survey number validated successfully';
            validationResult.details.surveyNumber = matchedSurveyNumber;
        }

    } catch (error) {
        console.error('Validation error:', error);
        validationResult.isValid = false;
        validationResult.message = 'Validation error occurred';
        validationResult.details.error = error.message;
    }

    return validationResult;
};
// ✅ Main fraud detection function
const detectFraud = async (extractedData, documentText, filePath, language = 'en', ownerName = null) => {
    const fraudChecks = {
        isFraudulent: false,
        fraudTypes: [],
        details: {},
        recommendations: []
    };

    try {
        // Validate the document data against the database with owner name
        const validationResults = await validateDocumentData(extractedData, ownerName);
        
        // Set fraud status based on survey number validation only
        if (!validationResults.isValid) {
            fraudChecks.isFraudulent = true;
            fraudChecks.fraudTypes.push("Invalid Survey Number");
            fraudChecks.details = validationResults.details;
            fraudChecks.message = validationResults.message || 'Survey number validation failed';
        } else {
            fraudChecks.message = validationResults.message;
            fraudChecks.details = validationResults.details;
        }

        // Add basic recommendations
        if (fraudChecks.isFraudulent) {
            fraudChecks.recommendations.push("Verify survey number with land records.");
        }

    } catch (error) {
        console.error("Error in fraud detection:", error);
        fraudChecks.isFraudulent = true;
        fraudChecks.fraudTypes.push("System Error");
        fraudChecks.details.error = error.message;
        fraudChecks.recommendations.push("Review system logs for errors.");
    }

    return fraudChecks;
};

module.exports = { detectFraud };