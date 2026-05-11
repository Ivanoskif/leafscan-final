from django.urls import path

from . import views

urlpatterns = [
    # Plants
    path("plants/", views.plants_collection, name="plants_collection"),
    path("plants/<int:id>/", views.plant_detail, name="plant_detail"),
    path("plants/<int:id>/top-diseases/", views.plant_top_diseases, name="plant_top_diseases"),
    path("plants/<int:id>/diseases/", views.add_disease_to_plant, name="add_disease_to_plant"),
    path("plants/<int:id>/diseases/<int:disease_id>/", views.remove_disease_from_plant, name="remove_disease_from_plant"),

    # Diseases
    path("diseases/", views.diseases_collection, name="diseases_collection"),
    path("diseases/<int:id>/", views.disease_detail, name="disease_detail"),
    path("diseases/<int:id>/top-plants/", views.disease_top_plants, name="disease_top_plants"),
    path("diseases/<int:id>/treatments/", views.disease_treatments, name="disease_treatments"),
    path("diseases/<int:id>/plants/", views.add_plant_to_disease, name="add_plant_to_disease"),
    path("diseases/<int:id>/plants/<int:plant_id>/", views.remove_plant_from_disease, name="remove_plant_from_disease"),

    # Treatments
    path("treatments/", views.treatments_collection, name="treatments_collection"),
    path("treatments/<int:id>/", views.treatment_detail, name="treatment_detail"),
    path("treatments/<int:id>/diseases/", views.add_treatment_to_disease, name="add_treatment_to_disease"),
    path("treatments/<int:id>/diseases/<int:disease_id>/", views.remove_treatment_from_disease, name="remove_treatment_from_disease"),
]