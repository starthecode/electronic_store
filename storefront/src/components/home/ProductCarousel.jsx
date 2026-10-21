import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../ui/ProductCard";

const ProductCarousel = ({ title, products = [] }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({
      left: direction * Math.max(scrollRef.current.clientWidth * 0.8, 280),
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-8 lg:px-8">
      <div className="mb-7 flex items-center justify-between">
        <h2 className="text-[22px] font-medium tracking-[-0.8px]">
          {title}
        </h2>

        <Link
          to="/shop"
          className="text-[10px] text-gray-500 hover:text-black"
        >
          See All <span className="ml-1">›</span>
        </Link>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-1 scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {products.map((product) => (
            <div
              key={`${product.type || "regular"}-${product.id}`}
              className="w-[calc(50%-6px)] shrink-0 sm:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {products.length > 4 && (
          <>
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label={`Previous ${title}`}
              className="absolute -left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm"
            >
              <ChevronLeft size={14} />
            </button>

            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label={`Next ${title}`}
              className="absolute -right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black text-white shadow-sm"
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default ProductCarousel;
