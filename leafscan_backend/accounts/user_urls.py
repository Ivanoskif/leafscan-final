from django.urls import path

from . import views

urlpatterns = [
    path("", views.users_list_create, name="users_list_create"),
    path("<int:id>/", views.user_detail_update_delete, name="user_detail_update_delete"),
    path("<int:id>/analyses/", views.get_user_analyses, name="get_user_analyses"),
]