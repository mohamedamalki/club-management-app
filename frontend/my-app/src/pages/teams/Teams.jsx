import { useEffect, useState } from "react";
import api from "../../api/axios";

const initialForm = {
    name: "",
    category: "",
    gender: "male",
    description: "",
    status: "active",
};

export default function Teams() {
    const [teams, setTeams] = useState([]);
    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        api.get("/teams")
            .then((response) => {
                if (!cancelled) {
                    setTeams(response.data);
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

    function handleEdit(team) {
        setEditingId(team.id);

        setFormData({
            name: team.name,
            category: team.category,
            gender: team.gender,
            description: team.description || "",
            status: team.status,
        });

        setMessage("");
        setError("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setSubmitting(true);
        setMessage("");
        setError("");

        try {
            if (editingId) {
                const response = await api.put(
                    `/teams/${editingId}`,
                    formData
                );

                setTeams((previousTeams) =>
                    previousTeams.map((team) =>
                        team.id === editingId
                            ? {
                                  ...team,
                                  ...response.data.data,
                              }
                            : team
                    )
                );

                setMessage("Team updated successfully.");
            } else {
                const response = await api.post(
                    "/teams",
                    formData
                );

                setTeams((previousTeams) => [
                    {
                        ...response.data.data,
                        players_count: 0,
                        coaches_count: 0,
                    },
                    ...previousTeams,
                ]);

                setMessage("Team created successfully.");
            }

            resetForm();
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this team?"
        );

        if (!confirmed) {
            return;
        }

        setMessage("");
        setError("");

        try {
            await api.delete(`/teams/${id}`);

            setTeams((previousTeams) =>
                previousTeams.filter(
                    (team) => team.id !== id
                )
            );

            setMessage("Team deleted successfully.");
        } catch (error) {
            setError(getErrorMessage(error));
        }
    }

    return (
        <section>
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">
                    Teams
                </h1>

                <p className="text-sm text-slate-500">
                    Create and manage club teams.
                </p>
            </header>

            {message && (
                <p className="mb-4 rounded-lg bg-green-100 p-3 text-green-700">
                    {message}
                </p>
            )}

            {error && (
                <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
                    {error}
                </p>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4 rounded-xl bg-white p-5 shadow-sm"
                >
                    <h2 className="font-bold text-slate-800">
                        {editingId
                            ? "Edit team"
                            : "Add team"}
                    </h2>

                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Team name"
                        required
                        className={inputClasses}
                    />

                    <input
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        placeholder="Category"
                        required
                        className={inputClasses}
                    />

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

                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Description"
                        rows="3"
                        className={inputClasses}
                    />

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-lg bg-blue-600 p-2.5 font-medium text-white disabled:bg-blue-400"
                    >
                        {submitting
                            ? "Saving..."
                            : editingId
                              ? "Update team"
                              : "Create team"}
                    </button>

                    {editingId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="w-full rounded-lg border border-slate-300 p-2.5"
                        >
                            Cancel
                        </button>
                    )}
                </form>

                <div className="overflow-x-auto rounded-xl bg-white shadow-sm lg:col-span-2">
                    {loading ? (
                        <p className="p-6 text-center">
                            Loading teams...
                        </p>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className={headingClasses}>
                                        Name
                                    </th>

                                    <th className={headingClasses}>
                                        Category
                                    </th>

                                    <th className={headingClasses}>
                                        Gender
                                    </th>

                                    <th className={headingClasses}>
                                        Status
                                    </th>

                                    <th className={headingClasses}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {teams.map((team) => (
                                    <tr
                                        key={team.id}
                                        className="border-t"
                                    >
                                        <td className={cellClasses}>
                                            {team.name}
                                        </td>

                                        <td className={cellClasses}>
                                            {team.category}
                                        </td>

                                        <td
                                            className={`${cellClasses} capitalize`}
                                        >
                                            {team.gender}
                                        </td>

                                        <td
                                            className={`${cellClasses} capitalize`}
                                        >
                                            {team.status}
                                        </td>

                                        <td className={cellClasses}>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        handleEdit(
                                                            team
                                                        )
                                                    }
                                                    className="text-blue-600"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            team.id
                                                        )
                                                    }
                                                    className="text-red-600"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!loading && teams.length === 0 && (
                        <p className="p-6 text-center text-slate-500">
                            No teams found.
                        </p>
                    )}
                </div>
            </div>
        </section>
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
    "w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-500";

const headingClasses =
    "px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500";

const cellClasses =
    "whitespace-nowrap px-4 py-3 text-sm text-slate-700";
