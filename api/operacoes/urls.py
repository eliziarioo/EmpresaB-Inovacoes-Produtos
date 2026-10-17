from django.urls import path

from . import views

urlpatterns = [
    path("ordens", views.listar_ordens),
    path("ordens/<str:id_ordem>", views.detalhar_ordem),
]