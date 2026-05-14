from rest_framework import serializers

from core.models import DiseaseTreatment
from core.serializers import PlantShortSerializer, DiseaseSerializer, TreatmentSerializer

from .models import Analysis


class AnalysisListSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source="user.full_name", read_only=True)
    plant_name = serializers.CharField(source="plant.name", read_only=True)
    disease_name = serializers.CharField(source="disease.name", read_only=True)
    plant_id = serializers.IntegerField(source="plant.id", read_only=True)
    disease_id = serializers.IntegerField(source="disease.id", read_only=True)

    class Meta:
        model = Analysis
        fields = [
            "id",
            "analysis_key",
            "image",
            "user_full_name",
            "plant_name",
            "disease_name",
            "plant_id",
            "disease_id",
            "confidence",
            "result_label",
            "created_at",
        ]


class AnalysisDetailSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source="user.full_name", read_only=True)
    plant = PlantShortSerializer(read_only=True)
    disease = DiseaseSerializer(read_only=True)
    treatments = serializers.SerializerMethodField()

    class Meta:
        model = Analysis
        fields = [
            "id",
            "analysis_key",
            "image",
            "user_full_name",
            "plant",
            "disease",
            "confidence",
            "result_label",
            "created_at",
            "treatments",
        ]

    def get_treatments(self, obj):
        if not obj.disease:
            return []

        relations = DiseaseTreatment.objects.filter(
            disease=obj.disease
        ).select_related("treatment")

        treatments = [relation.treatment for relation in relations]
        return TreatmentSerializer(treatments, many=True).data