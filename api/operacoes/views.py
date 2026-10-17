from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from .dados import carregar_dados


@api_view(["GET"])
def listar_ordens(request):
    ordenar = request.query_params.get("ordenar", "prazo")
    ordens = carregar_dados("ordens_de_servico.json")

    colunas_da_tabela = [
        "id", "servico", "resumo_equipe", "local", "ambiente", "prazo", "estado",
    ]
    linhas = [{coluna: ordem[coluna] for coluna in colunas_da_tabela} for ordem in ordens]

    if ordenar == "prazo":
        linhas.sort(key=lambda linha: (linha["estado"] == "concluida", linha["prazo"]))

    return Response(linhas)


@api_view(["GET"])
def detalhar_ordem(request, id_ordem):
    ordens = carregar_dados("ordens_de_servico.json")

    for ordem in ordens:
        if ordem["id"] == id_ordem:
            return Response(ordem)

    raise NotFound(f"Ordem {id_ordem} não encontrada")