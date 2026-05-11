from django.contrib import admin

from .models import (
    Plant,
    Disease,
    PlantDisease,
    Treatment,
    DiseaseTreatment,
)

# Register your models here.

@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
        "scientific_name",
        "type",
        "growing_season",
        "growing_region",
    ]
    search_fields = [
        "name",
        "scientific_name",
    ]
    list_filter = [
        "type",
    ]


@admin.register(Disease)
class DiseaseAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
        "severity",
        "category",
    ]
    search_fields = [
        "name",
    ]
    list_filter = [
        "severity",
        "category",
    ]


@admin.register(PlantDisease)
class PlantDiseaseAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "plant",
        "disease",
    ]
    search_fields = [
        "plant__name",
        "disease__name",
    ]


@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
        "type",
    ]
    search_fields = [
        "name",
    ]
    list_filter = [
        "type",
    ]


@admin.register(DiseaseTreatment)
class DiseaseTreatmentAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "disease",
        "treatment",
    ]
    search_fields = [
        "disease__name",
        "treatment__name",
    ]