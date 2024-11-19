"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  TextField,
  InputLabel,
  Grid,
  Container,
  Snackbar,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Image from "next/image";
import CloseIcon from "@mui/icons-material/Close";
import { zoomEffectStyles } from "../styles";
import { Header } from "@/components/header";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import useAuth from "../hooks/useAuth";

const Table = ({ status, onClick, isSelected }) => (
  <Box
    sx={{
      ...(status === "available" ? zoomEffectStyles : {}),
      borderRadius: "8px",
      boxSizing: "border-box",
      boxShadow: isSelected ? "0 0 0 4px rgba(202, 154, 85, 0.90)" : "none",
      opacity: status === "unavailable" ? 0.5 : 1,
      userSelect: "none",
    }}
    className="p-2"
    onClick={status === "available" ? onClick : undefined}
  >
    <div className="flex justify-center m-2">
      <Image
        src={status === "available" ? "/available.png" : "/unavailable.png"}
        alt={status === "available" ? "Disponível" : "Indisponível"}
        width={120}
        height={120}
      />
    </div>
  </Box>
);

const TableDialog = ({ open, onClose, table, data, hora, onConfirm }) => {
  const formatDate = (date) => {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="text-xl md:text-2xl font-bold font-roboto relative">
        <IconButton
          color="inherit"
          onClick={onClose}
          aria-label="close"
          className="text-white absolute top-0 right-0"
        >
          <CloseIcon />
        </IconButton>
        <div className="text-center block">
          Informações de Reserva da Mesa {table?.number}
        </div>
        <div className="text-center block">
          Data: {formatDate(data)} - Hora: {hora}
        </div>
      </DialogTitle>

      <DialogContent className="flex flex-col justify-center items-center p-2 font-bold font-roboto">
        <Button
          type="submit"
          variant="contained"
          className="max-w-[400px] h-[60px] p-8 my-4 bg-[#bc8c4e] hover:bg-[#D58A1E] text-base font-bold rounded font-roboto"
          onClick={onConfirm}
        >
          Continuar Reserva
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function AvailableTables() {
  const router = useRouter();
  const userLogin = useAuth();
  const { setUser } = useUser();
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(today.getHours() - 3); // Ajusta para UTC−3
    return today.toISOString().split("T")[0]; // Formata a data de hoje como YYYY-MM-DD
  });
  const [selectedTime, setSelectedTime] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [tables, setTables] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleClickOpenDialog = () => {
    if (selectedTable) {
      setDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSelectTable = (table) => {
    if (isTableAvailable(table)) {
      setSelectedTable(table);
    }
  };

  const handleConfirmReservation = () => {
    if (selectedTable) {
      const mesaId = selectedTable.number; // Certifique-se de que o ID esteja disponível
      const mesaUid = selectedTable.id;
      setDialogOpen(false);

      const userData = {
        time: selectedTime,
        date: selectedDate,
      };
      setUser(userData); // Salva o horário da reserva no contexto do usuário

      // Redireciona para menuSchedule com o ID da mesa
      localStorage.setItem("mesaUid", mesaUid);
      router.push(`/menuSchedule/${mesaId}`);
    }
  };

  const isTableAvailable = (table) => {
    if (!selectedDate || !selectedTime) {
      return false; // Se data ou horário não estiverem selecionados, considere indisponível
    }
  
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
  
    // Verifica se o horário está dentro de 2 horas de uma reserva existente
    return !table.reservations.some((reservation) => {
      const reservationDateTime = new Date(
        `${reservation.reservationDate}T${reservation.reservationTime}:00`
      );
  
      const timeDifference = Math.abs(
        reservationDateTime.getTime() - selectedDateTime.getTime()
      );
  
      return timeDifference < 1.5 * 60 * 60 * 1000; // 2 horas em milissegundos
    });
  };

  const gerarHorariosDisponiveis = (openTime, closeTime, selectedDate) => {
    const horarios = [];
    const startTime = new Date(`1970-01-01T${openTime}:00.000Z`);
    const endTime = new Date(`1970-01-01T${closeTime}:00.000Z`);
    startTime.setMinutes(startTime.getMinutes() + 15);
    endTime.setMinutes(endTime.getMinutes() - 60);

    const now = new Date();
    const selectedDateObj = new Date(`${selectedDate}T${openTime}:00.000Z`);
    const isToday = selectedDateObj.toDateString() === now.toDateString();

    while (startTime <= endTime) {
      const hours = String(startTime.getUTCHours()).padStart(2, "0");
      const minutes = String(startTime.getUTCMinutes()).padStart(2, "0");
      const currentTime = `${hours}:${minutes}`;

      if (isToday) {
        const currentTimeInMinutes =
          now.getHours() * 60 + now.getMinutes();
        const timeInMinutes =
          startTime.getUTCHours() * 60 + startTime.getUTCMinutes();

        if (timeInMinutes >= currentTimeInMinutes) {
          horarios.push(currentTime);
        }
      } else {
        horarios.push(currentTime);
      }

      startTime.setMinutes(startTime.getMinutes() + 15);
    }

    return horarios;
  };

  useEffect(() => {
    const storedRestaurantId = localStorage.getItem("restaurantId");

    if (storedRestaurantId) {
      const fetchRestaurants = async () => {
        try {
          const response = await fetch(`/api/restaurant/${storedRestaurantId}`);
          const data = await response.json();

          setRestaurant(data);

          const horarios = gerarHorariosDisponiveis(
            data.abre,
            data.fecha,
            selectedDate
          );
          setHorariosDisponiveis(horarios);

          const mesasComReservas = data.mesas.map((mesa) => ({
            id: mesa.id,
            number: mesa.number,
            reservations: mesa.reservations || [],
          }));
          setTables(mesasComReservas);
        } catch (error) {
          console.error("Erro ao buscar restaurantes:", error);
        }
      };

      fetchRestaurants();
    }
  }, [selectedDate]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#231013] xl:overflow-hidden">
      <Header />
      <Box component="main" sx={{ flexGrow: 1, py: 4, pt: 1 }}>
        <Container maxWidth="lg" className="h-full">
          <div className="text-center text-xl pb-2">
            {!selectedDate || !selectedTime ? (
              <span className="font-bold lg:text-2xl md:text-2xl text-[#bc8c4e]">
                Selecione o dia e horário da reserva
              </span>
            ) : (
              undefined
            )}
          </div>
          <div className="flex items-center gap-4 p-4 pt-2 pb-0">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md="auto">
                <div className="text-2xl text-white font-bold">
                  Dia e Horário da reserva:
                </div>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  label="Data"
                  className="bg-[#411313] rounded"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="label-horario">Horário</InputLabel>
                  <Select
                    labelId="label-horario"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    label="Horário"
                    className="bg-[#411313] rounded"
                    MenuProps={{
                      anchorOrigin: {
                        vertical: "bottom",
                        horizontal: "left",
                      },
                      transformOrigin: {
                        vertical: "top",
                        horizontal: "left",
                      },
                      PaperProps: { style: { maxHeight: 300 } },
                    }}
                  >
                    {horariosDisponiveis.map((horario) => (
                      <MenuItem key={horario} value={horario}>
                        {horario}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </div>
          <div className="flex flex-col items-center mt-4">
            <Grid container spacing={4} justifyContent="center" alignItems="center">
              {tables.map((table) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={table.id}>
                  <Table
                    status={isTableAvailable(table) ? "available" : "unavailable"}
                    isSelected={selectedTable?.id === table.id}
                    onClick={() => handleSelectTable(table)}
                  />
                </Grid>
              ))}
            </Grid>
          </div>
          <div className="flex justify-center my-6 pt-[10%] lg:pt-2 2xl:pt-10">
            <Button
              variant="contained"
              className={`w-full max-w-[364px] h-[55px] rounded p-2 mt-4 font-bold ${
                selectedTable && isTableAvailable(selectedTable)
                  ? "text-lg font-poppins bg-[#bc8c4e] text-white hover:bg-[#D58A1E]"
                  : "text-lg font-poppins bg-[rgba(188,140,78,0.5)] text-[#a9a9a9]"
              }`}
              onClick={handleClickOpenDialog}
              disabled={!selectedTable || !isTableAvailable(selectedTable)}
            >
              Reservar Mesa
            </Button>
          </div>
          <TableDialog
            open={dialogOpen}
            onClose={handleCloseDialog}
            table={selectedTable}
            data={selectedDate}
            hora={selectedTime}
            onConfirm={handleConfirmReservation}
          />
        </Container>
      </Box>
    </div>
  );
}
