import React from "react";
import { Quote } from "lucide-react";

const Testimonials = ({ testimonials }) => {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="max-w-[350px] text-[28px] font-medium leading-[1.15] tracking-[-1px]">
          What Our Customers
          <br />
          Are Saying
        </h2>

        <p className="hidden max-w-[220px] text-[10px] leading-[1.5] text-gray-500 sm:block">
          Real and heartfelt experiences from our cherished
          customers who trust and rely on us.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {testimonials.map((item) => (
          <div
            key={item.name}
            className="rounded-xl bg-[#f7f7f7] p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-semibold">
                  {item.name}
                </h3>

                <p className="mt-1 text-[9px] text-gray-500">
                  {item.role}
                </p>
              </div>

              <Quote
                size={25}
                className="text-gray-300"
              />
            </div>

            <p className="mt-6 text-[10px] leading-[1.6] text-gray-500">
              {item.text}
            </p>

            <div className="mt-5 flex gap-1 text-[11px]">
              {"★★★★★".split("").map((star, index) => (
                <span key={index}>★</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-2">
        <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200">
          ‹
        </button>

        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
          ›
        </button>
      </div>
    </section>
  );
};

export default Testimonials;