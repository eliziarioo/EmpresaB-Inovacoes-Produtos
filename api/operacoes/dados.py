import json

from django.conf import settings


def carregar_dados(nome_arquivo):
    caminho = settings.BASE_DIR / "dados" / nome_arquivo
    with open(caminho, encoding="utf-8") as arquivo:
        return json.load(arquivo)

_estado = None


def reiniciar_estado():
    global _estado
    _estado = {
        "ordens": carregar_dados("ordens_de_servico.json"),
        "profissionais": carregar_dados("profissionais.json"),
        "equipes_ajustadas": {},
        "notificacoes": [],
    }


def obter_estado():
    if _estado is None:
        reiniciar_estado()
    return _estado