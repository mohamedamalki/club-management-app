import {
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import GuestRoute from "./components/GuestRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Seasons from "./pages/Seasons/Seasons";
import Teams from "./pages/teams/Teams";

export default function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <GuestRoute>
                        <Login />
                    </GuestRoute>
                }
            />

            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                <Route
                    path="/seasons"
                    element={<Seasons />}
                />

                <Route
                    path="/teams"
                    element={<Teams />}
                />
            </Route>

            <Route
                path="/"
                element={
                    <Navigate
                        to="/dashboard"
                        replace
                    />
                }
            />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
