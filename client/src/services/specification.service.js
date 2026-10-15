import api from "./api";

// Specification Groups

export const getSpecificationGroups = async () => {
  const response = await api.get(
    "/specification-groups"
  );

  return response.data;
};

export const getSpecificationGroup = async (groupId) => {
  const response = await api.get(
    `/specification-groups/${groupId}`
  );

  return response.data;
};

export const createSpecificationGroup = async (data) => {
  const response = await api.post(
    "/specification-groups",
    data
  );

  return response.data;
};

export const updateSpecificationGroup = async (
  groupId,
  data
) => {
  const response = await api.patch(
    `/specification-groups/${groupId}`,
    data
  );

  return response.data;
};

export const deleteSpecificationGroup = async (groupId) => {
  const response = await api.delete(
    `/specification-groups/${groupId}`
  );

  return response.data;
};


// Specifications

export const getSpecifications = async (groupId) => {
  const response = await api.get(
    `/specification-groups/${groupId}/specifications`
  );

  return response.data;
};

export const getSpecification = async (
  specificationId
) => {
  const response = await api.get(
    `/specifications/${specificationId}`
  );

  return response.data;
};

export const createSpecification = async (
  groupId,
  data
) => {
  const response = await api.post(
    `/specification-groups/${groupId}/specifications`,
    data
  );

  return response.data;
};

export const updateSpecification = async (
  specificationId,
  data
) => {
  const response = await api.patch(
    `/specifications/${specificationId}`,
    data
  );

  return response.data;
};

export const deleteSpecification = async (
  specificationId
) => {
  const response = await api.delete(
    `/specifications/${specificationId}`
  );

  return response.data;
};


// Product Specifications

export const getProductSpecifications = async (
  productId
) => {
  const response = await api.get(
    `/products/${productId}/specifications`
  );

  return response.data;
};

export const createProductSpecification = async (
  productId,
  data
) => {
  const response = await api.post(
    `/products/${productId}/specifications`,
    data
  );

  return response.data;
};

export const updateProductSpecification = async (
  productId,
  productSpecificationId,
  data
) => {
  const response = await api.patch(
    `/products/${productId}/specifications/${productSpecificationId}`,
    data
  );

  return response.data;
};

export const deleteProductSpecification = async (
  productId,
  productSpecificationId
) => {
  const response = await api.delete(
    `/products/${productId}/specifications/${productSpecificationId}`
  );

  return response.data;
};