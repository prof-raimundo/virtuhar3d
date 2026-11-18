import { useCallback, useEffect, useState } from 'react';
import type { ModoMissao, PecaCatalogo, RegrasParametros } from '@virtuhar3d/rules';
import {
  fetchMe,
  logout,
  type MissaoCompleta,
  type RelatorioConcluido,
  type UsuarioSessao,
} from './api/client.js';
import { BancadaWorkspace } from './components/BancadaWorkspace.js';
import { LoginScreen } from './components/LoginScreen.js';
import { OrdemServicoScreen } from './components/OrdemServicoScreen.js';
import { ProfessorPanelScreen } from './components/ProfessorPanelScreen.js';
import { RelatorioScreen } from './components/RelatorioScreen.js';
import { TopNavBar, type NavTab } from './components/TopNavBar.js';
import { TrilhaMissoesScreen } from './components/TrilhaMissoesScreen.js';
import { TrocaSenhaScreen } from './components/TrocaSenhaScreen.js';

type RotaMvp =
  | { tela: 'trilha' }
  | { tela: 'ordem_servico'; missaoId: string; modo: ModoMissao }
  | {
      tela: 'bancada';
      sessaoId: string;
      missao: MissaoCompleta;
      pecas: PecaCatalogo[];
      regras: RegrasParametros;
      modo: ModoMissao;
    }
  | {
      tela: 'relatorio';
      relatorioRecemConcluido: RelatorioConcluido | null;
      sessaoSelecionadaId: string | null;
    }
  | { tela: 'painel_professor' };

export function VirtuharApp() {
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [rota, setRota] = useState<RotaMvp>({ tela: 'trilha' });

  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then((user) => {
        if (!cancelled) {
          setUsuario(user);
          if (user && (user.perfil === 'professor' || user.perfil === 'admin')) {
            setRota({ tela: 'painel_professor' });
          } else {
            setRota({ tela: 'trilha' });
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUsuario(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setVerificandoSessao(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoginSuccess = useCallback((user: UsuarioSessao) => {
    setUsuario(user);
    if (user.perfil === 'professor' || user.perfil === 'admin') {
      setRota({ tela: 'painel_professor' });
    } else {
      setRota({ tela: 'trilha' });
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await logout().catch(() => undefined);
    setUsuario(null);
    setRota({ tela: 'trilha' });
  }, []);

  const handleNavigateTab = useCallback((tab: NavTab) => {
    if (tab === 'missoes') {
      setRota({ tela: 'trilha' });
    } else if (tab === 'relatorios') {
      setRota({ tela: 'relatorio', relatorioRecemConcluido: null, sessaoSelecionadaId: null });
    } else {
      setRota({ tela: 'painel_professor' });
    }
  }, []);

  if (verificandoSessao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
        Verificando sessão no laboratório VIRTUHAR3D...
      </div>
    );
  }

  if (!usuario) {
    return <LoginScreen onSuccess={handleLoginSuccess} />;
  }

  if (usuario.senhaProvisoria) {
    return (
      <TrocaSenhaScreen
        usuario={usuario}
        onPasswordChanged={(atualizado) => {
          setUsuario(atualizado);
          if (atualizado.perfil === 'professor' || atualizado.perfil === 'admin') {
            setRota({ tela: 'painel_professor' });
          } else {
            setRota({ tela: 'trilha' });
          }
        }}
        onLogout={() => void handleLogout()}
      />
    );
  }

  if (rota.tela === 'bancada') {
    return (
      <BancadaWorkspace
        sessaoId={rota.sessaoId}
        missao={rota.missao}
        pecas={rota.pecas}
        regras={rota.regras}
        modo={rota.modo}
        onExitToTrail={() => setRota({ tela: 'trilha' })}
        onSessionCompleted={(relatorio) =>
          setRota({
            tela: 'relatorio',
            relatorioRecemConcluido: relatorio,
            sessaoSelecionadaId: relatorio.sessaoId,
          })
        }
      />
    );
  }

  const activeTab: NavTab =
    rota.tela === 'relatorio'
      ? 'relatorios'
      : rota.tela === 'painel_professor'
        ? 'painel'
        : 'missoes';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <TopNavBar
        usuario={usuario}
        activeTab={activeTab}
        onNavigate={handleNavigateTab}
        onLogout={() => void handleLogout()}
      />

      {rota.tela === 'trilha' && (
        <TrilhaMissoesScreen
          onSelectMission={(missaoId, modo) => setRota({ tela: 'ordem_servico', missaoId, modo })}
        />
      )}

      {rota.tela === 'ordem_servico' && (
        <OrdemServicoScreen
          missaoId={rota.missaoId}
          modo={rota.modo}
          onBack={() => setRota({ tela: 'trilha' })}
          onStartBancada={({ sessaoId, missao, pecas, regras, modo }) =>
            setRota({ tela: 'bancada', sessaoId, missao, pecas, regras, modo })
          }
        />
      )}

      {rota.tela === 'relatorio' && (
        <RelatorioScreen
          relatorioRecemConcluido={rota.relatorioRecemConcluido}
          sessaoSelecionadaId={rota.sessaoSelecionadaId}
          onSelectSessao={(sessaoId) =>
            setRota({
              tela: 'relatorio',
              relatorioRecemConcluido: null,
              sessaoSelecionadaId: sessaoId,
            })
          }
          onBackToTrail={() => setRota({ tela: 'trilha' })}
          onRetryMission={(missaoId) =>
            setRota({ tela: 'ordem_servico', missaoId, modo: 'guiado' })
          }
        />
      )}

      {rota.tela === 'painel_professor' && (
        <ProfessorPanelScreen
          usuario={usuario}
          onOpenRelatorio={(sessaoId) =>
            setRota({
              tela: 'relatorio',
              relatorioRecemConcluido: null,
              sessaoSelecionadaId: sessaoId,
            })
          }
        />
      )}
    </div>
  );
}

export default VirtuharApp;
