namespace PortalCommon.Constants
{
    /// <summary>
    /// Common HTTP status codes used throughout the Portal API
    /// </summary>
    public static class ApiStatusCode
    {
        public const int Success = 200;
        public const int Created = 201;
        public const int NoContent = 204;
        public const int BadRequest = 400;
        public const int Unauthorized = 401;
        public const int Forbidden = 403;
        public const int NotFound = 404;
        public const int Conflict = 409;
        public const int InternalServerError = 500;
    }
}