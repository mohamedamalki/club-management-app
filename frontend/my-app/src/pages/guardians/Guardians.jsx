import { useEffect, useMemo, useState } from "react";
import {
    Link2,
    Pencil,
    Plus,
    Search,
    Trash2,
    Users,
    UserRoundCheck,
    UserRoundX,
    X,
} from "lucide-react";
import api from "../../api/axios";

const initialForm = {
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
};

const initialLinkForm = {
    player_id: "",
    relationship: "father",
    is_primary: false,
};

const relationshipOptions = [
    "father",
    "mother",
    "brother",
    "sister",
    "other",
];

export default function Guardians() {
    const [guardians, setGuardians] = useState([]);
    const [players, setPlayers] = useState([]);
    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [search, setSearch] = useState("");

    const [linkForm, setLinkForm] = useState(initialLinkForm);
    const [linking, setLinking] = useState(false);
    const [linkError, setLinkError] = useState("");
    const [pendingLinks, setPendingLinks] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            api.get("/guardians"),
            api.get("/players"),
        ])
            .then(([guardiansResponse, playersResponse]) => {
                if (!cancelled) {
                    setGuardians(guardiansResponse.data);
                    setPlayers(playersResponse.data);
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

    const editingGuardian = useMemo(
        () => guardians.find((g) => g.id === editingId) || null,
        [guardians, editingId]
    );

    const linkedPlayerIds = useMemo(() => {
        if (editingId) {
            return new Set(
                (editingGuardian?.players || []).map((p) => p.id)
            );
        }

        return new Set(pendingLinks.map((link) => link.player_id));
    }, [editingId, editingGuardian, pendingLinks]);

    const availablePlayers = useMemo(
        () => players.filter((p) => !linkedPlayerIds.has(p.id)),
        [players, linkedPlayerIds]
    );

    const stats = useMemo(() => {
        const linked = guardians.filter(
            (g) => (g.players?.length ?? 0) > 0
        ).length;

        return {
            total: guardians.length,
            linked,
            unlinked: guardians.length - linked,
        };
    }, [guardians]);

    const filteredGuardians = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return guardians;
        }

        return guardians.filter((guardian) => {
            const fullName =
                `${guardian.first_name} ${guardian.last_name}`.toLowerCase();

            return (
                fullName.includes(query) ||
                (guardian.email || "")
                    .toLowerCase()
                    .includes(query) ||
                (guardian.phone || "")
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [guardians, search]);

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
        setLinkForm(initialLinkForm);
        setLinkError("");
        setPendingLinks([]);
    }

    function openAddForm() {
        resetForm();
        setIsFormOpen(true);
    }

    function handleEdit(guardian) {
        setEditingId(guardian.id);

        setFormData({
            first_name: guardian.first_name,
            last_name: guardian.last_name,
            phone: guardian.phone,
            email: guardian.email || "",
            address: guardian.address || "",
            notes: guardian.notes || "",
        });

        setMessage("");
        setError("");
        setLinkForm(initialLinkForm);
        setLinkError("");
        setIsFormOpen(true);
    }

    function closeForm() {
        resetForm();
        setIsFormOpen(false);
    }

    function handleLinkChange(event) {
        const { name, value, type, checked } = event.target;

        setLinkForm((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    async function handleLinkPlayer(event) {
        event.preventDefault();

        if (!linkForm.player_id) {
            return;
        }

        // Create mode: guardian doesn't exist yet, so just stage
        // the link locally — it gets sent right after creation.
        if (!editingId) {
            const player = players.find(
                (p) => p.id === Number(linkForm.player_id)
            );

            setPendingLinks((previous) => [
                ...previous,
                {
                    player_id: Number(linkForm.player_id),
                    relationship: linkForm.relationship,
                    is_primary: linkForm.is_primary,
                    playerName: player
                        ? `${player.first_name} ${player.last_name}`
                        : "Player",
                },
            ]);

            setLinkForm(initialLinkForm);
            return;
        }

        // Edit mode: guardian already exists, attach right away.
        setLinking(true);
        setLinkError("");

        try {
            const response = await api.post(
                `/guardians/${editingId}/players`,
                {
                    player_id: Number(linkForm.player_id),
                    relationship: linkForm.relationship,
                    is_primary: linkForm.is_primary,
                }
            );

            const updatedGuardian = response.data.data;

            setGuardians((previousGuardians) =>
                previousGuardians.map((guardian) =>
                    guardian.id === editingId
                        ? updatedGuardian
                        : guardian
                )
            );

            setLinkForm(initialLinkForm);
        } catch (error) {
            setLinkError(getErrorMessage(error));
        } finally {
            setLinking(false);
        }
    }

    function removePendingLink(playerId) {
        setPendingLinks((previous) =>
            previous.filter(
                (link) => link.player_id !== playerId
            )
        );
    }

    async function handleUnlinkPlayer(playerId) {
        if (!editingId) {
            removePendingLink(playerId);
            return;
        }

        const confirmed = window.confirm(
            "Remove this player from the guardian?"
        );

        if (!confirmed) {
            return;
        }

        setLinkError("");

        try {
            await api.delete(
                `/guardians/${editingId}/players/${playerId}`
            );

            setGuardians((previousGuardians) =>
                previousGuardians.map((guardian) =>
                    guardian.id === editingId
                        ? {
                              ...guardian,
                              players: (
                                  guardian.players || []
                              ).filter((p) => p.id !== playerId),
                          }
                        : guardian
                )
            );
        } catch (error) {
            setLinkError(getErrorMessage(error));
        }
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
            notes: formData.notes || null,
        };

        try {
            if (editingId) {
                const response = await api.put(
                    `/guardians/${editingId}`,
                    payload
                );

                setGuardians((previousGuardians) =>
                    previousGuardians.map((guardian) =>
                        guardian.id === editingId
                            ? {
                                ...guardian,
                                ...response.data.data,
                            }
                            : guardian
                    )
                );

                setMessage("Guardian updated successfully.");
                setTimeout(()=>{
                    setMessage("")
                }, 3000)
            } else {
                const response = await api.post(
                    "/guardians",
                    payload
                );

                const newGuardian = response.data.data;
                let finalGuardian = {
                    ...newGuardian,
                    players: [],
                };

                // Attach any players staged before the guardian existed.
                for (const link of pendingLinks) {
                    try {
                        const linkResponse = await api.post(
                            `/guardians/${newGuardian.id}/players`,
                            {
                                player_id: link.player_id,
                                relationship: link.relationship,
                                is_primary: link.is_primary,
                            }
                        );

                        finalGuardian = linkResponse.data.data;
                    } catch (linkErr) {
                        setError(
                            `Guardian created, but linking ${link.playerName} failed: ${getErrorMessage(linkErr)}`
                        );
                    }
                }

                setGuardians((previousGuardians) => [
                    finalGuardian,
                    ...previousGuardians,
                ]);

                setMessage("Guardian created successfully.");
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
            "Are you sure you want to delete this guardian?"
        );

        if (!confirmed) {
            return;
        }

        setMessage("");
        setError("");

        try {
            await api.delete(`/guardians/${id}`);

            setGuardians((previousGuardians) =>
                previousGuardians.filter(
                    (guardian) => guardian.id !== id
                )
            );

            setMessage("Guardian deleted successfully.");
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
                        Guardians
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage guardians and their linked players.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A50044] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8a0038]"
                >
                    <Plus size={18} />
                    Add guardian
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
                    label="Total guardians"
                    value={stats.total}
                />
                <StatCard
                    icon={UserRoundCheck}
                    label="Linked to a player"
                    value={stats.linked}
                    accent="text-emerald-600"
                    iconBg="bg-emerald-50"
                />
                <StatCard
                    icon={UserRoundX}
                    label="Not yet linked"
                    value={stats.unlinked}
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
                            placeholder="Search guardians..."
                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15"
                        />
                    </div>

                    <p className="hidden text-sm text-slate-500 sm:block">
                        {filteredGuardians.length}{" "}
                        {filteredGuardians.length === 1
                            ? "guardian"
                            : "guardians"}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="p-10 text-center text-sm text-slate-500">
                            Loading guardians...
                        </p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className={headingClasses}>
                                        Guardian
                                    </th>
                                    <th className={headingClasses}>
                                        Phone
                                    </th>
                                    <th className={headingClasses}>
                                        Address
                                    </th>
                                    <th className={headingClasses}>
                                        Linked players
                                    </th>
                                    <th
                                        className={`${headingClasses} text-right`}
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredGuardians.map(
                                    (guardian) => (
                                        <tr
                                            key={guardian.id}
                                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                                        >
                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                <p className="font-medium text-slate-900">
                                                    {
                                                        guardian.first_name
                                                    }{" "}
                                                    {
                                                        guardian.last_name
                                                    }
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {guardian.email ||
                                                        "—"}
                                                </p>
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                {guardian.phone}
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                {guardian.address ||
                                                    "—"}
                                            </td>

                                            <td
                                                className={
                                                    cellClasses
                                                }
                                            >
                                                {guardian.players
                                                    ?.length ? (
                                                    <span className="inline-block rounded-full bg-[#004D98]/10 px-2.5 py-1 text-xs font-medium text-[#004D98]">
                                                        {
                                                            guardian
                                                                .players
                                                                .length
                                                        }{" "}
                                                        {guardian
                                                            .players
                                                            .length ===
                                                        1
                                                            ? "player"
                                                            : "players"}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        None
                                                    </span>
                                                )}
                                            </td>

                                            <td
                                                className={`${cellClasses} text-right`}
                                            >
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                guardian
                                                            )
                                                        }
                                                        aria-label={`Edit ${guardian.first_name}`}
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
                                                                guardian.id
                                                            )
                                                        }
                                                        aria-label={`Delete ${guardian.first_name}`}
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
                        filteredGuardians.length === 0 && (
                            <p className="p-10 text-center text-sm text-slate-500">
                                {search
                                    ? "No guardians match your search."
                                    : "No guardians found."}
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
                                    ? "Edit guardian"
                                    : "Add guardian"}
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
                            </div>

                            <div className="grid grid-cols-2 gap-3">
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
                                          ? "Update guardian"
                                          : "Create guardian"}
                                </button>
                            </div>
                        </form>

                        {/* linked players — real attach/detach when editing, staged locally when creating */}
                        <div className="mt-6 border-t border-slate-200 pt-5">
                            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <Link2 size={15} />
                                Linked players
                            </h3>
                            <p className="mb-3 text-xs text-slate-500">
                                {editingId
                                    ? "Link this guardian to a player, e.g. a parent to their child."
                                    : "Link a player now, or add them after saving."}
                            </p>

                            {linkError && (
                                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                    {linkError}
                                </p>
                            )}

                            {editingId
                                ? (editingGuardian?.players || [])
                                      .length > 0 && (
                                      <ul className="mb-3 space-y-2">
                                          {editingGuardian.players.map(
                                              (player) => (
                                                  <li
                                                      key={
                                                          player.id
                                                      }
                                                      className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                  >
                                                      <div>
                                                          <span className="font-medium text-slate-900">
                                                              {
                                                                  player.first_name
                                                              }{" "}
                                                              {
                                                                  player.last_name
                                                              }
                                                          </span>
                                                          <span className="ml-2 text-xs capitalize text-slate-500">
                                                              {
                                                                  player
                                                                      .pivot
                                                                      ?.relationship
                                                              }
                                                              {player
                                                                  .pivot
                                                                  ?.is_primary
                                                                  ? " · primary"
                                                                  : ""}
                                                          </span>
                                                      </div>

                                                      <button
                                                          type="button"
                                                          onClick={() =>
                                                              handleUnlinkPlayer(
                                                                  player.id
                                                              )
                                                          }
                                                          aria-label={`Unlink ${player.first_name}`}
                                                          title="Unlink"
                                                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                      >
                                                          <Trash2
                                                              size={
                                                                  15
                                                              }
                                                          />
                                                      </button>
                                                  </li>
                                              )
                                          )}
                                      </ul>
                                  )
                                : pendingLinks.length > 0 && (
                                      <ul className="mb-3 space-y-2">
                                          {pendingLinks.map(
                                              (link) => (
                                                  <li
                                                      key={
                                                          link.player_id
                                                      }
                                                      className="flex items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                                                  >
                                                      <div>
                                                          <span className="font-medium text-slate-900">
                                                              {
                                                                  link.playerName
                                                              }
                                                          </span>
                                                          <span className="ml-2 text-xs capitalize text-slate-500">
                                                              {
                                                                  link.relationship
                                                              }
                                                              {link.is_primary
                                                                  ? " · primary"
                                                                  : ""}
                                                              {" · pending"}
                                                          </span>
                                                      </div>

                                                      <button
                                                          type="button"
                                                          onClick={() =>
                                                              removePendingLink(
                                                                  link.player_id
                                                              )
                                                          }
                                                          aria-label={`Remove ${link.playerName}`}
                                                          title="Remove"
                                                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                      >
                                                          <Trash2
                                                              size={
                                                                  15
                                                              }
                                                          />
                                                      </button>
                                                  </li>
                                              )
                                          )}
                                      </ul>
                                  )}

                            <form
                                onSubmit={handleLinkPlayer}
                                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                            >
                                <select
                                    name="player_id"
                                    value={linkForm.player_id}
                                    onChange={handleLinkChange}
                                    required
                                    className={`${inputClasses} col-span-2 sm:col-span-2`}
                                >
                                    <option value="">
                                        Select player...
                                    </option>
                                    {availablePlayers.map(
                                        (player) => (
                                            <option
                                                key={player.id}
                                                value={player.id}
                                            >
                                                {player.first_name}{" "}
                                                {player.last_name}
                                            </option>
                                        )
                                    )}
                                </select>

                                <select
                                    name="relationship"
                                    value={linkForm.relationship}
                                    onChange={handleLinkChange}
                                    className={inputClasses}
                                >
                                    {relationshipOptions.map(
                                        (option) => (
                                            <option
                                                key={option}
                                                value={option}
                                            >
                                                {option
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    option.slice(1)}
                                            </option>
                                        )
                                    )}
                                </select>

                                <button
                                    type="submit"
                                    disabled={
                                        linking ||
                                        !linkForm.player_id
                                    }
                                    className="rounded-lg bg-[#004D98] px-3 text-sm font-medium text-white transition hover:bg-[#003b76] disabled:cursor-not-allowed disabled:bg-[#004D98]/50"
                                >
                                    {linking
                                        ? "Linking..."
                                        : "Link"}
                                </button>

                                <label className="col-span-2 flex items-center gap-2 text-xs text-slate-600 sm:col-span-4">
                                    <input
                                        type="checkbox"
                                        name="is_primary"
                                        checked={
                                            linkForm.is_primary
                                        }
                                        onChange={
                                            handleLinkChange
                                        }
                                        className="h-4 w-4 rounded border-slate-300 text-[#004D98] focus:ring-[#004D98]/30"
                                    />
                                    Primary contact for this
                                    player
                                </label>
                            </form>
                        </div>
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
