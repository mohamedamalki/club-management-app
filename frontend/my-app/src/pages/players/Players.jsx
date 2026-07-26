import { useEffect, useMemo, useState } from "react";
import {
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    ShieldOff,
    Trash2,
    Users,
    X,
} from "lucide-react";
import api from "../../api/axios";

const initialForm = {
    first_name: "",
    last_name: "",
    gender: "male",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    status: "active",
    notes: "",
};

export default function Players() {
    const [players, setPlayers] = useState([]);
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

        api.get("/players")
            .then((response) => {
                if (!cancelled) {
                    setPlayers(response.data);
                }
            })
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

    const stats = useMemo(() => {
        return {
            total: players.length,
            active: players.filter((p) => p.status === "active")
                .length,
            inactive: players.filter(
                (p) => p.status === "inactive"
            ).length,
        };
    }, [players]);

    const filteredPlayers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return players;
        }

        return players.filter((player) => {
            const fullName =
                `${player.first_name} ${player.last_name}`.toLowerCase();

            return (
                fullName.includes(query) ||
                (player.email || "")
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [players, search]);

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

    function handleEdit(player) {
        setEditingId(player.id);

        setFormData({
            first_name: player.first_name,
            last_name: player.last_name,
            gender: player.gender || "male",
            email: player.email || "",
            phone: player.phone || "",
            address: player.address || "",
            date_of_birth: formatInputDate(
                player.date_of_birth
            ),
            status: player.status,
            notes: player.notes || "",
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
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            date_of_birth: formData.date_of_birth || null,
            notes: formData.notes || null,
        };

        try {
            if (editingId) {
                const response = await api.put(
                    `/players/${editingId}`,
                    payload
                );

                setPlayers((previousPlayers) =>
                    previousPlayers.map((player) =>
                        player.id === editingId
                            ? response.data.data
                            : player
                    )
                );

                setMessage("Player updated successfully.");
                setTimeout(()=>{
                    setMessage("")
                }, 3000)
            } else {
                const response = await api.post(
                    "/players",
                    payload
                );

                setPlayers((previousPlayers) => [
                    response.data.data,
                    ...previousPlayers,
                ]);

                setMessage("Player created successfully.");
                setTimeout(()=>{
                    setMessage("")
                }, 3000)
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
            "Are you sure you want to delete this player?"
        );

        if (!confirmed) {
            return;
        }

        setMessage("");
        setError("");

        try {
            await api.delete(`/players/${id}`);

            setPlayers((previousPlayers) =>
                previousPlayers.filter(
                    (player) => player.id !== id
                )
            );

            setMessage("Player deleted successfully.");
            setTimeout(()=>{
                setMessage("")
            }, 3000)
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
                        Players
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage the club players.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A50044] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8a0038]"
                >
                    <Plus size={18} />
                    Add player
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
                    icon={Users}
                    label="Total players"
                    value={stats.total}
                />
                <StatCard
                    icon={ShieldCheck}
                    label="Active"
                    value={stats.active}
                    accent="text-emerald-600"
                    iconBg="bg-emerald-50"
                />
                <StatCard
                    icon={ShieldOff}
                    label="Inactive"
                    value={stats.inactive}
                    accent="text-slate-500"
                    iconBg="bg-slate-100"
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
                            placeholder="Search players..."
                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15"
                        />
                    </div>

                    <p className="hidden text-sm text-slate-500 sm:block">
                        {filteredPlayers.length}{" "}
                        {filteredPlayers.length === 1
                            ? "player"
                            : "players"}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="p-10 text-center text-sm text-slate-500">
                            Loading players...
                        </p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className={headingClasses}>
                                        Player
                                    </th>
                                    <th className={headingClasses}>
                                        Gender
                                    </th>
                                    <th className={headingClasses}>
                                        Phone
                                    </th>
                                    <th className={headingClasses}>
                                        Date of birth
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
                                {filteredPlayers.map((player) => (
                                    <tr
                                        key={player.id}
                                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                                    >
                                        <td className={cellClasses}>
                                            <p className="font-medium text-slate-900">
                                                {player.first_name}{" "}
                                                {player.last_name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {player.email}
                                            </p>
                                        </td>

                                        <td
                                            className={`${cellClasses} capitalize`}
                                        >
                                            {player.gender || "—"}
                                        </td>

                                        <td className={cellClasses}>
                                            {player.phone || "—"}
                                        </td>

                                        <td className={cellClasses}>
                                            {player.date_of_birth
                                                ? player.date_of_birth.slice(
                                                      0,
                                                      10
                                                  )
                                                : "—"}
                                        </td>

                                        <td className={cellClasses}>
                                            <StatusBadge
                                                status={
                                                    player.status
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
                                                            player
                                                        )
                                                    }
                                                    aria-label={`Edit ${player.first_name}`}
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
                                                            player.id
                                                        )
                                                    }
                                                    aria-label={`Delete ${player.first_name}`}
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

                    {!loading && filteredPlayers.length === 0 && (
                        <p className="p-10 text-center text-sm text-slate-500">
                            {search
                                ? "No players match your search."
                                : "No players found."}
                        </p>
                    )}
                </div>
            </div>

            {/* add / edit modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
                    <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">
                                {editingId
                                    ? "Edit player"
                                    : "Add player"}
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
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        First name
                                    </label>
                                    <input
                                        name="first_name"
                                        value={
                                            formData.first_name
                                        }
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    />
                                </div>

                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Last name
                                    </label>
                                    <input
                                        name="last_name"
                                        value={
                                            formData.last_name
                                        }
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    />
                                </div>

                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className={inputClasses}
                                    >
                                        <option value="male">
                                            Male
                                        </option>
                                        <option value="female">
                                            Female
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Date of birth
                                    </label>
                                    <input
                                        name="date_of_birth"
                                        type="date"
                                        value={
                                            formData.date_of_birth
                                        }
                                        onChange={handleChange}
                                        className={inputClasses}
                                    />
                                </div>

                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Email
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={inputClasses}
                                    />
                                </div>

                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Phone
                                    </label>
                                    <input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={inputClasses}
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label
                                        className={labelClasses}
                                    >
                                        Address
                                    </label>
                                    <input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className={inputClasses}
                                    />
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
                                        <option value="active">
                                            Active
                                        </option>
                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label
                                        className={labelClasses}
                                    >
                                        Notes
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows="3"
                                        className={`${inputClasses} resize-none`}
                                    />
                                </div>
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
                                          ? "Update player"
                                          : "Create player"}
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

    if (status === "active") {
        return (
            <span className={`${base} bg-emerald-50 text-emerald-700`}>
                {status}
            </span>
        );
    }

    return (
        <span className={`${base} bg-slate-100 text-slate-600`}>
            {status || "—"}
        </span>
    );
}

function formatInputDate(date) {
    return date ? date.slice(0, 10) : "";
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
