import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import styles from './viewRooms.module.css';
import backButton from '../resources/backButton.png';
import { send_delete, send_get } from "../tools/request";
import { getAuthorisationHeader } from "../tools/authorisation";

interface Room {
  id: string;
  name: string;
  pin: string;
  noOfPeople: number;
  date: string | null;
}

const ViewRooms: React.FC = () => {
  const navigate = useNavigate();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [confirmationIsOpen, setConfirmationIsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [sortCriteria, setSortCriteria] = useState<keyof Room>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const resp = await send_get("/rooms/", getAuthorisationHeader());

    if (resp["error"]) {
      window.alert(resp.error);
    }
    else {
      const roomList: Room[] = resp.rooms.map((room: any) => ({
        id: room.id,
        name: room.name,
        pin: room.room_code,
        noOfPeople: room.member_count,
        date: room.date, // might be null
      }));

      setRooms(roomList);
    }
  };

  const handleBackClick = () => {
    navigate(-1); // Navigate to the previous page
  };

  const handleCircleClick = (room: Room) => {
    setSelectedRoom(room);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedRoom(null);
  };

  const handleExitGroupClick = () => {
    setModalIsOpen(false);
    setConfirmationIsOpen(true);
  };

  const handleConfirmExit = async () => {
    const resp = await send_delete("/rooms/", { room_id: selectedRoom?.id }, getAuthorisationHeader());

    if (resp["error"]) {
      window.alert(resp.error);
    } else {
      window.alert("You have successfully left the group!");
      fetchRooms()
    }
    setConfirmationIsOpen(false);
    setSelectedRoom(null);
  };

  const handleCancelExit = () => {
    setConfirmationIsOpen(false);
    setSelectedRoom(null);
  };

  const handleSort = (criteria: keyof Room) => {
    const order = sortCriteria === criteria && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortCriteria(criteria);
    setSortOrder(order);
  };

  const openRoom = (roomId: string) => {
    navigate(`/roomchat/${roomId}`);
  }

  const sortedRooms = [...rooms].sort((a, b) => {
    const aValue = a[sortCriteria];
    const bValue = b[sortCriteria];

    if (aValue === null) return 1;
    if (bValue === null) return -1;

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>View Rooms</h1>
      <img
        src={backButton}
        alt="Back"
        className={styles['back-button']}
        onClick={handleBackClick}
      />
      <table className={styles.table}>
        <thead>
          <tr>
            <th onClick={() => handleSort('name')}>Room Name</th>
            <th onClick={() => handleSort('pin')}>Room PIN</th>
            <th onClick={() => handleSort('noOfPeople')}>No of People</th>
            <th onClick={() => handleSort('date')}>Date and Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedRooms.map((room, index) => (
            <tr key={index}>
              <td onClick={() => openRoom(room.id)}>{room.name}</td>
              <td>{room.pin}</td>
              <td>{room.noOfPeople}</td>
              <td>{room.date ? room.date : 'N/A'}</td>
              <td>
                <div className={styles['circle-container']}>
                  <div className={styles.circle} onClick={() => handleCircleClick(room)}></div>
                  <div className={styles.circle} onClick={() => handleCircleClick(room)}></div>
                  <div className={styles.circle} onClick={() => handleCircleClick(room)}></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedRoom && (
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="Room Details"
          className={styles.modal}
          overlayClassName={styles.overlay}
        >
          <h2>{selectedRoom.name}</h2>
          <p>PIN: {selectedRoom.pin}</p>
          <p>No of People: {selectedRoom.noOfPeople}</p>
          <p>Date: {selectedRoom.date ? selectedRoom.date : 'N/A'}</p>
          <button onClick={handleExitGroupClick} className={styles.exitButton}>Exit Group</button>
        </Modal>
      )}

      {confirmationIsOpen && (
        <Modal
          isOpen={confirmationIsOpen}
          onRequestClose={handleCancelExit}
          contentLabel="Confirm Exit"
          className={styles.modal}
          overlayClassName={styles.overlay}
        >
          <h2>Are you sure you want to exit?</h2>
          <button onClick={handleConfirmExit} className={styles.exitButton}>Exit</button>
          <button onClick={handleCancelExit} className={styles.cancelButton}>Cancel</button>
        </Modal>
      )}
    </div>
  );
};

export default ViewRooms;