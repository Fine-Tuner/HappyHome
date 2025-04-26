import argparse
import asyncio
import os

import fitz

from app.core.db import get_mongodb_engine
from app.crud import crud_announcement, crud_condition
from app.pdf_analysis.visualization.llm_analysis_result import (
    visualize_llm_analysis_result,
)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "announcement_id", type=str, help="The announcement ID to visualize"
    )
    parser.add_argument("output_dir", type=str, help="The output directory")
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
    os.makedirs(args.output_dir, exist_ok=True)

    engine = get_mongodb_engine()
    ann = await crud_announcement.get(
        engine, {"announcement_id": int(args.announcement_id)}
    )
    if ann is None:
        raise ValueError(f"Announcement {args.announcement_id} not found")
    conditions = await crud_condition.get_many(engine, {"announcement_id": ann.id})

    doc = fitz.open(ann.file_path)
    output_path = os.path.join(args.output_dir, f"{args.announcement_id}.pdf")
    visualize_llm_analysis_result(
        doc,
        conditions,
        output_path=output_path,
        fontname=args.fontname,
        fontfile=args.fontfile,
    )


if __name__ == "__main__":
    asyncio.run(main())
