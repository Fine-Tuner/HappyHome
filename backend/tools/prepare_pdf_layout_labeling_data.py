import argparse
import asyncio
from pathlib import Path

import fitz
from doclayout_yolo import YOLOv10
from motor.motor_asyncio import AsyncIOMotorClient
from odmantic import AIOEngine

from app.crud import crud_block
from app.models.block import Block
from app.pdf_analysis.layout_parsers import get_layout_model_path
from app.pdf_analysis.utils import pixmap_to_image
from app.services.layout_parsing_service import perform_layout_parsing


async def main():
    parser = argparse.ArgumentParser(
        description="Prepare PDF layout dataset by running layout parsing and storing results in a specified MongoDB database."
    )
    parser.add_argument(
        "data_dir",
        type=str,
        help="Path to the directory containing the PDFs to process.",
    )
    parser.add_argument(
        "--db_name",
        type=str,
        default="pdf_layout_labeling",
        help="Name of the MongoDB database to store labeling results (defaults to 'labeling_db').",
    )
    parser.add_argument(
        "--mongo_uri",
        type=str,
        default="mongodb://localhost:27017",
        help="MongoDB connection URI. If not provided, uses the MONGO_URI environment variable.",
    )
    parser.add_argument(
        "--file_glob",
        type=str,
        default="*.pdf",
        help="Glob pattern to match files within the data directory (defaults to '*.pdf').",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="pdf_layout_labeling",
        help="Directory to save the output images.",
    )
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    labeling_db_name = args.db_name
    mongo_uri = args.mongo_uri
    file_glob = args.file_glob
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        engine = AIOEngine(
            client=AsyncIOMotorClient(mongo_uri), database=labeling_db_name
        )
        print(f"Successfully obtained engine for database: {engine.database_name}")
    except Exception as e:
        print(f"Error connecting to labeling database '{labeling_db_name}': {e}")
        return

    model = YOLOv10(get_layout_model_path())

    print(f"Searching for files in: {data_dir} using glob pattern: '{file_glob}'")
    for pdf_path in list(data_dir.glob(file_glob))[1:]:
        ann_id = pdf_path.stem

        existing_blocks = await crud_block.get(engine, Block.announcement_id == ann_id)
        if existing_blocks:
            print(
                f"Skipping {pdf_path.name} (ann_id: {ann_id}) - analysis already exists in DB: {engine.database_name}"
            )
            continue

        print(
            f"Processing {pdf_path.name} (ann_id: {ann_id}) -> DB: {engine.database_name}"
        )
        await perform_layout_parsing(ann_id, pdf_path, engine, model, crud_block)
        print(f"Finished processing {pdf_path.name}")

        doc = fitz.open(pdf_path)
        for page in doc:
            page_number = page.number + 1
            image = pixmap_to_image(page.get_pixmap())
            image.save(output_dir / f"{ann_id}_{page_number}.png")
        break


if __name__ == "__main__":
    asyncio.run(main())
