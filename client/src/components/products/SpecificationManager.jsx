import { useEffect, useState } from "react";
import { LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createSpecification,
  createSpecificationGroup,
  deleteSpecification,
  deleteSpecificationGroup,
  getSpecificationGroups,
  getSpecifications,
  updateSpecification,
  updateSpecificationGroup,
} from "../../services/specification.service";

const unwrap = (response) => response?.data?.data ?? response?.data;

const messageFrom = (error, fallback) => {
  const issues = error?.response?.data?.errors;
  const details = Array.isArray(issues)
    ? issues.map((issue) => issue.message).filter(Boolean).join(", ")
    : "";
  return details
    ? `${error?.response?.data?.message || fallback}: ${details}`
    : error?.response?.data?.message || fallback;
};

const SpecificationManager = ({ onClose, onChanged }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [specifications, setSpecifications] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [specificationName, setSpecificationName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState("");
  const [editingSpecificationId, setEditingSpecificationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadGroups = async (preferredId) => {
    const response = unwrap(await getSpecificationGroups());
    const nextGroups = Array.isArray(response?.groups)
      ? response.groups
      : Array.isArray(response)
        ? response
        : [];
    setGroups(nextGroups);
    const nextId =
      preferredId && nextGroups.some((group) => group.id === preferredId)
        ? preferredId
        : selectedGroupId && nextGroups.some((group) => group.id === selectedGroupId)
          ? selectedGroupId
          : nextGroups[0]?.id || "";
    setSelectedGroupId(nextId);
    return nextGroups;
  };

  const loadSpecifications = async (groupId) => {
    if (!groupId) {
      setSpecifications([]);
      return;
    }
    const response = unwrap(await getSpecifications(groupId));
    setSpecifications(
      Array.isArray(response?.specifications)
        ? response.specifications
        : Array.isArray(response)
          ? response
          : []
    );
  };

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const response = unwrap(await getSpecificationGroups());
        const nextGroups = Array.isArray(response?.groups)
          ? response.groups
          : Array.isArray(response)
            ? response
            : [];
        if (!active) return;
        setGroups(nextGroups);
        setSelectedGroupId(nextGroups[0]?.id || "");
      } catch (loadError) {
        if (active) setError(messageFrom(loadError, "Unable to load groups."));
      } finally {
        if (active) setLoading(false);
      }
    };
    initialize();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!selectedGroupId) {
        setSpecifications([]);
        return;
      }
      try {
        const response = unwrap(await getSpecifications(selectedGroupId));
        const nextSpecifications = Array.isArray(response?.specifications)
          ? response.specifications
          : Array.isArray(response)
            ? response
            : [];
        if (active) setSpecifications(nextSpecifications);
      } catch (loadError) {
        if (active) setError(messageFrom(loadError, "Unable to load definitions."));
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [selectedGroupId]);

  const runMutation = async (operation, successMessage, preferredGroupId) => {
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");
      await operation();
      await loadGroups(preferredGroupId);
      if (preferredGroupId || selectedGroupId) {
        await loadSpecifications(preferredGroupId || selectedGroupId);
      }
      setSuccessMessage(successMessage);
      await onChanged();
      return successMessage;
    } catch (mutationError) {
      setError(messageFrom(mutationError, "Unable to save specification data."));
      return "";
    } finally {
      setSaving(false);
    }
  };

  const handleGroupSubmit = async (event) => {
    event.preventDefault();
    const name = groupName.trim();
    if (!name) return;

    const success = await runMutation(
      () =>
        editingGroupId
          ? updateSpecificationGroup(editingGroupId, { name })
          : createSpecificationGroup({ name }),
      "Group saved.",
      editingGroupId || selectedGroupId
    );
    if (success) {
      setGroupName("");
      setEditingGroupId("");
    }
  };

  const handleSpecificationSubmit = async (event) => {
    event.preventDefault();
    const name = specificationName.trim();
    if (!name || !selectedGroupId) return;

    const success = await runMutation(
      () =>
        editingSpecificationId
          ? updateSpecification(editingSpecificationId, { name })
          : createSpecification(selectedGroupId, { name }),
      "Definition saved.",
      selectedGroupId
    );
    if (success) {
      setSpecificationName("");
      setEditingSpecificationId("");
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Delete the "${group.name}" group?`)) return;
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");
      await deleteSpecificationGroup(group.id);
      const response = unwrap(await getSpecificationGroups());
      const nextGroups = Array.isArray(response?.groups)
        ? response.groups
        : Array.isArray(response)
          ? response
          : [];
      setGroups(nextGroups);
      const nextGroupId =
        selectedGroupId === group.id
          ? nextGroups[0]?.id || ""
          : selectedGroupId;
      setSelectedGroupId(nextGroupId);
      await loadSpecifications(nextGroupId);
      setSuccessMessage("Group deleted.");
      await onChanged();
    } catch (deleteError) {
      setError(messageFrom(deleteError, "Unable to delete group."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpecification = async (specification) => {
    if (!window.confirm(`Delete "${specification.name}"?`)) return;
    await runMutation(
      () => deleteSpecification(specification.id),
      "Definition deleted.",
      selectedGroupId
    );
  };

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <section className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Manage Specifications</h2>
            <p className="mt-1 text-sm text-gray-500">
              Create reusable groups and definitions for product categories.
            </p>
          </div>
          <button type="button" aria-label="Close specification manager" onClick={onClose} className="rounded-lg p-2 ui-btn-outline">
            <X size={19} />
          </button>
        </header>

        <div className="overflow-y-auto p-5">
          {error && (
            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {successMessage && (
            <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10"><LoaderCircle className="animate-spin" /></div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Specification groups</h3>
                <form onSubmit={handleGroupSubmit} className="flex gap-2">
                  <input
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    maxLength={100}
                    required
                    aria-label="Group name"
                    placeholder="e.g. Connectivity"
                    className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                  />
                  <button type="submit" disabled={saving || !groupName.trim()} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm ui-btn-primary">
                    {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}
                    {editingGroupId ? "Save" : "Add"}
                  </button>
                  {editingGroupId && (
                    <button type="button" onClick={() => { setEditingGroupId(""); setGroupName(""); }} className="rounded-lg px-3 py-2 text-sm ui-btn-outline">
                      Cancel
                    </button>
                  )}
                </form>
                <ul className="divide-y rounded-lg border">
                  {groups.map((group) => (
                    <li key={group.id} className={`flex items-center gap-2 px-3 py-2 ${selectedGroupId === group.id ? "bg-orange-50" : ""}`}>
                      <button type="button" onClick={() => setSelectedGroupId(group.id)} className="min-w-0 flex-1 truncate text-left text-sm font-medium text-gray-800">
                        {group.name}
                      </button>
                      <button type="button" title="Rename group" onClick={() => { setEditingGroupId(group.id); setGroupName(group.name); }} className="rounded p-1 ui-btn-outline"><Pencil size={14} /></button>
                      <button type="button" title="Delete group" onClick={() => handleDeleteGroup(group)} disabled={saving} className="rounded p-1 ui-btn-danger"><Trash2 size={14} /></button>
                    </li>
                  ))}
                  {groups.length === 0 && <li className="px-3 py-5 text-sm text-gray-500">No groups yet. Create one to start.</li>}
                </ul>
                <p className="text-xs text-gray-500">A group cannot be deleted while it contains definitions.</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">
                  Definitions{selectedGroup ? ` · ${selectedGroup.name}` : ""}
                </h3>
                <form onSubmit={handleSpecificationSubmit} className="flex gap-2">
                  <input
                    value={specificationName}
                    onChange={(event) => setSpecificationName(event.target.value)}
                    maxLength={150}
                    required
                    disabled={!selectedGroupId}
                    aria-label="Specification definition name"
                    placeholder="e.g. Wi-Fi Standard"
                    className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm disabled:bg-gray-100"
                  />
                  <button type="submit" disabled={saving || !selectedGroupId || !specificationName.trim()} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm ui-btn-primary">
                    {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}
                    {editingSpecificationId ? "Save" : "Add"}
                  </button>
                  {editingSpecificationId && (
                    <button type="button" onClick={() => { setEditingSpecificationId(""); setSpecificationName(""); }} className="rounded-lg px-3 py-2 text-sm ui-btn-outline">
                      Cancel
                    </button>
                  )}
                </form>
                <ul className="divide-y rounded-lg border">
                  {specifications.map((specification) => (
                    <li key={specification.id} className="flex items-center gap-2 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-gray-800">{specification.name}</p>
                        <p className="text-xs text-gray-500">
                          {specification._count?.products ?? 0} product assignment(s)
                        </p>
                      </div>
                      <button type="button" title="Rename definition" onClick={() => { setEditingSpecificationId(specification.id); setSpecificationName(specification.name); }} className="rounded p-1 ui-btn-outline"><Pencil size={14} /></button>
                      <button type="button" title="Delete definition" onClick={() => handleDeleteSpecification(specification)} disabled={saving || (specification._count?.products ?? 0) > 0} className="rounded p-1 ui-btn-danger disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14} /></button>
                    </li>
                  ))}
                  {selectedGroupId && specifications.length === 0 && (
                    <li className="px-3 py-5 text-sm text-gray-500">No definitions in this group yet.</li>
                  )}
                  {!selectedGroupId && <li className="px-3 py-5 text-sm text-gray-500">Select or create a group first.</li>}
                </ul>
                <p className="text-xs text-gray-500">Definitions assigned to products cannot be deleted; renaming keeps current assignments intact.</p>
              </div>
            </div>
          )}
        </div>

        <footer className="flex justify-end border-t px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium ui-btn-outline">Done</button>
        </footer>
      </section>
    </div>
  );
};

export default SpecificationManager;
