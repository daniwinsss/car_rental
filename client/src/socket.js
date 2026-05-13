import { io } from "socket.io-client";

let socket = null;

const socketsEnabled = !import.meta.env.PROD;

export const initSocket = (token) => {
  if (!socketsEnabled) return null;
  if (!socket) {
    socket = io(import.meta.env.VITE_BASE_URL, {
      auth: { token },
    });
  }
  return socket;
};

export const getSocket = () => (socketsEnabled ? socket : null);
