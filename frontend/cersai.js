// DOM Elements
const uploadArea = document.querySelector('.upload-area');
const fileInput = document.querySelector('#file-input');
const browseBtn = document.querySelector('.browse-btn');
const ownerNameContainer = document.querySelector('.owner-name-container');
const ownerInput = document.querySelector('.owner-input');
const verifyBtn = document.querySelector('.verify-btn');
const progressContainer = document.querySelector('.progress-container');
const progressBar = document.querySelector('.progress');
const progressStatus = document.querySelector('.progress-status');
const resultContainer = document.querySelector('.result-container');
const resultBtn = document.querySelector('.result-btn');

// State Management
let currentFile = null;
let isUploading = false;
let uploadProgress = 0;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the correct page (check if upload area exists)
    if (uploadArea) {
        initializeUpload();
    }
    // Only initialize tabs if they exist
    if (document.querySelector('.tab-btn')) {
        initializeTabs();
    }
});

// Initialize Upload Area
function initializeUpload() {
    // Drag and Drop Events
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragging');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragging');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragging');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // Click to Upload
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Verify Button
    verifyBtn.addEventListener('click', startVerification);
}

// Initialize Tabs
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.querySelector(`#${tabId}`).classList.add('active');
        });
    });
}

// Handle File Selection
function handleFiles(files) {
    if (files.length === 0) return;

    const file = files[0];
    if (!validateFile(file)) return;

    currentFile = file;
    showOwnerNameInput();
    updateUploadArea(file.name);
}

// Validate File
function validateFile(file) {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
        showError('Please upload a PDF, JPG, or PNG file.');
        return false;
    }

    if (file.size > maxSize) {
        showError('File size should be less than 5MB.');
        return false;
    }

    return true;
}

// Show Owner Name Input
function showOwnerNameInput() {
    ownerNameContainer.style.display = 'block';
    ownerInput.focus();
}

// Update Upload Area
function updateUploadArea(fileName) {
    uploadArea.innerHTML = `
        <i class="fas fa-file-alt upload-icon"></i>
        <h3>${fileName}</h3>
        <p>Click to change file</p>
    `;
}

// Start Verification
async function startVerification() {
    if (!currentFile || !ownerInput.value.trim()) {
        showError('Please upload a file and enter the owner name.');
        return;
    }

    if (isUploading) return;

    isUploading = true;
    showProgress();
    resetProgress();

    try {
        // Simulate file upload and processing
        await simulateUpload();
        await simulateProcessing();
        showResult();
    } catch (error) {
        showError(error.message);
    } finally {
        isUploading = false;
    }
}

// Simulate Upload
function simulateUpload() {
    return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            updateProgress(progress, 'Uploading file...');
            
            if (progress >= 100) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
}

// Simulate Processing
function simulateProcessing() {
    return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            updateProgress(progress, 'Processing document...');
            
            if (progress >= 100) {
                clearInterval(interval);
                resolve();
            }
        }, 50);
    });
}

// Update Progress
function updateProgress(progress, status) {
    uploadProgress = progress;
    progressBar.style.width = `${progress}%`;
    progressStatus.textContent = status;
}

// Reset Progress
function resetProgress() {
    uploadProgress = 0;
    progressBar.style.width = '0%';
    progressStatus.textContent = '';
}

// Show Progress
function showProgress() {
    progressContainer.style.display = 'block';
    resultContainer.style.display = 'none';
}

// Show Result
function showResult() {
    progressContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    
    // Simulate CERSAI verification result
    const hasMortgage = Math.random() > 0.5;
    const result = {
        ownerName: ownerInput.value,
        documentType: currentFile.type,
        hasMortgage: hasMortgage,
        verificationDate: new Date().toLocaleDateString()
    };

    // Store result in localStorage for the result page
    localStorage.setItem('cersaiResult', JSON.stringify(result));
}

// Show Error
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    document.querySelector('.cersai-upload-section').appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Result Button Click
resultBtn.addEventListener('click', () => {
    window.location.href = 'result.html';
}); 