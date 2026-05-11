import json
import os
from typing import List, Dict

from google import genai
from google.genai import types
from google.genai.errors import APIError


ALLOWED_TREATMENT_TYPES = ["CHEMICAL", "MECHANICAL", "ORGANIC"]


def build_treatment_prompt(plant_name: str, disease_name: str) -> str:
    return f"""
You are an agricultural plant disease treatment assistant.

Generate treatment recommendations for the following plant disease:

Plant name: {plant_name}
Disease name: {disease_name}

Rules:
- Return ONLY valid JSON.
- Do not include markdown.
- Do not include explanations outside the JSON.
- Return minimum 1 treatment.
- Return maximum 6 treatments.
- Return maximum 2 treatments per type.
- Allowed treatment types are:
  - CHEMICAL
  - MECHANICAL
  - ORGANIC

Each treatment must have:
- name
- description
- type

The response must be a JSON array in this format:

[
  {{
    "name": "Remove infected leaves",
    "description": "Remove and safely dispose of infected leaves to reduce disease spread.",
    "type": "MECHANICAL"
  }}
]
"""


def validate_treatments(treatments: List[Dict]) -> List[Dict]:
    valid_treatments = []

    type_counter = {
        "CHEMICAL": 0,
        "MECHANICAL": 0,
        "ORGANIC": 0,
    }

    for treatment in treatments:
        if not isinstance(treatment, dict):
            continue

        name = treatment.get("name")
        description = treatment.get("description")
        treatment_type = treatment.get("type")

        if not name or not description or not treatment_type:
            continue

        treatment_type = str(treatment_type).upper().strip()

        if treatment_type not in ALLOWED_TREATMENT_TYPES:
            continue

        if type_counter[treatment_type] >= 2:
            continue

        valid_treatments.append({
            "name": str(name).strip(),
            "description": str(description).strip(),
            "type": treatment_type,
        })

        type_counter[treatment_type] += 1

        if len(valid_treatments) >= 6:
            break

    return valid_treatments


def get_fallback_treatments(plant_name: str, disease_name: str) -> List[Dict]:
    return [
        {
            "name": "Remove affected plant parts",
            "description": (
                f"Remove visibly infected leaves or plant parts from the {plant_name} "
                f"to reduce the spread of {disease_name}. Dispose of infected material safely."
            ),
            "type": "MECHANICAL",
        }
    ]


def generate_treatments_with_gemini(
    plant_name: str,
    disease_name: str,
    use_fallback: bool = True,
) -> List[Dict]:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing. Check your .env file.")

    client = genai.Client(api_key=api_key)

    prompt = build_treatment_prompt(
        plant_name=plant_name,
        disease_name=disease_name,
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.4,
            ),
        )

        if not response.text:
            if use_fallback:
                return get_fallback_treatments(plant_name, disease_name)
            return []

        try:
            treatments = json.loads(response.text)
        except json.JSONDecodeError:
            if use_fallback:
                return get_fallback_treatments(plant_name, disease_name)
            return []

        if not isinstance(treatments, list):
            if use_fallback:
                return get_fallback_treatments(plant_name, disease_name)
            return []

        valid_treatments = validate_treatments(treatments)

        if not valid_treatments and use_fallback:
            return get_fallback_treatments(plant_name, disease_name)

        return valid_treatments

    except APIError as error:
        print(f"Gemini API error: {error}")

        if use_fallback:
            return get_fallback_treatments(plant_name, disease_name)

        return []

    except Exception as error:
        print(f"Unexpected Gemini service error: {error}")

        if use_fallback:
            return get_fallback_treatments(plant_name, disease_name)

        return []