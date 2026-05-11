from django.conf import settings
from django.db import models

from core.models import Plant, Disease

# Create your models here.


class AnalysisResult(models.TextChoices):
    HEALTHY = "HEALTHY", "Healthy"
    INFECTED = "INFECTED", "Infected"


class Analysis(models.Model):
    analysis_key = models.CharField(max_length=20, unique=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="analyses"
    )

    plant = models.ForeignKey(
        Plant,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="analyses"
    )

    disease = models.ForeignKey(
        Disease,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="analyses"
    )

    image = models.ImageField(upload_to="analyses/")

    confidence = models.FloatField(blank=True, null=True)

    result_label = models.CharField(
        max_length=20,
        choices=AnalysisResult.choices
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "analyses"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(confidence__isnull=True) |
                          models.Q(confidence__gte=0, confidence__lte=1),
                name="confidence_between_0_and_1"
            )
        ]

    def __str__(self):
        return self.analysis_key