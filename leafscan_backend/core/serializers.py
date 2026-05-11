from rest_framework import serializers

from .models import (
    Plant,
    Disease,
    PlantDisease,
    Treatment,
    DiseaseTreatment,
)


class DiseaseShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disease
        fields = [
            "id",
            "name",
            "severity",
            "category",
        ]


class PlantShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plant
        fields = [
            "id",
            "name",
            "scientific_name",
            "type",
            "image",
        ]


class TreatmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Treatment
        fields = [
            "id",
            "name",
            "description",
            "type",
        ]


class PlantSerializer(serializers.ModelSerializer):
    top_diseases = serializers.SerializerMethodField()

    class Meta:
        model = Plant
        fields = [
            "id",
            "name",
            "scientific_name",
            "description",
            "type",
            "image",
            "growing_season",
            "growing_region",
            "top_diseases",
        ]

    def get_top_diseases(self, obj):
        relations = PlantDisease.objects.filter(
            plant=obj
        ).select_related("disease")[:5]

        diseases = [relation.disease for relation in relations]
        return DiseaseShortSerializer(diseases, many=True).data


class DiseaseSerializer(serializers.ModelSerializer):
    top_plants = serializers.SerializerMethodField()
    treatments = serializers.SerializerMethodField()

    class Meta:
        model = Disease
        fields = [
            "id",
            "name",
            "description",
            "symptoms",
            "image",
            "image_description",
            "severity",
            "category",
            "top_plants",
            "treatments",
        ]

    def get_top_plants(self, obj):
        relations = PlantDisease.objects.filter(
            disease=obj
        ).select_related("plant")[:5]

        plants = [relation.plant for relation in relations]
        return PlantShortSerializer(plants, many=True).data

    def get_treatments(self, obj):
        relations = DiseaseTreatment.objects.filter(
            disease=obj
        ).select_related("treatment")

        treatments = [relation.treatment for relation in relations]
        return TreatmentSerializer(treatments, many=True).data


class PlantDiseaseSerializer(serializers.ModelSerializer):
    plant = PlantShortSerializer(read_only=True)
    disease = DiseaseShortSerializer(read_only=True)

    class Meta:
        model = PlantDisease
        fields = [
            "id",
            "plant",
            "disease",
        ]


class DiseaseTreatmentSerializer(serializers.ModelSerializer):
    disease = DiseaseShortSerializer(read_only=True)
    treatment = TreatmentSerializer(read_only=True)

    class Meta:
        model = DiseaseTreatment
        fields = [
            "id",
            "disease",
            "treatment",
        ]