export const API_BASE = (() => {
  // GitHub Pages всегда на github.io
  if (location.hostname.endsWith("github.io")) {
    return "https://rooms-r8lo.onrender.com";
  }

  
  return "";
})();

function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
  });

  if (!res.ok) {
    // пытаемся достать message из json, иначе текст
    const text = await res.text().catch(() => "");
    try {
      const data = text ? JSON.parse(text) : null;
      throw new Error(data?.message ?? `HTTP ${res.status}`);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// -------------------- Rooms --------------------

export type Room = {
  id: string;
  number: string;
  name: string;
  capacity: number;
  description: string | null;
  createdAt: string;
};

export async function createRoom(body: {
  number: string;
  name: string;
  capacity: number;
  description?: string | null;
}) {
  return apiFetch<Room>("/api/rooms", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getRooms(): Promise<Room[]> {
  return apiFetch<Room[]>("/api/rooms", { method: "GET" });
}

// -------------------- Bookings --------------------

export async function createBooking(body: {
  eventName: string;
  eventType: string;
  subject?: string | null;
  organizerName: string;
  roomId: string;
  backupRoomId?: string | null;
  startsAt: string;
  endsAt: string;
}) {
  return apiFetch<any>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateBooking(
  id: string,
  body: {
    eventName: string;
    eventType: string;
    subject?: string | null;
    organizerName: string;
    roomId: string;
    backupRoomId?: string | null;
    startsAt: string;
    endsAt: string;
  },
) {
  return apiFetch<any>(`/api/bookings/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteBooking(id: string) {
  return apiFetch<void>(`/api/bookings/${id}`, { method: "DELETE" });
}
