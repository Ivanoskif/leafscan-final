from django.db import models

# Create your models here.

class Severity(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"


class PlantType(models.TextChoices):
    CROP = "CROP", "Crop"
    FRUIT = "FRUIT", "Fruit"
    VEGETABLE = "VEGETABLE", "Vegetable"
    HERB = "HERB", "Herb"
    FLOWER = "FLOWER", "Flower"
    TREE = "TREE", "Tree"
    ORNAMENTAL = "ORNAMENTAL", "Ornamental"
    OTHER = "OTHER", "Other"


class TreatmentType(models.TextChoices):
    CHEMICAL = "CHEMICAL", "Chemical"
    MECHANICAL = "MECHANICAL", "Mechanical"
    ORGANIC = "ORGANIC", "Organic"


class DiseaseCategory(models.TextChoices):
    FUNGAL = "FUNGAL", "Fungal"
    BACTERIAL = "BACTERIAL", "Bacterial"
    VIRAL = "VIRAL", "Viral"
    NUTRIENT_DEFICIENCY = "NUTRIENT_DEFICIENCY", "Nutrient Deficiency"
    PEST = "PEST", "Pest"
    OTHER = "OTHER", "Other"


class Plant(models.Model):
    name = models.CharField(max_length=100, unique=True)
    scientific_name = models.CharField(max_length=150, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    type = models.CharField(
        max_length=20,
        choices=PlantType.choices,
        blank=True,
        null=True
    )
    image = models.ImageField(
        upload_to="plants/",
        blank=True,
        null=True
    )
    growing_season = models.CharField(max_length=100, blank=True, null=True)
    growing_region = models.CharField(max_length=150, blank=True, null=True)

    class Meta:
        db_table = "plants"

    def __str__(self):
        return self.name


class Disease(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    symptoms = models.TextField(blank=True, null=True)
    image = models.ImageField(
        upload_to="diseases/",
        blank=True,
        null=True
    )
    image_description = models.TextField(blank=True, null=True)
    severity = models.CharField(
        max_length=10,
        choices=Severity.choices,
        blank=True,
        null=True
    )
    category = models.CharField(
        max_length=30,
        choices=DiseaseCategory.choices,
        blank=True,
        null=True
    )

    class Meta:
        db_table = "diseases"

    def __str__(self):
        return self.name


class PlantDisease(models.Model):
    plant = models.ForeignKey(
        Plant,
        on_delete=models.CASCADE,
        related_name="plant_diseases"
    )
    disease = models.ForeignKey(
        Disease,
        on_delete=models.CASCADE,
        related_name="plant_diseases"
    )

    class Meta:
        db_table = "plant_diseases"
        constraints = [
            models.UniqueConstraint(
                fields=["plant", "disease"],
                name="unique_plant_disease"
            )
        ]

    def __str__(self):
        return f"{self.plant.name} - {self.disease.name}"


class Treatment(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    type = models.CharField(
        max_length=20,
        choices=TreatmentType.choices
    )

    class Meta:
        db_table = "treatments"

    def __str__(self):
        return self.name


class DiseaseTreatment(models.Model):
    disease = models.ForeignKey(
        Disease,
        on_delete=models.CASCADE,
        related_name="disease_treatments"
    )
    treatment = models.ForeignKey(
        Treatment,
        on_delete=models.CASCADE,
        related_name="disease_treatments"
    )

    class Meta:
        db_table = "disease_treatments"
        constraints = [
            models.UniqueConstraint(
                fields=["disease", "treatment"],
                name="unique_disease_treatment"
            )
        ]

    def __str__(self):
        return f"{self.disease.name} - {self.treatment.name}"