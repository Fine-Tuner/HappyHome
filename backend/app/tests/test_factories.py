from typing import Any

from odmantic import AIOEngine

from app.crud import (
    crud_announcement,
    crud_category,
    crud_condition,
    crud_user_category,
    crud_user_condition,
)
from app.enums import AnnouncementType
from app.models.announcement import Announcement
from app.models.category import Category
from app.models.condition import Condition
from app.models.user_category import UserCategory
from app.models.user_condition import UserCondition
from app.schemas.announcement import AnnouncementCreate
from app.schemas.category import CategoryCreate
from app.schemas.condition import ConditionCreate
from app.schemas.user_category import UserCategoryCreate, UserCategoryUpdate
from app.schemas.user_condition import UserConditionCreate, UserConditionUpdate


class TestDataFactory:
    def __init__(self, engine: AIOEngine):
        self.engine = engine

    async def get_user_condition(self, user_condition_id: str) -> UserCondition:
        return await crud_user_condition.get(
            self.engine, UserCondition.id == user_condition_id
        )

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

    async def create_category(
        self,
        announcement_id: str,
        name: str,
    ) -> Category:
        """Create a test category."""
        category_in = CategoryCreate(
            announcement_id=announcement_id,
            name=name,
        )
        return await crud_category.create(self.engine, category_in)

    async def delete_category(self, category_id: str) -> None:
        """Delete a test category."""
        return await crud_category.delete(self.engine, Category.id == category_id)

    async def delete_many_categories(self, announcement_id: str) -> None:
        """Delete all test categories for an announcement."""
        return await crud_category.delete_many(
            self.engine, Category.announcement_id == announcement_id
        )

    async def delete_condition(self, condition_id: str) -> None:
        """Delete a test condition."""
        return await crud_condition.delete(self.engine, Condition.id == condition_id)

    async def delete_many_conditions(self, announcement_id: str) -> None:
        """Delete all test conditions for an announcement."""
        return await crud_condition.delete_many(
            self.engine, Condition.announcement_id == announcement_id
        )

    async def create_condition(
        self,
        announcement_id: str,
        category_id: str,
        content: str,
        section: str,
        page: int,
        bbox: list[float],
        llm_output_id: str = "test_llm_output",
    ) -> Condition:
        """Create a test condition."""
        condition_in = ConditionCreate(
            announcement_id=announcement_id,
            llm_output_id=llm_output_id,
            category_id=category_id,
            content=content,
            section=section,
            page=page,
            bbox=bbox,
        )
        return await crud_condition.create(self.engine, condition_in)

    async def create_announcement_with_conditions(
        self,
        housing_data: dict[str, Any],
        categories_data: list[dict[str, Any]],
    ) -> tuple[Announcement, list[Category], list[Condition]]:
        """Create a test announcement with categories and conditions."""
        # Create announcement
        announcement = await self.create_announcement(housing_data)

        categories = []
        conditions = []

        # Create categories and their conditions
        for category_data in categories_data:
            category = await self.create_category(
                announcement.id,
                category_data["category"],
            )
            categories.append(category)

            for condition_data in category_data["conditions"]:
                condition = await self.create_condition(
                    announcement.id,
                    category.id,
                    condition_data["content"],
                    condition_data["section"],
                    condition_data["page"],
                    condition_data["bbox"],
                )
                conditions.append(condition)

        return announcement, categories, conditions

    async def create_user_condition(
        self,
        announcement_id: str,
        user_id: str,
        content: str,
        section: str,
        page: int,
        bbox: list[float],
        original_id: str | None = None,
        category_id: str | None = None,
        comment: str = "",
        is_deleted: bool = False,
    ) -> UserCondition:
        """Create a test user condition."""
        user_condition_in = UserConditionCreate(
            announcement_id=announcement_id,
            original_id=original_id,
            category_id=category_id,
            content=content,
            section=section,
            page=page,
            bbox=bbox,
            user_id=user_id,
            comment=comment,
        )
        user_condition = await crud_user_condition.create(
            self.engine, user_condition_in
        )
        if is_deleted:
            user_condition.is_deleted = True
            await self.engine.save(user_condition)
        return user_condition

    async def create_user_category(
        self,
        announcement_id: str,
        user_id: str,
        name: str,
        original_id: str | None = None,
        comment: str = "",
        is_deleted: bool = False,
    ) -> UserCategory:
        """Create a test user category."""
        user_category_in = UserCategoryCreate(
            announcement_id=announcement_id,
            user_id=user_id,
            original_id=original_id,
            name=name,
            comment=comment,
        )
        user_category = await crud_user_category.create(self.engine, user_category_in)
        if is_deleted:
            user_category.is_deleted = True
            await self.engine.save(user_category)
        return user_category

    async def update_user_condition(
        self, db_obj: UserCondition, obj_in: UserConditionUpdate
    ) -> UserCondition:
        return await crud_user_condition.update(
            self.engine, db_obj=db_obj, obj_in=obj_in
        )

    async def update_user_category(
        self, db_obj: UserCategory, obj_in: UserCategoryUpdate
    ) -> UserCategory:
        """Update a test user category."""
        return await crud_user_category.update(
            self.engine, db_obj=db_obj, obj_in=obj_in
        )

    async def get_user_category(self, user_category_id: str) -> UserCategory | None:
        """Get a user category by ID."""
        return await crud_user_category.get(
            self.engine, UserCategory.id == user_category_id
        )
