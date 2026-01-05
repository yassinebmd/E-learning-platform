import { verifyToken } from "../utils/jwt";

const userSocketMap = new Map<string, WebSocket>();
const socketUsers = new Map<string, any>();
const allSockets = new Set<WebSocket>();

export const socketHandler = {
  open(ws: any) {
    allSockets.add(ws);
  },

  message(ws: any, raw: any) {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    if (data.type === "auth") {
      const payload = verifyToken(data.token);
      if (!payload) return ws.close();

      socketUsers.set(ws.id, payload);
      userSocketMap.set(payload.userId, ws);
      return;
    }
  },

  close(ws: any) {
    socketUsers.delete(ws.id);
    allSockets.delete(ws);
  },
};
