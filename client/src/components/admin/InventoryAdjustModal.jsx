import React, { useState } from "react";
import { X, PackagePlus, Loader2 } from "lucide-react";
import { adjustInventory } from "../../services/inventory.service";

const InventoryAdjustModal = ({ inventory, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState("ADJUSTMENT");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity === 0) {
      return;
    }

    try {
      setLoading(true);

      await adjustInventory(
        inventory.variant.product.id,
        inventory.variant.id,
        {
          quantity: parsedQuantity,
          type,
          reference: reference.trim() || undefined,
          note: note.trim() || undefined,
        }
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Adjust Inventory
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {inventory.variant.product.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 ui-btn-outline"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Current Stock</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {inventory.quantity}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Reserved</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {inventory.reservedQuantity}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Available</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {inventory.availableQuantity}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Transaction Type
            </label>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
            >
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="PURCHASE">Purchase</option>
              <option value="RETURN">Return</option>
              <option value="DAMAGE">Damage</option>
              <option value="CORRECTION">Correction</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Quantity
            </label>

            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Example: 10 or -5"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
            />

            <p className="mt-1 text-xs text-gray-500">
              Use a positive number to add stock and a negative number to
              remove stock.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Reference
            </label>

            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PO-1001"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Note
            </label>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Add a note..."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border px-4 py-2.5 text-sm font-medium ui-btn-outline"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ui-btn-primary"
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <PackagePlus size={17} />
              )}

              {loading ? "Updating..." : "Adjust Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryAdjustModal;