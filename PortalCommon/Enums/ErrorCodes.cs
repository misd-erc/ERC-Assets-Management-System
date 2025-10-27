using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Enums
{
    public static class ErrorCodes
    {
        // General Errors
        public const string UNKNOWN_ERROR = "ERR_UNKNOWN";
        public const string VALIDATION_FAILED = "ERR_VALIDATION";
        public const string INVALID_INPUT = "ERR_INVALID_INPUT";
        public const string DATABASE_ERROR = "ERR_DATABASE";
        public const string CONCURRENCY_ERROR = "ERR_CONCURRENCY";
        public const string SERVER_ERROR = "ERR_SERVER";
        public const string UPLOAD_FAILED = "ERR_UPLOAD";

        // Authentication & Authorization
        public const string UNAUTHORIZED = "ERR_UNAUTHORIZED";
        public const string FORBIDDEN = "ERR_FORBIDDEN";
        public const string TOKEN_EXPIRED = "ERR_TOKEN_EXPIRED";
        public const string INVALID_CREDENTIALS = "ERR_INVALID_CREDENTIALS";

        // Entity Errors
        public const string NOT_FOUND = "ERR_NOT_FOUND";
        public const string ALREADY_EXISTS = "ERR_ALREADY_EXISTS";
        public const string REFERENCE_CONFLICT = "ERR_REFERENCE_CONFLICT";

        // Business Logic Errors
        public const string OPERATION_FAILED = "ERR_OPERATION_FAILED";
        public const string LIMIT_EXCEEDED = "ERR_LIMIT_EXCEEDED";
        public const string DUPLICATE_ENTRY = "ERR_DUPLICATE_ENTRY";
        public const string REQUIRED_FIELD_MISSING = "ERR_REQUIRED_FIELD_MISSING";

        // External / Integration Errors
        public const string SERVICE_UNAVAILABLE = "ERR_SERVICE_UNAVAILABLE";
        public const string NETWORK_FAILURE = "ERR_NETWORK_FAILURE";
    }
}