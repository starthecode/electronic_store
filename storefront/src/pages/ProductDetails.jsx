import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import ProductGallery from "../components/product/ProductGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductTabs from "../components/product/ProductTabs";
import RelatedProducts from "../components/product/RelatedProducts";

import {
  getStoreProduct,
  getStoreProducts,
} from "../services/storeProduct.service";

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productType = searchParams.get("type");

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [error, setError] = useState("");

  /* ---------------------------------------------
   * Load Related Products
   * -------------------------------------------*/
  const loadRelatedProducts = useCallback(async (currentProduct) => {
    try {
      setLoadingRelated(true);

      let related = [];

      // 1. Same category products
      if (currentProduct.category?.id) {
        const categoryResponse = await getStoreProducts({
          categoryId: currentProduct.category.id,
          page: 1,
          limit: 8,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        related = categoryResponse?.data?.products || [];
      }

      // Remove current product
      related = related.filter(
        (item) => item.id !== currentProduct.id
      );

      // 2. Fallback products if category has less than 4
      if (related.length < 4) {
        const fallbackResponse = await getStoreProducts({
          page: 1,
          limit: 12,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        const fallback = fallbackResponse?.data?.products || [];

        const existingIds = new Set(
          related.map((item) => item.id)
        );

        fallback.forEach((item) => {
          if (
            item.id === currentProduct.id ||
            existingIds.has(item.id)
          ) {
            return;
          }

          related.push(item);
          existingIds.add(item.id);
        });
      }

      setRelatedProducts(related.slice(0, 4));
    } catch (err) {
      console.error("Failed to load related products", err);
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
    }
  }, []);

  /* ---------------------------------------------
   * Load Product
   * -------------------------------------------*/
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getStoreProduct(slug, productType);

        const currentProduct = response?.data;

        if (!currentProduct) {
          setError("Product not found.");
          return;
        }

        setProduct(currentProduct);

        // Load related without blocking page
        loadRelatedProducts(currentProduct);
      } catch (err) {
        console.error("Failed to load product", err);

        if (err?.response?.status === 404) {
          setError("Product not found.");
        } else {
          setError(
            err?.response?.data?.message ||
              "Unable to load this product."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) loadProduct();
  }, [slug, productType, loadRelatedProducts]);

  /* ---------------------------------------------
   * Cart Actions (Redux later)
   * -------------------------------------------*/
  const handleAddToCart = (variant, quantity) => {
    console.log("Add To Cart", {
      productId: product.id,
      variantId: variant.id,
      quantity,
    });
  };

  const handleBuyNow = (variant, quantity) => {
    console.log("Buy Now", {
      productId: product.id,
      variantId: variant.id,
      quantity,
    });
  };

  /* ---------------------------------------------
   * Loading Skeleton
   * -------------------------------------------*/
  if (loading) {
    return (
      <main className="bg-white">
        <div className="mx-auto max-w-[1320px] px-5 py-10 lg:px-8">
          <div className="h-4 w-56 animate-pulse rounded bg-gray-200" />

          <div className="mt-8 grid items-start gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="aspect-square animate-pulse rounded-3xl bg-gray-100" />

            <div className="space-y-5">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-12 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
              <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-12 w-60 animate-pulse rounded bg-gray-200" />
              <div className="h-12 w-full animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------
   * Error
   * -------------------------------------------*/
  if (error || !product) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-white px-5">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
            STORE
          </p>

          <h1 className="mt-4 text-3xl font-semibold">
            {error || "Product not found"}
          </h1>

          <p className="mt-3 text-gray-500">
            This product may have been removed or is unavailable.
          </p>

          <button
            onClick={() => navigate("/shop")}
            className="mt-8 rounded-full bg-black px-8 py-3 text-sm font-medium text-white transition hover:bg-[#222]"
          >
            Back to Shop
          </button>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------
   * UI
   * -------------------------------------------*/
  return (
    <main className="bg-white">
      <div className="mx-auto max-w-[1320px] px-5 py-8 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-gray-400">
          <Link to="/" className="hover:text-black">
            Home
          </Link>

          <ChevronRight size={14} />

          <Link to="/shop" className="hover:text-black">
            Shop
          </Link>

          <ChevronRight size={14} />

          <span className="truncate text-gray-600">{product.name}</span>
        </div>

        {/* Product Section */}
        <section className="grid items-start gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <ProductGallery
            key={`${product.type || "regular"}-${product.id}`}
            product={product}
          />

          <ProductInfo
            key={`${product.type || "regular"}-${product.id}`}
            product={product}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        </section>

        {/* Tabs */}
        <ProductTabs
          key={`${product.type || "regular"}-${product.id}`}
          product={product}
        />

        {/* Related Products */}
        <section className="mt-24">
          {loadingRelated ? (
            <div>
              <div className="mb-8 text-center">
                <div className="mx-auto h-8 w-48 animate-pulse rounded bg-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index}>
                    <div className="aspect-square animate-pulse rounded-2xl bg-gray-100" />
                    <div className="mx-auto mt-4 h-4 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="mx-auto mt-2 h-4 w-20 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <RelatedProducts products={relatedProducts} />
          )}
        </section>
      </div>
    </main>
  );
};

export default ProductDetails;