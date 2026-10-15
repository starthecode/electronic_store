import {
  Home,
  Loader2,
  MapPin,
} from "lucide-react";

const CustomerAddresses = ({
  addresses,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400">
        <Loader2
          size={20}
          className="animate-spin"
        />
      </div>
    );
  }

  if (!addresses.length) {
    return (
      <div className="py-10 text-center">
        <MapPin
          size={28}
          className="mx-auto text-gray-300"
        />

        <p className="mt-2 text-sm font-medium text-gray-600">
          No addresses found
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {addresses.map((address) => (
        <div
          key={address.id}
          className="rounded-xl border border-gray-200 p-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <Home size={17} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {address.fullName ||
                  address.name ||
                  "Address"}
              </p>

              <div className="mt-2 space-y-1 text-sm leading-6 text-gray-500">
                {address.addressLine1 && (
                  <p>{address.addressLine1}</p>
                )}

                {address.addressLine2 && (
                  <p>{address.addressLine2}</p>
                )}

                <p>
                  {[
                    address.city,
                    address.state,
                    address.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>

                {address.country && (
                  <p>{address.country}</p>
                )}

                {address.phone && (
                  <p>{address.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomerAddresses;