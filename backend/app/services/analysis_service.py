from typing import Any

from app.pdf_analysis.analyzer import AnalysisResult
from app.pdf_analysis.analyzer import analyze_pdf as default_analyze_pdf
from app.pdf_analysis.parsers import parse_openai_content_as_json
from app.pdf_analysis.strategies.base import PDFAnalysisStrategy
from app.schemas.announcement_analysis import AnnouncementAnalysisCreate


async def perform_analysis_logic(
    announcement_id: str,
    model: str,
    db_engine: Any,
    analysis_strategy: PDFAnalysisStrategy,
    crud_announcement: Any,
    crud_analysis: Any,
    analyze_pdf_func: callable = default_analyze_pdf,
) -> None:
    """Core logic for analyzing an announcement."""
    # Use injected crud_announcement with the injected db_engine
    ann = await crud_announcement.get(db_engine, {"_id": announcement_id})
    if ann is None:
        print(f"Announcement with id {announcement_id} not found for model {model}")
        return

    # It's assumed ann has 'id' and 'file_path' attributes
    print(f"Analyzing announcement {ann.id} with model: {model}")

    # Use the injected analysis function instead of the imported one directly
    analysis_result: AnalysisResult = analyze_pdf_func(
        ann.file_path, analysis_strategy, model=model
    )

    if analysis_result.status == "success":
        parsed_result = parse_openai_content_as_json(
            analysis_result.response.choices[0].message.content
        )
        if parsed_result is not None:
            return await crud_analysis.create(
                db_engine,
                AnnouncementAnalysisCreate(
                    announcement_type=analysis_result.announcement_type,
                    announcement_id=ann.id,
                    model=analysis_result.response.model,
                    prompt=analysis_strategy.prompt,  # Access prompt from strategy
                    content=parsed_result,
                    raw_response=analysis_result.response.model_dump(),
                ),
            )
        else:
            print(f"Failed to parse analysis result for announcement {ann.id}")
            return None
    else:
        print(
            f"Analysis failed for announcement {ann.id}: {analysis_result.error_message}"
        )
        return None
