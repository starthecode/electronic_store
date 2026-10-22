import { useState } from "react";

const StoreImage = ({
  src,
  alt,
  className,
  fallbackClassName = "flex h-full w-full items-center justify-center bg-[#f7f7f7] p-4 text-center text-xs text-gray-400",
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={fallbackClassName} role="img" aria-label={alt}>
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export default StoreImage;
