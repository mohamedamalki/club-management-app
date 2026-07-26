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
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    hire_date: "",
    speciality: "",
    salary: "",
    status: "active",
    notes: "",
};

const inputClasses = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15";
const labelClasses = "mb-1.5 block text-xs font-medium text-slate-600";
const headingClasses = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
const cellClasses = "whitespace-nowrap px-4 py-3.5 text-sm text-slate-700";

export default function Coaches() {
    const [coaches, setCoaches] = useState([]);
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

        api.get("/coaches")
            .then((response) => {
                if (!cancelled) {
                    setCoaches(response.data);
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
            total: coaches.length,
            active: coaches.filter((c) => c.status === "active")
                .length,
            inactive: coaches.filter(
                (c) => c.status === "inactive"
            ).length,
        };
    }, [coaches]);

    const filteredCoaches = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return coaches;
        }

        return coaches.filter((coach) => {
            const fullName =
                `${coach.first_name} ${coach.last_name}`.toLowerCase();

            return (
                fullName.includes(query) ||
                (coach.email || "")
                    .toLowerCase()
                    .includes(query) ||
                (coach.speciality || "")
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [coaches, search]);

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

    function handleEdit(coach) {
        setEditingId(coach.id);

        setFormData({
            first_name: coach.first_name,
            last_name: coach.last_name,
            email: coach.email || "",
            phone: coach.phone,
            address: coach.address || "",
            date_of_birth: formatInputDate(
                coach.date_of_birth
            ),
            hire_date: formatInputDate(coach.hire_date),
            speciality: coach.speciality || "",
            salary: coach.salary || "",
            status: coach.status,
            notes: coach.notes || "",
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
            address: formData.address || null,
            date_of_birth:
                formData.date_of_birth || null,
            hire_date: formData.hire_date || null,
            speciality: formData.speciality || null,
            salary: formData.salary || null,
            notes: formData.notes || null,
        };

        try {
            if (editingId) {
                const response = await api.put(
                    `/coaches/${editingId}`,
                    payload
                );

                setCoaches((previousCoaches) =>
                    previousCoaches.map((coach) =>
                        coach.id === editingId
                            ? response.data.data
                            : coach
                    )
                );

                setMessage("Coach updated successfully.");
                setTimeout(() => {
                        setMessage("");
                    }, 3000);
            } else {
                const response = await api.post(
                    "/coaches",
                    payload
                );

                setCoaches((previousCoaches) => [
                    response.data.data,
                    ...previousCoaches,
                ]);

                    setMessage("Coach created successfully.");

                    setTimeout(() => {
                        setMessage("");
                    }, 3000);
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
            "Are you sure you want to delete this coach?"
        );

        if (!confirmed) {
            return;
        }

        setMessage("");
        setError("");

        try {
            await api.delete(`/coaches/${id}`);

            setCoaches((previousCoaches) =>
                previousCoaches.filter(
                    (coach) => coach.id !== id
                )
            );

            setMessage("Coach deleted successfully.");
            setTimeout(() => {
                        setMessage("");
                    }, 3000);
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
                        Coaches
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Create and manage club coaches.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A50044] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8a0038]"
                >
                    <Plus size={18} />
                    Add coach
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
                    label="Total coaches"
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
                            placeholder="Search coaches..."
                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15"
                        />
                    </div>

                    <p className="hidden text-sm text-slate-500 sm:block">
                        {filteredCoaches.length}{" "}
                        {filteredCoaches.length === 1
                            ? "coach"
                            : "coaches"}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="p-10 text-center text-sm text-slate-500">
                            Loading coaches...
                        </p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className={headingClasses}>
                                        Coach
                                    </th>
                                    <th className={headingClasses}>
                                        Phone
                                    </th>
                                    <th className={headingClasses}>
                                        Speciality
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
                                {filteredCoaches.map((coach) => (
                                    <tr
                                        key={coach.id}
                                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                                    >
                                        <td className={cellClasses}>
                                            <p className="font-medium text-slate-900">
                                                {coach.first_name}{" "}
                                                {coach.last_name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {coach.email}
                                            </p>
                                        </td>

                                        <td className={cellClasses}>
                                            {coach.phone}
                                        </td>

                                        <td className={cellClasses}>
                                            {coach.speciality ||
                                                "—"}
                                        </td>

                                        <td className={cellClasses}>
                                            <StatusBadge
                                                status={coach.status}
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
                                                            coach
                                                        )
                                                    }
                                                    aria-label={`Edit ${coach.first_name}`}
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
                                                            coach.id
                                                        )
                                                    }
                                                    aria-label={`Delete ${coach.first_name}`}
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

                    {!loading && filteredCoaches.length === 0 && (
                        <p className="p-10 text-center text-sm text-slate-500">
                            {search
                                ? "No coaches match your search."
                                : "No coaches found."}
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
                                    ? "Edit coach"
                                    : "Add coach"}
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
                                        required
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
                                        Speciality
                                    </label>
                                    <input
                                        name="speciality"
                                        value={
                                            formData.speciality
                                        }
                                        onChange={handleChange}
                                        className={inputClasses}
                                    />
                                </div>

                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Salary
                                    </label>
                                    <input
                                        name="salary"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.salary}
                                        onChange={handleChange}
                                        className={inputClasses}
                                    />
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
                                        Hire date
                                    </label>
                                    <input
                                        name="hire_date"
                                        type="date"
                                        value={
                                            formData.hire_date
                                        }
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
                                        ? "Update coach"
                                        : "Create coach"}
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
            {status}
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


