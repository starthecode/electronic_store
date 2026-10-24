import { useEffect, useState } from "react";
import {
    Edit,
    Package,
    Plus,
    RefreshCw,
    Tags,
    Trash2,
    X,
} from "lucide-react";

import {
    createVariant,
    deleteVariant,
    getVariants,
    updateVariant,
} from "../../services/variant.service";

import ProductVariantModal from "./ProductVariantModal";
import VariantAttributes from "./VariantAttributes";

const ProductVariants = ({
    productId,
}) => {
    const [variants, setVariants] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [deleteLoading, setDeleteLoading] =
        useState(null);

    const [error, setError] =
        useState("");

    const [modalOpen, setModalOpen] =
        useState(false);

    const [editingVariant, setEditingVariant] =
        useState(null);

    const [attributeVariant, setAttributeVariant] =
        useState(null);

    const fetchVariants = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await getVariants(productId);

            const data = response.data;

            setVariants(
                Array.isArray(data?.variants)
                    ? data.variants
                    : Array.isArray(data)
                        ? data
                        : []
            );
        } catch (err) {
            console.error(
                "Variants fetch error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load variants."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (productId) {
            fetchVariants();
        }
    }, [productId]);

    const openCreateModal = () => {
        setEditingVariant(null);
        setError("");
        setModalOpen(true);
    };

    const openEditModal = (variant) => {
        setEditingVariant(variant);
        setError("");
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) {
            return;
        }

        setModalOpen(false);
        setEditingVariant(null);
    };

    const openAttributesModal = (
        variant
    ) => {
        setAttributeVariant(variant);
    };

    const closeAttributesModal = () => {
        setAttributeVariant(null);
    };

    const handleSubmit = async (data) => {
        try {
            setSaving(true);
            setError("");

            if (editingVariant) {
                await updateVariant(
                    productId,
                    editingVariant.id,
                    data
                );
            } else {
                await createVariant(
                    productId,
                    data
                );
            }

            setModalOpen(false);
            setEditingVariant(null);

            await fetchVariants();
        } catch (err) {
            console.error(
                "Variant save error:",
                err
            );

            throw err;
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (variant) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete variant "${variant.name || variant.sku}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeleteLoading(variant.id);
            setError("");

            await deleteVariant(
                productId,
                variant.id
            );

            await fetchVariants();
        } catch (err) {
            console.error(
                "Variant delete error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to delete variant."
            );
        } finally {
            setDeleteLoading(null);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(Number(value || 0));
    };

    const getStatusClasses = (status) => {
        if (status === "ACTIVE") {
            return "bg-green-50 text-green-700";
        }

        return "bg-gray-100 text-gray-600";
    };

    return (
        <>
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                {/* Header */}
                <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-orange-50 p-2 text-orange-500">
                            <Package size={19} />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Variants
                            </h3>

                            <p className="mt-0.5 text-xs text-gray-500">
                                Manage SKU, pricing and variant status.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={fetchVariants}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-50 ui-btn-outline"
                        >
                            <RefreshCw
                                size={16}
                                className={
                                    loading
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ui-btn-primary"
                        >
                            <Plus size={17} />
                            Add Variant
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* Content */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px]">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Variant
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    SKU
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Price
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Compare Price
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>

                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-14 text-center"
                                    >
                                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                                            <RefreshCw
                                                size={17}
                                                className="animate-spin"
                                            />
                                            Loading variants...
                                        </div>
                                    </td>
                                </tr>
                            ) : variants.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-14 text-center"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="rounded-xl bg-gray-100 p-3 text-gray-400">
                                                <Package size={23} />
                                            </div>

                                            <p className="mt-3 text-sm font-medium text-gray-700">
                                                No variants yet
                                            </p>

                                            <p className="mt-1 text-xs text-gray-400">
                                                Add a variant to make this
                                                product sellable.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                variants.map((variant) => (
                                    <tr
                                        key={variant.id}
                                        className="transition hover:bg-gray-50"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-semibold text-gray-800">
                                                {variant.name ||
                                                    "Default Variant"}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="font-mono text-sm text-gray-600">
                                                {variant.sku}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-sm font-medium text-gray-800">
                                            {formatCurrency(
                                                variant.price
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-500">
                                            {variant.compareAtPrice
                                                ? formatCurrency(
                                                    variant.compareAtPrice
                                                )
                                                : "-"}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                                                    variant.status
                                                )}`}
                                            >
                                                {variant.status}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openAttributesModal(variant)
                                                    }
                                                    className="rounded-lg p-2 transition ui-btn-outline"
                                                    title="Attributes"
                                                >
                                                    <Tags size={17} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            variant
                                                        )
                                                    }
                                                    disabled={
                                                        deleteLoading ===
                                                        variant.id
                                                    }
                                                    className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 ui-btn-danger"
                                                    title="Delete variant"
                                                >
                                                    {deleteLoading ===
                                                        variant.id ? (
                                                        <RefreshCw
                                                            size={17}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Trash2
                                                            size={17}
                                                        />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <ProductVariantModal
                open={modalOpen}
                variant={editingVariant}
                saving={saving}
                error=""
                onClose={closeModal}
                onSubmit={async (data) => {
                    try {
                        await handleSubmit(data);
                    } catch (err) {
                        setError(
                            err.response?.data?.message ||
                            "Unable to save variant."
                        );
                    }
                }}
            />

            {attributeVariant && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={closeAttributesModal}
                >
                    <div
                        className="w-full max-w-2xl"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="rounded-2xl bg-white shadow-xl">
                            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Variant Attributes
                                    </h3>

                                    <p className="mt-0.5 text-xs text-gray-500">
                                        {attributeVariant.name ||
                                            attributeVariant.sku}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeAttributesModal}
                                    className="rounded-lg p-2 transition ui-btn-outline"
                                >
                                    <X size={19} />
                                </button>
                            </div>

                            <div className="p-5">
                                <VariantAttributes
                                    productId={productId}
                                    variantId={
                                        attributeVariant.id
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductVariants;