import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    CalendarDays,
    CreditCard,
    ChevronDown,
    LayoutDashboard,
    Receipt,
    UserRound,
    Users,
    WalletCards,
    X,
    Handshake,
    Building2,
    FileSignature,
    Banknote
} from "lucide-react";

const navigation = [
    {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        name: "Club management",
        icon: Users,
        children: [
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
        ],
    },
    {
        name: "People",
        icon: UserRound,
        children: [
            {
                name: "Players",
                path: "/players",
                icon: Users,
            },
            {
                name: "Guardians",
                path: "/guardians",
                icon: UserRound,
            },
            {
                name: "Coaches",
                path: "/coaches",
                icon: UserRound,
            },
        ],
    },
    {
        name: "Finances",
        icon: WalletCards,
        children: [
            {
                name: "Player charges",
                path: "/player-charges",
                icon: Receipt,
            },
            {
                name: "Payments",
                path: "/payments",
                icon: CreditCard,
            },
            {
                name: "Expenses",
                path: "/expenses",
                icon: Receipt,
            },
            {
                name: "Coach payments",
                path: "/coach-payments",
                icon: WalletCards,
            },
        ],
    },
    {
        name: "Sponsors Management" ,
        icon : Handshake  ,
        children: [
            {
                name: "Sponsors",
                path: "/sponsors",
                icon: Building2,
            },
            {
                name:"SponsorShips",
                path: "/sponsor-ships",
                icon:FileSignature
            },
            {
                name:"SponsorshipPayments",
                path:"/sponsorship-payments",
                icon:Banknote
            }
        ]
    }
];

export default function Sidebar({ isOpen, onClose }) {
    const [openMenu, setOpenMenu] = useState("");

    function toggleMenu(menuName) {
        setOpenMenu((currentMenu) =>
            currentMenu === menuName ? "" : menuName
        );
    }

    function linkClasses({ isActive }) {
        const base =
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition";

        if (isActive) {
            return `${base} bg-[#A50044] text-white`;
        }

        return `${base} text-white/60 hover:bg-white/5 hover:text-white`;
    }

    function childLinkClasses({ isActive }) {
        const base =
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition";

        if (isActive) {
            return `${base} bg-[#A50044] text-white`;
        }

        return `${base} text-white/50 hover:bg-white/5 hover:text-white`;
    }

    return (
        <>
            {/* mobile overlay */}
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
                    transform flex-col overflow-y-auto bg-[#0A1330]
                    transition-transform duration-300
                    lg:translate-x-0
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
                    <NavLink
                        to="/dashboard"
                        onClick={onClose}
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#0A1330] text-sm font-bold text-white">
                            CM
                        </div>

                        <div>
                            <p className="font-[Barlow_Condensed,Inter,sans-serif] font-bold uppercase tracking-tight text-white">
                                Club Manager
                            </p>
                            <p className="text-xs text-white/40">
                                Administration
                            </p>
                        </div>
                    </NavLink>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-white/50 hover:text-white lg:hidden"
                        aria-label="Close sidebar"
                    >
                        <X size={22} />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 p-4">
                    {navigation.map((item) => {
                        const Icon = item.icon;

                        if (!item.children) {
                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    onClick={onClose}
                                    className={linkClasses}
                                >
                                    <Icon size={19} />
                                    <span>{item.name}</span>
                                </NavLink>
                            );
                        }

                        const isMenuOpen =
                            openMenu === item.name;

                        return (
                            <div key={item.name}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleMenu(item.name)
                                    }
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
                                >
                                    <span className="flex items-center gap-3">
                                        <Icon size={19} />
                                        {item.name}
                                    </span>

                                    <ChevronDown
                                        size={16}
                                        className={`transition-transform ${
                                            isMenuOpen
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                    />
                                </button>

                                {isMenuOpen && (
                                    <div className="mt-1 space-y-1 pl-6">
                                        {item.children.map(
                                            (child) => {
                                                const ChildIcon =
                                                    child.icon;

                                                return (
                                                    <NavLink
                                                        key={
                                                            child.name
                                                        }
                                                        to={
                                                            child.path
                                                        }
                                                        onClick={
                                                            onClose
                                                        }
                                                        className={
                                                            childLinkClasses
                                                        }
                                                    >
                                                        <ChildIcon
                                                            size={
                                                                16
                                                            }
                                                        />
                                                        {
                                                            child.name
                                                        }
                                                    </NavLink>
                                                );
                                            }
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="shrink-0 border-t border-white/10 p-4">
                    <p className="text-xs text-white/30">
                        Club Management System
                    </p>
                </div>
            </aside>
        </>
    );
}
