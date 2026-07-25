import { useEffect, useMemo, useState } from "react";
import {
    CalendarRange,
    CheckCircle2,
    Clock3,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import api from "../../api/axios";

const initialForm = {
    name: "",
    start_date: "",
    end_date: "",
    status: "upcoming",
};

const inputClasses = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15";

const labelClasses = "mb-1.5 block text-xs font-medium text-slate-600";

const headingClasses = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";

const cellClasses = "whitespace-nowrap px-4 py-3.5 text-sm text-slate-700";

export default function Seasons() {
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

        api.get("/seasons")
            .then((response) => {
                if (!cancelled) {
                    setSeasons(response.data);
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
            total: seasons.length,
            active: seasons.filter((s) => s.status === "active")
                .length,
            upcoming: seasons.filter(
                (s) => s.status === "upcoming"
            ).length,
        };
    }, [seasons]);

    const filteredSeasons = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return seasons;
        }

        return seasons.filter((season) =>
            season.name.toLowerCase().includes(query)
        );
    }, [seasons, search]);

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

    function handleEdit(season) {
        setEditingId(season.id);

        setFormData({
            name: season.name,
            start_date: season.start_date.slice(0, 10),
            end_date: season.end_date.slice(0, 10),
            status: season.status,
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

        try {
            if (editingId) {
                const response = await api.put(
                    `/seasons/${editingId}`,
                    formData
                );

                setSeasons((previousSeasons) =>
                    previousSeasons.map((season) =>
                        season.id === editingId
                            ? response.data.data
                            : season
                    )
                );

                setMessage("Season updated successfully.");
            } else {
                const response = await api.post(
                    "/seasons",
                    formData
                );

                setSeasons((previousSeasons) => [
                    response.data.data,
                    ...previousSeasons,
                ]);

                setMessage("Season created successfully.");
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
            "Are you sure you want to delete this season?"
        );

        if (!confirmed) {
            return;
        }

        setMessage("");
        setError("");

        try {
            await api.delete(`/seasons/${id}`);

            setSeasons((previousSeasons) =>
                previousSeasons.filter(
                    (season) => season.id !== id
                )
            );

            setMessage("Season deleted successfully.");
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
                        Seasons
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Create and manage sporting seasons.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A50044] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8a0038]"
                >
                    <Plus size={18} />
                    Add season
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
                    icon={CalendarRange}
                    label="Total seasons"
                    value={stats.total}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Active"
                    value={stats.active}
                    accent="text-emerald-600"
                    iconBg="bg-emerald-50"
                />
                <StatCard
                    icon={Clock3}
                    label="Upcoming"
                    value={stats.upcoming}
                    accent="text-[#004D98]"
                    iconBg="bg-[#004D98]/10"
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
                            placeholder="Search seasons..."
                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15"
                        />
                    </div>

                    <p className="hidden text-sm text-slate-500 sm:block">
                        {filteredSeasons.length}{" "}
                        {filteredSeasons.length === 1
                            ? "season"
                            : "seasons"}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="p-10 text-center text-sm text-slate-500">
                            Loading seasons...
                        </p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className={headingClasses}>
                                        Name
                                    </th>
                                    <th className={headingClasses}>
                                        Start
                                    </th>
                                    <th className={headingClasses}>
                                        End
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
                                {filteredSeasons.map((season) => (
                                    <tr
                                        key={season.id}
                                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                                    >
                                        <td
                                            className={`${cellClasses} font-medium text-slate-900`}
                                        >
                                            {season.name}
                                        </td>

                                        <td className={cellClasses}>
                                            {season.start_date.slice(
                                                0,
                                                10
                                            )}
                                        </td>

                                        <td className={cellClasses}>
                                            {season.end_date.slice(
                                                0,
                                                10
                                            )}
                                        </td>

                                        <td className={cellClasses}>
                                            <StatusBadge
                                                status={
                                                    season.status
                                                }
                                            />
                                        </td>

                                        <td
                                            className={`${cellClasses} text-right`}
                                        >
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() =>
                                                        handleEdit(
                                                            season
                                                        )
                                                    }
                                                    aria-label={`Edit ${season.name}`}
                                                    title="Edit"
                                                    className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#004D98]"
                                                >
                                                    <Pencil
                                                        size={16}
                                                    />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            season.id
                                                        )
                                                    }
                                                    aria-label={`Delete ${season.name}`}
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

                    {!loading && filteredSeasons.length === 0 && (
                        <p className="p-10 text-center text-sm text-slate-500">
                            {search
                                ? "No seasons match your search."
                                : "No seasons found."}
                        </p>
                    )}
                </div>
            </div>

            {/* add / edit modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">
                                {editingId
                                    ? "Edit season"
                                    : "Add season"}
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
                            <div>
                                <label className={labelClasses}>
                                    Season name
                                </label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="2026/2027"
                                    required
                                    className={inputClasses}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Start date
                                    </label>
                                    <input
                                        name="start_date"
                                        type="date"
                                        value={
                                            formData.start_date
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
                                        End date
                                    </label>
                                    <input
                                        name="end_date"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className={inputClasses}
                                >
                                    <option value="upcoming">
                                        Upcoming
                                    </option>
                                    <option value="active">
                                        Active
                                    </option>
                                    <option value="completed">
                                        Completed
                                    </option>
                                </select>
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
                                          ? "Update season"
                                          : "Create season"}
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

    if (status === "completed") {
        return (
            <span className={`${base} bg-slate-100 text-slate-600`}>
                {status}
            </span>
        );
    }

    return (
        <span className={`${base} bg-[#004D98]/10 text-[#004D98]`}>
            {status}
        </span>
    );
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


