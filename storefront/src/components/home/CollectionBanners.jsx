import React from "react";

const collections = [
  {
    title: "Iphone 16 Pro Max",
    text: "Grave the latest iPhone 16 pro max with powerful performance.",
    image:
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Premium Headphone",
    text: "Grave the premium Headphone made to luxury.",
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
  },
];

const CollectionBanners = () => {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-8 lg:px-8">
      <div className="grid gap-4 md:grid-cols-2">
        {collections.map((item) => (
          <div
            key={item.title}
            className="relative h-[270px] overflow-hidden rounded-xl bg-[#f7f7f7]"
          >
            <div className="absolute left-5 top-1/2 z-10 max-w-[190px] -translate-y-1/2">
              <h3 className="text-[18px] font-medium">
                {item.title}
              </h3>

              <p className="mt-2 text-[10px] leading-[1.5] text-gray-500">
                {item.text}
              </p>

              <a
                href="/shop"
                className="mt-5 inline-block text-[9px] font-semibold underline underline-offset-4"
              >
                Shop Collection →
              </a>
            </div>

            <img
              src={item.image}
              alt={item.title}
              className="absolute right-0 top-0 h-full w-[58%] object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default CollectionBanners;