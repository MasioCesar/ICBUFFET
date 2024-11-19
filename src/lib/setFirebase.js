import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export const setRegisterUser = async (detailsUser) => {
    try {
        await setDoc(doc(db, "users", auth.currentUser.uid), {
            email: detailsUser.email,
            userName: detailsUser.userName,
            owner: false,
        });
    } catch (error) {
        console.log(error)
        alert(error)
    }
}

import { updateDoc, arrayUnion } from "firebase/firestore";

export const setRegisterReservation = async (reservationDetails) => {
    try {
        // Validação de dados
        if (
            !reservationDetails.restaurantId ||
            !reservationDetails.tableNumber ||
            !reservationDetails.reservationDate ||
            !reservationDetails.reservationTime ||
            !reservationDetails.tableUid
        ) {
            throw new Error("Todos os campos obrigatórios devem ser preenchidos!");
        }

        if (
            !Array.isArray(reservationDetails.orders) ||
            reservationDetails.orders.some(order => order === undefined)
        ) {
            throw new Error("O campo 'orders' contém valores inválidos.");
        }

        const userRef = doc(db, "users", auth.currentUser.uid);

        // Atualização no Firestore
        await updateDoc(userRef, {
            reservations: arrayUnion({
                restaurantId: reservationDetails.restaurantId,
                tableNumber: reservationDetails.tableNumber,
                reservationDate: reservationDetails.reservationDate,
                reservationTime: reservationDetails.reservationTime,
                orders: reservationDetails.orders || [],
                tableUid: reservationDetails.tableUid,
            }),
        });
    } catch (error) {
        console.error(error);
        alert(error.message || error);
    }
};

export const saveReservation = async (tableId, reservationDetails) => {
  try {
    // Referência ao documento da mesa no Firestore
    const tableRef = doc(db, `restaurant/${reservationDetails.restaurantId}/mesas`, tableId);

    // Adiciona a nova reserva ao array `reservations`
    await updateDoc(tableRef, {
      reservations: arrayUnion(reservationDetails),
    });

    console.log("Reserva salva com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar a reserva:", error);
    throw error;
  }
};
