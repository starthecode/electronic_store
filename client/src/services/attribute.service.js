import api from "./api";

export const getAttributes = async (
  params = {}
) => {
  const response = await api.get(
    "/attributes",
    {
      params,
    }
  );

  return response.data;
};

