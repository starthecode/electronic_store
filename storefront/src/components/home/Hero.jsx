import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getStoreHomepageSlides } from "../../services/storeProduct.service";

const fallbackSlide = {
  title: "Transform Your Tech,\nBoost Digital Journey!",
  description:
    "From ultra-fast chargers to cutting-edge gaming accessories, find everything you need to power your devices with style and performance.",
  buttonLabel: "Shop Now",
  buttonUrl: "/shop",
  imageUrl:
    "https://images.unsplash.com/photo-1726587912121-ea21fcc57ff8?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
};

const isExternalDestination = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

const Hero = () => {
  const [slides, setSlides] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failedImageUrl, setFailedImageUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    getStoreHomepageSlides()
      .then((response) => {
        const content = response?.data;
        if (!cancelled) {
          setSlides(Array.isArray(content) ? content : []);
        }
      })
      .catch(() => {
        if (!cancelled) setSlides([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const content = slides.length ? slides : [fallbackSlide];
  const slide = content[activeIndex] ?? content[0];
  const featureBullets = Array.isArray(slide.featureBullets)
    ? slide.featureBullets.filter(Boolean)
    : [];
  const variantLabels = Array.isArray(slide.variantLabels)
    ? slide.variantLabels.filter(Boolean)
    : [];
  const titleLines = slide.title.split("\n");
  const destinationIsExternal = isExternalDestination(slide.buttonUrl);
  const imageFailed = failedImageUrl === slide.imageUrl;
  const backgroundColor = /^#[0-9a-fA-F]{6}$/.test(slide.backgroundColor ?? "")
    ? slide.backgroundColor
    : "#ffffff";

  useEffect(() => {
    if (paused || content.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % content.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [content.length, paused]);

  const move = (offset) => {
    setActiveIndex((index) => (
      (index + offset + content.length) % content.length
    ));
  };

  const buttonClass =
    "inline-flex min-h-12 items-center justify-center rounded-lg bg-[#ff8a00] px-7 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#ed7d00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8a00]";

  return (
    <section className="px-4 pt-5 sm:px-6 lg:px-8">
      <div
        className="relative mx-auto min-h-[570px] max-w-[1200px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:min-h-[500px] lg:min-h-[520px]"
        style={{ backgroundColor }}
        aria-roledescription="carousel"
        aria-label="Homepage highlights"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setPaused(false);
          }
        }}
      >
        {isHttpUrl(slide.backgroundImageUrl) && (
          <img
            src={slide.backgroundImageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-15"
          />
        )}

        <div className="relative z-10 grid min-h-[570px] grid-cols-1 items-center gap-3 px-6 py-8 sm:min-h-[500px] sm:px-10 lg:min-h-[520px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-16 lg:py-10">
          <div className="flex min-w-0 flex-col items-start">
            {slide.brandName && (
              <p className="mb-5 text-sm font-extrabold uppercase tracking-[0.2em] text-gray-900 sm:text-base">
                {slide.brandName}
              </p>
            )}

            <h1 className="max-w-2xl whitespace-pre-line break-words text-sm font-semibold leading-[0.98] tracking-[-1.7px] text-[#58666d] sm:text-md lg:text-lg">
              {slide.titleHighlight && (
                <span className="mb-1 block text-[#477baa]">
                  {slide.titleHighlight}
                </span>
              )}
              {titleLines.join("\n")}
            </h1>

            {slide.description && (
              <p className="mt-6 max-w-xl text-sm leading-6 text-gray-700 sm:text-base">
                {slide.description}
              </p>
            )}

            {featureBullets.length > 0 && (
              <ul className="mt-5 max-w-xl space-y-1.5 text-sm leading-5 text-gray-700 sm:text-base">
                {featureBullets.map((feature, index) => (
                  <li key={`${feature}-${index}`} className="flex gap-2.5">
                    <span className="mt-[0.55em] h-2 w-2 shrink-0 rounded-full bg-[#58666d]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {(slide.specText || slide.priceLabel || slide.price) && (
              <div className="mt-6 space-y-1 text-[#477baa]">
                {slide.specText && (
                  <p className="text-xl font-normal sm:text-2xl">
                    {slide.specText}
                  </p>
                )}
                {(slide.priceLabel || slide.price) && (
                  <p className="text-xl font-semibold sm:text-2xl">
                    {[slide.priceLabel, slide.price].filter(Boolean).join(": ")}
                  </p>
                )}
              </div>
            )}

            {variantLabels.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Variants
                </span>
                {variantLabels.map((variant, index) => (
                  <span
                    key={`${variant}-${index}`}
                    className="rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs text-gray-700"
                  >
                    {variant}
                  </span>
                ))}
              </div>
            )}

            {destinationIsExternal ? (
              <a
                href={slide.buttonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={(`${buttonClass}mt-6`) + "ui-btn-primary"}
              >
                {slide.buttonLabel}
              </a>
            ) : (
              <Link to={slide.buttonUrl} className={(`${buttonClass}mt-6`) + "ui-btn-primary"}>
                {slide.buttonLabel}
              </Link>
            )}
          </div>

          <div className="relative flex h-[255px] min-w-0 items-center justify-center sm:h-[300px] lg:h-full lg:min-h-[400px]">
            {!imageFailed && isHttpUrl(slide.imageUrl) ? (
              <picture className="h-full w-full">
                {isHttpUrl(slide.mobileImageUrl) && (
                  <source
                    media="(max-width: 639px)"
                    srcSet={slide.mobileImageUrl}
                  />
                )}
                <img
                  src={slide.imageUrl}
                  alt={slide.title.replace(/\s*\n\s*/g, " ")}
                  width="880"
                  height="700"
                  fetchPriority="high"
                  onError={() => setFailedImageUrl(slide.imageUrl)}
                  className="h-full w-full object-contain"
                />
              </picture>
            ) : (
              <div
                role="img"
                aria-label="Product image unavailable"
                className="flex h-full w-full items-center justify-center rounded-2xl bg-white/50 text-sm text-gray-400"
              >
                Product image unavailable
              </div>
            )}
          </div>
        </div>

        {content.length > 1 && (
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 sm:bottom-6 sm:right-7">
            <button
              type="button"
              aria-label="Previous homepage slide"
              onClick={() => move(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border transition ui-btn-outline"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next homepage slide"
              onClick={() => move(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full transition ui-btn-primary"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
