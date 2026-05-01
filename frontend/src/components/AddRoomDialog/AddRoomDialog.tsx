import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from "@mui/material";
import { createRoom } from "@/api";

const RequiredLabel = ({ text }: { text: string }) => (
  <>
    {text}
    <span style={{ color: "#D32F2F", marginLeft: 4 }}>*</span>
  </>
);

export type NewRoomForm = {
  number: string;
  name: string;
  capacity: string; // вводим строкой, валидируем
  description: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: NewRoomForm) => void;
  onCreated?: () => void;
};

const initialState: NewRoomForm = {
  number: "",
  name: "",
  capacity: "",
  description: "",
};

type Touched = Partial<Record<keyof NewRoomForm, boolean>>;

function isPositiveIntString(value: string) {
  // допускаем только целые >= 1 (без пробелов)
  if (!/^\d+$/.test(value)) return false;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1;
}

export default function AddRoomDialog({ open, onClose }: Props) {
  const [form, setForm] = React.useState<NewRoomForm>(initialState);
  const [touched, setTouched] = React.useState<Touched>({});
  const [submitted, setSubmitted] = React.useState(false);

  // сбрасываем состояние при открытии (на случай если закрывали по Esc)
  React.useEffect(() => {
    if (open) {
      setForm(initialState);
      setTouched({});
      setSubmitted(false);
    }
  }, [open]);

  const setField = (key: keyof NewRoomForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const markTouched = (key: keyof NewRoomForm) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const errors = React.useMemo(() => {
    const e: Partial<Record<keyof NewRoomForm, string>> = {};

    if (!form.number.trim()) e.number = "Введите номер аудитории";
    if (!form.name.trim()) e.name = "Введите название аудитории";

    const cap = form.capacity.trim();
    if (!cap) e.capacity = "Введите вместимость";
    else if (!isPositiveIntString(cap))
      e.capacity = "Вместимость должна быть целым числом ≥ 1";

    // description необязателен

    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const showError = (key: keyof NewRoomForm) => {
    return Boolean(errors[key]) && (submitted || touched[key]);
  };

  const handleCancel = () => {
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!isValid) return;

    try {
      await createRoom({
        number: form.number.trim(),
        name: form.name.trim(),
        capacity: Number(form.capacity),
        description: form.description.trim() || null,
      });
      
      onClose(); // закрыть окно после успеха
    } catch (e: any) {
      alert(e.message ?? "Ошибка при создании аудитории");
    }
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle>Добавить аудиторию</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={<RequiredLabel text="Номер аудитории" />}
            required
            value={form.number}
            onChange={(e) => setField("number", e.target.value)}
            onBlur={() => markTouched("number")}
            fullWidth
            autoFocus
            error={showError("number")}
            helperText={showError("number") ? errors.number : " "}
          />

          <TextField
            label={<RequiredLabel text="Название аудитории" />}
            required
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => markTouched("name")}
            fullWidth
            error={showError("name")}
            helperText={showError("name") ? errors.name : " "}
          />

          <TextField
            label={<RequiredLabel text="Вместимость" />}
            required
            value={form.capacity}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^\d+$/.test(v)) setField("capacity", v);
            }}
            onBlur={() => markTouched("capacity")}
            fullWidth
            inputMode="numeric"
            error={showError("capacity")}
            helperText={showError("capacity") ? errors.capacity : " "}
          />

          <TextField
            label="Описание аудитории"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            onBlur={() => markTouched("description")}
            fullWidth
            multiline
            minRows={3}
            helperText=" "
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel}>Отмена</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
}
