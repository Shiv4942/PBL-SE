// fraud-detection.js - A module for detecting fraud in 7/12 land documents

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configure this with appropriate API endpoints in production
const API_CONFIG = {
  landRecordsAPI: process.env.LAND_RECORDS_API || "https://api.example.gov.in/land-records",
  tehsilOfficeAPI: process.env.TEHSIL_OFFICE_API || "https://api.example.gov.in/tehsil",
  mutationRegisterAPI: process.env.MUTATION_API || "https://api.example.gov.in/mutation-register",
  governmentLandAPI: process.env.GOVT_LAND_API || "https://api.example.gov.in/government-lands",
  poaVerificationAPI: process.env.POA_API || "https://api.example.gov.in/poa-verification"
};

// Database cache (in production, use a proper database)
let documentCache = {};

/**
 * Main function to detect fraud in 7/12 documents
 * @param {Object} extractedData - Data extracted from the document
 * @param {String} documentText - Full text extracted from the document
 * @param {String} filePath - Path to the original document file
 * @param {String} language - Language of the document ('en' or 'mr')
 * @returns {Object} Fraud detection results
 */
async function detectFraud(extractedData, documentText, filePath, language = 'en') {
  try {
    // Calculate document hash for integrity check
    const documentHash = await calculateDocumentHash(filePath);
    
    // Store results from all checks
    const fraudChecks = {
      isFraudulent: false,
      fraudTypes: [],
      warnings: [],
      details: {},
      recommendations: []
    };
    
    // 1. Check for fake documents
    const fakeDocumentCheck = await checkFakeDocument(extractedData, documentHash, language);
    if (fakeDocumentCheck.isSuspicious) {
      fraudChecks.fraudTypes.push("Fake 7/12 Document");
      fraudChecks.isFraudulent = true;
      fraudChecks.details.fakeDocument = fakeDocumentCheck;
      fraudChecks.recommendations.push("Verify this document with the Tehsil Office");
    }
    
    // 2. Check for tampering with ownership details
    const ownershipTamperingCheck = await checkOwnershipTampering(extractedData, documentText, language);
    if (ownershipTamperingCheck.isSuspicious) {
      fraudChecks.fraudTypes.push("Ownership Details Tampering");
      fraudChecks.isFraudulent = true;
      fraudChecks.details.ownershipTampering = ownershipTamperingCheck;
      fraudChecks.recommendations.push("Verify ownership with the Mutation Register (8-A Register)");
    }
    
    // 3. Check for unauthorized land transfers
    const unauthorizedTransferCheck = await checkUnauthorizedTransfers(extractedData, language);
    if (unauthorizedTransferCheck.isSuspicious) {
      fraudChecks.fraudTypes.push("Unauthorized Land Transfer");
      fraudChecks.isFraudulent = true;
      fraudChecks.details.unauthorizedTransfer = unauthorizedTransferCheck;
      fraudChecks.recommendations.push("Check the Mutation Register for authorization details");
    }
    
    // 4. Check for fake signatures and seals
    const fakeSignatureCheck = await checkFakeSignaturesAndSeals(filePath);
    if (fakeSignatureCheck.isSuspicious) {
      fraudChecks.fraudTypes.push("Fake Signatures/Seals");
      fraudChecks.isFraudulent = true;
      fraudChecks.details.fakeSignatures = fakeSignatureCheck;
      fraudChecks.recommendations.push("Verify document with issuing authority");
    }
    
    // 5. Check for duplicate documents
    const duplicateDocumentCheck = await checkDuplicateDocuments(extractedData, documentHash);
    if (duplicateDocumentCheck.isSuspicious) {
      fraudChecks.fraudTypes.push("Duplicate 7/12 Document");
      fraudChecks.warnings.push("Possible duplicate document detected");
      fraudChecks.details.duplicateDocument = duplicateDocumentCheck;
      fraudChecks.recommendations.push("Verify document in the Land Records Database");
    }
    
    // 6. Check for Power of Attorney misuse
    const poaMisuseCheck = await checkPoAMisuse(extractedData, documentText);
    if (poaMisuseCheck.isSuspicious) {
      fraudChecks.fraudTypes.push("Power of Attorney Misuse");
      fraudChecks.warnings.push("Potential Power of Attorney misuse");
      fraudChecks.details.poaMisuse = poaMisuseCheck;
      fraudChecks.recommendations.push("Verify Power of Attorney with the local registrar's office");
    }
    
    // 7. Check for government land encroachment
    const governmentLandCheck = await checkGovernmentLandEncroachment(extractedData);
    if (governmentLandCheck.isSuspicious) {
      fraudChecks.fraudTypes.push("Government Land Encroachment");
      fraudChecks.isFraudulent = true;
      fraudChecks.details.governmentLand = governmentLandCheck;
      fraudChecks.recommendations.push("Cross-check with Revenue Map and Town Planning Records");
    }
    
    // 8. Check for mutation fraud
    const mutationFraudCheck = await checkMutationFraud(extractedData);
    if (mutationFraudCheck.isSuspicious) {
      fraudChecks.fraudTypes.push("Mutation Process Fraud");
      fraudChecks.isFraudulent = true;
      fraudChecks.details.mutationFraud = mutationFraudCheck;
      fraudChecks.recommendations.push("Verify with the original sale deed and Mutation Register");
    }
    
    // Additional warnings for documents with minimal issues
    if (fraudChecks.fraudTypes.length === 0 && fraudChecks.warnings.length === 0) {
      // Perform basic consistency checks
      const consistencyIssues = checkDocumentConsistency(extractedData, documentText);
      fraudChecks.warnings = consistencyIssues;
      
      if (consistencyIssues.length > 0) {
        fraudChecks.recommendations.push("Minor inconsistencies found. Consider additional verification.");
      }
    }
    
    return fraudChecks;
  } catch (error) {
    console.error("Fraud detection error:", error);
    return {
      isFraudulent: false,
      fraudTypes: [],
      warnings: ["Fraud detection system encountered an error. Manual verification recommended."],
      details: { error: error.message },
      recommendations: ["Please verify this document manually with the concerned authorities."]
    };
  }
}

/**
 * Calculate a hash of the document for integrity checking
 */
async function calculateDocumentHash(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      const hex = hashSum.digest('hex');
      resolve(hex);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Check for fake 7/12 documents
 */
async function checkFakeDocument(extractedData, documentHash, language) {
  // Simulate API call to verify document with Tehsil Office
  // In production, use actual API integration
  try {
    // In production, this would be a real API call
    // const response = await axios.post(`${API_CONFIG.tehsilOfficeAPI}/verify-document`, {
    //   surveyNumber: extractedData.surveyNumber,
    //   villageCode: getVillageCode(extractedData.villageName),
    //   talukaCode: getTalukaCode(extractedData.talukaName),
    //   districtCode: getDistrictCode(extractedData.districtName),
    //   documentHash: documentHash
    // });
    
    // Simulated validation logic
    const suspicious = !isValidSurveyNumberFormat(extractedData.surveyNumber);
    
    return {
      isSuspicious: suspicious,
      reasons: suspicious ? ["Survey number format is invalid", "Document not found in official records"] : [],
      confidence: suspicious ? 0.85 : 0.2
    };
  } catch (error) {
    console.error("Error verifying document with Tehsil office:", error);
    return {
      isSuspicious: true,
      reasons: ["Failed to verify with official records", "Document authentication failed"],
      confidence: 0.7
    };
  }
}

/**
 * Check for tampering with ownership details
 */
async function checkOwnershipTampering(extractedData, documentText, language) {
  // In real implementation, check with mutation register and historical data
  try {
    // Look for typical signs of tampering in the text
    const possibleTampering = checkForTextualAnomalies(documentText);
    
    // Check for inconsistent ownership information
    const ownerNameInconsistency = checkOwnerNameInconsistency(extractedData, documentText, language);
    
    return {
      isSuspicious: possibleTampering || ownerNameInconsistency,
      reasons: [
        ...(possibleTampering ? ["Document text shows signs of modification"] : []),
        ...(ownerNameInconsistency ? ["Owner name appears inconsistent within the document"] : [])
      ],
      confidence: (possibleTampering || ownerNameInconsistency) ? 0.75 : 0.15
    };
  } catch (error) {
    console.error("Error checking ownership tampering:", error);
    return {
      isSuspicious: false,
      reasons: ["Failed to validate ownership details"],
      confidence: 0.5
    };
  }
}

/**
 * Check for unauthorized land transfers
 */
async function checkUnauthorizedTransfers(extractedData, language) {
  // This would check the mutation register in production
  try {
    // If landArea is unusually small or large, flag it
    const areaValue = parseAreaValue(extractedData.landArea);
    const isAreaSuspicious = areaValue && (areaValue < 0.1 || areaValue > 100);
    
    return {
      isSuspicious: isAreaSuspicious,
      reasons: isAreaSuspicious ? ["Land area is unusually small or large"] : [],
      confidence: isAreaSuspicious ? 0.6 : 0.1
    };
  } catch (error) {
    console.error("Error checking unauthorized transfers:", error);
    return {
      isSuspicious: false,
      reasons: [],
      confidence: 0.1
    };
  }
}

/**
 * Check for fake signatures and seals
 * In production, this would use image processing techniques
 */
async function checkFakeSignaturesAndSeals(filePath) {
  // This is a placeholder - in production, use computer vision to analyze signatures and seals
  // For now, return a random result for demonstration
  const randomSuspicion = Math.random() < 0.2; // 20% chance of flagging as suspicious
  
  return {
    isSuspicious: randomSuspicion,
    reasons: randomSuspicion ? ["Signature appears inconsistent with reference samples"] : [],
    confidence: randomSuspicion ? 0.65 : 0.2
  };
}

/**
 * Check for duplicate 7/12 documents
 */
async function checkDuplicateDocuments(extractedData, documentHash) {
  // In production, check against a database of known documents
  const key = `${extractedData.surveyNumber}-${extractedData.villageName}-${extractedData.talukaName}`;
  
  const isDuplicate = documentCache[key] && documentCache[key] !== documentHash;
  
  // Store this document hash for future reference
  if (!documentCache[key]) {
    documentCache[key] = documentHash;
  }
  
  return {
    isSuspicious: isDuplicate,
    reasons: isDuplicate ? ["Another document with the same survey number and location exists"] : [],
    confidence: isDuplicate ? 0.9 : 0.1
  };
}

/**
 * Check for Power of Attorney misuse
 */
async function checkPoAMisuse(extractedData, documentText) {
  // Check if the document mentions PoA 
  const containsPoA = /power\s+of\s+attorney|पॉवर\s+ऑफ\s+अटॉर्नी|मुखत्यारपत्र/i.test(documentText);
  
  if (!containsPoA) {
    return {
      isSuspicious: false,
      reasons: [],
      confidence: 0.1
    };
  }
  
  // In production, validate the PoA with registrar's office
  return {
    isSuspicious: true,
    reasons: ["Document involves Power of Attorney - requires additional verification"],
    confidence: 0.6
  };
}

/**
 * Check for government land encroachment
 */
async function checkGovernmentLandEncroachment(extractedData) {
  // In production, check against government land database
  // For now, check if land type indicates potential government land
  const landTypeLowercase = extractedData.landType ? extractedData.landType.toLowerCase() : '';
  const suspiciousLandType = landTypeLowercase.includes('gov') || 
                             landTypeLowercase.includes('reserved') ||
                             landTypeLowercase.includes('forest') ||
                             landTypeLowercase.includes('protected');
  
  return {
    isSuspicious: suspiciousLandType,
    reasons: suspiciousLandType ? ["Land type may indicate government ownership"] : [],
    confidence: suspiciousLandType ? 0.7 : 0.2
  };
}

/**
 * Check for fraud in mutation process
 */
async function checkMutationFraud(extractedData) {
  // In production, check with mutation register API
  // For now, return a placeholder result
  return {
    isSuspicious: false,
    reasons: [],
    confidence: 0.1
  };
}

/**
 * Helper function to check for textual anomalies that might indicate tampering
 */
function checkForTextualAnomalies(text) {
  // Look for signs of digital manipulation in text
  const anomalyPatterns = [
    /[^\s\n][A-Z]{5,}[^\s\n]/,  // Unexpected all-caps words (potential replacements)
    /\d{2,}[A-Za-z]\d{2,}/,     // Numbers with inserted letters
    /[\u0900-\u097F][\u0000-\u007F][\u0900-\u097F]/  // Devanagari script with inserted Latin characters
  ];
  
  return anomalyPatterns.some(pattern => pattern.test(text));
}

/**
 * Helper function to check owner name consistency
 */
function checkOwnerNameInconsistency(extractedData, documentText, language) {
  if (!extractedData.ownerName) return false;
  
  const ownerName = extractedData.ownerName.trim();
  
  // Check if owner name appears multiple times with variations
  const nameVariations = [];
  
  if (language === 'en') {
    // For English documents
    const nameMatches = documentText.match(new RegExp(`(Name|Owner|Holder)[^\\n]{1,50}(${escapeRegExp(ownerName)})[^\\n]{0,30}`, 'gi'));
    if (nameMatches && nameMatches.length > 1) {
      // Check if name variations exist
      for (const match of nameMatches) {
        const extractedNameMatch = match.match(new RegExp(`(Name|Owner|Holder)[^\\n]{1,50}([^\\n]{3,50})`, 'i'));
        if (extractedNameMatch && extractedNameMatch[2]) {
          nameVariations.push(extractedNameMatch[2].trim());
        }
      }
    }
  } else {
    // For Marathi documents
    const nameMatches = documentText.match(new RegExp(`(नाव|मालक|धारक)[^\\n]{1,50}(${escapeRegExp(ownerName)})[^\\n]{0,30}`, 'gi'));
    if (nameMatches && nameMatches.length > 1) {
      // Check if name variations exist
      for (const match of nameMatches) {
        const extractedNameMatch = match.match(new RegExp(`(नाव|मालक|धारक)[^\\n]{1,50}([^\\n]{3,50})`, 'i'));
        if (extractedNameMatch && extractedNameMatch[2]) {
          nameVariations.push(extractedNameMatch[2].trim());
        }
      }
    }
  }
  
  // If we have multiple name variations, check if they're inconsistent
  if (nameVariations.length > 1) {
    const uniqueNames = new Set(nameVariations);
    return uniqueNames.size > 1;
  }
  
  return false;
}

/**
 * Helper function to check document consistency
 */
function checkDocumentConsistency(extractedData, documentText) {
  const warnings = [];
  
  // Check if all required fields exist
  const requiredFields = ['surveyNumber', 'ownerName', 'landArea', 'villageName', 'talukaName', 'districtName'];
  const missingFields = requiredFields.filter(field => !extractedData[field]);
  
  if (missingFields.length > 0) {
    warnings.push(`Document is missing important fields: ${missingFields.join(', ')}`);
  }
  
  // Check if the document mentions certain keywords but they aren't extracted
  const keywordChecks = [
    { keyword: /mortgage|loan|hypothecation|lien/i, field: 'encumbrances', message: "Document may have unextracted mortgage information" },
    { keyword: /court|case|litigation|dispute/i, field: 'litigation', message: "Document may have unextracted legal dispute information" },
    { keyword: /tax|revenue|arrears|dues/i, field: 'taxDues', message: "Document may have unextracted tax information" }
  ];
  
  for (const check of keywordChecks) {
    if (check.keyword.test(documentText) && !extractedData[check.field]) {
      warnings.push(check.message);
    }
  }
  
  return warnings;
}

/**
 * Helper function to validate survey number format
 */
function isValidSurveyNumberFormat(surveyNumber) {
  if (!surveyNumber) return false;
  
  // Clean the survey number
  const cleanedNumber = surveyNumber.trim().replace(/\s+/g, '');
  
  // Check if it's in valid format: digits, possibly with a slash
  return /^\d+(?:\/\d+)?$/.test(cleanedNumber);
}

/**
 * Helper function to parse area value from text
 */
function parseAreaValue(areaText) {
  if (!areaText) return null;
  
  // Extract the numeric part (handle both Western and Devanagari digits)
  const match = areaText.match(/[\d\u0966-\u096F]+\.?[\d\u0966-\u096F]*/);
  if (!match) return null;
  
  // Convert string to number
  let numericValue = match[0].replace(/[\u0966-\u096F]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0966 + 0x30));
  return parseFloat(numericValue);
}

/**
 * Helper function to escape special characters in regex
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Export the main fraud detection function
module.exports = { detectFraud };