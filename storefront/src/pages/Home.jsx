import { useEffect, useMemo, useState } from "react";
import Hero from "../components/home/Hero";
import ServiceHighlights from "../components/home/ServiceHighlights";
import ProductCarousel from "../components/home/ProductCarousel";
import CategorySection from "../components/home/CategorySection";
import CollectionBanners from "../components/home/CollectionBanners";
import Testimonials from "../components/home/Testimonials";
import Newsletter from "../components/home/Newsletter";
import {
  getStoreCategories,
  getStoreProducts,
} from "../services/storeProduct.service";
import { Link } from "react-router-dom";

const PRODUCT_LIMIT = 8;

const ProductSectionSkeleton = () => (
  <section className="mx-auto max-w-[1200px] px-5 py-8 lg:px-8">
    <div className="mb-7 h-7 w-36 animate-pulse rounded bg-[#eeeeee]" />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl bg-[#f7f7f7]"
        >
          <div className="h-[210px] animate-pulse bg-[#eeeeee]" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-3/4 animate-pulse rounded bg-[#e9e9e9]" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-[#e9e9e9]" />
          </div>
        </div>
      ))}
    </div>
  </section>
);

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);

        const response = await getStoreProducts({
          page: 1,
          limit: PRODUCT_LIMIT,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        if (!cancelled) {
          setProducts(response?.data?.products || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Unable to load featured products."
          );
        }
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };

    const loadCategories = async () => {
      try {
        setLoadingCategories(true);

        const response = await getStoreCategories();

        if (!cancelled) {
          setCategories(response?.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError((current) =>
            current ||
            err?.response?.data?.message ||
            "Unable to load store categories."
          );
        }
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    };

    loadProducts();
    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const bestSellers = useMemo(
    () => products.slice(0, 4),
    [products]
  );

  const trendingProducts = useMemo(
    () => products.slice(4, 8).length
      ? products.slice(4, 8)
      : products.slice(0, 4),
    [products]
  );

  const homeCategories = useMemo(
    () =>
      categories.slice(0, 6).map((category) => ({
        ...category,
        image: category.imageUrl || category.image || null,
      })),
    [categories]
  );

  return (
    <div className="min-h-screen bg-white">
      <main>
        <Hero />
        <ServiceHighlights />

        {loadingProducts ? (
          <>
            <ProductSectionSkeleton />
            <ProductSectionSkeleton />
          </>
        ) : products.length > 0 ? (
          <>
            <ProductCarousel
              title="Best Sellers"
              products={bestSellers}
            />

            <ProductCarousel
              title="Trending Now"
              products={trendingProducts}
            />
          </>
        ) : (
          <section className="mx-auto max-w-[1200px] px-5 py-16 text-center lg:px-8">
            <p className="text-sm text-gray-500">
              {error || "No products are available right now."}
            </p>
            <Link
              to="/shop"
              className="mt-5 inline-flex rounded-full px-5 py-3 text-xs font-medium ui-btn-primary"
            >
              Browse shop
            </Link>
          </section>
        )}

        {!loadingCategories && homeCategories.length > 0 && (
          <CategorySection categories={homeCategories} />
        )}

        <CollectionBanners />

        <Testimonials />

        <Newsletter />
      </main>
    </div>
  );
};

export default Home;
