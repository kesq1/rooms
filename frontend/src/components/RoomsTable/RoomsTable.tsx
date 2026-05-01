import { useEffect, useMemo, useState } from "react";
import { Box, Chip, CircularProgress, Typography } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchBookings, type BookingListItemDto } from "@/api/bookingsApi";
import { deleteBooking } from "@/api";

function eventTypeLabel(t: BookingListItemDto["eventType"]) {
  switch (t) {
    case "LECTURE":
      return "Лекция";
    case "PRACTICE":
      return "Практика";
    case "SEMINAR":
      return "Семинар";
    case "EXAM":
      return "Экзамен";
    case "OTHER":
      return "Другое";
    default:
      return t;
  }
}

function formatDt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // просто и понятно, без заморочек
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RoomsTable({
  reloadKey,
  onEdit,
  onDeleted,
}: {
  reloadKey: number;
  onEdit: (row: BookingListItemDto) => void;
  onDeleted: () => void;
}) {
  const [rows, setRows] = useState<BookingListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchBookings();
        if (mounted) setRows(data);
      } catch (e) {
        if (mounted) setError((e as Error).message || "Ошибка загрузки данных");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  const columns: GridColDef<BookingListItemDto>[] = useMemo(
    () => [
      {
        field: "eventName",
        headerName: "Мероприятие",
        width: 260,
      },
      {
        field: "eventType",
        headerName: "Тип",
        width: 130,
        renderCell: (params) => (
          <Chip
            size="small"
            variant="outlined"
            label={eventTypeLabel(params.value)}
          />
        ),
      },
      {
        field: "subject",
        headerName: "Предмет",
        width: 200,
        valueGetter: (_v, row) => row.subject ?? "—",
      },
      {
        field: "roomLabel",
        headerName: "Основная аудитория",
        width: 220,
      },
      {
        field: "backupRoomLabel",
        headerName: "Резервная аудитория",
        width: 220,
        valueGetter: (_v, row) => row.backupRoomLabel ?? "—",
      },
      {
        field: "startsAt",
        headerName: "Начало",
        width: 170,
        valueGetter: (_v, row) => formatDt(row.startsAt),
      },
      {
        field: "endsAt",
        headerName: "Окончание",
        width: 170,
        valueGetter: (_v, row) => formatDt(row.endsAt),
      },
      {
        field: "organizerName",
        headerName: "Организатор",
        width: 210,
      },
      {
        field: "actions",
        type: "actions",
        headerName: "Действия",
        width: 120,
        getActions: (params) => [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Редактировать"
            onClick={() => onEdit(params.row)}
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Удалить"
            onClick={async () => {
              const ok = window.confirm("Удалить это бронирование?");
              if (!ok) return;

              try {
                await deleteBooking(params.row.id);
                onDeleted();
              } catch (e: any) {
                alert(e.message ?? "Не удалось удалить бронирование");
              }
            }}
            showInMenu={false}
          />,
        ],
      },
    ],
    [],
  );

  if (loading)
    return (
      <Box sx={{ p: 3, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );

  return (
    <Box
      sx={{
        height: 440,
        width: "100%",
        bgcolor: "#FCFCFD",
        borderRadius: 2,
        border: "1px solid #DDE5EF",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        disableRowSelectionOnClick
        initialState={{
          pagination: { paginationModel: { pageSize: 5 } },
        }}
        pageSizeOptions={[5, 10]}
        sx={{
          border: "none",
          "& .MuiDataGrid-cell": { outline: "none" },
          "& .MuiDataGrid-columnHeaders": { bgcolor: "#F8FAFC" },
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
          "& .MuiDataGrid-row:hover": { bgcolor: "#EFF6FF" },
        }}
      />
    </Box>
  );
}
