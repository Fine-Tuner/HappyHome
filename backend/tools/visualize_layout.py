import argparse
import asyncio
import os

import fitz

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
    os.makedirs(args.output_dir, exist_ok=True)

    engine = get_mongodb_engine()

    if args.announcement_id:
        # Process single announcement
        try:
            ann_id = args.announcement_id
        except ValueError:
            raise ValueError(f"Invalid announcement ID: {args.announcement_id}")

        ann = await crud_announcement.get(engine, {"announcement_id": ann_id})
        if ann is None:
            raise ValueError(f"Announcement {ann_id} not found")

        output_path = os.path.join(args.output_dir, f"{ann_id}.pdf")
        print(f"Processing announcement {ann_id} -> {output_path}")

        try:
            blocks = await crud_block.get_many(engine, {"announcement_id": ann.id})
            if not blocks:
                print(
                    f"Warning: No blocks found for announcement {ann_id}. Skipping visualization."
                )
                return  # Exit if no blocks for single announcement

            doc = fitz.open(ann.file_path)
            visualize_layout(
                doc,
                blocks,
                output_path=output_path,
                inplace=True,
            )
            doc.close()  # Close the document after use
            print(f"Successfully visualized {ann_id}")
        except FileNotFoundError:
            print(f"Error: File not found for announcement {ann_id} at {ann.file_path}")
        except Exception as e:
            print(f"Error processing announcement {ann_id}: {e}")

    elif args.all:
        # Process all announcements
        print("Processing all announcements for layout visualization...")
        all_anns = await crud_announcement.get_many(engine, {})
        processed_count = 0
        skipped_count = 0
        error_count = 0

        for ann in all_anns:
            output_path = os.path.join(args.output_dir, f"{ann.id}.pdf")

            if os.path.exists(output_path):
                skipped_count += 1
                continue

            print(f"Processing announcement {ann.id} -> {output_path}")
            try:
                if not ann.file_path or not os.path.exists(ann.file_path):
                    print(
                        f"Warning: File path not found or invalid for announcement {ann.id}. Skipping."
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

                doc = fitz.open(ann.file_path)
                visualize_layout(
                    doc,
                    blocks,
                    output_path=output_path,
                    inplace=True,
                )
                doc.close()  # Close the document after use
                print(f"Successfully visualized {ann.id}")
                processed_count += 1
            except FileNotFoundError:
                print(
                    f"Error: File not found for announcement {ann.id} at {ann.file_path}"
                )
                error_count += 1
            except Exception as e:
                print(f"Error processing announcement {ann.id}: {e}")
                error_count += 1

        print("--- Layout Visualization Summary ---")
        print(f"Total announcements found: {len(all_anns)}")
        print(f"Successfully processed: {processed_count}")
        print(f"Skipped (already processed): {skipped_count}")
        print(f"Errors/Warnings: {error_count}")


if __name__ == "__main__":
    asyncio.run(main())
