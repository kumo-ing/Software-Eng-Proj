import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { send_post } from "../../tools/request";
import backButton from "../../resources/backButton.png";
import styles from "./EnterPassword.module.css"
import LoadingOverlay from "../../tools/LoadingOverlay";

interface enterPasswordProps {
  email: string;
  username: string;
  number: string;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

const EnterPassword: React.FC<enterPasswordProps> = ({ email, username, number, setPage }) => {
  const [password, setPassword] = useState("");
  const [repassword, setRePassword] = useState("");
  const [showLoad, setShowLoad] = useState(false)

  const handleSignUp = async () => {
    if (password !== repassword) {
      window.alert("Password does not match!")
    }
    else if (password.length < 8) {
      window.alert("Password need to be at least 8 characters!")
    }
    else {
      setShowLoad(true)
      const resp = await send_post("/users/signup/", {
        username: username,
        email: email,
        number: number,
        password: password
      });

      if (resp["error"]) {
        setShowLoad(false)
        window.alert(resp.error);
      }
      else {
        setPage(2);
      }
    }
  }

  return (
    <div className="bg-login-page main-container">
      <LoadingOverlay showLoad={showLoad} />
      <img
        src={backButton}
        alt="Back"
        className={styles["back-button"]}
        onClick={() => setPage(0)}
      />
      <div className="container-sign-up">
        <div className="text-enter-password">Enter Password</div>
        <input
          type="password"
          placeholder="Enter Password"
          className="input-sign-up"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Re-enter Password"
          className="input-sign-up"
          value={repassword}
          onChange={(e) => setRePassword(e.target.value)}
        />
        <div
          className="button-sign-up"
          onClick={() => handleSignUp()}
        >
          Create Account
        </div>
      </div>
    </div>
  );
};

export default EnterPassword;
