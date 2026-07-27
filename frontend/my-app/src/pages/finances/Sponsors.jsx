import { useEffect, useMemo, useState } from "react";
import {
    Handshake,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    ShieldOff,
    Trash2,
    X,
} from "lucide-react";
import api from "../../api/axios";

const initialForm = {
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    logo: "",
    notes: "",
    status: "active",
};

export default function Sponsors() {
    const [sponsors, setSponsors] = useState([]);
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

        api.get("/sponsors")
            .then((response) => {
                if (!cancelled) {
                    setSponsors(response.data);
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
            total: sponsors.length,
            active: sponsors.filter(
                (s) => s.status === "active"
            ).length,
            inactive: sponsors.filter(
                (s) => s.status === "inactive"
            ).length,
        };
    }, [sponsors]);

    const filteredSponsors = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return sponsors;
        }

        return sponsors.filter(
            (sponsor) =>
                sponsor.name.toLowerCase().includes(query) ||
                (sponsor.contact_person || "")
                    .toLowerCase()
                    .includes(query) ||
                (sponsor.email || "")
                    .toLowerCase()
                    .includes(query)
        );
    }, [sponsors, search]);

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

    function handleEdit(sponsor) {
        setEditingId(sponsor.id);

        setFormData({
            name: sponsor.name,
            contact_person: sponsor.contact_person || "",
            email: sponsor.email || "",
            phone: sponsor.phone || "",
            address: sponsor.address || "",
            logo: sponsor.logo || "",
            notes: sponsor.notes || "",
            status: sponsor.status,
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
            contact_person: formData.contact_person || null,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            logo: formData.logo || null,
            notes: formData.notes || null,
        };

        try {
            if (editingId) {
                const response = await api.put(
                    `/sponsors/${editingId}`,
                    payload
                );

                setSponsors((previousSponsors) =>
                    previousSponsors.map((sponsor) =>
                        sponsor.id === editingId
                            ? response.data.data
                            : sponsor
                    )
                );

                setMessage("Sponsor updated successfully.");
            } else {
                const response = await api.post(
                    "/sponsors",
                    payload
                );

                setSponsors((previousSponsors) => [
                    response.data.data,
                    ...previousSponsors,
                ]);

                setMessage("Sponsor created successfully.");
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
            "Are you sure you want to delete this sponsor?"
        );

        if (!confirmed) {
            return;
        }

        setMessage("");
        setError("");

        try {
            await api.delete(`/sponsors/${id}`);

            setSponsors((previousSponsors) =>
                previousSponsors.filter(
                    (sponsor) => sponsor.id !== id
                )
            );

            setMessage("Sponsor deleted successfully.");
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
                        Sponsors
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage club sponsors and partners.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A50044] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8a0038]"
                >
                    <Plus size={18} />
                    Add sponsor
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
                    icon={Handshake}
                    label="Total sponsors"
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
                            placeholder="Search sponsors..."
                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15"
                        />
                    </div>

                    <p className="hidden text-sm text-slate-500 sm:block">
                        {filteredSponsors.length}{" "}
                        {filteredSponsors.length === 1
                            ? "sponsor"
                            : "sponsors"}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="p-10 text-center text-sm text-slate-500">
                            Loading sponsors...
                        </p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className={headingClasses}>
                                        Sponsor
                                    </th>
                                    <th className={headingClasses}>
                                        Contact person
                                    </th>
                                    <th className={headingClasses}>
                                        Phone
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
                                {filteredSponsors.map(
                                    (sponsor) => (
                                        <tr
                                            key={sponsor.id}
                                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                                        >
                                            <td className={cellClasses}>
                                                <p className="font-medium text-slate-900">
                                                    {sponsor.name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {sponsor.email ||
                                                        "—"}
                                                </p>
                                            </td>

                                            <td className={cellClasses}>
                                                {sponsor.contact_person ||
                                                    "—"}
                                            </td>

                                            <td className={cellClasses}>
                                                {sponsor.phone ||
                                                    "—"}
                                            </td>

                                            <td className={cellClasses}>
                                                <StatusBadge
                                                    status={
                                                        sponsor.status
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
                                                                sponsor
                                                            )
                                                        }
                                                        aria-label={`Edit ${sponsor.name}`}
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
                                                                sponsor.id
                                                            )
                                                        }
                                                        aria-label={`Delete ${sponsor.name}`}
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

                    {!loading && filteredSponsors.length === 0 && (
                        <p className="p-10 text-center text-sm text-slate-500">
                            {search
                                ? "No sponsors match your search."
                                : "No sponsors found."}
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
                                    ? "Edit sponsor"
                                    : "Add sponsor"}
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
                                    Sponsor name
                                </label>
                                <input
                                    name="name"
                                    value={formData.name}
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
                                        Contact person
                                    </label>
                                    <input
                                        name="contact_person"
                                        value={
                                            formData.contact_person
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
                            </div>

                            <div className="grid grid-cols-2 gap-3">
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
                            </div>

                            <div>
                                <label className={labelClasses}>
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
                                <label className={labelClasses}>
                                    Logo{" "}
                                    <span className="font-normal normal-case text-slate-400">
                                        (path or filename,
                                        optional)
                                    </span>
                                </label>
                                <input
                                    name="logo"
                                    value={formData.logo}
                                    onChange={handleChange}
                                    placeholder="logos/sponsor-name.png"
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
                                    rows="3"
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
                                          ? "Update sponsor"
                                          : "Create sponsor"}
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
