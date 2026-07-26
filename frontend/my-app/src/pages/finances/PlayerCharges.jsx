import { useEffect, useMemo, useState } from "react";
import {
    Banknote,
    CircleDollarSign,
    Pencil,
    Plus,
    Receipt,
    Search,
    Trash2,
    X,
} from "lucide-react";
import api from "../../api/axios";

const initialForm = {
    player_id: "",
    season_id: "",
    type: "registration",
    description: "",
    amount: "",
    due_date: "",
    status: "unpaid",
};

const typeOptions = [
    "registration",
    "monthly_fee",
    "equipment",
    "transport",
    "other",
];

const statusOptions = [
    "unpaid",
    "partially_paid",
    "paid",
    "cancelled",
];

export default function PlayerCharges() {
    const [charges, setCharges] = useState([]);
    const [players, setPlayers] = useState([]);
    const [seasons, setSeasons] = useState([]);

    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            api.get("/player-charges"),
            api.get("/players"),
            api.get("/seasons"),
        ])
            .then(
                ([
                    chargesResponse,
                    playersResponse,
                    seasonsResponse,
                ]) => {
                    if (!cancelled) {
                        setCharges(chargesResponse.data);
                        setPlayers(playersResponse.data);
                        setSeasons(seasonsResponse.data);
                    }
                }
            )
            .catch((error) => {
                if (!cancelled) {
                    setError(getErrorMessage(error));
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

    function getPaidAmount(charge) {
        return (charge.payments || []).reduce(
            (sum, payment) => sum + Number(payment.amount),
            0
        );
    }

    function getRemainingAmount(charge) {
        return Math.max(
            0,
            Number(charge.amount) - getPaidAmount(charge)
        );
    }

    const stats = useMemo(() => {
        const totalBilled = charges.reduce(
            (sum, charge) => sum + Number(charge.amount),
            0
        );

        const totalCollected = charges.reduce(
            (sum, charge) => sum + getPaidAmount(charge),
            0
        );

        return {
            total: charges.length,
            totalBilled,
            outstanding: Math.max(
                0,
                totalBilled - totalCollected
            ),
        };
    }, [charges]);

    const filteredCharges = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return charges;
        }

        return charges.filter((charge) => {
            const playerName =
                `${charge.player?.first_name ?? ""} ${charge.player?.last_name ?? ""}`.toLowerCase();

            return (
                playerName.includes(query) ||
                (charge.description || "")
                    .toLowerCase()
                    .includes(query) ||
                charge.type.toLowerCase().includes(query)
            );
        });
    }, [charges, search]);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    }

    function resetForm() {
        setFormData(initialForm);
        setEditingId(null);
        setError("");
    }

    function openAddForm() {
        resetForm();
        setIsFormOpen(true);
    }

    function handleEdit(charge) {
        setEditingId(charge.id);

        setFormData({
            player_id: String(charge.player_id),
            season_id: String(charge.season_id),
            type: charge.type,
            description: charge.description || "",
            amount: charge.amount,
            due_date: charge.due_date.slice(0, 10),
            status: charge.status,
        });

        setMessage("");
        setError("");
        setIsFormOpen(true);
    }

    function closeForm() {
        resetForm();
        setIsFormOpen(false);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setSubmitting(true);
        setMessage("");
        setError("");

        const payload = {
            ...formData,
            player_id: Number(formData.player_id),
            season_id: Number(formData.season_id),
            description: formData.description || null,
            amount: Number(formData.amount),
        };

        try {
            if (editingId) {
                const response = await api.put(
                    `/player-charges/${editingId}`,
                    payload
                );

                setCharges((previousCharges) =>
                    previousCharges.map((charge) =>
                        charge.id === editingId
                            ? {
                                  ...charge,
                                  ...response.data.data,
                              }
                            : charge
                    )
                );

                setMessage(
                    "Player charge updated successfully."
                );
            } else {
                const response = await api.post(
                    "/player-charges",
                    payload
                );

                setCharges((previousCharges) => [
                    {
                        ...response.data.data,
                        payments: [],
                    },
                    ...previousCharges,
                ]);

                setMessage(
                    "Player charge created successfully."
                );
            }

            resetForm();
            setIsFormOpen(false);
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this charge?"
        );

        if (!confirmed) {
            return;
        }

        setMessage("");
        setError("");

        try {
            await api.delete(`/player-charges/${id}`);

            setCharges((previousCharges) =>
                previousCharges.filter(
                    (charge) => charge.id !== id
                )
            );

            setMessage(
                "Player charge deleted successfully."
            );
        } catch (error) {
            setError(getErrorMessage(error));
        }
    }

    return (
        <section>
            {/* page header */}
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Player charges
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Bill players for fees, equipment, and other
                        charges.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A50044] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8a0038] disabled:cursor-not-allowed disabled:bg-[#A50044]/50"
                >
                    <Plus size={18} />
                    Add charge
                </button>
            </header>

            {/* toast messages */}
            {message && (
                <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {message}
                </p>
            )}

            {error && (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {/* summary stats */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    icon={Receipt}
                    label="Total charges"
                    value={stats.total}
                />
                <StatCard
                    icon={Banknote}
                    label="Total billed"
                    value={formatCurrency(stats.totalBilled)}
                    accent="text-[#004D98]"
                    iconBg="bg-[#004D98]/10"
                />
                <StatCard
                    icon={CircleDollarSign}
                    label="Outstanding"
                    value={formatCurrency(stats.outstanding)}
                    accent="text-[#A50044]"
                    iconBg="bg-[#A50044]/10"
                />
            </div>

            {/* table card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-4">
                    <div className="relative w-full max-w-xs">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search by player, type, description..."
                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15"
                        />
                    </div>

                    <p className="hidden text-sm text-slate-500 sm:block">
                        {filteredCharges.length}{" "}
                        {filteredCharges.length === 1
                            ? "charge"
                            : "charges"}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="p-10 text-center text-sm text-slate-500">
                            Loading charges...
                        </p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className={headingClasses}>
                                        Player
                                    </th>
                                    <th className={headingClasses}>
                                        Season
                                    </th>
                                    <th className={headingClasses}>
                                        Type
                                    </th>
                                    <th className={headingClasses}>
                                        Amount
                                    </th>
                                    <th className={headingClasses}>
                                        Remaining
                                    </th>
                                    <th className={headingClasses}>
                                        Due date
                                    </th>
                                    <th className={headingClasses}>
                                        Status
                                    </th>
                                    <th
                                        className={`${headingClasses} text-right`}
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredCharges.map((charge) => (
                                    <tr
                                        key={charge.id}
                                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                                    >
                                        <td
                                            className={`${cellClasses} font-medium text-slate-900`}
                                        >
                                            {
                                                charge.player
                                                    ?.first_name
                                            }{" "}
                                            {
                                                charge.player
                                                    ?.last_name
                                            }
                                        </td>

                                        <td className={cellClasses}>
                                            {charge.season?.name}
                                        </td>

                                        <td className={cellClasses}>
                                            <span className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                                                {charge.type.replaceAll(
                                                    "_",
                                                    " "
                                                )}
                                            </span>
                                        </td>

                                        <td
                                            className={`${cellClasses} font-medium text-slate-900`}
                                        >
                                            {formatCurrency(
                                                charge.amount
                                            )}
                                        </td>

                                        <td className={cellClasses}>
                                            {formatCurrency(
                                                getRemainingAmount(
                                                    charge
                                                )
                                            )}
                                        </td>

                                        <td className={cellClasses}>
                                            {charge.due_date.slice(
                                                0,
                                                10
                                            )}
                                        </td>

                                        <td className={cellClasses}>
                                            <StatusBadge
                                                status={
                                                    charge.status
                                                }
                                            />
                                        </td>

                                        <td
                                            className={`${cellClasses} text-right`}
                                        >
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEdit(
                                                            charge
                                                        )
                                                    }
                                                    aria-label="Edit charge"
                                                    title="Edit"
                                                    className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#004D98]"
                                                >
                                                    <Pencil
                                                        size={16}
                                                    />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            charge.id
                                                        )
                                                    }
                                                    aria-label="Delete charge"
                                                    title="Delete"
                                                    className="rounded-md p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2
                                                        size={16}
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!loading && filteredCharges.length === 0 && (
                        <p className="p-10 text-center text-sm text-slate-500">
                            {search
                                ? "No charges match your search."
                                : "No charges found."}
                        </p>
                    )}
                </div>
            </div>

            {/* add / edit modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
                    <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">
                                {editingId
                                    ? "Edit charge"
                                    : "Add charge"}
                            </h2>

                            <button
                                type="button"
                                onClick={closeForm}
                                aria-label="Close"
                                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Player
                                    </label>
                                    <select
                                        name="player_id"
                                        value={
                                            formData.player_id
                                        }
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    >
                                        <option value="">
                                            Select player
                                        </option>
                                        {players.map((player) => (
                                            <option
                                                key={player.id}
                                                value={player.id}
                                            >
                                                {
                                                    player.first_name
                                                }{" "}
                                                {player.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Season
                                    </label>
                                    <select
                                        name="season_id"
                                        value={
                                            formData.season_id
                                        }
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    >
                                        <option value="">
                                            Select season
                                        </option>
                                        {seasons.map((season) => (
                                            <option
                                                key={season.id}
                                                value={season.id}
                                            >
                                                {season.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Type
                                    </label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className={inputClasses}
                                    >
                                        {typeOptions.map(
                                            (option) => (
                                                <option
                                                    key={option}
                                                    value={option}
                                                >
                                                    {formatLabel(
                                                        option
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className={inputClasses}
                                    >
                                        {statusOptions.map(
                                            (option) => (
                                                <option
                                                    key={option}
                                                    value={option}
                                                >
                                                    {formatLabel(
                                                        option
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Amount
                                    </label>
                                    <input
                                        name="amount"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    />
                                </div>

                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Due date
                                    </label>
                                    <input
                                        name="due_date"
                                        type="date"
                                        value={
                                            formData.due_date
                                        }
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Description
                                </label>
                                <input
                                    name="description"
                                    value={
                                        formData.description
                                    }
                                    onChange={handleChange}
                                    placeholder="Optional note about this charge"
                                    className={inputClasses}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full rounded-lg bg-[#A50044] p-2.5 text-sm font-medium text-white transition hover:bg-[#8a0038] disabled:cursor-not-allowed disabled:bg-[#A50044]/50"
                                >
                                    {submitting
                                        ? "Saving..."
                                        : editingId
                                          ? "Update charge"
                                          : "Create charge"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    accent = "text-slate-900",
    iconBg = "bg-slate-100",
}) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBg}`}
            >
                <Icon size={20} className={accent} />
            </div>

            <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {label}
                </p>
                <p className="text-xl font-semibold text-slate-900">
                    {value}
                </p>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const base =
        "inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize";

    if (status === "paid") {
        return (
            <span className={`${base} bg-emerald-50 text-emerald-700`}>
                Paid
            </span>
        );
    }

    if (status === "partially_paid") {
        return (
            <span className={`${base} bg-[#FFED02]/20 text-[#8a7400]`}>
                Partially paid
            </span>
        );
    }

    if (status === "cancelled") {
        return (
            <span className={`${base} bg-slate-100 text-slate-500 line-through`}>
                Cancelled
            </span>
        );
    }

    return (
        <span className={`${base} bg-[#A50044]/10 text-[#A50044]`}>
            Unpaid
        </span>
    );
}

function formatLabel(value) {
    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(value) || 0);
}

function getErrorMessage(error) {
    const errors = error.response?.data?.errors;

    if (errors) {
        return Object.values(errors).flat()[0];
    }

    return (
        error.response?.data?.message ||
        "Something went wrong."
    );
}

const inputClasses =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15";

const labelClasses =
    "mb-1.5 block text-xs font-medium text-slate-600";

const headingClasses =
    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";

const cellClasses =
    "whitespace-nowrap px-4 py-3.5 text-sm text-slate-700";
