import React from 'react';
import {
    Box,
    Button,
    Grid,
    Paper,
    Stack,
    Typography,
    Chip,
} from '@mui/material';
import {
    Add as AddIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    CheckCircleOutline,
    EventBusy,
    Build,
    TrendingUp,
} from '@mui/icons-material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';

const AudienceCatalog: React.FC = () => {
    return (
        <Box sx={{ mb: 6 }}>
            {}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                mb={4}
                spacing={{ xs: 2, sm: 0 }}
            >
                <Box>
                    <Typography variant="h4" fontWeight={600} color="#111927">
                        Каталог аудиторий
                    </Typography>
                    <Typography variant="body2" color="#6C737F" mt={0.5}>
                        Управляйте информацией об аудиториях, их оборудованием и местоположением
                    </Typography>
                </Box>

                <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: '#CBD5E1',
                            color: '#384250',
                            '&:hover': {
                                borderColor: '#1d4ed8',
                                bgcolor: '#EFF6FF'
                            },
                        }}
                    >
                        Экспорт JSON
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: '#CBD5E1',
                            color: '#384250',
                            '&:hover': {
                                borderColor: '#1d4ed8',
                                bgcolor: '#EFF6FF'
                            },
                        }}
                    >
                        Импорт JSON
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            bgcolor: '#1d4ed8',
                            '&:hover': { bgcolor: '#1e40af' },
                        }}
                    >
                        Добавить аудиторию
                    </Button>
                </Stack>
            </Stack>

            {}
            <Grid container spacing={3}>
                {}
                <Grid size={{ xs: 12, md: 3, sm: 6}}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            height: '100%',
                            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                            border: '1px solid #DDE5EF',
                            bgcolor: '#FCFCFD',
                        }}
                    >
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Box
                                    sx={{
                                        bgcolor: '#EFF6FF',
                                        color: '#1d4ed8',
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <MeetingRoomIcon fontSize="small" />
                                </Box>
                                <Chip
                                    icon={<TrendingUp fontSize="small" sx={{ color: '#0B7A5B' }} />}
                                    label="+12%"
                                    size="small"
                                    sx={{
                                        bgcolor: '#ECFDF3',
                                        color: '#067647',
                                        fontWeight: 500,
                                        fontSize: '0.75rem',
                                        height: 24,
                                        '& .MuiChip-icon': {
                                            color: '#0B7A5B !important',
                                            marginLeft: '4px'
                                        }
                                    }}
                                />
                            </Stack>
                            <Typography variant="h4" fontWeight={500} color="#111927" mb={0.5}>
                                24
                            </Typography>
                            <Typography variant="body2" color="#6C737F">
                                Всего аудиторий
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/** Доступные сейчас */}
                <Grid size={{ xs: 12, md: 3, sm: 6}}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            height: '100%',
                            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                            border: '1px solid #DDE5EF',
                            bgcolor: '#FCFCFD',
                        }}
                    >
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Box
                                    sx={{
                                        bgcolor: '#ECFDF3',
                                        color: '#0B7A5B',
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <CheckCircleOutline fontSize="small" />
                                </Box>
                                <Chip
                                    label="Активно"
                                    size="small"
                                    sx={{
                                        bgcolor: '#ECFDF3',
                                        color: '#067647',
                                        fontWeight: 500,
                                        fontSize: '0.75rem',
                                        height: 24
                                    }}
                                />
                            </Stack>
                            <Typography variant="h4" fontWeight={500} color="#111927" mb={0.5}>
                                18
                            </Typography>
                            <Typography variant="body2" color="#6C737F">
                                Доступные сейчас
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/** Забронированы */}
                <Grid size={{ xs: 12, md: 3, sm: 6}}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            height: '100%',
                            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                            border: '1px solid #DDE5EF',
                            bgcolor: '#FCFCFD',
                        }}
                    >
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Box
                                    sx={{
                                        bgcolor: '#FFFAEB',
                                        color: '#B54708',
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <EventBusy fontSize="small" />
                                </Box>
                                <Chip
                                    label="Занято"
                                    size="small"
                                    sx={{
                                        bgcolor: '#FFFAEB',
                                        color: '#B54708',
                                        fontWeight: 500,
                                        fontSize: '0.75rem',
                                        height: 24
                                    }}
                                />
                            </Stack>
                            <Typography variant="h4" fontWeight={500} color="#111927" mb={0.5}>
                                6
                            </Typography>
                            <Typography variant="body2" color="#6C737F">
                                Забронированы
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/** Единиц оборудования */}
                <Grid size={{ xs: 12, md: 3, sm: 6}}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            height: '100%',
                            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                            border: '1px solid #DDE5EF',
                            bgcolor: '#FCFCFD',
                        }}
                    >
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Box
                                    sx={{
                                        bgcolor: '#F9F5FF',
                                        color: '#7A5AF8',
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Build fontSize="small" />
                                </Box>
                                <Chip
                                    label="Обновлено"
                                    size="small"
                                    sx={{
                                        bgcolor: '#F9F5FF',
                                        color: '#7A5AF8',
                                        fontWeight: 500,
                                        fontSize: '0.75rem',
                                        height: 24
                                    }}
                                />
                            </Stack>
                            <Typography variant="h4" fontWeight={500} color="#111927" mb={0.5}>
                                156
                            </Typography>
                            <Typography variant="body2" color="#6C737F">
                                Единиц оборудования
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
export default AudienceCatalog;
