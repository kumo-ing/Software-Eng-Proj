import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { send_post } from "../../tools/request";
import backButton from "../../resources/backButton.png";
import styles from "./EnterPassword.module.css"

interface enterOTPProps {
    email: string;
    setPage: React.Dispatch<React.SetStateAction<number>>;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const EnterOTP: React.FC<enterOTPProps> = ({ email, setPage }) => {
    const navigate = useNavigate();
    const [pin, setPin] = useState("");
    const [timeLeft, setTimeLeft] = useState(300);
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer); // Cleanup on unmount
    }, []);

    const handleSubmit = async () => {
        if (pin === "") {
            window.alert("Fill in your OPT code!")
        }
        else if (expired) {
            window.alert("OTP has expired. Please go back and try again.");
            return;
        }
        else {
            const resp = await send_post("/users/verify_otp/", {
                email: email,
                otp: pin
            });

            if (resp["error"]) {
                window.alert("Error, please try again. If problem persist, contact administrator.");
            }
            else {
                window.alert("Account Created!")
                navigate("/login")
            }
        }
    }

    return (
        <div className="bg-login-page main-container">
            <img
                src={backButton}
                alt="Back"
                className={styles["back-button"]}
                onClick={() => setPage(0)}
            />
            <div className="container-sign-up">
                <div className="text-enter-password">Enter OTP</div>
                <div style={{ marginBottom: "10px", fontWeight: "bold", color: timeLeft < 1 ? "red" : "black" }}>
                    Time left: {formatTime(timeLeft)}
                </div>
                <input
                    type="text"
                    placeholder="OPT"
                    className="input-sign-up"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                />
                <div
                    className="button-sign-up"
                    onClick={() => handleSubmit()}>
                    Submit
                </div>
            </div>
        </div>
    );
};

export default EnterOTP;
