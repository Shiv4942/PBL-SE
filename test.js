const apiKey = 'YOUR_SIDER_AI_API_KEY';
const apiUrl = 'https://api.sider.ai/v1/ocr';

function extractText() {
    const imageInput = document.getElementById('imageInput');
    const file = imageInput.files[0];

    if (!file) {
        alert('Please upload an image');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('result').innerText = data.text;
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to extract text from image');
    });
}
