export const loadInventorySnapshot = async (
  getInventoryList,
  getInventorySummary,
  params
) => {
  const [list, summary] = await Promise.all([
    getInventoryList(params),
    getInventorySummary(),
  ]);

  return {
    inventories: list?.inventories ?? [],
    pagination: list?.pagination,
    summary: {
      totalStock: summary?.totalStock ?? 0,
      totalReserved: summary?.totalReserved ?? 0,
      totalAvailable: summary?.totalAvailable ?? 0,
      lowStockProducts: summary?.lowStockProducts ?? 0,
    },
  };
};
