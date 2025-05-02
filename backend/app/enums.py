from enum import Enum, IntEnum


# https://art049.github.io/odmantic/fields/#enum-fields
class AnnouncementType(str, Enum):
    PUBLIC_LEASE = "public_lease"
    PUBLIC_SALE = "public_sale"


# https://github.com/opendatalab/DocLayout-YOLO/issues/7
ID_TO_NAMES = {
    0: "title",
    1: "plain_text",
    2: "abandon",
    3: "figure",
    4: "figure_caption",
    5: "table",
    6: "table_caption",
    7: "table_footnote",
    8: "isolate_formula",
    9: "formula_caption",
}


class BlockType(IntEnum):
    TITLE = 0
    PLAIN_TEXT = 1
    ABANDON = 2
    FIGURE = 3
    FIGURE_CAPTION = 4
    TABLE = 5
    TABLE_CAPTION = 6
    TABLE_FOOTNOTE = 7
    ISOLATE_FORMULA = 8
    FORMULA_CAPTION = 9

    @classmethod
    def from_id(cls, type_id: int) -> "BlockType":
        return cls(type_id)

    def to_name(self) -> str:
        return ID_TO_NAMES.get(self.value, "unknown")
