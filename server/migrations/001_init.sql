-- VIRTUHAR3D — Migração Inicial (Documento 11)
-- Compatível com PostgreSQL 16+

CREATE TABLE IF NOT EXISTS schema_migrations (
  versao TEXT PRIMARY KEY,
  aplicada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  usuario TEXT NOT NULL UNIQUE,
  hash_senha TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('aluno', 'professor', 'admin')),
  senha_provisoria BOOLEAN NOT NULL DEFAULT TRUE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  tentativas_falhas INTEGER NOT NULL DEFAULT 0,
  bloqueado_ate TIMESTAMPTZ NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS turmas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  ano_letivo INTEGER NOT NULL,
  professor_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS matriculas (
  turma_id TEXT NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  aluno_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  PRIMARY KEY (turma_id, aluno_id)
);

CREATE TABLE IF NOT EXISTS liberacoes (
  turma_id TEXT NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  missao_id TEXT NOT NULL,
  liberada BOOLEAN NOT NULL DEFAULT FALSE,
  atualizada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (turma_id, missao_id)
);

CREATE TABLE IF NOT EXISTS sessoes_login (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_em TIMESTAMPTZ NOT NULL,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessoes_login_usuario ON sessoes_login(usuario_id);

CREATE TABLE IF NOT EXISTS sessoes_missao (
  id TEXT PRIMARY KEY,
  aluno_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  missao_id TEXT NOT NULL,
  modo TEXT NOT NULL CHECK (modo IN ('guiado', 'livre', 'avaliacao')),
  iniciada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  concluida_em TIMESTAMPTZ NULL,
  estado TEXT NOT NULL CHECK (estado IN ('em_andamento', 'concluida', 'abandonada')),
  tempo_seg INTEGER NOT NULL DEFAULT 0,
  dicas_usadas INTEGER NOT NULL DEFAULT 0,
  nota_total INTEGER NULL,
  nota_esd INTEGER NULL,
  nota_ordem INTEGER NULL,
  nota_compat INTEGER NULL,
  nota_tempo INTEGER NULL
);

CREATE INDEX IF NOT EXISTS idx_sessoes_missao_aluno ON sessoes_missao(aluno_id, missao_id);

CREATE TABLE IF NOT EXISTS eventos_sessao (
  id TEXT PRIMARY KEY,
  sessao_id TEXT NOT NULL REFERENCES sessoes_missao(id) ON DELETE CASCADE,
  instante_ms INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  regra TEXT NULL,
  detalhe JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_eventos_sessao_id ON eventos_sessao(sessao_id, instante_ms);

CREATE TABLE IF NOT EXISTS erros_sessao (
  sessao_id TEXT NOT NULL REFERENCES sessoes_missao(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  regra TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (sessao_id, tipo, regra)
);

CREATE TABLE IF NOT EXISTS respostas (
  sessao_id TEXT NOT NULL REFERENCES sessoes_missao(id) ON DELETE CASCADE,
  questao_id TEXT NOT NULL,
  resposta INTEGER NOT NULL,
  correta BOOLEAN NOT NULL,
  PRIMARY KEY (sessao_id, questao_id)
);

CREATE TABLE IF NOT EXISTS autoavaliacoes (
  sessao_id TEXT PRIMARY KEY REFERENCES sessoes_missao(id) ON DELETE CASCADE,
  explica TEXT NOT NULL,
  executa TEXT NOT NULL,
  revisar TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pontuacao_aluno (
  aluno_id TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  pontos_total INTEGER NOT NULL DEFAULT 0,
  nivel TEXT NOT NULL DEFAULT 'Aprendiz'
);

CREATE TABLE IF NOT EXISTS insignias_aluno (
  aluno_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  insignia_id TEXT NOT NULL,
  conquistada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sessao_id TEXT NOT NULL REFERENCES sessoes_missao(id) ON DELETE CASCADE,
  PRIMARY KEY (aluno_id, insignia_id)
);

CREATE TABLE IF NOT EXISTS auditoria (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  detalhe JSONB NOT NULL DEFAULT '{}'::jsonb,
  registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_registrado ON auditoria(registrado_em);
