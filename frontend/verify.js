
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

const progressBarThemes = [
    {
        name: "Curious Minds",
        init: function(container) {
            // Create emotion icon element
            const emotionIcon = document.createElement('div');
            emotionIcon.className = 'emotion-icon';
            emotionIcon.innerHTML = '😐';
            emotionIcon.style.fontSize = '2rem';
            emotionIcon.style.textAlign = 'center';
            emotionIcon.style.marginTop = '10px';
            container.appendChild(emotionIcon);
            return emotionIcon;
        },
        update: function(progress, element) {
            if (progress < 25) element.innerHTML = '😐';
            else if (progress < 50) element.innerHTML = '🙂';
            else if (progress < 75) element.innerHTML = '😄';
            else element.innerHTML = '🤩';
        }
    },
    {
        name: "Don't Leave Me Hanging",
        init: function(container) {
            // Create climber element
            const climber = document.createElement('div');
            climber.className = 'climber';
            climber.innerHTML = '🧗';
            climber.style.position = 'absolute';
            climber.style.fontSize = '1.5rem';
            climber.style.bottom = '10px';
            climber.style.left = '0%';
            climber.style.transform = 'translateX(-50%)';
            climber.style.transition = 'left 0.5s ease-in-out';
            container.style.position = 'relative';
            container.appendChild(climber);
            
            // Create speech bubble
            const speech = document.createElement('div');
            speech.className = 'speech-bubble';
            speech.style.position = 'absolute';
            speech.style.bottom = '45px';
            speech.style.left = '0%';
            speech.style.transform = 'translateX(-50%)';
            speech.style.backgroundColor = '#fff';
            speech.style.padding = '5px 10px';
            speech.style.borderRadius = '10px';
            speech.style.fontSize = '0.8rem';
            speech.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            speech.style.transition = 'left 0.5s ease-in-out';
            speech.innerHTML = '😤 Here we go!';
            container.appendChild(speech);
            
            return {climber, speech};
        },
        update: function(progress, elements) {
            elements.climber.style.left = `${progress}%`;
            elements.speech.style.left = `${progress}%`;
            
            if (progress < 25) {
                elements.speech.innerHTML = '😤 Here we go!';
            } else if (progress < 50) {
                elements.speech.innerHTML = '😅 Getting there...';
            } else if (progress < 75) {
                elements.speech.innerHTML = '💪 Almost!';
            } else if (progress < 95) {
                elements.speech.innerHTML = '🙌 So close!';
            } else {
                elements.speech.innerHTML = '🥳 We did it!';
            }
        }
    },
    {
        name: "Therapist Mode",
        init: function(container) {
            // Create therapist message element
            const message = document.createElement('div');
            message.className = 'therapist-message';
            message.style.textAlign = 'center';
            message.style.marginTop = '15px';
            message.style.fontStyle = 'italic';
            message.style.color = '#555';
            message.innerHTML = "Let's take a deep breath together...";
            container.appendChild(message);
            return message;
        },
        update: function(progress, element) {
            if (progress < 20) {
                element.innerHTML = "Let's take a deep breath together...";
            } else if (progress < 40) {
                element.innerHTML = "You're doing great.";
            } else if (progress < 60) {
                element.innerHTML = "Patience is a virtue, and you have plenty.";
            } else if (progress < 80) {
                element.innerHTML = "It's okay to wait, we're making progress.";
            } else {
                element.innerHTML = "I'm proud of us!";
            }
        }
    },
    {
        name: "Heartbeat Progress",
        init: function(container) {
            // Modify the existing progress bar for heartbeat effect
            const progressBar = container.querySelector('.progress');
            progressBar.style.transition = 'width 0.5s ease-in-out';
            
            // Create heart rate indicator
            const heartRate = document.createElement('div');
            heartRate.className = 'heart-rate';
            heartRate.style.textAlign = 'center';
            heartRate.style.marginTop = '10px';
            heartRate.innerHTML = '❤️ <span>60 bpm</span>';
            container.appendChild(heartRate);
            
            // Start heartbeat animation
            let isExpanded = false;
            const heartbeat = setInterval(() => {
                if (isExpanded) {
                    progressBar.style.transform = 'scaleY(1)';
                } else {
                    progressBar.style.transform = 'scaleY(1.2)';
                }
                isExpanded = !isExpanded;
            }, 1000);
            
            return {heartRate, heartbeat};
        },
        update: function(progress, elements) {
            // Adjust heartbeat speed based on progress
            let interval = 1000 - (progress * 6); // From 1000ms to 400ms
            if (interval < 400) interval = 400;
            
            const bpm = Math.floor(60000 / interval);
            elements.heartRate.querySelector('span').innerText = `${bpm} bpm`;
            
            clearInterval(elements.heartbeat);
            let isExpanded = false;
            elements.heartbeat = setInterval(() => {
                if (isExpanded) {
                    document.querySelector('.progress').style.transform = 'scaleY(1)';
                } else {
                    document.querySelector('.progress').style.transform = 'scaleY(1.2)';
                }
                isExpanded = !isExpanded;
            }, interval);
        },
        cleanup: function(elements) {
            clearInterval(elements.heartbeat);
        }
    },
    {
        name: "Loading Mood Swing",
        init: function(container) {
            // Create mood element
            const moodElement = document.createElement('div');
            moodElement.className = 'mood-swing';
            moodElement.style.textAlign = 'center';
            moodElement.style.marginTop = '10px';
            moodElement.style.fontWeight = 'bold';
            moodElement.innerHTML = "Feeling hopeful...";
            container.appendChild(moodElement);
            
            return moodElement;
        },
        update: function(progress, element) {
            const moods = [
                "Feeling hopeful...",
                "Mild anxiety kicking in...",
                "Getting excited!",
                "Almost there, deep breaths!",
                "Can't contain my excitement!",
                "This wait is making me philosophical...",
                "My patience is being tested...",
                "Having a moment of zen...",
                "Starting to daydream..."
            ];
            
            // Change mood randomly every 3-5 seconds if not at 100%
            if (progress < 100 && (!element.lastMoodChange || Date.now() - element.lastMoodChange > 4000)) {
                const randomMood = moods[Math.floor(Math.random() * moods.length)];
                element.innerHTML = randomMood;
                element.lastMoodChange = Date.now();
            } else if (progress >= 95) {
                element.innerHTML = "Almost there, deep breaths!";
            }
        }
    },
    {
        name: "Pet Companion",
        init: function(container) {
            // Create pet element
            const pet = document.createElement('div');
            pet.className = 'pet-companion';
            pet.style.textAlign = 'center';
            pet.style.marginTop = '10px';
            pet.style.fontSize = '2rem';
            pet.innerHTML = '😴 <span>Zzz... Your file is being processed</span>';
            pet.querySelector('span').style.fontSize = '1rem';
            pet.querySelector('span').style.verticalAlign = 'middle';
            pet.querySelector('span').style.marginLeft = '10px';
            container.appendChild(pet);
            return pet;
        },
        update: function(progress, element) {
            if (progress < 20) {
                element.innerHTML = '😴 <span>Zzz... Your file is being processed</span>';
            } else if (progress < 60) {
                element.innerHTML = '🐾 <span>Your pet is getting curious</span>';
            } else if (progress < 90) {
                element.innerHTML = '🐶 <span>Tail wagging with excitement!</span>';
            } else {
                element.innerHTML = '🎉 <span>Your pet is jumping with joy!</span>';
            }
            element.querySelector('span').style.fontSize = '1rem';
            element.querySelector('span').style.verticalAlign = 'middle';
            element.querySelector('span').style.marginLeft = '10px';
        }
    },
    {
        name: "Emotion Timeline",
        init: function(container) {
            // Create timeline container
            const timeline = document.createElement('div');
            timeline.className = 'emotion-timeline';
            timeline.style.display = 'flex';
            timeline.style.justifyContent = 'space-between';
            timeline.style.marginTop = '15px';
            timeline.style.position = 'relative';
            
            // Create emotion points
            const emotions = ['Suspicious...', 'Curious...', 'Hopeful...', 'Satisfied!'];
            emotions.forEach((emotion, index) => {
                const point = document.createElement('div');
                point.className = 'timeline-point';
                point.style.width = '20px';
                point.style.height = '20px';
                point.style.borderRadius = '50%';
                point.style.backgroundColor = '#ddd';
                point.style.display = 'flex';
                point.style.alignItems = 'center';
                point.style.justifyContent = 'center';
                point.style.position = 'relative';
                point.style.zIndex = '1';
                
                const label = document.createElement('div');
                label.className = 'timeline-label';
                label.textContent = emotion;
                label.style.position = 'absolute';
                label.style.top = '25px';
                label.style.transform = 'translateX(-50%)';
                label.style.fontSize = '0.8rem';
                label.style.color = '#777';
                label.style.whiteSpace = 'nowrap';
                
                point.appendChild(label);
                timeline.appendChild(point);
            });
            
            // Create line connecting points
            const line = document.createElement('div');
            line.className = 'timeline-line';
            line.style.position = 'absolute';
            line.style.top = '10px';
            line.style.left = '10px';
            line.style.right = '10px';
            line.style.height = '2px';
            line.style.backgroundColor = '#ddd';
            line.style.zIndex = '0';
            timeline.appendChild(line);
            
            // Create progress indicator
            const indicator = document.createElement('div');
            indicator.className = 'timeline-indicator';
            indicator.style.position = 'absolute';
            indicator.style.top = '6px';
            indicator.style.left = '10px';
            indicator.style.width = '8px';
            indicator.style.height = '8px';
            indicator.style.borderRadius = '50%';
            indicator.style.backgroundColor = '#0f4c81';
            indicator.style.transition = 'left 0.5s ease-in-out';
            indicator.style.zIndex = '2';
            timeline.appendChild(indicator);
            
            container.appendChild(timeline);
            return {
                timeline,
                indicator,
                points: timeline.querySelectorAll('.timeline-point')
            };
        },
        update: function(progress, elements) {
            const width = elements.timeline.offsetWidth - 20;
            const position = (width * progress / 100) + 10;
            elements.indicator.style.left = `${position}px`;
            
            // Update active points
            elements.points.forEach((point, index) => {
                const pointPosition = 10 + (width * index / (elements.points.length - 1));
                if (position >= pointPosition) {
                    point.style.backgroundColor = '#0f4c81';
                    point.querySelector('.timeline-label').style.fontWeight = 'bold';
                    point.querySelector('.timeline-label').style.color = '#0f4c81';
                } else {
                    point.style.backgroundColor = '#ddd';
                    point.querySelector('.timeline-label').style.fontWeight = 'normal';
                    point.querySelector('.timeline-label').style.color = '#777';
                }
            });
        }
    },
    {
        name: "Document Journey",
        init: function(container) {
            // Create a container for the journey visualization
            const journeyContainer = document.createElement('div');
            journeyContainer.className = 'journey-container';
            journeyContainer.style.position = 'relative';
            journeyContainer.style.height = '80px';
            journeyContainer.style.margin = '15px 0';
            journeyContainer.style.overflow = 'hidden';
            
            // Create the path/road
            const path = document.createElement('div');
            path.className = 'journey-path';
            path.style.position = 'absolute';
            path.style.height = '10px';
            path.style.bottom = '20px';
            path.style.left = '0';
            path.style.right = '0';
            path.style.backgroundColor = '#e0e0e0';
            path.style.borderRadius = '5px';
            
            // Create document icon
            const docIcon = document.createElement('div');
            docIcon.className = 'document-icon';
            docIcon.innerHTML = '📄';
            docIcon.style.position = 'absolute';
            docIcon.style.fontSize = '1.8rem';
            docIcon.style.bottom = '25px';
            docIcon.style.left = '0%';
            docIcon.style.transition = 'left 0.5s ease-in-out';
            
            // Create stations along the journey
            const stations = [
                { position: 25, icon: '📥', label: 'Upload' },
                { position: 50, icon: '🔍', label: 'Analyze' },
                { position: 75, icon: '⚖️', label: 'Verify' },
                { position: 95, icon: '🏁', label: 'Complete' }
            ];
            
            stations.forEach(station => {
                const stationEl = document.createElement('div');
                stationEl.className = 'journey-station';
                stationEl.innerHTML = station.icon;
                stationEl.style.position = 'absolute';
                stationEl.style.fontSize = '1.5rem';
                stationEl.style.bottom = '30px';
                stationEl.style.left = `${station.position}%`;
                stationEl.style.transform = 'translateX(-50%)';
                stationEl.style.opacity = '0.5';
                
                const label = document.createElement('div');
                label.className = 'station-label';
                label.textContent = station.label;
                label.style.position = 'absolute';
                label.style.fontSize = '0.7rem';
                label.style.bottom = '10px';
                label.style.left = '50%';
                label.style.transform = 'translateX(-50%)';
                label.style.color = '#777';
                
                stationEl.appendChild(label);
                journeyContainer.appendChild(stationEl);
            });
            
            // Add message bubble above document
            const messageBubble = document.createElement('div');
            messageBubble.className = 'doc-message';
            messageBubble.innerHTML = 'Starting the journey!';
            messageBubble.style.position = 'absolute';
            messageBubble.style.bottom = '60px';
            messageBubble.style.left = '0%';
            messageBubble.style.transform = 'translateX(-50%)';
            messageBubble.style.backgroundColor = '#fff';
            messageBubble.style.border = '1px solid #ddd';
            messageBubble.style.borderRadius = '10px';
            messageBubble.style.padding = '5px 10px';
            messageBubble.style.fontSize = '0.8rem';
            messageBubble.style.maxWidth = '120px';
            messageBubble.style.textAlign = 'center';
            messageBubble.style.transition = 'left 0.5s ease-in-out';
            
            journeyContainer.appendChild(path);
            journeyContainer.appendChild(docIcon);
            journeyContainer.appendChild(messageBubble);
            container.appendChild(journeyContainer);
            
            return {
                docIcon,
                messageBubble,
                stations: journeyContainer.querySelectorAll('.journey-station')
            };
        },
        update: function(progress, elements) {
            // Move document icon along the path
            elements.docIcon.style.left = `${progress}%`;
            elements.messageBubble.style.left = `${progress}%`;
            
            // Update message based on progress
            if (progress < 25) {
                elements.messageBubble.innerHTML = 'Beginning verification...';
            } else if (progress < 50) {
                elements.messageBubble.innerHTML = 'Document uploaded! Analyzing now...';
            } else if (progress < 75) {
                elements.messageBubble.innerHTML = 'Looking good so far!';
            } else {
                elements.messageBubble.innerHTML = 'Almost at the finish line!';
            }
            
            // Highlight stations as we pass them
            elements.stations.forEach((station, index) => {
                const stationPosition = [25, 50, 75, 95][index];
                if (progress >= stationPosition) {
                    station.style.opacity = '1';
                    station.style.animation = 'pulse 0.5s ease';
                    setTimeout(() => {
                        station.style.animation = '';
                    }, 500);
                } else {
                    station.style.opacity = '0.5';
                }
            });
            
            // Add bounce animation to document when passing stations
            if (progress > 0 && (
                (progress >= 25 && progress < 27) || 
                (progress >= 50 && progress < 52) || 
                (progress >= 75 && progress < 77) || 
                (progress >= 95 && progress < 97)
            )) {
                elements.docIcon.style.animation = 'bounce 0.5s ease';
                setTimeout(() => {
                    elements.docIcon.style.animation = '';
                }, 500);
            }
        }
    }
];

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
    progressBar.style.width = '0%';
    progressStatus.textContent = 'Starting verification...';
    
    // Start animated progress simulation
    simulateProgressWithAnimation();
    uploadFile();
}

function simulateProgressWithAnimation() {
    let progress = 0;
    
    // Select a random progress bar theme
    const randomTheme = progressBarThemes[Math.floor(Math.random() * progressBarThemes.length)];
    console.log(`Using progress theme: ${randomTheme.name}`);
    
    // Initialize the theme elements
    const themeElements = randomTheme.init(progressContainer);
    
    // Show which theme we're using
    progressStatus.textContent = `${randomTheme.name}: Starting verification...`;
    
    // Define standard phases
    const phaseBreakpoints = [
        { threshold: 25, message: 'Uploading document...' },
        { threshold: 50, message: 'Analyzing document...' },
        { threshold: 75, message: 'Verifying authenticity...' },
        { threshold: 95, message: 'Finalizing verification...' }
    ];
    
    // Smoother animation with smaller increments
    const interval = setInterval(() => {
        // Increment by smaller random amounts for smoother animation
        progress += Math.random() * 0.8;
        
        // Ensure progress doesn't exceed 95% during simulation
        if (progress > 95) progress = 95;
        
        // Update progress bar width with transition
        progressBar.style.width = `${progress}%`;
        
        // Update status message based on progress phase
        for (let i = phaseBreakpoints.length - 1; i >= 0; i--) {
            if (progress >= phaseBreakpoints[i].threshold) {
                progressStatus.textContent = `${randomTheme.name}: ${phaseBreakpoints[i].message}`;
                break;
            }
        }
        
        // Update theme elements
        randomTheme.update(progress, themeElements);
        
        // Store interval ID in a global variable to clear it later
        window.progressInterval = interval;
        window.activeTheme = randomTheme;
        window.themeElements = themeElements;
    }, 250); // Faster updates for smoother animation
}


function getStatusMessage(progress) {
    if (progress < 40) return 'Uploading document...';
    if (progress < 70) return 'Analyzing document...';
    if (progress < 90) return 'Verifying authenticity...';
    return 'Finalizing verification...';
}

function completeProgressAnimation() {
    // Clear interval
    clearInterval(window.progressInterval);
    
    // Clean up any theme-specific resources
    if (window.activeTheme && window.activeTheme.cleanup) {
        window.activeTheme.cleanup(window.themeElements);
    }
    
    // Complete the progress bar animation
    progressBar.style.width = '100%';
    progressStatus.textContent = `${window.activeTheme?.name || ''}: Verification complete!`;
    
    // Reset any transformations
    progressBar.style.transform = 'scaleY(1)';
    
    // Add celebration animation
    const celebration = document.createElement('div');
    celebration.className = 'verification-celebration';
    celebration.style.position = 'absolute';
    celebration.style.top = '0';
    celebration.style.left = '0';
    celebration.style.right = '0';
    celebration.style.bottom = '0';
    celebration.style.display = 'flex';
    celebration.style.justifyContent = 'center';
    celebration.style.alignItems = 'center';
    celebration.style.pointerEvents = 'none';
    celebration.style.zIndex = '100';
    
    // Add confetti and completion message
    celebration.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 10px;">🎉 🎊 🎈</div>
            <div style="font-size: 1.2rem; font-weight: bold; color: #0f4c81;">Verification Complete!</div>
        </div>
    `;
    
    progressContainer.appendChild(celebration);
    
    // Create confetti
    createConfetti(progressContainer);
    
    // Remove celebration after 2 seconds
    setTimeout(() => {
        celebration.remove();
    }, 2000);
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
        console.log("Survey number from data:", data.details?.surveyNumber);
        console.log("Full details object:", JSON.stringify(data.details, null, 2));
        
        // Use the new function to complete the animation
        completeProgressAnimation();
        
        // Add a slight delay to show the completed progress bar before showing results
        setTimeout(() => {
            // Update step indicator
            updateStep(3);
            
            // Display result button
            progressContainer.style.display = 'none';
            
            // Show view result button
            const resultBtn = getElement('resultBtn');
            if (resultBtn) {
                resultBtn.style.display = 'block';
                resultBtn.addEventListener('click', () => showDetailedResults(data, ownerNameInput.value));
            } else {
                // If button doesn't exist, show results directly
                showDetailedResults(data, ownerNameInput.value);
            }
        }, 500);
    })
    .catch(error => {
        console.error("Error:", error);
        completeProgressAnimation(); // Use new function here too
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

function showDetailedResults(data, ownerName) {
    // Log the full response for debugging
    console.log('Full response:', JSON.stringify(data, null, 2));

    // Check both API success and verification result
    const isSuccess = data.success && data.verified;
    const statusMessage = data.message || (isSuccess ? 'Document verified successfully' : 'Document verification failed');

    // Create result container if it doesn't exist
    let resultContainer = document.querySelector('.result-container');
    if (!resultContainer) {
        resultContainer = document.createElement('div');
        resultContainer.className = 'result-container';
        document.querySelector('.verification-container').appendChild(resultContainer);
    }

    // Add celebration effect if successful
    if (isSuccess) {
        createConfetti(resultContainer, 50);
    }

    // Populate result container with enhanced emojis
    resultContainer.innerHTML = `
    <div style="text-align:center; padding:20px; border-radius:12px; margin-bottom:20px; color:white; font-family:'Segoe UI', sans-serif; box-shadow:0 4px 10px rgba(0,0,0,0.1); background-color:${isSuccess ? '#4CAF50' : '#f44336'}">
        <div style="font-size:3rem; margin-bottom:10px;">${isSuccess ? '🎉' : '❌'}</div>
        <h3 style="margin:0 0 10px; font-size:1.8rem;">${isSuccess ? 'Verification Successful' : 'Verification Failed'}</h3>
        <p style="font-size:1rem;">${statusMessage}</p>
    </div>
    
    <div style="background:#f9f9f9; padding:20px; border-radius:12px; box-shadow:0 4px 8px rgba(0,0,0,0.05); font-family:'Segoe UI', sans-serif;">
        <div style="margin-bottom:15px;">
            <h4 style="margin:0 0 5px; font-size:1.2rem; color:#333;">📑 Survey Number</h4>
            <p style="margin:0; color:#555; font-size:1rem;">${data.details?.surveyNumber?.extracted || data.details?.surveyNumber || 'N/A'}</p>
        </div>
        
        <div style="margin-bottom:15px;">
            <h4 style="margin:0 0 5px; font-size:1.2rem; color:#333;">👤 Owner Information</h4>
            <p style="margin:0; color:#555; font-size:1rem;"><strong>Database Record:</strong> ${data.details?.ownerName?.database || 'N/A'}</p>
            ${data.details?.ownerName?.extracted && data.details?.ownerName?.extracted !== 'Not extracted' ? 
                `<p style="margin:0; color:#555; font-size:1rem;"><strong>Extracted from Document:</strong> ${data.details?.ownerName?.extracted}</p>` 
                : ''}
            <p style="margin:0; color:#555; font-size:1rem;"><strong>Owner Name:</strong> ${data.details?.ownerName?.input || ownerName || 'N/A'}</p>
        </div>
    </div>

    <div style="display:flex; justify-content:center; gap:15px; margin-top:25px;">
        <button onclick="cancelVerification()" style="padding:10px 20px; border:none; border-radius:8px; font-size:1rem; font-weight:600; cursor:pointer; background-color:#ff5f57; color:white; transition:background-color 0.3s ease;">❌ Cancel</button>
        <button onclick="uploadAnother()" style="padding:10px 20px; border:none; border-radius:8px; font-size:1rem; font-weight:600; cursor:pointer; background-color:#007bff; color:white; transition:background-color 0.3s ease;">📤 Upload Another Document</button>
    </div>
`;

//<div style="margin-bottom:15px;">
        //     <h4 style="margin:0 0 5px; font-size:1.2rem; color:#333;">📏 Land Area</h4>
        //     <p style="margin:0; color:#555; font-size:1rem;">${data.details?.landArea || 'N/A'}</p>
        // </div>
    // Hide the result button once results are displayed
    const resultBtn = getElement('resultBtn');
    if (resultBtn) resultBtn.style.display = 'none';
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

// Add a function to create random dots for confetti effect
function createConfetti(container, count = 50) {
    const colors = ['#FF4136', '#0074D9', '#2ECC40', '#FFDC00', '#B10DC9', '#FF851B'];
    
    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.position = 'absolute';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = `-10px`;
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.opacity = Math.random() * 0.8 + 0.2;
        
        // Animation properties
        confetti.style.animation = `
            fall ${Math.random() * 3 + 2}s linear forwards,
            sway ${Math.random() * 2 + 1}s ease-in-out infinite alternate
        `;
        
        container.appendChild(confetti);
        
        // Remove after animation completes
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

// Add these animation keyframes to the document
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fall {
            to { transform: translateY(400px) rotate(960deg); opacity: 0; }
        }
        @keyframes sway {
            from { transform: translateX(-25px); }
            to { transform: translateX(25px); }
        }
    `;
    document.head.appendChild(style);
    
    // Initialize upload after adding styles
    initializeUpload();
});