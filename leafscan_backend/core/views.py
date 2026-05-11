from django.shortcuts import get_object_or_404
from django.db.models import Q

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Plant,
    Disease,
    PlantDisease,
    Treatment,
    DiseaseTreatment,
)
from .serializers import (
    PlantSerializer,
    DiseaseSerializer,
    DiseaseShortSerializer,
    PlantShortSerializer,
    TreatmentSerializer,
)

# Create your views here.

def is_admin_user(request):
    return (
        request.user.is_staff
        or request.user.is_superuser
        or getattr(request.user, "role", None) == "ADMIN"
    )


def admin_required_response():
    return Response(
        {"detail": "Admin permission required."},
        status=status.HTTP_403_FORBIDDEN
    )


# PLANTS

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def plants_collection(request):
    if request.method == "GET":
        plants = Plant.objects.all().order_by("name")

        search = request.query_params.get("search")
        plant_type = request.query_params.get("type")

        if search:
            plants = plants.filter(
                Q(name__icontains=search) |
                Q(scientific_name__icontains=search)
            )

        if plant_type:
            plants = plants.filter(type=plant_type)

        serializer = PlantSerializer(plants, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if request.method == "POST":
        if not is_admin_user(request):
            return admin_required_response()

        serializer = PlantSerializer(data=request.data)

        if serializer.is_valid():
            plant = serializer.save()
            return Response(
                {
                    "message": "Plant created successfully.",
                    "plant": PlantSerializer(plant).data,
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def plant_detail(request, id):
    plant = get_object_or_404(Plant, id=id)

    if request.method == "GET":
        serializer = PlantSerializer(plant)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if not is_admin_user(request):
        return admin_required_response()

    if request.method == "PUT":
        serializer = PlantSerializer(plant, data=request.data)

        if serializer.is_valid():
            plant = serializer.save()
            return Response(
                {
                    "message": "Plant updated successfully.",
                    "plant": PlantSerializer(plant).data,
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PATCH":
        serializer = PlantSerializer(plant, data=request.data, partial=True)

        if serializer.is_valid():
            plant = serializer.save()
            return Response(
                {
                    "message": "Plant updated successfully.",
                    "plant": PlantSerializer(plant).data,
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "DELETE":
        plant.delete()
        return Response(
            {"message": "Plant deleted successfully."},
            status=status.HTTP_200_OK
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def plant_top_diseases(request, id):
    plant = get_object_or_404(Plant, id=id)

    relations = PlantDisease.objects.filter(
        plant=plant
    ).select_related("disease")[:5]

    diseases = [relation.disease for relation in relations]
    serializer = DiseaseShortSerializer(diseases, many=True)

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_disease_to_plant(request, id):
    if not is_admin_user(request):
        return admin_required_response()

    plant = get_object_or_404(Plant, id=id)
    disease_id = request.data.get("disease_id")

    if not disease_id:
        return Response(
            {"disease_id": "This field is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    disease = get_object_or_404(Disease, id=disease_id)

    relation, created = PlantDisease.objects.get_or_create(
        plant=plant,
        disease=disease
    )

    return Response(
        {
            "message": "Disease added to plant successfully.",
            "created": created,
            "plant": plant.name,
            "disease": disease.name,
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_disease_from_plant(request, id, disease_id):
    if not is_admin_user(request):
        return admin_required_response()

    plant = get_object_or_404(Plant, id=id)
    disease = get_object_or_404(Disease, id=disease_id)

    relation = get_object_or_404(
        PlantDisease,
        plant=plant,
        disease=disease
    )

    relation.delete()

    return Response(
        {"message": "Disease removed from plant successfully."},
        status=status.HTTP_200_OK
    )


# DISEASES

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def diseases_collection(request):
    if request.method == "GET":
        diseases = Disease.objects.all().order_by("name")

        search = request.query_params.get("search")
        category = request.query_params.get("category")
        severity = request.query_params.get("severity")

        if search:
            diseases = diseases.filter(name__icontains=search)

        if category:
            diseases = diseases.filter(category=category)

        if severity:
            diseases = diseases.filter(severity=severity)

        serializer = DiseaseSerializer(diseases, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if request.method == "POST":
        if not is_admin_user(request):
            return admin_required_response()

        serializer = DiseaseSerializer(data=request.data)

        if serializer.is_valid():
            disease = serializer.save()
            return Response(
                {
                    "message": "Disease created successfully.",
                    "disease": DiseaseSerializer(disease).data,
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def disease_detail(request, id):
    disease = get_object_or_404(Disease, id=id)

    if request.method == "GET":
        serializer = DiseaseSerializer(disease)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if not is_admin_user(request):
        return admin_required_response()

    if request.method == "PUT":
        serializer = DiseaseSerializer(disease, data=request.data)

        if serializer.is_valid():
            disease = serializer.save()
            return Response(
                {
                    "message": "Disease updated successfully.",
                    "disease": DiseaseSerializer(disease).data,
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PATCH":
        serializer = DiseaseSerializer(disease, data=request.data, partial=True)

        if serializer.is_valid():
            disease = serializer.save()
            return Response(
                {
                    "message": "Disease updated successfully.",
                    "disease": DiseaseSerializer(disease).data,
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "DELETE":
        disease.delete()
        return Response(
            {"message": "Disease deleted successfully."},
            status=status.HTTP_200_OK
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def disease_top_plants(request, id):
    disease = get_object_or_404(Disease, id=id)

    relations = PlantDisease.objects.filter(
        disease=disease
    ).select_related("plant")[:5]

    plants = [relation.plant for relation in relations]
    serializer = PlantShortSerializer(plants, many=True)

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def disease_treatments(request, id):
    disease = get_object_or_404(Disease, id=id)

    treatment_ids = DiseaseTreatment.objects.filter(
        disease=disease
    ).values_list("treatment_id", flat=True)

    treatments = Treatment.objects.filter(id__in=treatment_ids)
    serializer = TreatmentSerializer(treatments, many=True)

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_plant_to_disease(request, id):
    if not is_admin_user(request):
        return admin_required_response()

    disease = get_object_or_404(Disease, id=id)
    plant_id = request.data.get("plant_id")

    if not plant_id:
        return Response(
            {"plant_id": "This field is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    plant = get_object_or_404(Plant, id=plant_id)

    relation, created = PlantDisease.objects.get_or_create(
        plant=plant,
        disease=disease
    )

    return Response(
        {
            "message": "Plant added to disease successfully.",
            "created": created,
            "plant": plant.name,
            "disease": disease.name,
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_plant_from_disease(request, id, plant_id):
    if not is_admin_user(request):
        return admin_required_response()

    disease = get_object_or_404(Disease, id=id)
    plant = get_object_or_404(Plant, id=plant_id)

    relation = get_object_or_404(
        PlantDisease,
        plant=plant,
        disease=disease
    )

    relation.delete()

    return Response(
        {"message": "Plant removed from disease successfully."},
        status=status.HTTP_200_OK
    )


# TREATMENTS

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def treatments_collection(request):
    if request.method == "GET":
        treatments = Treatment.objects.all().order_by("name")

        treatment_type = request.query_params.get("type")
        search = request.query_params.get("search")

        if treatment_type:
            treatments = treatments.filter(type=treatment_type)

        if search:
            treatments = treatments.filter(name__icontains=search)

        serializer = TreatmentSerializer(treatments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if request.method == "POST":
        if not is_admin_user(request):
            return admin_required_response()

        serializer = TreatmentSerializer(data=request.data)

        if serializer.is_valid():
            treatment = serializer.save()
            return Response(
                {
                    "message": "Treatment created successfully.",
                    "treatment": TreatmentSerializer(treatment).data,
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def treatment_detail(request, id):
    treatment = get_object_or_404(Treatment, id=id)

    if request.method == "GET":
        serializer = TreatmentSerializer(treatment)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if not is_admin_user(request):
        return admin_required_response()

    if request.method == "PUT":
        serializer = TreatmentSerializer(treatment, data=request.data)

        if serializer.is_valid():
            treatment = serializer.save()
            return Response(
                {
                    "message": "Treatment updated successfully.",
                    "treatment": TreatmentSerializer(treatment).data,
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PATCH":
        serializer = TreatmentSerializer(treatment, data=request.data, partial=True)

        if serializer.is_valid():
            treatment = serializer.save()
            return Response(
                {
                    "message": "Treatment updated successfully.",
                    "treatment": TreatmentSerializer(treatment).data,
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "DELETE":
        treatment.delete()
        return Response(
            {"message": "Treatment deleted successfully."},
            status=status.HTTP_200_OK
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_treatment_to_disease(request, id):
    if not is_admin_user(request):
        return admin_required_response()

    treatment = get_object_or_404(Treatment, id=id)
    disease_id = request.data.get("disease_id")

    if not disease_id:
        return Response(
            {"disease_id": "This field is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    disease = get_object_or_404(Disease, id=disease_id)

    relation, created = DiseaseTreatment.objects.get_or_create(
        disease=disease,
        treatment=treatment
    )

    return Response(
        {
            "message": "Treatment added to disease successfully.",
            "created": created,
            "disease": disease.name,
            "treatment": treatment.name,
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_treatment_from_disease(request, id, disease_id):
    if not is_admin_user(request):
        return admin_required_response()

    treatment = get_object_or_404(Treatment, id=id)
    disease = get_object_or_404(Disease, id=disease_id)

    relation = get_object_or_404(
        DiseaseTreatment,
        disease=disease,
        treatment=treatment
    )

    relation.delete()

    return Response(
        {"message": "Treatment removed from disease successfully."},
        status=status.HTTP_200_OK
    )