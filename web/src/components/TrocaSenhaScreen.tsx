import { useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, KeyRound, LogOut } from 'lucide-react';
import { ApiError, trocarSenha, type UsuarioSessao } from '../api/client.js';

interface TrocaSenhaScreenProps {
  usuario: UsuarioSessao;
  onPasswordChanged: (usuarioAtualizado: UsuarioSessao) => void;
  onLogout: () => void;
}

export function TrocaSenhaScreen({ usuario, onPasswordChanged, onLogout }: TrocaSenhaScreenProps) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);

    if (!senhaAtual) {
      setErro('Informe a senha provisória atual.');
      return;
    }
    if (novaSenha.length < 8) {
      setErro('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro('A confirmação não corresponde à nova senha digitada.');
      return;
    }

    setCarregando(true);
    try {
      const atualizado = await trocarSenha(senhaAtual, novaSenha);
      onPasswordChanged(atualizado);
    } catch (err) {
      if (err instanceof ApiError) {
        setErro(err.message);
      } else {
        setErro('Erro ao atualizar a senha. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-8">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-sky-400" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-slate-50">Troca obrigatória de senha</h1>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Sair</span>
          </button>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-slate-300">
          Olá, <strong className="text-slate-100">{usuario.nome}</strong>. Este é seu primeiro
          acesso com senha provisória. Defina uma senha pessoal com pelo menos 8 caracteres para
          liberar as missões do laboratório.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="troca-atual" className="block text-sm font-medium text-slate-200">
              Senha provisória atual
            </label>
            <input
              id="troca-atual"
              type="password"
              required
              autoComplete="current-password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              className="mt-1.5 block min-h-[44px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div>
            <label htmlFor="troca-nova" className="block text-sm font-medium text-slate-200">
              Nova senha (mínimo 8 caracteres)
            </label>
            <input
              id="troca-nova"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="mt-1.5 block min-h-[44px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle2
                className={`h-4 w-4 ${novaSenha.length >= 8 ? 'text-emerald-400' : 'text-slate-600'}`}
                aria-hidden="true"
              />
              <span>
                {novaSenha.length >= 8 ? 'Comprimento mínimo atingido' : 'Mínimo de 8 caracteres'}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="troca-confirma" className="block text-sm font-medium text-slate-200">
              Confirmar nova senha
            </label>
            <input
              id="troca-confirma"
              type="password"
              required
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              className="mt-1.5 block min-h-[44px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {erro && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-800 bg-red-950/70 p-3.5 text-sm text-red-100"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
              <span>{erro}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60"
          >
            {carregando ? 'Salvando nova senha...' : 'Salvar senha e continuar'}
          </button>
        </form>
      </div>
    </main>
  );
}
