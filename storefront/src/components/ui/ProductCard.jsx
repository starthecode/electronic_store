import { useState } from "react";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const isAffiliateProduct = product.type === "affiliate";
  const productDetailsUrl = isAffiliateProduct
    ? `/products/${product.slug}?type=affiliate`
    : `/products/${product.slug}`;

  const image = isAffiliateProduct
    ? product.imageUrl || "/placeholder-product.jpg"
    : product.images?.find((item) => item.isPrimary)?.url ||
      product.images?.[0]?.url ||
      "/placeholder-product.jpg";

  const prices = (product.variants || [])
    .map((variant) => Number(variant.price))
    .filter(Number.isFinite);

  const comparePrices = (product.variants || [])
    .map((variant) => Number(variant.compareAtPrice))
    .filter(Number.isFinite);

  const price = isAffiliateProduct
    ? product.displayPrice == null
      ? null
      : Number(product.displayPrice)
    : prices.length
      ? Math.min(...prices)
      : null;
  const comparePrice = comparePrices.length
    ? Math.max(...comparePrices)
    : null;

  const availableVariant = isAffiliateProduct
    ? null
    : (product.variants || []).find((variant) => variant.inStock);

  const hasDiscount =
    !isAffiliateProduct &&
    price !== null &&
    comparePrice !== null &&
    comparePrice > price;

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!availableVariant) return;

    const result = addToCart(product, availableVariant);

    if (result.success) {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1200);
    }
  };

  return (
    <article className="group block min-w-0 overflow-hidden rounded-xl bg-[#f7f7f7]">
      <Link
        to={productDetailsUrl}
        className="block"
      >
        <div className="relative flex h-[210px] items-center justify-center overflow-hidden p-5">
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
          />

          {product.brand?.name && (
            <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-black/60">
              {product.brand.name}
            </span>
          )}

          <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-all group-hover:scale-105">
            <ArrowUpRight size={14} />
          </span>
        </div>

        <div className="px-4 pb-2 pt-2">
          <h3 className="truncate text-[13px] font-medium text-[#111]">
            {product.name}
          </h3>

          <div className="mt-1 flex items-center gap-2">
            {price !== null && (
              <p className="text-[12px] font-semibold text-[#111]">
                ₹{price.toLocaleString("en-IN")}
              </p>
            )}

            {hasDiscount && (
              <p className="text-[11px] text-black/35 line-through">
                ₹{comparePrice.toLocaleString("en-IN")}
              </p>
            )}
          </div>

          <p className="mt-1 text-[10px] text-black/40">
            {isAffiliateProduct
              ? "Affiliate link • MagDeal may earn a commission"
              : availableVariant
                ? "In stock"
                : "Out of stock"}
          </p>
        </div>
      </Link>

      <div className="px-4 pb-4 pt-2">
        {isAffiliateProduct ? (
          <Link
            to={productDetailsUrl}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-[10px] font-medium text-white transition hover:bg-gray-800"
          >
            View Product
            <ArrowUpRight size={13} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!availableVariant}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-[10px] font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/35"
          >
            <ShoppingBag size={13} strokeWidth={1.8} />
            {added ? "Added to cart" : availableVariant ? "Add to cart" : "Out of stock"}
          </button>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
