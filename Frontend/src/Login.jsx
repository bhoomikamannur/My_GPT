import "./Auth.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

function Login() {
    const { login, authError } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const success = await login(email, password);
        setSubmitting(false);
        if (success) navigate("/");
    };

    return (
        <div className="authPage">
            <div className="authCard">
                <img src="/src/assets/blacklogo.png" alt="MyGPT logo" />
                <h1>Log in to MyGPT</h1>

                {authError && <p className="authError">{authError}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="authField">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="authField">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className="authSubmit" type="submit" disabled={submitting}>
                        {submitting ? "Logging in..." : "Log in"}
                    </button>
                </form>

                <p className="authSwitch">
                    Don't have an account? <Link to="/register">Sign up</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
