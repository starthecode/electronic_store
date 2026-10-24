import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import { getStoreHomepageTestimonials } from "../../services/storeProduct.service";

function CustomerAvatar({ item }) {
  const [failed, setFailed] = useState(false);
  const initials = item.customerName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return item.avatarUrl && !failed ? (
    <img
      src={item.avatarUrl}
      alt={`${item.customerName}`}
      onError={() => setFailed(true)}
      loading="lazy"
      className="h-11 w-11 rounded-full object-cover"
    />
  ) : (
    <div
      aria-hidden="true"
      className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700"
    >
      {initials}
    </div>
  );
}

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const scrollerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getStoreHomepageTestimonials()
      .then((response) => {
        if (!cancelled) {
          const content = response?.data;
          setTestimonials(Array.isArray(content) ? content : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Customer stories are temporarily unavailable.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && testimonials.length === 0 && !error) return null;

  const scroll = (direction) => {
    const element = scrollerRef.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-5">
        <h2 className="max-w-[350px] text-[28px] font-medium leading-[1.15] tracking-[-1px]">
          What Our Customers
          <br />
          Are Saying
        </h2>
        <p className="hidden max-w-[220px] text-[10px] leading-[1.5] text-gray-500 sm:block">
          Real and heartfelt experiences from customers who trust MagDeal.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-label="Loading testimonials">
          {[0, 1].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-xl bg-[#f7f7f7]" />
          ))}
        </div>
      ) : error ? (
        <p role="status" className="rounded-xl bg-[#f7f7f7] p-6 text-sm text-gray-500">
          {error}
        </p>
      ) : (
        <>
          <div
            ref={scrollerRef}
            className="grid auto-cols-[100%] grid-flow-col gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 sm:auto-cols-[calc(50%-0.5rem)] lg:auto-cols-[calc(50%-0.5rem)]"
            aria-label="Customer testimonials"
          >
            {testimonials.map((item) => (
              <article
                key={item.id}
                className="min-w-0 snap-start rounded-xl bg-[#f7f7f7] p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <CustomerAvatar item={item} />
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-gray-900">
                        {item.customerName}
                      </h3>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {item.customerRole}
                      </p>
                    </div>
                  </div>
                  <Quote size={25} className="shrink-0 text-gray-300" aria-hidden="true" />
                </div>

                <p className="mt-6 text-sm leading-6 text-gray-600">
                  {item.text}
                </p>

                <div className="mt-5 flex gap-1 text-amber-500" aria-label={`${item.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      size={15}
                      fill={index < item.rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
          {testimonials.length > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                aria-label="Previous testimonials"
                onClick={() => scroll(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border ui-btn-outline"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next testimonials"
                onClick={() => scroll(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full ui-btn-primary"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default Testimonials;
