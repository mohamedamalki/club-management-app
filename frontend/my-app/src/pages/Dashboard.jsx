import {
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    CalendarDays,
    CircleDollarSign,
    ClipboardList,
    CreditCard,
    Receipt,
    ShieldCheck,
    TrendingUp,
    UserRound,
    Users,
    WalletCards,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { Link } from "react-router-dom";

import api from "../api/axios";
import useAuth from "../hooks/useAuth";

export default function Dashboard() {
    const { user } = useAuth();

    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [charges, setCharges] = useState([]);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            api.get("/teams"),
            api.get("/players"),
            api.get("/coaches"),
            api.get("/seasons"),
            api.get("/player-charges"),
            api.get("/payments"),
            api.get("/expenses"),
        ])
            .then((responses) => {
                if (cancelled) return;

                setTeams(getList(responses[0]));
                setPlayers(getList(responses[1]));
                setCoaches(getList(responses[2]));
                setSeasons(getList(responses[3]));
                setCharges(getList(responses[4]));
                setPayments(getList(responses[5]));
                setExpenses(getList(responses[6]));
            })
            .catch((requestError) => {
                if (!cancelled) {
                    setError(getErrorMessage(requestError));
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const statistics = useMemo(() => {
        const activePlayers = players.filter(
            (player) => player.status === "active"
        ).length;

        const activeCoaches = coaches.filter(
            (coach) => coach.status === "active"
        ).length;

        const activeSeason = seasons.find(
            (season) => season.status === "active"
        );

        const totalIncome = payments.reduce(
            (total, payment) =>
                total + Number(payment.amount || 0),
            0
        );

        const totalExpenses = expenses.reduce(
            (total, expense) =>
                total + Number(expense.amount || 0),
            0
        );

        const totalCharges = charges
            .filter((charge) => charge.status !== "cancelled")
            .reduce(
                (total, charge) =>
                    total + Number(charge.amount || 0),
                0
            );

        const outstanding = Math.max(
            totalCharges - totalIncome,
            0
        );

        return {
            activePlayers,
            activeCoaches,
            activeSeason,
            totalIncome,
            totalExpenses,
            outstanding,
            balance: totalIncome - totalExpenses,
        };
    }, [
        players,
        coaches,
        seasons,
        payments,
        expenses,
        charges,
    ]);

    const recentPayments = useMemo(() => {
        return [...payments]
            .sort(
                (first, second) =>
                    new Date(second.payment_date) -
                    new Date(first.payment_date)
            )
            .slice(0, 5);
    }, [payments]);

    const collectionRate = useMemo(() => {
        const totalCharges = charges
            .filter((charge) => charge.status !== "cancelled")
            .reduce(
                (total, charge) =>
                    total + Number(charge.amount || 0),
                0
            );

        if (totalCharges === 0) return 0;

        return Math.min(
            Math.round(
                (statistics.totalIncome / totalCharges) * 100
            ),
            100
        );
    }, [charges, statistics.totalIncome]);

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <section className="space-y-6">
            {/* Welcome section */}
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-lg sm:p-8">
                <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-2xl" />
                <div className="absolute bottom-0 right-32 h-28 w-28 rounded-full bg-cyan-400/10 blur-xl" />

                <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-sm text-blue-200">
                            <ShieldCheck size={17} />
                            Administrator dashboard
                        </div>

                        <h1 className="text-2xl font-bold sm:text-3xl">
                            Welcome back, {user?.name ?? "Admin"}
                        </h1>

                        <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
                            Here is an overview of the club,
                            members and financial activity.
                        </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                        <p className="text-xs uppercase tracking-wider text-slate-300">
                            Active season
                        </p>

                        <div className="mt-2 flex items-center gap-3">
                            <CalendarDays
                                className="text-blue-300"
                                size={22}
                            />

                            <p className="font-semibold">
                                {statistics.activeSeason?.name ??
                                    "No active season"}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Main statistics */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Teams"
                    value={teams.length}
                    description="Registered club teams"
                    icon={Users}
                    color="blue"
                />

                <StatCard
                    title="Active players"
                    value={statistics.activePlayers}
                    description={`${players.length} total players`}
                    icon={UserRound}
                    color="emerald"
                />

                <StatCard
                    title="Active coaches"
                    value={statistics.activeCoaches}
                    description={`${coaches.length} total coaches`}
                    icon={ClipboardList}
                    color="violet"
                />

                <StatCard
                    title="Outstanding"
                    value={formatCurrency(
                        statistics.outstanding
                    )}
                    description="Remaining player charges"
                    icon={CircleDollarSign}
                    color="amber"
                />
            </div>

            {/* Financial overview */}
            <div className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Financial overview
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Club income and expense summary
                            </p>
                        </div>

                        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                            <TrendingUp size={22} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <FinanceCard
                            title="Total income"
                            value={formatCurrency(
                                statistics.totalIncome
                            )}
                            icon={ArrowUpRight}
                            style="text-emerald-600 bg-emerald-50"
                        />

                        <FinanceCard
                            title="Total expenses"
                            value={formatCurrency(
                                statistics.totalExpenses
                            )}
                            icon={ArrowDownRight}
                            style="text-red-600 bg-red-50"
                        />

                        <FinanceCard
                            title="Current balance"
                            value={formatCurrency(
                                statistics.balance
                            )}
                            icon={WalletCards}
                            style={
                                statistics.balance >= 0
                                    ? "text-blue-600 bg-blue-50"
                                    : "text-red-600 bg-red-50"
                            }
                        />
                    </div>

                    <div className="mt-7">
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-600">
                                Player payment collection
                            </p>

                            <p className="text-sm font-bold text-slate-800">
                                {collectionRate}%
                            </p>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
                                style={{
                                    width: `${collectionRate}%`,
                                }}
                            />
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                            Percentage of player charges that
                            have been collected.
                        </p>
                    </div>
                </div>

                {/* Quick actions */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800">
                        Quick actions
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Access frequently used pages
                    </p>

                    <div className="mt-5 space-y-2">
                        <QuickAction
                            title="Add a player"
                            path="/players"
                            icon={UserRound}
                            color="bg-blue-50 text-blue-600"
                        />

                        <QuickAction
                            title="Create a charge"
                            path="/player-charges"
                            icon={Receipt}
                            color="bg-amber-50 text-amber-600"
                        />

                        <QuickAction
                            title="Record payment"
                            path="/payments"
                            icon={CreditCard}
                            color="bg-emerald-50 text-emerald-600"
                        />

                        <QuickAction
                            title="Add expense"
                            path="/expenses"
                            icon={WalletCards}
                            color="bg-red-50 text-red-600"
                        />
                    </div>
                </div>
            </div>

            {/* Recent payments and club summary */}
            <div className="grid gap-6 xl:grid-cols-3">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-100 p-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Recent payments
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Latest payments received
                            </p>
                        </div>

                        <Link
                            to="/payments"
                            className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                            View all
                            <ArrowRight size={16} />
                        </Link>
                    </div>

                    {recentPayments.length === 0 ? (
                        <div className="p-10 text-center">
                            <CreditCard
                                size={36}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-3 text-sm text-slate-500">
                                No payments have been recorded.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {recentPayments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50 sm:px-6"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="rounded-full bg-emerald-50 p-2.5 text-emerald-600">
                                            <CreditCard size={18} />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-800">
                                                {getPlayerName(
                                                    payment
                                                )}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {formatDate(
                                                    payment.payment_date
                                                )}
                                                {" · "}
                                                {formatPaymentMethod(
                                                    payment.payment_method
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="whitespace-nowrap text-sm font-bold text-emerald-600">
                                        +
                                        {formatCurrency(
                                            payment.amount
                                        )}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800">
                        Club summary
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Current registered resources
                    </p>

                    <div className="mt-6 space-y-5">
                        <SummaryRow
                            label="Players"
                            value={players.length}
                            color="bg-blue-500"
                        />

                        <SummaryRow
                            label="Coaches"
                            value={coaches.length}
                            color="bg-violet-500"
                        />

                        <SummaryRow
                            label="Teams"
                            value={teams.length}
                            color="bg-emerald-500"
                        />

                        <SummaryRow
                            label="Seasons"
                            value={seasons.length}
                            color="bg-amber-500"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    color,
}) {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        violet: "bg-violet-50 text-violet-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-800">
                        {value}
                    </p>
                </div>

                <div
                    className={`rounded-xl p-3 ${
                        colors[color]
                    }`}
                >
                    <Icon size={22} />
                </div>
            </div>

            <p className="mt-4 text-xs text-slate-400">
                {description}
            </p>
        </article>
    );
}

function FinanceCard({
    title,
    value,
    icon: Icon,
    style,
}) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <div className={`mb-3 w-fit rounded-lg p-2 ${style}`}>
                <Icon size={19} />
            </div>

            <p className="text-xs font-medium text-slate-500">
                {title}
            </p>

            <p className="mt-1 text-lg font-bold text-slate-800">
                {value}
            </p>
        </div>
    );
}

function QuickAction({
    title,
    path,
    icon: Icon,
    color,
}) {
    return (
        <Link
            to={path}
            className="group flex items-center justify-between rounded-xl p-3 transition hover:bg-slate-50"
        >
            <span className="flex items-center gap-3">
                <span className={`rounded-lg p-2 ${color}`}>
                    <Icon size={18} />
                </span>

                <span className="text-sm font-medium text-slate-700">
                    {title}
                </span>
            </span>

            <ArrowRight
                size={17}
                className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
            />
        </Link>
    );
}

function SummaryRow({ label, value, color }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span
                    className={`h-2.5 w-2.5 rounded-full ${color}`}
                />

                <span className="text-sm text-slate-600">
                    {label}
                </span>
            </div>

            <span className="font-bold text-slate-800">
                {value}
            </span>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                    <div
                        key={item}
                        className="h-32 animate-pulse rounded-2xl bg-slate-200"
                    />
                ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
                <div className="h-72 animate-pulse rounded-2xl bg-slate-200 xl:col-span-2" />
                <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
            </div>
        </div>
    );
}

function getList(response) {
    if (Array.isArray(response.data)) {
        return response.data;
    }

    if (Array.isArray(response.data?.data)) {
        return response.data.data;
    }

    return [];
}

function getPlayerName(payment) {
    const player = payment.player_charge?.player;

    if (!player) {
        return "Player payment";
    }

    return `${player.first_name} ${player.last_name}`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("fr-MA", {
        style: "currency",
        currency: "MAD",
        minimumFractionDigits: 2,
    }).format(Number(amount || 0));
}

function formatDate(date) {
    if (!date) return "No date";

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
}

function formatPaymentMethod(method) {
    if (!method) return "Unknown";

    return method
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}

function getErrorMessage(error) {
    return (
        error.response?.data?.message ||
        "Unable to load dashboard information."
    );
}
