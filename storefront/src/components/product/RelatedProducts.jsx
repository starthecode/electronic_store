import React from "react";
import { Link } from "react-router-dom";

const RelatedProducts = ({ products = [] }) => {
    if (!products.length) return null;

    return (
        <section className="mt-24">
            <div className="text-center">
                <h2 className="text-3xl font-semibold tracking-tight">
                    Related Products
                </h2>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {products.slice(0, 4).map((product) => {
                    const image =
                        product.images?.find(
                            (item) => item.isPrimary
                        )?.url ||
                        product.images?.[0]?.url;

                    const price =
                        product.variants?.length
                            ? Math.min(
                                  ...product.variants.map(
                                      (variant) =>
                                          Number(
                                              variant.price
                                          )
                                  )
                              )
                            : null;

                    return (
                        <Link
                            key={product.id}
                            to={`/products/${product.slug}`}
                            className="group"
                        >
                            <div className="aspect-square overflow-hidden rounded-xl bg-[#f7f7f7]">
                                {image && (
                                    <img
                                        src={image}
                                        alt={product.name}
                                        loading="lazy"
                                        className="h-full w-full object-contain p-6 transition duration-500 group-hover:scale-105"
                                    />
                                )}
                            </div>

                            <h3 className="mt-4 text-center text-sm font-medium">
                                {product.name}
                            </h3>

                            {price !== null && (
                                <p className="mt-2 text-center text-sm font-medium text-[#ff8a00]">
                                    ₹
                                    {price.toLocaleString(
                                        "en-IN"
                                    )}
                                </p>
                            )}
                        </Link>
                    );
                })}
            </div>

            <div className="mt-10 flex justify-center">
                <Link
                    to="/shop"
                    className="rounded-full bg-[#111] px-7 py-3 text-sm font-medium text-white transition hover:bg-black"
                >
                    Go to Shop
                </Link>
            </div>
        </section>
    );
};

export default RelatedProducts;