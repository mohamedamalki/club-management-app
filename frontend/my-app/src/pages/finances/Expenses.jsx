import { useEffect, useMemo, useState } from "react";
import {
    Banknote,
    Pencil,
    Plus,
    Receipt,
    Search,
    Tags,
    Trash2,
    X,
} from "lucide-react";
import api from "../../api/axios";

const initialForm = {
    season_id: "",
    team_id: "",
    description: "",
    amount: "",
    expense_date: "",
    payment_method: "cash",
    reference: "",
    receipt_file: "",
    notes: "",
};

const methodOptions = [
    "cash",
    "bank_transfer",
    "card",
    "other",
];

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [teams, setTeams] = useState([]);

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
            api.get("/expenses"),
            api.get("/seasons"),
            api.get("/teams"),
        ])
            .then(
                ([
                    expensesResponse,
                    seasonsResponse,
                    teamsResponse,
                ]) => {
                    if (!cancelled) {
                        setExpenses(expensesResponse.data);
                        setSeasons(seasonsResponse.data);
                        setTeams(teamsResponse.data);
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
        const total = expenses.reduce(
            (sum, expense) => sum + Number(expense.amount),
            0
        );

        const now = new Date();
        const thisMonth = expenses
            .filter((expense) => {
                const date = new Date(expense.expense_date);
                return (
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear()
                );
            })
            .reduce(
                (sum, expense) => sum + Number(expense.amount),
                0
            );

        return {
            count: expenses.length,
            total,
            thisMonth,
        };
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return expenses;
        }

        return expenses.filter((expense) => {
            return (
                expense.description
                    .toLowerCase()
                    .includes(query) ||
                (expense.reference || "")
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [expenses, search]);

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

    function handleEdit(expense) {
        setEditingId(expense.id);

        setFormData({
            season_id: expense.season_id
                ? String(expense.season_id)
                : "",
            team_id: expense.team_id
                ? String(expense.team_id)
                : "",
            description: expense.description,
            amount: expense.amount,
            expense_date: expense.expense_date.slice(0, 10),
            payment_method: expense.payment_method,
            reference: expense.reference || "",
            receipt_file: expense.receipt_file || "",
            notes: expense.notes || "",
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
            season_id: formData.season_id
                ? Number(formData.season_id)
                : null,
            team_id: formData.team_id
                ? Number(formData.team_id)
                : null,
            amount: Number(formData.amount),
            reference: formData.reference || null,
            receipt_file: formData.receipt_file || null,
            notes: formData.notes || null,
        };

        try {
            if (editingId) {
                const response = await api.put(
                    `/expenses/${editingId}`,
                    payload
                );

                setExpenses((previousExpenses) =>
                    previousExpenses.map((expense) =>
                        expense.id === editingId
                            ? response.data.data
                            : expense
                    )
                );

                setMessage("Expense updated successfully.");
                setTimeout(()=>{
                    setMessage("")
                }, 3000)
            } else {
                const response = await api.post(
                    "/expenses",
                    payload
                );

                setExpenses((previousExpenses) => [
                    response.data.data,
                    ...previousExpenses,
                ]);

                setMessage("Expense created successfully.");
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
            "Are you sure you want to delete this expense?"
        );

        if (!confirmed) {
            return;
        }

        setMessage("");
        setError("");

        try {
            await api.delete(`/expenses/${id}`);

            setExpenses((previousExpenses) =>
                previousExpenses.filter(
                    (expense) => expense.id !== id
                )
            );

            setMessage("Expense deleted successfully.");
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
                        Expenses
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Track club expenses by season and team.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A50044] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8a0038] disabled:cursor-not-allowed disabled:bg-[#A50044]/50"
                >
                    <Plus size={18} />
                    Add expense
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
                    label="Total expenses"
                    value={stats.count}
                />
                <StatCard
                    icon={Banknote}
                    label="Total spent"
                    value={formatCurrency(stats.total)}
                    accent="text-[#A50044]"
                    iconBg="bg-[#A50044]/10"
                />
                <StatCard
                    icon={Tags}
                    label="This month"
                    value={formatCurrency(stats.thisMonth)}
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
                            placeholder="Search by description, reference..."
                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15"
                        />
                    </div>

                    <p className="hidden text-sm text-slate-500 sm:block">
                        {filteredExpenses.length}{" "}
                        {filteredExpenses.length === 1
                            ? "expense"
                            : "expenses"}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="p-10 text-center text-sm text-slate-500">
                            Loading expenses...
                        </p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className={headingClasses}>
                                        Description
                                    </th>
                                    <th className={headingClasses}>
                                        Season / Team
                                    </th>
                                    <th className={headingClasses}>
                                        Amount
                                    </th>
                                    <th className={headingClasses}>
                                        Date
                                    </th>
                                    <th className={headingClasses}>
                                        Method
                                    </th>
                                    <th
                                        className={`${headingClasses} text-right`}
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredExpenses.map(
                                    (expense) => (
                                        <tr
                                            key={expense.id}
                                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                                        >
                                            <td
                                                className={`${cellClasses} font-medium text-slate-900`}
                                            >
                                                {
                                                    expense.description
                                                }
                                                {expense.reference && (
                                                    <p className="text-xs font-normal text-slate-400">
                                                        Ref:{" "}
                                                        {
                                                            expense.reference
                                                        }
                                                    </p>
                                                )}
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                <span className="text-slate-600">
                                                    {expense
                                                        .season
                                                        ?.name ||
                                                        "—"}
                                                </span>
                                                {expense.team
                                                    ?.name && (
                                                    <span className="text-slate-400">
                                                        {" "}
                                                        ·{" "}
                                                        {
                                                            expense
                                                                .team
                                                                .name
                                                        }
                                                    </span>
                                                )}
                                            </td>

                                            <td
                                                className={`${cellClasses} font-medium text-slate-900`}
                                            >
                                                {formatCurrency(
                                                    expense.amount
                                                )}
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                {expense.expense_date.slice(
                                                    0,
                                                    10
                                                )}
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                <span className="inline-block rounded-full bg-[#004D98]/10 px-2.5 py-1 text-xs font-medium capitalize text-[#004D98]">
                                                    {expense.payment_method.replaceAll(
                                                        "_",
                                                        " "
                                                    )}
                                                </span>
                                            </td>

                                            <td
                                                className={`${cellClasses} text-right`}
                                            >
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                expense
                                                            )
                                                        }
                                                        aria-label="Edit expense"
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
                                                                expense.id
                                                            )
                                                        }
                                                        aria-label="Delete expense"
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

                    {!loading && filteredExpenses.length === 0 && (
                        <p className="p-10 text-center text-sm text-slate-500">
                            {search
                                ? "No expenses match your search."
                                : "No expenses found."}
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
                                    ? "Edit expense"
                                    : "Add expense"}
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
                                    Description
                                </label>
                                <input
                                    name="description"
                                    value={
                                        formData.description
                                    }
                                    onChange={handleChange}
                                    required
                                    className={inputClasses}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Season{" "}
                                        <span className="font-normal normal-case text-slate-400">
                                            (optional)
                                        </span>
                                    </label>
                                    <select
                                        name="season_id"
                                        value={
                                            formData.season_id
                                        }
                                        onChange={handleChange}
                                        className={inputClasses}
                                    >
                                        <option value="">
                                            Not linked
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

                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Team{" "}
                                        <span className="font-normal normal-case text-slate-400">
                                            (optional)
                                        </span>
                                    </label>
                                    <select
                                        name="team_id"
                                        value={formData.team_id}
                                        onChange={handleChange}
                                        className={inputClasses}
                                    >
                                        <option value="">
                                            Not linked
                                        </option>
                                        {teams.map((team) => (
                                            <option
                                                key={team.id}
                                                value={team.id}
                                            >
                                                {team.name}
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
                                        Expense date
                                    </label>
                                    <input
                                        name="expense_date"
                                        type="date"
                                        value={
                                            formData.expense_date
                                        }
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Payment method
                                </label>
                                <select
                                    name="payment_method"
                                    value={
                                        formData.payment_method
                                    }
                                    onChange={handleChange}
                                    className={inputClasses}
                                >
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
                                <label className={labelClasses}>
                                    Reference{" "}
                                    <span className="font-normal normal-case text-slate-400">
                                        (optional, must be unique)
                                    </span>
                                </label>
                                <input
                                    name="reference"
                                    value={formData.reference}
                                    onChange={handleChange}
                                    placeholder="Invoice or receipt number"
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Receipt file{" "}
                                    <span className="font-normal normal-case text-slate-400">
                                        (path or filename, optional)
                                    </span>
                                </label>
                                <input
                                    name="receipt_file"
                                    value={
                                        formData.receipt_file
                                    }
                                    onChange={handleChange}
                                    placeholder="receipts/2026-invoice.pdf"
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
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
                                          ? "Update expense"
                                          : "Create expense"}
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
