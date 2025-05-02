from doclayout_yolo import YOLOv10
from huggingface_hub import hf_hub_download

from app.enums import BlockType
from app.schemas.block import Block


def get_layout_model_path() -> str:
    """Downloads and returns the path to the layout model weights."""
    return hf_hub_download(
        repo_id="juliozhao/DocLayout-YOLO-DocStructBench",
        filename="doclayout_yolo_docstructbench_imgsz1024.pt",
    )


def parse_layout_from_image(image, page_num: int, model: YOLOv10) -> list[Block]:
    """Parses layout blocks from an image using a pre-initialized YOLOv10 model."""
    det_res = model.predict(image)
    boxes = det_res[0].boxes
    blocks = []
    for box in boxes:
        bbox = box.xyxyn[0].tolist()
        confidence = box.conf[0].item()
        type_id = int(box.cls[0].item())
        block = Block(
            type=BlockType.from_id(type_id),
            page=page_num,
            bbox=bbox,
            confidence=confidence,
            model=model._get_name(),
        )
        blocks.append(block)
    return blocks
