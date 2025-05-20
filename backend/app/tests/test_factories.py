from typing import Any

from odmantic import AIOEngine

from app.crud import crud_announcement, crud_category, crud_condition
from app.enums import AnnouncementType
from app.models.announcement import Announcement
from app.models.category import Category
from app.models.condition import Condition
from app.schemas.announcement import AnnouncementCreate
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.schemas.condition import ConditionCreate, ConditionUpdate


class TestDataFactory:
    def __init__(self, engine: AIOEngine):
        self.engine = engine

    async def delete_announcement(self, announcement_id: str) -> None:
        return await crud_announcement.delete(
            self.engine, Announcement.id == announcement_id
        )

    async def create_announcement(
        self,
        housing_data: dict[str, Any],
        filename: str = "test.pdf",
        announcement_type: AnnouncementType = AnnouncementType.PUBLIC_LEASE,
    ) -> Announcement:
        """Create a test announcement."""
        announcement_in = AnnouncementCreate(
            **housing_data,
            filename=filename,
            type=announcement_type,
        )
        return await crud_announcement.create(self.engine, announcement_in)

    async def increment_announcement_view_count(
        self, announcement_id: str, times: int = 1
    ) -> Announcement | None:
        """Increment the view_count of an announcement."""
        announcement = await crud_announcement.get(
            self.engine, Announcement.id == announcement_id
        )
        if announcement:
            announcement.view_count += times
            await self.engine.save(announcement)
        return announcement

    async def get_category(self, id: str) -> Category | None:
        """Get a test category by its ID."""
        return await crud_category.get(self.engine, Category.id == id)

    async def create_category(
        self,
        category_in: CategoryCreate,
    ) -> Category:
        """Create a test category."""
        return await crud_category.create(self.engine, category_in)

    async def update_category(
        self,
        id: str,
        update_data: CategoryUpdate,
    ) -> Category | None:
        """Update a test category."""
        category = await crud_category.get(self.engine, Category.id == id)
        if category:
            return await crud_category.update(self.engine, category, update_data)
        return None

    async def delete_category(self, category_id: str) -> None:
        """Delete a test category."""
        return await crud_category.delete(self.engine, Category.id == category_id)

    async def delete_many_categories(self, announcement_id: str) -> None:
        """Delete all test categories for an announcement."""
        return await crud_category.delete_many(
            self.engine, Category.announcement_id == announcement_id
        )

    async def delete_condition(self, id: str) -> None:
        """Delete a test condition."""
        return await crud_condition.delete(self.engine, Condition.id == id)

    async def delete_many_conditions(self, announcement_id: str) -> int:
        """Soft delete all test conditions for an announcement. Returns count of deleted items."""
        return await crud_condition.delete_many(
            self.engine, Condition.announcement_id == announcement_id
        )

    async def create_condition(
        self,
        condition_in: ConditionCreate,
    ) -> Condition:
        """Create a test condition using a ConditionCreate schema."""
        return await crud_condition.create(self.engine, condition_in)

    async def get_condition(self, id: str) -> Condition | None:
        """Retrieve a condition by its ID."""
        return await crud_condition.get(self.engine, Condition.id == id)

    async def update_condition(
        self, id: str, update_data: ConditionUpdate
    ) -> Condition | None:
        """Update a condition by its ID with ConditionUpdate schema."""
        condition = await crud_condition.get(self.engine, Condition.id == id)
        if condition:
            return await crud_condition.update(self.engine, condition, update_data)
        return None
