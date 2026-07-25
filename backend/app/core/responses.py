from typing import Any, Dict, Optional
from fastapi.responses import JSONResponse

def success_response(
    data: Any = None,
    meta: Optional[Dict[str, Any]] = None,
    status_code: int = 200,
) -> JSONResponse:
    content = {
        "success": True,
        "data": data,
        "meta": meta or {},
        "error": None,
    }
    return JSONResponse(content=content, status_code=status_code)

def error_response(
    code: str,
    message: str,
    status_code: int = 400,
    details: Optional[Any] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> JSONResponse:
    content = {
        "success": False,
        "data": None,
        "meta": meta or {},
        "error": {
            "code": code,
            "message": message,
            "details": details or [],
        },
    }
    return JSONResponse(content=content, status_code=status_code)
