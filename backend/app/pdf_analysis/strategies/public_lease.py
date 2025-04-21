from app.core.openai_client import get_openai_client
from app.enums import AnnouncementType
from app.pdf_analysis.prompts import (
    PUBLIC_LEASE_SYSTEM_PROMPT,
    PUBLIC_LEASE_USER_PROMPT,
)
from app.pdf_analysis.schemas import AnalysisResult
from app.pdf_analysis.strategies.base import PDFAnalysisStrategy
from app.pdf_analysis.utils import pdf_to_base64_image_strings


class PublicLeaseAnalysisStrategy(PDFAnalysisStrategy):
    """
    Analysis strategy for public lease announcements using image-based analysis.
    """

    @property
    def system_prompt(self) -> str:
        return PUBLIC_LEASE_SYSTEM_PROMPT

    @property
    def user_prompt(self) -> str:
        return PUBLIC_LEASE_USER_PROMPT

    def analyze(self, pdf_path: str, model: str = "gpt-4.1-mini") -> AnalysisResult:
        """
        Analyzes a public lease announcement PDF.

        Args:
            pdf_path: Path to the PDF file.
            model: The OpenAI model to use (e.g., 'gpt-4.1-mini').

        Returns:
            An AnalysisOutput object indicating success/failure and containing data/error.
        """
        openai_client = get_openai_client()
        img_base64_list = pdf_to_base64_image_strings(pdf_path)

        images = []
        for i, img_base64 in enumerate(img_base64_list):
            page_num = i + 1
            images.append({"type": "text", "text": f"page_number: {page_num}"})
            images.append(
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{img_base64}"},
                }
            )

        try:
            response = openai_client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": self.system_prompt,
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": self.user_prompt},
                            *images,
                        ],
                    },
                ],
                temperature=0.0,
                top_p=1.0,
            )
            if response.choices and response.choices[0].message.content:
                # Success: return the raw content string in the data field
                return AnalysisResult(
                    announcement_type=AnnouncementType.PUBLIC_LEASE,
                    status="success",
                    response=response,
                )
            else:
                # Failure: No response contentdata=response.choices[0].message.content,
                return AnalysisResult(
                    status="failure",
                    error_message="No response content from analysis model.",
                    response=response,
                )
        except Exception as e:
            print(f"Error calling OpenAI API: {e}")
            # Failure: Exception during API call
            return AnalysisResult(
                status="failure",
                error_message=f"Failed to analyze document: {e}",
            )
