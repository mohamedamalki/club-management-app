import {
    CircleDollarSign,
    FileCheck,
    Handshake,
    Pencil,
    Plus,
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
    sponsor_id: "",
    season_id: "",
    title: "",
    agreed_amount: "",
    start_date: "",
    end_date: "",
    payment_deadline: "",
    contract_file: null,
    status: "active",
    notes: "",
};

export default function Sponsorships() {
    const [sponsorships, setSponsorships] =
        useState([]);

    const [sponsors, setSponsors] = useState([]);
    const [seasons, setSeasons] = useState([]);

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
            api.get("/sponsor-ships"),
            api.get("/sponsors"),
            api.get("/seasons"),
        ])
            .then(
                ([
                    sponsorshipResponse,
                    sponsorResponse,
                    seasonResponse,
                ]) => {
                    if (cancelled) return;

                    setSponsorships(
                        getList(sponsorshipResponse)
                    );

                    setSponsors(
                        getList(sponsorResponse)
                    );

                    setSeasons(
                        getList(seasonResponse)
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

    const stats = useMemo(() => {
        const totalAgreed = sponsorships.reduce(
            (total, sponsorship) =>
                total +
                Number(
                    sponsorship.agreed_amount || 0
                ),
            0
        );

        const totalPaid = sponsorships.reduce(
            (total, sponsorship) =>
                total +
                Number(
                    sponsorship.payments_sum_amount ||
                        0
                ),
            0
        );

        return {
            total: sponsorships.length,

            active: sponsorships.filter(
                (sponsorship) =>
                    sponsorship.status === "active"
            ).length,

            totalAgreed,
            totalPaid,
        };
    }, [sponsorships]);

    const filteredSponsorships = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return sponsorships;
        }

        return sponsorships.filter(
            (sponsorship) => {
                const sponsorName =
                    getSponsorName(
                        sponsorship.sponsor
                    ).toLowerCase();

                const seasonName =
                    sponsorship.season?.name
                        ?.toLowerCase() || "";

                return (
                    sponsorship.title
                        ?.toLowerCase()
                        .includes(query) ||
                    sponsorName.includes(query) ||
                    seasonName.includes(query) ||
                    sponsorship.status
                        ?.toLowerCase()
                        .includes(query)
                );
            }
        );
    }, [sponsorships, search]);

    function handleChange(event) {
        const {
            name,
            value,
            files,
        } = event.target;

        setFormData((previousData) => ({
            ...previousData,

            [name]:
                name === "contract_file"
                    ? files?.[0] ?? null
                    : value,
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

    function handleEdit(sponsorship) {
        setEditingId(sponsorship.id);

        setFormData({
            sponsor_id:
                sponsorship.sponsor_id ?? "",

            season_id:
                sponsorship.season_id ?? "",

            title: sponsorship.title ?? "",

            agreed_amount:
                sponsorship.agreed_amount ?? "",

            start_date: formatInputDate(
                sponsorship.start_date
            ),

            end_date: formatInputDate(
                sponsorship.end_date
            ),

            payment_deadline: formatInputDate(
                sponsorship.payment_deadline
            ),

            contract_file: null,

            status:
                sponsorship.status ?? "active",

            notes: sponsorship.notes ?? "",
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

        const payload = new FormData();

        payload.append(
            "sponsor_id",
            formData.sponsor_id
        );

        payload.append(
            "season_id",
            formData.season_id
        );

        payload.append("title", formData.title);

        payload.append(
            "agreed_amount",
            formData.agreed_amount
        );

        payload.append(
            "start_date",
            formData.start_date
        );

        payload.append(
            "end_date",
            formData.end_date
        );

        payload.append(
            "payment_deadline",
            formData.payment_deadline
        );

        payload.append(
            "status",
            formData.status
        );

        payload.append(
            "notes",
            formData.notes
        );

        if (formData.contract_file) {
            payload.append(
                "contract_file",
                formData.contract_file
            );
        }

        try {
            if (editingId) {
                payload.append("_method", "PUT");

                const response = await api.post(
                    `/sponsor-ships/${editingId}`,
                    payload
                );

                setSponsorships(
                    (previousSponsorships) =>
                        previousSponsorships.map(
                            (sponsorship) =>
                                sponsorship.id ===
                                editingId
                                    ? {
                                          ...response
                                              .data
                                              .data,

                                          payments_sum_amount:
                                              sponsorship.payments_sum_amount ??
                                              0,
                                      }
                                    : sponsorship
                        )
                );

                setMessage(
                    "Sponsorship updated successfully."
                );
                setTimeout(()=>{
                    setMessage("")
                },3000)
            } else {
                const response = await api.post(
                    "/sponsor-ships",
                    payload
                );

                const newSponsorship = {
                    ...response.data.data,
                    payments_sum_amount: 0,
                };

                setSponsorships(
                    (previousSponsorships) => [
                        newSponsorship,
                        ...previousSponsorships,
                    ]
                );

                setMessage(
                    "Sponsorship created successfully."
                );
                setTimeout(()=>{
                    setMessage("")
                },3000)
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

    async function handleDelete(id) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this sponsorship?"
        );

        if (!confirmed) return;

        setMessage("");
        setError("");

        try {
            await api.delete(
                `/sponsor-ships/${id}`
            );

            setSponsorships(
                (previousSponsorships) =>
                    previousSponsorships.filter(
                        (sponsorship) =>
                            sponsorship.id !== id
                    )
            );

            setMessage(
                "Sponsorship deleted successfully."
            );
                setTimeout(()=>{
                    setMessage("")
                },3000)
        } catch (requestError) {
            setError(
                getErrorMessage(requestError)
            );
        }
    }

    return (
        <section>
            {/* Page header */}
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Sponsorships
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage sponsorship contracts and
                        agreed amounts.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A50044] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8a0038]"
                >
                    <Plus size={18} />
                    Add sponsorship
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
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={Handshake}
                    label="Sponsorships"
                    value={stats.total}
                />

                <StatCard
                    icon={FileCheck}
                    label="Active"
                    value={stats.active}
                    accent="text-emerald-600"
                    iconBg="bg-emerald-50"
                />

                <StatCard
                    icon={CircleDollarSign}
                    label="Total agreed"
                    value={formatCurrency(
                        stats.totalAgreed
                    )}
                    accent="text-[#004D98]"
                    iconBg="bg-blue-50"
                />

                <StatCard
                    icon={CircleDollarSign}
                    label="Total received"
                    value={formatCurrency(
                        stats.totalPaid
                    )}
                    accent="text-[#A50044]"
                    iconBg="bg-pink-50"
                />
            </div>

            {/* Table card */}
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
                            placeholder="Search sponsorships..."
                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15"
                        />
                    </div>

                    <p className="hidden text-sm text-slate-500 sm:block">
                        {filteredSponsorships.length}{" "}
                        {filteredSponsorships.length ===
                        1
                            ? "sponsorship"
                            : "sponsorships"}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="p-10 text-center text-sm text-slate-500">
                            Loading sponsorships...
                        </p>
                    ) : filteredSponsorships.length ===
                      0 ? (
                        <p className="p-10 text-center text-sm text-slate-500">
                            {search
                                ? "No sponsorships match your search."
                                : "No sponsorships found."}
                        </p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th
                                        className={
                                            headingClasses
                                        }
                                    >
                                        Sponsorship
                                    </th>

                                    <th
                                        className={
                                            headingClasses
                                        }
                                    >
                                        Sponsor
                                    </th>

                                    <th
                                        className={
                                            headingClasses
                                        }
                                    >
                                        Season
                                    </th>

                                    <th
                                        className={
                                            headingClasses
                                        }
                                    >
                                        Agreed
                                    </th>

                                    <th
                                        className={
                                            headingClasses
                                        }
                                    >
                                        Paid
                                    </th>

                                    <th
                                        className={
                                            headingClasses
                                        }
                                    >
                                        Remaining
                                    </th>

                                    <th
                                        className={
                                            headingClasses
                                        }
                                    >
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
                                {filteredSponsorships.map(
                                    (sponsorship) => {
                                        const paid =
                                            Number(
                                                sponsorship.payments_sum_amount ||
                                                    0
                                            );

                                        const remaining =
                                            Math.max(
                                                Number(
                                                    sponsorship.agreed_amount ||
                                                        0
                                                ) - paid,
                                                0
                                            );

                                        return (
                                            <tr
                                                key={
                                                    sponsorship.id
                                                }
                                                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                                            >
                                                <td
                                                    className={
                                                        cellClasses
                                                    }
                                                >
                                                    <p className="font-medium text-slate-900">
                                                        {
                                                            sponsorship.title
                                                        }
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        {formatDate(
                                                            sponsorship.start_date
                                                        )}
                                                        {" – "}
                                                        {formatDate(
                                                            sponsorship.end_date
                                                        )}
                                                    </p>
                                                </td>

                                                <td
                                                    className={
                                                        cellClasses
                                                    }
                                                >
                                                    {getSponsorName(
                                                        sponsorship.sponsor
                                                    )}
                                                </td>

                                                <td
                                                    className={
                                                        cellClasses
                                                    }
                                                >
                                                    {sponsorship
                                                        .season
                                                        ?.name ||
                                                        "—"}
                                                </td>

                                                <td
                                                    className={
                                                        cellClasses
                                                    }
                                                >
                                                    {formatCurrency(
                                                        sponsorship.agreed_amount
                                                    )}
                                                </td>

                                                <td
                                                    className={`${cellClasses} text-emerald-700`}
                                                >
                                                    {formatCurrency(
                                                        paid
                                                    )}
                                                </td>

                                                <td
                                                    className={`${cellClasses} text-[#A50044]`}
                                                >
                                                    {formatCurrency(
                                                        remaining
                                                    )}
                                                </td>

                                                <td
                                                    className={
                                                        cellClasses
                                                    }
                                                >
                                                    <StatusBadge
                                                        status={
                                                            sponsorship.status
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
                                                                    sponsorship
                                                                )
                                                            }
                                                            title="Edit"
                                                            aria-label={`Edit ${sponsorship.title}`}
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
                                                                    sponsorship.id
                                                                )
                                                            }
                                                            title="Delete"
                                                            aria-label={`Delete ${sponsorship.title}`}
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
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add/edit modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
                    <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {editingId
                                        ? "Edit sponsorship"
                                        : "Add sponsorship"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Enter the sponsorship
                                    contract information.
                                </p>
                            </div>

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
                            {error && (
                                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </p>
                            )}

                            <div className="grid gap-3 sm:grid-cols-2">
                                <FormField label="Sponsor">
                                    <select
                                        name="sponsor_id"
                                        value={
                                            formData.sponsor_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        className={
                                            inputClasses
                                        }
                                    >
                                        <option value="">
                                            Select sponsor
                                        </option>

                                        {sponsors.map(
                                            (sponsor) => (
                                                <option
                                                    key={
                                                        sponsor.id
                                                    }
                                                    value={
                                                        sponsor.id
                                                    }
                                                >
                                                    {getSponsorName(
                                                        sponsor
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </FormField>

                                <FormField label="Season">
                                    <select
                                        name="season_id"
                                        value={
                                            formData.season_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        className={
                                            inputClasses
                                        }
                                    >
                                        <option value="">
                                            Select season
                                        </option>

                                        {seasons.map(
                                            (season) => (
                                                <option
                                                    key={
                                                        season.id
                                                    }
                                                    value={
                                                        season.id
                                                    }
                                                >
                                                    {
                                                        season.name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </FormField>
                            </div>

                            <FormField label="Title">
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className={inputClasses}
                                />
                            </FormField>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <FormField label="Agreed amount">
                                    <input
                                        type="number"
                                        name="agreed_amount"
                                        value={
                                            formData.agreed_amount
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        min="0.01"
                                        step="0.01"
                                        required
                                        className={
                                            inputClasses
                                        }
                                    />
                                </FormField>

                                <FormField label="Status">
                                    <select
                                        name="status"
                                        value={
                                            formData.status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        className={
                                            inputClasses
                                        }
                                    >
                                        <option value="draft">
                                            Draft
                                        </option>

                                        <option value="active">
                                            Active
                                        </option>

                                        <option value="completed">
                                            Completed
                                        </option>

                                        <option value="cancelled">
                                            Cancelled
                                        </option>
                                    </select>
                                </FormField>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <FormField label="Start date">
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={
                                            formData.start_date
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        className={
                                            inputClasses
                                        }
                                    />
                                </FormField>

                                <FormField label="End date">
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={
                                            formData.end_date
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        min={
                                            formData.start_date
                                        }
                                        required
                                        className={
                                            inputClasses
                                        }
                                    />
                                </FormField>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <FormField label="Payment deadline">
                                    <input
                                        type="date"
                                        name="payment_deadline"
                                        value={
                                            formData.payment_deadline
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className={
                                            inputClasses
                                        }
                                    />
                                </FormField>

                                <FormField label="Contract file">
                                    <input
                                        type="file"
                                        name="contract_file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={
                                            handleChange
                                        }
                                        className={
                                            inputClasses
                                        }
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
                                          ? "Update sponsorship"
                                          : "Create sponsorship"}
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

function StatusBadge({ status }) {
    const base =
        "inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize";

    const statusClasses = {
        draft: "bg-slate-100 text-slate-600",
        active: "bg-emerald-50 text-emerald-700",
        completed: "bg-blue-50 text-[#004D98]",
        cancelled: "bg-red-50 text-red-700",
    };

    return (
        <span
            className={`${base} ${
                statusClasses[status] ??
                "bg-slate-100 text-slate-600"
            }`}
        >
            {status || "—"}
        </span>
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
        `${sponsor.first_name ?? ""} ${
            sponsor.last_name ?? ""
        }`.trim() ||
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
