import {
    ArrowLeft,
    Eye,
    EyeOff,
    Loader2,
    Save,
} from "lucide-react";

import { useEffect, useState } from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    createAdminUser,
    getAdminUser,
    updateAdminUser,
} from "../../../services/adminUser.service";

import {
    getRoles,
} from "../../../services/role.service";

export default function UserForm() {
    const navigate = useNavigate();
    const { id } = useParams();

    const isEdit = Boolean(id);

    const [roles, setRoles] =
        useState([]);

    const [loading, setLoading] =
        useState(isEdit);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        roleId: "",
        status: "ACTIVE",
    });

    useEffect(() => {
        load();
    }, [id]);

    const load = async () => {
        try {
            setLoading(true);
            setError("");

            const rolesResponse = await getRoles();

            const availableRoles =
                rolesResponse.data || [];

            setRoles(availableRoles);

            if (isEdit) {
                const response =
                    await getAdminUser(id);

                if (!response.success) {
                    throw new Error(
                        response.message
                    );
                }

                const user = response.data;

                const currentRole =
                    user.role ||
                    null;

                // If the current role is a protected
                // system role, add it to the local
                // dropdown so it can still be displayed.
                let roleOptions = [
                    ...availableRoles,
                ];

                if (
                    currentRole &&
                    !roleOptions.some(
                        (role) =>
                            role.id === currentRole.id
                    )
                ) {
                    roleOptions = [
                        currentRole,
                        ...roleOptions,
                    ];
                }

                setRoles(roleOptions);

                setForm({
                    firstName:
                        user.firstName || "",
                    lastName:
                        user.lastName || "",
                    email:
                        user.email || "",
                    phone:
                        user.phone || "",
                    password: "",
                    roleId:
                        user.roleId ||
                        currentRole?.id ||
                        "",
                    status:
                        user.status || "ACTIVE",
                });
            } else if (
                availableRoles.length
            ) {
                setForm((current) => ({
                    ...current,
                    roleId:
                        availableRoles[0].id,
                }));
            }
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to load user"
            );
        } finally {
            setLoading(false);
        }
    };

    const updateField = (
        field,
        value
    ) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            if (!form.roleId) {
                throw new Error(
                    "Please select a role."
                );
            }

            if (!isEdit && !form.password) {
                throw new Error(
                    "Password is required."
                );
            }

            let response;

            if (isEdit) {
                const payload = {
                    firstName:
                        form.firstName,
                    lastName:
                        form.lastName || null,
                    email:
                        form.email,
                    phone:
                        form.phone || null,
                };

                if (form.password) {
                    payload.password =
                        form.password;
                }

                response =
                    await updateAdminUser(
                        id,
                        payload
                    );
            } else {
                response =
                    await createAdminUser(
                        form
                    );
            }

            if (!response.success) {
                throw new Error(
                    response.message ||
                    "Failed to save user"
                );
            }

            navigate(
                isEdit
                    ? `/admin/users/${id}`
                    : `/admin/users/${response.data.id}`,
                {
                    state: {
                        message: isEdit
                            ? "User updated successfully."
                            : "User created successfully.",
                    },
                }
            );
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to save user"
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2
                    className="animate-spin text-gray-400"
                    size={24}
                />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <button
                type="button"
                onClick={() =>
                    navigate("/admin/users")
                }
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
            >
                <ArrowLeft size={16} />
                Back to Users
            </button>

            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    {isEdit
                        ? "Edit User"
                        : "Create User"}
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    {isEdit
                        ? "Update administrator account information."
                        : "Create a new administrator account."}
                </p>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
                <div className="space-y-7 p-6">
                    <Section
                        title="Personal Information"
                    >
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                                label="First Name"
                                required
                            >
                                <input
                                    value={form.firstName}
                                    onChange={(e) =>
                                        updateField(
                                            "firstName",
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="input"
                                />
                            </Field>

                            <Field label="Last Name">
                                <input
                                    value={form.lastName}
                                    onChange={(e) =>
                                        updateField(
                                            "lastName",
                                            e.target.value
                                        )
                                    }
                                    className="input"
                                />
                            </Field>

                            <Field
                                label="Email"
                                required
                            >
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        updateField(
                                            "email",
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="input"
                                />
                            </Field>

                            <Field label="Phone">
                                <input
                                    value={form.phone}
                                    onChange={(e) =>
                                        updateField(
                                            "phone",
                                            e.target.value
                                        )
                                    }
                                    className="input"
                                />
                            </Field>
                        </div>
                    </Section>

                    <Section title="Access">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                                label="Role"
                                required
                            >
                                <select
                                    value={form.roleId}
                                    onChange={(e) =>
                                        updateField(
                                            "roleId",
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        isEdit &&
                                        (
                                            roles.find(
                                                (role) =>
                                                    role.id === form.roleId
                                            )?.name === "SUPER_ADMIN" ||
                                            roles.find(
                                                (role) =>
                                                    role.id === form.roleId
                                            )?.name === "CUSTOMER"
                                        )
                                    }
                                    required
                                    className="input disabled:bg-gray-100 disabled:text-gray-500"
                                >
                                    <option value="">
                                        Select role
                                    </option>

                                    {roles.map((role) => (
                                        <option
                                            key={role.id}
                                            value={role.id}
                                        >
                                            {formatRoleName(role.name)}
                                        </option>
                                    ))}
                                </select>
                                {isEdit && (
                                    <p className="mt-2 text-xs text-gray-400">
                                        System roles such as SUPER_ADMIN and
                                        CUSTOMER cannot be changed.
                                    </p>
                                )}
                            </Field>

                            <Field label="Status">
                                <select
                                    value={form.status}
                                    onChange={(e) =>
                                        updateField(
                                            "status",
                                            e.target.value
                                        )
                                    }
                                    disabled={isEdit}
                                    className="input disabled:bg-gray-100"
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

                                {isEdit && (
                                    <p className="mt-2 text-xs text-gray-400">
                                        Change status from the user details page.
                                    </p>
                                )}
                            </Field>
                        </div>
                    </Section>

                    <Section
                        title={
                            isEdit
                                ? "Change Password"
                                : "Password"
                        }
                    >
                        <Field
                            label={
                                isEdit
                                    ? "New Password"
                                    : "Password"
                            }
                            required={!isEdit}
                        >
                            <div className="relative">
                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={form.password}
                                    onChange={(e) =>
                                        updateField(
                                            "password",
                                            e.target.value
                                        )
                                    }
                                    minLength={8}
                                    required={!isEdit}
                                    placeholder={
                                        isEdit
                                            ? "Leave blank to keep current password"
                                            : "Minimum 8 characters"
                                    }
                                    className="input pr-11"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            (value) =>
                                                !value
                                        )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showPassword ? (
                                        <EyeOff size={17} />
                                    ) : (
                                        <Eye size={17} />
                                    )}
                                </button>
                            </div>
                        </Field>
                    </Section>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
                    <button
                        type="button"
                        onClick={() =>
                            navigate("/admin/users")
                        }
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2
                                size={16}
                                className="animate-spin"
                            />
                        ) : (
                            <Save size={16} />
                        )}

                        {isEdit
                            ? "Save Changes"
                            : "Create User"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Section({
    title,
    children,
}) {
    return (
        <section>
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
                {title}
            </h2>

            {children}
        </section>
    );
}

function Field({
    label,
    required,
    children,
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
                {label}
                {required && (
                    <span className="ml-1 text-red-500">
                        *
                    </span>
                )}
            </span>

            {children}
        </label>
    );
}

function formatRoleName(name = "") {
    return name
        .toLowerCase()
        .split("_")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
}