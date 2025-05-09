from datetime import datetime, timezone
from typing import Any

from odmantic import AIOEngine, Model

from app.crud.base import CRUDBase
from app.enums import ModificationTargetType
from app.models.condition import Condition
from app.models.field_modification import FieldModification
from app.schemas.condition import ConditionUpdate
from app.schemas.field_modification import (
    FieldModificationCreate,
    FieldModificationUpdate,
)


class CRUDFieldModification(
    CRUDBase[FieldModification, FieldModificationCreate, FieldModificationUpdate]
):
    def __init__(self, model: type[FieldModification]):
        super().__init__(model)
        self.model_map = {
            ModificationTargetType.CONDITION: Condition,
        }

    async def get_by_target(
        self, engine: AIOEngine, target_id: str, target_type: ModificationTargetType
    ) -> list[FieldModification]:
        """Get all field modifications for a target"""
        return await self.get_many(
            engine,
            (FieldModification.target_id == target_id)
            & (FieldModification.target_type == target_type),
        )

    async def get_field_modification(
        self,
        engine: AIOEngine,
        target_id: str,
        target_type: ModificationTargetType,
        field_name: str,
    ) -> FieldModification | None:
        """Get the modification for a specific field"""
        return await self.get(
            engine,
            (FieldModification.target_id == target_id)
            & (FieldModification.target_type == target_type)
            & (FieldModification.field_name == field_name),
        )

    async def _get_target_model(
        self, engine: AIOEngine, target_id: str, target_type: ModificationTargetType
    ) -> Model | None:
        model_class = self.model_map.get(target_type)
        if not model_class:
            return None
        return await engine.find_one(model_class, model_class.id == target_id)

    async def modify_field(
        self,
        engine: AIOEngine,
        target_id: str,
        target_type: ModificationTargetType,
        field_name: str,
        new_value: Any,
        user_id: str,
        user_email: str,
    ) -> dict[str, Any]:
        """Create or update a field modification"""
        # Get the target object
        target = await self._get_target_model(engine, target_id, target_type)
        if not target:
            return {"success": False, "error": f"{target_type.value} not found"}

        # Check if the field exists on the target
        if not hasattr(target, field_name):
            return {
                "success": False,
                "error": f"Field {field_name} not found on {target_type.value}",
            }

        # Get current value
        original_value = getattr(target, field_name)

        # Skip if the value hasn't changed
        if original_value == new_value:
            return {"success": True, "message": "No changes needed", "modified": False}

        # Check if a modification already exists for this field
        existing_mod = await self.get_field_modification(
            engine, target_id, target_type, field_name
        )

        # Use a transaction for atomicity
        async with engine.transaction():
            if existing_mod:
                # Update existing modification
                existing_mod.current_value = new_value
                existing_mod.user_id = user_id
                existing_mod.user_email = user_email
                existing_mod.updated_at = datetime.now(timezone.utc)
                modification = await engine.save(existing_mod)
            else:
                # Create new modification
                mod_data = FieldModificationCreate(
                    target_id=target_id,
                    target_type=target_type,
                    field_name=field_name,
                    original_value=original_value,
                    current_value=new_value,
                    user_id=user_id,
                    user_email=user_email,
                )
                modification = await self.create(engine, mod_data)

            # Update the target object's field value
            setattr(target, field_name, new_value)
            await engine.save(target)

        return {"success": True, "modification": modification, "modified": True}

    async def modify_condition(
        self,
        engine: AIOEngine,
        condition_id: str,
        update_data: ConditionUpdate,
        user_id: str,
        user_email: str,
    ) -> dict[str, Any]:
        """Apply multiple field modifications to a condition"""
        condition = await self._get_target_model(
            engine, condition_id, ModificationTargetType.CONDITION
        )
        if not condition:
            return {"success": False, "error": "Condition not found"}

        # Store results
        modifications = []
        modified_fields = []

        # Use a transaction to ensure atomicity
        async with engine.transaction():
            # Process each field in the update data
            for field_name, new_value in update_data.model_dump(
                exclude_unset=True
            ).items():
                result = await self.modify_field(
                    engine,
                    condition_id,
                    ModificationTargetType.CONDITION,
                    field_name,
                    new_value,
                    user_id,
                    user_email,
                )

                if result["success"] and result.get("modified", False):
                    modifications.append(result["modification"])
                    modified_fields.append(field_name)

        return {
            "success": True,
            "condition": condition,
            "modifications": modifications,
            "modified_fields": modified_fields,
        }

    async def get_modified_instance(
        self, engine: AIOEngine, target_id: str, target_type: ModificationTargetType
    ) -> Model | None:
        """Get the original object with all field modifications applied"""
        # Get the original object
        target = await self._get_target_model(engine, target_id, target_type)
        if not target:
            return None

        # Get all modifications for this target
        modifications = await self.get_by_target(engine, target_id, target_type)

        # Apply each field modification
        for mod in modifications:
            if hasattr(target, mod.field_name):
                setattr(target, mod.field_name, mod.current_value)

        return target

    async def get_modified_fields(
        self, engine: AIOEngine, target_id: str, target_type: ModificationTargetType
    ) -> dict[str, Any]:
        """Get information about all modified fields for a target"""
        # Get the original object
        target = await self._get_target_model(engine, target_id, target_type)
        if not target:
            return {"success": False, "error": f"{target_type.value} not found"}

        # Get all modifications
        modifications = await self.get_by_target(engine, target_id, target_type)

        # Build field map
        field_modifications = {}
        for mod in modifications:
            field_modifications[mod.field_name] = {
                "original": mod.original_value,
                "current": mod.current_value,
                "modified_by": mod.user_id,
                "modified_at": mod.updated_at,
            }

        # Create the modified object
        modified_obj = target.model_dump()
        for field_name, mod_info in field_modifications.items():
            if field_name in modified_obj:
                modified_obj[field_name] = mod_info["current"]

        return {
            "success": True,
            "original": target,
            "modified": modified_obj,
            "modified_fields": field_modifications,
        }

    async def delete_all_for_target(
        self, engine: AIOEngine, target_id: str, target_type: ModificationTargetType
    ) -> int:
        """
        Delete all field modifications for a specific target

        Returns:
            int: Number of modifications deleted
        """
        # Get all modifications for this target
        modifications = await self.get_by_target(engine, target_id, target_type)

        # Return early if no modifications found
        if not modifications:
            return 0

        # Use a transaction for deleting multiple modifications
        count = 0
        async with engine.transaction():
            # Delete each modification
            for mod in modifications:
                await engine.delete(mod)
                count += 1

        return count


crud_field_modification = CRUDFieldModification(FieldModification)
