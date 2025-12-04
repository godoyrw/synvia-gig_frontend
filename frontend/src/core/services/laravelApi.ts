import axios from 'axios';

const baseURL = import.meta.env.VITE_LARAVEL_API_BASE_URL;

export const laravelApi = axios.create({
  baseURL,
  withCredentials: false,
});
