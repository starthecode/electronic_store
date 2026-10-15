import React from "react";
import { ArrowUpRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="px-4 pt-5 sm:px-6 lg:px-8">
      <div className="relative mx-auto h-[430px] max-w-[1200px] overflow-hidden rounded-2xl bg-[#f6f6f6]">
        <div className="absolute left-7 top-12 z-10 max-w-[620px] sm:left-12 lg:left-16">
          <h1 className="text-[38px] font-medium leading-[1.08] tracking-[-1.8px] sm:text-[48px] lg:text-[52px]">
            Transform Your Tech,
            <br />
            Boost Digital Journey!
          </h1>
        </div>

        <div className="absolute right-8 top-14 z-10 w-[230px] sm:right-14 lg:right-20">
          <p className="text-[12px] leading-[1.55] text-gray-600">
            From ultra-fast chargers to cutting-edge gaming
            accessories, find everything you need to power your
            devices with style and performance.
          </p>

          <div className="mt-5 flex items-center gap-4">
            <button className="rounded-full bg-white px-4 py-2 text-[10px] font-medium shadow-sm">
              Shop Now →
            </button>

            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white">
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-[-70px] left-1/2 h-[350px] w-[430px] -translate-x-1/2 overflow-hidden sm:h-[390px] sm:w-[480px]">
          <img
            src="https://images.unsplash.com/photo-1726587912121-ea21fcc57ff8?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Smartphone"
            className="h-full w-full object-cover object-top"
          />
        </div>

        <div className="absolute bottom-[-20px] left-8 select-none text-[90px] font-bold tracking-[-6px] text-white/80 sm:left-16 sm:text-[130px]">
          Gearadge
        </div>
      </div>
    </section>
  );
};

export default Hero;