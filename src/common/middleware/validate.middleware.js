import ApiError from "../utils/api-error.js";

const validate = (DtoClass) => {
  return (req, res, next) => {
    try {
      const { errors, value } = DtoClass.validate(req.body);
      if (errors) {
        throw ApiError.badRequest(errors.join("; "));
      }
      req.body = value;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;
