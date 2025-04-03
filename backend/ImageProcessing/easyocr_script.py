import sys
import easyocr

def extract_text(image_path, lang):
    try:
        # Initialize EasyOCR reader
        reader = easyocr.Reader([lang])

        # Perform OCR
        result = reader.readtext(image_path)

        # Extract text from the result
        extracted_text = "\n".join([detection[1] for detection in result])
        return extracted_text
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    # Get file path and language from command-line arguments
    file_path = sys.argv[1]
    lang = sys.argv[2]

    # Extract text and print it
    text = extract_text(file_path, lang)
    print(text)