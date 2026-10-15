import { useEffect, useMemo, useState } from "react";
import {
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

import {
  createProductSpecification,
  deleteProductSpecification,
  getProductSpecifications,
  getSpecificationGroups,
  updateProductSpecification,
} from "../../services/specification.service";

const ProductSpecifications = ({ productId }) => {
  const [groups, setGroups] = useState([]);
  const [assignedSpecifications, setAssignedSpecifications] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editingSpecification, setEditingSpecification] =
    useState(null);

  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedSpecification, setSelectedSpecification] =
    useState("");
  const [value, setValue] = useState("");

  const fetchProductSpecifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getProductSpecifications(productId);

      const data = response.data;

      setAssignedSpecifications(
        Array.isArray(data?.specifications)
          ? data.specifications
          : Array.isArray(data)
            ? data
            : []
      );
    } catch (err) {
      console.error(
        "Product specifications fetch error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load product specifications."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      setError("");

      const response = await getSpecificationGroups();

      const data = response.data;

      setGroups(
        Array.isArray(data?.groups)
          ? data.groups
          : Array.isArray(data)
            ? data
            : []
      );
    } catch (err) {
      console.error(
        "Specification groups fetch error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load specification groups."
      );
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (!productId) {
      return;
    }

    Promise.all([
      fetchProductSpecifications(),
      fetchGroups(),
    ]);
  }, [productId]);

  const selectedGroupData = useMemo(() => {
    return groups.find(
      (group) => group.id === selectedGroup
    );
  }, [groups, selectedGroup]);

  const availableSpecifications =
    selectedGroupData?.specifications || [];

  const resetForm = () => {
    setSelectedGroup("");
    setSelectedSpecification("");
    setValue("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingSpecification(null);
    setShowAdd(true);
    setError("");
  };

  const handleOpenEdit = (item) => {
    setEditingSpecification(item);
    setValue(item.value || "");
    setShowAdd(false);
    setError("");
  };

  const handleCloseModal = () => {
    setShowAdd(false);
    setEditingSpecification(null);
    resetForm();
  };

  const handleGroupChange = (event) => {
    setSelectedGroup(event.target.value);
    setSelectedSpecification("");
  };

  const handleAdd = async (event) => {
    event.preventDefault();

    if (!selectedSpecification) {
      setError("Please select a specification.");
      return;
    }

    if (!value.trim()) {
      setError("Specification value is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createProductSpecification(
        productId,
        {
          specificationId: selectedSpecification,
          value: value.trim(),
        }
      );

      handleCloseModal();

      await fetchProductSpecifications();
    } catch (err) {
      console.error(
        "Product specification create error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to add specification."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!value.trim()) {
      setError("Specification value is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await updateProductSpecification(
        productId,
        editingSpecification.id,
        {
          value: value.trim(),
        }
      );

      handleCloseModal();

      await fetchProductSpecifications();
    } catch (err) {
      console.error(
        "Product specification update error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to update specification."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      "Delete this product specification?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(item.id);
      setError("");

      await deleteProductSpecification(
        productId,
        item.id
      );

      await fetchProductSpecifications();
    } catch (err) {
      console.error(
        "Product specification delete error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to delete specification."
      );
    } finally {
      setDeleting(null);
    }
  };

  const getGroupName = (item) => {
    return (
      item?.specification?.group?.name ||
      "Specification"
    );
  };

  const getSpecificationName = (item) => {
    return (
      item?.specification?.name ||
      "Specification"
    );
  };

  const groupedSpecifications =
    useMemo(() => {
      return assignedSpecifications.reduce(
        (result, item) => {
          const groupName = getGroupName(item);

          if (!result[groupName]) {
            result[groupName] = [];
          }

          result[groupName].push(item);

          return result;
        },
        {}
      );
    }, [assignedSpecifications]);

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-50 p-2 text-orange-500">
            <Settings2 size={17} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Specifications
            </h3>

            <p className="text-xs text-gray-500">
              Add technical specifications to this product.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchProductSpecifications}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              size={15}
              className={
                loading ? "animate-spin" : ""
              }
            />
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
          >
            <Plus size={15} />
            Add Specification
          </button>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 flex items-start justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-3 text-red-400 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10 text-xs text-gray-400">
            <LoaderCircle
              size={17}
              className="mr-2 animate-spin"
            />
            Loading specifications...
          </div>
        ) : assignedSpecifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center">
            <Settings2
              size={28}
              className="mx-auto text-gray-300"
            />

            <p className="mt-3 text-sm font-medium text-gray-600">
              No specifications assigned
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Add technical details such as screen size,
              resolution, processor, or storage.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(
              groupedSpecifications
            ).map(([groupName, items]) => (
              <div key={groupName}>
                <div className="mb-2 border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {groupName}
                  </h4>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b border-gray-100 px-3 py-3 last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-500">
                          {getSpecificationName(
                            item
                          )}
                        </p>

                        <p className="mt-0.5 text-sm font-semibold text-gray-800">
                          {item.value}
                        </p>
                      </div>

                      <div className="ml-4 flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenEdit(item)
                          }
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(item)
                          }
                          disabled={
                            deleting === item.id
                          }
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === item.id ? (
                            <LoaderCircle
                              size={14}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  Add Specification
                </h3>

                <p className="mt-0.5 text-xs text-gray-500">
                  Select a specification and enter its value.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleAdd}
              className="p-5"
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Specification Group
                  </label>

                  <select
                    value={selectedGroup}
                    onChange={handleGroupChange}
                    disabled={loadingGroups}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
                  >
                    <option value="">
                      {loadingGroups
                        ? "Loading groups..."
                        : "Select group"}
                    </option>

                    {groups.map((group) => (
                      <option
                        key={group.id}
                        value={group.id}
                      >
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Specification
                  </label>

                  <select
                    value={selectedSpecification}
                    onChange={(event) =>
                      setSelectedSpecification(
                        event.target.value
                      )
                    }
                    disabled={!selectedGroup}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
                  >
                    <option value="">
                      Select specification
                    </option>

                    {availableSpecifications.map(
                      (specification) => (
                        <option
                          key={specification.id}
                          value={specification.id}
                        >
                          {specification.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Value
                  </label>

                  <textarea
                    value={value}
                    onChange={(event) =>
                      setValue(event.target.value)
                    }
                    rows={3}
                    maxLength={1000}
                    placeholder="e.g. 55 inch"
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !selectedGroup ||
                    !selectedSpecification ||
                    !value.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  Add Specification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSpecification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  Edit Specification
                </h3>

                <p className="mt-0.5 text-xs text-gray-500">
                  Update the specification value.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleUpdate}
              className="p-5"
            >
              <div className="mb-4 rounded-lg bg-gray-50 px-3 py-3">
                <p className="text-xs text-gray-500">
                  {getGroupName(
                    editingSpecification
                  )}
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {getSpecificationName(
                    editingSpecification
                  )}
                </p>
              </div>

              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Value
              </label>

              <textarea
                value={value}
                onChange={(event) =>
                  setValue(event.target.value)
                }
                rows={4}
                maxLength={1000}
                required
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving || !value.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSpecifications;