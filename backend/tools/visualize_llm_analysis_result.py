import argparse
import asyncio
import sys  # Import sys for exiting
from pathlib import Path

import fitz

from app.core.config import settings
from app.core.db import get_mongodb_engine
from app.crud import crud_announcement, crud_condition
from app.models.announcement import Announcement
from app.models.condition import Condition
from app.pdf_analysis.visualization.llm_analysis_result import (
    visualize_llm_analysis_result,
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
        print(f"Error connecting to MongoDB: {e}")
        sys.exit(1)

    if args.announcement_id:
        # Process single announcement
        ann_id = args.announcement_id  # Assume valid ID for now, handled by argparse
        ann = None
        conditions = []
        doc = None

        try:
            ann = await crud_announcement.get(engine, Announcement.id == ann_id)
            if ann is None:
                print(f"Error: Announcement {ann_id} not found in the database.")
                return  # Exit main for this case

            if not ann.filename:
                print(f"Error: Announcement {ann_id} has no associated filename.")
                return  # Exit main for this case

            output_path = output_dir / ann.filename
            print(f"Processing announcement {ann_id} -> {output_path}")

            pdf_path = settings.MYHOME_DATA_DIR / ann.filename
            # Check if file exists before trying to fetch conditions or open
            if not pdf_path.exists():
                print(f"Error: File not found for announcement {ann_id} at {pdf_path}")
                return  # Exit main for this case

            conditions = await crud_condition.get_many(
                engine, Condition.announcement_id == ann.id
            )
            if not conditions:
                print(
                    f"Warning: No conditions found for announcement {ann.id}. Cannot visualize."
                )
                return  # Exit main for this case

            doc = fitz.open(pdf_path)
            visualize_llm_analysis_result(
                doc,
                conditions,
                output_path=output_path,
                fontname=args.fontname,
                fontfile=args.fontfile,
            )
            print(f"Successfully visualized {ann_id}")
        except (
            Exception
        ) as e:  # Catch other potential errors (DB, visualization function etc.)
            print(f"Error processing announcement {ann_id}: {e}")
        finally:
            if doc:
                doc.close()  # Ensure doc is closed even if visualization fails

    elif args.all:
        # Process all announcements
        print("Processing all announcements...")
        all_anns = []
        try:
            all_anns = await crud_announcement.get_many(engine, {})
        except Exception as e:
            print(f"Error retrieving announcements from database: {e}")
            sys.exit(1)  # Exit if we can't get the list of announcements

        processed_count = 0
        skipped_count = 0
        error_count = 0

        for ann in all_anns:
            output_path = output_dir / ann.filename
            pdf_path = settings.MYHOME_DATA_DIR / ann.filename
            doc = None  # Initialize doc to None for each iteration

            if output_path.exists():
                skipped_count += 1
                continue

            print(f"Processing announcement {ann.id} -> {output_path}")
            try:
                if not pdf_path.exists():
                    print(
                        f"Warning: File not found for announcement {ann.id} at {pdf_path}"
                    )
                    error_count += 1
                    continue

                conditions = await crud_condition.get_many(
                    engine, Condition.announcement_id == ann.id
                )
                if not conditions:
                    print(
                        f"Warning: No conditions found for announcement {ann.id}. Skipping visualization."
                    )
                    error_count += 1
                    continue

                doc = fitz.open(pdf_path)  # This raises fitz.FileNotFoundError
                visualize_llm_analysis_result(
                    doc,
                    conditions,
                    output_path=output_path,
                    fontname=args.fontname,
                    fontfile=args.fontfile,
                )
                print(f"Successfully visualized {ann.id}")
                processed_count += 1
            except Exception as e:  # Other errors (DB, visualization etc.)
                print(f"Error processing announcement {ann.id}: {e}")
                error_count += 1
            finally:
                if doc:
                    doc.close()  # Ensure doc is closed even if visualization fails within the loop

        print("--- Summary ---")  # Added newline for better separation
        print(f"Total announcements found: {len(all_anns)}")
        print(f"Successfully processed: {processed_count}")
        print(f"Skipped (already exists): {skipped_count}")
        print(f"Errors/Warnings: {error_count}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)
