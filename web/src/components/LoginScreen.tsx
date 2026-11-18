import { useState, type FormEvent } from 'react';
import { AlertTriangle, Cpu, Eye, EyeOff, Lock, ShieldCheck, Wrench } from 'lucide-react';
import { ApiError, login, type UsuarioSessao } from '../api/client.js';

interface LoginScreenProps {
  onSuccess: (usuario: UsuarioSessao) => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);

    if (!usuario.trim() || !senha) {
      setErro('Informe seu usuário e sua senha para entrar no laboratório.');
      return;
    }

    setCarregando(true);
    try {
      const authenticated = await login(usuario.trim(), senha);
      onSuccess(authenticated);
    } catch (err) {
      if (err instanceof ApiError) {
        setErro(err.message);
      } else {
        setErro('Não foi possível conectar ao servidor do laboratório. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
        {/* Coluna institucional do laboratório */}
        <section className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-8 lg:col-span-7">
          <div>
            <div className="flex items-center gap-3 text-sky-400">
              <Cpu className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span className="text-base font-bold tracking-tight text-slate-50">VIRTUHAR3D</span>
            </div>

            <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
              Laboratório Virtual de Montagem e Manutenção de Computadores
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
              Pratique montagem em bancada 3D, protocolo antiestático, verificação de
              compatibilidade e teste de inicialização (POST — Power-On Self-Test) com feedback
              imediato e acessível.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 border-t border-slate-800 pt-6 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <span>Protocolo ESD</span>
              </div>
              <p className="mt-1.5 text-sm text-slate-400">
                Aterramento obrigatório antes de tocar em CPU, memória ou placa-mãe.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Wrench className="h-4 w-4 text-sky-400" aria-hidden="true" />
                <span>Regras Técnicas</span>
              </div>
              <p className="mt-1.5 text-sm text-slate-400">
                Validação em tempo real de soquete, tipo de memória, ordem e cabos.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Lock className="h-4 w-4 text-amber-400" aria-hidden="true" />
                <span>Rede Escolar Local</span>
              </div>
              <p className="mt-1.5 text-sm text-slate-400">
                Sessões protegidas sem coleta de dados pessoais sensíveis.
              </p>
            </div>
          </div>
        </section>

        {/* Formulário de autenticação (US-01) */}
        <section
          aria-labelledby="titulo-login"
          className="flex flex-col justify-center rounded-xl border border-slate-800 bg-slate-900 p-8 lg:col-span-5"
        >
          <h2 id="titulo-login" className="text-xl font-semibold text-slate-50">
            Entrar no laboratório
          </h2>
          <p className="mt-1.5 text-sm text-slate-400">
            Use o usuário e a senha fornecidos pelo professor da turma.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            <div>
              <label htmlFor="login-usuario" className="block text-sm font-medium text-slate-200">
                Usuário
              </label>
              <input
                id="login-usuario"
                name="usuario"
                type="text"
                autoComplete="username"
                required
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="ex.: aluno.teste"
                className="mt-2 block min-h-[44px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div>
              <label htmlFor="login-senha" className="block text-sm font-medium text-slate-200">
                Senha
              </label>
              <div className="relative mt-2">
                <input
                  id="login-senha"
                  name="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  className="block min-h-[44px] w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-3.5 pr-12 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {erro && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-800 bg-red-950/70 p-3.5 text-sm text-red-100"
              >
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
                  aria-hidden="true"
                />
                <span>{erro}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? 'Verificando acesso...' : 'Entrar no laboratório'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
