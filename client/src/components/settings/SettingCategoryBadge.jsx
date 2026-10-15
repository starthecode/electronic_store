const categoryStyles = {
  GENERAL:
    "bg-gray-100 text-gray-700",

  STORE:
    "bg-blue-50 text-blue-700",

  CURRENCY:
    "bg-purple-50 text-purple-700",

  TAX:
    "bg-orange-50 text-orange-700",

  SHIPPING:
    "bg-cyan-50 text-cyan-700",

  ORDERS:
    "bg-green-50 text-green-700",

  INVENTORY:
    "bg-yellow-50 text-yellow-700",

  PAYMENTS:
    "bg-indigo-50 text-indigo-700",

  AFFILIATE:
    "bg-pink-50 text-pink-700",

  NOTIFICATIONS:
    "bg-violet-50 text-violet-700",

  SYSTEM:
    "bg-gray-100 text-gray-600",
};

const formatCategory = (value = "") =>
  value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );

const SettingCategoryBadge = ({
  category,
}) => {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        categoryStyles[category] ||
        "bg-gray-100 text-gray-600"
      }`}
    >
      {formatCategory(category)}
    </span>
  );
};

export default SettingCategoryBadge;