import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
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

  const titleLines = slide.title.split("\n");
  const destinationIsExternal = isExternalDestination(slide.buttonUrl);
  const imageFailed = failedImageUrl === slide.imageUrl;
  const button = destinationIsExternal ? (
    <a
      href={slide.buttonUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full bg-white px-4 py-2 text-[10px] font-medium shadow-sm transition hover:bg-gray-50"
    >
      {slide.buttonLabel} →
    </a>
  ) : (
    <Link
      to={slide.buttonUrl}
      className="rounded-full bg-white px-4 py-2 text-[10px] font-medium shadow-sm transition hover:bg-gray-50"
    >
      {slide.buttonLabel} →
    </Link>
  );

  return (
    <section className="px-4 pt-5 sm:px-6 lg:px-8">
      <div
        className="relative mx-auto min-h-[430px] max-w-[1200px] overflow-hidden rounded-2xl bg-[#f6f6f6] sm:h-[430px]"
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
        <div className="absolute left-6 top-8 z-10 max-w-[620px] pr-4 sm:left-12 sm:top-12 sm:pr-0 lg:left-16">
          <h1 className="whitespace-pre-line text-[34px] font-medium leading-[1.08] tracking-[-1.8px] sm:text-[48px] lg:text-[52px]">
            {titleLines.join("\n")}
          </h1>
        </div>

        <div className="absolute right-6 top-[125px] z-10 w-[200px] sm:right-10 sm:top-14 sm:w-[230px] lg:right-20">
          <p className="text-[12px] leading-[1.55] text-gray-600">
            {slide.description}
          </p>
          <div className="mt-5 flex items-center gap-4">
            {button}
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white">
              <ArrowUpRight size={14} />
            </span>
          </div>
        </div>

        {!imageFailed && slide.imageUrl && (
          <div className="absolute bottom-[-70px] left-1/2 h-[240px] w-[260px] -translate-x-1/2 overflow-hidden sm:bottom-[-70px] sm:h-[350px] sm:w-[430px]">
            <picture>
              {slide.mobileImageUrl && (
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
                className="h-full w-full object-cover object-top"
              />
            </picture>
          </div>
        )}

        <div className="absolute bottom-[-20px] left-6 select-none text-[76px] font-bold tracking-[-6px] text-white/80 sm:left-16 sm:text-[130px]">
          Magdeal
        </div>

        {content.length > 1 && (
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 sm:bottom-6 sm:right-7">
            <button
              type="button"
              aria-label="Previous homepage slide"
              onClick={() => move(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white/90 transition hover:bg-white"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next homepage slide"
              onClick={() => move(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white transition hover:bg-gray-700"
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
