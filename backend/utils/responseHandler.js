export const response = (res, statusCode, message, data=null)=>{

    if(!res){
        console.log('Response object is null');
        return;
    }

    const responseObject = {
        status: statusCode < 400 ? 'success' : 'error',
        message,
        data
    }

    return res.status(statusCode).json(responseObject);
}


export class ApiResponse {
  constructor(success, message, data = null, code = null) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }

  static success(message, data = null, code = 'SUCCESS') {
    return new ApiResponse(true, message, data, code);
  }

  static error(message, code = 'ERROR', data = null) {
    return new ApiResponse(false, message, data, code);
  }
}

export const sendResponse = (res, statusCode, apiResponse) => {
  return res.status(statusCode).json(apiResponse);
};

// Convenience methods
export const successResponse = (res, message, data = null, statusCode = 200) => {
  return sendResponse(res, statusCode, ApiResponse.success(message, data));
};

export const errorResponse = (res, message, statusCode = 500, code = 'ERROR', data = null) => {
  return sendResponse(res, statusCode, ApiResponse.error(message, code, data));
};

export const validationErrorResponse = (res, errors) => {
  return sendResponse(res, 400, ApiResponse.error(
    'Validation failed',
    'VALIDATION_ERROR',
    { errors }
  ));
};