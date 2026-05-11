from django.urls import path

from . import views

urlpatterns = [
    path("scan/", views.scan_plant, name="scan_plant"),

    path("", views.list_analyses, name="list_analyses"),
    path("<int:id>/", views.analysis_detail, name="analysis_detail"),

    path("my/", views.my_analyses, name="my_analyses"),
    path("my/recent/", views.my_recent_analyses, name="my_recent_analyses"),
    path("my/summary/", views.my_analysis_summary, name="my_analysis_summary"),

    path("export/pdf/", views.export_analyses_pdf, name="export_analyses_pdf"),
    path("<int:id>/report/pdf/", views.export_analysis_report_pdf, name="export_analysis_report_pdf"),

    path("<int:id>/generate-treatments/", views.generate_treatments_for_analysis, name="generate_treatments_for_analysis"),
]