import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./joinRoom.module.css";
import backButton from "../../resources/backButton.png";
import AddNickname from "../Add Nickname/addNickname";

const JoinRoom: React.FC = () => {
  const [isSubmit, setIsSubmit] = useState(false);
  const [roomPin, setRoomPin] = useState("");
  const [nickname, setNickname] = useState("");
  const navigate = useNavigate();

  const reset = () => {
    setIsSubmit(false);
    setRoomPin("");
    setNickname("");
  }

  // Function to handle room name input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[a-zA-Z0-9]*$/.test(value)) {
      // alphanumeric only
      setRoomPin(value);
    }
  };

  // Function to handle form submission
  const handleJoinRoom = () => {
    if (roomPin.length === 8) {
      setIsSubmit(true);
    } else {
      alert("Please enter a valid Room PIN.");
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
            <h1>Join Room</h1>
          </div>
          <div className={styles["input-container"]}>
            <input
              className={styles["input-style"]}
              type="text"
              placeholder="Enter Room PIN"
              value={roomPin}
              onChange={handleInputChange}
              maxLength={16} // Limit name length
            />
          </div>
          <div>
            <button onClick={handleJoinRoom} className={styles["button-style"]}>
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
  }
  else {
    return <AddNickname prev_state="joinRoom" prev_info={roomPin} nickname={nickname} setNickname={setNickname} reset={reset} />
  }
};

export default JoinRoom;
