using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PortalCommon.Enums;

namespace PortalCommon.Responses
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }

        public static ApiResponse<T> Ok(T? data, string message = "Success") =>
            new() { Success = true, Code = SuccessCodes.SUCCESS, Message = message, Data = data };

        public static ApiResponse<T> Created(T data, string message = "Created") =>
            new() { Success = true, Code = SuccessCodes.CREATED, Message = message, Data = data };

        public static ApiResponse<T> Fail(string code, string message) =>
            new() { Success = false, Code = code, Message = message };
    }
}
