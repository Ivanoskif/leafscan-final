import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'leafscan.settings')
django.setup()

from core.models import Plant, Disease, PlantDisease

# Болести со точните имиња кои AI моделот ги враќа
MISSING = [
    # Corn
    {"name": "Gray Leaf Spot",        "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Corn",    "description": "Fungal disease causing rectangular gray lesions on corn leaves.", "symptoms": "Rectangular gray lesions with dark brown borders on leaves."},
    # Apple
    {"name": "Leaf Rust",             "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Apple",   "description": "Fungal disease causing rust-colored spots on apple leaves.", "symptoms": "Bright orange-yellow spots on upper leaf surfaces."},
    {"name": "Black Rot",             "category": "FUNGAL",    "severity": "HIGH",   "plant": "Apple",   "description": "Fungal disease causing fruit rot and leaf spots on apple.", "symptoms": "Circular lesions with purple margins on leaves, rotting fruit."},
    {"name": "Scab",                  "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Apple",   "description": "Common fungal disease causing scabby lesions on apple.", "symptoms": "Olive-green to black scabby lesions on leaves and fruits."},
    # Grape
    {"name": "Black Measles",         "category": "FUNGAL",    "severity": "HIGH",   "plant": "Grape",   "description": "Complex fungal disease affecting grapevine.", "symptoms": "Tiger-stripe patterns on leaves, dark berry spotting."},
    {"name": "Isariopsis Leaf Spot",  "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Grape",   "description": "Fungal disease causing leaf spots on grape.", "symptoms": "Irregular brown lesions on leaves."},
    # Tomato
    {"name": "Bacterial Spot",        "category": "BACTERIAL", "severity": "MEDIUM", "plant": "Tomato",  "description": "Bacterial disease causing spots on tomato leaves.", "symptoms": "Small dark water-soaked spots on leaves and fruits."},
    {"name": "Early Blight",          "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Tomato",  "description": "Fungal disease causing dark spots on tomato leaves.", "symptoms": "Dark brown spots with concentric rings, yellowing leaves."},
    {"name": "Late Blight",           "category": "FUNGAL",    "severity": "HIGH",   "plant": "Tomato",  "description": "Destructive fungal disease on tomato.", "symptoms": "Water-soaked gray-green spots turning brown."},
    {"name": "Leaf Mold",             "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Tomato",  "description": "Fungal disease on tomato leaves.", "symptoms": "Yellow spots on upper leaf, olive-brown mold underneath."},
    {"name": "Septoria Leaf Spot",    "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Tomato",  "description": "Fungal disease causing small spots on tomato leaves.", "symptoms": "Small circular spots with dark borders on lower leaves."},
    {"name": "Target Spot",           "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Tomato",  "description": "Fungal disease causing target-like spots on tomato.", "symptoms": "Brown spots with concentric rings resembling a target."},
    {"name": "Mosaic Virus",          "category": "VIRAL",     "severity": "HIGH",   "plant": "Tomato",  "description": "Viral disease causing mosaic patterns on tomato leaves.", "symptoms": "Light and dark green mosaic pattern on leaves."},
    {"name": "Yellow Leaf Curl Virus","category": "VIRAL",     "severity": "HIGH",   "plant": "Tomato",  "description": "Viral disease causing leaf curling on tomato.", "symptoms": "Yellowing and upward curling of leaves, stunted growth."},
    # Potato
    {"name": "Early Blight",          "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Potato",  "description": "Fungal disease causing dark spots on potato leaves.", "symptoms": "Dark brown spots with concentric rings on leaves."},
    {"name": "Late Blight",           "category": "FUNGAL",    "severity": "HIGH",   "plant": "Potato",  "description": "Destructive fungal disease on potato.", "symptoms": "Water-soaked lesions turning brown-black."},
    # Pepper
    {"name": "Bacterial Spot",        "category": "BACTERIAL", "severity": "MEDIUM", "plant": "Pepper",  "description": "Bacterial disease causing spots on pepper.", "symptoms": "Small water-soaked spots on leaves with yellow halos."},
    # Corn
    {"name": "Common Rust",           "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Corn",    "description": "Fungal disease causing rust pustules on corn.", "symptoms": "Cinnamon-brown pustules on both leaf surfaces."},
    {"name": "Northern Leaf Blight",  "category": "FUNGAL",    "severity": "HIGH",   "plant": "Corn",    "description": "Major fungal disease on corn.", "symptoms": "Long elliptical gray-green lesions on leaves."},
    # Strawberry
    {"name": "Leaf Scorch",           "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Strawberry", "description": "Fungal disease on strawberry leaves.", "symptoms": "Small purplish spots with gray centers on leaves."},
    # Cherry
    {"name": "Powdery Mildew",        "category": "FUNGAL",    "severity": "LOW",    "plant": "Cherry",  "description": "Fungal disease causing powdery coating on cherry.", "symptoms": "White powdery coating on young leaves and shoots."},
    # Peach
    {"name": "Bacterial Spot",        "category": "BACTERIAL", "severity": "MEDIUM", "plant": "Peach",   "description": "Bacterial disease on peach.", "symptoms": "Water-soaked spots on leaves turning brown."},
    # Squash
    {"name": "Powdery Mildew",        "category": "FUNGAL",    "severity": "LOW",    "plant": "Squash",  "description": "Fungal disease on squash plants.", "symptoms": "White powdery coating on upper leaf surfaces."},
]

def seed():
    print("Adding missing diseases...")
    for d in MISSING:
        plant = Plant.objects.filter(name__iexact=d["plant"]).first()
        if not plant:
            print(f"  Plant not found: {d['plant']}")
            continue
        obj, created = Disease.objects.get_or_create(
            name=d["name"],
            defaults={
                "category":    d["category"],
                "severity":    d["severity"],
                "description": d["description"],
                "symptoms":    d["symptoms"],
            }
        )
        PlantDisease.objects.get_or_create(plant=plant, disease=obj)
        print(f"  {'Created' if created else 'Exists'}: {d['name']} ({d['plant']})")
    print("\nDone!")

if __name__ == "__main__":
    seed()
