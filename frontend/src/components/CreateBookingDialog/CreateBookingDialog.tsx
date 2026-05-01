import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
} from "@mui/material";
import { createBooking, updateBooking } from "@/api";


const RequiredLabel = ({ text }: { text: string }) => (
  <>
    {text}
    <span style={{ color: "#D32F2F", marginLeft: 4 }}>*</span>
  </>
);

type Props = {
  open: boolean;
  onClose: () => void;
  rooms: { id: string; number: string; name: string }[];
  onCreated?: () => void;
  mode?: "create" | "edit";
  bookingId?: string;
  initial?: Partial<FormState>;
};

type FormState = {
  eventName: string; // Название мероприятия *
  eventType: string; // Тип мероприятия *
  subject: string; // Предмет/дисциплина

  startDate: string; // *
  endDate: string; // *
  startTime: string; // *
  endTime: string; // *

  roomId: string; // Основная аудитория *
  backupRoomId: string; // Резервная аудитория

  organizerName: string; // ФИО организатора *
};

const initialState: FormState = {
  eventName: "",
  eventType: "",
  subject: "",

  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",

  roomId: "",
  backupRoomId: "",

  organizerName: "",
};

type Touched = Partial<Record<keyof FormState, boolean>>;

function compareStr(a: string, b: string) {
  if (!a || !b) return 0;
  return a.localeCompare(b);
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        borderColor: "#E5E7EB",
      }}
    >
      <Typography sx={{ fontWeight: 700, color: "#111927" }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography sx={{ mt: 0.25, color: "#6C737F", fontSize: 13 }}>
          {subtitle}
        </Typography>
      ) : null}

      <Divider sx={{ my: 1.5 }} />
      {children}
    </Paper>
  );
}

const TwoCol = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      columnGap: 2,
      rowGap: 2,
      alignItems: "start",
    }}
  >
    {children}
  </Box>
);

export default function CreateBookingDialog({
  open,
  onClose,
  rooms,
  onCreated,
  mode = "create",
  bookingId,
  initial,
}: Props) {
  const [form, setForm] = React.useState<FormState>(initialState);
  const [touched, setTouched] = React.useState<Touched>({});
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm({ ...initialState, ...(initial ?? {}) });
      setTouched({});
      setSubmitted(false);
    }
  }, [open, initial]);


  const setField = (key: keyof FormState, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const markTouched = (key: keyof FormState) =>
    setTouched((p) => ({ ...p, [key]: true }));

  const errors = React.useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};

    // обязательные
    if (!form.eventName.trim()) e.eventName = "Введите название мероприятия";
    if (!form.eventType) e.eventType = "Выберите тип мероприятия";

    if (!form.startDate) e.startDate = "Выберите дату начала";
    if (!form.endDate) e.endDate = "Выберите дату окончания";
    if (!form.startTime) e.startTime = "Выберите время начала";
    if (!form.endTime) e.endTime = "Выберите время окончания";

    if (!form.roomId) e.roomId = "Выберите основную аудиторию";

    if (!form.organizerName.trim())
      e.organizerName = "Введите ФИО организатора";

    // резервная не должна совпадать с основной
    if (form.backupRoomId && form.backupRoomId === form.roomId) {
      e.backupRoomId = "Резервная аудитория должна отличаться";
    }

    // порядок дат/времени
    if (
      form.startDate &&
      form.endDate &&
      compareStr(form.startDate, form.endDate) > 0
    ) {
      e.endDate = "Дата окончания должна быть не раньше даты начала";
    }
    if (
      form.startDate &&
      form.endDate &&
      form.startTime &&
      form.endTime &&
      form.startDate === form.endDate &&
      compareStr(form.startTime, form.endTime) >= 0
    ) {
      e.endTime = "Время окончания должно быть позже времени начала";
    }

    return e;
  }, [form]);

  const roomLabelById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rooms) m.set(String(r.id), `${r.number} — ${r.name}`);
    return m;
  }, [rooms]);

  const isValid = Object.keys(errors).length === 0;

  const showError = (key: keyof FormState) =>
    Boolean(errors[key]) && (submitted || touched[key]);

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!isValid) return;

    const startsAt = new Date(
      `${form.startDate}T${form.startTime}:00`,
    ).toISOString();
    const endsAt = new Date(`${form.endDate}T${form.endTime}:00`).toISOString();

    try {
      if (mode === "edit") {
        if (!bookingId) throw new Error("bookingId is required for edit");

        await updateBooking(bookingId, {
          eventName: form.eventName.trim(),
          eventType: form.eventType,
          subject: form.subject.trim() || null,
          organizerName: form.organizerName.trim(),
          roomId: form.roomId,
          backupRoomId: form.backupRoomId || null,
          startsAt,
          endsAt,
        });
      } else {
        await createBooking({
          eventName: form.eventName.trim(),
          eventType: form.eventType,
          subject: form.subject.trim() || null,
          organizerName: form.organizerName.trim(),
          roomId: form.roomId,
          backupRoomId: form.backupRoomId || null,
          startsAt,
          endsAt,
        });
      }

      onCreated?.();
      onClose();
    } catch (e: any) {
      alert(
        e.message ??
          (mode === "edit" ? "Ошибка обновления" : "Ошибка создания"),
      );
    }
  };


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Создать бронирование</DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* 1) Основная информация */}
          <Section
            title="Основная информация о мероприятии"
            subtitle="Укажите детали мероприятия и тип занятия"
          >
            <TwoCol>
              <TextField
                label={<RequiredLabel text="Название мероприятия" />}
                required
                fullWidth
                value={form.eventName}
                onChange={(e) => setField("eventName", e.target.value)}
                onBlur={() => markTouched("eventName")}
                error={showError("eventName")}
                helperText={showError("eventName") ? errors.eventName : " "}
                placeholder="Например: Лекция по высшей математике"
              />

              <FormControl fullWidth required error={showError("eventType")}>
                <InputLabel id="eventType-label">Тип мероприятия *</InputLabel>
                <Select
                  labelId="eventType-label"
                  label="Тип мероприятия *"
                  value={form.eventType}
                  onChange={(e) => setField("eventType", e.target.value)}
                  onBlur={() => markTouched("eventType")}
                >
                  <MenuItem value="">Выберите тип</MenuItem>
                  <MenuItem value="LECTURE">Лекция</MenuItem>
                  <MenuItem value="PRACTICE">Практика</MenuItem>
                  <MenuItem value="SEMINAR">Семинар</MenuItem>
                  <MenuItem value="EXAM">Экзамен</MenuItem>
                  <MenuItem value="OTHER">Другое</MenuItem>
                </Select>
                <FormHelperText>
                  {showError("eventType") ? errors.eventType : " "}
                </FormHelperText>
              </FormControl>

              {/* Предмет/дисциплина — на всю ширину, как в примере второй строкой */}
              <Box sx={{ gridColumn: "1 / -1" }}>
                <TextField
                  label="Предмет/дисциплина"
                  fullWidth
                  value={form.subject}
                  onChange={(e) => setField("subject", e.target.value)}
                  placeholder="Название учебной дисциплины или предмета"
                  helperText=" "
                />
              </Box>
            </TwoCol>
          </Section>

          {/* 2) Дата и время */}
          <Section
            title="Дата и время проведения"
            subtitle="Выберите, когда будет проходить мероприятие"
          >
            <TwoCol>
              <TextField
                label={<RequiredLabel text="Дата начала" />}
                required
                fullWidth
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                onBlur={() => markTouched("startDate")}
                error={showError("startDate")}
                helperText={showError("startDate") ? errors.startDate : " "}
              />

              <TextField
                label={<RequiredLabel text="Дата окончания" />}
                required
                fullWidth
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
                onBlur={() => markTouched("endDate")}
                error={showError("endDate")}
                helperText={showError("endDate") ? errors.endDate : " "}
              />

              <TextField
                label={<RequiredLabel text="Время начала" />}
                required
                fullWidth
                type="time"
                InputLabelProps={{ shrink: true }}
                value={form.startTime}
                onChange={(e) => setField("startTime", e.target.value)}
                onBlur={() => markTouched("startTime")}
                error={showError("startTime")}
                helperText={showError("startTime") ? errors.startTime : " "}
              />

              <TextField
                label={<RequiredLabel text="Время окончания" />}
                required
                fullWidth
                type="time"
                InputLabelProps={{ shrink: true }}
                value={form.endTime}
                onChange={(e) => setField("endTime", e.target.value)}
                onBlur={() => markTouched("endTime")}
                error={showError("endTime")}
                helperText={showError("endTime") ? errors.endTime : " "}
              />
            </TwoCol>
          </Section>

          {/* 3) Выбор аудитории */}
          <Section
            title="Выбор аудитории"
            subtitle="Выберите подходящую аудиторию"
          >
            <TwoCol>
              <FormControl fullWidth required error={showError("roomId")}>
                <InputLabel id="roomId-label">Основная аудитория *</InputLabel>
                <Select
                  labelId="roomId-label"
                  label="Основная аудитория *"
                  value={form.roomId}
                  onChange={(e) => setField("roomId", String(e.target.value))}
                  onBlur={() => markTouched("roomId")}
                  renderValue={(selected) =>
                    roomLabelById.get(String(selected)) ?? ""
                  }
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        "& .MuiMenu-list": {
                          display: "flex",
                          flexDirection: "column",
                          gap: 0,
                        },
                      },
                    },
                  }}
                >
                  {rooms.length === 0 ? (
                    <MenuItem value="" disabled>
                      Нет аудиторий
                    </MenuItem>
                  ) : (
                    rooms.map((r) => (
                      <MenuItem key={String(r.id)} value={String(r.id)}>
                        {r.number} — {r.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                <FormHelperText>
                  {showError("roomId") ? errors.roomId : " "}
                </FormHelperText>
              </FormControl>

              <FormControl fullWidth error={showError("backupRoomId")}>
                <InputLabel id="backupRoomId-label">
                  Резервная аудитория
                </InputLabel>
                <Select
                  labelId="backupRoomId-label"
                  label="Резервная аудитория"
                  value={form.backupRoomId}
                  onChange={(e) =>
                    setField("backupRoomId", String(e.target.value))
                  }
                  onBlur={() => markTouched("backupRoomId")}
                  renderValue={(selected) => {
                    const v = String(selected);
                    return v ? (roomLabelById.get(v) ?? "") : "Не выбрано";
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        "& .MuiMenu-list": {
                          display: "flex",
                          flexDirection: "column",
                          gap: 0,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Не выбрано</em>
                  </MenuItem>

                  {rooms.length === 0 ? (
                    <MenuItem value="" disabled>
                      Нет аудиторий
                    </MenuItem>
                  ) : (
                    rooms.map((r) => (
                      <MenuItem key={String(r.id)} value={String(r.id)}>
                        {r.number} — {r.name}
                      </MenuItem>
                    ))
                  )}
                </Select>

                <FormHelperText>
                  {showError("backupRoomId") ? errors.backupRoomId : " "}
                </FormHelperText>
              </FormControl>
            </TwoCol>
          </Section>

          {/* 4) Участники мероприятия */}
          <Section
            title="Участники мероприятия"
            subtitle="Укажите информацию об организаторе"
          >
            <TwoCol>
              <TextField
                label={<RequiredLabel text="ФИО организатора" />}
                required
                fullWidth
                value={form.organizerName}
                onChange={(e) => setField("organizerName", e.target.value)}
                onBlur={() => markTouched("organizerName")}
                error={showError("organizerName")}
                helperText={
                  showError("organizerName") ? errors.organizerName : " "
                }
              />

              {/* справа пусто — как на примере можно оставить место */}
              <Box />
            </TwoCol>
          </Section>

          <Box sx={{ fontSize: 12, color: "#6C737F" }}>
            <span style={{ color: "#D32F2F" }}>*</span> — обязательные поля
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          {mode === "edit" ? "Сохранить" : "Создать"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
