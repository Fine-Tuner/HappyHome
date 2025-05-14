import argparse
import asyncio
import logging
import sys
from pathlib import Path

import fitz

from app.core.config import settings
from app.core.db import get_mongodb_engine
from app.crud import crud_announcement, crud_category, crud_condition
from app.models.announcement import Announcement
from app.models.condition import Condition
from app.pdf_analysis.visualization.llm_analysis_result import (
    visualize_llm_analysis_result,
)

# Configure logging at the module level
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(module)s - %(funcName)s - L%(lineno)d - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Visualize LLM analysis results for housing announcements."
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./llm_analysis_result",
        help="The output directory",
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--announcement_id", type=str, help="The announcement ID to visualize"
    )
    group.add_argument("--all", action="store_true", help="Process all announcements")
    parser.add_argument(
        "--fontname",
        default="ko",
        type=str,
        help="The font name to use for the text",
    )
    parser.add_argument(
        "--fontfile",
        default="./assets/NanumGothic-Regular.ttf",
        type=str,
        help="The font file to use for the text",
    )
    return parser.parse_args()


async def main():
    args = parse_args()
    engine = None  # Initialize engine to None
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        engine = get_mongodb_engine()
    except Exception as e:  # Catch potential errors during DB engine creation
        logging.exception(f"Error connecting to MongoDB: {e}")
        sys.exit(1)

    if args.announcement_id:
        # Process single announcement
        ann_id = args.announcement_id  # Assume valid ID for now, handled by argparse
        ann = None
        conditions = []
        doc = None
        category_map = {}

        try:
            ann = await crud_announcement.get(engine, Announcement.id == ann_id)
            if ann is None:
                logging.error(f"Announcement {ann_id} not found in the database.")
                return  # Exit main for this case

            if not ann.filename:
                logging.error(f"Announcement {ann_id} has no associated filename.")
                return  # Exit main for this case

            output_path = output_dir / ann.filename
            logging.info(f"Processing announcement {ann_id} -> {output_path}")

            pdf_path = settings.MYHOME_DATA_DIR / ann.filename
            # Check if file exists before trying to fetch conditions or open
            if not pdf_path.exists():
                logging.error(f"File not found for announcement {ann_id} at {pdf_path}")
                return  # Exit main for this case

            conditions = await crud_condition.get_many(
                engine, Condition.announcement_id == ann.id
            )
            if not conditions:
                logging.warning(
                    f"No conditions found for announcement {ann.id}. Cannot visualize."
                )
                return  # Exit main for this case

            # Create category_map
            category_ids = list(set(c.category_id for c in conditions))
            if category_ids:
                fetched_categories = await crud_category.get_many_by_ids(
                    engine, ids=category_ids
                )
                category_map = {cat.id: cat.name for cat in fetched_categories}
            else:
                category_map = {}

            doc = fitz.open(pdf_path)
            visualize_llm_analysis_result(
                doc,
                conditions,
                category_map,
                output_path=output_path,
                fontname=args.fontname,
                fontfile=args.fontfile,
            )
            logging.info(f"Successfully visualized {ann_id}")
        except (
            Exception
        ) as e:  # Catch other potential errors (DB, visualization function etc.)
            logging.exception(f"Error processing announcement {ann_id}: {e}")
        finally:
            if doc:
                doc.close()  # Ensure doc is closed even if visualization fails

    elif args.all:
        # Process all announcements
        logging.info("Processing all announcements...")
        all_anns = []
        try:
            all_anns = await crud_announcement.get_many(engine, {})
        except Exception as e:
            logging.exception(f"Error retrieving announcements from database: {e}")
            sys.exit(1)  # Exit if we can't get the list of announcements

        processed_count = 0
        skipped_count = 0
        error_count = 0

        for ann in all_anns:
            output_path = output_dir / ann.filename
            pdf_path = settings.MYHOME_DATA_DIR / ann.filename
            doc = None  # Initialize doc to None for each iteration
            category_map = {}

            if output_path.exists():
                skipped_count += 1
                continue

            logging.info(f"Processing announcement {ann.id} -> {output_path}")
            try:
                if not pdf_path.exists():
                    logging.warning(
                        f"File not found for announcement {ann.id} at {pdf_path}"
                    )
                    error_count += 1
                    continue

                conditions = await crud_condition.get_many(
                    engine, Condition.announcement_id == ann.id
                )
                if not conditions:
                    logging.warning(
                        f"No conditions found for announcement {ann.id}. Skipping visualization."
                    )
                    error_count += 1
                    continue

                # Create category_map
                category_ids = list(set(c.category_id for c in conditions))
                if category_ids:
                    fetched_categories = await crud_category.get_many_by_ids(
                        engine, ids=category_ids
                    )
                    if not fetched_categories and category_ids:
                        logging.warning(
                            f"Could not retrieve categories for announcement {ann.id} with IDs: {category_ids}"
                        )
                    category_map = {cat.id: cat.name for cat in fetched_categories}
                else:
                    category_map = {}

                doc = fitz.open(pdf_path)
                visualize_llm_analysis_result(
                    doc,
                    conditions,
                    category_map,
                    output_path=output_path,
                    fontname=args.fontname,
                    fontfile=args.fontfile,
                )
                logging.info(f"Successfully visualized {ann.id}")
                processed_count += 1
            except Exception as e:  # Other errors (DB, visualization etc.)
                logging.exception(f"Error processing announcement {ann.id}: {e}")
                error_count += 1
            finally:
                if doc:
                    doc.close()  # Ensure doc is closed even if visualization fails within the loop

        logging.info("--- Summary ---")  # Changed to logging.info
        logging.info(f"Total announcements found: {len(all_anns)}")
        logging.info(f"Successfully processed: {processed_count}")
        logging.info(f"Skipped (already exists): {skipped_count}")
        logging.info(f"Errors/Warnings: {error_count}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        logging.exception(f"An unexpected error occurred: {e}")
        sys.exit(1)
