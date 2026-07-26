import {
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";

import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import Seasons from "./pages/seasons/Seasons";
import Teams from "./pages/teams/Teams";

import Coaches from "./pages/coaches/Coaches";
import CoachAssignments from "./pages/coaches/CoachAssignments";

import Players from "./pages/players/Players";
import PlayerAssignments from "./pages/players/PlayerAssignments";

import Guardians from "./pages/guardians/Guardians";

import PlayerCharges from "./pages/finances/PlayerCharges";
import Payments from "./pages/finances/Payments";

import Expenses from "./pages/finances/Expenses";
import CoachPayments from "./pages/finances/CoachPayments";

import NotFound from "./pages/NotFound";

export default function App() {
    return (
        <Routes>
            {/* Public route */}
            <Route
                path="/login"
                element={
                    <GuestRoute>
                        <Login />
                    </GuestRoute>
                }
            />

            {/* Protected routes */}
            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route
                    index
                    element={
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    }
                />

                <Route
                    path="dashboard"
                    element={<Dashboard />}
                />

                {/* Club management */}
                <Route
                    path="seasons"
                    element={<Seasons />}
                />

                <Route
                    path="teams"
                    element={<Teams />}
                />

                {/* Coaches */}
                <Route
                    path="coaches"
                    element={<Coaches />}
                />

                <Route
                    path="coach-assignments"
                    element={<CoachAssignments />}
                />

                {/* Players and guardians */}
                <Route
                    path="players"
                    element={<Players />}
                />

                <Route
                    path="player-assignments"
                    element={<PlayerAssignments />}
                />

                <Route
                    path="guardians"
                    element={<Guardians />}
                />

                {/* Finances */}
                <Route
                    path="player-charges"
                    element={<PlayerCharges />}
                />

                <Route
                    path="payments"
                    element={<Payments />}
                />

                <Route
                    path="expenses"
                    element={<Expenses />}
                />

                <Route
                    path="coach-payments"
                    element={<CoachPayments />}
                />
            </Route>

            <Route
                path="*"
                element={<NotFound />}
            />
        </Routes>
    );
}
