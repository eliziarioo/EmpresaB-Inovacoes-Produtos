import hmac
import re
import secrets

from django.conf import settings
from django.http import JsonResponse

from .dados import carregar_dados


# Sessões abertas: token -> perfil (sem a senha). Ficam só na memória do servidor.
SESSOES = {}

# Rotas liberadas mesmo sem login.
ROTAS_PUBLICAS = [
    r"^/entrar$",
    r"^/perfis$",
]

# Rotas que o técnico NÃO pode usar (só o gestor).
ROTAS_SOMENTE_GESTOR = [
    r"^/ordens$",
    r"^/ordens/[^/]+$",
    r"^/ordens/[^/]+/(interpretacao|equipes|equipes/buscar|equipe|equipe/aprovar|dossie)$",
    r"^/painel$",
    r"^/alertas$",
    r"^/profissionais$",
    r"^/profissionais/[^/]+$",
    r"^/demo/reiniciar$",
]

ROTA_DE_SERVICOS_DO_TECNICO = r"^/profissionais/([^/]+)/servicos$"


def perfil_publico(perfil):
    return {chave: valor for chave, valor in perfil.items() if chave not in ("usuario", "senha")}


def autenticar(usuario, senha):
    for perfil in carregar_dados("perfis.json"):
        usuario_confere = hmac.compare_digest(str(usuario or ""), perfil["usuario"])
        senha_confere = hmac.compare_digest(str(senha or ""), perfil["senha"])
        if usuario_confere and senha_confere:
            return perfil
    return None


def abrir_sessao(perfil):
    token = secrets.token_hex(16)
    SESSOES[token] = perfil_publico(perfil)
    return token


def extrair_token(request):
    cabecalho = request.headers.get("Authorization", "")
    prefixo = "Bearer "
    if cabecalho.startswith(prefixo):
        return cabecalho[len(prefixo):].strip()
    return None


class ControlePorPerfil:
    """
    Login de demonstração: POST /entrar (usuário e senha) devolve um token, e o
    front manda esse token em toda chamada (Authorization: Bearer <token>).

    A API descobre o perfil pelo token e bloqueia, para o técnico, as rotas do gestor.
    As contas são fictícias (dados/perfis.json): não é segurança de produção.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        recusa = self.verificar(request)
        if recusa is not None:
            return recusa
        return self.get_response(request)

    def verificar(self, request):
        request.perfil_logado = None
        if request.method == "OPTIONS":
            return None

        rota_publica = any(re.match(padrao, request.path) for padrao in ROTAS_PUBLICAS)

        token = extrair_token(request)
        if token:
            perfil = SESSOES.get(token)
            if perfil is not None:
                request.perfil_logado = perfil
            elif not rota_publica:
                return JsonResponse({"detail": "Sessão inválida ou expirada. Entre de novo."}, status=401)

        perfil = request.perfil_logado
        if perfil is None:
            if getattr(settings, "EXIGIR_PERFIL", False) and not rota_publica:
                return JsonResponse({"detail": "Faça login em /entrar e envie o token no cabeçalho Authorization."}, status=401)
            return None

        if perfil["tipo"] == "gestor":
            return None

        for padrao in ROTAS_SOMENTE_GESTOR:
            if re.match(padrao, request.path):
                return JsonResponse({"detail": "Este perfil não tem acesso a esta área (só o gestor)."}, status=403)

        servicos = re.match(ROTA_DE_SERVICOS_DO_TECNICO, request.path)
        if servicos and servicos.group(1) != perfil["profissional_id"]:
            return JsonResponse({"detail": "O técnico só pode ver os próprios serviços."}, status=403)

        return None