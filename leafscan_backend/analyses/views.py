import uuid

from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Plant, Disease, Treatment, DiseaseTreatment
from .models import Analysis, AnalysisResult
from .serializers import AnalysisListSerializer, AnalysisDetailSerializer
from .services.ai_model_service import predict_plant_disease, AIModelPredictionError
from .services.gemini_service import generate_treatments_with_gemini

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

# ---------------------
# HELPERS
# ---------------------

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


def can_access_analysis(request, analysis):
    return is_admin_user(request) or analysis.user_id == request.user.id


def generate_analysis_key():
    return f"AN-{uuid.uuid4().hex[:8].upper()}"


def normalize_result_label(result_label, disease_name=None):
    """
    Ensures that the AI result_label is compatible with AnalysisResult choices.
    If the model returns something unexpected, we infer the result from disease_name.
    """

    if result_label in AnalysisResult.values:
        return result_label

    return AnalysisResult.INFECTED if disease_name else AnalysisResult.HEALTHY


def disease_has_treatments(disease):
    """
    Checks whether this disease already has at least one treatment.

    Important:
    Analysis records should always be created.
    Treatments should not be regenerated every time for the same disease.
    """

    if not disease:
        return False

    return DiseaseTreatment.objects.filter(disease=disease).exists()


def save_gemini_treatments_for_disease(disease, treatments_data):
    """
    Saves Gemini-generated treatments into:
    - treatments
    - disease_treatments

    Expected treatments_data:
    [
        {
            "name": "...",
            "description": "...",
            "type": "CHEMICAL" | "MECHANICAL" | "ORGANIC"
        }
    ]
    """

    if not disease or not treatments_data:
        return []

    saved_treatments = []

    for item in treatments_data:
        name = item.get("name")
        description = item.get("description")
        treatment_type = item.get("type")

        if not name or not description or not treatment_type:
            continue

        treatment, created = Treatment.objects.get_or_create(
            name=name,
            type=treatment_type,
            defaults={
                "description": description,
            }
        )

        if not created and not treatment.description:
            treatment.description = description
            treatment.save(update_fields=["description"])

        DiseaseTreatment.objects.get_or_create(
            disease=disease,
            treatment=treatment
        )

        saved_treatments.append(treatment)

    return saved_treatments


def generate_treatments_only_if_missing(plant, disease):
    """
    Gemini is called only if the disease has no treatments yet.

    This prevents adding new/different treatments every time the same disease
    is detected again.
    """

    if not plant or not disease:
        return {
            "generated": False,
            "reason": "Missing plant or disease.",
            "count": 0,
        }

    if disease_has_treatments(disease):
        existing_count = DiseaseTreatment.objects.filter(
            disease=disease
        ).count()

        return {
            "generated": False,
            "reason": "Treatments already exist for this disease.",
            "count": existing_count,
        }

    treatments_data = generate_treatments_with_gemini(
        plant_name=plant.name,
        disease_name=disease.name,
    )

    saved_treatments = save_gemini_treatments_for_disease(
        disease=disease,
        treatments_data=treatments_data,
    )

    return {
        "generated": True,
        "reason": "Treatments generated successfully.",
        "count": len(saved_treatments),
    }


# ---------------------
# ANALYSES
# ---------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def scan_plant(request):
    image = request.FILES.get("image")

    if not image:
        return Response(
            {"image": "This field is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        prediction = predict_plant_disease(image)

        if hasattr(image, "seek"):
            image.seek(0)

    except AIModelPredictionError as error:
        return Response(
            {
                "detail": "AI prediction failed.",
                "error": str(error),
            },
            status=status.HTTP_502_BAD_GATEWAY
        )

    plant_name = prediction.get("plant_name")
    disease_name = prediction.get("disease_name")
    confidence = prediction.get("confidence")
    result_label = normalize_result_label(
        prediction.get("result_label"),
        disease_name=disease_name
    )

    if not plant_name:
        return Response(
            {
                "plant": "AI model did not return plant_name.",
                "prediction": prediction,
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    plant = Plant.objects.filter(name__iexact=plant_name).first()

    if not plant:
        return Response(
            {
                "plant": f"Plant '{plant_name}' does not exist in database.",
                "prediction": prediction,
            },
            status=status.HTTP_404_NOT_FOUND
        )

    disease = None

    if result_label == AnalysisResult.INFECTED:
        if not disease_name:
            return Response(
                {
                    "disease": "AI model returned infected result, but disease_name is missing.",
                    "prediction": prediction,
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        disease, created = Disease.objects.get_or_create(
            name__iexact=disease_name,
            defaults={
                "name": disease_name,
                "category": "FUNGAL",
                "severity": "MEDIUM",
                "description": f"AI detected disease: {disease_name}",
            }
        )

        # disease = Disease.objects.filter(name__iexact=disease_name).first()
        #
        # if not disease:
        #     return Response(
        #         {
        #             "disease": f"Disease '{disease_name}' does not exist in database.",
        #             "prediction": prediction,
        #         },
        #         status=status.HTTP_404_NOT_FOUND
        #     )

    analysis = Analysis.objects.create(
        analysis_key=generate_analysis_key(),
        user=request.user,
        plant=plant,
        disease=disease,
        image=image,
        confidence=confidence,
        result_label=result_label,
    )

    treatment_generation = {
        "generated": False,
        "reason": "No disease detected.",
        "count": 0,
    }

    if disease:
        treatment_generation = generate_treatments_only_if_missing(
            plant=plant,
            disease=disease,
        )

    serializer = AnalysisDetailSerializer(analysis)

    return Response(
        {
            "message": "Analysis created successfully.",
            "prediction": prediction,
            "treatment_generation": treatment_generation,
            "analysis": serializer.data,
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_analyses(request):
    if not is_admin_user(request):
        return admin_required_response()

    analyses = Analysis.objects.all().select_related(
        "user",
        "plant",
        "disease"
    ).order_by("-created_at")

    search = request.query_params.get("search")
    result = request.query_params.get("result")
    plant_id = request.query_params.get("plant_id")
    disease_id = request.query_params.get("disease_id")
    user_id = request.query_params.get("user_id")

    if search:
        analyses = analyses.filter(
            Q(analysis_key__icontains=search) |
            Q(user__full_name__icontains=search) |
            Q(user__email__icontains=search) |
            Q(plant__name__icontains=search) |
            Q(disease__name__icontains=search)
        )

    if result:
        analyses = analyses.filter(result_label=result)

    if plant_id:
        analyses = analyses.filter(plant_id=plant_id)

    if disease_id:
        analyses = analyses.filter(disease_id=disease_id)

    if user_id:
        analyses = analyses.filter(user_id=user_id)

    serializer = AnalysisListSerializer(analyses, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def analysis_detail(request, id):
    analysis = get_object_or_404(
        Analysis.objects.select_related("user", "plant", "disease"),
        id=id
    )

    if not can_access_analysis(request, analysis):
        return Response(
            {"detail": "You do not have permission to access this analysis."},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == "GET":
        serializer = AnalysisDetailSerializer(analysis)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if request.method == "DELETE":
        analysis.delete()
        return Response(
            {"message": "Analysis deleted successfully."},
            status=status.HTTP_200_OK
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_analyses(request):
    analyses = Analysis.objects.filter(
        user=request.user
    ).select_related("plant", "disease").order_by("-created_at")

    result = request.query_params.get("result")
    search = request.query_params.get("search")

    if result:
        analyses = analyses.filter(result_label=result)

    if search:
        analyses = analyses.filter(
            Q(plant__name__icontains=search) |
            Q(disease__name__icontains=search) |
            Q(analysis_key__icontains=search)
        )

    serializer = AnalysisListSerializer(analyses, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_recent_analyses(request):
    limit = int(request.query_params.get("limit", 5))

    analyses = Analysis.objects.filter(
        user=request.user
    ).select_related("plant", "disease").order_by("-created_at")[:limit]

    serializer = AnalysisListSerializer(analyses, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_analysis_summary(request):
    analyses = Analysis.objects.filter(user=request.user)

    total_scans = analyses.count()
    healthy_plants = analyses.filter(result_label=AnalysisResult.HEALTHY).count()
    issues_found = analyses.filter(result_label=AnalysisResult.INFECTED).count()

    return Response(
        {
            "total_scans": total_scans,
            "healthy_plants": healthy_plants,
            "issues_found": issues_found,
        },
        status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_treatments_for_analysis(request, id):
    analysis = get_object_or_404(
        Analysis.objects.select_related("plant", "disease"),
        id=id
    )

    if not can_access_analysis(request, analysis):
        return Response(
            {"detail": "You do not have permission to access this analysis."},
            status=status.HTTP_403_FORBIDDEN
        )

    if not analysis.disease:
        return Response(
            {"detail": "Cannot generate treatments for healthy analysis."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not analysis.plant:
        return Response(
            {"detail": "Cannot generate treatments because plant is missing."},
            status=status.HTTP_400_BAD_REQUEST
        )

    treatment_generation = generate_treatments_only_if_missing(
        plant=analysis.plant,
        disease=analysis.disease,
    )

    return Response(
        {
            "message": treatment_generation["reason"],
            "generated": treatment_generation["generated"],
            "count": treatment_generation["count"],
        },
        status=status.HTTP_200_OK
    )


# ---------------------
# PDF EXPORTS
# ---------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_analyses_pdf(request):
    if not is_admin_user(request):
        return admin_required_response()

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="analyses_report.pdf"'

    doc = SimpleDocTemplate(
        response,
        pagesize=landscape(A4),
        rightMargin=20,
        leftMargin=20,
        topMargin=20,
        bottomMargin=20,
    )

    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    normal_style = styles["BodyText"]

    elements = []

    title = Paragraph("LeafScanAI - Analyses Report", title_style)
    elements.append(title)
    elements.append(Spacer(1, 12))

    analyses = Analysis.objects.all().select_related(
        "user",
        "plant",
        "disease"
    ).order_by("-created_at")

    data = [
        [
            "Analysis Key",
            "User",
            "Plant",
            "Disease",
            "Result",
            "Confidence",
            "Created At",
        ]
    ]

    for analysis in analyses:
        analysis_key = analysis.analysis_key or "-"
        user_name = analysis.user.full_name if analysis.user else "-"
        plant_name = analysis.plant.name if analysis.plant else "-"
        disease_name = analysis.disease.name if analysis.disease else "-"
        result_label = analysis.result_label or "-"
        confidence = f"{analysis.confidence:.4f}" if analysis.confidence is not None else "-"
        created_at = analysis.created_at.strftime("%Y-%m-%d %H:%M")

        data.append([
            Paragraph(str(analysis_key), normal_style),
            Paragraph(str(user_name), normal_style),
            Paragraph(str(plant_name), normal_style),
            Paragraph(str(disease_name), normal_style),
            Paragraph(str(result_label), normal_style),
            Paragraph(str(confidence), normal_style),
            Paragraph(str(created_at), normal_style),
        ])

    table = Table(
        data,
        colWidths=[85, 120, 90, 120, 70, 70, 110],
        repeatRows=1
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#d9eaf7")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.7, colors.black),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))

    elements.append(table)
    doc.build(elements)

    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_analysis_report_pdf(request, id):
    analysis = get_object_or_404(
        Analysis.objects.select_related("user", "plant", "disease"),
        id=id
    )

    if not can_access_analysis(request, analysis):
        return Response(
            {"detail": "You do not have permission to access this analysis."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
    except ImportError:
        return Response(
            {"detail": "Install reportlab first: pip install reportlab"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{analysis.analysis_key}_report.pdf"'

    p = canvas.Canvas(response, pagesize=A4)
    width, height = A4

    y = height - 50

    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, f"Analysis Report: {analysis.analysis_key}")

    y -= 40
    p.setFont("Helvetica", 11)

    lines = [
        f"User: {analysis.user.full_name if analysis.user else '-'}",
        f"Plant: {analysis.plant.name if analysis.plant else '-'}",
        f"Disease: {analysis.disease.name if analysis.disease else '-'}",
        f"Result: {analysis.result_label}",
        f"Confidence: {analysis.confidence}",
        f"Date: {analysis.created_at}",
    ]

    for line in lines:
        p.drawString(50, y, line)
        y -= 25

    if analysis.disease:
        y -= 20
        p.setFont("Helvetica-Bold", 13)
        p.drawString(50, y, "Disease Description")
        y -= 25

        p.setFont("Helvetica", 10)
        description = analysis.disease.description or "-"
        p.drawString(50, y, description[:120])

    p.save()
    return response


# import uuid
#
# from django.db.models import Q
# from django.http import HttpResponse
# from django.shortcuts import get_object_or_404
#
# from rest_framework import status
# from rest_framework.decorators import api_view, permission_classes, parser_classes
# from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
#
# from core.models import Plant, Disease, Treatment, DiseaseTreatment
# from .models import Analysis, AnalysisResult
# from .serializers import AnalysisListSerializer, AnalysisDetailSerializer
# from .services.ai_model_service import predict_plant_disease, AIModelPredictionError
# from .services.gemini_service import generate_treatments_with_gemini
#
#
# # ---------------------
# # HELPERS
# # ---------------------
#
# def is_admin_user(request):
#     return (
#         request.user.is_staff
#         or request.user.is_superuser
#         or getattr(request.user, "role", None) == "ADMIN"
#     )
#
#
# def admin_required_response():
#     return Response(
#         {"detail": "Admin permission required."},
#         status=status.HTTP_403_FORBIDDEN
#     )
#
#
# def can_access_analysis(request, analysis):
#     return is_admin_user(request) or analysis.user_id == request.user.id
#
#
# def generate_analysis_key():
#     return f"AN-{uuid.uuid4().hex[:8].upper()}"
#
#
# def normalize_result_label(result_label, disease_name=None):
#     """
#     Ensures that the AI result_label is compatible with AnalysisResult choices.
#     If the model returns something unexpected, we infer the result from disease_name.
#     """
#
#     if result_label in AnalysisResult.values:
#         return result_label
#
#     return AnalysisResult.INFECTED if disease_name else AnalysisResult.HEALTHY
#
#
# def save_gemini_treatments_for_disease(disease, treatments_data):
#     """
#     Saves Gemini-generated treatments into:
#     - treatments
#     - disease_treatments
#
#     Expected treatments_data:
#     [
#         {
#             "name": "...",
#             "description": "...",
#             "type": "CHEMICAL" | "MECHANICAL" | "ORGANIC"
#         }
#     ]
#     """
#
#     if not disease or not treatments_data:
#         return []
#
#     saved_treatments = []
#
#     for item in treatments_data:
#         name = item.get("name")
#         description = item.get("description")
#         treatment_type = item.get("type")
#
#         if not name or not description or not treatment_type:
#             continue
#
#         treatment, created = Treatment.objects.get_or_create(
#             name=name,
#             type=treatment_type,
#             defaults={
#                 "description": description,
#             }
#         )
#
#         if not created and not treatment.description:
#             treatment.description = description
#             treatment.save(update_fields=["description"])
#
#         DiseaseTreatment.objects.get_or_create(
#             disease=disease,
#             treatment=treatment
#         )
#
#         saved_treatments.append(treatment)
#
#     return saved_treatments
#
#
# # ---------------------
# # ANALYSES
# # ---------------------
#
# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# @parser_classes([MultiPartParser, FormParser, JSONParser])
# def scan_plant(request):
#     image = request.FILES.get("image")
#
#     if not image:
#         return Response(
#             {"image": "This field is required."},
#             status=status.HTTP_400_BAD_REQUEST
#         )
#
#     try:
#         prediction = predict_plant_disease(image)
#
#         if hasattr(image, "seek"):
#             image.seek(0)
#
#     except AIModelPredictionError as error:
#         return Response(
#             {
#                 "detail": "AI prediction failed.",
#                 "error": str(error),
#             },
#             status=status.HTTP_502_BAD_GATEWAY
#         )
#
#     plant_name = prediction.get("plant_name")
#     disease_name = prediction.get("disease_name")
#     confidence = prediction.get("confidence")
#     result_label = normalize_result_label(
#         prediction.get("result_label"),
#         disease_name=disease_name
#     )
#
#     if not plant_name:
#         return Response(
#             {
#                 "plant": "AI model did not return plant_name.",
#                 "prediction": prediction,
#             },
#             status=status.HTTP_400_BAD_REQUEST
#         )
#
#     plant = Plant.objects.filter(name__iexact=plant_name).first()
#
#     if not plant:
#         return Response(
#             {
#                 "plant": f"Plant '{plant_name}' does not exist in database.",
#                 "prediction": prediction,
#             },
#             status=status.HTTP_404_NOT_FOUND
#         )
#
#     disease = None
#
#     if result_label == AnalysisResult.INFECTED:
#         if not disease_name:
#             return Response(
#                 {
#                     "disease": "AI model returned infected result, but disease_name is missing.",
#                     "prediction": prediction,
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#
#         disease = Disease.objects.filter(name__iexact=disease_name).first()
#
#         if not disease:
#             return Response(
#                 {
#                     "disease": f"Disease '{disease_name}' does not exist in database.",
#                     "prediction": prediction,
#                 },
#                 status=status.HTTP_404_NOT_FOUND
#             )
#
#     analysis = Analysis.objects.create(
#         analysis_key=generate_analysis_key(),
#         user=request.user,
#         plant=plant,
#         disease=disease,
#         image=image,
#         confidence=confidence,
#         result_label=result_label,
#     )
#
#     if disease:
#         treatments_data = generate_treatments_with_gemini(
#             plant_name=plant.name,
#             disease_name=disease.name,
#         )
#
#         save_gemini_treatments_for_disease(
#             disease=disease,
#             treatments_data=treatments_data,
#         )
#
#     serializer = AnalysisDetailSerializer(analysis)
#
#     return Response(
#         {
#             "message": "Analysis created successfully.",
#             "prediction": prediction,
#             "analysis": serializer.data,
#         },
#         status=status.HTTP_201_CREATED
#     )
#
#
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def list_analyses(request):
#     if not is_admin_user(request):
#         return admin_required_response()
#
#     analyses = Analysis.objects.all().select_related(
#         "user",
#         "plant",
#         "disease"
#     ).order_by("-created_at")
#
#     search = request.query_params.get("search")
#     result = request.query_params.get("result")
#     plant_id = request.query_params.get("plant_id")
#     disease_id = request.query_params.get("disease_id")
#     user_id = request.query_params.get("user_id")
#
#     if search:
#         analyses = analyses.filter(
#             Q(analysis_key__icontains=search) |
#             Q(user__full_name__icontains=search) |
#             Q(user__email__icontains=search) |
#             Q(plant__name__icontains=search) |
#             Q(disease__name__icontains=search)
#         )
#
#     if result:
#         analyses = analyses.filter(result_label=result)
#
#     if plant_id:
#         analyses = analyses.filter(plant_id=plant_id)
#
#     if disease_id:
#         analyses = analyses.filter(disease_id=disease_id)
#
#     if user_id:
#         analyses = analyses.filter(user_id=user_id)
#
#     serializer = AnalysisListSerializer(analyses, many=True)
#     return Response(serializer.data, status=status.HTTP_200_OK)
#
#
# @api_view(["GET", "DELETE"])
# @permission_classes([IsAuthenticated])
# def analysis_detail(request, id):
#     analysis = get_object_or_404(
#         Analysis.objects.select_related("user", "plant", "disease"),
#         id=id
#     )
#
#     if not can_access_analysis(request, analysis):
#         return Response(
#             {"detail": "You do not have permission to access this analysis."},
#             status=status.HTTP_403_FORBIDDEN
#         )
#
#     if request.method == "GET":
#         serializer = AnalysisDetailSerializer(analysis)
#         return Response(serializer.data, status=status.HTTP_200_OK)
#
#     if request.method == "DELETE":
#         analysis.delete()
#         return Response(
#             {"message": "Analysis deleted successfully."},
#             status=status.HTTP_200_OK
#         )
#
#
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def my_analyses(request):
#     analyses = Analysis.objects.filter(
#         user=request.user
#     ).select_related("plant", "disease").order_by("-created_at")
#
#     result = request.query_params.get("result")
#     search = request.query_params.get("search")
#
#     if result:
#         analyses = analyses.filter(result_label=result)
#
#     if search:
#         analyses = analyses.filter(
#             Q(plant__name__icontains=search) |
#             Q(disease__name__icontains=search) |
#             Q(analysis_key__icontains=search)
#         )
#
#     serializer = AnalysisListSerializer(analyses, many=True)
#     return Response(serializer.data, status=status.HTTP_200_OK)
#
#
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def my_recent_analyses(request):
#     limit = int(request.query_params.get("limit", 5))
#
#     analyses = Analysis.objects.filter(
#         user=request.user
#     ).select_related("plant", "disease").order_by("-created_at")[:limit]
#
#     serializer = AnalysisListSerializer(analyses, many=True)
#     return Response(serializer.data, status=status.HTTP_200_OK)
#
#
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def my_analysis_summary(request):
#     analyses = Analysis.objects.filter(user=request.user)
#
#     total_scans = analyses.count()
#     healthy_plants = analyses.filter(result_label=AnalysisResult.HEALTHY).count()
#     issues_found = analyses.filter(result_label=AnalysisResult.INFECTED).count()
#
#     return Response(
#         {
#             "total_scans": total_scans,
#             "healthy_plants": healthy_plants,
#             "issues_found": issues_found,
#         },
#         status=status.HTTP_200_OK
#     )
#
#
# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def generate_treatments_for_analysis(request, id):
#     analysis = get_object_or_404(
#         Analysis.objects.select_related("plant", "disease"),
#         id=id
#     )
#
#     if not can_access_analysis(request, analysis):
#         return Response(
#             {"detail": "You do not have permission to access this analysis."},
#             status=status.HTTP_403_FORBIDDEN
#         )
#
#     if not analysis.disease:
#         return Response(
#             {"detail": "Cannot generate treatments for healthy analysis."},
#             status=status.HTTP_400_BAD_REQUEST
#         )
#
#     if not analysis.plant:
#         return Response(
#             {"detail": "Cannot generate treatments because plant is missing."},
#             status=status.HTTP_400_BAD_REQUEST
#         )
#
#     treatments_data = generate_treatments_with_gemini(
#         plant_name=analysis.plant.name,
#         disease_name=analysis.disease.name,
#     )
#
#     saved_treatments = save_gemini_treatments_for_disease(
#         disease=analysis.disease,
#         treatments_data=treatments_data,
#     )
#
#     return Response(
#         {
#             "message": "Treatments generated successfully.",
#             "count": len(saved_treatments),
#         },
#         status=status.HTTP_200_OK
#     )
#
#
# # ---------------------
# # PDF EXPORTS
# # ---------------------
#
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def export_analyses_pdf(request):
#     if not is_admin_user(request):
#         return admin_required_response()
#
#     try:
#         from reportlab.lib.pagesizes import A4
#         from reportlab.pdfgen import canvas
#     except ImportError:
#         return Response(
#             {"detail": "Install reportlab first: pip install reportlab"},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )
#
#     response = HttpResponse(content_type="application/pdf")
#     response["Content-Disposition"] = 'attachment; filename="analyses_report.pdf"'
#
#     p = canvas.Canvas(response, pagesize=A4)
#     width, height = A4
#
#     y = height - 50
#
#     p.setFont("Helvetica-Bold", 16)
#     p.drawString(50, y, "LeafScanAI - Analyses Report")
#
#     y -= 40
#     p.setFont("Helvetica", 10)
#
#     analyses = Analysis.objects.all().select_related(
#         "user",
#         "plant",
#         "disease"
#     ).order_by("-created_at")
#
#     for analysis in analyses:
#         line = (
#             f"{analysis.analysis_key} | "
#             f"User: {analysis.user.full_name if analysis.user else '-'} | "
#             f"Plant: {analysis.plant.name if analysis.plant else '-'} | "
#             f"Disease: {analysis.disease.name if analysis.disease else '-'} | "
#             f"Result: {analysis.result_label} | "
#             f"Confidence: {analysis.confidence}"
#         )
#
#         p.drawString(50, y, line)
#         y -= 20
#
#         if y < 50:
#             p.showPage()
#             y = height - 50
#             p.setFont("Helvetica", 10)
#
#     p.save()
#     return response
#
#
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def export_analysis_report_pdf(request, id):
#     analysis = get_object_or_404(
#         Analysis.objects.select_related("user", "plant", "disease"),
#         id=id
#     )
#
#     if not can_access_analysis(request, analysis):
#         return Response(
#             {"detail": "You do not have permission to access this analysis."},
#             status=status.HTTP_403_FORBIDDEN
#         )
#
#     try:
#         from reportlab.lib.pagesizes import A4
#         from reportlab.pdfgen import canvas
#     except ImportError:
#         return Response(
#             {"detail": "Install reportlab first: pip install reportlab"},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )
#
#     response = HttpResponse(content_type="application/pdf")
#     response["Content-Disposition"] = f'attachment; filename="{analysis.analysis_key}_report.pdf"'
#
#     p = canvas.Canvas(response, pagesize=A4)
#     width, height = A4
#
#     y = height - 50
#
#     p.setFont("Helvetica-Bold", 16)
#     p.drawString(50, y, f"Analysis Report: {analysis.analysis_key}")
#
#     y -= 40
#     p.setFont("Helvetica", 11)
#
#     lines = [
#         f"User: {analysis.user.full_name if analysis.user else '-'}",
#         f"Plant: {analysis.plant.name if analysis.plant else '-'}",
#         f"Disease: {analysis.disease.name if analysis.disease else '-'}",
#         f"Result: {analysis.result_label}",
#         f"Confidence: {analysis.confidence}",
#         f"Date: {analysis.created_at}",
#     ]
#
#     for line in lines:
#         p.drawString(50, y, line)
#         y -= 25
#
#     if analysis.disease:
#         y -= 20
#         p.setFont("Helvetica-Bold", 13)
#         p.drawString(50, y, "Disease Description")
#         y -= 25
#
#         p.setFont("Helvetica", 10)
#         description = analysis.disease.description or "-"
#         p.drawString(50, y, description[:120])
#
#     p.save()
#     return response

# import uuid
#
# from django.db.models import Q, Count
# from django.http import HttpResponse
# from django.shortcuts import get_object_or_404
#
# from rest_framework import status
# from rest_framework.decorators import api_view, permission_classes, parser_classes
# from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
#
# from core.models import Plant, Disease, Treatment, DiseaseTreatment
# from core.models import TreatmentType
#
# from .models import Analysis, AnalysisResult
# from .serializers import AnalysisListSerializer, AnalysisDetailSerializer
#
# # Create your views here.
#
#
# def is_admin_user(request):
#     return (
#         request.user.is_staff
#         or request.user.is_superuser
#         or getattr(request.user, "role", None) == "ADMIN"
#     )
#
#
# def admin_required_response():
#     return Response(
#         {"detail": "Admin permission required."},
#         status=status.HTTP_403_FORBIDDEN
#     )
#
#
# def can_access_analysis(request, analysis):
#     return is_admin_user(request) or analysis.user_id == request.user.id
#
#
# def generate_analysis_key():
#     return f"AN-{uuid.uuid4().hex[:8].upper()}"
#
#
# def mock_ai_prediction(request):
#     """
#     Temporary mock AI prediction.
#     Later this should be replaced with real AI model call.
#
#     For testing, send optional fields:
#     plant_name
#     disease_name
#     confidence
#     result_label
#     """
#
#     plant_name = request.data.get("plant_name")
#     disease_name = request.data.get("disease_name")
#     confidence = float(request.data.get("confidence", 0.78))
#
#     if not plant_name:
#         first_plant = Plant.objects.first()
#         plant_name = first_plant.name if first_plant else None
#
#     if disease_name:
#         result_label = AnalysisResult.INFECTED
#     else:
#         result_label = request.data.get("result_label", AnalysisResult.HEALTHY)
#
#     return {
#         "plant_name": plant_name,
#         "disease_name": disease_name,
#         "confidence": confidence,
#         "result_label": result_label,
#     }
#
#
# def create_mock_treatments_for_disease(disease):
#     """
#     Temporary Gemini mock.
#     Later replace this with real Gemini API call.
#     """
#
#     if not disease:
#         return []
#
#     mock_treatments = [
#         {
#             "name": "Remove affected leaves",
#             "description": "Remove affected leaves immediately to prevent spreading.",
#             "type": TreatmentType.MECHANICAL,
#         },
#         {
#             "name": "Improve air circulation",
#             "description": "Ensure proper air circulation around the plant.",
#             "type": TreatmentType.ORGANIC,
#         },
#     ]
#
#     created_treatments = []
#
#     for item in mock_treatments:
#         treatment = Treatment.objects.filter(
#             name=item["name"],
#             type=item["type"]
#         ).first()
#
#         if not treatment:
#             treatment = Treatment.objects.create(
#                 name=item["name"],
#                 description=item["description"],
#                 type=item["type"]
#             )
#
#         DiseaseTreatment.objects.get_or_create(
#             disease=disease,
#             treatment=treatment
#         )
#
#         created_treatments.append(treatment)
#
#     return created_treatments
#
#
# # ---------------------
# # ANALYSES
# # ---------------------
#
# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# @parser_classes([MultiPartParser, FormParser, JSONParser])
# def scan_plant(request):
#     image = request.FILES.get("image")
#
#     if not image:
#         return Response(
#             {"image": "This field is required."},
#             status=status.HTTP_400_BAD_REQUEST
#         )
#
#     prediction = mock_ai_prediction(request)
#
#     plant_name = prediction["plant_name"]
#     disease_name = prediction["disease_name"]
#     confidence = prediction["confidence"]
#     result_label = prediction["result_label"]
#
#     if not plant_name:
#         return Response(
#             {"plant": "No plant found. Add plants to database first."},
#             status=status.HTTP_400_BAD_REQUEST
#         )
#
#     try:
#         plant = Plant.objects.get(name__iexact=plant_name)
#     except Plant.DoesNotExist:
#         return Response(
#             {"plant": f"Plant '{plant_name}' does not exist in database."},
#             status=status.HTTP_404_NOT_FOUND
#         )
#
#     disease = None
#
#     if result_label == AnalysisResult.INFECTED:
#         if not disease_name:
#             return Response(
#                 {"disease": "Disease name is required for infected result."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#
#         try:
#             disease = Disease.objects.get(name__iexact=disease_name)
#         except Disease.DoesNotExist:
#             return Response(
#                 {"disease": f"Disease '{disease_name}' does not exist in database."},
#                 status=status.HTTP_404_NOT_FOUND
#             )
#
#         create_mock_treatments_for_disease(disease)
#
#     analysis = Analysis.objects.create(
#         analysis_key=generate_analysis_key(),
#         user=request.user,
#         plant=plant,
#         disease=disease,
#         image=image,
#         confidence=confidence,
#         result_label=result_label,
#     )
#
#     serializer = AnalysisDetailSerializer(analysis)
#
#     return Response(
#         {
#             "message": "Analysis created successfully.",
#             "analysis": serializer.data,
#         },
#         status=status.HTTP_201_CREATED
#     )
#
#
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def list_analyses(request):
#     if not is_admin_user(request):
#         return admin_required_response()
#
#     analyses = Analysis.objects.all().select_related(
#         "user",
#         "plant",
#         "disease"
#     ).order_by("-created_at")
#
#     search = request.query_params.get("search")
#     result = request.query_params.get("result")
#     plant_id = request.query_params.get("plant_id")
#     disease_id = request.query_params.get("disease_id")
#     user_id = request.query_params.get("user_id")
#
#     if search:
#         analyses = analyses.filter(
#             Q(analysis_key__icontains=search) |
#             Q(user__full_name__icontains=search) |
#             Q(user__email__icontains=search) |
#             Q(plant__name__icontains=search) |
#             Q(disease__name__icontains=search)
#         )
#
#     if result:
#         analyses = analyses.filter(result_label=result)
#
#     if plant_id:
#         analyses = analyses.filter(plant_id=plant_id)
#
#     if disease_id:
#         analyses = analyses.filter(disease_id=disease_id)
#
#     if user_id:
#         analyses = analyses.filter(user_id=user_id)
#
#     serializer = AnalysisListSerializer(analyses, many=True)
#     return Response(serializer.data, status=status.HTTP_200_OK)
#
#
# @api_view(["GET", "DELETE"])
# @permission_classes([IsAuthenticated])
# def analysis_detail(request, id):
#     analysis = get_object_or_404(
#         Analysis.objects.select_related("user", "plant", "disease"),
#         id=id
#     )
#
#     if not can_access_analysis(request, analysis):
#         return Response(
#             {"detail": "You do not have permission to access this analysis."},
#             status=status.HTTP_403_FORBIDDEN
#         )
#
#     if request.method == "GET":
#         serializer = AnalysisDetailSerializer(analysis)
#         return Response(serializer.data, status=status.HTTP_200_OK)
#
#     if request.method == "DELETE":
#         analysis.delete()
#         return Response(
#             {"message": "Analysis deleted successfully."},
#             status=status.HTTP_200_OK
#         )
#
#
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def my_analyses(request):
#     analyses = Analysis.objects.filter(
#         user=request.user
#     ).select_related("plant", "disease").order_by("-created_at")
#
#     result = request.query_params.get("result")
#     search = request.query_params.get("search")
#
#     if result:
#         analyses = analyses.filter(result_label=result)
#
#     if search:
#         analyses = analyses.filter(
#             Q(plant__name__icontains=search) |
#             Q(disease__name__icontains=search) |
#             Q(analysis_key__icontains=search)
#         )
#
#     serializer = AnalysisListSerializer(analyses, many=True)
#     return Response(serializer.data, status=status.HTTP_200_OK)
#
#
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def my_recent_analyses(request):
#     limit = int(request.query_params.get("limit", 5))
#
#     analyses = Analysis.objects.filter(
#         user=request.user
#     ).select_related("plant", "disease").order_by("-created_at")[:limit]
#
#     serializer = AnalysisListSerializer(analyses, many=True)
#     return Response(serializer.data, status=status.HTTP_200_OK)
#
#
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def my_analysis_summary(request):
#     analyses = Analysis.objects.filter(user=request.user)
#
#     total_scans = analyses.count()
#     healthy_plants = analyses.filter(result_label=AnalysisResult.HEALTHY).count()
#     issues_found = analyses.filter(result_label=AnalysisResult.INFECTED).count()
#
#     return Response(
#         {
#             "total_scans": total_scans,
#             "healthy_plants": healthy_plants,
#             "issues_found": issues_found,
#         },
#         status=status.HTTP_200_OK
#     )
#
#
# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def generate_treatments_for_analysis(request, id):
#     analysis = get_object_or_404(Analysis, id=id)
#
#     if not can_access_analysis(request, analysis):
#         return Response(
#             {"detail": "You do not have permission to access this analysis."},
#             status=status.HTTP_403_FORBIDDEN
#         )
#
#     if not analysis.disease:
#         return Response(
#             {"detail": "Cannot generate treatments for healthy analysis."},
#             status=status.HTTP_400_BAD_REQUEST
#         )
#
#     treatments = create_mock_treatments_for_disease(analysis.disease)
#
#     return Response(
#         {
#             "message": "Treatments generated successfully.",
#             "count": len(treatments),
#         },
#         status=status.HTTP_200_OK
#     )
#
#
# # ---------------------
# # PDF EXPORTS
# # ---------------------
#
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def export_analyses_pdf(request):
#     if not is_admin_user(request):
#         return admin_required_response()
#
#     try:
#         from reportlab.lib.pagesizes import A4
#         from reportlab.pdfgen import canvas
#     except ImportError:
#         return Response(
#             {"detail": "Install reportlab first: pip install reportlab"},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )
#
#     response = HttpResponse(content_type="application/pdf")
#     response["Content-Disposition"] = 'attachment; filename="analyses_report.pdf"'
#
#     p = canvas.Canvas(response, pagesize=A4)
#     width, height = A4
#
#     y = height - 50
#
#     p.setFont("Helvetica-Bold", 16)
#     p.drawString(50, y, "LeafScanAI - Analyses Report")
#
#     y -= 40
#     p.setFont("Helvetica", 10)
#
#     analyses = Analysis.objects.all().select_related(
#         "user",
#         "plant",
#         "disease"
#     ).order_by("-created_at")
#
#     for analysis in analyses:
#         line = (
#             f"{analysis.analysis_key} | "
#             f"User: {analysis.user.full_name if analysis.user else '-'} | "
#             f"Plant: {analysis.plant.name if analysis.plant else '-'} | "
#             f"Disease: {analysis.disease.name if analysis.disease else '-'} | "
#             f"Result: {analysis.result_label} | "
#             f"Confidence: {analysis.confidence}"
#         )
#
#         p.drawString(50, y, line)
#         y -= 20
#
#         if y < 50:
#             p.showPage()
#             y = height - 50
#             p.setFont("Helvetica", 10)
#
#     p.save()
#     return response
#
#
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def export_analysis_report_pdf(request, id):
#     analysis = get_object_or_404(
#         Analysis.objects.select_related("user", "plant", "disease"),
#         id=id
#     )
#
#     if not can_access_analysis(request, analysis):
#         return Response(
#             {"detail": "You do not have permission to access this analysis."},
#             status=status.HTTP_403_FORBIDDEN
#         )
#
#     try:
#         from reportlab.lib.pagesizes import A4
#         from reportlab.pdfgen import canvas
#     except ImportError:
#         return Response(
#             {"detail": "Install reportlab first: pip install reportlab"},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )
#
#     response = HttpResponse(content_type="application/pdf")
#     response["Content-Disposition"] = f'attachment; filename="{analysis.analysis_key}_report.pdf"'
#
#     p = canvas.Canvas(response, pagesize=A4)
#     width, height = A4
#
#     y = height - 50
#
#     p.setFont("Helvetica-Bold", 16)
#     p.drawString(50, y, f"Analysis Report: {analysis.analysis_key}")
#
#     y -= 40
#     p.setFont("Helvetica", 11)
#
#     lines = [
#         f"User: {analysis.user.full_name if analysis.user else '-'}",
#         f"Plant: {analysis.plant.name if analysis.plant else '-'}",
#         f"Disease: {analysis.disease.name if analysis.disease else '-'}",
#         f"Result: {analysis.result_label}",
#         f"Confidence: {analysis.confidence}",
#         f"Date: {analysis.created_at}",
#     ]
#
#     for line in lines:
#         p.drawString(50, y, line)
#         y -= 25
#
#     if analysis.disease:
#         y -= 20
#         p.setFont("Helvetica-Bold", 13)
#         p.drawString(50, y, "Disease Description")
#         y -= 25
#
#         p.setFont("Helvetica", 10)
#         description = analysis.disease.description or "-"
#         p.drawString(50, y, description[:120])
#
#     p.save()
#     return response