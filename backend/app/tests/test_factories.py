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
from app.schemas.announcement_view import AnnouncementViewCreate
from app.schemas.category import CategoryCreate
from app.schemas.condition import ConditionCreate
from app.schemas.user_category import UserCategoryCreate
from app.schemas.user_condition import UserConditionCreate


async def create_test_announcement(
    engine: AIOEngine,
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
    return await crud_announcement.create(engine, announcement_in)


async def create_test_category(
    engine: AIOEngine,
    announcement_id: str,
    name: str,
) -> Category:
    """Create a test category."""
    category_in = CategoryCreate(
        announcement_id=announcement_id,
        name=name,
    )
    return await crud_category.create(engine, category_in)


async def create_test_condition(
    engine: AIOEngine,
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
    return await crud_condition.create(engine, condition_in)


async def create_test_announcement_with_conditions(
    engine: AIOEngine,
    housing_data: dict[str, Any],
    categories_data: list[dict[str, Any]],
) -> tuple[Announcement, list[Category], list[Condition]]:
    """Create a test announcement with categories and conditions."""
    # Create announcement
    announcement = await create_test_announcement(engine, housing_data)

    categories = []
    conditions = []

    # Create categories and their conditions
    for category_data in categories_data:
        category = await create_test_category(
            engine,
            announcement.id,
            category_data["category"],
        )
        categories.append(category)

        for condition_data in category_data["conditions"]:
            condition = await create_test_condition(
                engine,
                announcement.id,
                category.id,
                condition_data["content"],
                condition_data["section"],
                condition_data["page"],
                condition_data["bbox"],
            )
            conditions.append(condition)

    return announcement, categories, conditions


class TestDataFactory:
    def __init__(self, engine: AIOEngine):
        self.engine = engine
        self._created_announcements = []
        self._created_announcement_views = []
        self._created_conditions = []
        self._created_categories = []
        self._created_user_conditions = []
        self._created_user_categories = []

    async def create_announcement(
        self,
        housing_data: dict[str, Any],
        filename: str = "test.pdf",
        announcement_type: AnnouncementType = AnnouncementType.PUBLIC_LEASE,
    ) -> Announcement:
        """Create a test announcement and track it for cleanup."""
        announcement = await create_test_announcement(
            self.engine, housing_data, filename, announcement_type
        )
        self._created_announcements.append(announcement)
        return announcement

    async def create_announcement_with_conditions(
        self,
        housing_data: dict[str, Any],
        categories_data: list[dict[str, Any]],
    ) -> tuple[Announcement, list[Category], list[Condition]]:
        """Create a test announcement with conditions and track it for cleanup."""
        (
            announcement,
            categories,
            conditions,
        ) = await create_test_announcement_with_conditions(
            self.engine, housing_data, categories_data
        )
        self._created_announcements.append(announcement)
        self._created_categories.extend(categories)
        self._created_conditions.extend(conditions)
        return announcement, categories, conditions

    async def create_announcement_view(
        self,
        announcement_id: str,
        view_count: int = 0,
    ) -> None:
        """Create an announcement view and track it for cleanup."""
        view = AnnouncementViewCreate(
            announcement_id=announcement_id,
            view_count=view_count,
        )
        await crud_announcement_view.create(self.engine, view)
        self._created_announcement_views.append(view)

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
        condition = await create_test_condition(
            self.engine,
            announcement_id,
            category_id,
            content,
            section,
            page,
            bbox,
            llm_output_id,
        )
        self._created_conditions.append(condition)
        return condition

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
        self._created_user_conditions.append(user_condition)
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
        self._created_user_categories.append(user_category)
        return user_category

    async def cleanup(self) -> None:
        """Clean up all created test data."""
        for announcement_view in self._created_announcements:
            await crud_announcement_view.delete(
                self.engine, AnnouncementView.id == announcement_view.id
            )
        for announcement in self._created_announcements:
            await crud_announcement.delete(
                self.engine, Announcement.id == announcement.id
            )
        for condition in self._created_conditions:
            await crud_condition.delete(self.engine, Condition.id == condition.id)
        for category in self._created_categories:
            await crud_category.delete(self.engine, Category.id == category.id)
        for user_condition in self._created_user_conditions:
            await crud_user_condition.delete(
                self.engine, UserCondition.id == user_condition.id
            )
        for user_category in self._created_user_categories:
            await crud_user_category.delete(
                self.engine, UserCategory.id == user_category.id
            )

        self._created_announcements = []
        self._created_announcement_views = []
        self._created_conditions = []
        self._created_categories = []
        self._created_user_conditions = []
        self._created_user_categories = []
