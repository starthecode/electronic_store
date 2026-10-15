import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShoppingCart,
  User,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { Link, useParams } from "react-router-dom";

import CustomerStatusBadge from "../../../components/customers/CustomerStatusBadge";
import CustomerOrders from "../../../components/customers/CustomerOrders";
import CustomerAddresses from "../../../components/customers/CustomerAddresses";

import {
  getCustomer,
  getCustomerAddresses,
  getCustomerOrders,
  updateCustomerStatus,
} from "../../../services/customer.service";

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
};

const getName = (customer) =>
  [
    customer?.firstName,
    customer?.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "Unnamed Customer";

const CustomerDetails = () => {
  const { id } = useParams();

  const [customer, setCustomer] =
    useState(null);

  const [orders, setOrders] =
    useState([]);

  const [addresses, setAddresses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [ordersLoading, setOrdersLoading] =
    useState(true);

  const [addressesLoading, setAddressesLoading] =
    useState(true);

  const [savingStatus, setSavingStatus] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getCustomer(id);

      setCustomer(
        response?.data || null
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to load customer."
      );
    } finally {
      setLoading(false);
    }

    try {
      setOrdersLoading(true);

      const response =
        await getCustomerOrders(id, {
          page: 1,
          limit: 20,
        });

      setOrders(
        response?.data?.orders || []
      );
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }

    try {
      setAddressesLoading(true);

      const response =
        await getCustomerAddresses(id);

      setAddresses(
        response?.data || []
      );
    } catch {
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const handleStatusChange = async (
    event
  ) => {
    const newStatus =
      event.target.value;

    if (
      !customer ||
      newStatus === customer.status
    ) {
      return;
    }

    try {
      setSavingStatus(true);

      const response =
        await updateCustomerStatus(
          customer.id,
          newStatus
        );

      setCustomer(
        response?.data || {
          ...customer,
          status: newStatus,
        }
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to update customer status."
      );
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />

          <div className="mt-6 h-72 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="mx-auto max-w-[1200px]">
          <Link
            to="/admin/customers"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to Customers
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
            {error || "Customer not found."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="mx-auto max-w-[1200px]">
        {/* Back */}
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Customers
        </Link>

        {/* Header */}
        <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 text-sm text-gray-400">
              Customer
            </div>

            <h1 className="text-2xl font-semibold text-gray-900">
              {getName(customer)}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Customer account details and activity.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Customer profile */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-b border-gray-100 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-semibold text-gray-600">
                {(
                  customer.firstName?.[0] ||
                  "C"
                ).toUpperCase()}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {getName(customer)}
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  {customer.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CustomerStatusBadge
                status={customer.status}
              />

              <select
                value={customer.status}
                onChange={
                  handleStatusChange
                }
                disabled={savingStatus}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 disabled:opacity-50"
              >
                <option value="ACTIVE">
                  Active
                </option>
                <option value="INACTIVE">
                  Inactive
                </option>
                <option value="SUSPENDED">
                  Suspended
                </option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2">
            <div className="border-b border-gray-100 p-6 md:border-r">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-gray-400">
                Contact Information
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail
                    size={17}
                    className="text-gray-400"
                  />

                  <div>
                    <p className="text-xs text-gray-400">
                      Email
                    </p>

                    <p className="text-sm text-gray-800">
                      {customer.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone
                    size={17}
                    className="text-gray-400"
                  />

                  <div>
                    <p className="text-xs text-gray-400">
                      Phone
                    </p>

                    <p className="text-sm text-gray-800">
                      {customer.phone ||
                        "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-100 p-6">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-gray-400">
                Account Information
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CalendarDays
                    size={17}
                    className="text-gray-400"
                  />

                  <div>
                    <p className="text-xs text-gray-400">
                      Joined
                    </p>

                    <p className="text-sm text-gray-800">
                      {formatDate(
                        customer.createdAt
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User
                    size={17}
                    className="text-gray-400"
                  />

                  <div>
                    <p className="text-xs text-gray-400">
                      Account Type
                    </p>

                    <p className="text-sm text-gray-800">
                      Customer
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Orders
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {customer._count?.orders ??
                0}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Addresses
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {customer._count?.addresses ??
                0}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Discount Uses
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {customer._count
                ?.discountUses ?? 0}
            </p>
          </div>
        </div>

        {/* Orders */}
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <div>
              <h2 className="font-semibold text-gray-900">
                Order History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Orders placed by this customer.
              </p>
            </div>

            <ShoppingCart
              size={19}
              className="text-gray-400"
            />
          </div>

          <div className="p-4">
            <CustomerOrders
              orders={orders}
              loading={ordersLoading}
            />
          </div>
        </section>

        {/* Addresses */}
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <div>
              <h2 className="font-semibold text-gray-900">
                Addresses
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Saved addresses for this customer.
              </p>
            </div>

            <MapPin
              size={19}
              className="text-gray-400"
            />
          </div>

          <div className="p-6">
            <CustomerAddresses
              addresses={addresses}
              loading={
                addressesLoading
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default CustomerDetails;