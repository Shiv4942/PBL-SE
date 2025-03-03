document.addEventListener("DOMContentLoaded", function() {
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    menuToggle.addEventListener("click", function() {
        navLinks.classList.toggle("active");
    });
});

function fetchExtractedText() {
    const filename = document.getElementById("filename").value;
    if (!filename) {
        alert("Please enter a filename.");
        return;
    }

    fetch(`http://localhost:5000/api/validate-document/${encodeURIComponent(filename)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById("file-name").textContent = data.file;
                document.getElementById("word-count").textContent = data.wordCount;
                document.getElementById("extracted-text").textContent = data.extractedText;
            } else {
                document.getElementById("extracted-text").textContent = "Error: " + data.message;
            }
        })
        .catch(error => {
            document.getElementById("extracted-text").textContent = "Failed to fetch data.";
            console.error("Error fetching text:", error);
        });
}
