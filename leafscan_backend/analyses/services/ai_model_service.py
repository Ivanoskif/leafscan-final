import os
import json
import pathlib
from pathlib import Path
from typing import Optional, Sequence, Mapping

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

from analyses.models import AnalysisResult


MODEL_DIR = Path(__file__).resolve().parent / "ai_model"
MODEL_PATH = MODEL_DIR / "best_efficientnet_b3.pt"
LABEL_CONVERTER_PATH = Path(__file__).resolve().parent / "label_converter.json"

_cached_model = None
_cached_device = None
_cached_labels: Optional[Sequence[str]] = None
_cached_label_converter: Optional[Mapping[str, dict]] = None


class AIModelPredictionError(Exception):
    pass


def _load_labels(model_dir: Path, model=None) -> Optional[Sequence[str]]:
    global _cached_labels

    if _cached_labels is not None:
        return _cached_labels

    if isinstance(model, dict):
        for key in ("class_names", "classes", "labels"):
            labels = model.get(key)
            if isinstance(labels, (list, tuple)) and all(isinstance(item, str) for item in labels):
                _cached_labels = list(labels)
                return _cached_labels

        class_to_idx = model.get("class_to_idx")
        if isinstance(class_to_idx, dict) and class_to_idx:
            if all(isinstance(value, int) for value in class_to_idx.values()):
                labels = [
                    name for name, _ in sorted(
                        class_to_idx.items(),
                        key=lambda item: item[1]
                    )
                ]
                _cached_labels = labels
                return _cached_labels

            if all(isinstance(key, int) for key in class_to_idx.keys()):
                labels = [class_to_idx[idx] for idx in sorted(class_to_idx.keys())]
                if all(isinstance(item, str) for item in labels):
                    _cached_labels = labels
                    return _cached_labels

    if model is not None:
        for attr_name in ("class_names", "classes", "labels"):
            if hasattr(model, attr_name):
                labels = getattr(model, attr_name)
                if isinstance(labels, (list, tuple)) and all(isinstance(item, str) for item in labels):
                    _cached_labels = list(labels)
                    return _cached_labels

    return None


def _extract_state_dict(loaded) -> Optional[dict]:
    if not isinstance(loaded, dict):
        return None

    for key in ("state_dict", "model_state_dict", "model_state", "model"):
        candidate = loaded.get(key)
        if isinstance(candidate, dict):
            return candidate

    if loaded and all(torch.is_tensor(value) for value in loaded.values()):
        return loaded

    return None


def _extract_model_from_bundle(loaded) -> Optional[nn.Module]:
    if not isinstance(loaded, dict):
        return None

    for key in ("model", "net", "module"):
        candidate = loaded.get(key)
        if isinstance(candidate, nn.Module):
            return candidate

    return None


def _strip_state_dict_prefix(state_dict: dict) -> dict:
    prefixes = ("module.", "model.", "net.")
    stripped = {}

    for key, value in state_dict.items():
        for prefix in prefixes:
            if key.startswith(prefix):
                key = key[len(prefix):]
                break

        stripped[key] = value

    return stripped


def _build_efficientnet_b3_from_state_dict(state_dict: dict):
    state_dict = _strip_state_dict_prefix(state_dict)

    model = models.efficientnet_b3(weights=None)

    classifier_weight_key = "classifier.1.weight"

    if classifier_weight_key in state_dict:
        num_classes = state_dict[classifier_weight_key].shape[0]

        if model.classifier[1].out_features != num_classes:
            in_features = model.classifier[1].in_features
            model.classifier[1] = nn.Linear(in_features, num_classes)

    try:
        model.load_state_dict(state_dict)
    except RuntimeError as exc:
        raise AIModelPredictionError(
            f"State dict did not match EfficientNet-B3 architecture: {exc}"
        ) from exc

    return model


def _torch_load_with_windows_path_fix(model_path: Path, device: str):
    try:
        return torch.load(str(model_path), map_location=device)
    except Exception as exc:
        if os.name != "nt" and "WindowsPath" in str(exc):
            original_windows_path = pathlib.WindowsPath
            original_pure_windows_path = pathlib.PureWindowsPath

            try:
                pathlib.WindowsPath = pathlib.PosixPath
                pathlib.PureWindowsPath = pathlib.PurePosixPath
                return torch.load(str(model_path), map_location=device)
            finally:
                pathlib.WindowsPath = original_windows_path
                pathlib.PureWindowsPath = original_pure_windows_path

        if "PytorchStreamReader" in str(exc) or "zip" in str(exc).lower():
            try:
                return torch.jit.load(str(model_path), map_location=device)
            except Exception:
                pass

        raise


def _describe_loaded_bundle(loaded) -> str:
    if not isinstance(loaded, dict):
        return f"type={type(loaded).__name__}"

    keys = list(loaded.keys())
    tensor_keys = [key for key, value in loaded.items() if torch.is_tensor(value)]
    non_tensor_types = {
        key: type(value).__name__
        for key, value in loaded.items()
        if key not in tensor_keys
    }

    return (
        f"dict_keys={keys}, "
        f"tensor_keys={tensor_keys}, "
        f"non_tensor_types={non_tensor_types}"
    )


def _load_model(device: str):
    global _cached_model, _cached_device, _cached_labels

    if _cached_model is not None and _cached_device == device:
        return _cached_model

    if not MODEL_PATH.exists():
        raise AIModelPredictionError(f"Model file not found at {MODEL_PATH}")

    loaded = _torch_load_with_windows_path_fix(MODEL_PATH, device)

    if isinstance(loaded, dict) and not hasattr(loaded, "eval"):
        labels = _load_labels(MODEL_DIR, model=loaded)

        if labels is not None:
            _cached_labels = labels

        model = _extract_model_from_bundle(loaded)

        if model is None:
            state_dict = _extract_state_dict(loaded)

            if state_dict is None:
                raise AIModelPredictionError(
                    "Unsupported .pt format. Expected a TorchScript module, "
                    "a serialized model, or a state dict. Bundle details: "
                    f"{_describe_loaded_bundle(loaded)}"
                )

            model = _build_efficientnet_b3_from_state_dict(state_dict)
    else:
        model = loaded

    if hasattr(model, "to"):
        model = model.to(device)

    if hasattr(model, "eval"):
        model.eval()

    _cached_model = model
    _cached_device = device

    return model


def _build_transform(image_size: int = 244) -> transforms.Compose:
    return transforms.Compose(
        [
            transforms.Resize(image_size),
            transforms.CenterCrop(image_size),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ]
    )


def _load_label_converter() -> Mapping[str, dict]:
    global _cached_label_converter

    if _cached_label_converter is not None:
        return _cached_label_converter

    if not LABEL_CONVERTER_PATH.exists():
        _cached_label_converter = {}
        return _cached_label_converter

    try:
        data = json.loads(LABEL_CONVERTER_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise AIModelPredictionError(
            f"Invalid label_converter.json: {exc}"
        ) from exc

    if not isinstance(data, dict):
        _cached_label_converter = {}
        return _cached_label_converter

    normalized = {
        str(key).strip().lower(): value
        for key, value in data.items()
        if isinstance(value, dict)
    }

    _cached_label_converter = normalized

    return _cached_label_converter


def predict_plant_disease(image_file):
    """
    Runs the local PyTorch model and returns normalized prediction data.

    Expected return:
    {
        "plant_name": "Tomato",
        "disease_name": "Early Blight",
        "confidence": 0.92,
        "result_label": "INFECTED"
    }
    """

    try:
        if isinstance(image_file, (str, os.PathLike, Path)):
            image_path = Path(image_file)

            if not image_path.exists():
                raise AIModelPredictionError(f"Image path not found: {image_path}")

            image = Image.open(image_path)

        elif hasattr(image_file, "read"):
            image = Image.open(image_file)

        else:
            raise AIModelPredictionError(
                "image_file must be a file path or file-like object"
            )

        device = "cuda" if torch.cuda.is_available() else "cpu"

        model = _load_model(device)
        labels = _load_labels(MODEL_DIR, model=model)

        image = image.convert("RGB")

        transform = _build_transform()
        input_tensor = transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            output = model(input_tensor)

            if isinstance(output, (tuple, list)):
                output = output[0]

            if output.ndim == 1:
                output = output.unsqueeze(0)

            probabilities = torch.softmax(output, dim=1)
            confidence, predicted_idx = torch.max(probabilities, dim=1)

        predicted_index = int(predicted_idx.item())

        if labels and predicted_index < len(labels):
            raw_label = labels[predicted_index]
        else:
            raw_label = f"class_{predicted_index}"

        label_converter = _load_label_converter()

        mapped = None

        if isinstance(raw_label, str):
            mapped = label_converter.get(raw_label.strip().lower())

        if mapped:
            plant_name = mapped.get("plant_name") or raw_label
            disease_name = mapped.get("disease_name") or ""
        else:
            plant_name = raw_label
            disease_name = raw_label

        result_label = (
            AnalysisResult.HEALTHY.value
            if not disease_name
            else AnalysisResult.INFECTED.value
        )

        return {
            "plant_name": plant_name,
            "disease_name": disease_name,
            "confidence": float(confidence.item()),
            "result_label": result_label,
            "raw_label": raw_label,
            "predicted_index": predicted_index,
        }

    except AIModelPredictionError:
        raise

    except Exception as exc:
        raise AIModelPredictionError(f"AI prediction failed: {exc}") from exc