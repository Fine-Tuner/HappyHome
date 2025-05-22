import pytest
from httpx import AsyncClient

from app.schemas.user import UserUpdateRequest


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["income"] is None
    assert (
        data["bookmark_announcement_ids"] == []
        or data["bookmark_announcement_ids"] is None
    )


@pytest.mark.asyncio
async def test_update_me(client: AsyncClient):
    update_payload = UserUpdateRequest(
        income=123456, bookmark_announcement_ids=["ann1", "ann2"]
    )
    response = await client.put(
        "/api/v1/users/me", json=update_payload.model_dump(exclude_none=True)
    )
    assert response.status_code == 200
    data = response.json()
    assert data["income"] == 123456
    assert data["bookmark_announcement_ids"] == ["ann1", "ann2"]
