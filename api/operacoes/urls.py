from django.urls import path

from . import views

urlpatterns = [
    path("ordens", views.listar_ordens),
    path("ordens/<str:id_ordem>", views.detalhar_ordem),
    path("profissionais", views.listar_profissionais),
    path("profissionais/<str:id_profissional>", views.detalhar_profissional),
    path("painel", views.painel),
    path("alertas", views.alertas),
    path("demo/reiniciar", views.reiniciar_demo),
]