import { useEffect, useState } from "react";
import {
  LoaderCircle,
  Plus,
  RefreshCw,
  Tags,
  Trash2,
  X,
} from "lucide-react";

import {
  getAttributes
} from "../../services/attribute.service";

import {
  assignVariantAttribute,
  getVariantAttributes,
  removeVariantAttribute,
} from "../../services/variantAttribute.service";

const VariantAttributes = ({
  productId,
  variantId,
}) => {
  const [assignedAttributes, setAssignedAttributes] =
    useState([]);

  const [attributes, setAttributes] =
    useState([]);

  const [attributeValues, setAttributeValues] =
    useState([]);

  const [selectedAttribute, setSelectedAttribute] =
    useState("");

  const [selectedValue, setSelectedValue] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [loadingValues, setLoadingValues] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [removing, setRemoving] =
    useState(null);

  const [error, setError] =
    useState("");

  const fetchAssignedAttributes =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getVariantAttributes(
            productId,
            variantId
          );

        const data = response.data;

        setAssignedAttributes(
          Array.isArray(
            data?.attributes
          )
            ? data.attributes
            : Array.isArray(data)
              ? data
              : []
        );
      } catch (err) {
        console.error(
          "Variant attributes fetch error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load variant attributes."
        );
      } finally {
        setLoading(false);
      }
    };

  const fetchAttributes = async () => {
    try {
      const response =
        await getAttributes({
          page: 1,
          limit: 100,
        });

      const data = response.data;

      setAttributes(
        Array.isArray(data?.attributes)
          ? data.attributes
          : Array.isArray(data)
            ? data
            : []
      );
    } catch (err) {
      console.error(
        "Attributes fetch error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load attributes."
      );
    }
  };

  useEffect(() => {
    if (!productId || !variantId) {
      return;
    }

    const load = async () => {
      await Promise.all([
        fetchAssignedAttributes(),
        fetchAttributes(),
      ]);
    };

    load();
  }, [productId, variantId]);

const handleAttributeChange = (event) => {
  const attributeId = event.target.value;

  setSelectedAttribute(attributeId);
  setSelectedValue([]);
  setAttributeValues([]);

  if (!attributeId) {
    return;
  }

  const selected = attributes.find(
    (attribute) => attribute.id === attributeId
  );

  setAttributeValues(
    Array.isArray(selected?.values)
      ? selected.values
      : []
  );
};

  const handleAssign = async () => {
    if (
      !selectedAttribute ||
      !selectedValue
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await assignVariantAttribute(
        productId,
        variantId,
        selectedValue
      );

      setSelectedAttribute("");
      setSelectedValue("");
      setAttributeValues([]);

      await fetchAssignedAttributes();
    } catch (err) {
      console.error(
        "Variant attribute assignment error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to assign attribute value."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (
    variantAttribute
  ) => {
    const confirmed = window.confirm(
      "Remove this attribute value from the variant?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemoving(
        variantAttribute.id
      );
      setError("");

      await removeVariantAttribute(
        productId,
        variantId,
        variantAttribute.id
      );

      await fetchAssignedAttributes();
    } catch (err) {
      console.error(
        "Variant attribute remove error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to remove attribute value."
      );
    } finally {
      setRemoving(null);
    }
  };

  const getAttributeName = (
    variantAttribute
  ) => {
    return (
      variantAttribute
        ?.attributeValue
        ?.attribute
        ?.name ||
      variantAttribute?.attribute?.name ||
      "Attribute"
    );
  };

  const getValueName = (
    variantAttribute
  ) => {
    return (
      variantAttribute
        ?.attributeValue
        ?.value ||
      variantAttribute?.value ||
      "-"
    );
  };

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-white p-2 text-orange-500 shadow-sm">
            <Tags size={16} />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800">
              Attributes
            </h4>

            <p className="text-xs text-gray-500">
              Assign attribute values to this variant.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchAssignedAttributes}
          disabled={loading}
          className="rounded-lg p-2 transition disabled:opacity-50 ui-btn-outline"
          title="Refresh"
        >
          <RefreshCw
            size={15}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />
        </button>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Assigned attributes */}
        {loading ? (
          <div className="flex items-center justify-center py-6 text-xs text-gray-400">
            <LoaderCircle
              size={16}
              className="mr-2 animate-spin"
            />
            Loading attributes...
          </div>
        ) : assignedAttributes.length ===
          0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-5 text-center">
            <p className="text-xs font-medium text-gray-600">
              No attributes assigned
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Assign values such as Color or
              Screen Size.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignedAttributes.map(
              (item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500">
                      {getAttributeName(
                        item
                      )}
                    </span>

                    <span className="text-sm font-semibold text-gray-800">
                      {getValueName(item)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemove(item)
                    }
                    disabled={
                      removing ===
                      item.id
                    }
                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 ui-btn-danger"
                    title="Remove"
                  >
                    {removing ===
                    item.id ? (
                      <LoaderCircle
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <X size={15} />
                    )}
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {/* Add attribute */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Add Attribute
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <select
              value={selectedAttribute}
              onChange={
                handleAttributeChange
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">
                Select attribute
              </option>

              {attributes.map(
                (attribute) => (
                  <option
                    key={attribute.id}
                    value={attribute.id}
                  >
                    {attribute.name}
                  </option>
                )
              )}
            </select>

            <select
              value={selectedValue}
              onChange={(event) =>
                setSelectedValue(
                  event.target.value
                )
              }
              disabled={
                !selectedAttribute ||
                loadingValues
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
            >
              <option value="">
                {loadingValues
                  ? "Loading values..."
                  : "Select value"}
              </option>

              {attributeValues.map(
                (value) => (
                  <option
                    key={value.id}
                    value={value.id}
                  >
                    {value.value}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={handleAssign}
              disabled={
                saving ||
                !selectedAttribute ||
                !selectedValue
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ui-btn-primary"
            >
              {saving ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Plus size={16} />
              )}

              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariantAttributes;