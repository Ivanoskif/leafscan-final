"""
Minimal CORS middleware за development.

Backend нема `django-cors-headers` инсталиран, па за да работи frontend (CRA на :3000)
со backend (Django на :8000), мора рачно да поставиме CORS headers.

За production треба да се замени со django-cors-headers со ограничен allow-list.
"""

from django.http import HttpResponse


class SimpleCorsMiddleware:
    """Дозволи cross-origin барања од development frontend (CRA на :3000)."""

    ALLOWED_HEADERS = (
        "authorization, content-type, accept, origin, x-requested-with, "
        "x-csrftoken, x-requested-by"
    )
    ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    MAX_AGE = "86400"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            # Preflight — врати празен 200 со CORS headers.
            response = HttpResponse(status=200)
        else:
            response = self.get_response(request)

        origin = request.META.get("HTTP_ORIGIN")
        if origin:
            response["Access-Control-Allow-Origin"] = origin
            response["Vary"] = "Origin"
        else:
            response["Access-Control-Allow-Origin"] = "*"

        response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Allow-Methods"]     = self.ALLOWED_METHODS
        response["Access-Control-Allow-Headers"]     = self.ALLOWED_HEADERS
        response["Access-Control-Max-Age"]           = self.MAX_AGE

        return response
