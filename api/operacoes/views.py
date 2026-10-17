from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from . import regras

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

@api_view(["GET"])
def listar_profissionais(request):
    funcao = request.query_params.get("funcao")
    profissionais = carregar_dados("profissionais.json")

    if funcao:
        profissionais = [
            profissional for profissional in profissionais
            if profissional["funcao"] == funcao
        ]

    return Response(profissionais)


@api_view(["GET"])
def detalhar_profissional(request, id_profissional):
    profissionais = carregar_dados("profissionais.json")

    for profissional in profissionais:
        if profissional["id"] == id_profissional:
            return Response(profissional)

    raise NotFound(f"Profissional {id_profissional} não encontrado")

@api_view(["GET"])
def painel(request):
    base_do_painel = carregar_dados("painel.json")
    outras_ordens = base_do_painel["outras_ordens"]
    ordens = carregar_dados("ordens_de_servico.json")

    ordens_abertas = outras_ordens["abertas"] + sum(
        1 for ordem in ordens if ordem["estado"] != "concluida"
    )
    ordens_aguardando_aprovacao = outras_ordens["aguardando_aprovacao"] + sum(
        1 for ordem in ordens if ordem["estado"] == "aguardando_aprovacao"
    )
    ordens_em_execucao = outras_ordens["em_execucao"] + sum(
        1 for ordem in ordens if ordem["estado"] == "em_execucao"
    )

    return Response({
        "usuario": base_do_painel["usuario"],
        "data_referencia": base_do_painel["data_referencia"],
        "contadores": {
            "os_abertas": ordens_abertas,
            "aguardando_aprovacao": ordens_aguardando_aprovacao,
            "em_execucao": ordens_em_execucao,
        },
    })

@api_view(["GET"])
def alertas(request):
    return Response(regras.montar_alertas())