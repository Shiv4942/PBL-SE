
document.getElementById("menuToggle").addEventListener("click", function () {
    document.getElementById("navLinks").classList.toggle("active");
});
// DOM Elements with error handling
const getElement = (id) => document.getElementById(id) || console.warn(`Element with id '${id}' not found`);

// Upload Area Elements
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
    uploadDelay: 50, // ms between progress updates
};

let isUploading = false;

// Initialize Upload Area
function initializeUpload() {
    if (!uploadArea || !fileInput || !browseBtn) {
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

function startUpload(file) {
    isUploading = true;
    uploadArea.style.display = 'none';
    progressContainer.style.display = 'block';
    updateStep(1);
    simulateProcess(file);
}

function simulateProcess(file) {
    let progress = 0;
    updateProgress(progress);
    
    const interval = setInterval(() => {
        if (!isUploading) return clearInterval(interval);
        progress += 2;
        updateProgress(progress);
        if (progress >= 100) {
            clearInterval(interval);
            completeVerification(file);
        }
    }, config.uploadDelay);
}

function updateProgress(progress) {
    if (progressBar && progressStatus) {
        progressBar.style.width = `${progress}%`;
        requestAnimationFrame(() => progressStatus.textContent = getProgressStatus(progress));
    }
}

function getProgressStatus(progress) {
    if (progress < 40) return 'Uploading document...';
    if (progress < 70) return 'Analyzing document...';
    if (progress < 90) return 'Verifying authenticity...';
    return 'Finalizing verification...';
}

function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    fetch("http://localhost:5000/files/upload", { method: "POST", body: formData })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            progressStatus.textContent = "Upload successful!";
            updateStep(2);
        } else {
            showError(data.message || "Upload failed");
        }
    })
    .catch(() => showError("Upload failed"));
}

function completeVerification(file) {
    setTimeout(() => {
        progressStatus.textContent = 'Verification Complete!';
        updateStep(2);
        showResults(file);
    }, 500);
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
    uploadArea.style.display = 'flex';
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
