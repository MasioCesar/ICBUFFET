"use client"
import { createContext } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";

export const GetContext = createContext(null);

export const GetProvider = ({ children }) => {
    const getUserDetails = async () => {
        const ref = doc(db, "users", auth.currentUser.uid);
        const data = await getDoc(ref)

        return data.data();
    }

    const getReservations = async (setComandas) => {
        try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const reservations = userDoc.data().reservations || [];
                setComandas(reservations)
            } else {
                console.warn("Documento do usuário não encontrado.");
            }
        } catch (error) {
            console.error("Erro ao buscar reservas:", error);
        }
    };

    const cancelReservation = async (reservationIndex) => {
        try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const reservations = userDoc.data().reservations || [];
                reservations.splice(reservationIndex, 1); // Remove a reserva do array
                await updateDoc(userRef, {
                    reservations: reservations
                });
            } else {
                console.warn("Documento do usuário não encontrado.");
            }
        } catch (error) {
            console.error("Erro ao cancelar a reserva:", error);
        }
    };

    const cancelRestaurantReservation = async (restaurantId, tableId, reservationIndex) => {
        try {
            // Referência para a mesa específica no Firestore
            const tableRef = doc(db, `restaurant/${restaurantId}/mesas`, tableId);

            // Obtém o documento da mesa
            const tableDoc = await getDoc(tableRef);

            if (tableDoc.exists()) {
                const tableData = tableDoc.data();
                const reservations = tableData.reservations || [];

                console.log("Reservas atuais:", reservations); // Log para verificação

                if (reservationIndex >= 0 && reservationIndex < reservations.length) {
                    // Remove a reserva com base no índice
                    reservations.splice(reservationIndex, 1);

                    // Atualiza o documento com a nova lista de reservas
                    await updateDoc(tableRef, {
                        reservations: reservations,
                    });

                    console.log("Reserva cancelada com sucesso!");
                } else {
                    console.warn("Índice de reserva inválido."); // Mantém o aviso em caso de erro
                }
            } else {
                console.warn("Mesa não encontrada no restaurante.");
            }
        } catch (error) {
            console.error("Erro ao cancelar a reserva no restaurante:", error);
            throw error;
        }
    };



    const logoutUser = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem("restaurantId");
            console.log("Usuário desconectado");
            console.log("restaurantId removido do localStorage");
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    return (
        <GetContext.Provider
            value={{
                getUserDetails,
                getReservations,
                cancelReservation,
                logoutUser,
                cancelRestaurantReservation
            }}
        >
            {children}
        </GetContext.Provider>
    );
}
