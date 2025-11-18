from fastapi import APIRouter, Depends, WebSocket
from auth.dependencies import get_current_org
from services.notification_service import NotificationService
from ws_manager import ws_manager

router = APIRouter(prefix="/notifications", tags=["Notifications"])
service = NotificationService()

# 1) GET - lista svih notifikacija orga
@router.get("/me")
async def get_my_notifications(current_org=Depends(get_current_org)):
    return await service.get_notifications(str(current_org["_id"]))


# 2) WebSocket kanal za real-time notifikacije
@router.websocket("/ws/{org_id}")
async def notifications_ws(websocket: WebSocket, org_id: str):
    await ws_manager.connect(org_id, websocket)

    try:
        while True:
            await websocket.receive_text()  # client ping or ignore
    except:
        ws_manager.disconnect(org_id, websocket)


@router.patch("/read/{notification_id}")
async def mark_notification_read(notification_id: str, current_org = Depends(get_current_org)):
    return await service.mark_read(notification_id)


@router.patch("/read-all")
async def mark_all_read(current_org = Depends(get_current_org)):
    return await service.mark_all_read(str(current_org["_id"]))


@router.get("/count")
async def get_unread_count(current_org = Depends(get_current_org)):
    return await service.get_unread_count(str(current_org["_id"]))


