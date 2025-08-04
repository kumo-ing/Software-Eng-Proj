import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./selectDate.module.css";
import backButton from "../../resources/backButton.png";
import xIcon from "../../resources/x-icon.png";
import { Calendar, Button, Checkbox } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { send_post } from "../../tools/request";
import { getAuthorisationHeader } from "../../tools/authorisation";
import { send_get } from "../../tools/request";

const mealOptions = ["Breakfast", "Lunch", "Dinner", "Supper"];

interface selectDateProps {
  room_id: string;
  setShowAddTime: React.Dispatch<React.SetStateAction<boolean>>;
}

const SelectDate: React.FC<selectDateProps> = ({ room_id, setShowAddTime }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [selections, setSelections] = useState<
    { date: Dayjs; meals: string[] }[]
  >([]);

  useEffect(() => {
    fetch_dates();
  }, []);

  const fetch_dates = async () => {
    const url = "/room_preference/time/" + room_id + "/";
    const resp = await send_get(url, getAuthorisationHeader());

    if (resp["error"]) {
      window.alert("Error fetching availability!");
    } else if (resp["availability"]) {
      const loadedSelections = resp.availability.map((entry: any) => ({
        date: dayjs(entry.date),
        meals: entry.meals,
      }));
      setSelections(loadedSelections);
    }
  };


  const handleBackClick = () => {
    setShowAddTime(false)
  };

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
  };

  const handleMealChange = (checkedValues: string[]) => {
    setSelectedMeals(checkedValues);
  };

  const disabledDate = (current: Dayjs) => {
    // Disable dates that are before today
    return current && current < dayjs().startOf("day");
  };

  const handleAddClick = () => {
    if (!selectedDate || selectedMeals.length === 0) {
      alert("Please select a date and at least one meal option.");
      return;
    }

    const isOverlap = selections.some((selection) =>
      selection.date.isSame(selectedDate, "day")
    );

    if (isOverlap) {
      alert("This date has already been selected. Please choose another date.");
      return;
    }

    setSelections([
      ...selections,
      { date: selectedDate, meals: selectedMeals },
    ]);
    setSelectedDate(null);
    setSelectedMeals([]);
  };

  const handleSubmitClick = async () => {
    if (selections.length === 0) {
      alert("Please add at least one selection before submitting.");
      return;
    }

    const resp = await send_post("/room_preference/time/", { room_id: room_id, availibility: selections }, getAuthorisationHeader());

    if (resp["error"]) {
      window.alert(resp.error);
    }
    else {
      window.alert("Time preference added successfully!");
      setShowAddTime(false)
    }
  };

  const handleRemoveClick = (index: number) => {
    setSelections(selections.filter((_, i) => i !== index));
  };

  return (
    <div>
      <img
        src={backButton}
        alt="Back"
        className={styles["back-button"]}
        onClick={handleBackClick}
      />
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.header}>Select Your Availability</h1>
          <div className={styles.calendarContainer}>
            <div className={styles.dateSelector}>
              <Calendar
                fullscreen={false}
                onSelect={handleDateSelect}
                disabledDate={disabledDate}
              />
            </div>
            <div className={styles.mealOptions}>
              {mealOptions.map((meal) => (
                <Checkbox
                  key={meal}
                  value={meal}
                  checked={selectedMeals.includes(meal)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectedMeals((prev) =>
                      checked ? [...prev, meal] : prev.filter((m) => m !== meal)
                    );
                  }}
                  className={styles.checkbox}
                >
                  {meal}
                </Checkbox>
              ))}
            </div>
          </div>
          <div className={styles.selectedList}>
            <h2>Selected Dates and Meals</h2>
            <ul>
              {selections.map((selection, index) => (
                <li key={index}>
                  {selection.date.format("YYYY-MM-DD")}:{" "}
                  {selection.meals.join(", ")}
                  <img
                    src={xIcon}
                    alt="Remove"
                    className={styles["remove-icon"]}
                    onClick={() => handleRemoveClick(index)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className={styles.buttonContainer}>
          <Button
            className={styles.buttonStyle}
            type="primary"
            onClick={handleAddClick}
          >
            Add
          </Button>
          <Button
            className={styles.buttonStyle}
            type="primary"
            onClick={handleSubmitClick}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectDate;
