from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # kljuc: org_id, vrednost: lista WebSocket konekcija
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, org_id: str, websocket: WebSocket):
        await websocket.accept()

        if org_id not in self.active_connections:
            self.active_connections[org_id] = []

        self.active_connections[org_id].append(websocket)

    def disconnect(self, org_id: str, websocket: WebSocket):
        if org_id in self.active_connections:
            self.active_connections[org_id].remove(websocket)

    async def send_to_org(self, org_id: str, message: str):
        if org_id in self.active_connections:
            for ws in self.active_connections[org_id]:
                await ws.send_text(message)


ws_manager = ConnectionManager()
