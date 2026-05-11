from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User

# Register your models here.

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    list_display = [
        "id",
        "email",
        "username",
        "full_name",
        "role",
        "is_staff",
        "is_active",
        "created_at",
    ]

    list_filter = [
        "role",
        "is_staff",
        "is_active",
        "created_at",
    ]

    search_fields = [
        "email",
        "username",
        "full_name",
    ]

    ordering = [
        "-created_at",
    ]

    fieldsets = UserAdmin.fieldsets + (
        (
            "Additional Info",
            {
                "fields": (
                    "full_name",
                    "role",
                    "created_at",
                )
            },
        ),
    )

    readonly_fields = [
        "created_at",
    ]