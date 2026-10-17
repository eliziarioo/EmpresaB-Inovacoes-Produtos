from django.conf import settings
from django.http import FileResponse
from rest_framework.decorators import api_view
from rest_framework.exceptions import APIException, NotFound, ValidationError
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from . import permissoes, regras

from .dados import carregar_dados, obter_estado, reiniciar_estado

class Conflito(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Operação não permitida no estado atual."

def ordem_ou_404(id_ordem):
    ordem = regras.achar_ordem(id_ordem)
    if ordem is None:
        raise NotFound(f"Ordem {id_ordem} não encontrada")
    return ordem

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

@api_view(["GET"])
def equipes_da_ordem(request, id_ordem):
    ordem = ordem_ou_404(id_ordem)
    if not ordem.get("interpretacao"):
        raise ValidationError("Esta ordem ainda não tem leitura da descrição.")
    return Response(regras.buscar_equipes(ordem))

@api_view(["POST"])
def buscar_equipes_da_ordem(request, id_ordem):
    ordem = ordem_ou_404(id_ordem)
    if not ordem.get("interpretacao"):
        raise ValidationError("Esta ordem ainda não tem leitura da descrição.")

    if ordem["estado"] == "rascunho":
        return Response(regras.atualizar_estado_apos_busca(ordem))
    return Response(regras.buscar_equipes(ordem))


@api_view(["PATCH"])
def corrigir_leitura_da_ordem(request, id_ordem):
    ordem = ordem_ou_404(id_ordem)
    try:
        regras.corrigir_interpretacao(ordem, request.data)
    except (ValueError, IndexError, KeyError) as erro:
        raise ValidationError(str(erro))
    return Response(regras.montar_resposta_da_ordem(ordem))

@api_view(["PATCH"])
def ajustar_equipe_da_ordem(request, id_ordem):
    ordem = ordem_ou_404(id_ordem)
    ids = request.data.get("profissionais")
    if not isinstance(ids, list) or not ids:
        raise ValidationError("Envie 'profissionais' com a lista de ids.")

    try:
        visao = regras.ajustar_equipe(ordem, ids)
    except LookupError as erro:
        raise NotFound(str(erro))
    return Response(visao)


@api_view(["POST"])
def aprovar_equipe_da_ordem(request, id_ordem):
    ordem = ordem_ou_404(id_ordem)
    if ordem["estado"] == "equipe_aprovada":
        raise Conflito("A equipe desta ordem já foi aprovada.")

    try:
        notificados, replanejadas = regras.aprovar_equipe(ordem)
    except PermissionError as erro:
        raise Conflito(str(erro))

    return Response({
        "ordem": regras.montar_resposta_da_ordem(ordem),
        "notificados": notificados,
        "ordens_replanejadas": replanejadas,
    })

@api_view(["GET"])
def dossie_da_ordem(request, id_ordem):
    ordem = ordem_ou_404(id_ordem)
    try:
        return Response(regras.montar_dossie(ordem))
    except LookupError as erro:
        raise Conflito(str(erro))


def documento_para_resposta(documento):
    resposta = dict(documento)
    resposta["arquivo_url"] = f"/documentos/{documento['id']}/arquivo"
    return resposta


@api_view(["GET"])
def listar_documentos(request):
    return Response([documento_para_resposta(d) for d in carregar_dados("documentos.json")])


@api_view(["GET"])
def documentos_da_ordem(request, id_ordem):
    ordem = ordem_ou_404(id_ordem)
    documentos = [regras.achar_documento(i) for i in ordem.get("documentos_autorizados", [])]
    return Response([documento_para_resposta(d) for d in documentos if d])


@api_view(["GET"])
def arquivo_do_documento(request, id_documento):
    documento = regras.achar_documento(id_documento)
    if documento is None:
        raise NotFound(f"Documento {id_documento} não encontrado")
    caminho = settings.BASE_DIR / "arquivos" / documento["arquivo"]
    if not caminho.exists():
        raise NotFound(f"Arquivo {documento['arquivo']} não encontrado na pasta api/arquivos")
    return FileResponse(open(caminho, "rb"), content_type="application/pdf")

@api_view(["GET"])
def servicos_do_profissional(request, id_profissional):
    profissional = regras.achar_profissional(id_profissional)
    if profissional is None:
        raise NotFound(f"Profissional {id_profissional} não encontrado")

    incluir_indicados = request.query_params.get("incluir_indicados") == "true"
    return Response(regras.montar_servicos_do_profissional(profissional, incluir_indicados))

@api_view(["GET"])
def listar_perfis(request):
    return Response(carregar_dados("perfis.json"))


@api_view(["POST"])
def entrar(request):
    id_perfil = request.data.get("perfil")
    perfis = carregar_dados("perfis.json")
    perfil = next((p for p in perfis if p["id"] == id_perfil), None)
    if perfil is None:
        validos = ", ".join(p["id"] for p in perfis)
        raise ValidationError({"perfil": f"Perfil não encontrado. Use um destes: {validos}."})

    return Response({"perfil": perfil, "mensagem": f"Você entrou como {perfil['nome']}."})

@api_view(["GET"])
def listar_perfis(request):
    return Response([permissoes.perfil_publico(p) for p in carregar_dados("perfis.json")])


@api_view(["POST"])
def entrar(request):
    perfil = permissoes.autenticar(request.data.get("usuario"), request.data.get("senha"))
    if perfil is None:
        return Response({"detail": "Usuário ou senha incorretos."}, status=status.HTTP_401_UNAUTHORIZED)

    token = permissoes.abrir_sessao(perfil)
    return Response({
        "token": token,
        "perfil": permissoes.perfil_publico(perfil),
        "mensagem": f"Você entrou como {perfil['nome']}.",
    })


@api_view(["POST"])
def sair(request):
    token = permissoes.extrair_token(request)
    permissoes.SESSOES.pop(token, None)
    return Response({"mensagem": "Você saiu."})


@api_view(["GET"])
def quem_sou_eu(request):
    perfil = getattr(request, "perfil_logado", None)
    if perfil is None:
        return Response({"detail": "Ninguém está logado."}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(perfil)