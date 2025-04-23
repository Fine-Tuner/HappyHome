import enum


# https://art049.github.io/odmantic/fields/#enum-fields
class AnnouncementType(str, enum.Enum):
    PUBLIC_LEASE = "public_lease"
    PUBLIC_SALE = "public_sale"
