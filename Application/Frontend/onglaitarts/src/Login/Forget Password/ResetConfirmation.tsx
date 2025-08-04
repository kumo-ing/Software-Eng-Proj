import React from "react";
import "./ForgetPassword.css";
import { useNavigate } from "react-router-dom";

const ResetConfirmation = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-login-page main-container">
      <div className="container-reset-confirmation">
        <div className="text-reset-password">Password has been reset.</div>
        <div className="button-new-password" onClick={() => navigate("/login")}>
          Login
        </div>
      </div>
    </div>
  );
};

export default ResetConfirmation;
