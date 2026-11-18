import { LogOut } from 'lucide-react';
import type { UsuarioSessao } from '../api/client.js';

export type NavTab = 'missoes' | 'relatorios' | 'painel';

interface TopNavBarProps {
  usuario: UsuarioSessao;
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
}

export function TopNavBar({ usuario, activeTab, onNavigate, onLogout }: TopNavBarProps) {
  const isProfessorOrAdmin = usuario.perfil === 'professor' || usuario.perfil === 'admin';

  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-3.5">
        <button
          type="button"
          onClick={() => onNavigate(isProfessorOrAdmin ? 'painel' : 'missoes')}
          className="shrink-0 whitespace-nowrap text-lg font-bold tracking-tight text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          VIRTUHAR3D
        </button>

        <nav aria-label="Navegação principal" className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate('missoes')}
            className={`min-h-[44px] shrink-0 whitespace-nowrap border-b-2 px-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              activeTab === 'missoes'
                ? 'border-sky-400 text-slate-50'
                : 'border-transparent text-slate-300 hover:border-slate-600 hover:text-slate-50'
            }`}
          >
            Missões
          </button>

          <button
            type="button"
            onClick={() => onNavigate('relatorios')}
            className={`min-h-[44px] shrink-0 whitespace-nowrap border-b-2 px-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              activeTab === 'relatorios'
                ? 'border-sky-400 text-slate-50'
                : 'border-transparent text-slate-300 hover:border-slate-600 hover:text-slate-50'
            }`}
          >
            Relatórios
          </button>

          {isProfessorOrAdmin && (
            <button
              type="button"
              onClick={() => onNavigate('painel')}
              className={`min-h-[44px] shrink-0 whitespace-nowrap border-b-2 px-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                activeTab === 'painel'
                  ? 'border-sky-400 text-slate-50'
                  : 'border-transparent text-slate-300 hover:border-slate-600 hover:text-slate-50'
              }`}
            >
              Painel da Turma
            </button>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <span className="hidden text-sm text-slate-300 md:inline">
            {usuario.nome}
            <span aria-hidden="true" className="mx-1.5 text-slate-600">
              ·
            </span>
            <span className="capitalize text-slate-400">{usuario.perfil}</span>
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
