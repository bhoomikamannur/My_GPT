import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

function ProtectedRoute({ children }) {
    const { user, authLoading } = useAuth();

    if (authLoading) {
        return null; // could show a spinner here while session check is in flight
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
