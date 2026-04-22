import axios from 'axios';

export const hermesApi = axios.create({
  baseURL: import.meta.env.VITE_API_HERMES_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-ID': import.meta.env.VITE_API_HERMES_ID,
    'X-TOKEN': import.meta.env.VITE_API_HERMES_TOKEN,
  },
});
