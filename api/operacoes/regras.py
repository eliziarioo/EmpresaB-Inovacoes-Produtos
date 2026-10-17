from datetime import date

from .dados import carregar_dados

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