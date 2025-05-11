from typing import Any

from odmantic import AIOEngine

from app.crud import (
    crud_announcement,
    crud_announcement_view,
    crud_category,
    crud_condition,
    crud_user_category,
    crud_user_condition,
)
from app.enums import AnnouncementType
from app.models.announcement import Announcement
from app.models.announcement_view import AnnouncementView
from app.models.category import Category
from app.models.condition import Condition
from app.models.user_category import UserCategory
from app.models.user_condition import UserCondition
from app.schemas.announcement import AnnouncementCreate
from app.schemas.announcement_view import AnnouncementViewUpdate
from app.schemas.category import CategoryCreate
from app.schemas.condition import ConditionCreate
from app.schemas.user_category import UserCategoryCreate
from app.schemas.user_condition import UserConditionCreate


class TestDataFactory:
    def __init__(self, engine: AIOEngine):
        self.engine = engine

    async def get_announcement_view(self, announcement_id: str) -> AnnouncementView:
        return await crud_announcement_view.get(
            self.engine, AnnouncementView.announcement_id == announcement_id
        )

    async def update_announcement_view(
        self, db_obj: AnnouncementView, obj_in: AnnouncementViewUpdate
    ) -> None:
        return await crud_announcement_view.update(
            self.engine, db_obj=db_obj, obj_in=obj_in
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
            user_id=user_id,
            original_id=original_id,
            category_id=category_id,
            content=content,
            section=section,
            page=page,
            bbox=bbox,
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

    async def cleanup(self) -> None:
        """Clean up all created test data."""
        await crud_announcement.delete_many(self.engine)
        await crud_condition.delete_many(self.engine)
        await crud_category.delete_many(self.engine)
        await crud_user_condition.delete_many(self.engine)
        await crud_user_category.delete_many(self.engine)
