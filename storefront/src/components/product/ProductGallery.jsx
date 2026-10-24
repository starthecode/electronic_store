import { useMemo, useState } from "react";

const ProductGallery = ({ product }) => {
    const images = useMemo(() => {
        return [...(product?.images || [])].sort((a, b) => {
            if (a.isPrimary) return -1;
            if (b.isPrimary) return 1;

            return (a.sortOrder || 0) - (b.sortOrder || 0);
        });
    }, [product]);

    const [selectedImage, setSelectedImage] = useState(0);
    const [failedImages, setFailedImages] = useState({});

    const activeImage = images[selectedImage] || images[0];

    if (!images.length) {
        return (
            <div className="flex aspect-square items-center justify-center rounded-2xl bg-[#f7f7f7] text-sm text-gray-400">
                Image unavailable
            </div>
        );
    }

    return (
        <div>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#f7f7f7]">
                {failedImages[activeImage.id] ? (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                        Image unavailable
                    </div>
                ) : (
                    <img
                        src={activeImage.url}
                        alt={activeImage.altText || product.name}
                        onError={() =>
                            setFailedImages((current) => ({
                                ...current,
                                [activeImage.id]: true,
                            }))
                        }
                        className="h-full w-full object-contain p-8 transition duration-500"
                    />
                )}
            </div>

            {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            type="button"
                            onClick={() => setSelectedImage(index)}
                            className={(`aspect-square overflow-hidden rounded-xl bg-[#f7f7f7] ${
                                selectedImage === index
                                    ? "ring-2 ring-[#ff8a00] ring-offset-2"
                                    : "border border-transparent"
                            }`)}
                        >
                            {failedImages[image.id] ? (
                                <span className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-gray-400">
                                    Image unavailable
                                </span>
                            ) : (
                                <img
                                    src={image.url}
                                    alt={image.altText || product.name}
                                    onError={() =>
                                        setFailedImages((current) => ({
                                            ...current,
                                            [image.id]: true,
                                        }))
                                    }
                                    className="h-full w-full object-contain p-3"
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductGallery;