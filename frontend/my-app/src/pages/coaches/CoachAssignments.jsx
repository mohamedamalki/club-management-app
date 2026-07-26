import { useEffect, useMemo, useState } from "react";
import {
    ClipboardList,
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
    coach_id: "",
    team_id: "",
    season_id: "",
    role: "head_coach",
    start_date: "",
    end_date: "",
    status: "active",
};

export default function CoachAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [teams, setTeams] = useState([]);
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
            api.get("/coach-assignments"),
            api.get("/coaches"),
            api.get("/teams"),
            api.get("/seasons"),
        ])
            .then(
                ([
                    assignmentsResponse,
                    coachesResponse,
                    teamsResponse,
                    seasonsResponse,
                ]) => {
                    if (!cancelled) {
                        setAssignments(
                            assignmentsResponse.data
                        );

                        setCoaches(coachesResponse.data);
                        setTeams(teamsResponse.data);
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
        return {
            total: assignments.length,
            active: assignments.filter(
                (a) => a.status === "active"
            ).length,
            inactive: assignments.filter(
                (a) => a.status === "inactive"
            ).length,
        };
    }, [assignments]);

    const filteredAssignments = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return assignments;
        }

        return assignments.filter((assignment) => {
            const coachName =
                `${assignment.coach?.first_name ?? ""} ${assignment.coach?.last_name ?? ""}`.toLowerCase();

            return (
                coachName.includes(query) ||
                (assignment.team?.name || "")
                    .toLowerCase()
                    .includes(query) ||
                (assignment.season?.name || "")
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [assignments, search]);

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

    function handleEdit(assignment) {
        setEditingId(assignment.id);

        setFormData({
            coach_id: String(assignment.coach_id),
            team_id: String(assignment.team_id),
            season_id: String(assignment.season_id),
            role: assignment.role,
            start_date: formatInputDate(
                assignment.start_date
            ),
            end_date: formatInputDate(
                assignment.end_date
            ),
            status: assignment.status,
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
            team_id: Number(formData.team_id),
            season_id: Number(formData.season_id),
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
        };

        try {
            if (editingId) {
                const response = await api.put(
                    `/coach-assignments/${editingId}`,
                    payload
                );

                setAssignments((previousAssignments) =>
                    previousAssignments.map((assignment) =>
                        assignment.id === editingId
                            ? response.data.data
                            : assignment
                    )
                );

                setMessage(
                    "Assignment updated successfully."
                );
            } else {
                const response = await api.post(
                    "/coach-assignments",
                    payload
                );

                setAssignments((previousAssignments) => [
                    response.data.data,
                    ...previousAssignments,
                ]);

                setMessage(
                    "Coach assigned successfully."
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
            "Remove this coach assignment?"
        );

        if (!confirmed) {
            return;
        }

        setMessage("");
        setError("");

        try {
            await api.delete(
                `/coach-assignments/${id}`
            );

            setAssignments((previousAssignments) =>
                previousAssignments.filter(
                    (assignment) =>
                        assignment.id !== id
                )
            );

            setMessage(
                "Assignment removed successfully."
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
                        Coach assignments
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Assign coaches to teams and seasons.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A50044] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8a0038] disabled:cursor-not-allowed disabled:bg-[#A50044]/50"
                >
                    <Plus size={18} />
                    New assignment
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
                    icon={ClipboardList}
                    label="Total assignments"
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
                            placeholder="Search by coach, team, season..."
                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15"
                        />
                    </div>

                    <p className="hidden text-sm text-slate-500 sm:block">
                        {filteredAssignments.length}{" "}
                        {filteredAssignments.length === 1
                            ? "assignment"
                            : "assignments"}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="p-10 text-center text-sm text-slate-500">
                            Loading assignments...
                        </p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className={headingClasses}>
                                        Coach
                                    </th>
                                    <th className={headingClasses}>
                                        Team
                                    </th>
                                    <th className={headingClasses}>
                                        Season
                                    </th>
                                    <th className={headingClasses}>
                                        Role
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
                                {filteredAssignments.map(
                                    (assignment) => (
                                        <tr
                                            key={assignment.id}
                                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                                        >
                                            <td
                                                className={`${cellClasses} font-medium text-slate-900`}
                                            >
                                                {
                                                    assignment
                                                        .coach
                                                        ?.first_name
                                                }{" "}
                                                {
                                                    assignment
                                                        .coach
                                                        ?.last_name
                                                }
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                {
                                                    assignment
                                                        .team
                                                        ?.name
                                                }
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                {
                                                    assignment
                                                        .season
                                                        ?.name
                                                }
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                <span className="inline-block rounded-full bg-[#004D98]/10 px-2.5 py-1 text-xs font-medium capitalize text-[#004D98]">
                                                    {assignment.role.replaceAll(
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
                                                <StatusBadge
                                                    status={
                                                        assignment.status
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
                                                                assignment
                                                            )
                                                        }
                                                        aria-label="Edit assignment"
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
                                                                assignment.id
                                                            )
                                                        }
                                                        aria-label="Delete assignment"
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

                    {!loading &&
                        filteredAssignments.length === 0 && (
                            <p className="p-10 text-center text-sm text-slate-500">
                                {search
                                    ? "No assignments match your search."
                                    : "No assignments found."}
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
                                    ? "Edit assignment"
                                    : "New assignment"}
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
                                    Coach
                                </label>
                                <select
                                    name="coach_id"
                                    value={formData.coach_id}
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
                                            {coach.first_name}{" "}
                                            {coach.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label
                                        className={labelClasses}
                                    >
                                        Team
                                    </label>
                                    <select
                                        name="team_id"
                                        value={formData.team_id}
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    >
                                        <option value="">
                                            Select team
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
                                                    {season.name}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    Role
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className={inputClasses}
                                >
                                    <option value="head_coach">
                                        Head coach
                                    </option>
                                    <option value="assistant_coach">
                                        Assistant coach
                                    </option>
                                </select>
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
                                    <option value="active">
                                        Active
                                    </option>
                                    <option value="inactive">
                                        Inactive
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
                                          ? "Update assignment"
                                          : "Assign coach"}
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

const inputClasses =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15";

const labelClasses =
    "mb-1.5 block text-xs font-medium text-slate-600";

const headingClasses =
    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";

const cellClasses =
    "whitespace-nowrap px-4 py-3.5 text-sm text-slate-700";
