import argparse
import asyncio
import sys
from pathlib import Path

import fitz

from app.core.config import settings
from app.core.db import get_mongodb_engine
from app.crud import crud_announcement, crud_block
from app.pdf_analysis.visualization.layout import visualize_layout


def parse_args():
    parser = argparse.ArgumentParser(
        description="Visualize layout analysis results for housing announcements."
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./layout_parsing_result",
        help="The output directory",
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--announcement_id", type=str, help="The announcement ID to visualize"
    )
    group.add_argument("--all", action="store_true", help="Process all announcements")
    return parser.parse_args()


async def main():
    args = parse_args()
    engine = None  # Initialize engine
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        engine = get_mongodb_engine()
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        sys.exit(1)

    if args.announcement_id:
        # Process single announcement
        ann_id = args.announcement_id  # Assume valid ID from argparse
        ann = None
        blocks = []
        doc = None
        pdf_path = None

        try:
            ann = await crud_announcement.get(engine, {"announcement_id": ann_id})
            if ann is None:
                print(
                    f"Error: Announcement {ann_id} not found in the database.",
                )
                return
            if not ann.filename:
                print(
                    f"Error: Announcement {ann_id} has no associated filename.",
                )
                return

            output_path = output_dir / ann.filename
            print(f"Processing announcement {ann_id} -> {output_path}")

            pdf_path = settings.MYHOME_DATA_DIR / ann.filename
            # Check if file exists before trying to fetch blocks or open
            if not pdf_path.exists():
                print(f"Error: File not found for announcement {ann_id} at {pdf_path}")
                return  # Exit if PDF doesn't exist

            blocks = await crud_block.get_many(engine, {"announcement_id": ann.id})
            if not blocks:
                print(
                    f"Warning: No blocks found for announcement {ann_id}. Cannot visualize layout."
                )
                return  # Exit if no blocks for single announcement

            doc = fitz.open(pdf_path)
            visualize_layout(
                doc,
                blocks,
                output_path=output_path,
                inplace=True,
            )
            print(f"Successfully visualized {ann_id}")
        except (
            Exception
        ) as e:  # Catch other potential errors (DB, visualization function etc.)
            print(f"Error processing announcement {ann_id}: {e}")
        finally:
            if doc:
                doc.close()

    elif args.all:
        # Process all announcements
        print("Processing all announcements for layout visualization...")
        all_anns = []
        try:
            all_anns = await crud_announcement.get_many(engine, {})
        except Exception as e:
            print(f"Error retrieving announcements from database: {e}")
            sys.exit(1)

        processed_count = 0
        skipped_count = 0
        error_count = 0

        for ann in all_anns:
            doc = None  # Initialize doc to None for each iteration
            pdf_path = None
            output_path = None

            try:
                if not ann.filename:
                    print(
                        f"Warning: Announcement {ann.id} has no associated filename. Skipping."
                    )
                    error_count += 1
                    continue

                output_path = output_dir / ann.filename
                pdf_path = settings.MYHOME_DATA_DIR / ann.filename

                if output_path.exists():
                    skipped_count += 1
                    continue

                print(f"Processing announcement {ann.id} -> {output_path}")

                # Check if file exists before trying to fetch blocks or open
                if not pdf_path.exists():
                    print(
                        f"Warning: File not found for announcement {ann.id} at {pdf_path}. Skipping."
                    )
                    error_count += 1
                    continue

                blocks = await crud_block.get_many(engine, {"announcement_id": ann.id})
                if not blocks:
                    print(
                        f"Warning: No blocks found for announcement {ann.id}. Skipping visualization."
                    )
                    error_count += 1
                    continue

                doc = fitz.open(pdf_path)  # Should exist based on check above
                visualize_layout(
                    doc,
                    blocks,
                    output_path=output_path,
                    inplace=True,
                )
                print(f"Successfully visualized {ann.id}")
                processed_count += 1
            except Exception as e:  # Catch other potential errors
                print(f"Error processing announcemet {ann.id}: {e}")
                error_count += 1
            finally:
                if doc:
                    doc.close()  # Ensure doc is closed even if visualization fails

        print("--- Layout Visualization Summary ---")  # Added newline
        print(f"Total announcements found: {len(all_anns)}")
        print(f"Successfully processed: {processed_count}")
        print(f"Skipped (already exists or missing filename): {skipped_count}")
        print(f"Errors/Warnings: {error_count}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"An unexpected error occurred during execution: {e}", file=sys.stderr)
        sys.exit(1)
