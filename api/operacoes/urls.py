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
    path("ordens/<str:id_ordem>/equipes", views.equipes_da_ordem),
    path("ordens/<str:id_ordem>/equipes/buscar", views.buscar_equipes_da_ordem),
    path("ordens/<str:id_ordem>/interpretacao", views.corrigir_leitura_da_ordem),
    path("ordens/<str:id_ordem>/equipe", views.ajustar_equipe_da_ordem),
    path("ordens/<str:id_ordem>/equipe/aprovar", views.aprovar_equipe_da_ordem),
    path("ordens/<str:id_ordem>/documentos", views.documentos_da_ordem),
    path("ordens/<str:id_ordem>/dossie", views.dossie_da_ordem),
    path("documentos", views.listar_documentos),
    path("documentos/<str:id_documento>/arquivo", views.arquivo_do_documento),
]