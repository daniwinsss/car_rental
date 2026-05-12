import { errorResponse } from "../utils/response.js";

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  const error = err.details || err.error || null;

  return errorResponse(res, { message, error, status });
};

export default errorHandler;
