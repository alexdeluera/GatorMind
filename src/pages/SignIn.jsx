import React, { useState } from "react";
import "../styles/SignIn.css";
import Nav from '../components/Nav.jsx';

function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div> 
    <Nav />
    <div className="page-container">
      <div className="content-wrapper">
        <div className="auth-box">
          <h2>{isSignUp ? "Create Account" : "Welcome Back!"}</h2>

          <form>
            <div className="mb-3">
              <label htmlFor="email"><strong>Email</strong></label>
              <input
                type="email"
                id="email"
                placeholder="Enter Email"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password"><strong>Password</strong></label>
              <input
                type="password"
                id="password"
                placeholder="Enter Password"
              />
            </div>

            {isSignUp && (
              <div className="mb-3">
                <label htmlFor="confirmPassword"><strong>Confirm Password</strong></label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Confirm Password"
                />
              </div>
            )}

            <button type="button" className="btn btn-primary" onClick={() => window.location.href = "./dashboard"}>
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <p className="mt-3 text-center">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button
              className="toggle-btn"
              onClick={() => setIsSignUp(!isSignUp)}
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