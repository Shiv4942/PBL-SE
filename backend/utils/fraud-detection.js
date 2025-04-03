const crypto = require('crypto');
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
const normalizeSurveyNumber = (surveyNumber) => {
    if (!surveyNumber) return '';
    
    return surveyNumber
        .toString()
        // Convert Devanagari numerals to English
        .replace(/[०-९]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0966 + 0x30))
        // Remove all spaces
        .replace(/\s+/g, '')
        // Remove any characters that aren't numbers, forward slashes, or hyphens
        .replace(/[^0-9\/\-]/g, '')
        // Remove leading/trailing slashes
        .replace(/^\/+|\/+$/g, '')
        // Ensure consistent format for comparison (e.g., '123/5')
        .replace(/\/{2,}/g, '/')
        .replace(/\-+/g, '-');
};

// ✅ Function to find the closest valid survey number using fuzzy matching
const findClosestSurveyNumber = async (extractedSurvey, allSurveys = []) => {
    if (!extractedSurvey) return '';
    
    // Normalize the extracted survey number
    const normalizedExtracted = normalizeSurveyNumber(extractedSurvey);
    console.log('Normalized extracted survey number:', normalizedExtracted);
    
    if (allSurveys.length === 0) {
        allSurveys = await getAllSurveyNumbers();
    }
    console.log('All survey numbers from DB:', allSurveys);
    
    // First try exact match after normalization
    for (const dbSurvey of allSurveys) {
        const normalizedDb = normalizeSurveyNumber(dbSurvey);
        console.log(`Comparing normalized: ${normalizedExtracted} with DB: ${normalizedDb}`);
        
        // Try exact match
        if (normalizedExtracted === normalizedDb) {
            console.log('Exact match found:', dbSurvey);
            return dbSurvey;
        }
        
        // Try without leading zeros
        const noLeadingZeros = normalizedExtracted.replace(/^0+/, '');
        if (noLeadingZeros === normalizedDb) {
            console.log('Match found after removing leading zeros:', dbSurvey);
            return dbSurvey;
        }
    }
    
    // If no exact match, try fuzzy matching
    let closestMatch = extractedSurvey;
    let minDistance = Infinity;

    for (const dbSurvey of allSurveys) {
        const normalizedDb = normalizeSurveyNumber(dbSurvey);
        const distance = levenshtein.get(normalizedExtracted, normalizedDb);

        if (distance < minDistance) {
            minDistance = distance;
            closestMatch = dbSurvey;
        }
    }

    console.log('Closest match:', closestMatch, 'with distance:', minDistance);
    // Return closest match only if the difference is minor (distance ≤ 2)
    return minDistance <= 2 ? closestMatch : extractedSurvey;
};

// ✅ Function to validate extracted data against the database
const validateDocumentData = async (extractedData, ownerName = null) => {
    let connection;

    try {
        connection = await pool.getConnection();

        // Get all survey numbers first
        const allSurveyNumbers = await getAllSurveyNumbers();
        console.log('All survey numbers from DB:', allSurveyNumbers);

        if (!extractedData.surveyNumber) {
            return {
                isValid: false,
                message: 'No survey number found in document',
                details: { error: 'Missing survey number' }
            };
        }

        // Normalize the extracted survey number
        const normalizedExtracted = normalizeSurveyNumber(extractedData.surveyNumber);
        console.log('Normalized extracted survey number:', normalizedExtracted);

        // Try exact match first
        let matchedSurveyNumber = null;
        for (const dbNumber of allSurveyNumbers) {
            const normalizedDb = normalizeSurveyNumber(dbNumber);
            if (normalizedDb === normalizedExtracted) {
                matchedSurveyNumber = dbNumber;
                console.log('Found exact match:', matchedSurveyNumber);
                break;
            }
        }

        // If no exact match, try fuzzy matching
        if (!matchedSurveyNumber) {
            let minDistance = Infinity;
            let closestMatch = null;

            for (const dbNumber of allSurveyNumbers) {
                const normalizedDb = normalizeSurveyNumber(dbNumber);
                const distance = levenshtein.get(normalizedExtracted, normalizedDb);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestMatch = dbNumber;
                }
            }

            // Only use fuzzy match if it's close enough
            if (minDistance <= 2) {
                matchedSurveyNumber = closestMatch;
                console.log('Found fuzzy match:', matchedSurveyNumber, 'with distance:', minDistance);
            }
        }

        // If no match found at all
        if (!matchedSurveyNumber) {
            return {
                isValid: false,
                message: 'Survey number not found in records',
                details: {
                    extractedNumber: extractedData.surveyNumber,
                    normalizedNumber: normalizedExtracted
                }
            };
        }

        // Query for matching survey number
        const [rows] = await connection.execute(
            `SELECT * FROM land_records WHERE survey_number = ?`,
            [matchedSurveyNumber]
        );
        console.log('Database query result rows:', rows.length);
        console.log('Searching for survey number:', matchedSurveyNumber);

        // Document is invalid if survey number not found
        if (rows.length === 0) {
            console.log('No matching survey number found in database');
            return {
                isValid: false,
                message: 'Survey number not found in database',
                details: {
                    extractedNumber: extractedData.surveyNumber,
                    matchedNumber: matchedSurveyNumber,
                    normalizedNumber: normalizedExtracted
                }
            };
        }

        // Check owner name if provided
        if (ownerName) {
            const normalizedInput = ownerName.toLowerCase().trim();
            const normalizedDb = rows[0].owner_name.toLowerCase().trim();
            const normalizedExtracted = extractedData.ownerNames ? 
                extractedData.ownerNames.toLowerCase().trim() : '';

            console.log('Comparing owner names:', {
                input: normalizedInput,
                extracted: normalizedExtracted,
                database: normalizedDb
            });

            if (normalizedInput !== normalizedDb) {
                return {
                    isValid: false,
                    message: 'Owner name does not match database records',
                    details: {
                        surveyNumber: matchedSurveyNumber,
                        ownerName: {
                            input: ownerName,
                            extracted: extractedData.ownerNames,
                            database: rows[0].owner_name
                        },
                        landArea: extractedData.landAreas
                    }
                };
            }
        }

        // Return success if all validations pass
        return {
            isValid: true,
            message: 'Document verification successful',
            details: {
                surveyNumber: matchedSurveyNumber,
                ownerName: {
                    database: rows[0].owner_name,
                    extracted: extractedData.ownerNames,
                    input: ownerName || 'Not provided'
                },
                landArea: extractedData.landAreas
            }
        };

    } catch (error) {
        console.error("Validation error:", error);
        return { isValid: false, invalidFields: ['Database error occurred'] };

    } finally {
        if (connection) connection.release();
    }
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
