import re
import unicodedata
from collections import Counter
from datetime import date, datetime, timedelta
from itertools import combinations, product

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
    profissionais = obter_estado()["profissionais"]

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
    profissionais = obter_estado()["profissionais"]

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
        nomes = lista_com_e([r["nome"] for r in montar_requisitos(ordem.get("interpretacao"))])
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

NOMES_CURTOS_CERTIFICACAO = {
    "CREA": "CREA ativo",
    "SOLDADOR_QUALIFICADO": "qualificação de soldador",
}


def achar_ordem(id_ordem):
    for ordem in obter_estado()["ordens"]:
        if ordem["id"] == id_ordem:
            return ordem
    return None


def janela_da_ordem(ordem):
    janela = ordem["janela"]
    return date.fromisoformat(janela["inicio"]), date.fromisoformat(janela["fim"])


def validades_do_profissional(profissional):
    return {
        certificacao["codigo"]: date.fromisoformat(certificacao["validade"])
        for certificacao in profissional["certificacoes"]
    }


def certificacoes_exigidas_de(profissional, requisitos):
    codigos = []
    for requisito in requisitos:
        vale_para_ele = (
            requisito["aplica_a"] == "todos"
            or requisito.get("funcao") == profissional["funcao"]
        )
        if not vale_para_ele:
            continue
        for codigo in requisito["certificacoes"]:
            if codigo not in codigos:
                codigos.append(codigo)
    return codigos


def motivos_de_bloqueio(profissional, requisitos, janela, id_ordem):
    inicio, fim = janela
    validades = validades_do_profissional(profissional)
    motivos = []

    for codigo in certificacoes_exigidas_de(profissional, requisitos):
        nome = NOMES_CURTOS_CERTIFICACAO.get(codigo, codigo)
        validade = validades.get(codigo)

        if validade is None:
            motivos.append({"tipo": "documento", "texto": f"sem {nome}"})
        elif validade < inicio:
            motivos.append({
                "tipo": "documento",
                "texto": f"{nome} vencido em {validade.strftime('%d/%m')}",
            })
        elif validade < fim:
            motivos.append({
                "tipo": "documento",
                "texto": f"{nome} vence em {validade.strftime('%d/%m')}, durante o serviço",
            })

    for alocacao in profissional["alocacoes"]:
        if alocacao["status"] != "confirmada" or alocacao["ordem_id"] == id_ordem:
            continue
        inicio_alocacao = date.fromisoformat(alocacao["inicio"])
        fim_alocacao = date.fromisoformat(alocacao["fim"])
        if se_sobrepoe(inicio, fim, inicio_alocacao, fim_alocacao):
            motivos.append({
                "tipo": "agenda",
                "texto": f"embarcado na {alocacao['ordem_id']} até {fim_alocacao.strftime('%d/%m')}",
            })

    return motivos


def buscar_candidatos(ordem):
    interpretacao = ordem["interpretacao"]
    requisitos = montar_requisitos(interpretacao)
    composicao = montar_composicao(interpretacao)
    janela = janela_da_ordem(ordem)
    profissionais = obter_estado()["profissionais"]

    elegiveis_por_funcao = {}
    nao_considerados = []

    for item in composicao:
        funcao = item["funcao"]
        elegiveis = []

        for profissional in profissionais:
            if profissional["funcao"] != funcao:
                continue

            motivos = motivos_de_bloqueio(profissional, requisitos, janela, ordem["id"])

            if not motivos:
                elegiveis.append({"id": profissional["id"], "nome": profissional["nome"]})
            elif len(motivos) == 1:
                feminino = profissional["genero"] == "f"
                if motivos[0]["tipo"] == "documento":
                    tipo = "bloqueio"
                    prefixo = "Bloqueada" if feminino else "Bloqueado"
                else:
                    tipo = "indisponivel"
                    prefixo = "Indisponível"
                nao_considerados.append({
                    "profissional_id": profissional["id"],
                    "nome": profissional["nome"],
                    "cargo": profissional["cargo"],
                    "tipo": tipo,
                    "motivo": f"{prefixo}: {motivos[0]['texto']}",
                })

        elegiveis_por_funcao[funcao] = elegiveis

    nao_considerados.sort(key=lambda item: (item["tipo"] != "bloqueio", item["nome"]))

    return {
        "ordem_id": ordem["id"],
        "requisitos": requisitos,
        "composicao": composicao,
        "elegiveis_por_funcao": elegiveis_por_funcao,
        "nao_considerados": nao_considerados,
    }

def formatar_reais(valor):
    return "R$ " + f"{valor:,.0f}".replace(",", ".")


def custo_da_equipe(equipe, janela):
    dias = (janela[1] - janela[0]).days + 1
    return sum(
        profissional["custo_diaria"] * dias + profissional["custo_deslocamento"]
        for profissional in equipe
    )


def lista_com_e(nomes):
    if len(nomes) == 1:
        return nomes[0]
    return ", ".join(nomes[:-1]) + " e " + nomes[-1]


def resumo_da_equipe(equipe):
    nomes = lista_com_e([profissional["nome"].split()[0] for profissional in equipe])
    base_principal, _ = Counter(profissional["base"] for profissional in equipe).most_common(1)[0]
    de_fora = [profissional for profissional in equipe if profissional["base"] != base_principal]

    if not de_fora:
        return f"{nomes} · {base_principal}"

    notas = ", ".join(f"{p['funcao']} vem de {p['base']}" for p in de_fora)
    return f"{nomes} · {notas}"


PLURAL_DA_FUNCAO = {
    "soldador": "soldadores",
    "caldeireiro": "caldeireiros",
    "engenharia de inspeção": "profissionais de inspeção",
}

NUMEROS_POR_EXTENSO = {2: "dois", 3: "três", 4: "quatro", 5: "cinco", 6: "seis"}

ROTULOS_ESTADO = {
    "rascunho": "Rascunho",
    "aguardando_aprovacao": "Aguardando aprovação",
    "sem_profissional_elegivel": "Sem profissional elegível",
    "equipe_aprovada": "Equipe aprovada",
    "em_execucao": "Em execução",
    "concluida": "Concluída",
    "replanejamento": "Em replanejamento",
}


def iniciais_do_nome(nome):
    partes = nome.split()
    return (partes[0][0] + partes[-1][0]).upper()


def faixa_de_dias(inicio, fim):
    if inicio.month == fim.month and inicio.year == fim.year:
        return f"{inicio.day} a {fim.day}/{fim.month:02d}"
    return f"{inicio.strftime('%d/%m')} a {fim.strftime('%d/%m')}"


def tem_certificacao_valida(profissional, codigo, fim_do_servico):
    validade = validades_do_profissional(profissional).get(codigo)
    return validade is not None and validade >= fim_do_servico


def conflito_de_indicacao(profissional, id_ordem, janela):
    inicio, fim = janela
    for alocacao in profissional["alocacoes"]:
        if alocacao["status"] != "indicada" or alocacao["ordem_id"] == id_ordem:
            continue
        inicio_alocacao = date.fromisoformat(alocacao["inicio"])
        fim_alocacao = date.fromisoformat(alocacao["fim"])
        if not se_sobrepoe(inicio, fim, inicio_alocacao, fim_alocacao):
            continue

        inicio_do_conflito = max(inicio, inicio_alocacao)
        indicada = "indicada" if profissional["genero"] == "f" else "indicado"
        outra = alocacao["ordem_id"]
        return {
            "ordem_id": outra,
            "data": inicio_do_conflito.isoformat(),
            "mensagem": (
                f"Conflito: também {indicada} para {outra} em "
                f"{inicio_do_conflito.strftime('%d/%m')}. "
                f"Se aprovar aqui, a {outra} volta para replanejamento."
            ),
        }
    return None


def rotulo_da_certificacao(codigo, profissional, validade, tem_crea):
    if codigo == "NR-13":
        return "NR-13 · CREA ativo" if tem_crea else "NR-13"

    if codigo == "SOLDADOR_QUALIFICADO":
        nome = "Soldadora qualificada" if profissional["genero"] == "f" else "Soldador qualificado"
    else:
        nome = codigo
    return f"{nome} até {validade.month:02d}/{validade.year}"


def certificacoes_para_exibir(profissional, requisitos):
    especificos = [r for r in requisitos if r.get("funcao") == profissional["funcao"]]
    comuns = [r for r in requisitos if r["aplica_a"] == "todos"]

    codigos = []
    for requisito in especificos + comuns:
        for codigo in requisito["certificacoes"]:
            if codigo != "CREA" and codigo not in codigos:
                codigos.append(codigo)

    validades = validades_do_profissional(profissional)
    tem_crea = "CREA" in validades

    resultado = []
    for codigo in codigos:
        if codigo in validades:
            resultado.append({
                "codigo": codigo,
                "validade": validades[codigo].isoformat(),
                "rotulo": rotulo_da_certificacao(codigo, profissional, validades[codigo], tem_crea),
            })
    return resultado


def visao_do_membro(profissional, ordem, requisitos, composicao, janela):
    item = next((i for i in composicao if i["funcao"] == profissional["funcao"]), None)
    if item and item.get("historico_como_detalhe") and profissional["reparos_parecidos"]:
        detalhe = f"{profissional['reparos_parecidos']} reparos parecidos em vasos de pressão"
    elif item:
        detalhe = item["papel"]
    else:
        detalhe = None

    motivos = motivos_de_bloqueio(profissional, requisitos, janela, ordem["id"])
    problemas = [motivo["texto"] for motivo in motivos]

    motivo_de_agenda = next((m for m in motivos if m["tipo"] == "agenda"), None)
    if motivo_de_agenda:
        disponibilidade = f"Indisponível: {motivo_de_agenda['texto']}"
    else:
        disponibilidade = f"Livre de {faixa_de_dias(*janela)}"

    return {
        "id": profissional["id"],
        "nome": profissional["nome"],
        "iniciais": iniciais_do_nome(profissional["nome"]),
        "cargo": profissional["cargo"],
        "funcao": profissional["funcao"],
        "base": profissional["base"],
        "detalhe": detalhe,
        "disponibilidade": disponibilidade,
        "certificacoes": certificacoes_para_exibir(profissional, requisitos),
        "conflito": conflito_de_indicacao(profissional, ordem["id"], janela),
        "problemas": problemas,
    }


def avaliar_requisitos_da_equipe(equipe, requisitos, fim_do_servico):
    atendidos = 0
    total = 0
    pendentes = []

    for requisito in requisitos:
        total += len(requisito["chips"])

        if requisito["aplica_a"] == "todos":
            responsaveis = equipe
            ok = bool(equipe) and all(
                all(
                    tem_certificacao_valida(pessoa, codigo, fim_do_servico)
                    for codigo in requisito["certificacoes"]
                )
                for pessoa in responsaveis
            )
        else:
            responsaveis = [
                pessoa for pessoa in equipe
                if requisito.get("funcao") in (None, pessoa["funcao"])
            ]
            ok = any(
                all(
                    tem_certificacao_valida(pessoa, codigo, fim_do_servico)
                    for codigo in requisito["certificacoes"]
                )
                for pessoa in responsaveis
            )

        if ok:
            atendidos += len(requisito["chips"])
        else:
            pendentes.append(requisito["nome"])

    return atendidos, total, pendentes


def montar_visao_da_equipe(ordem, equipe, rotulo, recomendada=False):
    interpretacao = ordem["interpretacao"]
    requisitos = montar_requisitos(interpretacao)
    composicao = montar_composicao(interpretacao)
    janela = janela_da_ordem(ordem)

    membros = [visao_do_membro(p, ordem, requisitos, composicao, janela) for p in equipe]
    atendidos, total, pendentes = avaliar_requisitos_da_equipe(equipe, requisitos, janela[1])
    custo = custo_da_equipe(equipe, janela)
    valida = bool(equipe) and atendidos == total and not any(m["problemas"] for m in membros)

    return {
        "rotulo": rotulo,
        "recomendada": recomendada,
        "profissionais": membros,
        "requisitos_atendidos": atendidos,
        "requisitos_total": total,
        "requisitos_pendentes": pendentes,
        "valida": valida,
        "custo_estimado": custo,
        "custo_estimado_texto": formatar_reais(custo),
    }


def montar_justificativas(equipe, todas_as_equipes, elegiveis_por_funcao, composicao, ordem):
    janela = janela_da_ordem(ordem)
    linhas = ["Todos atendem aos requisitos obrigatórios, com documentos válidos na data do serviço."]

    bases = {profissional["base"] for profissional in equipe}
    if len(bases) == 1 and len(equipe) > 1:
        quantidade = NUMEROS_POR_EXTENSO.get(len(equipe), str(len(equipe)))
        base = next(iter(bases))
        if ordem["ambiente"] == "offshore":
            linhas.append(f"Os {quantidade} estão em {base} e embarcam pelo mesmo voo.")
        else:
            linhas.append(f"Os {quantidade} estão em {base}, sem deslocamento entre bases.")

    for item in composicao:
        candidatos = elegiveis_por_funcao[item["funcao"]]
        if len(candidatos) < 2:
            continue

        maior_historico = max(candidato["reparos_parecidos"] for candidato in candidatos)
        for membro in equipe:
            if (
                membro["funcao"] == item["funcao"]
                and maior_historico > 0
                and membro["reparos_parecidos"] == maior_historico
            ):
                plural = PLURAL_DA_FUNCAO.get(item["funcao"], "profissionais")
                linhas.append(
                    f"{membro['nome'].split()[0]} tem o maior número de reparos parecidos "
                    f"entre os {plural} elegíveis."
                )

    menor_custo = min(custo_da_equipe(e, janela) for e in todas_as_equipes)
    if custo_da_equipe(equipe, janela) == menor_custo:
        linhas.append("É a equipe elegível com menor custo estimado.")

    return linhas


def buscar_equipes(ordem):
    resposta = buscar_candidatos(ordem)
    composicao = resposta["composicao"]
    janela = janela_da_ordem(ordem)
    profissionais_por_id = {p["id"]: p for p in obter_estado()["profissionais"]}

    elegiveis_completos = {}
    opcoes_por_item = []
    for item in composicao:
        elegiveis = resposta["elegiveis_por_funcao"][item["funcao"]]
        candidatos = [profissionais_por_id[elegivel["id"]] for elegivel in elegiveis]
        elegiveis_completos[item["funcao"]] = candidatos
        opcoes_por_item.append([list(grupo) for grupo in combinations(candidatos, item["qtd"])])

    equipes = []
    if composicao and all(opcoes_por_item):
        for combinacao in product(*opcoes_por_item):
            equipes.append([profissional for grupo in combinacao for profissional in grupo])

    equipes.sort(key=lambda equipe: (
        custo_da_equipe(equipe, janela),
        -sum(profissional["reparos_parecidos"] for profissional in equipe),
    ))

    resposta["estado"] = ordem["estado"]
    resposta["estado_rotulo"] = ROTULOS_ESTADO[ordem["estado"]]
    resposta["servico"] = ordem["servico"]
    resposta["local"] = ordem["local"]
    resposta["prazo"] = ordem["prazo"]
    resposta["janela"] = ordem["janela"]
    resposta["requisitos_obrigatorios"] = [
        chip for requisito in resposta["requisitos"] for chip in requisito["chips"]
    ]
    resposta["recomendada"] = None
    resposta["justificativas"] = []
    resposta["alternativas_elegiveis"] = []
    resposta["mensagem"] = None
    resposta["equipe_ajustada"] = visao_da_equipe_ajustada(ordem)
    resposta["equipe_aprovada"] = visao_da_equipe_aprovada(ordem)

    if not equipes:
        exigencias = ", ".join(requisito["nome"] for requisito in resposta["requisitos"])
        resposta["mensagem"] = (
            "Nenhum profissional disponível está habilitado para esta ordem. "
            f"Exigências: {exigencias}."
        )
        return resposta

    melhor = equipes[0]
    resposta["recomendada"] = montar_visao_da_equipe(ordem, melhor, "Equipe A", recomendada=True)
    resposta["justificativas"] = montar_justificativas(
        melhor, equipes, elegiveis_completos, composicao, ordem
    )

    for posicao, equipe in enumerate(equipes[:2]):
        custo = custo_da_equipe(equipe, janela)
        resposta["alternativas_elegiveis"].append({
            "rotulo": f"Equipe {chr(65 + posicao)}",
            "recomendada": posicao == 0,
            "resumo": resumo_da_equipe(equipe),
            "custo_estimado": custo,
            "custo_estimado_texto": formatar_reais(custo),
            "profissionais_ids": [profissional["id"] for profissional in equipe],
        })

    return resposta

def atualizar_estado_apos_busca(ordem):
    resultado = buscar_equipes(ordem)

    if resultado["recomendada"] is None:
        ordem["estado"] = "sem_profissional_elegivel"
        ordem["resumo_equipe"] = "Nenhuma equipe elegível"
    else:
        quantidade = len(resultado["recomendada"]["profissionais"])
        ordem["estado"] = "aguardando_aprovacao"
        ordem["resumo_equipe"] = f"Equipe sugerida · {quantidade} profissionais"

    return buscar_equipes(ordem)


def corrigir_interpretacao(ordem, corpo):
    interpretacao = ordem.get("interpretacao")
    if not interpretacao:
        raise ValueError("Esta ordem não tem leitura da IA para corrigir.")

    if "duvida" in corpo:
        posicao = int(corpo["duvida"])
        duvida = interpretacao["duvidas_da_ia"][posicao]
        resposta = corpo.get("resposta")

        if isinstance(resposta, int):
            indice = resposta
        elif resposta in duvida["opcoes"]:
            indice = duvida["opcoes"].index(resposta)
        else:
            raise ValueError("Resposta inválida. Opções: " + " | ".join(duvida["opcoes"]))

        duvida["resposta"] = duvida["opcoes"][indice]
        interpretacao[duvida["campo"]] = duvida["valores"][indice]

    elif "campo" in corpo:
        campo = corpo["campo"]
        if campo not in interpretacao["campos_extraidos"]:
            raise ValueError(f"Campo desconhecido: {campo}")
        interpretacao["campos_extraidos"][campo]["valor"] = corpo["valor"]
        interpretacao["campos_extraidos"][campo]["corrigido"] = True

    else:
        raise ValueError("Envie 'campo' e 'valor', ou 'duvida' e 'resposta'.")

    if ordem["estado"] in ("aguardando_aprovacao", "sem_profissional_elegivel"):
        atualizar_estado_apos_busca(ordem)

def achar_profissional(id_profissional):
    for profissional in obter_estado()["profissionais"]:
        if profissional["id"] == id_profissional:
            return profissional
    return None


def ids_da_equipe_atual(ordem):
    estado = obter_estado()

    if ordem.get("equipe_aprovada"):
        return ordem["equipe_aprovada"]
    if estado["equipes_ajustadas"].get(ordem["id"]):
        return estado["equipes_ajustadas"][ordem["id"]]

    resultado = buscar_equipes(ordem)
    if resultado["recomendada"]:
        return [membro["id"] for membro in resultado["recomendada"]["profissionais"]]
    return []


def visao_da_equipe_ajustada(ordem):
    ids = obter_estado()["equipes_ajustadas"].get(ordem["id"])
    if not ids:
        return None
    equipe = [achar_profissional(id_profissional) for id_profissional in ids]
    return montar_visao_da_equipe(ordem, equipe, "Equipe ajustada")


def visao_da_equipe_aprovada(ordem):
    ids = ordem.get("equipe_aprovada")
    if not ids:
        return None
    equipe = [achar_profissional(id_profissional) for id_profissional in ids]
    return montar_visao_da_equipe(ordem, equipe, "Equipe aprovada")


def ajustar_equipe(ordem, ids):
    profissionais = []
    for id_profissional in ids:
        profissional = achar_profissional(id_profissional)
        if profissional is None:
            raise LookupError(f"Profissional {id_profissional} não encontrado")
        profissionais.append(profissional)

    obter_estado()["equipes_ajustadas"][ordem["id"]] = list(ids)
    return montar_visao_da_equipe(ordem, profissionais, "Equipe ajustada")


def aprovar_equipe(ordem):
    estado = obter_estado()
    ids = ids_da_equipe_atual(ordem)
    if not ids:
        raise PermissionError("Não há equipe elegível para aprovar.")

    equipe = [achar_profissional(id_profissional) for id_profissional in ids]
    visao = montar_visao_da_equipe(ordem, equipe, "Equipe aprovada")
    if not visao["valida"]:
        problemas = [
            f"{membro['nome']}: {problema}"
            for membro in visao["profissionais"]
            for problema in membro["problemas"]
        ] + [f"Requisito não atendido: {pendente}" for pendente in visao["requisitos_pendentes"]]
        raise PermissionError("A equipe não atende aos requisitos. " + "; ".join(problemas))

    inicio, fim = janela_da_ordem(ordem)
    replanejadas = {}

    for profissional in equipe:
        alocacoes_mantidas = []
        for alocacao in profissional["alocacoes"]:
            mesma_ordem = alocacao["ordem_id"] == ordem["id"]
            em_conflito = (
                alocacao["status"] == "indicada"
                and not mesma_ordem
                and se_sobrepoe(
                    inicio, fim,
                    date.fromisoformat(alocacao["inicio"]),
                    date.fromisoformat(alocacao["fim"]),
                )
            )

            if em_conflito:
                outra_ordem = achar_ordem(alocacao["ordem_id"])
                if outra_ordem is not None:
                    outra_ordem["estado"] = "replanejamento"
                    outra_ordem["resumo_equipe"] = "Voltou para replanejamento"
                alocado = "alocada" if profissional["genero"] == "f" else "alocado"
                replanejadas[alocacao["ordem_id"]] = {
                    "ordem_id": alocacao["ordem_id"],
                    "motivo": f"{profissional['nome']} foi {alocado} na {ordem['id']}.",
                }
            elif not mesma_ordem:
                alocacoes_mantidas.append(alocacao)

        alocacoes_mantidas.append({
            "ordem_id": ordem["id"],
            "inicio": inicio.isoformat(),
            "fim": fim.isoformat(),
            "status": "confirmada",
        })
        profissional["alocacoes"] = alocacoes_mantidas

    ordem["estado"] = "equipe_aprovada"
    ordem["resumo_equipe"] = f"Equipe de {len(equipe)} profissionais"
    ordem["equipe_aprovada"] = list(ids)
    estado["equipes_ajustadas"].pop(ordem["id"], None)

    mensagem = f"Você foi escalado na {ordem['id']}: {ordem['servico']}."
    embarque = ordem.get("embarque")
    if embarque:
        mensagem += f" Embarque em {dia_mes(date.fromisoformat(embarque['data']))} às {embarque['hora']}."

    notificados = []
    for profissional in equipe:
        estado["notificacoes"].append({
            "profissional_id": profissional["id"],
            "ordem_id": ordem["id"],
            "mensagem": mensagem,
        })
        notificados.append({"id": profissional["id"], "nome": profissional["nome"]})

    return notificados, list(replanejadas.values())

def achar_documento(id_documento):
    for documento in carregar_dados("documentos.json"):
        if documento["id"] == id_documento:
            return documento
    return None


def montar_dossie(ordem):
    ids = ids_da_equipe_atual(ordem)
    if not ids:
        raise LookupError("Não há equipe para gerar o dossiê.")

    equipe = [achar_profissional(id_profissional) for id_profissional in ids]
    requisitos = montar_requisitos(ordem.get("interpretacao"))
    _, fim = janela_da_ordem(ordem)

    itens = []
    for requisito in requisitos:
        for profissional in equipe:
            vale_para_a_pessoa = (
                requisito["aplica_a"] == "todos"
                or requisito.get("funcao") == profissional["funcao"]
            )
            if not vale_para_a_pessoa:
                continue

            validades = validades_do_profissional(profissional)
            for codigo in requisito["certificacoes"]:
                validade = validades.get(codigo)
                itens.append({
                    "requisito": requisito["nome"],
                    "profissional": profissional["nome"],
                    "documento": NOMES_CURTOS_CERTIFICACAO.get(codigo, codigo),
                    "validade": validade.isoformat() if validade else None,
                    "situacao": "válido" if validade and validade >= fim else "inválido",
                })

    atendidos, total, _ = avaliar_requisitos_da_equipe(equipe, requisitos, fim)
    matriz = carregar_dados("matriz_habilitacoes.json")
    documentos = [achar_documento(id_documento) for id_documento in ordem.get("documentos_autorizados", [])]

    return {
        "ordem_id": ordem["id"],
        "servico": ordem["servico"],
        "estado": ordem["estado"],
        "estado_rotulo": ROTULOS_ESTADO[ordem["estado"]],
        "gerado_em": data_de_referencia().isoformat(),
        "matriz_habilitacoes": {
            "versao": matriz["versao"],
            "aprovada_por": matriz["aprovada_por"],
            "aprovada_em": matriz["aprovada_em"],
        },
        "conformidade": f"{atendidos} de {total} requisitos atendidos",
        "equipe": [{"id": p["id"], "nome": p["nome"], "cargo": p["cargo"]} for p in equipe],
        "itens": itens,
        "documentos_autorizados": [
            {"id": d["id"], "codigo": d["codigo"], "titulo": d["titulo_completo"], "versao": d["versao"]}
            for d in documentos if d
        ],
    }

DIAS_DA_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]


def dia_mes(data):
    return f"{data.day:02d}/{data.month:02d}"


def quando_em_texto(data, hoje):
    if data == hoje:
        return f"hoje, {dia_mes(data)}"
    if data == hoje + timedelta(days=1):
        return f"amanhã, {dia_mes(data)}"
    return dia_mes(data)


def montar_aviso_de_embarque(ordem, hoje):
    embarque = ordem.get("embarque")
    if not embarque:
        return None

    quando = quando_em_texto(date.fromisoformat(embarque["data"]), hoje)
    if ordem["estado"] in ("equipe_aprovada", "em_execucao"):
        return {"tipo": "confirmado", "mensagem": f"Embarque confirmado · {quando}, às {embarque['hora']}"}
    return {
        "tipo": "previsto",
        "mensagem": f"Embarque previsto · {quando}, às {embarque['hora']} (aguardando aprovação da equipe)",
    }


def montar_servico_do_profissional(profissional, ordem, hoje):
    composicao = montar_composicao(ordem.get("interpretacao"))
    item = next((i for i in composicao if i["funcao"] == profissional["funcao"]), None)

    nomes_dos_colegas = []
    for id_membro in ids_da_equipe_atual(ordem):
        if id_membro != profissional["id"]:
            nomes_dos_colegas.append(achar_profissional(id_membro)["nome"])
    equipe_texto = lista_com_e(nomes_dos_colegas + ["você"]) if nomes_dos_colegas else None

    avisos = []
    aviso_de_embarque = montar_aviso_de_embarque(ordem, hoje)
    if aviso_de_embarque:
        avisos.append(aviso_de_embarque)
    for aviso in ordem.get("avisos_equipe", []):
        avisos.append({"tipo": "atencao", "mensagem": f"Atenção · {aviso}"})

    prazo_texto = dia_mes(date.fromisoformat(ordem["prazo"]))
    if ordem.get("interpretacao"):
        prazo_texto += " · " + ordem["interpretacao"]["campos_extraidos"]["prazo"]["valor"]

    documentos = [achar_documento(id_documento) for id_documento in ordem.get("documentos_autorizados", [])]
    return {
        "ordem_id": ordem["id"],
        "titulo": ordem["servico"],
        "estado": ordem["estado"],
        "estado_rotulo": ROTULOS_ESTADO[ordem["estado"]],
        "local_detalhe": ordem.get("local_detalhe", ordem["local"]),
        "prazo": ordem["prazo"],
        "prazo_texto": prazo_texto,
        "equipe_texto": equipe_texto,
        "sua_funcao": item["papel_detalhado"] if item else None,
        "avisos": avisos,
        "embarque": ordem.get("embarque"),
        "documentos": [
            {"id": d["id"], "titulo": d["titulo"], "descricao_curta": d["descricao_curta"], "tipo": d["tipo"]}
            for d in documentos if d
        ],
    }


def montar_servicos_do_profissional(profissional, incluir_indicados=False):
    hoje = data_de_referencia()
    status_aceitos = ("confirmada", "indicada") if incluir_indicados else ("confirmada",)

    alocacoes = sorted(profissional["alocacoes"], key=lambda alocacao: alocacao["inicio"])
    servicos = []
    for alocacao in alocacoes:
        if alocacao["status"] not in status_aceitos:
            continue
        ordem = achar_ordem(alocacao["ordem_id"])
        if ordem is None or ordem["estado"] == "concluida":
            continue
        servicos.append(montar_servico_do_profissional(profissional, ordem, hoje))

    notificacoes = [
        notificacao for notificacao in obter_estado()["notificacoes"]
        if notificacao["profissional_id"] == profissional["id"]
    ]
    return {
        "profissional": {
            "id": profissional["id"],
            "nome": profissional["nome"],
            "primeiro_nome": profissional["nome"].split()[0],
            "iniciais": iniciais_do_nome(profissional["nome"]),
        },
        "data_texto": f"{DIAS_DA_SEMANA[hoje.weekday()]}, {hoje.day} de {MESES[hoje.month - 1]}",
        "avisos": servicos[0]["avisos"] if servicos else [],
        "proximo_servico": servicos[0] if servicos else None,
        "servicos": servicos,
        "notificacoes": notificacoes,
    }


def pergunta_contem(texto_normalizado, palavra_chave):
    padrao = r"\b" + re.escape(normalizar(palavra_chave)) + r"\b"
    return re.search(padrao, texto_normalizado) is not None


def achar_responsavel_pela_inspecao(ordem):
    if not ordem:
        return None

    for id_membro in ids_da_equipe_atual(ordem):
        membro = achar_profissional(id_membro)
        if membro and membro["funcao"] == "engenharia de inspeção":
            partes_do_nome = membro["nome"].split()
            return {
                "profissional_id": membro["id"],
                "nome": membro["nome"],
                "rotulo": f"Falar com {partes_do_nome[0]} {partes_do_nome[-1]}",
            }
    return None


def responder_pergunta(pergunta, ordem):
    chat = carregar_dados("chat_respostas.json")
    texto = normalizar(pergunta)
    autorizados = ordem.get("documentos_autorizados", []) if ordem else []

    escolhida = None
    for candidata in chat["respostas"]:
        if any(pergunta_contem(texto, palavra) for palavra in candidata["palavras_chave"]):
            escolhida = candidata
            break

    if escolhida and escolhida["tipo"] == "resposta":
        documento = achar_documento(escolhida["citacao"]["documento_id"])
        if documento and documento["id"] in autorizados:
            return {
                "tipo": "resposta",
                "resposta": escolhida["resposta"],
                "passos": escolhida["passos"],
                "citacao": {
                    "documento_id": documento["id"],
                    "codigo": documento["codigo"],
                    "titulo": documento["titulo_completo"],
                    "versao": documento["versao"],
                    "secao": escolhida["citacao"]["secao"],
                    "pagina": escolhida["citacao"]["pagina"],
                    "trecho": escolhida["citacao"]["trecho"],
                    "arquivo_url": f"/documentos/{documento['id']}/arquivo",
                },
                "aviso": chat["aviso"],
                "escalar_para": None,
            }

    padrao = chat["resposta_nao_encontrada"]
    texto_da_resposta = padrao["resposta"]
    if escolhida and escolhida["tipo"] == "nao_encontrada":
        texto_da_resposta = escolhida["resposta"]

    return {
        "tipo": "nao_encontrada",
        "titulo": padrao["titulo"],
        "resposta": texto_da_resposta,
        "complemento": padrao["complemento"],
        "citacao": None,
        "aviso": chat["aviso"],
        "escalar_para": achar_responsavel_pela_inspecao(ordem),
    }


# ---------------------------------------------------------------------------
# Administração: documentos da empresa, usuários e auditoria
# O envio de documento é simulado: fica só na memória e não muda as respostas do assistente
# (o assistente continua lendo documentos.json).
# ---------------------------------------------------------------------------

STATUS_NO_ENVIO_DE_DOCUMENTO = ("rascunho", "aprovado")


class DocumentoInvalido(Exception):
    def __init__(self, erros):
        super().__init__("Documento inválido.")
        self.erros = erros


def listar_documentos_visiveis(perfil):
    documentos = obter_estado()["documentos"]
    if perfil is not None and perfil["tipo"] == "tecnico":
        return [d for d in documentos if d["status"] == "aprovado"]
    return documentos


def listar_usuarios():
    return obter_estado()["usuarios"]


def registrar_auditoria(ator, acao, objeto, versao, ator_tipo="usuario"):
    auditoria = obter_estado()["auditoria"]
    auditoria.append({
        "id": f"aud-{len(auditoria) + 1:03d}",
        "data_hora": datetime.now().replace(microsecond=0).isoformat(),
        "ator": ator,
        "ator_tipo": ator_tipo,
        "acao": acao,
        "objeto": objeto,
        "versao": f"v{versao}",
    })


def listar_auditoria(limite=None):
    eventos = sorted(obter_estado()["auditoria"], key=lambda e: (e["data_hora"], e["id"]), reverse=True)
    return eventos[:limite] if limite else eventos


def cadastrar_documento(dados, ator):
    codigo = str(dados.get("codigo") or "").strip()
    versao = str(dados.get("versao") or "").strip()
    titulo = str(dados.get("titulo") or "").strip()
    status = dados.get("status") or "rascunho"
    data_aprovacao = dados.get("data_aprovacao")
    aplica_se_a = dados.get("aplica_se_a") or []

    erros = {}
    if not codigo:
        erros["codigo"] = "Informe o código do documento."
    if not versao:
        erros["versao"] = "Informe a versão."
    if not titulo:
        erros["titulo"] = "Informe o título."
    if status not in STATUS_NO_ENVIO_DE_DOCUMENTO:
        erros["status"] = "Use 'rascunho' ou 'aprovado'."
    if not isinstance(aplica_se_a, list):
        erros["aplica_se_a"] = "Envie uma lista de equipamentos ou tipos de OS."
    if status == "aprovado" and data_aprovacao:
        try:
            date.fromisoformat(str(data_aprovacao))
        except ValueError:
            erros["data_aprovacao"] = "Use a data no formato AAAA-MM-DD."
    if erros:
        raise DocumentoInvalido(erros)

    documentos = obter_estado()["documentos"]
    for existente in documentos:
        if existente["codigo"].lower() == codigo.lower() and existente["versao"] == versao:
            raise LookupError(f"Já existe o documento {codigo} na versão {versao}.")

    if status == "aprovado":
        aprovado_em = str(data_aprovacao) if data_aprovacao else data_de_referencia().isoformat()
        data_br = date.fromisoformat(aprovado_em).strftime("%d/%m/%Y")
        descricao_curta = f"Versão {versao} · aprovado em {data_br}"
    else:
        aprovado_em = None
        descricao_curta = f"Versão {versao} · rascunho"

    numeros = [int(d["id"].split("-")[1]) for d in documentos]
    documento = {
        "id": f"doc-{max(numeros, default=0) + 1:03d}",
        "codigo": codigo,
        "titulo": titulo,
        "titulo_completo": titulo,
        "tipo": None,
        "versao": versao,
        "status": status,
        "aprovado_em": aprovado_em,
        "aplica_se_a": [str(item).strip() for item in aplica_se_a if str(item).strip()],
        "descricao_curta": descricao_curta,
        "arquivo": None,
    }
    documentos.append(documento)

    registrar_auditoria(ator, "enviou", codigo, versao)
    if status == "aprovado":
        registrar_auditoria(ator, "aprovou", codigo, versao)
    return documento
