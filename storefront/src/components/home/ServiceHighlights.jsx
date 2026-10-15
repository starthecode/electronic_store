import React from "react";
import {
  CircleCheck,
  Headphones,
  RotateCcw,
  Truck,
} from "lucide-react";

const services = [
  {
    icon: CircleCheck,
    title: "Superior Quality",
    text: "We only give the best. No compromises.",
  },
  {
    icon: Truck,
    title: "Fast & Free Shipping",
    text: "Enjoy free shipping on orders over $50.",
  },
  {
    icon: RotateCcw,
    title: "30-Day Returns",
    text: "Not satisfied? Return it within 30 days.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    text: "Our dedicated support team is available anytime.",
  },
];

const ServiceHighlights = () => {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-12 lg:px-8">
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
        {services.map((service) => {
          const Icon = service.icon;

          return (
            <div
              key={service.title}
              className="flex items-start gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200">
                <Icon size={15} strokeWidth={1.5} />
              </div>

              <div>
                <h3 className="text-[11px] font-semibold">
                  {service.title}
                </h3>

                <p className="mt-1 text-[9px] leading-[1.4] text-gray-500">
                  {service.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ServiceHighlights;