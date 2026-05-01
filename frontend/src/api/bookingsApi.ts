import { API_BASE } from "@/api";

export type BookingListItemDto = {
  id: string;
  eventName: string;
  eventType: "LECTURE" | "PRACTICE" | "SEMINAR" | "EXAM" | "OTHER";
  subject: string | null;

  startsAt: string; // ISO
  endsAt: string; // ISO

  roomId: string;
  roomLabel: string;

  backupRoomId: string | null;
  backupRoomLabel: string | null;

  organizerName: string;
  createdAt: string; // ISO
};

export async function fetchBookings(): Promise<BookingListItemDto[]> {
  const res = await fetch(`${API_BASE}/api/bookings`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}
