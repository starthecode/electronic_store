export const groupProductSpecifications = (specifications = []) => {
  const groups = new Map();

  for (const item of specifications) {
    const group = item?.specification?.group;
    const key = group?.id || group?.name || "ungrouped";
    const name = group?.name || "Specifications";

    if (!groups.has(key)) {
      groups.set(key, { id: key, name, items: [] });
    }
    groups.get(key).items.push(item);
  }

  return [...groups.values()];
};
