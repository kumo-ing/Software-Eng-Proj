import React from "react";
import "./ForgetPassword.css";
import { useNavigate } from "react-router-dom";

const NewPassword = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-login-page main-container">
      <div className="container-forget-password">
        <div className="text-reset-password">Enter New Password</div>
        <input
          type="text"
          placeholder="Enter New Password"
          className="input-new-password"
        />
        <div
          className="button-new-password"
          onClick={() => navigate("/resetconfirmation")}
        >
          Reset
        </div>
      </div>
    </div>
  );
};

export default NewPassword;
