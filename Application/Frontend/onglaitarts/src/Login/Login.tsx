import "./Login.css";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import React, { useEffect, useState } from 'react';
import { send_post } from "../tools/request";
import { CredentialResponse } from "@react-oauth/google";
import { isLoggedIn, saveCookie } from "../tools/authorisation"

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/home");
    }
  }, [navigate]);

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    const resp = await send_post("/users/oauth/google/", { credential: credentialResponse.credential })

    if (!resp["error"]) {
      saveCookie(resp.access_token)
      navigate("/home")
    } else {
      setErrorMsg("Login fail!")
    }
  };

  const normal_login = async () => {
    const payload = {
      email: email,
      password: password,
    };
    const resp = await send_post("/users/", payload)

    if (!resp["error"]) {
      saveCookie(resp.access_token);
      navigate("/home");
    } else {
      setErrorMsg("Login fail!")
    }
  }


  return (
    <div className="bg-login-page main-container">
      <div className="container">
        <div className="text-login">Login</div>
        <input
          type="text"
          placeholder="Enter Email"
          className="input-text"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="input-text"
          onChange={(e) => setPassword(e.target.value)}
        />
        <div>{errorMsg}</div>
        <div
          className="text-forgot-password"
          onClick={() => navigate("/forgetpassword")}
        >
          Forgot Password
        </div>
        <div className="sign-in-button" onClick={() => normal_login()}>
          Sign in
        </div>
        <div className="text-or">
          -------------------------------- Or --------------------------------
        </div>
        <div>
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (!credentialResponse.credential) {
                console.log("No credential received.");
              } else {
                handleGoogleLogin(credentialResponse);
                // console.log(credentialResponse); 
              }
            }}
            onError={() => {
              console.log("Login Failed");
            }}
          />
        </div>
        {/* <div className="sign-in-google">Sign in with Google</div> */}
        <div className="text-sign-up">
          Don't have account?
          <div className="sign-up" onClick={() => navigate("/signup")}>
            {" "}
            Sign up Now.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
