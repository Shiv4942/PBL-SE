// DOM Elements with error handling
const getElement = (id) => {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found`);
    }
    return element;
};


const uploadArea = getElement('uploadArea');
const fileInput = getElement('fileInput');
const browseBtn = getElement('browseBtn');
const progressContainer = getElement('progressContainer');
const progressBar = getElement('progressBar');
const progressStatus = getElement('progressStatus');
const steps = document.querySelectorAll('.step');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');

// Configuration
const config = {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    uploadDelay: 50, // milliseconds between progress updates
};

// Current step tracker
let currentStep = 0;
let isUploading = false;

// Initialize the upload area
function initializeUpload() {
    if (!uploadArea || !fileInput || !browseBtn) {
        console.error('Required elements not found');
        return;
    }

    // Create click target for entire upload area
    uploadArea.addEventListener('click', (e) => {
        if (e.target === browseBtn) {
            fileInput.click();
        }
    });

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Handle drag and drop events
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    // Handle file drop
    uploadArea.addEventListener('drop', handleDrop, false);

    // Handle file input change
    fileInput.addEventListener('change', handleFileSelect, false);

    // Mobile menu functionality
    if (mobileMenuBtn && mobileMenu) {
        initializeMobileMenu();
    }
}

// Utility functions
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    uploadArea.classList.add('dragging');
}

function unhighlight() {
    uploadArea.classList.remove('dragging');
}

// File handling
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (isUploading) return;
    
    if (files.length === 0) {
        showError('No file selected');
        return;
    }

    const file = files[0];

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
        showError(validationError);
        return;
    }

    // Begin upload process
    startUpload(file);
}

function validateFile(file) {
    if (!config.allowedTypes.includes(file.type)) {
        return 'Please upload a PDF, JPEG, or PNG file';
    }
    if (file.size > config.maxFileSize) {
        return 'File size exceeds 10MB limit';
    }
    return null;
}

// Upload process
function startUpload(file) {
    isUploading = true;
    uploadArea.style.display = 'none';
    progressContainer.style.display = 'block';
    updateStep(1);
    simulateProcess(file);
}

function simulateProcess(file) {
    let progress = 0;
    progressStatus.textContent = 'Preparing upload...';

    const interval = setInterval(() => {
        progress += 2;
        updateProgress(progress);

        if (progress >= 100) {
            clearInterval(interval);
            completeVerification(file);
        }
    }, config.uploadDelay);
}

function updateProgress(progress) {
    if (!progressBar) return;
    
    progressBar.style.width = `${progress}%`; // Corrected here: add '%' sign in template literal
    
    const status = getProgressStatus(progress);
    if (progressStatus) {
        progressStatus.textContent = status;
    }
}

function getProgressStatus(progress) {
    if (progress < 40) return 'Uploading document...';
    if (progress < 70) return 'Analyzing document...';
    if (progress < 90) return 'Verifying authenticity...';
    return 'Finalizing verification...';
}

function completeVerification(file) {
    setTimeout(() => {
        if (progressStatus) {
            progressStatus.textContent = 'Verification Complete!';
        }
        updateStep(2);
        showResults(file);
    }, 500);
}

// Results display
function showResults(file) {
    if (!progressContainer) return;

    const fileSize = (file.size / 1024).toFixed(2);
    const resultHtml = `
        <div class="verification-results">
            <i class="fas fa-check-circle"></i>
            <h3>Document Verified Successfully</h3>
            <p>Your document has passed all security checks.</p>
            <div class="results-details">
                <p><strong>File Name:</strong> ${file.name}</p>
                <p><strong>File Size:</strong> ${fileSize} KB</p>
                <p><strong>File Type:</strong> ${file.type}</p>
            </div>
            <button id="uploadAnother" class="upload-another-btn">Upload Another Document</button>
        </div>
    `;

    progressContainer.innerHTML = resultHtml;

    const uploadAnotherBtn = getElement('uploadAnother');
    if (uploadAnotherBtn) {
        uploadAnotherBtn.addEventListener('click', resetUpload);
    }
}

// Error handling
function showError(message) {
    alert(message); // You can replace this with a better UI notification
}

// Reset functionality
function resetUpload() {
    isUploading = false;
    if (progressContainer) progressContainer.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'flex';
    if (fileInput) fileInput.value = '';
    updateStep(0);
}

// Step management
function updateStep(step) {
    currentStep = step;
    steps.forEach((stepEl, index) => {
        if (stepEl) {
            if (index <= currentStep) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        }
    });
}

// Mobile menu
function initializeMobileMenu() {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav')) {
            mobileMenu.classList.remove('active');
        }
    });
    document.getElementById("menuToggle").addEventListener("click", function () {
        document.getElementById("navLinks").classList.toggle("active");
    });
    
}5

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeUpload);