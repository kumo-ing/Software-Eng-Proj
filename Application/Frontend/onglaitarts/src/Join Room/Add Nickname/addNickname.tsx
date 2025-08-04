import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./addNickname.module.css";
import backButton from "../../resources/backButton.png";
import { send_post, send_put } from "../../tools/request";
import { getAuthorisationHeader } from "../../tools/authorisation";

interface addNicknameProps {
  prev_state: string;
  prev_info: string;
  nickname: string;
  setNickname: (nickname: string) => void;
  reset: () => void;
}

const AddNickname: React.FC<addNicknameProps> = ({ prev_state, prev_info, nickname, setNickname, reset }) => {
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[a-zA-Z0-9]*$/.test(value)) {
      // alphanumeric only
      setNickname(value);
    }
  };

  const handleNicknameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(nickname.length <= 12 && nickname.length > 0)) {
      window.alert("Nickname must be between 0 and 12 characters");
    }

    if (prev_state === "joinRoom") {
      console.log(`Joining Room with PIN: ${prev_info}`, nickname);
      const resp = await send_put("/rooms/", { room_code: prev_info, nickname: nickname }, getAuthorisationHeader());

      if (resp["error"]) {
        window.alert(resp.error);
        reset();
      }
      else {
        console.log("Room joined successfully", resp);
        navigate("/viewrooms");
      }

    } else if (prev_state === "createRoom") {
      console.log(`Creating Room with Name: ${prev_info}`, nickname);
      const resp = await send_post("/rooms/", { roomname: prev_info, nickname: nickname }, getAuthorisationHeader());

      if (resp["error"]) {
        window.alert(resp.error);
        reset();
      }
      else {
        console.log("Room created successfully", resp);
        navigate("/viewrooms");
      }
    }
  };

  const handleBackClick = () => {
    navigate(-1); // Navigate to the previous page
  };

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
          <h1>Enter Your Nickname</h1>
        </div>
        <div className={styles["input-container"]}>
          <input
            className={styles["input-style"]}
            type="text"
            placeholder="Enter Nickname"
            value={nickname}
            onChange={handleChange}
            maxLength={12} // Limit length
          />
          <div>
            <button
              onClick={handleNicknameSubmit}
              className={styles["button-style"]}
            >
              Enter
            </button>
          </div>
        </div>
      </div>
      <div className={styles.pagination}>
        <div className={`${styles.circle} ${styles["hollow-circle"]}`}></div>
        <div className={`${styles.circle} ${styles["solid-circle"]}`}></div>
      </div>
    </div>
  );
};

export default AddNickname;
