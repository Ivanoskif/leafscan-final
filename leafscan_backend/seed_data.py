import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'leafscan.settings')
django.setup()

from core.models import Plant, Disease, PlantDisease

PLANTS = [
    {"name": "Tomato",     "scientific_name": "Solanum lycopersicum", "type": "VEGETABLE", "description": "A widely cultivated fruit vegetable, rich in vitamins and antioxidants.", "growing_season": "Spring - Summer", "growing_region": "Worldwide"},
    {"name": "Potato",     "scientific_name": "Solanum tuberosum",    "type": "VEGETABLE", "description": "A starchy tuber vegetable, one of the world's most important food crops.", "growing_season": "Spring - Fall",   "growing_region": "Worldwide"},
    {"name": "Pepper",     "scientific_name": "Capsicum annuum",      "type": "VEGETABLE", "description": "A versatile vegetable ranging from sweet to hot varieties.", "growing_season": "Spring - Summer", "growing_region": "Tropical & Temperate"},
    {"name": "Apple",      "scientific_name": "Malus domestica",      "type": "FRUIT",     "description": "A widely grown fruit tree, producing sweet or tart fruits.", "growing_season": "Spring - Fall",   "growing_region": "Temperate regions"},
    {"name": "Grape",      "scientific_name": "Vitis vinifera",       "type": "FRUIT",     "description": "A climbing vine producing clusters of fruit used for wine and eating.", "growing_season": "Spring - Fall",   "growing_region": "Mediterranean & Temperate"},
    {"name": "Cherry",     "scientific_name": "Prunus avium",         "type": "FRUIT",     "description": "A stone fruit tree producing sweet or sour cherries.", "growing_season": "Spring - Summer", "growing_region": "Temperate regions"},
    {"name": "Peach",      "scientific_name": "Prunus persica",       "type": "FRUIT",     "description": "A stone fruit tree with sweet, juicy fruits.", "growing_season": "Spring - Summer", "growing_region": "Temperate regions"},
    {"name": "Strawberry", "scientific_name": "Fragaria ananassa",    "type": "FRUIT",     "description": "A low-growing plant producing sweet red berries.", "growing_season": "Spring - Summer", "growing_region": "Temperate regions"},
    {"name": "Corn",       "scientific_name": "Zea mays",             "type": "CROP",      "description": "A tall cereal grain crop, one of the most widely produced crops worldwide.", "growing_season": "Spring - Summer", "growing_region": "Worldwide"},
    {"name": "Soybean",    "scientific_name": "Glycine max",          "type": "CROP",      "description": "A legume crop rich in protein, widely used in food and industry.", "growing_season": "Spring - Summer", "growing_region": "Worldwide"},
    {"name": "Squash",     "scientific_name": "Cucurbita pepo",       "type": "VEGETABLE", "description": "A warm-season vegetable with many varieties.", "growing_season": "Spring - Summer", "growing_region": "Worldwide"},
    {"name": "Raspberry",  "scientific_name": "Rubus idaeus",         "type": "FRUIT",     "description": "A thorny shrub producing sweet red berries.", "growing_season": "Summer - Fall",   "growing_region": "Temperate regions"},
    {"name": "Blueberry",  "scientific_name": "Vaccinium corymbosum", "type": "FRUIT",     "description": "A shrub producing small, sweet blue berries rich in antioxidants.", "growing_season": "Spring - Summer", "growing_region": "North America & Europe"},
    {"name": "Orange",     "scientific_name": "Citrus sinensis",      "type": "FRUIT",     "description": "A citrus tree producing sweet, juicy oranges.", "growing_season": "Winter - Spring",  "growing_region": "Subtropical regions"},
]

DISEASES = [
    {"name": "Tomato Bacterial Spot",         "category": "BACTERIAL", "severity": "MEDIUM", "plant": "Tomato",      "description": "Bacterial disease causing water-soaked spots on leaves and fruits.",                      "symptoms": "Small, dark, water-soaked spots on leaves, stems and fruits."},
    {"name": "Tomato Early Blight",           "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Tomato",      "description": "Fungal disease causing dark spots with concentric rings on lower leaves.",               "symptoms": "Dark brown spots with concentric rings, yellowing leaves."},
    {"name": "Tomato Late Blight",            "category": "FUNGAL",    "severity": "HIGH",   "plant": "Tomato",      "description": "Destructive fungal disease that can destroy entire crops rapidly.",                      "symptoms": "Water-soaked gray-green spots turning brown, white mold on undersides."},
    {"name": "Tomato Leaf Mold",              "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Tomato",      "description": "Fungal disease thriving in humid greenhouse conditions.",                               "symptoms": "Yellow spots on upper leaf surface, olive-brown mold underneath."},
    {"name": "Tomato Septoria Leaf Spot",     "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Tomato",      "description": "Fungal disease causing numerous small spots on leaves.",                               "symptoms": "Small circular spots with dark borders and light centers on lower leaves."},
    {"name": "Tomato Spider Mites",           "category": "OTHER",     "severity": "LOW",    "plant": "Tomato",      "description": "Tiny mites causing stippling and yellowing of leaves.",                                "symptoms": "Fine stippling on leaves, webbing on undersides, yellowing."},
    {"name": "Tomato Target Spot",            "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Tomato",      "description": "Fungal disease causing target-like spots on leaves.",                                   "symptoms": "Brown spots with concentric rings resembling a target."},
    {"name": "Tomato Yellow Leaf Curl Virus", "category": "VIRAL",     "severity": "HIGH",   "plant": "Tomato",      "description": "Viral disease transmitted by whiteflies causing severe leaf curling.",                  "symptoms": "Yellowing and upward curling of leaves, stunted growth."},
    {"name": "Tomato Mosaic Virus",           "category": "VIRAL",     "severity": "HIGH",   "plant": "Tomato",      "description": "Viral disease causing mosaic patterns on leaves.",                                     "symptoms": "Light and dark green mosaic pattern on leaves, distorted growth."},
    {"name": "Potato Early Blight",           "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Potato",      "description": "Fungal disease causing dark spots on potato leaves.",                                   "symptoms": "Dark brown spots with concentric rings, yellowing of surrounding tissue."},
    {"name": "Potato Late Blight",            "category": "FUNGAL",    "severity": "HIGH",   "plant": "Potato",      "description": "The disease responsible for the Irish potato famine.",                                  "symptoms": "Water-soaked lesions turning brown-black, white mold on leaf undersides."},
    {"name": "Pepper Bacterial Spot",         "category": "BACTERIAL", "severity": "MEDIUM", "plant": "Pepper",      "description": "Bacterial disease causing spots on pepper leaves and fruits.",                         "symptoms": "Small water-soaked spots on leaves that turn brown with yellow halos."},
    {"name": "Apple Scab",                    "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Apple",       "description": "Common fungal disease of apple trees causing scabby lesions.",                         "symptoms": "Olive-green to black scabby lesions on leaves and fruits."},
    {"name": "Apple Black Rot",               "category": "FUNGAL",    "severity": "HIGH",   "plant": "Apple",       "description": "Fungal disease causing fruit rot and leaf spots.",                                      "symptoms": "Circular lesions with purple margins on leaves, rotting fruit."},
    {"name": "Apple Cedar Rust",              "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Apple",       "description": "Fungal disease requiring two host plants to complete its lifecycle.",                   "symptoms": "Bright orange-yellow spots on upper leaf surfaces."},
    {"name": "Grape Black Rot",               "category": "FUNGAL",    "severity": "HIGH",   "plant": "Grape",       "description": "Serious fungal disease that can destroy entire grape crops.",                          "symptoms": "Brown lesions on leaves, black shriveled mummified berries."},
    {"name": "Grape Esca Black Measles",      "category": "FUNGAL",    "severity": "HIGH",   "plant": "Grape",       "description": "Complex fungal disease affecting grapevine wood and foliage.",                         "symptoms": "Tiger-stripe patterns on leaves, dark berry spotting."},
    {"name": "Grape Leaf Blight",             "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Grape",       "description": "Fungal disease causing blighting of grape leaves.",                                    "symptoms": "Irregular brown lesions on leaves, premature defoliation."},
    {"name": "Cherry Powdery Mildew",         "category": "FUNGAL",    "severity": "LOW",    "plant": "Cherry",      "description": "Fungal disease causing white powdery coating on cherry leaves.",                       "symptoms": "White powdery coating on young leaves and shoots."},
    {"name": "Peach Bacterial Spot",          "category": "BACTERIAL", "severity": "MEDIUM", "plant": "Peach",       "description": "Bacterial disease affecting peach leaves, twigs and fruits.",                         "symptoms": "Water-soaked spots on leaves turning brown, fruit lesions."},
    {"name": "Strawberry Leaf Scorch",        "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Strawberry",  "description": "Fungal disease causing purplish spots on strawberry leaves.",                          "symptoms": "Small purplish spots with gray or tan centers on leaves."},
    {"name": "Corn Cercospora Leaf Spot",     "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Corn",        "description": "Fungal disease causing rectangular lesions on corn leaves.",                            "symptoms": "Rectangular gray lesions with dark brown borders on leaves."},
    {"name": "Corn Common Rust",              "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Corn",        "description": "Fungal disease causing rust-colored pustules on corn leaves.",                         "symptoms": "Oval to elongated cinnamon-brown pustules on both leaf surfaces."},
    {"name": "Corn Northern Leaf Blight",     "category": "FUNGAL",    "severity": "HIGH",   "plant": "Corn",        "description": "Major fungal disease causing long lesions on corn leaves.",                            "symptoms": "Long, elliptical gray-green to tan lesions on leaves."},
    {"name": "Soybean Frogeye Leaf Spot",     "category": "FUNGAL",    "severity": "MEDIUM", "plant": "Soybean",     "description": "Fungal disease causing distinctive frog-eye pattern on soybean leaves.",               "symptoms": "Circular spots with brown centers and reddish-purple margins."},
    {"name": "Squash Powdery Mildew",         "category": "FUNGAL",    "severity": "LOW",    "plant": "Squash",      "description": "Common fungal disease affecting squash plants.",                                        "symptoms": "White powdery coating on upper leaf surfaces."},
]

def seed():
    print("Seeding plants...")
    plant_map = {}
    for p in PLANTS:
        obj, created = Plant.objects.get_or_create(
            name=p["name"],
            defaults={
                "scientific_name": p["scientific_name"],
                "type":            p["type"],
                "description":     p["description"],
                "growing_season":  p["growing_season"],
                "growing_region":  p["growing_region"],
            }
        )
        plant_map[p["name"]] = obj
        print(f"  {'Created' if created else 'Exists'}: {p['name']}")

    print("\nSeeding diseases...")
    for d in DISEASES:
        obj, created = Disease.objects.get_or_create(
            name=d["name"],
            defaults={
                "category":    d["category"],
                "severity":    d["severity"],
                "description": d["description"],
                "symptoms":    d["symptoms"],
            }
        )
        plant = plant_map.get(d["plant"])
        if plant:
            PlantDisease.objects.get_or_create(plant=plant, disease=obj)
        print(f"  {'Created' if created else 'Exists'}: {d['name']}")

    print(f"\nDone! {len(PLANTS)} plants, {len(DISEASES)} diseases seeded.")

if __name__ == "__main__":
    seed()
