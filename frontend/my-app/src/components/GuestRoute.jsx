import { Navigate } from "react-router-dom";
import  useAuth  from "../hooks/useAuth";

export default function GuestRoute({ children }) {
    const {
        isAuthenticated,
        loading,
    } = useAuth();

    if (loading) {
        return (
            <p className="p-6 text-center">
                Checking authentication...
            </p>
        );
    }

    if (isAuthenticated) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    return children;
}
