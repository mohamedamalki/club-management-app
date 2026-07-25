import {
    LogOut,
    Menu,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Navbar({
    onOpenSidebar,
}) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/login", {
            replace: true,
        });
    }

    const firstLetter =
        user?.name?.charAt(0).toUpperCase() || "A";

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onOpenSidebar}
                    className="rounded-lg p-2 text-[#0A1330] transition hover:bg-slate-100 lg:hidden"
                    aria-label="Open sidebar"
                >
                    <Menu size={24} />
                </button>

                <div>
                    <p className="font-[Barlow_Condensed,Inter,sans-serif] font-semibold uppercase tracking-tight text-[#0A1330]">
                        Administration
                    </p>

                    <p className="hidden text-xs text-slate-500 sm:block">
                        Manage your club
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium text-[#0A1330]">
                        {user?.name}
                    </p>

                    <p className="text-xs capitalize text-slate-500">
                        {user?.role}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#A50044]/10 font-bold text-[#A50044]">
                    {firstLetter}
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-[#A50044]/10 hover:text-[#A50044]"
                    aria-label="Logout"
                    title="Logout"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
}
