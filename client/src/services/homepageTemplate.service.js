import api from "./api";

const unwrap = (response) => response.data?.data ?? response.data;

export const getHomepageSlides = async () =>
  unwrap(await api.get("/homepage/slides"));

export const createHomepageSlide = async (payload) =>
  unwrap(await api.post("/homepage/slides", payload));

export const updateHomepageSlide = async (id, payload) =>
  unwrap(await api.patch(`/homepage/slides/${encodeURIComponent(id)}`, payload));

export const deleteHomepageSlide = async (id) =>
  unwrap(await api.delete(`/homepage/slides/${encodeURIComponent(id)}`));

export const reorderHomepageSlides = async (ids) =>
  unwrap(await api.patch("/homepage/slides/reorder", { ids }));

export const getHomepageTestimonials = async () =>
  unwrap(await api.get("/homepage/testimonials"));

export const createHomepageTestimonial = async (payload) =>
  unwrap(await api.post("/homepage/testimonials", payload));

export const updateHomepageTestimonial = async (id, payload) =>
  unwrap(await api.patch(`/homepage/testimonials/${encodeURIComponent(id)}`, payload));

export const deleteHomepageTestimonial = async (id) =>
  unwrap(await api.delete(`/homepage/testimonials/${encodeURIComponent(id)}`));

export const reorderHomepageTestimonials = async (ids) =>
  unwrap(await api.patch("/homepage/testimonials/reorder", { ids }));
