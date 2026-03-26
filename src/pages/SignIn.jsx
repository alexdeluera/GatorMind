import React, { useState } from "react";
import "../styles/SignIn.css";
import Nav from "../components/Nav.jsx";
import { signIn, signUp } from "../api";

function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter email and password.");
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }

      try {
        await signUp(email, password);
        setMessage("Account created. You can now sign in.");
        setIsSignUp(false);
        setPassword("");
        setConfirmPassword("");
      } catch (err) {
        setMessage(err.message || "Sign up failed.");
      }
    } else {
      try {
        const res = await signIn(email, password);
        const successMsg = res?.message || "sign in successfully";
        //alert(successMsg); // Required success prompt
        window.location.href = "./dashboard";
      } catch (err) {
        const errorMsg = err.message?.toLowerCase() || "";
          setMessage("Incorrect email or password. Please create an account or try again.");
      }
    }
  };

  return (
    <div>
      <Nav />
      <div className="page-container">
        <div className="content-wrapper">
          <div className="auth-box">
            <h2>{isSignUp ? "Create Account" : "Welcome Back!"}</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email">
                  <strong>Email</strong>
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="password">
                  <strong>Password</strong>
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {isSignUp && (
                <div className="mb-3">
                  <label htmlFor="confirmPassword">
                    <strong>Confirm Password</strong>
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}

              {message && <p className="mt-2 text-center">{message}</p>}

              <button type="submit" className="btn btn-primary">
                {isSignUp ? "Sign Up" : "Sign In"}
              </button>
            </form>

            <p className="mt-3 text-center">
              {isSignUp
                ? "Already have an account?"
                : "Don't have an account?"}
              <button
                type="button"
                className="toggle-btn"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage("");
                }}
             >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;