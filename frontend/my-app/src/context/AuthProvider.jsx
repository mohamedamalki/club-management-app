import {
    useEffect,
    useState,
} from "react";

import api from "../api/axios";
import AuthContext from "./AuthContext";

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function login(credentials) {
        const response = await api.post("/login", credentials);

        const token = response.data.token;
        const authenticatedUser = response.data.user;

        sessionStorage.setItem("token", token);
        sessionStorage.setItem(
            "user",
            JSON.stringify(authenticatedUser)
        );

        setUser(authenticatedUser);

        return authenticatedUser;
    }

    async function logout() {
        try {
            await api.post("/logout");
        } finally {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            setUser(null);
        }
    }

    useEffect(() => {
        async function checkAuthentication() {
            const token = sessionStorage.getItem("token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get("/me");
                setUser(response.data.user);
            } catch {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        checkAuthentication();
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
export default AuthProvider

