from django.contrib import admin

from .models import Analysis

# Register your models here.

@admin.register(Analysis)
class AnalysisAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "analysis_key",
        "user",
        "plant",
        "disease",
        "confidence",
        "result_label",
        "created_at",
    ]

    search_fields = [
        "analysis_key",
        "user__full_name",
        "user__email",
        "plant__name",
        "disease__name",
    ]

    list_filter = [
        "result_label",
        "created_at",
        "plant",
        "disease",
    ]

    readonly_fields = [
        "created_at",
    ]

    ordering = [
        "-created_at",
    ]