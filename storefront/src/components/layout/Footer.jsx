

const Footer = () => {
  return (
    <footer className="mx-auto max-w-[1200px] px-5 pb-8 pt-14 lg:px-8">
      <div className="grid gap-10 border-b border-gray-100 pb-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="text-[13px] font-bold">
            Gearadge
          </h3>

          <p className="mt-3 max-w-[220px] text-[10px] leading-[1.6] text-gray-500">
            We provide top-quality mobile and computer accessories
            designed for performance, durability, and convenience.
          </p>

          <div className="mt-5 flex gap-2">
           <p>
            <span>Facebook</span>
           </p>

             <p>
            <span>Twitter</span>
           </p>
             <p>
            <span>Instagram</span>
           </p>
          </div>
        </div>

        <FooterColumn
          title="Quick Links"
          links={[
            "Shop All",
            "Best Sellers",
            "Webinars",
            "Deals",
            "Wishlist",
          ]}
        />

        <FooterColumn
          title="Support"
          links={[
            "Order Tracking",
            "Returns & Refunds",
            "Privacy Policy",
            "Terms & Conditions",
          ]}
        />

        <FooterColumn
          title="Company"
          links={[
            "Our Story",
            "Visit Our Store",
            "Contact Us",
            "Account",
          ]}
        />
      </div>

      <div className="flex items-center justify-between pt-5 text-[9px] text-gray-400">
        <span>© 2026 Gearadge. All rights reserved.</span>

        <button className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-black">
          ↑
        </button>
      </div>
    </footer>
  );
};

const FooterColumn = ({ title, links }) => (
  <div>
    <h3 className="text-[11px] font-semibold">
      {title}
    </h3>

    <div className="mt-4 space-y-2">
      {links.map((link) => (
        <a
          key={link}
          href="/"
          className="block text-[9px] text-gray-500 hover:text-black"
        >
          {link}
        </a>
      ))}
    </div>
  </div>
);

const SocialIcon = ({ children }) => (
  <button className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300">
    {children}
  </button>
);

export default Footer;