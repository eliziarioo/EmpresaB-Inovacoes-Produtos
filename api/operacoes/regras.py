import re
import unicodedata
from datetime import date, timedelta
from itertools import combinations

from .dados import carregar_dados, obter_estado

DIAS_PARA_VENCIMENTO_PROXIMO = 45


def data_de_referencia():
    base_do_painel = carregar_dados("painel.json")
    return date.fromisoformat(base_do_painel["data_referencia"])


FUNCOES_DO_PAINEL = [
    ("soldador", "Soldadores"),
    ("caldeireiro", "Caldeireiros"),
    ("eletricista", "Eletricistas"),
    ("pintor industrial", "Pintores industriais"),
    ("engenharia de inspeção", "Engenharia de inspeção"),
]


def se_sobrepoe(inicio_a, fim_a, inicio_b, fim_b):
    return inicio_a <= fim_b and inicio_b <= fim_a


def disponivel_na_semana(profissional, hoje):
    fim_da_semana = hoje + timedelta(days=6)
    for alocacao in profissional["alocacoes"]:
        if alocacao["status"] != "confirmada":
            continue
        inicio = date.fromisoformat(alocacao["inicio"])
        fim = date.fromisoformat(alocacao["fim"])
        if se_sobrepoe(hoje, fim_da_semana, inicio, fim):
            return False
    return True


def contar_disponiveis_por_funcao():
    hoje = data_de_referencia()
    profissionais = carregar_dados("profissionais.json")

    por_funcao = []
    total_disponiveis = 0
    for funcao, rotulo in FUNCOES_DO_PAINEL:
        do_grupo = [p for p in profissionais if p["funcao"] == funcao]
        livres = sum(1 for p in do_grupo if disponivel_na_semana(p, hoje))
        por_funcao.append({
            "funcao": funcao,
            "rotulo": rotulo,
            "disponiveis": livres,
            "total": len(do_grupo),
        })
        total_disponiveis += livres

    return {
        "semana": f"{total_disponiveis} de {len(profissionais)} nesta semana",
        "disponiveis": total_disponiveis,
        "total": len(profissionais),
        "por_funcao": por_funcao,
    }


def montar_alertas():
    hoje = data_de_referencia()
    profissionais = carregar_dados("profissionais.json")

    alertas_de_bloqueio = []
    alertas_sem_elegivel = []
    alertas_de_conflito = []
    alertas_de_vencimento = []

    for profissional in profissionais:
        for certificacao in profissional["certificacoes"]:
            codigo = certificacao["codigo"]
            validade = date.fromisoformat(certificacao["validade"])
            validade_formatada = validade.strftime("%d/%m")
            dias_restantes = (validade - hoje).days

            if dias_restantes < 0:
                if codigo in ("CBSP", "HUET"):
                    restricao = "offshore"
                else:
                    restricao = f"que exigem {codigo}"
                alertas_de_bloqueio.append({
                    "tipo": "bloqueio",
                    "titulo": "Bloqueio",
                    "gravidade": "critica",
                    "mensagem": (
                        f"{codigo} de {profissional['nome']} venceu em {validade_formatada}. "
                        f"Fora de escalas {restricao} até a renovação."
                    ),
                    "profissional_id": profissional["id"],
                    "ordem_id": None,
                })
            elif dias_restantes <= DIAS_PARA_VENCIMENTO_PROXIMO:
                alertas_de_vencimento.append({
                    "tipo": "vencimento_proximo",
                    "titulo": "Vencimento próximo",
                    "gravidade": "atencao",
                    "mensagem": (
                        f"{codigo} de {profissional['nome']} vence em "
                        f"{dias_restantes} dias ({validade_formatada})."
                    ),
                    "profissional_id": profissional["id"],
                    "ordem_id": None,
                })

        indicadas = [a for a in profissional["alocacoes"] if a["status"] == "indicada"]
        for alocacao_a, alocacao_b in combinations(indicadas, 2):
            inicio_a = date.fromisoformat(alocacao_a["inicio"])
            fim_a = date.fromisoformat(alocacao_a["fim"])
            inicio_b = date.fromisoformat(alocacao_b["inicio"])
            fim_b = date.fromisoformat(alocacao_b["fim"])
            if not se_sobrepoe(inicio_a, fim_a, inicio_b, fim_b):
                continue

            inicio = max(inicio_a, inicio_b)
            fim = min(fim_a, fim_b)
            if inicio == fim:
                quando = f"no dia {inicio.strftime('%d/%m')}"
            else:
                quando = f"entre {inicio.strftime('%d/%m')} e {fim.strftime('%d/%m')}"
            indicada = "indicada" if profissional["genero"] == "f" else "indicado"

            alertas_de_conflito.append({
                "tipo": "conflito_agenda",
                "titulo": "Conflito de agenda",
                "gravidade": "atencao",
                "mensagem": (
                    f"{profissional['nome']} está {indicada} para {alocacao_a['ordem_id']} e "
                    f"{alocacao_b['ordem_id']} {quando}."
                ),
                "profissional_id": profissional["id"],
                "ordem_id": None,
            })

    for ordem in obter_estado()["ordens"]:
        if ordem["estado"] != "sem_profissional_elegivel":
            continue
        nomes = " e ".join(r["nome"] for r in montar_requisitos(ordem.get("interpretacao")))
        if nomes:
            exigencia = f"exige {nomes}"
        else:
            exigencia = "não tem equipe elegível"
        alertas_sem_elegivel.append({
            "tipo": "sem_profissional_elegivel",
            "titulo": "Sem profissional elegível",
            "gravidade": "critica",
            "mensagem": f"{ordem['id']} {exigencia}. Nenhum profissional disponível está habilitado.",
            "profissional_id": None,
            "ordem_id": ordem["id"],
        })

    return alertas_de_bloqueio + alertas_sem_elegivel + alertas_de_conflito + alertas_de_vencimento

EQUIPAMENTOS = [
    ("Vaso de pressão", r"vaso de press[ãa]o"),
    ("Tanque de armazenamento", r"tanque"),
    ("Válvulas de segurança", r"v[áa]lvulas?"),
    ("Tubulação", r"tubula[çc][ãa]o"),
    ("Painel de distribuição", r"painel"),
]

ATIVIDADES = [
    ("Reparo com solda", r"solda"),
    ("inspeção", r"inspe[çc][ãa]o"),
    ("Limpeza interna", r"limpeza interna"),
    ("Pintura anticorrosiva", r"pintura"),
    ("Manutenção elétrica", r"manuten[çc][ãa]o el[ée]trica"),
]


def normalizar(texto):
    texto = unicodedata.normalize("NFKD", str(texto))
    return "".join(letra for letra in texto if not unicodedata.combining(letra)).casefold()


def trecho_do_texto(texto, padrao):
    encontrado = re.search(padrao, texto, re.IGNORECASE)
    return encontrado.group(0) if encontrado else None


def interpretar_descricao(descricao, local, prazo_iso):
    texto_completo = f"{descricao} {local}"
    texto_normalizado = normalizar(texto_completo)

    if re.search(r"plataforma|offshore", texto_normalizado):
        ambiente = "Offshore"
    else:
        ambiente = "Onshore"
    trecho_ambiente = trecho_do_texto(texto_completo, r"plataforma\s+[\w-]+|base\s+\w+")

    equipamento = "Equipamento não identificado"
    trecho_equipamento = None
    for nome, padrao in EQUIPAMENTOS:
        if re.search(padrao, descricao, re.IGNORECASE):
            equipamento = nome
            trecho_equipamento = trecho_do_texto(descricao, padrao)
            identificacao = trecho_do_texto(descricao, r"\b[A-Z]{1,3}-\d{2,4}\b")
            if identificacao and nome == "Vaso de pressão":
                equipamento = f"{nome} {identificacao}"
                trecho_equipamento = f"{trecho_equipamento} {identificacao}"
            break

    atividades = [
        nome for nome, padrao in ATIVIDADES
        if re.search(padrao, descricao, re.IGNORECASE)
    ]
    if atividades:
        atividades_texto = " · ".join(atividades)
    else:
        atividades_texto = "Atividade não identificada"

    if re.search(r"andaime|altura|\d+\s*metros", descricao, re.IGNORECASE):
        acesso = "Trabalho em altura"
        trecho_acesso = (
            trecho_do_texto(descricao, r"acesso[^.]*")
            or trecho_do_texto(descricao, r"andaime|altura")
        )
    else:
        acesso = "Sem restrição de acesso identificada"
        trecho_acesso = None

    duvidas = []
    espaco_confinado = None
    if re.search(r"interna|confinado|interior|entrada", texto_normalizado):
        espaco_confinado = True
    elif re.search(r"externo|sem entrada", texto_normalizado):
        espaco_confinado = False
    elif equipamento.startswith(("Vaso", "Tanque")):
        duvidas.append({
            "pergunta": "O reparo envolve entrada no interior do vaso (espaço confinado)?",
            "explicacao": "A descrição não deixa claro. A resposta muda as exigências da equipe.",
            "opcoes": ["Não, serviço externo", "Sim, há entrada no vaso"],
            "campo": "espaco_confinado",
            "valores": [False, True],
            "resposta": None,
        })
    else:
        espaco_confinado = False

    horas = re.search(r"(\d+)\s*horas", descricao, re.IGNORECASE)
    if horas:
        sufixo = " após o embarque" if "embarque" in texto_normalizado else ""
        prazo_texto = f"{horas.group(1)} horas{sufixo}"
    else:
        prazo_texto = "Até a data limite"

    return {
        "campos_extraidos": {
            "ambiente": {"valor": ambiente, "trecho_origem": trecho_ambiente},
            "equipamento": {"valor": equipamento, "trecho_origem": trecho_equipamento},
            "atividades": {
                "valor": atividades_texto,
                "trecho_origem": trecho_do_texto(
                    descricao,
                    r"reparo com solda|limpeza interna|pintura|inspe[çc][ãa]o|manuten[çc][ãa]o",
                ),
            },
            "condicao_de_acesso": {"valor": acesso, "trecho_origem": trecho_acesso},
            "prazo": {
                "valor": prazo_texto,
                "limite": prazo_iso,
                "trecho_origem": trecho_do_texto(descricao, r"prazo[^.]*"),
            },
        },
        "espaco_confinado": espaco_confinado,
        "duvidas_da_ia": duvidas,
    }


def converter_prazo(texto):
    """Aceita 2026-10-18 ou 18/10/2026."""
    texto = str(texto).strip()
    try:
        return date.fromisoformat(texto)
    except ValueError:
        dia, mes, ano = texto.split("/")
        return date(int(ano), int(mes), int(dia))


def criar_ordem(descricao, local, prazo):
    estado = obter_estado()
    numeros = [int(ordem["id"].split("-")[1]) for ordem in estado["ordens"]]
    novo_id = f"OS-{max(numeros) + 1}"

    interpretacao = interpretar_descricao(descricao, local, prazo.isoformat())
    campos = interpretacao["campos_extraidos"]
    primeira_atividade = campos["atividades"]["valor"].split(" · ")[0]
    equipamento = campos["equipamento"]["valor"]
    servico = f"{primeira_atividade} em {equipamento[0].lower()}{equipamento[1:]}"

    ordem = {
        "id": novo_id,
        "servico": servico,
        "resumo_equipe": "Equipe ainda não buscada",
        "local": local,
        "ambiente": campos["ambiente"]["valor"].lower(),
        "prazo": prazo.isoformat(),
        "estado": "rascunho",
        "descricao_texto": descricao,
        "janela": {
            "inicio": (prazo - timedelta(days=1)).isoformat(),
            "fim": (prazo + timedelta(days=1)).isoformat(),
        },
        "interpretacao": interpretacao,
    }
    estado["ordens"].append(ordem)
    return ordem

def condicao_atendida(condicao, interpretacao):
    campos = interpretacao["campos_extraidos"]
    nome_do_campo = condicao["campo"]

    if nome_do_campo in campos:
        valor = campos[nome_do_campo]["valor"]
    else:
        valor = interpretacao.get(nome_do_campo)

    if "valor" in condicao:
        esperado = condicao["valor"]
        if isinstance(esperado, bool):
            return valor is esperado
        return valor is not None and normalizar(valor) == normalizar(esperado)

    if "contem" in condicao:
        return valor is not None and normalizar(condicao["contem"]) in normalizar(valor)

    return False


def todas_atendidas(condicoes, interpretacao):
    return all(condicao_atendida(condicao, interpretacao) for condicao in condicoes)


def montar_requisitos(interpretacao):
    if not interpretacao:
        return []

    matriz = carregar_dados("matriz_habilitacoes.json")
    requisitos = []
    for regra in matriz["regras"]:
        if todas_atendidas(regra["se"], interpretacao):
            requisito = dict(regra["exige"])
            requisito["regra_id"] = regra["id"]
            requisito["descricao"] = f"{requisito['aplica_a_texto']} · {requisito['motivo']}"
            requisitos.append(requisito)
    return requisitos


def montar_composicao(interpretacao):
    if not interpretacao:
        return []

    matriz = carregar_dados("matriz_habilitacoes.json")
    for composicao in matriz["composicoes"]:
        if todas_atendidas(composicao["se"], interpretacao):
            return composicao["funcoes"]
    return []


def montar_resposta_da_ordem(ordem):
    resposta = dict(ordem)
    interpretacao = ordem.get("interpretacao")
    composicao = montar_composicao(interpretacao)
    resposta["requisitos"] = montar_requisitos(interpretacao)
    resposta["equipe_estimada"] = sum(item["qtd"] for item in composicao)
    return resposta