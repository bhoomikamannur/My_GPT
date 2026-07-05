import "./Auth.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

function Register() {
    const { register, authError } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const success = await register(name, email, password);
        setSubmitting(false);
        if (success) navigate("/");
    };

    return (
        <div className="authPage">
            <div className="authCard">
                <img src="/src/assets/blacklogo.png" alt="MyGPT logo" />
                <h1>Create your MyGPT account</h1>

                {authError && <p className="authError">{authError}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="authField">
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
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
                            minLength={6}
                            required
                        />
                    </div>
                    <button className="authSubmit" type="submit" disabled={submitting}>
                        {submitting ? "Creating account..." : "Sign up"}
                    </button>
                </form>

                <p className="authSwitch">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
