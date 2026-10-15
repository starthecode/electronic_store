import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true,
});

export const getPermissions = async () => {
  const response = await api.get(
    "/permissions"
  );

  return response.data;
};

export const getRolePermissions = async (
  roleId
) => {
  const response = await api.get(
    `/permissions/roles/${encodeURIComponent(
      roleId
    )}`
  );

  return response.data;
};

export const assignRolePermissions = async (
  roleId,
  permissionIds
) => {
  const response = await api.post(
    `/permissions/roles/${encodeURIComponent(
      roleId
    )}`,
    {
      permissionIds,
    }
  );

  return response.data;
};

export const removeRolePermission = async (
  roleId,
  permissionId
) => {
  const response = await api.delete(
    `/permissions/roles/${encodeURIComponent(
      roleId
    )}/${encodeURIComponent(permissionId)}`
  );

  return response.data;
};