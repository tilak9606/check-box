class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad Request") {
    return new ApiError(400, message);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(412, message);
  }

  static conflict(message = "Conflict") {
    return new ApiError(409, message);
  }

  static notFound(message = "Not Found") {
    return new ApiError(404, message);
  }

  static internalServerError(message = "Internal server error") {
    return new ApiError(500, message);
  }
}

export default ApiError;
