export const parseAffiliateImageUrls = (
  imageUrls: string[] | null | undefined,
  legacyImageUrl: string | null | undefined
) => {
  if (imageUrls?.length) {
    return imageUrls.map((url) => url.trim());
  }

  if (!legacyImageUrl?.trim()) {
    return [];
  }

  const legacyValue = legacyImageUrl.trim();
  const candidates = legacyValue.split(/,(?=\s*https?:\/\/)/i);
  if (candidates.length === 1) {
    return [legacyValue];
  }

  const hasAmbiguousDelimiter = candidates
    .slice(0, -1)
    .some((candidate) => {
      const trimmed = candidate.trim();
      if (/\s$/.test(candidate)) {
        return false;
      }

      try {
        const url = new URL(trimmed);
        return (
          url.search.includes(",") ||
          url.hash.includes(",") ||
          !/\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname)
        );
      } catch {
        return true;
      }
    });

  if (hasAmbiguousDelimiter) {
    return [legacyValue];
  }

  return candidates
    .map((candidate) => candidate.trim())
    .filter(Boolean);
};
