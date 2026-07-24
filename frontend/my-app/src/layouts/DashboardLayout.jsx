import { useState } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] =
        useState(false);

    function openSidebar() {
        setIsSidebarOpen(true);
    }

    function closeSidebar() {
        setIsSidebarOpen(false);
    }

    return (
        <div className="min-h-screen bg-slate-100">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={closeSidebar}
            />

            <div className="lg:pl-64">
                <Navbar
                    onOpenSidebar={openSidebar}
                />

                <main className="p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
