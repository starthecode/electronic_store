import React from "react";

const Newsletter = () => {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-10 lg:px-8">
      <div className="rounded-xl bg-[#f7f7f7] px-6 py-14 text-center">
        <h2 className="text-[24px] font-medium tracking-[-0.8px]">
          Stay Updated with the Latest Tech!
        </h2>

        <p className="mx-auto mt-2 max-w-[400px] text-[10px] leading-[1.5] text-gray-500">
          Real and heartfelt experiences from our cherished
          customers who trust and rely on us.
        </p>

        <form
          className="mx-auto mt-7 flex max-w-[330px] overflow-hidden rounded-md bg-white"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="Enter Your Email"
            className="min-w-0 flex-1 px-4 py-3 text-[9px] outline-none"
          />

          <button
            type="submit"
            className="px-4 text-[9px] font-medium ui-btn-primary"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;