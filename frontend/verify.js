
document.getElementById("menuToggle").addEventListener("click", function () {
    document.getElementById("navLinks").classList.toggle("active");
});
// DOM Elements with error handling
const getElement = (id) => document.getElementById(id) || console.warn(`Element with id '${id}' not found`);

// Upload Area Elements
const uploadArea = getElement('uploadArea');
const fileInput = getElement('fileInput');
const browseBtn = getElement('browseBtn');
const verifyBtn = getElement('verifyBtn');
const progressContainer = getElement('progressContainer');
const progressBar = getElement('progressBar');
const progressStatus = getElement('progressStatus');
const ownerNameContainer = getElement('ownerNameContainer');
const ownerNameInput = getElement('ownerNameInput');
const steps = document.querySelectorAll('.step');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');

let selectedFile = null;
let isUploading = false;

// Configuration
const config = {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    uploadDelay: 50, // ms between progress updates
};

// Initialize Upload Area
function initializeUpload() {
    if (!uploadArea || !fileInput || !browseBtn || !verifyBtn || !ownerNameContainer || !ownerNameInput) {
        console.error('Required elements not found');
        return;
    }

    browseBtn.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
        uploadArea.addEventListener(event, preventDefaults);
        document.body.addEventListener(event, preventDefaults);
    });
    ['dragenter', 'dragover'].forEach(event => uploadArea.addEventListener(event, highlight));
    ['dragleave', 'drop'].forEach(event => uploadArea.addEventListener(event, unhighlight));

    verifyBtn.addEventListener('click', function() {
        if (selectedFile && ownerNameInput.value.trim()) {
            startVerification();
        } else {
            alert('Please enter owner name before verifying');
        }
    });

    fileInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            selectedFile = e.target.files[0];
            uploadArea.style.display = 'none';
            ownerNameContainer.style.display = 'block';
            verifyBtn.style.display = 'block';
            updateStep(1);
        }
    });

    if (mobileMenuBtn && mobileMenu) initializeMobileMenu();
}

function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
function highlight() { uploadArea.classList.add('dragging'); }
function unhighlight() { uploadArea.classList.remove('dragging'); }
function handleDrop(e) { handleFiles(e.dataTransfer.files); }
function handleFileSelect(e) { handleFiles(e.target.files); }

function handleFiles(files) {
    if (isUploading || files.length === 0) return showError('No file selected');
    
    const file = files[0];
    const validationError = validateFile(file);
    if (validationError) return showError(validationError);
    
    startUpload(file);
    setTimeout(() => uploadFile(file), 500);
}

function validateFile(file) {
    if (!config.allowedTypes.includes(file.type)) return 'Invalid file type. Upload PDF, JPEG, or PNG.';
    if (file.size > config.maxFileSize) return 'File size exceeds 10MB limit.';
    return null;
}

function startVerification() {
    isUploading = true;
    ownerNameContainer.style.display = 'none';
    verifyBtn.style.display = 'none';
    progressContainer.style.display = 'block';
    updateStep(2);
    simulateProcess();
    uploadFile();
}

function simulateProcess() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 100) progress = 100;
        
        progressBar.style.width = `${progress}%`;
        progressStatus.textContent = getStatusMessage(progress);
        
        if (progress === 100) {
            clearInterval(interval);
        }
    }, 500);
}

function getStatusMessage(progress) {
    if (progress < 40) return 'Uploading document...';
    if (progress < 70) return 'Analyzing document...';
    if (progress < 90) return 'Verifying authenticity...';
    return 'Finalizing verification...';
}

function uploadFile() {
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    const ownerName = ownerNameInput.value.trim();
    formData.append('ownerName', ownerName);

    fetch("http://localhost:5000/files/upload", { 
        method: "POST", 
        body: formData 
    })
    .then(response => response.json())
    .then(uploadData => {
        console.log("Upload successful:", uploadData);
        if (!uploadData.success) {
            throw new Error(uploadData.message || 'Upload failed');
        }
        
        // Now validate the document
        const ownerName = ownerNameInput.value.trim();
        return fetch(`http://localhost:5000/files/validate-document/${uploadData.file}?ownerName=${encodeURIComponent(ownerName)}`, {
            method: 'GET'
        });
    })
    .then(response => response.json())
    .then(data => {
        console.log("Validation results:", data);
        // Update progress to complete
        updateStep(3);
        progressContainer.style.display = 'none';
        
        // Show result buttons
        const resultContainer = document.createElement('div');
        resultContainer.className = 'result-container';

        // Log the full response for debugging
        console.log('Full response:', JSON.stringify(data, null, 2));

        // Check both API success and verification result
        const isSuccess = data.success && data.verified;
        const statusMessage = data.message;

        resultContainer.innerHTML = `
            <div class="result-header ${isSuccess ? 'success' : 'error'}">
                <h3>${isSuccess ? 'Verification Successful' : 'Verification Failed'}</h3>
                <p>${statusMessage}</p>
            </div>
            <div class="details-section">
                <div class="detail-item">
                    <h4>Survey Number</h4>
                    <p>${data.details?.surveyNumber || 'N/A'}</p>
                </div>
                <div class="detail-item">
                    <h4>Owner Information</h4>
                    <p><strong>Database Record:</strong> ${data.details?.ownerName?.database || 'N/A'}</p>
                    <p><strong>Extracted from Document:</strong> ${data.details?.ownerName?.extracted || 'N/A'}</p>
                    <p><strong>Owner Name:</strong> ${data.details?.ownerName?.input || ownerNameInput.value || 'N/A'}</p>
                </div>
                <div class="detail-item">
                    <h4>Land Area</h4>
                    <p>${data.details?.landArea || 'N/A'}</p>
                </div>
            </div>
            <div class="button-group">
                <button onclick="cancelVerification()" class="action-btn cancel-btn">Cancel</button>
                <button onclick="uploadAnother()" class="action-btn upload-btn">Upload Another Document</button>
            </div>
        `;
        document.querySelector('.verification-container').appendChild(resultContainer);
    })
    .catch(error => {
        console.error("Error:", error);
        progressContainer.style.display = 'none';
        alert('An error occurred during verification. Please try again.');
        location.reload();
    });
}

function cancelVerification() {
    // Clear the form and reset UI
    location.reload();
}

function uploadAnother() {
    // Reset the form but keep the current session
    selectedFile = null;
    ownerNameInput.value = '';
    document.querySelector('.result-container')?.remove();
    progressContainer.style.display = 'none';
    uploadArea.style.display = 'block';
    updateStep(1);
}

function showResults(file) {
    progressContainer.innerHTML = `
        <div class="verification-results">
            <i class="fas fa-check-circle"></i>
            <h3>Document Verified Successfully</h3>
            <p>Your document has passed all security checks.</p>
            <div class="results-details">
                <p><strong>File Name:</strong> ${file.name}</p>
                <p><strong>File Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                <p><strong>File Type:</strong> ${file.type}</p>
            </div>
            <button id="uploadAnother" class="upload-another-btn">Upload Another</button>
            <button id="cancelUpload" class="cancel-upload-btn">Cancel</button>
        </div>
    `;
    getElement('uploadAnother')?.addEventListener('click', resetUpload);
    getElement('cancelUpload')?.addEventListener('click', cancelUpload);
}

function showError(message) {
    const errorBox = document.createElement('div');
    errorBox.className = 'error-box';
    errorBox.textContent = message;
    document.body.appendChild(errorBox);
    setTimeout(() => errorBox.remove(), 3000);
}

function resetUpload() {
    isUploading = false;
    progressContainer.style.display = 'none';
    uploadArea.style.display = ''; // Reset to default instead of forcing 'flex'
    fileInput.value = '';
    updateStep(0);
}

function cancelUpload() {
    isUploading = false;
    resetUpload();
    showError('Upload canceled.');
}

function updateStep(step) {
    steps.forEach((el, index) => el?.classList.toggle('active', index <= step));
}

function initializeMobileMenu() {
    mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('active'));
    document.addEventListener('click', (e) => !e.target.closest('.nav') && mobileMenu.classList.remove('active'));
}

document.addEventListener('DOMContentLoaded', initializeUpload);