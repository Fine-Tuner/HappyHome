import base64
import io

import fitz
from PIL import Image


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


def pil_image_to_base64(img: Image.Image, img_format: str = "PNG") -> str:
    """
    Convert a PIL Image to a Base64-encoded string.

    :param img: PIL Image object
    :param img_format: Format to use when saving (e.g., "PNG", "JPEG")
    :return: Base64 string (no prefix)
    """
    buffered = io.BytesIO()
    img.save(buffered, format=img_format)
    img_bytes = buffered.getvalue()
    return bytes_to_base64_string(img_bytes)
