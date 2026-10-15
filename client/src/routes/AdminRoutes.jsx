import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "../components/admin/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Login from "../pages/admin/Login";
import ProtectedAdminRoute from "./ProtectedAdminRoute";
import Products from "../pages/admin/Products";
import ProductForm from "../pages/admin/ProductForm";
import ProductDetails from "../pages/admin/ProductDetails";
import Categories from "../components/admin/Categories";
import Brands from "../components/admin/Brands";
import Inventory from "../pages/admin/Inventory";
import Orders from "../pages/admin/orders/Orders";
import OrderDetails from "../pages/admin/orders/OrderDetails";
import Payments from "../pages/admin/payments/Payments";
import PaymentDetails from "../pages/admin/payments/PaymentDetails";
import FulfillmentDetails from "../pages/admin/FulfillmentDetails";
import Fulfillment from "../pages/admin/Fulfillment";
import Discounts from "../pages/admin/discounts/Discounts";
import DiscountForm from "../pages/admin/discounts/DiscountForm";
import DiscountDetails from "../pages/admin/discounts/DiscountDetails";

import Users from "../pages/admin/users/Users";
import UserForm from "../pages/admin/users/UserForm";
import UserDetails from "../pages/admin/users/UserDetails";

import Roles from "../pages/admin/roles/Roles";
import RoleForm from "../pages/admin/roles/RoleForm";
import RoleDetails from "../pages/admin/roles/RoleDetails";
import SettingForm from "../pages/admin/settings/SettingForm";
import Settings from "../pages/admin/settings/Settings";
import AuditLogs from "../pages/admin/audit-logs/AuditLogs";
import AuditLogDetails from "../pages/admin/audit-logs/AuditLogDetails";
import Customers from "../pages/admin/customers/Customers";
import CustomerDetails from "../pages/admin/customers/CustomerDetails";
import AffiliateReports from "../pages/admin/affiliate/AffiliateReports";
import AffiliateMarketplaces from "../pages/admin/affiliate/AffiliateMarketplaces";
import AffiliateMarketplaceForm from "../pages/admin/affiliate/AffiliateMarketplaceForm";
import AffiliateProducts from "../pages/admin/affiliate/AffiliateProducts";
import AffiliateProductForm from "../pages/admin/affiliate/AffiliateProductForm";

const AdminRoutes = () => {
    return (
        <Routes>
            {/* Public admin login */}
            <Route
                path="/admin/login"
                element={<Login />}
            />

            {/* Protected admin area */}
            <Route element={<ProtectedAdminRoute />}>
                <Route
                    path="/admin"
                    element={<AdminLayout />}
                >
                    <Route
                        index
                        element={<Dashboard />}
                    />

                    <Route
                        path="products"
                        element={<Products />}
                    />

                    <Route
                        path="products/new"
                        element={<ProductForm />}
                    />

                    <Route
                        path="products/:id"
                        element={<ProductDetails />}
                    />

                    <Route
                        path="/admin/categories"
                        element={<Categories />}
                    />

                    <Route
                        path="/admin/brands"
                        element={<Brands />}
                    />

                    <Route
                        path="/admin/inventory"
                        element={<Inventory />}
                    />

                    <Route
                        path="/admin/orders"
                        element={<Orders />}
                    />

                    <Route
                        path="/admin/orders/:id"
                        element={<OrderDetails />}
                    />

                    <Route
                        path="/admin/customers"
                        element={<Customers />}
                    />

                    <Route
                        path="/admin/customers/:id"
                        element={<CustomerDetails />}
                    />

                    <Route
                        path="/admin/discounts"
                        element={<Discounts />}
                    />

                    <Route
                        path="/admin/discounts/new"
                        element={<DiscountForm />}
                    />

                    <Route
                        path="/admin/discounts/:id"
                        element={<DiscountDetails />}
                    />

                    <Route
                        path="/admin/discounts/:id/edit"
                        element={<DiscountForm />}
                    />

                    <Route
                        path="/admin/payments"
                        element={<Payments />}
                    />

                    <Route
                        path="/admin/payments/:id"
                        element={<PaymentDetails />}
                    />

                    <Route
                        path="/admin/fulfillment"
                        element={<Fulfillment />}
                    />

                    <Route
                        path="/admin/fulfillment/:id"
                        element={<FulfillmentDetails />}
                    />

                    <Route path="/admin/affiliate" element={<Navigate to="/admin/affiliate/reports" replace />} />
                    <Route path="/admin/affiliate/reports" element={<AffiliateReports />} />

                    <Route path="/admin/affiliate/marketplaces" element={<AffiliateMarketplaces />} />
                    <Route path="/admin/affiliate/marketplaces/create" element={<AffiliateMarketplaceForm />} />
                    <Route path="/admin/affiliate/marketplaces/:id/edit" element={<AffiliateMarketplaceForm />} />

                    <Route path="/admin/affiliate/products" element={<AffiliateProducts />} />
                    <Route path="/admin/affiliate/products/create" element={<AffiliateProductForm />} />
                    <Route path="/admin/affiliate/products/:id/edit" element={<AffiliateProductForm />} />

                    <Route
                        path="/admin/audit-logs"
                        element={<AuditLogs />}
                    />

                    <Route
                        path="/admin/audit-logs/:id"
                        element={<AuditLogDetails />}
                    />
                    <Route
                        path="/admin/users"
                        element={<Users />}
                    />


                    <Route
                        path="/admin/users/new"
                        element={<UserForm />}
                    />

                    <Route
                        path="/admin/users/:id"
                        element={<UserDetails />}
                    />


                    <Route
                        path="/admin/users/:id/edit"
                        element={<UserForm />}
                    />

                    <Route
                        path="/admin/roles"
                        element={<Roles />}
                    />

                    <Route
                        path="/admin/roles/create"
                        element={<RoleForm />}
                    />

                    <Route
                        path="/admin/roles/:id"
                        element={<RoleDetails />}
                    />

                    <Route
                        path="/admin/roles/:id/edit"
                        element={<RoleForm />}
                    />

                    <Route
                        path="/admin/settings"
                        element={<Settings />}
                    />

                    <Route
                        path="/admin/settings/create"
                        element={<SettingForm />}
                    />

                    <Route
                        path="/admin/settings/:key/edit"
                        element={<SettingForm />}
                    />

                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/admin"
                                replace
                            />
                        }
                    />
                </Route>
            </Route>

            <Route
                path="*"
                element={
                    <Navigate
                        to="/admin"
                        replace
                    />
                }
            />
        </Routes>
    );
};

export default AdminRoutes;