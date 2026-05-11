from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .services import (
    get_analysis_monthly_counts,
    get_dashboard_disease_distribution,
    get_dashboard_overview,
    get_dashboard_recent_analyses,
    get_dashboard_summary,
    get_detection_accuracy,
    get_diseases_by_category,
    get_statistics_overview,
    get_top_detected_diseases,
    get_user_growth,
)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def dashboard_overview(request):
    data = get_dashboard_overview()
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def dashboard_summary(request):
    data = get_dashboard_summary()
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def dashboard_monthly_trend(request):
    data = get_analysis_monthly_counts()
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def dashboard_disease_distribution(request):
    data = get_dashboard_disease_distribution()
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def dashboard_recent_analyses(request):
    data = get_dashboard_recent_analyses()
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def dashboard_top_detected_diseases(request):
    data = get_top_detected_diseases()
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def statistics_overview(request):
    data = get_statistics_overview()
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def statistics_analyses_by_month(request):
    data = get_analysis_monthly_counts()
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def statistics_diseases_by_category(request):
    data = get_diseases_by_category()
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def statistics_user_growth(request):
    data = get_user_growth()
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def statistics_detection_accuracy(request):
    data = get_detection_accuracy()
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def statistics_top_detected_diseases(request):
    data = get_top_detected_diseases()
    return Response(data, status=status.HTTP_200_OK)