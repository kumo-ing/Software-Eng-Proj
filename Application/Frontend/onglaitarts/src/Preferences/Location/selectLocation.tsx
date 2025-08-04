import React, { useEffect, useState } from "react";
import styles from "./selectLocation.module.css";
import backButton from "../../resources/backButton.png";
import { Dropdown, Menu, Space, Typography } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { send_post, send_get } from "../../tools/request";
import { getAuthorisationHeader } from "../../tools/authorisation";

const items = [
  "Jurong West", "Jurong East", "Bukit Batok", "Clementi", "Pasir Ris",
  "Hougang", "Toa Payoh", "Woodlands", "Punggol", "City Hall",
  "Raffles Place", "Bugis", "Buona Vista", "Sengkang", "Serangoon",
  "East Coast", "Bukit Timah", "Tiong Bahru", "Johor Bahru"
];

interface SelectLocationProps {
  room_id: string;
  setShowSelectLocation: React.Dispatch<React.SetStateAction<boolean>>;
}

const SelectLocation: React.FC<SelectLocationProps> = ({ room_id, setShowSelectLocation }) => {
  const [choice1, setChoice1] = useState<string>("");
  const [choice2, setChoice2] = useState<string>("");
  const [choice3, setChoice3] = useState<string>("");

  useEffect(() => {
    const fetchPreferences = async () => {
      const resp = await send_get(`/room_preference/location/${room_id}`, getAuthorisationHeader());
      if (resp?.locations && Array.isArray(resp.locations)) {
        const [c1, c2, c3] = resp.locations;
        setChoice1(c1 || "");
        setChoice2(c2 || "");
        setChoice3(c3 || "");
      }
    };
    fetchPreferences();
  }, [room_id]);

  const handleSubmit = async () => {
    const selectedChoices = [choice1, choice2, choice3].filter(Boolean);
    if (selectedChoices.length === 0) {
      alert("Please select at least one location.");
      return;
    }

    const payload = {
      room_id: room_id,
      locations: selectedChoices,
    };

    try {
      const resp = await send_post("/room_preference/location/", payload, getAuthorisationHeader());
      if (!resp.error) {
        alert("Location preferences submitted!");
        setShowSelectLocation(false);
      } else {
        alert("Error: " + resp.error);
      }
    } catch (e) {
      console.error("Failed to submit locations", e);
      alert("Something went wrong.");
    }
  };

  const menu = (
    setChoice: React.Dispatch<React.SetStateAction<string>>,
    exclude: string[]
  ) => (
    <Menu
      onClick={({ key }) => setChoice(key)}
      items={items
        .filter((loc) => !exclude.includes(loc))
        .map((loc) => ({ key: loc, label: loc }))}
    />
  );

  return (
    <div>
      <img
        src={backButton}
        alt="Back"
        className={styles["back-button"]}
        onClick={() => setShowSelectLocation(false)}
      />
      <div className={styles.container}>
        <h1 className={styles.header}>Location Preferences</h1>
        <div className={styles.selectionContainer}>
          <div className={styles.choice}>
            <label>Choice 1:</label>
            <div className={styles.dropdownContainer}>
              <Dropdown overlay={menu(setChoice1, [choice2, choice3])}>
                <Typography.Link className={styles.dropdown}>
                  <Space>
                    {choice1 || "Select Location"}
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
                    {choice2 || "Select Location"}
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
                    {choice3 || "Select Location"}
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
};

export default SelectLocation;
