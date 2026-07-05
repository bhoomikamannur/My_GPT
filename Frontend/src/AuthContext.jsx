import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "./api.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true); // true while we check for an existing session
    const [authError, setAuthError] = useState("");

    // On first load, if a token is stored, validate it against the backend
    useEffect(() => {
        const token = localStorage.getItem("mygpt_token");
        if (!token) {
            setAuthLoading(false);
            return;
        }

        apiFetch("/auth/me")
            .then(async (res) => {
                if (!res.ok) throw new Error("session expired");
                const data = await res.json();
                setUser(data.user);
            })
            .catch(() => {
                localStorage.removeItem("mygpt_token");
                setUser(null);
            })
            .finally(() => setAuthLoading(false));
    }, []);

    const register = async (name, email, password) => {
        setAuthError("");
        try {
            const res = await apiFetch("/auth/register", {
                method: "POST",
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                setAuthError(data.error || "Failed to register");
                return false;
            }
            localStorage.setItem("mygpt_token", data.token);
            setUser(data.user);
            return true;
        } catch (err) {
            setAuthError("Could not reach the server. Please try again.");
            return false;
        }
    };

    const login = async (email, password) => {
        setAuthError("");
        try {
            const res = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                setAuthError(data.error || "Failed to log in");
                return false;
            }
            localStorage.setItem("mygpt_token", data.token);
            setUser(data.user);
            return true;
        } catch (err) {
            setAuthError("Could not reach the server. Please try again.");
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem("mygpt_token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, authLoading, authError, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
