import fitz

from app.models.condition import Condition


def visualize_llm_analysis_result(
    doc: fitz.Document,
    conditions: list[Condition],
    panel_width: float = 200,
    margin: float = 10,
    fontname: str = "ko",
    fontfile: str | None = None,
    output_path: str | None = None,
    max_retries: int = 10,
    width_increment: float = 50,
) -> fitz.Document:
    """
    Adds a side panel to the right of each page in the PDF associated
    with the LLM analysis result, populating it with provided conditions.
    If text insertion fails due to overflow, it retries up to `max_retries`
    times, incrementing the panel width by `width_increment` each time.

    Args:
        doc: The PDF document to visualize the LLM analysis result on.
        conditions: A list of Condition objects related to the analysis result.
        panel_width: The initial width (in points) of the panel to add.
        margin: The margin (in points) between the original content and the panel.
        fontname: The name of the font to use for the text.
        fontfile: The path to the font file to use for the text.
        output_path: The path to save the output PDF.
        max_retries: The maximum number of times to retry text insertion with increased width.
        width_increment: The amount (in points) to increase panel width on each retry.


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
        new_height = old_rect.height

        # Prepare text content once
        condition_texts = []
        for i, cond in enumerate(page_conditions):
            # Truncate content for display if too long
            content = cond.content
            text = (
                f"--- Condition {i + 1} ---\n"
                f"Category: {cond.category}\n"
                f"Section: {cond.section}\n"
                f"Content: {content}"
            )
            condition_texts.append(text)

        current_panel_width = panel_width
        text_insert_result = -1  # Initialize as failed

        for attempt in range(max_retries + 1):
            new_width = old_rect.width + current_panel_width
            new_page = new_doc.new_page(width=new_width, height=new_height)
            page_index = new_doc.page_count - 1  # Get index of the newly added page

            # Copy original page content
            target_rect = fitz.Rect(0, 0, old_rect.width, old_rect.height)
            new_page.show_pdf_page(target_rect, doc, page.number)

            # Draw vertical line separator
            v_line_start = fitz.Point(old_rect.width, margin)
            v_line_end = fitz.Point(old_rect.width, new_height - margin)
            new_page.draw_line(v_line_start, v_line_end, color=(0, 0, 0), width=0.5)

            # Define panel area for text insertion
            panel_rect = fitz.Rect(
                old_rect.width + margin,
                margin,
                new_width - margin,
                new_height - margin,
            )

            # Attempt text insertion
            text_insert_result = new_page.insert_textbox(
                panel_rect,
                condition_texts,
                fontsize=8,
                fontname=fontname,
                fontfile=fontfile,
                color=(0, 0, 0),
                align=fitz.TEXT_ALIGN_LEFT,
            )

            if text_insert_result >= 0:
                # Success
                break  # Exit retry loop for this page
            else:
                # Insertion failed, delete the page created in this attempt
                new_doc.delete_page(page_index)

                if attempt < max_retries:
                    # Increase width and retry
                    current_panel_width += width_increment
                else:
                    # Max retries reached, create the page one last time with max width
                    # This page will be kept, and the warning will be printed below
                    new_width = old_rect.width + current_panel_width
                    new_page = new_doc.new_page(width=new_width, height=new_height)
                    target_rect = fitz.Rect(0, 0, old_rect.width, old_rect.height)
                    new_page.show_pdf_page(target_rect, doc, page.number)
                    v_line_start = fitz.Point(old_rect.width, margin)
                    v_line_end = fitz.Point(old_rect.width, new_height - margin)
                    new_page.draw_line(
                        v_line_start, v_line_end, color=(0, 0, 0), width=0.5
                    )
                    panel_rect = fitz.Rect(
                        old_rect.width + margin,
                        margin,
                        new_width - margin,
                        new_height - margin,
                    )
                    # Insert text again (it will likely fail, giving the same error code)
                    final_text_insert_result = new_page.insert_textbox(
                        panel_rect,
                        condition_texts,
                        fontsize=8,
                        fontname=fontname,
                        fontfile=fontfile,
                        color=(0, 0, 0),
                        align=fitz.TEXT_ALIGN_LEFT,
                    )
                    print(
                        f"Warning: Text may not have fit entirely in the panel for page {page_number} "
                        f"after {max_retries} retries (final width: {current_panel_width:.2f} points). "
                        f"Code: {final_text_insert_result}"
                    )
                    # Break since this was the last attempt
                    break

    if output_path:
        print(f"Saving to {output_path}")
        new_doc.save(output_path)

    return new_doc
