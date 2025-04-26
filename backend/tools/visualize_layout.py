import argparse
import asyncio
import os

import fitz

from app.core.db import get_mongodb_engine
from app.crud import crud_announcement, crud_block
from app.pdf_analysis.visualization.layout import visualize_layout


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("announcement_id", type=str, help="The announcement ID")
    parser.add_argument("output_dir", type=str, help="The output directory")
    return parser.parse_args()


async def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    engine = get_mongodb_engine()
    ann = await crud_announcement.get(
        engine, {"announcement_id": int(args.announcement_id)}
    )
    if ann is None:
        raise ValueError(f"Announcement {args.announcement_id} not found")
    blocks = await crud_block.get_many(engine, {"announcement_id": ann.id})

    doc = fitz.open(ann.file_path)
    output_path = os.path.join(args.output_dir, f"{args.announcement_id}.pdf")
    visualize_layout(
        doc,
        blocks,
        output_path=output_path,
        inplace=True,
    )


if __name__ == "__main__":
    asyncio.run(main())
