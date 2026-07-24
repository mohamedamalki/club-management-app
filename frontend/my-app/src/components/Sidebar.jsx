import {
    CalendarDays,
    LayoutDashboard,
    Users,
    X,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigation = [
    {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        name: "Seasons",
        path: "/seasons",
        icon: CalendarDays,
    },
    {
        name: "Teams",
        path: "/teams",
        icon: Users,
    },
];

export default function Sidebar({
    isOpen,
    onClose,
}) {
    function navigationClass({ isActive }) {
        const basicClasses =
            "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition";

        if (isActive) {
            return `${basicClasses} bg-blue-600 text-white`;
        }

        return `${basicClasses} text-slate-300 hover:bg-slate-800 hover:text-white`;
    }

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={onClose}
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                />
            )}

            <aside
                className={`
                    fixed inset-y-0 left-0 z-40 flex w-64
                    transform flex-col bg-slate-900
                    transition-transform duration-300
                    lg:translate-x-0
                    ${
                        isOpen
                            ? "translate-x-0"
                            : "-translate-x-full"
                    }
                `}
            >
                <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
                    <NavLink
                        to="/dashboard"
                        onClick={onClose}
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
                            CM
                        </div>

                        <div>
                            <p className="font-bold text-white">
                                Club Manager
                            </p>

                            <p className="text-xs text-slate-400">
                                Administration
                            </p>
                        </div>
                    </NavLink>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white lg:hidden"
                        aria-label="Close sidebar"
                    >
                        <X size={22} />
                    </button>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto p-4">
                    {navigation.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={navigationClass}
                            >
                                <Icon size={20} />

                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="border-t border-slate-800 p-4">
                    <p className="text-xs text-slate-500">
                        Club Management System
                    </p>
                </div>
            </aside>
        </>
    );
}
