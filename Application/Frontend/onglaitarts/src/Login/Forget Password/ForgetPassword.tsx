import React from "react";
import "./ForgetPassword.css";
import { useNavigate } from "react-router-dom";

const ForgetPassword = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-login-page main-container">
      <div className="container-forget-password">
        <div className="text-reset-password">Reset Your Password</div>
        <input
          type="text"
          placeholder="Enter Email"
          className="input-new-password"
        />
        <div
          className="button-new-password"
          onClick={() => navigate("/newpassword")}
        >
          Next
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;
