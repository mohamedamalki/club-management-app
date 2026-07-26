import { useEffect, useMemo, useState } from "react";
import {
    Banknote,
    Clock3,
    Pencil,
    Plus,
    Receipt,
    Search,
    Trash2,
    X,
} from "lucide-react";
import api from "../../api/axios";

const initialForm = {
    coach_id: "",
    season_id: "",
    type: "salary",
    description: "",
    amount: "",
    due_date: "",
    paid_at: "",
    status: "pending",
    payment_method: "",
    reference: "",
};

const typeOptions = ["salary", "bonus", "transport", "other"];
const statusOptions = ["pending", "paid", "cancelled"];
const methodOptions = ["cash", "bank_transfer", "card", "other"];

export default function CoachPayments() {
    const [payments, setPayments] = useState([]);
    const [coaches, setCoaches] = useState([]);
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
            api.get("/coach-payments"),
            api.get("/coaches"),
            api.get("/seasons"),
        ])
            .then(
                ([
                    paymentsResponse,
                    coachesResponse,
                    seasonsResponse,
                ]) => {
                    if (!cancelled) {
                        setPayments(paymentsResponse.data);
                        setCoaches(coachesResponse.data);
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

    const stats = useMemo(() => {
        const pendingAmount = payments
            .filter((p) => p.status === "pending")
            .reduce((sum, p) => sum + Number(p.amount), 0);

        const paidAmount = payments
            .filter((p) => p.status === "paid")
            .reduce((sum, p) => sum + Number(p.amount), 0);

        return {
            total: payments.length,
            pendingAmount,
            paidAmount,
        };
    }, [payments]);

    const filteredPayments = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return payments;
        }

        return payments.filter((payment) => {
            const coachName =
                `${payment.coach?.first_name ?? ""} ${payment.coach?.last_name ?? ""}`.toLowerCase();

            return (
                coachName.includes(query) ||
                payment.type.toLowerCase().includes(query) ||
                (payment.description || "")
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [payments, search]);

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

    function handleEdit(payment) {
        setEditingId(payment.id);

        setFormData({
            coach_id: String(payment.coach_id),
            season_id: String(payment.season_id),
            type: payment.type,
            description: payment.description || "",
            amount: payment.amount,
            due_date: payment.due_date.slice(0, 10),
            paid_at: payment.paid_at
                ? payment.paid_at.slice(0, 10)
                : "",
            status: payment.status,
            payment_method: payment.payment_method || "",
            reference: payment.reference || "",
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
            coach_id: Number(formData.coach_id),
            season_id: Number(formData.season_id),
            description: formData.description || null,
            amount: Number(formData.amount),
            paid_at: formData.paid_at || null,
            payment_method: formData.payment_method || null,
            reference: formData.reference || null,
        };

        try {
            if (editingId) {
                const response = await api.put(
                    `/coach-payments/${editingId}`,
                    payload
                );

                setPayments((previousPayments) =>
                    previousPayments.map((payment) =>
                        payment.id === editingId
                            ? response.data.data
                            : payment
                    )
                );

                setMessage(
                    "Coach payment updated successfully."
                );
            } else {
                const response = await api.post(
                    "/coach-payments",
                    payload
                );

                setPayments((previousPayments) => [
                    response.data.data,
                    ...previousPayments,
                ]);

                setMessage(
                    "Coach payment created successfully."
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
            "Are you sure you want to delete this coach payment?"
        );

        if (!confirmed) {
            return;
        }

        setMessage("");
        setError("");

        try {
            await api.delete(`/coach-payments/${id}`);

            setPayments((previousPayments) =>
                previousPayments.filter(
                    (payment) => payment.id !== id
                )
            );

            setMessage(
                "Coach payment deleted successfully."
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
                        Coach payments
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Track salaries, bonuses, and other coach
                        payments.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A50044] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8a0038] disabled:cursor-not-allowed disabled:bg-[#A50044]/50"
                >
                    <Plus size={18} />
                    Add payment
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
                    label="Total payments"
                    value={stats.total}
                />
                <StatCard
                    icon={Clock3}
                    label="Pending"
                    value={formatCurrency(stats.pendingAmount)}
                    accent="text-[#A50044]"
                    iconBg="bg-[#A50044]/10"
                />
                <StatCard
                    icon={Banknote}
                    label="Paid"
                    value={formatCurrency(stats.paidAmount)}
                    accent="text-emerald-600"
                    iconBg="bg-emerald-50"
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
                            placeholder="Search by coach, type, description..."
                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15"
                        />
                    </div>

                    <p className="hidden text-sm text-slate-500 sm:block">
                        {filteredPayments.length}{" "}
                        {filteredPayments.length === 1
                            ? "payment"
                            : "payments"}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="p-10 text-center text-sm text-slate-500">
                            Loading coach payments...
                        </p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className={headingClasses}>
                                        Coach
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
                                {filteredPayments.map(
                                    (payment) => (
                                        <tr
                                            key={payment.id}
                                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                                        >
                                            <td
                                                className={`${cellClasses} font-medium text-slate-900`}
                                            >
                                                {
                                                    payment.coach
                                                        ?.first_name
                                                }{" "}
                                                {
                                                    payment.coach
                                                        ?.last_name
                                                }
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                {
                                                    payment.season
                                                        ?.name
                                                }
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                <span className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                                                    {
                                                        payment.type
                                                    }
                                                </span>
                                            </td>

                                            <td
                                                className={`${cellClasses} font-medium text-slate-900`}
                                            >
                                                {formatCurrency(
                                                    payment.amount
                                                )}
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                {payment.due_date.slice(
                                                    0,
                                                    10
                                                )}
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                <StatusBadge
                                                    status={
                                                        payment.status
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
                                                                payment
                                                            )
                                                        }
                                                        aria-label="Edit payment"
                                                        title="Edit"
                                                        className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#004D98]"
                                                    >
                                                        <Pencil
                                                            size={
                                                                16
                                                            }
                                                        />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                payment.id
                                                            )
                                                        }
                                                        aria-label="Delete payment"
                                                        title="Delete"
                                                        className="rounded-md p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2
                                                            size={
                                                                16
                                                            }
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    )}

                    {!loading && filteredPayments.length === 0 && (
                        <p className="p-10 text-center text-sm text-slate-500">
                            {search
                                ? "No payments match your search."
                                : "No coach payments found."}
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
                                    ? "Edit coach payment"
                                    : "Add coach payment"}
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
                                        Coach
                                    </label>
                                    <select
                                        name="coach_id"
                                        value={
                                            formData.coach_id
                                        }
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    >
                                        <option value="">
                                            Select coach
                                        </option>
                                        {coaches.map((coach) => (
                                            <option
                                                key={coach.id}
                                                value={coach.id}
                                            >
                                                {
                                                    coach.first_name
                                                }{" "}
                                                {coach.last_name}
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
                            </div>

                            <div className="grid grid-cols-2 gap-3">
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

                            <div>
                                <label className={labelClasses}>
                                    Paid on{" "}
                                    <span className="font-normal normal-case text-slate-400">
                                        (auto-set to today if left
                                        blank and status is
                                        "paid"; cleared
                                        automatically if status
                                        isn't "paid")
                                    </span>
                                </label>
                                <input
                                    name="paid_at"
                                    type="date"
                                    value={formData.paid_at}
                                    onChange={handleChange}
                                    disabled={
                                        formData.status !== "paid"
                                    }
                                    className={`${inputClasses} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Payment method{" "}
                                        <span className="font-normal normal-case text-slate-400">
                                            (optional)
                                        </span>
                                    </label>
                                    <select
                                        name="payment_method"
                                        value={
                                            formData.payment_method
                                        }
                                        onChange={handleChange}
                                        className={inputClasses}
                                    >
                                        <option value="">
                                            Not specified
                                        </option>
                                        {methodOptions.map(
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
                                        Reference{" "}
                                        <span className="font-normal normal-case text-slate-400">
                                            (must be unique)
                                        </span>
                                    </label>
                                    <input
                                        name="reference"
                                        value={
                                            formData.reference
                                        }
                                        onChange={handleChange}
                                        placeholder="Optional"
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={
                                        formData.description
                                    }
                                    onChange={handleChange}
                                    rows="2"
                                    className={`${inputClasses} resize-none`}
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
                                          ? "Update payment"
                                          : "Create payment"}
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

    if (status === "cancelled") {
        return (
            <span className={`${base} bg-slate-100 text-slate-500 line-through`}>
                Cancelled
            </span>
        );
    }

    return (
        <span className={`${base} bg-[#A50044]/10 text-[#A50044]`}>
            Pending
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
