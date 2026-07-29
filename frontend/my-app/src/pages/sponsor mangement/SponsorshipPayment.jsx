import {
    Banknote,
    CircleDollarSign,
    Pencil,
    Plus,
    ReceiptText,
    Search,
    Trash2,
    X,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import api from "../../api/axios";

const initialForm = {
    sponsorship_id: "",
    amount: "",
    payment_date: "",
    payment_method: "bank_transfer",
    reference: "",
    notes: "",
};

export default function SponsorshipPayments() {
    const [payments, setPayments] = useState([]);
    const [sponsorships, setSponsorships] =
        useState([]);

    const [formData, setFormData] =
        useState(initialForm);

    const [editingId, setEditingId] =
        useState(null);

    const [isFormOpen, setIsFormOpen] =
        useState(false);

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            api.get("/sponsorship-payments"),
            api.get("/sponsor-ships"),
        ])
            .then(
                ([
                    paymentResponse,
                    sponsorshipResponse,
                ]) => {
                    if (cancelled) return;

                    setPayments(
                        getList(paymentResponse)
                    );

                    setSponsorships(
                        getList(sponsorshipResponse)
                    );
                }
            )
            .catch((requestError) => {
                if (!cancelled) {
                    setError(
                        getErrorMessage(requestError)
                    );
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

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            setMessage("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [message]);

    const stats = useMemo(() => {
        const totalReceived = payments.reduce(
            (total, payment) =>
                total +
                Number(payment.amount || 0),
            0
        );

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const receivedThisMonth = payments
            .filter((payment) => {
                const date = new Date(
                    payment.payment_date
                );

                return (
                    date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear
                );
            })
            .reduce(
                (total, payment) =>
                    total +
                    Number(payment.amount || 0),
                0
            );

        return {
            total: payments.length,
            totalReceived,
            receivedThisMonth,
        };
    }, [payments]);

    const filteredPayments = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return payments;
        }

        return payments.filter((payment) => {
            const sponsorshipTitle =
                payment.sponsorship?.title
                    ?.toLowerCase() || "";

            const sponsorName = getSponsorName(
                payment.sponsorship?.sponsor
            ).toLowerCase();

            const reference =
                payment.reference?.toLowerCase() || "";

            const method = formatPaymentMethod(
                payment.payment_method
            ).toLowerCase();

            return (
                sponsorshipTitle.includes(query) ||
                sponsorName.includes(query) ||
                reference.includes(query) ||
                method.includes(query)
            );
        });
    }, [payments, search]);

    const selectedSponsorship = useMemo(() => {
        return sponsorships.find(
            (sponsorship) =>
                Number(sponsorship.id) ===
                Number(formData.sponsorship_id)
        );
    }, [
        sponsorships,
        formData.sponsorship_id,
    ]);

    const availableAmount = useMemo(() => {
        if (!selectedSponsorship) return 0;

        const agreedAmount = Number(
            selectedSponsorship.agreed_amount || 0
        );

        const paidAmount = Number(
            selectedSponsorship
                .payments_sum_amount || 0
        );

        /*
         * During an update, the current payment must
         * be added back to the available amount.
         */
        const currentPayment = editingId
            ? payments.find(
                  (payment) =>
                      payment.id === editingId
              )
            : null;

        const currentPaymentAmount =
            currentPayment &&
            Number(
                currentPayment.sponsorship_id
            ) ===
                Number(
                    selectedSponsorship.id
                )
                ? Number(currentPayment.amount || 0)
                : 0;

        return Math.max(
            agreedAmount -
                paidAmount +
                currentPaymentAmount,
            0
        );
    }, [
        selectedSponsorship,
        editingId,
        payments,
    ]);

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
        setMessage("");
        setIsFormOpen(true);
    }

    function handleEdit(payment) {
        setEditingId(payment.id);

        setFormData({
            sponsorship_id:
                payment.sponsorship_id ?? "",

            amount: payment.amount ?? "",

            payment_date: formatInputDate(
                payment.payment_date
            ),

            payment_method:
                payment.payment_method ??
                "bank_transfer",

            reference: payment.reference ?? "",

            notes: payment.notes ?? "",
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
            sponsorship_id:
                formData.sponsorship_id,

            amount: formData.amount,

            payment_date:
                formData.payment_date,

            payment_method:
                formData.payment_method,

            reference:
                formData.reference || null,

            notes: formData.notes || null,
        };

        try {
            if (editingId) {
                const previousPayment =
                    payments.find(
                        (payment) =>
                            payment.id === editingId
                    );

                const response = await api.put(
                    `/sponsorship-payments/${editingId}`,
                    payload
                );

                const updatedPayment =
                    response.data.data;

                setPayments((previousPayments) =>
                    previousPayments.map(
                        (payment) =>
                            payment.id === editingId
                                ? updatedPayment
                                : payment
                    )
                );

                updateSponsorshipTotals(
                    previousPayment,
                    updatedPayment
                );

                setMessage(
                    "Sponsorship payment updated successfully."
                );
            } else {
                const response = await api.post(
                    "/sponsorship-payments",
                    payload
                );

                const newPayment =
                    response.data.data;

                setPayments((previousPayments) => [
                    newPayment,
                    ...previousPayments,
                ]);

                increaseSponsorshipTotal(
                    newPayment.sponsorship_id,
                    Number(newPayment.amount)
                );

                setMessage(
                    "Sponsorship payment created successfully."
                );
            }

            closeForm();
        } catch (requestError) {
            setError(
                getErrorMessage(requestError)
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(payment) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this payment?"
        );

        if (!confirmed) return;

        setMessage("");
        setError("");

        try {
            await api.delete(
                `/sponsorship-payments/${payment.id}`
            );

            setPayments((previousPayments) =>
                previousPayments.filter(
                    (item) =>
                        item.id !== payment.id
                )
            );

            increaseSponsorshipTotal(
                payment.sponsorship_id,
                -Number(payment.amount)
            );

            setMessage(
                "Sponsorship payment deleted successfully."
            );
        } catch (requestError) {
            setError(
                getErrorMessage(requestError)
            );
        }
    }

    function increaseSponsorshipTotal(
        sponsorshipId,
        difference
    ) {
        setSponsorships(
            (previousSponsorships) =>
                previousSponsorships.map(
                    (sponsorship) => {
                        if (
                            Number(sponsorship.id) !==
                            Number(sponsorshipId)
                        ) {
                            return sponsorship;
                        }

                        const currentTotal = Number(
                            sponsorship
                                .payments_sum_amount ||
                                0
                        );

                        return {
                            ...sponsorship,

                            payments_sum_amount:
                                Math.max(
                                    currentTotal +
                                        difference,
                                    0
                                ),
                        };
                    }
                )
        );
    }

    function updateSponsorshipTotals(
        previousPayment,
        updatedPayment
    ) {
        if (!previousPayment) return;

        increaseSponsorshipTotal(
            previousPayment.sponsorship_id,
            -Number(previousPayment.amount)
        );

        increaseSponsorshipTotal(
            updatedPayment.sponsorship_id,
            Number(updatedPayment.amount)
        );
    }

    return (
        <section>
            {/* Page header */}
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Sponsorship payments
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Record and manage sponsor payments.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A50044] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8a0038]"
                >
                    <Plus size={18} />
                    Add payment
                </button>
            </header>

            {/* Messages */}
            {message && (
                <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {message}
                </p>
            )}

            {error && !isFormOpen && (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {/* Statistics */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    icon={ReceiptText}
                    label="Payments"
                    value={stats.total}
                />

                <StatCard
                    icon={CircleDollarSign}
                    label="Total received"
                    value={formatCurrency(
                        stats.totalReceived
                    )}
                    accent="text-emerald-600"
                    iconBg="bg-emerald-50"
                />

                <StatCard
                    icon={Banknote}
                    label="Received this month"
                    value={formatCurrency(
                        stats.receivedThisMonth
                    )}
                    accent="text-[#004D98]"
                    iconBg="bg-blue-50"
                />
            </div>

            {/* Table */}
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
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search payments..."
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
                    ) : filteredPayments.length ===
                      0 ? (
                        <p className="p-10 text-center text-sm text-slate-500">
                            {search
                                ? "No payments match your search."
                                : "No payments found."}
                        </p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className={headingClasses}>
                                        Sponsorship
                                    </th>

                                    <th className={headingClasses}>
                                        Sponsor
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
                                            <td className={cellClasses}>
                                                <p className="font-medium text-slate-900">
                                                    {payment
                                                        .sponsorship
                                                        ?.title ||
                                                        "—"}
                                                </p>

                                                <p className="text-xs text-slate-500">
                                                    {payment
                                                        .sponsorship
                                                        ?.season
                                                        ?.name ||
                                                        "—"}
                                                </p>
                                            </td>

                                            <td className={cellClasses}>
                                                {getSponsorName(
                                                    payment
                                                        .sponsorship
                                                        ?.sponsor
                                                )}
                                            </td>

                                            <td
                                                className={`${cellClasses} font-medium text-emerald-700`}
                                            >
                                                {formatCurrency(
                                                    payment.amount
                                                )}
                                            </td>

                                            <td className={cellClasses}>
                                                {formatDate(
                                                    payment.payment_date
                                                )}
                                            </td>

                                            <td className={cellClasses}>
                                                {formatPaymentMethod(
                                                    payment.payment_method
                                                )}
                                            </td>

                                            <td className={cellClasses}>
                                                {payment.reference ||
                                                    "—"}
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
                                                                payment
                                                            )
                                                        }
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
                                    )
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Form modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
                    <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {editingId
                                        ? "Edit payment"
                                        : "Add payment"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Record a sponsorship
                                    payment.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            {error && (
                                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </p>
                            )}

                            <FormField label="Sponsorship">
                                <select
                                    name="sponsorship_id"
                                    value={
                                        formData.sponsorship_id
                                    }
                                    onChange={handleChange}
                                    required
                                    className={inputClasses}
                                >
                                    <option value="">
                                        Select sponsorship
                                    </option>

                                    {sponsorships
                                        .filter(
                                            (sponsorship) =>
                                                sponsorship.status !==
                                                "cancelled"
                                        )
                                        .map(
                                            (sponsorship) => (
                                                <option
                                                    key={
                                                        sponsorship.id
                                                    }
                                                    value={
                                                        sponsorship.id
                                                    }
                                                >
                                                    {
                                                        sponsorship.title
                                                    }
                                                    {" — "}
                                                    {getSponsorName(
                                                        sponsorship.sponsor
                                                    )}
                                                </option>
                                            )
                                        )}
                                </select>
                            </FormField>

                            {selectedSponsorship && (
                                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                                    <p className="text-xs text-slate-500">
                                        Available amount
                                    </p>

                                    <p className="mt-1 font-semibold text-[#004D98]">
                                        {formatCurrency(
                                            availableAmount
                                        )}
                                    </p>
                                </div>
                            )}

                            <div className="grid gap-3 sm:grid-cols-2">
                                <FormField label="Amount">
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        min="0.01"
                                        max={
                                            availableAmount ||
                                            undefined
                                        }
                                        step="0.01"
                                        required
                                        className={inputClasses}
                                    />
                                </FormField>

                                <FormField label="Payment date">
                                    <input
                                        type="date"
                                        name="payment_date"
                                        value={
                                            formData.payment_date
                                        }
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    />
                                </FormField>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <FormField label="Payment method">
                                    <select
                                        name="payment_method"
                                        value={
                                            formData.payment_method
                                        }
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    >
                                        <option value="bank_transfer">
                                            Bank transfer
                                        </option>

                                        <option value="cash">
                                            Cash
                                        </option>

                                        <option value="card">
                                            Card
                                        </option>

                                        <option value="cheque">
                                            Cheque
                                        </option>

                                        <option value="other">
                                            Other
                                        </option>
                                    </select>
                                </FormField>

                                <FormField label="Reference">
                                    <input
                                        type="text"
                                        name="reference"
                                        value={
                                            formData.reference
                                        }
                                        onChange={handleChange}
                                        className={inputClasses}
                                    />
                                </FormField>
                            </div>

                            <FormField label="Notes">
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="3"
                                    className={`${inputClasses} resize-none`}
                                />
                            </FormField>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full rounded-lg bg-[#A50044] p-2.5 text-sm font-medium text-white hover:bg-[#8a0038] disabled:cursor-not-allowed disabled:bg-[#A50044]/50"
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

function FormField({ label, children }) {
    return (
        <div>
            <label className={labelClasses}>
                {label}
            </label>

            {children}
        </div>
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
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
            >
                <Icon
                    size={20}
                    className={accent}
                />
            </div>

            <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {label}
                </p>

                <p className="truncate text-xl font-semibold text-slate-900">
                    {value}
                </p>
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

function getSponsorName(sponsor) {
    if (!sponsor) return "—";

    return (
        sponsor.name ||
        sponsor.company_name ||
        "—"
    );
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("fr-MA", {
        style: "currency",
        currency: "MAD",
    }).format(Number(amount || 0));
}

function formatDate(date) {
    if (!date) return "—";

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
}

function formatInputDate(date) {
    if (!date) return "";

    return String(date).slice(0, 10);
}

function formatPaymentMethod(method) {
    if (!method) return "—";

    return method
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}

function getErrorMessage(error) {
    const errors = error.response?.data?.errors;

    if (errors) {
        return Object.values(errors)
            .flat()
            .join(" ");
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
    "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";

const cellClasses =
    "whitespace-nowrap px-4 py-3.5 text-sm text-slate-700";
