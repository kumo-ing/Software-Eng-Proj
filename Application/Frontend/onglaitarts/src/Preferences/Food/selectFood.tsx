import React, { useState, useEffect } from "react";
import styles from "./selectFood.module.css";
import backButton from "../../resources/backButton.png";
import { Dropdown, Menu, Space, Typography } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { send_post, send_get } from "../../tools/request";
import { getAuthorisationHeader } from "../../tools/authorisation";

const items = [
  "Japanese", "Western", "Chinese", "Korean", "Indian", "Thai",
  "Vietnamese", "Malay", "Indonesian", "Italian", "Mexican",
  "Spanish", "French", "German", "Greek", "Turkish",
  "Middle Eastern", "African", "American"
];

interface SelectFoodProps {
  room_id: string;
  setShowSelectfood: React.Dispatch<React.SetStateAction<boolean>>;
}

const SelectFood: React.FC<SelectFoodProps> = ({ room_id, setShowSelectfood }) => {
  const [choice1, setChoice1] = useState<string>("");
  const [choice2, setChoice2] = useState<string>("");
  const [choice3, setChoice3] = useState<string>("");

  useEffect(() => {
    const fetchPreferences = async () => {
      const resp = await send_get(`/room_preference/cuisine/${room_id}`, getAuthorisationHeader());

      if (resp?.cuisines && Array.isArray(resp.cuisines)) {
        const [c1, c2, c3] = resp.cuisines;
        setChoice1(c1 || "");
        setChoice2(c2 || "");
        setChoice3(c3 || "");
      }
    };

    fetchPreferences();
  }, [room_id]);

  const handleBackClick = () => {
    setShowSelectfood(false)
  };

  const handleSubmit = async () => {
    const selectedChoices = [choice1, choice2, choice3].filter(Boolean);

    if (selectedChoices.length === 0) {
      alert("Please select at least one cuisine.");
      return;
    }

    const payload = {
      room_id: room_id,
      cuisines: selectedChoices,
    };

    try {
      const response = await send_post("/room_preference/cuisine/", payload, getAuthorisationHeader());
      if (!response.error) {
        alert("Preferences submitted successfully!");
        setShowSelectfood(false)
      } else {
        alert("Error: " + response.error);
      }
    } catch (err) {
      console.error("Error submitting cuisine preference:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  const menu = (
    setChoice: React.Dispatch<React.SetStateAction<string>>,
    exclude: string[]
  ) => (
    <Menu
      onClick={({ key }) => setChoice(key)}
      items={items
        .filter((cuisine) => !exclude.includes(cuisine))
        .map((cuisine) => ({ key: cuisine, label: cuisine }))}
    />
  );

  return (
    <div>
      <img
        src={backButton}
        alt="Back"
        className={styles["back-button"]}
        onClick={handleBackClick}
      />
      <div className={styles.container}>
        <h1 className={styles.header}>Food Preferences</h1>
        <div className={styles.selectionContainer}>
          <div className={styles.choice}>
            <label>Choice 1:</label>
            <div className={styles.dropdownContainer}>
              <Dropdown overlay={menu(setChoice1, [choice2, choice3])}>
                <Typography.Link className={styles.dropdown}>
                  <Space>
                    {choice1 || "Select Cuisine"}
                    <DownOutlined />
                  </Space>
                </Typography.Link>
              </Dropdown>
            </div>
          </div>
          <div className={styles.choice}>
            <label>Choice 2:</label>
            <div className={styles.dropdownContainer}>
              <Dropdown overlay={menu(setChoice2, [choice1, choice3])}>
                <Typography.Link className={styles.dropdown}>
                  <Space>
                    {choice2 || "Select Cuisine"}
                    <DownOutlined />
                  </Space>
                </Typography.Link>
              </Dropdown>
            </div>
          </div>
          <div className={styles.choice}>
            <label>Choice 3:</label>
            <div className={styles.dropdownContainer}>
              <Dropdown overlay={menu(setChoice3, [choice1, choice2])}>
                <Typography.Link className={styles.dropdown}>
                  <Space>
                    {choice3 || "Select Cuisine"}
                    <DownOutlined />
                  </Space>
                </Typography.Link>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
      <button className={styles.submitButton} onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
}

export default SelectFood;
