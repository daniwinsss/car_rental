const validate = (schema, source = "body") => (req, res, next) => {
  try {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const error = result.error.flatten();
      const err = new Error("Validation failed");
      err.status = 400;
      err.details = error;
      throw err;
    }
    req[source] = result.data;
    return next();
  } catch (err) {
    return next(err);
  }
};

export default validate;
