import re
import unicodedata
from datetime import date, timedelta

from .dados import carregar_dados, obter_estado

DIAS_PARA_VENCIMENTO_PROXIMO = 45


def data_de_referencia():
    base_do_painel = carregar_dados("painel.json")
    return date.fromisoformat(base_do_painel["data_referencia"])


def montar_alertas():
    hoje = data_de_referencia()
    profissionais = carregar_dados("profissionais.json")

    alertas_de_bloqueio = []
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

    return alertas_de_bloqueio + alertas_de_vencimento

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