import base64
import io

from PIL import Image
import fitz


def pixmap_to_image(pixmap: fitz.Pixmap) -> Image.Image:
    return Image.open(io.BytesIO(pixmap.tobytes()))


def bytes_to_base64_string(bytes: bytes) -> str:
    return base64.b64encode(bytes).decode("utf-8")


def pdf_to_base64_image_strings(pdf_path: str) -> list[str]:
    """
    Converts a PDF file to a list of base64 encoded JPEG image bytes.

    Args:
        pdf_path: Path to the PDF file.

    Returns:
        A list of base64 encoded JPEG image bytes.
    """
    doc = fitz.open(pdf_path)
    images = []
    for page in doc:
        pixmap = page.get_pixmap()
        images.append(bytes_to_base64_string(pixmap.tobytes("png")))
    return images
