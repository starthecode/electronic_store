import { EyeOff } from "lucide-react";

const SettingValue = ({ setting }) => {
  if (setting.isSensitive) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <EyeOff size={15} />
        <span>Sensitive value</span>
      </div>
    );
  }

  const value = setting.value;

  if (value === null) {
    return (
      <span className="text-sm text-gray-400">
        null
      </span>
    );
  }

  if (typeof value === "boolean") {
    return (
      <span className="text-sm font-medium text-gray-700">
        {value ? "true" : "false"}
      </span>
    );
  }

  if (
    typeof value === "object"
  ) {
    return (
      <pre className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-600">
        {JSON.stringify(value)}
      </pre>
    );
  }

  return (
    <span className="block max-w-md truncate text-sm text-gray-700">
      {String(value)}
    </span>
  );
};

export default SettingValue;