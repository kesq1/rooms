import { useState } from "react";
import {
    Box,
    TextField,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    Chip,
    Stack,
    Typography,
    Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export function RoomsFilters() {
    const [search, setSearch] = useState("");
    const [building, setBuilding] = useState("all");
    const [floor, setFloor] = useState("all");
    const [status, setStatus] = useState("all");
    const [equipment, setEquipment] = useState<string[]>([]);

    const EQUIP_OPTIONS = [
        { key: "projector", label: "Проектор" },
        { key: "computers", label: "Компьютеры" },
        { key: "board", label: "Интерактивная доска" },
        { key: "microphone", label: "Микрофон" },
        { key: "wifi", label: "Wi-Fi" },
    ];

    const resetFilters = () => {
        setSearch("");
        setBuilding("all");
        setFloor("all");
        setStatus("all");
        setEquipment([]);
    };

    const toggleEquip = (key: string) => {
        setEquipment(prev =>
            prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
        );
    };

    return (
        <Box
            sx={{
                p: 2.5,
                mb: 2,
                borderRadius: 2,
                border: "1px solid #eef0f3",
                display: "flex",
                flexDirection: "column",
                gap: 2,
            }}
        >
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Фильтры и поиск
                </Typography>
                <Button variant="text" onClick={resetFilters}>
                    Сбросить все
                </Button>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <TextField
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск по номеру или названию..."
                    size="small"
                    sx={{ minWidth: 260 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />

                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select value={building} onChange={(e) => setBuilding(e.target.value)}>
                        <MenuItem value="all">Все корпуса</MenuItem>
                        <MenuItem value="1">Корпус 1</MenuItem>
                        <MenuItem value="2">Корпус 2</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select value={floor} onChange={(e) => setFloor(e.target.value)}>
                        <MenuItem value="all">Все этажи</MenuItem>
                        <MenuItem value="1">1 этаж</MenuItem>
                        <MenuItem value="2">2 этаж</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <MenuItem value="all">Все статусы</MenuItem>
                        <MenuItem value="available">Доступна</MenuItem>
                        <MenuItem value="booked">Забронирована</MenuItem>
                        <MenuItem value="maintenance">На обслуживании</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {EQUIP_OPTIONS.map((item) => (
                    <Chip
                        key={item.key}
                        label={item.label}
                        variant={equipment.includes(item.key) ? "filled" : "outlined"}
                        color={equipment.includes(item.key) ? "primary" : "default"}
                        onClick={() => toggleEquip(item.key)}
                        clickable
                        sx={{ borderRadius: "10px" }}
                    />
                ))}
            </Stack>
        </Box>
    );
}
