import React, { useEffect, useMemo, useState } from "react";
import { Filter, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import ProductCard from "../components/ui/ProductCard";
import {
    getStoreProducts,
    getStoreCategories,
    getStoreBrands,
} from "../services/storeProduct.service";

const LIMIT = 12;

const Shop = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    /*
   * Pagination.
   *
   * We use the API pagination metadata if available.
   */
    const [pagination, setPagination] = useState({
        page: 1,
        limit: LIMIT,
        total: 0,
        totalPages: 1,
    });


    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(true);
    const [error, setError] = useState("");

    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const page = Number(searchParams.get("page") || 1);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const brandId = searchParams.get("brandId") || "";
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const [searchInput, setSearchInput] = useState(search);

    const [minPriceInput, setMinPriceInput] = useState(minPrice);
    const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);

    useEffect(() => {
        setMinPriceInput(minPrice);
    }, [minPrice]);

    useEffect(() => {
        setMaxPriceInput(maxPrice);
    }, [maxPrice]);

    const selectedCategory = useMemo(
        () => categories.find((item) => item.id === categoryId),
        [categories, categoryId]
    );

    const selectedBrand = useMemo(
        () => brands.find((item) => item.id === brandId),
        [brands, brandId]
    );

    /*
     * Load categories and brands once.
     */
    useEffect(() => {
        const loadFilters = async () => {
            try {
                setFilterLoading(true);

                const [categoryResponse, brandResponse] = await Promise.all([
                    getStoreCategories(),
                    getStoreBrands(),
                ]);

                setCategories(categoryResponse?.data || []);
                setBrands(brandResponse?.data || []);
            } catch (err) {
                console.error("Failed to load shop filters:", err);
            } finally {
                setFilterLoading(false);
            }
        };

        loadFilters();
    }, []);

    /*
     * Keep input synchronized with URL.
     */
    useEffect(() => {
        setSearchInput(search);
    }, [search]);

    /*
     * Debounced product search/filter request.
     */

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = {
                page,
                limit: LIMIT,
                sortBy,
                sortOrder,
            };

            if (search) params.search = search;
            if (categoryId) params.categoryId = categoryId;
            if (brandId) params.brandId = brandId;
            if (minPrice) params.minPrice = minPrice;
            if (maxPrice) params.maxPrice = maxPrice;

            const loadProducts = async () => {
                try {
                    setLoading(true);
                    setError("");

                    const response = await getStoreProducts(params);

                    setProducts(response?.data?.products || []);

                    setPagination(
                        response?.data?.pagination || {
                            page: 1,
                            limit: LIMIT,
                            total: 0,
                            totalPages: 1,
                        }
                    );
                } catch (err) {
                    console.error(
                        "Failed to load store products:",
                        err
                    );

                    setError(
                        err?.response?.data?.message ||
                        "Unable to load products. Please try again."
                    );

                    setProducts([]);

                    setPagination({
                        page: 1,
                        limit: LIMIT,
                        total: 0,
                        totalPages: 1,
                    });
                } finally {
                    setLoading(false);
                }
            };

            loadProducts();
        }, 150);

        return () => clearTimeout(timer);
    }, [
        page,
        search,
        categoryId,
        brandId,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
    ]);

    /*
     * Update a single URL filter.
     */
    const updateFilter = (key, value) => {
        const next = new URLSearchParams(searchParams);

        if (value) {
            next.set(key, value);
        } else {
            next.delete(key);
        }

        if (key !== "page") {
            next.set("page", "1");
        }

        setSearchParams(next);
    };

    /*
     * Search.
     */
    const handleSearchChange = (value) => {
        setSearchInput(value);

        useEffect(() => {
            const timer = setTimeout(() => {
                const next = new URLSearchParams(searchParams);

                if (searchInput.trim()) {
                    next.set("search", searchInput.trim());
                } else {
                    next.delete("search");
                }

                next.set("page", "1");

                setSearchParams(next);
            }, 400);

            return () => clearTimeout(timer);
        }, [searchInput]);

        const next = new URLSearchParams(searchParams);

        if (value.trim()) {
            next.set("search", value.trim());
        } else {
            next.delete("search");
        }

        next.set("page", "1");

        setSearchParams(next);
    };

    /*
     * Sorting.
     */
    const handleSortChange = (value) => {
        const next = new URLSearchParams(searchParams);

        if (value === "newest") {
            next.set("sortBy", "createdAt");
            next.set("sortOrder", "desc");
        }

        if (value === "name-asc") {
            next.set("sortBy", "name");
            next.set("sortOrder", "asc");
        }

        if (value === "name-desc") {
            next.set("sortBy", "name");
            next.set("sortOrder", "desc");
        }

        if (value === "price-asc") {
            next.set("sortBy", "price");
            next.set("sortOrder", "asc");
        }

        if (value === "price-desc") {
            next.set("sortBy", "price");
            next.set("sortOrder", "desc");
        }

        next.set("page", "1");

        setSearchParams(next);
    };

    const currentSort = useMemo(() => {
        if (sortBy === "name" && sortOrder === "asc") return "name-asc";
        if (sortBy === "name" && sortOrder === "desc") return "name-desc";
        if (sortBy === "price" && sortOrder === "asc") return "price-asc";
        if (sortBy === "price" && sortOrder === "desc") return "price-desc";

        return "newest";
    }, [sortBy, sortOrder]);

    /*
     * Clear everything.
     */
    const clearFilters = () => {
        setSearchParams({
            page: "1",
            limit: String(LIMIT),
            sortBy: "createdAt",
            sortOrder: "desc",
        });

        setSearchInput("");
    };

    const hasFilters =
        search ||
        categoryId ||
        brandId ||
        minPrice ||
        maxPrice;

    const totalPages = pagination?.totalPages || 1;

    const goToPage = (nextPage) => {
        if (nextPage < 1 || nextPage > totalPages) return;

        const next = new URLSearchParams(searchParams);
        next.set("page", String(nextPage));

        setSearchParams(next);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    /*
     * Skeleton.
     */
    const ProductSkeleton = () => (
        <div className="overflow-hidden rounded-xl bg-[#f7f7f7]">
            <div className="h-[210px] animate-pulse bg-[#eeeeee]" />

            <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-[#e9e9e9]" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-[#e9e9e9]" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-[#e9e9e9]" />
            </div>
        </div>
    );

    const FilterContent = () => (
        <div className="space-y-8">
            {/* Category */}
            <div>
                <h3 className="mb-4 text-sm font-semibold">Category</h3>

                {filterLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-5 w-32 animate-pulse rounded bg-[#eeeeee]"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-600">
                            <input
                                type="radio"
                                name="category"
                                checked={!categoryId}
                                onChange={() => updateFilter("categoryId", "")}
                            />
                            All categories
                        </label>

                        {categories.map((category) => (
                            <label
                                key={category.id}
                                className="flex cursor-pointer items-center gap-3 text-sm text-gray-600"
                            >
                                <input
                                    type="radio"
                                    name="category"
                                    checked={categoryId === category.id}
                                    onChange={() =>
                                        updateFilter("categoryId", category.id)
                                    }
                                />

                                <span>{category.name}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Brand */}
            <div className="border-t border-gray-200 pt-8">
                <h3 className="mb-4 text-sm font-semibold">Brand</h3>

                {filterLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-5 w-28 animate-pulse rounded bg-[#eeeeee]"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-600">
                            <input
                                type="radio"
                                name="brand"
                                checked={!brandId}
                                onChange={() => updateFilter("brandId", "")}
                            />
                            All brands
                        </label>

                        {brands.map((brand) => (
                            <label
                                key={brand.id}
                                className="flex cursor-pointer items-center gap-3 text-sm text-gray-600"
                            >
                                <input
                                    type="radio"
                                    name="brand"
                                    checked={brandId === brand.id}
                                    onChange={() =>
                                        updateFilter("brandId", brand.id)
                                    }
                                />

                                <span>{brand.name}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Price */}
            <div className="border-t border-gray-200 pt-8">
                <h3 className="mb-4 text-sm font-semibold">Price</h3>

                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        value={minPriceInput}
                        onChange={(e) => setMinPriceInput(e.target.value)}
                        onBlur={() => updateFilter("minPrice", minPriceInput)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                updateFilter("minPrice", minPriceInput);
                            }
                        }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black"
                    />

                    <input
                        type="number"
                        min="0"
                        placeholder="Max"
                        value={maxPriceInput}
                        onChange={(e) => setMaxPriceInput(e.target.value)}
                        onBlur={() => updateFilter("maxPrice", maxPriceInput)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                updateFilter("maxPrice", maxPriceInput);
                            }
                        }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black"
                    />
                </div>
            </div>

            {hasFilters && (
                <button
                    type="button"
                    onClick={clearFilters}
                    className="w-full rounded-lg px-4 py-3 text-sm font-medium transition ui-btn-primary"
                >
                    Clear all filters
                </button>
            )}
        </div>
    );

    return (
        <main className="min-h-screen bg-white">
            {/* Page Header */}
            <section className="border-b border-gray-200 bg-[#f7f7f5]">
                <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8">
                    <div className="flex items-end justify-between gap-8">
                        <div>
                            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
                                Store
                            </p>

                            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                                Shop electronics
                            </h1>

                            <p className="mt-4 max-w-xl text-sm leading-6 text-gray-500">
                                Discover televisions, laptops, smartphones and more
                                from trusted brands.
                            </p>
                        </div>

                        <div className="hidden text-sm text-gray-500 sm:block">
                            {pagination?.total ?? 0} products
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="mx-auto max-w-[1240px] px-5 py-8 lg:px-8">
                {/* Toolbar */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-full items-center gap-3 sm:max-w-[450px]">
                        <div className="relative w-full">
                            <Search
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="search"
                                value={searchInput}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Search products..."
                                className="h-12 w-full rounded-full border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-gray-400"
                            />

                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={() => handleSearchChange("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 ui-btn-outline"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setMobileFiltersOpen(true)}
                            className="flex h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-sm lg:hidden ui-btn-outline"
                        >
                            <Filter size={16} />
                            Filters
                        </button>
                    </div>

                    <select
                        value={currentSort}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="h-12 rounded-full border border-gray-200 bg-white px-5 text-sm outline-none"
                    >
                        <option value="newest">Newest</option>
                        <option value="name-asc">Name A–Z</option>
                        <option value="name-desc">Name Z–A</option>
                        <option value="price-asc">Price Low–High</option>
                        <option value="price-desc">Price High–Low</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
                    {/* Desktop Filters */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-8">
                            <div className="mb-6 flex items-center gap-2">
                                <Filter size={17} />
                                <h2 className="text-sm font-semibold">Filters</h2>
                            </div>

                            <FilterContent />
                        </div>
                    </aside>

                    {/* Products */}
                    <div>
                        {/* Active filters */}
                        {hasFilters && (
                            <div className="mb-6 flex flex-wrap items-center gap-2">
                                {search && (
                                    <button
                                        onClick={() => updateFilter("search", "")}
                                        className="flex items-center gap-2 rounded-full px-3 py-2 text-xs ui-btn-outline"
                                    >
                                        Search: {search}
                                        <X size={13} />
                                    </button>
                                )}

                                {selectedCategory && (
                                    <button
                                        onClick={() => updateFilter("categoryId", "")}
                                        className="flex items-center gap-2 rounded-full px-3 py-2 text-xs ui-btn-outline"
                                    >
                                        {selectedCategory.name}
                                        <X size={13} />
                                    </button>
                                )}

                                {selectedBrand && (
                                    <button
                                        onClick={() => updateFilter("brandId", "")}
                                        className="flex items-center gap-2 rounded-full px-3 py-2 text-xs ui-btn-outline"
                                    >
                                        {selectedBrand.name}
                                        <X size={13} />
                                    </button>
                                )}

                                {(minPrice || maxPrice) && (
                                    <button
                                        onClick={() => {
                                            const next = new URLSearchParams(searchParams);

                                            next.delete("minPrice");
                                            next.delete("maxPrice");
                                            next.set("page", "1");

                                            setSearchParams(next);

                                            setMinPriceInput("");
                                            setMaxPriceInput("");
                                        }}
                                        className="flex items-center gap-2 rounded-full px-3 py-2 text-xs ui-btn-outline"
                                    >
                                        ₹{minPrice || "0"} – ₹{maxPrice || "∞"}
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Loading */}
                        {loading && (
                            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <ProductSkeleton key={index} />
                                ))}
                            </div>
                        )}

                        {/* Error */}
                        {!loading && error && (
                            <div className="rounded-xl border border-gray-200 bg-[#f7f7f7] px-6 py-16 text-center">
                                <h3 className="text-lg font-semibold">
                                    Something went wrong
                                </h3>

                                <p className="mt-2 text-sm text-gray-500">
                                    {error}
                                </p>

                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-6 rounded-full px-5 py-3 text-sm font-medium ui-btn-primary"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {/* Empty */}
                        {!loading && !error && products.length === 0 && (
                            <div className="rounded-xl border border-gray-200 bg-[#f7f7f7] px-6 py-20 text-center">
                                <h3 className="text-xl font-semibold">
                                    No products found
                                </h3>

                                <p className="mt-2 text-sm text-gray-500">
                                    Try changing your search or filters.
                                </p>

                                <button
                                    onClick={clearFilters}
                                    className="mt-6 rounded-full px-5 py-3 text-sm font-medium ui-btn-primary"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}

                        {/* Products */}
                        {!loading && !error && products.length > 0 && (
                            <>
                                <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                                    {products.map((product) => (
                                        <ProductCard
                                            key={`${product.type || "regular"}-${product.id}`}
                                            product={product}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-10 flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            disabled={page <= 1}
                                            onClick={() => goToPage(page - 1)}
                                            className="flex h-10 w-10 items-center justify-center rounded-full border disabled:cursor-not-allowed disabled:opacity-30 ui-btn-outline"
                                        >
                                            <ChevronLeft size={17} />
                                        </button>

                                        {Array.from(
                                            { length: totalPages },
                                            (_, index) => index + 1
                                        )
                                            .filter(
                                                (item) =>
                                                    item === 1 ||
                                                    item === totalPages ||
                                                    Math.abs(item - page) <= 1
                                            )
                                            .map((item, index, visiblePages) => {
                                                const previous = visiblePages[index - 1];

                                                return (
                                                    <React.Fragment key={item}>
                                                        {previous && item - previous > 1 && (
                                                            <span className="px-1 text-gray-400">
                                                                ...
                                                            </span>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => goToPage(item)}
                                                            className={`h-10 min-w-10 rounded-full px-3 text-sm${item === page
                                                                ? "ui-btn-primary"
                                                                : "border ui-btn-outline"
                                                                }`}
                                                        >
                                                            {item}
                                                        </button>
                                                    </React.Fragment>
                                                );
                                            })}

                                        <button
                                            type="button"
                                            disabled={page >= totalPages}
                                            onClick={() => goToPage(page + 1)}
                                            className="flex h-10 w-10 items-center justify-center rounded-full border disabled:cursor-not-allowed disabled:opacity-30 ui-btn-outline"
                                        >
                                            <ChevronRight size={17} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Mobile Filter Drawer */}
            {mobileFiltersOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setMobileFiltersOpen(false)}
                    />

                    <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-white p-6">
                        <div className="mb-8 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Filters</h2>

                            <button
                                type="button"
                                onClick={() => setMobileFiltersOpen(false)}
                             className="ui-btn-outline">
                                <X size={20} />
                            </button>
                        </div>

                        <FilterContent />

                        <button
                            type="button"
                            onClick={() => setMobileFiltersOpen(false)}
                            className="mt-8 w-full rounded-full py-3 text-sm font-medium ui-btn-primary"
                        >
                            Show results
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Shop;