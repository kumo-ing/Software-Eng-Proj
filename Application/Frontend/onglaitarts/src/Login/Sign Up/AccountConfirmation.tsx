import React from "react";
import { useNavigate } from "react-router-dom";

const AccountConfirmation = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-login-page main-container">
      <div className="container-account-confirmation">
        <div className="text-enter-password">Account has been created.</div>
        <div className="button-sign-up" onClick={() => navigate("/login")}>
          Login
        </div>
      </div>
    </div>
  );
};

export default AccountConfirmation;
