import React, { useEffect, useMemo, useState } from "react";
import {
    Heart,
    Minus,
    Plus,
    ShoppingBag,
    Star,
} from "lucide-react";

const ProductInfo = ({
    product,
    onAddToCart,
    onBuyNow,
}) => {
    const variants = product?.variants || [];

    const [selectedVariantId, setSelectedVariantId] = useState(
        variants[0]?.id || ""
    );

    const [quantity, setQuantity] = useState(1);

    const selectedVariant = useMemo(
        () =>
            variants.find(
                (variant) =>
                    variant.id === selectedVariantId
            ) || variants[0],
        [variants, selectedVariantId]
    );

    useEffect(() => {
        if (variants[0]?.id) {
            setSelectedVariantId(variants[0].id);
        }
    }, [product?.id]);

    const attributeGroups = useMemo(() => {
        const groups = new Map();

        variants.forEach((variant) => {
            variant.attributes?.forEach((item) => {
                const attribute = item.attributeValue?.attribute;

                if (!attribute) return;

                if (!groups.has(attribute.id)) {
                    groups.set(attribute.id, {
                        id: attribute.id,
                        name: attribute.name,
                        values: [],
                    });
                }

                const group = groups.get(attribute.id);

                const value = item.attributeValue;

                if (
                    value &&
                    !group.values.some(
                        (existing) =>
                            existing.id === value.id
                    )
                ) {
                    group.values.push({
                        id: value.id,
                        value: value.value,
                    });
                }
            });
        });

        return Array.from(groups.values());
    }, [variants]);

    const findVariantForAttribute = (
        attributeId,
        attributeValueId
    ) => {
        const matchingVariant = variants.find((variant) => {
            const attributes = variant.attributes || [];

            const hasSelectedAttribute =
                attributes.some(
                    (item) =>
                        item.attributeValue?.attribute?.id ===
                            attributeId &&
                        item.attributeValue?.id ===
                            attributeValueId
                );

            if (!hasSelectedAttribute) return false;

            return true;
        });

        return matchingVariant;
    };

    const handleAttributeSelect = (
        attributeId,
        attributeValueId
    ) => {
        const variant = findVariantForAttribute(
            attributeId,
            attributeValueId
        );

        if (variant) {
            setSelectedVariantId(variant.id);
            setQuantity(1);
        }
    };

    if (!selectedVariant) {
        return (
            <div>
                <h1 className="text-3xl font-semibold">
                    {product.name}
                </h1>

                <p className="mt-6 text-sm text-gray-500">
                    No purchasable variant available.
                </p>
            </div>
        );
    }

    const price = Number(selectedVariant.price);
    const compareAtPrice =
        selectedVariant.compareAtPrice
            ? Number(selectedVariant.compareAtPrice)
            : null;

    const discount =
        compareAtPrice && compareAtPrice > price
            ? Math.round(
                  ((compareAtPrice - price) /
                      compareAtPrice) *
                      100
              )
            : 0;

    const maxQuantity = selectedVariant.inStock
        ? 10
        : 0;

    return (
        <div>
            {/* Brand */}
            {product.brand?.name && (
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-gray-500">
                    {product.brand.name}
                </p>
            )}

            {/* Title */}
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {product.name}
            </h1>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center gap-1 text-[#ff8a00]">
                    <Star size={16} fill="currentColor" />
                </div>

                <span className="text-sm text-gray-500">
                    4.0 (2 reviews)
                </span>
            </div>

            {/* Price */}
            <div className="mt-7 flex items-center gap-3">
                <span className="text-3xl font-semibold text-[#ff8a00]">
                    ₹{price.toLocaleString("en-IN")}
                </span>

                {compareAtPrice &&
                    compareAtPrice > price && (
                        <>
                            <span className="text-base text-gray-400 line-through">
                                ₹
                                {compareAtPrice.toLocaleString(
                                    "en-IN"
                                )}
                            </span>

                            <span className="rounded-full bg-[#fff2df] px-3 py-1 text-xs font-medium text-[#ff8a00]">
                                {discount}% OFF
                            </span>
                        </>
                    )}
            </div>

            {/* Description */}
            {product.shortDescription ||
            product.description ? (
                <p className="mt-5 text-sm leading-6 text-gray-500">
                    {product.shortDescription ||
                        product.description}
                </p>
            ) : null}

            {/* Attributes */}
            {attributeGroups.map((group) => (
                <div
                    key={group.id}
                    className="mt-7"
                >
                    <h3 className="mb-3 text-sm font-semibold">
                        {group.name}
                    </h3>

                    <div className="flex flex-wrap gap-2">
                        {group.values.map((value) => {
                            const isSelected =
                                selectedVariant.attributes?.some(
                                    (item) =>
                                        item.attributeValue
                                            ?.attribute?.id ===
                                            group.id &&
                                        item.attributeValue
                                            ?.id ===
                                            value.id
                                );

                            const variant =
                                findVariantForAttribute(
                                    group.id,
                                    value.id
                                );

                            return (
                                <button
                                    key={value.id}
                                    type="button"
                                    disabled={!variant}
                                    onClick={() =>
                                        handleAttributeSelect(
                                            group.id,
                                            value.id
                                        )
                                    }
                                    className={`rounded-full border px-5 py-2.5 text-sm transition ${
                                        isSelected
                                            ? "border-[#ff8a00] text-[#ff8a00]"
                                            : "border-gray-200 text-gray-600 hover:border-gray-400"
                                    } ${
                                        !variant
                                            ? "cursor-not-allowed opacity-30"
                                            : ""
                                    }`}
                                >
                                    {value.value}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Quantity */}
            <div className="mt-7">
                <h3 className="mb-3 text-sm font-semibold">
                    Quantity
                </h3>

                <div className="flex h-10 w-fit items-center overflow-hidden rounded-full bg-[#f4f4f4]">
                    <button
                        type="button"
                        disabled={quantity <= 1}
                        onClick={() =>
                            setQuantity((value) =>
                                Math.max(1, value - 1)
                            )
                        }
                        className="flex h-10 w-10 items-center justify-center disabled:opacity-30"
                    >
                        <Minus size={15} />
                    </button>

                    <span className="flex h-10 min-w-10 items-center justify-center bg-white text-sm font-medium">
                        {quantity}
                    </span>

                    <button
                        type="button"
                        disabled={
                            !selectedVariant.inStock ||
                            quantity >= maxQuantity
                        }
                        onClick={() =>
                            setQuantity((value) =>
                                Math.min(
                                    maxQuantity,
                                    value + 1
                                )
                            )
                        }
                        className="flex h-10 w-10 items-center justify-center disabled:opacity-30"
                    >
                        <Plus size={15} />
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-7 flex gap-3">
                <button
                    type="button"
                    disabled={!selectedVariant.inStock}
                    onClick={() =>
                        onBuyNow?.(
                            selectedVariant,
                            quantity
                        )
                    }
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#ff8a00] px-5 text-sm font-semibold text-white transition hover:bg-[#ed7d00] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >
                    Buy Now
                </button>

                <button
                    type="button"
                    disabled={!selectedVariant.inStock}
                    onClick={() =>
                        onAddToCart?.(
                            selectedVariant,
                            quantity
                        )
                    }
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#111] px-5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >
                    <ShoppingBag size={16} />
                    Add to Cart
                </button>

                <button
                    type="button"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#111] text-white transition hover:bg-black"
                    aria-label="Add to wishlist"
                >
                    <Heart size={18} />
                </button>
            </div>

            {/* Stock */}
            <div className="mt-5">
                <p
                    className={`text-sm font-medium ${
                        selectedVariant.inStock
                            ? "text-green-600"
                            : "text-red-500"
                    }`}
                >
                    {selectedVariant.inStock
                        ? "In stock"
                        : "Out of stock"}
                </p>
            </div>

            {/* Meta */}
            <div className="mt-6 space-y-2 border-t border-gray-200 pt-5 text-sm text-gray-500">
                <p>
                    <span className="text-gray-700">
                        SKU:
                    </span>{" "}
                    {selectedVariant.sku}
                </p>

                {product.category?.name && (
                    <p>
                        <span className="text-gray-700">
                            Category:
                        </span>{" "}
                        {product.category.name}
                    </p>
                )}

                {product.brand?.name && (
                    <p>
                        <span className="text-gray-700">
                            Brand:
                        </span>{" "}
                        {product.brand.name}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ProductInfo;