import { useState } from "react";
import { Star } from "lucide-react";

const reviews = [
    {
        id: 1,
        name: "Rahul Sharma",
        rating: 5,
        date: "2 weeks ago",
        title: "Excellent product",
        comment:
            "The product quality is excellent and everything works as expected. Very happy with the purchase.",
    },
    {
        id: 2,
        name: "Amit Verma",
        rating: 4,
        date: "1 month ago",
        title: "Very good experience",
        comment:
            "Good quality product with a premium finish. Delivery was also smooth and quick.",
    },
];

const ProductTabs = ({ product }) => {
    const [activeTab, setActiveTab] =
        useState("description");

    const tabs = [
        {
            id: "description",
            label: "Description",
        },
        {
            id: "information",
            label: "Additional Information",
        },
        ...(product.type === "affiliate"
            ? []
            : [
                  {
                      id: "reviews",
                      label: `Reviews (${reviews.length})`,
                  },
              ]),
    ];

    return (
        <section className="mt-20">
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() =>
                            setActiveTab(tab.id)
                        }
                        className={(`relative shrink-0 px-5 pb-5 text-sm font-medium ${
                            activeTab === tab.id
                                ? "text-[#ff8a00]"
                                : "text-gray-500 hover:text-black"
                        }`)}
                    >
                        {tab.label}

                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff8a00]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Description */}
            {activeTab === "description" && (
                <div className="pt-8">
                    <h2 className="text-lg font-semibold">
                        Product Description
                    </h2>

                    <div className="mt-5 max-w-4xl text-sm leading-7 text-gray-500">
                        {product.description ? (
                            <p>{product.description}</p>
                        ) : product.type === "affiliate" ? (
                            <p>
                                No additional product description is available.
                            </p>
                        ) : (
                            <p>
                                Explore this product with
                                premium features,
                                reliable performance and
                                modern design. Built for
                                customers looking for a
                                dependable electronics
                                experience.
                            </p>
                        )}
                    </div>

                    {product.type !== "affiliate" && (
                        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-gray-500">
                            <li>
                                Premium build quality and
                                modern design.
                            </li>
                            <li>
                                Designed for reliable everyday
                                performance.
                            </li>
                            <li>
                                Backed by trusted electronics
                                components.
                            </li>
                        </ul>
                    )}
                </div>
            )}

            {/* Additional Information */}
            {activeTab === "information" && (
                <div className="pt-8">
                    <h2 className="text-lg font-semibold">
                        Additional Information
                    </h2>

                    {product.specifications?.length ? (
                        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
                            {product.specifications.map(
                                (item) => (
                                    <div
                                        key={item.id}
                                        className="grid grid-cols-1 border-b border-gray-200 last:border-b-0 sm:grid-cols-[220px_1fr]"
                                    >
                                        <div className="bg-[#f7f7f7] px-5 py-4 text-sm font-medium">
                                            {
                                                item
                                                    .specification
                                                    ?.name
                                            }
                                        </div>

                                        <div className="px-5 py-4 text-sm text-gray-500">
                                            {
                                                item.value
                                            }
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <p className="mt-5 text-sm text-gray-500">
                            No additional information
                            available.
                        </p>
                    )}
                </div>
            )}

            {/* Reviews */}
            {product.type !== "affiliate" && activeTab === "reviews" && (
                <div className="pt-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Customer Reviews
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Showing sample reviews for
                                the storefront UI.
                            </p>
                        </div>

                        <div className="text-right">
                            <div className="text-2xl font-semibold">
                                4.5
                            </div>

                            <div className="mt-1 flex gap-1 text-[#ff8a00]">
                                {Array.from({
                                    length: 5,
                                }).map((_, index) => (
                                    <Star
                                        key={index}
                                        size={14}
                                        fill={
                                            index < 4
                                                ? "currentColor"
                                                : "none"
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 divide-y divide-gray-200">
                        {reviews.map((review) => (
                            <article
                                key={review.id}
                                className="py-7 first:pt-0"
                            >
                                <div className="flex items-start justify-between gap-5">
                                    <div>
                                        <h3 className="font-medium">
                                            {review.title}
                                        </h3>

                                        <div className="mt-2 flex items-center gap-3">
                                            <div className="flex gap-1 text-[#ff8a00]">
                                                {Array.from({
                                                    length: 5,
                                                }).map(
                                                    (
                                                        _,
                                                        index
                                                    ) => (
                                                        <Star
                                                            key={
                                                                index
                                                            }
                                                            size={
                                                                13
                                                            }
                                                            fill={
                                                                index <
                                                                review.rating
                                                                    ? "currentColor"
                                                                    : "none"
                                                            }
                                                        />
                                                    )
                                                )}
                                            </div>

                                            <span className="text-xs text-gray-400">
                                                {
                                                    review.date
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <span className="text-sm font-medium">
                                        {
                                            review.name
                                        }
                                    </span>
                                </div>

                                <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-500">
                                    {
                                        review.comment
                                    }
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};

export default ProductTabs;