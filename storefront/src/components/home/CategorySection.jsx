import React from "react";
import {
  Cable,
  Headphones,
  Monitor,
  Mouse,
  Smartphone,
  Watch,
} from "lucide-react";

const iconMap = {
  cable: Cable,
  headphones: Headphones,
  watch: Watch,
  smartphone: Smartphone,
  monitor: Monitor,
  mouse: Mouse,
};

const CategorySection = ({ categories }) => {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-14 lg:px-8">
      <h2 className="mb-7 text-center text-[22px] font-medium tracking-[-0.8px]">
        Shop By Category
      </h2>

      <div className="grid grid-cols-3 overflow-hidden rounded-xl bg-[#f7f7f7] sm:grid-cols-6">
        {categories.map((category) => {
          const Icon = iconMap[category.icon] || Monitor;

          return (
            <a
              key={category.name}
              href="/shop"
              className="flex min-h-[105px] flex-col items-center justify-center gap-4 border-b border-gray-200 px-3 transition hover:bg-white sm:border-b-0 sm:border-r last:border-r-0"
            >
              <Icon
                size={22}
                strokeWidth={1.4}
              />

              <span className="text-[10px] text-gray-700">
                {category.name}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
};

export default CategorySection;