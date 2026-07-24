import { useEffect, useState } from "react";
import api from "../../api/axios";

const initialForm = {
    name: "",
    start_date: "",
    end_date: "",
    status: "upcoming",
};

export default function Seasons() {
    const [seasons, setSeasons] = useState([]);
    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

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
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">
                    Seasons
                </h1>

                <p className="text-sm text-slate-500">
                    Create and manage sporting seasons.
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
                            ? "Edit season"
                            : "Add season"}
                    </h2>

                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Season name"
                        required
                        className={inputClasses}
                    />

                    <input
                        name="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                        className={inputClasses}
                    />

                    <input
                        name="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={handleChange}
                        required
                        className={inputClasses}
                    />

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

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-lg bg-blue-600 p-2.5 font-medium text-white disabled:bg-blue-400"
                    >
                        {submitting
                            ? "Saving..."
                            : editingId
                              ? "Update season"
                              : "Create season"}
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
                            Loading seasons...
                        </p>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
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

                                    <th className={headingClasses}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {seasons.map((season) => (
                                    <tr
                                        key={season.id}
                                        className="border-t"
                                    >
                                        <td className={cellClasses}>
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

                                        <td
                                            className={`${cellClasses} capitalize`}
                                        >
                                            {season.status}
                                        </td>

                                        <td className={cellClasses}>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        handleEdit(
                                                            season
                                                        )
                                                    }
                                                    className="text-blue-600"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            season.id
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

                    {!loading && seasons.length === 0 && (
                        <p className="p-6 text-center text-slate-500">
                            No seasons found.
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
