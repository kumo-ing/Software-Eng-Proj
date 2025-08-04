import { useState, useEffect } from "react";
import "./SignUp.css";
import { useNavigate } from "react-router-dom";
import EnterPassword from "./EnterPassword";
import AccountConfirmation from "./AccountConfirmation";
import EnterOTP from "./EnterOPT";




const SignUp = () => {
  const [page, setPage] = useState(0);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [number, setNumber] = useState("");

  const validateNumber = (value: string) => {
    if (/^\d*$/.test(value)) {
      setNumber(value);
    }
  };

  const toNextPage = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const numberRegex = /^[689]\d{7}$/;

    if (username === "" || username.length < 6) {
      window.alert("Please enter a username with more than 6 characters!");
    }
    else if (!emailRegex.test(email)) {
      window.alert("Invalid Email!");
    }
    else if (!numberRegex.test(number)) {
      window.alert("Please enter a valid Singapore number!");
    }
    else {
      setPage(1)
    }
  }

  if (page === 0) {
    return (
      <div className="bg-login-page main-container">
        <div className="container-sign-up">
          <div className="text-enter-password">Enter Personal Information</div>
          <input
            type="text"
            placeholder="Enter Username"
            className="input-sign-up"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            placeholder="Enter Email"
            className="input-sign-up"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter Number"
            className="input-sign-up"
            value={number}
            onChange={(e) => validateNumber(e.target.value)}
          />
          <div
            className="button-sign-up"
            onClick={() => toNextPage()}
          >
            Next
          </div>
        </div>
      </div>
    );
  }
  else if (page === 1) {
    return <EnterPassword email={email} username={username} number={number} setPage={setPage} />
  }
  else if (page == 2) {
    return <EnterOTP email={email} setPage={setPage} />
  }
  else {
    return <AccountConfirmation />
  }
};

export default SignUp;
