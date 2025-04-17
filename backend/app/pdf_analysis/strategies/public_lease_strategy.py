import json
from typing import Any

from app.core.openai_client import get_openai_client
from app.pdf_analysis.strategy import PDFAnalysisStrategy
from app.pdf_analysis.prompts import PUBLIC_LEASE_PROMPT
from app.pdf_analysis.utils import pdf_to_base64_image_strings


class PublicLeaseAnalysisStrategy(PDFAnalysisStrategy):
    """
    Analysis strategy for public lease announcements using image-based analysis.
    """

    def analyze(self, pdf_path: str, model: str = "gpt-4.1-mini") -> str:
        """
        Analyzes a public lease announcement PDF.

        Args:
            pdf_path: Path to the PDF file.
            model: The OpenAI model to use (e.g., 'gpt-4.1-mini').

        Returns:
            The analysis result as a JSON string.
        """
        openai_client = get_openai_client()
        prompt = PUBLIC_LEASE_PROMPT
        img_base64_list = pdf_to_base64_image_strings(pdf_path)

        images = [
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{img_base64}"},
            }
            for img_base64 in img_base64_list
        ]

        try:
            response = openai_client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [{"type": "text", "text": prompt}, *images],
                    },
                ],
            )
            if response.choices:
                return response.choices[0].message.content or ""
            else:
                return '{"error": "No response from analysis model."}'
        except Exception as e:
            print(f"Error calling OpenAI API: {e}")
            return f'{{"error": "Failed to analyze document: {e}"}}'

    def parse_response(self, response: str) -> Any:
        if response.startswith("```json"):
            response = response[7:-4]
        response = response.replace("\n", "")
        return json.loads(response)
