import fitz

from app.models.condition import Condition


def visualize_llm_analysis_result(
    doc: fitz.Document,
    conditions: list[Condition],
    panel_width: float = 150,
    margin: float = 10,
    fontname: str = "ko",
    fontfile: str | None = None,
    output_path: str | None = None,
) -> fitz.Document:
    """
    Adds a side panel to the right of each page in the PDF associated
    with the LLM analysis result, populating it with provided conditions.

    Args:
        doc: The PDF document to visualize the LLM analysis result on.
        conditions: A list of Condition objects related to the analysis result.
        panel_width: The width (in points) of the panel to add.
        margin: The margin (in points) between the original content and the panel.
        fontname: The name of the font to use for the text.
        fontfile: The path to the font file to use for the text.
        output_path: The path to save the output PDF.

    Returns:
        A new fitz.Document with wider pages containing the original content
        and a panel on the right populated with conditions.
    """
    new_doc = fitz.open()

    for page in doc:
        page_number = page.number + 1
        page_conditions = []
        for condition in conditions:
            if page_number in condition.pages:
                page_conditions.append(condition)

        old_rect = page.rect
        new_width = old_rect.width + panel_width
        new_height = old_rect.height

        new_page = new_doc.new_page(width=new_width, height=new_height)
        target_rect = fitz.Rect(0, 0, old_rect.width, old_rect.height)
        new_page.show_pdf_page(target_rect, doc, page.number)

        v_line_start = fitz.Point(old_rect.width, margin)
        v_line_end = fitz.Point(old_rect.width, new_height - margin)
        new_page.draw_line(v_line_start, v_line_end, color=(0, 0, 0), width=0.5)

        panel_rect = fitz.Rect(
            old_rect.width + margin,
            margin,
            new_width - margin,
            new_height - margin,
        )

        condition_texts = []
        for i, cond in enumerate(page_conditions):
            content = cond.content
            if len(content) > 100:
                content += "..."
            text = (
                f"--- Condition {i + 1} ---\n"
                f"Category: {cond.category}\n"
                f"Section: {cond.section}\n"
                f"Content: {content}"
            )
            condition_texts.append(text)

        full_text = f"Page {page_number} Conditions:\n\n" + "\n\n".join(condition_texts)

        text_insert_result = new_page.insert_textbox(
            panel_rect,
            full_text,
            fontsize=8,
            fontname=fontname,
            fontfile=fontfile,
            color=(0, 0, 0),
            align=fitz.TEXT_ALIGN_LEFT,
        )
        if text_insert_result < 0:
            print(
                f"Warning: Text may not have fit entirely in the panel for page {page_number}. "
                f"Code: {text_insert_result}"
            )

    if output_path:
        new_doc.save(output_path)

    return new_doc
