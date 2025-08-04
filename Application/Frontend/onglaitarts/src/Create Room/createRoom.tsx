import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./createRoom.module.css";
import backButton from "../resources/backButton.png";
import AddNickname from "../Join Room/Add Nickname/addNickname";

const CreateRoom: React.FC = () => {
  const [isSubmit, setIsSubmit] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [nickname, setNickname] = useState("");
  const navigate = useNavigate();

  const reset = () => {
    setIsSubmit(false);
    setRoomName("");
    setNickname("");
  };

  // Function to handle room name input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[a-zA-Z0-9]*$/.test(value)) {
      // alphanumeric only
      setRoomName(value);
    }
  };

  // Function to handle form submission
  const handleCreateRoom = () => {
    if (roomName.length > 0) {
      setIsSubmit(true);
    } else {
      alert("Please enter a valid Room Name.");
    }
  };

  const handleBackClick = () => {
    navigate(-1); // Navigate to the previous page
  };

  if (!isSubmit) {
    return (
      <div className={styles["main-style"]}>
        <img
          src={backButton}
          alt="Back"
          className={styles["back-button"]}
          onClick={handleBackClick}
        />
        <div className={styles["container-box"]}>
          <div className={styles.title}>
            <h1>Create Room</h1>
          </div>
          <div className={styles["input-container"]}>
            <input
              className={styles["input-style"]}
              type="text"
              placeholder="Enter Room Name"
              value={roomName}
              onChange={handleInputChange}
              maxLength={16} // Limit name length
            />
          </div>
          <div>
            <button onClick={handleCreateRoom} className={styles["button-style"]}>
              Enter
            </button>
          </div>
        </div>
        <div className={styles.pagination}>
          <div className={`${styles.circle} ${styles["solid-circle"]}`}></div>
          <div className={`${styles.circle} ${styles["hollow-circle"]}`}></div>
        </div>
      </div>
    );
  } else {
    return <AddNickname prev_state="createRoom" prev_info={roomName} nickname={nickname} setNickname={setNickname} reset={reset} />
  }
};

export default CreateRoom;
