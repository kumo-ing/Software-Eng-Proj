import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import styles from "./spinTheWheel.module.css";
import backButton from "../resources/backButton.png";
import { Wheel } from "react-custom-roulette";

interface StyleType {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
}

interface WheelDataItem {
  option: string;
  style: StyleType;
}

const styleType1: StyleType = {
  backgroundColor: "pink",
  textColor: "black",
  fontSize: 30,
};

const styleType2: StyleType = {
  backgroundColor: "#B3EBF2",
  textColor: "black",
  fontSize: 30,
};

const styleType3: StyleType = {
  backgroundColor: "#FFEE8C",
  textColor: "black",
  fontSize: 30,
};

const wheelData: WheelDataItem[] = [
  { option: "0", style: styleType1 },
  { option: "1", style: styleType2 },
  { option: "2", style: styleType3 },
];

const SpinTheWheel: React.FC = () => {
  const navigate = useNavigate();
  const [mustSpin, setMustSpin] = useState(false);
  const [foodSelected, setFoodSelected] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const handleBackClick = () => {
    navigate(-1); // Navigate to the previous page
  };

  const handleSpinClick = () => {
    const newFoodSelected = Math.floor(Math.random() * wheelData.length);
    setFoodSelected(newFoodSelected);
    setMustSpin(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate("/roomchat");
  };

  return (
    <div className={styles["main-style"]}>
      <img
        src={backButton}
        alt="Back"
        className={styles["back-button"]}
        onClick={handleBackClick}
      />
      <div className={styles["title"]}>
        <h1>Spin The Wheel</h1>
      </div>
      <div className={styles["container-box"]}>
        <div className={styles["wheelBox"]}>
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={foodSelected}
            data={wheelData}
            backgroundColors={["#3e3e3e", "#df3428"]}
            textColors={["#ffffff"]}
            spinDuration={0.5}
            onStopSpinning={() => {
              setMustSpin(false);
              setShowModal(true);
            }}
          />
        </div>
        <div className={styles["input-container"]}>
          <button className={styles["spin-button"]} onClick={handleSpinClick}>
            Spin
          </button>
        </div>
      </div>
      {showModal && (
        <div className={styles["modal"]}>
          <div className={styles["modal-content"]}>
            <h2>Congratulations!</h2>
            <p>Food Selected:</p>
            <p>{wheelData[foodSelected].option}</p>
            <button
              className={styles["modal-button"]}
              onClick={handleModalClose}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpinTheWheel;
