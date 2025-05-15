import logging

import fitz

from app.models.condition import Condition


def visualize_llm_analysis_result(
    doc: fitz.Document,
    conditions: list[Condition],
    category_map: dict[str, str],
    panel_width: float = 200,
    margin: float = 10,
    fontname: str = "ko",
    fontfile: str | None = None,
    output_path: str | None = None,
    max_retries: int = 10,
    width_increment: float = 50,
) -> fitz.Document:
    new_doc = fitz.open()

    for page in doc:
        page_number = page.number + 1
        old_rect = page.rect
        new_height = old_rect.height

        # collect condition texts
        page_conditions = [c for c in conditions if c.page == page_number]
        condition_texts = []
        for i, cond in enumerate(page_conditions, start=1):
            cat = category_map.get(cond.category_id, "Unknown Category")
            txt = (
                f"--- Condition {i} ---\n"
                f"Category: {cat}\n"
                f"Section: {cond.section}\n"
                f"Content: {cond.content}"
            )
            condition_texts.append(txt)

        current_panel_width = panel_width
        page_to_retry = None

        for attempt in range(max_retries + 1):
            new_width = old_rect.width + current_panel_width

            if attempt == 0:
                # first try: create a fresh page
                page_to_retry = new_doc.new_page(width=new_width, height=new_height)
            else:
                # clear any existing drawing/content, then resize MediaBox
                page_to_retry.set_mediabox(fitz.Rect(0, 0, new_width, new_height))
                page_to_retry.clean_contents()

            # copy original content
            try:
                page_to_retry.show_pdf_page(
                    fitz.Rect(0, 0, old_rect.width, old_rect.height), doc, page.number
                )
            except Exception as e:
                logging.warning(f"Page import failed on retry {attempt}: {e}")
                # fall back to next retry (it will increase width)

            # draw all bboxes + labels
            for idx, cond in enumerate(page_conditions, start=1):
                x0, y0, x1, y1 = [
                    coord * dim
                    for coord, dim in zip(
                        cond.bbox,
                        (
                            old_rect.width,
                            old_rect.height,
                            old_rect.width,
                            old_rect.height,
                        ),
                        strict=False,
                    )
                ]
                # clamp and skip invalid
                x0, x1 = sorted(
                    (max(0, min(x0, old_rect.width)), max(0, min(x1, old_rect.width)))
                )
                y0, y1 = sorted(
                    (max(0, min(y0, old_rect.height)), max(0, min(y1, old_rect.height)))
                )
                if x0 == x1 or y0 == y1:
                    logging.warning(f"Skipping degenerate bbox on page {page_number}")
                    continue

                rect = fitz.Rect(x0, y0, x1, y1)
                page_to_retry.draw_rect(rect, color=(1, 0, 0), width=1.5, overlay=True)

                # label
                ty = rect.y0 - 4
                if ty < margin:
                    ty = rect.y1 + 2
                page_to_retry.insert_text(
                    fitz.Point(rect.x0, ty),
                    f"Condition {idx}",
                    fontsize=10,
                    fontname=fontname,
                    fontfile=fontfile,
                    color=(1, 0, 0),
                    overlay=True,
                )

            # separator line
            page_to_retry.draw_line(
                fitz.Point(old_rect.width, margin),
                fitz.Point(old_rect.width, new_height - margin),
                width=0.5,
            )

            # insert panel text
            panel_rect = fitz.Rect(
                old_rect.width + margin, margin, new_width - margin, new_height - margin
            )
            result = page_to_retry.insert_textbox(
                panel_rect,
                condition_texts,
                fontsize=8,
                fontname=fontname,
                fontfile=fontfile,
                align=fitz.TEXT_ALIGN_LEFT,
            )

            if result >= 0:
                # success!
                break
            else:
                # failed → bump width and retry (or give up after last)
                logging.info(
                    f"Text overflow on page {page_number}, "
                    f"retry {attempt}/{max_retries} (width {current_panel_width:.0f})"
                )
                current_panel_width += width_increment

        else:
            # Ran out of retries
            logging.warning(
                f"Could not fit all text on page {page_number} "
                f"after {max_retries} retries (final width {current_panel_width:.0f})"
            )

    if output_path:
        logging.info(f"Saving annotated PDF to {output_path!r}")
        new_doc.save(output_path)
    return new_doc
