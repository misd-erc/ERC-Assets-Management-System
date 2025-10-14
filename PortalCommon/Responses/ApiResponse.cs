using System;
using PortalCommon.Enums;

namespace PortalCommon.Responses
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }

        // ✅ Success responses
        public static ApiResponse<T> Ok(T? data, string message = "Success") =>
            new() { Success = true, Code = SuccessCodes.SUCCESS, Message = message, Data = data };

        public static ApiResponse<T> Created(T data, string message = "Created") =>
            new() { Success = true, Code = SuccessCodes.CREATED, Message = message, Data = data };

        public static ApiResponse<T> NoContent(string message = "No content") =>
            new() { Success = true, Code = SuccessCodes.NO_CONTENT, Message = message, Data = default };

        // ❌ Failure responses
        public static ApiResponse<T> Fail(string code, string message) =>
            new() { Success = false, Code = code, Message = message };

        public static ApiResponse<T> BadRequest(string message = "Bad request") =>
            new() { Success = false, Code = ErrorCodes.INVALID_INPUT, Message = message };

        public static ApiResponse<T> ValidationFailed(string message = "Validation failed") =>
            new() { Success = false, Code = ErrorCodes.VALIDATION_FAILED, Message = message };

        public static ApiResponse<T> Unauthorized(string message = "Unauthorized") =>
            new() { Success = false, Code = ErrorCodes.UNAUTHORIZED, Message = message };

        public static ApiResponse<T> Forbidden(string message = "Forbidden") =>
            new() { Success = false, Code = ErrorCodes.FORBIDDEN, Message = message };

        public static ApiResponse<T> NotFound(string message = "Not found") =>
            new() { Success = false, Code = ErrorCodes.NOT_FOUND, Message = message };

        public static ApiResponse<T> Conflict(string message = "Conflict") =>
            new() { Success = false, Code = ErrorCodes.ALREADY_EXISTS, Message = message };

        public static ApiResponse<T> ServerError(string message = "Internal server error") =>
            new() { Success = false, Code = ErrorCodes.SERVER_ERROR, Message = message };

        public static ApiResponse<T> OperationFailed(string message = "Operation failed") =>
            new() { Success = false, Code = ErrorCodes.OPERATION_FAILED, Message = message };

        public static ApiResponse<T> LimitExceeded(string message = "Limit exceeded") =>
            new() { Success = false, Code = ErrorCodes.LIMIT_EXCEEDED, Message = message };

        // ⚙️ Utility: allows building responses dynamically
        public static ApiResponse<T> Custom(bool success, string code, string message, T? data = default) =>
            new() { Success = success, Code = code, Message = message, Data = data };
    }
}
