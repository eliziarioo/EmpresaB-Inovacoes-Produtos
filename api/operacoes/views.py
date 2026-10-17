from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from . import regras

from .dados import carregar_dados, obter_estado, reiniciar_estado


@api_view(["GET", "POST"])
def listar_ordens(request):
    if request.method == "POST":
        return receber_nova_ordem(request)

    ordenar = request.query_params.get("ordenar", "prazo")
    ordens = obter_estado()["ordens"]

    colunas_da_tabela = [
        "id", "servico", "resumo_equipe", "local", "ambiente", "prazo", "estado",
    ]
    linhas = [{coluna: ordem[coluna] for coluna in colunas_da_tabela} for ordem in ordens]

    if ordenar == "prazo":
        linhas.sort(key=lambda linha: (linha["estado"] == "concluida", linha["prazo"]))

    return Response(linhas)


@api_view(["GET"])
def detalhar_ordem(request, id_ordem):
    ordens = obter_estado()["ordens"]

    for ordem in ordens:
        if ordem["id"] == id_ordem:
            return Response(regras.montar_resposta_da_ordem(ordem))

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
    ordens = obter_estado()["ordens"]

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
            "profissionais_disponiveis": regras.contar_disponiveis_por_funcao(),
        },
    })

@api_view(["GET"])
def alertas(request):
    return Response(regras.montar_alertas())

@api_view(["POST"])
def reiniciar_demo(request):
    reiniciar_estado()
    return Response({"detail": "Dados da demonstração voltaram ao estado inicial."})

def receber_nova_ordem(request):
    descricao = str(request.data.get("descricao_texto", "")).strip()
    local = str(request.data.get("local", "")).strip()
    prazo_informado = request.data.get("prazo")

    if not descricao or not local or not prazo_informado:
        raise ValidationError("Envie descricao_texto, local e prazo.")

    try:
        prazo = regras.converter_prazo(prazo_informado)
    except ValueError:
        raise ValidationError("Prazo inválido. Use AAAA-MM-DD ou DD/MM/AAAA.")

    ordem = regras.criar_ordem(descricao, local, prazo)
    return Response(regras.montar_resposta_da_ordem(ordem), status=status.HTTP_201_CREATED)