import { Container, Box } from "@mui/material";
import { Header } from "./components/Header";
import { RoomsTable } from "./components/RoomsTable/RoomsTable";
import { RoomsFilters } from "@/components/RoomsFilters/RoomsFilters";
import AudienceCatalog from "@/components/AudienceCatalog/AudienceCatalog";
import QuickAction from "@/components/QuickActions/QuickAction";
import AddRoomDialog from "./components/AddRoomDialog/AddRoomDialog";
import CreateBookingDialog from "@/components/CreateBookingDialog/CreateBookingDialog";
import { useEffect, useState } from "react";
import { getRooms, type Room } from "@/api";
import type { BookingListItemDto } from "@/api/bookingsApi";

function toDateInput(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toTimeInput(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${min}`;
}


export default function App() {
  const [addOpen, setAddOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [editBooking, setEditBooking] = useState<BookingListItemDto | null>(
    null,
  );

  const handleCloseAdd = () => setAddOpen(false);

  const [bookingsReloadKey, setBookingsReloadKey] = useState(0);

  const loadRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (e: any) {
      console.error(e);
      alert(e.message ?? "Не удалось загрузить аудитории");
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  return (
    <>
      <Header
        activeNavId="catalog"
        onNavigate={(id) => console.log("goto", id)}
        onBellClick={() => console.log("bell")}
      />

      <Container maxWidth="lg">
        <Box sx={{ my: 2 }}>
          <AudienceCatalog />
          <RoomsFilters />
          <RoomsTable
            reloadKey={bookingsReloadKey}
            onEdit={(row) => {
              setEditBooking(row);
              setBookingOpen(true);
            }}
            onDeleted={() => setBookingsReloadKey((x) => x + 1)}
          />

          <QuickAction
            onAddRoomClick={() => setAddOpen(true)}
            onCreateBookingClick={() => setBookingOpen(true)}
          />

          <AddRoomDialog
            open={addOpen}
            onClose={handleCloseAdd}
            onCreated={loadRooms}
          />

          <CreateBookingDialog
            open={bookingOpen}
            onClose={() => {
              setBookingOpen(false);
              setEditBooking(null);
            }}
            rooms={rooms}
            onCreated={() => setBookingsReloadKey((x) => x + 1)}
            mode={editBooking ? "edit" : "create"}
            bookingId={editBooking?.id}
            initial={
              editBooking
                ? {
                    eventName: editBooking.eventName,
                    eventType: editBooking.eventType,
                    subject: editBooking.subject ?? "",
                    roomId: editBooking.roomId,
                    backupRoomId: editBooking.backupRoomId ?? "",
                    organizerName: editBooking.organizerName,
                    startDate: toDateInput(editBooking.startsAt),
                    endDate: toDateInput(editBooking.endsAt),
                    startTime: toTimeInput(editBooking.startsAt),
                    endTime: toTimeInput(editBooking.endsAt),
                  }
                : undefined
            }
          />
        </Box>
      </Container>
    </>
  );
}
