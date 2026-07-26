import { useEffect, useMemo, useState } from "react";
import {
    Banknote,
    Plus,
    Receipt,
    Search,
    Trash2,
    UserX,
    X,
} from "lucide-react";
import api from "../../api/axios";

const initialForm = {
    player_charge_id: "",
    guardian_id: "",
    amount: "",
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "cash",
    reference: "",
    notes: "",
};

const methodOptions = [
    "cash",
    "bank_transfer",
    "card",
    "other",
];

export default function Payments() {
    const [payments, setPayments] = useState([]);
    const [charges, setCharges] = useState([]);
    const [guardians, setGuardians] = useState([]);

    const [formData, setFormData] = useState(initialForm);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            api.get("/payments"),
            api.get("/player-charges"),
            api.get("/guardians"),
        ])
            .then(
                ([
                    paymentsResponse,
                    chargesResponse,
                    guardiansResponse,
                ]) => {
                    if (!cancelled) {
                        setPayments(paymentsResponse.data);
                        setCharges(chargesResponse.data);
                        setGuardians(guardiansResponse.data);
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

    async function refreshCharges() {
        try {
            const response = await api.get("/player-charges");
            setCharges(response.data);
        } catch {
            // Non-fatal: the charges list just stays a bit stale
            // until the next full reload.
        }
    }

    function getRemainingAmount(charge) {
        const paid = (charge.payments || []).reduce(
            (sum, payment) => sum + Number(payment.amount),
            0
        );

        return Math.max(0, Number(charge.amount) - paid);
    }

    // Only charges that can still receive a payment.
    const payableCharges = useMemo(
        () =>
            charges.filter(
                (charge) =>
                    charge.status !== "cancelled" &&
                    getRemainingAmount(charge) > 0
            ),
        [charges]
    );

    const selectedCharge = useMemo(
        () =>
            charges.find(
                (charge) =>
                    String(charge.id) ===
                    String(formData.player_charge_id)
            ) || null,
        [charges, formData.player_charge_id]
    );

    const stats = useMemo(() => {
        const totalCollected = payments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0
        );

        const withoutGuardian = payments.filter(
            (payment) => !payment.guardian_id
        ).length;

        return {
            total: payments.length,
            totalCollected,
            withoutGuardian,
        };
    }, [payments]);

    const filteredPayments = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return payments;
        }

        return payments.filter((payment) => {
            const player = payment.playerCharge?.player;
            const playerName = player
                ? `${player.first_name} ${player.last_name}`.toLowerCase()
                : "";

            const guardianName = payment.guardian
                ? `${payment.guardian.first_name} ${payment.guardian.last_name}`.toLowerCase()
                : "";

            return (
                playerName.includes(query) ||
                guardianName.includes(query) ||
                (payment.reference || "")
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
        setError("");
    }

    function openAddForm() {
        resetForm();
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
            player_charge_id: Number(
                formData.player_charge_id
            ),
            guardian_id: formData.guardian_id
                ? Number(formData.guardian_id)
                : null,
            amount: Number(formData.amount),
            payment_date: formData.payment_date,
            payment_method: formData.payment_method,
            reference: formData.reference || null,
            notes: formData.notes || null,
        };

        try {
            const response = await api.post(
                "/payments",
                payload
            );

            setPayments((previousPayments) => [
                response.data.data,
                ...previousPayments,
            ]);

            setMessage("Payment recorded successfully.");
            setTimeout(()=>{
                setMessage("")
            },3000)
            resetForm();
            setIsFormOpen(false);

            // The charge this payment applies to may now be
            // partially_paid or paid — keep that in sync.
            await refreshCharges();
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this payment? The related charge's status will be recalculated."
        );

        if (!confirmed) {
            return;
        }

        setMessage("");
        setError("");

        try {
            await api.delete(`/payments/${id}`);

            setPayments((previousPayments) =>
                previousPayments.filter(
                    (payment) => payment.id !== id
                )
            );

            setMessage("Payment deleted successfully.");
            setTimeout(()=>{
                setMessage("")
            },3000)

            await refreshCharges();
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
                        Payments
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Record payments made against player
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
                    Record payment
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
                    icon={Banknote}
                    label="Total collected"
                    value={formatCurrency(stats.totalCollected)}
                    accent="text-emerald-600"
                    iconBg="bg-emerald-50"
                />
                <StatCard
                    icon={UserX}
                    label="Without guardian"
                    value={stats.withoutGuardian}
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
                            placeholder="Search by player, guardian, reference..."
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
                            Loading payments...
                        </p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className={headingClasses}>
                                        Date
                                    </th>
                                    <th className={headingClasses}>
                                        Player
                                    </th>
                                    <th className={headingClasses}>
                                        Guardian
                                    </th>
                                    <th className={headingClasses}>
                                        Amount
                                    </th>
                                    <th className={headingClasses}>
                                        Method
                                    </th>
                                    <th className={headingClasses}>
                                        Reference
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
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                {payment.payment_date.slice(
                                                    0,
                                                    10
                                                )}
                                            </td>

                                            <td
                                                className={`${cellClasses} font-medium text-slate-900`}
                                            >
                                                {payment
                                                    .playerCharge
                                                    ?.player
                                                    ?.first_name ??
                                                    "—"}{" "}
                                                {payment
                                                    .playerCharge
                                                    ?.player
                                                    ?.last_name ??
                                                    ""}
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                {payment.guardian ? (
                                                    `${payment.guardian.first_name} ${payment.guardian.last_name}`
                                                ) : (
                                                    <span className="text-slate-400">
                                                        —
                                                    </span>
                                                )}
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
                                                <span className="inline-block rounded-full bg-[#004D98]/10 px-2.5 py-1 text-xs font-medium capitalize text-[#004D98]">
                                                    {payment.payment_method.replaceAll(
                                                        "_",
                                                        " "
                                                    )}
                                                </span>
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                {payment.reference ||
                                                    "—"}
                                            </td>

                                            <td
                                                className={`${cellClasses} text-right`}
                                            >
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
                                                        size={16}
                                                    />
                                                </button>
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
                                : "No payments found."}
                        </p>
                    )}
                </div>
            </div>

            {/* add payment modal — no edit, backend has no update route */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
                    <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Record payment
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
                                    Charge
                                </label>
                                <select
                                    name="player_charge_id"
                                    value={
                                        formData.player_charge_id
                                    }
                                    onChange={handleChange}
                                    required
                                    className={inputClasses}
                                >
                                    <option value="">
                                        Select a charge...
                                    </option>
                                    {payableCharges.map(
                                        (charge) => (
                                            <option
                                                key={charge.id}
                                                value={charge.id}
                                            >
                                                {
                                                    charge.player
                                                        ?.first_name
                                                }{" "}
                                                {
                                                    charge.player
                                                        ?.last_name
                                                }{" "}
                                                ·{" "}
                                                {formatLabel(
                                                    charge.type
                                                )}{" "}
                                                · remaining{" "}
                                                {formatCurrency(
                                                    getRemainingAmount(
                                                        charge
                                                    )
                                                )}
                                            </option>
                                        )
                                    )}
                                </select>
                                {payableCharges.length === 0 && (
                                    <p className="mt-1 text-xs text-slate-500">
                                        No charges currently have
                                        a remaining balance.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Amount
                                        {selectedCharge && (
                                            <span className="ml-1 font-normal normal-case text-slate-400">
                                                (remaining{" "}
                                                {formatCurrency(
                                                    getRemainingAmount(
                                                        selectedCharge
                                                    )
                                                )}
                                                )
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        name="amount"
                                        type="number"
                                        min="0.01"
                                        max={
                                            selectedCharge
                                                ? getRemainingAmount(
                                                      selectedCharge
                                                  )
                                                : undefined
                                        }
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
                                        Payment date
                                    </label>
                                    <input
                                        name="payment_date"
                                        type="date"
                                        value={
                                            formData.payment_date
                                        }
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
                                        Guardian{" "}
                                        <span className="font-normal normal-case text-slate-400">
                                            (optional)
                                        </span>
                                    </label>
                                    <select
                                        name="guardian_id"
                                        value={
                                            formData.guardian_id
                                        }
                                        onChange={handleChange}
                                        className={inputClasses}
                                    >
                                        <option value="">
                                            No guardian
                                        </option>
                                        {guardians.map(
                                            (guardian) => (
                                                <option
                                                    key={
                                                        guardian.id
                                                    }
                                                    value={
                                                        guardian.id
                                                    }
                                                >
                                                    {
                                                        guardian.first_name
                                                    }{" "}
                                                    {
                                                        guardian.last_name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Method
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
                                    placeholder="Receipt or transaction number"
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
                                        ? "Recording..."
                                        : "Record payment"}
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
