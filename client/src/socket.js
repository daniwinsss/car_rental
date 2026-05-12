import { io } from "socket.io-client";

let socket = null;

export const initSocket = (token) => {
  if (!socket) {
    socket = io(import.meta.env.VITE_BASE_URL, {
      auth: { token },
    });
  }
  return socket;
};

export const getSocket = () => socket;
