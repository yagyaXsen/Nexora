from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status

class NexoraException(Exception):
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[List[Dict[str, Any]]] = None,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or []
        super().__init__(message)

class NotFoundException(NexoraException):
    def __init__(self, resource: str, resource_id: Any):
        super().__init__(
            message=f"{resource} with identifier '{resource_id}' was not found.",
            code="RESOURCE_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
        )

class UnauthorizedException(NexoraException):
    def __init__(self, message: str = "Invalid authentication credentials"):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

class ForbiddenException(NexoraException):
    def __init__(self, message: str = "Insufficient permissions to perform this action"):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN,
        )

class ValidationException(NexoraException):
    def __init__(self, message: str, details: Optional[List[Dict[str, Any]]] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )
