const RoleStatusBadge = ({ role }) => {
  const isSystem =
    role?.name === "SUPER_ADMIN" ||
    role?.name === "CUSTOMER";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        isSystem
          ? "bg-gray-100 text-gray-600"
          : "bg-green-50 text-green-700"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          isSystem
            ? "bg-gray-400"
            : "bg-green-500"
        }`}
      />

      {isSystem
        ? "System Role"
        : "Custom Role"}
    </span>
  );
};

export default RoleStatusBadge;