# Projeto do Simulador de Montagem de PCs

**Pacote de documentação até a entrega “pronto para desenvolvimento”**

Responsável: Prof. Raimundo Nonato de Sousa (desenvolvimento solo)

Disciplina: Arquitetura e Manutenção de Computadores – Técnico em Informática (Ensino Médio Integrado)

Status: em construção, pacote de 15 documentos completo, em revisão

## Roteiro de documentos

Os documentos seguem uma ordem lógica: primeiro o porquê, depois o quê, depois o como e, por fim, o plano de execução. Como o projeto é solo, cada documento será enxuto e útil, sem burocracia.

**Fase 0 – Fundamentos (o porquê)**

1. Termo de Abertura e Visão do Produto
2. Alinhamento curricular (competências, trilhas de formação e referencial do Manual Editorial EPT)
3. Premissas, restrições e registro de riscos

**Fase 1 – Definição (o quê)**

4. PRD – Documento de Requisitos do Produto
5. Histórias de usuário e critérios de aceite
6. Requisitos funcionais e não funcionais
7. Regras de negócio (compatibilidade de peças, ordem de montagem, ESD, pontuação)

**Fase 2 – Design (o como)**

8. Design pedagógico e de gamificação (trilhas, aulas, exercícios, avaliação, intervenção e relatório)
9. UX: fluxos de tela, wireframes e protótipo
10. Arquitetura técnica e registro de decisões (ADR)
11. Modelo de dados (JSON Schema das peças, regras e cenários)
12. Guia de assets 3D (orçamento de polígonos, formatos, licenças e nomenclatura)

**Fase 3 – Planejamento (a execução)**

13. Roadmap, MVP e plano de releases
14. Plano de testes e validação com alunos
15. Preparação do repositório (convenções, definição de pronto e backlog inicial)

**Entrega final:** checklist de prontidão para iniciar a codificação.

---

# Documento 1 – Termo de Abertura e Visão do Produto

Itens marcados com **\[confirmar\]** dependem de uma decisão sua.

## 1. Identificação

- **Nome provisório:** VIRTUHAR3D (Laboratório Virtual de Montagem e Manutenção de PCs)&#32;
- **Tipo:** aplicação web educacional 3D, executada no navegador
- **Responsável e desenvolvedor:** Prof. Raimundo Nonato de Sousa
- **Instituição e curso:** EEEP Profª. Maria de Jesus R. Alves, Curso Técnico em Informática, Ensino Médio Integrado&#32;

## 2. Contexto e problema

Na disciplina de Arquitetura e Manutenção de Computadores, a prática de montagem depende de bancadas e componentes físicos. Isso gera quatro problemas:

- Não há bancadas suficientes para toda a turma praticar ao mesmo tempo.
- Os componentes se desgastam com o manuseio repetido.
- O erro do aluno pode danificar peças caras.
- O aluno chega ao equipamento real sem ter praticado antes.

## 3. Objetivo do produto

Objetivo geral: preparar os estudantes para o exercício de profissões, promovendo a inserção e a atuação crítica no mundo do trabalho e na vida em sociedade. Objetivo específico: capacitar o aluno para montar, configurar, diagnosticar e reparar equipamentos de informática (hardware e software), redes locais e sistemas operacionais. Redes locais ficam fora do escopo do simulador. O simulador cumpre o restante desse papel com prática virtual, segura e repetível, antes do equipamento real e sem exigir programação do aluno.

## 4. Público-alvo

- **Principal:** estudantes do Técnico em Informática integrado ao Ensino Médio
- **Secundário:** estudantes de outros cursos de nível médio do Eixo Informação e Comunicação
- **Usuário-professor:** acompanha o desempenho da turma e escolhe os cenários por meio de painel do professor e dashboard (confirmado)&#32;

## 5. Proposta de valor

- Prática ilimitada, sem risco para o hardware
- Feedback imediato sobre erros de compatibilidade e de ordem de montagem
- Segurança do trabalho (ESD) incorporada ao processo
- Roda no navegador, servido pela rede local do laboratório, sem depender de internet
- Relatório de desempenho com tempo, erros e nota

## 6. Escopo

**Dentro do escopo**

- Montagem física 3D: gabinete, placa-mãe, CPU, cooler, RAM, fonte, armazenamento e GPU
- Validação de compatibilidade (soquete, formato, potência, tipo de memória)
- Ordem lógica de montagem e protocolo ESD
- Modos Guiado e Prática Livre/Avaliação
- Simulação de POST e BIOS, incluindo bipes de erro
- Cenários de manutenção corretiva (Bancada de Reparo), em fase posterior
- Relatório de desempenho do aluno, painel do professor e dashboard da turma

**Fora do escopo**

- Programação ou interpretação de código do aluno
- Física complexa (gravidade, colisão contínua)
- Conexão com hardware real (IoT)
- Redes locais (fora do projeto por decisão do professor) e, na primeira versão, instalação de sistema operacional e manutenção de software (entram em releases posteriores)

## 7. Recorte do MVP

- **Bancada:** apenas a placa-mãe fora do gabinete (teste de bancada)
- **Peças:** CPU, cooler, 2 pentes de RAM, fonte e cabo de vídeo
- **Meta da primeira aula:** montar o kit mínimo, fazer o jump nos pinos de Power com a chave de fenda e exibir o POST da BIOS no monitor virtual

## 8. Premissas iniciais

- O desenvolvimento é solo e feito em horas disponíveis fora da docência (cerca de 10 horas semanais)&#32;
- Os modelos 3D virão de acervos gratuitos com licenças abertas (CC0 ou CC-BY), adaptados no Blender
- Os computadores do laboratório conseguem executar WebGL **Especificações informadas: Core i3 de 5ª geração, 4 GB de RAM e placa de vídeo dedicada PCIe (NVIDIA GeForce GT 710).**
- A aplicação será servida por um servidor da rede local (Ubuntu Server 26.04 LTS), sem custo de hospedagem externa

## 9. Restrições

- Equipe de uma pessoa
- Orçamento próximo de zero
- Máquinas escolares modestas (Core i3 de 5ª geração, 4 GB de RAM e NVIDIA GT 710), o que exige modelos low-poly
- Acesso pela rede local, sem depender de internet, mas com vários alunos carregando os modelos 3D ao mesmo tempo

## 10. Riscos iniciais

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Escopo crescer além da capacidade de um desenvolvedor | Alta | Alto | Manter o MVP enxuto e entregar por releases |
| Falta de modelos 3D adequados ou com licença incompatível | Média | Alto | Registrar a licença de cada asset e ter peças simplificadas como plano B |
| Desempenho ruim nas máquinas da escola | Média | Alto | Orçamento de polígonos, texturas comprimidas e teste cedo no laboratório real |
| Conteúdo desalinhado com a ementa | Baixa | Médio | Documento 2 de alinhamento curricular antes do PRD |
| Falta de tempo para manutenção após a entrega | Média | Médio | Dados em JSON, de modo que novas peças e cenários não exijam alterar código |

## 11. Critérios de sucesso

- Um aluno completa o MVP sem ajuda do professor
- O simulador roda de forma fluida nos computadores do laboratório
- Pelo menos uma turma usa a ferramenta em aula e responde a um questionário de percepção **\[confirmar meta\]**
- Os alunos que usaram o simulador cometem menos erros na montagem real **\[confirmar como medir\]**

## 12. Partes interessadas

- **Professor-desenvolvedor:** define, desenvolve e avalia
- **Alunos:** usuários finais e fonte de feedback
- **Coordenação ou direção:** autoriza o uso em aula **(autorização confirmada)**
- **Setor de TI da escola:** apoia na configuração dos computadores, se necessário

## 13. Marcos de alto nível

| Marco | Entrega |
| --- | --- |
| M0 | Pacote de documentação completo (este projeto) |
| M1 | Protótipo técnico: um modelo 3D carregado, com clique e encaixe |
| M2 | MVP: bancada com POST funcionando |
| M3 | Validação com uma turma |
| M4 | Montagem completa no gabinete e Bancada de Reparo |

Datas a definir no Documento 13 (Roadmap).

## 14. Modelo educacional e referencial pedagógico

O VIRTUHAR3D será um sistema completo de formação, e não apenas um simulador de montagem: reúne aula, prática, exercício, avaliação e intervenção do professor em uma trilha gamificada. O Manual Editorial EPT serve como referência de qualidade, não como estrutura obrigatória do software.

### Ciclo de formação dentro do software

1. **Situação-problema:** a missão abre com um caso real (ex.: o computador da secretaria não liga).
2. **Micro-aula:** explicação curta, com visuais 3D e glossário.
3. **Prática:** o aluno executa a tarefa no ambiente virtual.
4. **Exercícios:** questões e desafios graduados por dificuldade.
5. **Avaliação:** diagnóstica no início, formativa durante a missão e somativa no modo Avaliação.
6. **Intervenção:** o professor acompanha o dashboard, atribui reforços e missões; o sistema sugere revisão automática ao aluno.

### Gamificação (proposta)

- Trilhas de missões por área, com níveis de dificuldade crescentes
- Pontos por acerto, por boas práticas (ESD, ordem de montagem) e por tempo, sem premiar só a velocidade
- Insígnias de conquista (ex.: Técnico ESD-safe, Caçador de Defeitos)
- Defeitos sorteados e desafios cronometrados na Bancada de Reparo
- Metas cooperativas e ranking opcional por turma, sem expor os erros individuais
- Feedback imediato após cada ação

### Trilhas de formação (alinhadas ao objetivo específico)

| Ordem | Trilha | Competência | Por que nessa posição | Fase proposta |
| --- | --- | --- | --- | --- |
| 0 | Montagem de hardware | Montar | Base de todas as outras trilhas e foco do MVP | MVP |
| 1 | Instalação de software | Instalar | Assistentes guiados, risco baixo e erro reversível por desinstalação | 2ª versão |
| 2 | Instalação de sistema operacional | Instalar e configurar | Partições, formatação e boot na BIOS/UEFI; erro pode causar perda de dados sem backup | 2ª versão |
| 3 | Configuração | Configurar | Permissões, drivers, segurança e desempenho; exige entender conflitos entre programas e dispositivos | 3ª versão |
| 4 | Diagnóstico | Diagnosticar | Raciocínio lógico para isolar a causa raiz, cruzando sintomas de software e hardware | 4ª versão |
| 5 | Reparo de hardware | Reparar | Manuseio físico sensível à estática, desmontagem de equipamentos compactos e, em nível avançado, soldagem e esquemas elétricos | 5ª versão |

### O que aproveitar do manual (princípios, não estrutura)

- Abrir cada missão com um problema real do mundo do trabalho, nunca com definição
- Três níveis de profundidade: essencial, complementar e avançado opcional
- Integração com a Formação Geral Básica (Física, Matemática, Língua Portuguesa e Inglês técnico)
- Segurança, ética e sustentabilidade dentro do processo (ESD, descarte de lixo eletrônico, direitos autorais)
- Acessibilidade (DUA): texto alternativo nos recursos visuais, contraste, navegação por teclado e legenda visual para os bipes da BIOS
- Linguagem clara, com frases curtas
- Avaliação formativa e autoavaliação

**Ordem definida pelo professor:** as trilhas seguem do mais simples ao mais complexo, e essa progressão também orienta o desbloqueio de níveis na gamificação. A montagem de hardware abre o MVP por ser a base das demais. Esta sequência é a oficial do projeto: o currículo da disciplina será remodelado depois para refletir a ordem do VIRTUHAR3D. Redes locais ficam fora do projeto. As versões são uma proposta; as datas entram no Documento 13 (Roadmap).

---

# Documento 2 – Alinhamento curricular

A disciplina Arquitetura e Manutenção de Computadores (AMC) tem 80 h/a em 20 semanas (4 aulas de 50 minutos por semana) e 8 módulos. O VIRTUHAR3D é o núcleo prático dos módulos III a VI e apoia os módulos II, VII e VIII; o módulo I fica como apoio opcional.

## 1. Cobertura por módulo

| Módulo | Aulas | Papel do VIRTUHAR3D | Missões previstas |
| --- | --- | --- | --- |
| I – Introdução e representação de dados | 01–08 | Apoio opcional, baixa prioridade | Minigame de conversão binário/decimal (aula 07); quiz de perfis de usuário e equipamento (aula 08) |
| II – Arquitetura física e componentes | 09–24 | Apoio | Identificação de componentes em 3D (aulas 10 e 31); compatibilidade CPU, placa-mãe e RAM (aula 22); cálculo de potência da fonte (aula 23); pinos do painel frontal (aulas 20 e 48) |
| III – BIOS, POST e simuladores | 25–36 | Núcleo | Orçamento de hardware (aulas 25 e 34); setup da BIOS e ordem de boot (aulas 27 a 30); montagem básica guiada (aula 32); diagnóstico virtual (aula 33); ferramentas e protocolo ESD (aula 36) |
| IV – Manutenção física e higienização | 37–48 | Núcleo | Desmontagem em sequência (aula 37); limpeza e pasta térmica (aulas 38 a 40); organização com Kanban (aula 43); montagem no gabinete e cabos de energia (aulas 46 a 48) |
| V – Montagem avançada e diagnóstico | 49–60 | Núcleo | Montagem completa e cronometrada (aulas 49 a 54); falhas comuns de montagem (aula 52); primeira energização e POST (aula 51); isolamento mínimo e LEDs de depuração (aula 60); cenários de teste de estresse, MemTest, S.M.A.R.T. e fonte (aulas 55 a 59) |
| VI – Manutenção corretiva e diagnóstico acústico | 61–68 | Núcleo | Bipes da BIOS (aula 62); Clear CMOS por jumper e bateria (aula 63); placa de diagnóstico (aula 64); teste da bateria CR2032 (aula 65); falhas intermitentes (aula 61) |
| VII – Sistemas operacionais e licenciamento | 69–76 | Fase posterior | Particionamento, instalação do SO, drivers e backup antes da formatação (aulas 71 a 76), como cenários simulados |
| VIII – Ética, laudo e atividade comercial | 77–80 | Núcleo | Laudo técnico gerado a partir do relatório da sessão (aulas 78 e 79); simulação de atendimento de ponta a ponta (aula 80) |

## 2. Pontos de atenção

- **Único simulador da disciplina:** as aulas 31 a 34 hoje usam o Intel Simulator e o PC Building Simulator. O VIRTUHAR3D será o único simulador e passa a cobrir essas aulas, com o conteúdo e o vocabulário da disciplina.
- **Ordem das trilhas × ordem da disciplina:** a disciplina ensina hardware antes de sistema operacional, enquanto a ordem de dificuldade da seção 14 começa pela instalação de software. Vale a ordem da seção 14, e o currículo será remodelado depois para refletir a sequência do VIRTUHAR3D. Cada missão mantém a etiqueta do módulo e das aulas que atende, para facilitar essa remodelação.
- **Redes locais:** ficam fora do projeto por decisão do professor; o currículo de AMC também não traz esse conteúdo além do teste da porta Ethernet (aula 56).
- **Cobertura prática real:** o simulador complementa as aulas de bancada com equipamento físico, sem substituí-las; ele garante a prática prévia, repetível e sem risco para as peças.
- **Laudo técnico:** o relatório da sessão pode gerar um rascunho de laudo (equipamento, defeito relatado, testes realizados, diagnóstico, solução e orçamento), integrando Língua Portuguesa e fechando o ciclo de atendimento da aula 80.

---

# Documento 3 – Premissas, restrições e registro de riscos

Este documento consolida as decisões já tomadas e substitui as seções 8 a 10 do Documento 1. A capacidade de trabalho é de cerca de 40 horas por mês (10 h/semana, desenvolvimento solo); as estimativas de prazo entram no Documento 13.

## 1. Decisões confirmadas

| Decisão | Detalhe |
| --- | --- |
| Nome do produto | VIRTUHAR3D |
| Instituição | EEEP Profª. Maria de Jesus R. Alves |
| Painel do professor e dashboard | Fazem parte do produto |
| Autorização da coordenação | Concedida para uso em aula |
| Único simulador | O VIRTUHAR3D será o único simulador da disciplina |
| Sequência de trilhas | Ordem de dificuldade da seção 14; o currículo será remodelado depois para refleti-la |
| Redes locais | Fora do projeto |
| Manual Editorial EPT | Referência de qualidade; o software não segue a estrutura didática do material impresso |
| Gamificação | Proposta em análise, ainda não confirmada |
| Infraestrutura | Servidor Ubuntu Server 26.04 LTS na rede local; clientes com Kubuntu 26.04 e Chromium 157.x ou Firefox 160.x |
| Capacidade | 45 computadores por sala de aula, usados ao mesmo tempo |
| Placa de vídeo | Modelo e driver considerados irrelevantes; ajustes feitos na prática, se necessário |
| Rede | Gigabit; uma única turma de 45 alunos usa o sistema ao mesmo tempo |
| Acesso | Contas criadas pelo professor; autenticação segura para todos os usuários |
| Infraestrutura aprovada | O administrador do servidor aceita instalar Docker, banco de dados, esquemas e dependências |
| Início de uso | Somente quando o projeto estiver concluído; não há data prevista |
| Metodologia | Desenvolvimento incremental, com entregáveis sinalizados por marco, testes automatizados e integração contínua |
| Hospedagem do código | GitHub, na conta do professor, em repositório com o nome do projeto |
| Testes com alunos | Aceitos antes da conclusão, ao final do MVP e da V1 |

## 2. Premissas

1. O desenvolvimento é solo, com cerca de 10 horas semanais.
2. Os modelos 3D virão de acervos com licença aberta (CC0 ou CC-BY), adaptados no Blender, e cada licença será registrada.
3. Os computadores do laboratório (Core i3 de 5ª geração, 4 GB de RAM e NVIDIA GeForce GT 710) executam Kubuntu 26.04 com Chromium 157.x ou Firefox 160.x, e o desempenho gráfico será resolvido na prática, se necessário (decisão do professor).
4. A aplicação é servida por um servidor da rede local (Ubuntu Server 26.04 LTS), sem custo de hospedagem externa.
5. O aluno não programa; interage apenas com montagem, configuração, diagnóstico e reparo.
6. O simulador complementa as aulas de bancada, sem substituir o equipamento físico.

## 3. Restrições

- **Equipe:** uma pessoa, com tempo limitado fora da docência.
- **Orçamento:** próximo de zero.
- **Desempenho:** 4 GB de RAM compartilhados com o sistema operacional e o navegador, e uma GT 710 de entrada. Metas iniciais a validar no laboratório real (Marco M1): cerca de 100 mil triângulos visíveis na cena, texturas de até 1024 px, sombras pré-calculadas e no mínimo 30 quadros por segundo.
- **Conectividade:** o aplicativo é servido pela rede local e não depende de internet; o servidor precisa atender vários alunos carregando modelos 3D ao mesmo tempo, o que exige arquivos compactados e cache.
- **Escopo:** cobrir toda a disciplina com um único simulador pressiona o volume de conteúdo; por isso a entrega é por versões.

## 4. Registro de riscos

| Risco | Prob. | Impacto | Mitigação |
| --- | --- | --- | --- |
| Escopo maior que a capacidade de 40 h/mês | Alta | Alto | MVP enxuto, entrega por versões e corte de funções fora da trilha atual |
| Dependência de uma única pessoa | Alta | Alto | Documentação, dados em JSON e repositório versionado desde o início |
| Desempenho ruim na GT 710 e com 4 GB de RAM | Média | Alto | Orçamento de polígonos, texturas comprimidas e teste no laboratório já no Marco M1 |
| Modelos 3D inadequados ou com licença incompatível | Média | Alto | Registro de licenças e peças simplificadas como plano B |
| Conteúdo desalinhado ao currículo vigente | Média | Médio | Etiquetar cada missão com módulo e aulas; remodelar o currículo com base nessas etiquetas |
| Cobertura insuficiente das aulas 31 a 34 antes da primeira versão | Média | Médio | Priorizar no MVP as missões dessas aulas (montagem básica, diagnóstico e orçamento) |
| Baixa adesão dos alunos ou do professor ao painel | Baixa | Médio | Testar com uma turma e ajustar o dashboard ao uso real |
| Falta de acessibilidade para alunos com deficiência | Média | Médio | Aplicar texto alternativo, contraste, teclado e legenda dos bipes desde as primeiras telas |
| Manutenção após a entrega | Média | Médio | Peças, cenários e questões em JSON, sem alterar código |
| 45 alunos por sala carregando os modelos 3D ao mesmo tempo no servidor local | Média | Médio | Compressão dos modelos e texturas, servidor web com cache longo e carregamento sob demanda por missão; meta inicial de até 30 MB por missão (cerca de 1,35 GB em um pico com 45 alunos; em rede Gigabit, estimativa de uns 12 segundos na primeira carga, no pior caso, e as seguintes saem do cache) |

## 5. Pendência

Nenhuma no momento: a rede é Gigabit e apenas uma turma de 45 alunos usa o sistema ao mesmo tempo.

---

# Documento 4 – PRD: Documento de Requisitos do Produto

O VIRTUHAR3D é um laboratório virtual 3D, executado no navegador e servido pela rede local da escola, em que o aluno monta, configura, diagnostica e repara computadores em um ambiente seguro e gamificado, enquanto o professor acompanha o desempenho da turma em um painel. Este documento define o que o produto deve fazer e em que ordem; o como fica para os Documentos 9 a 12.

## 1. Usuários

| Usuário | Necessidade | O que faz no sistema |
| --- | --- | --- |
| Aluno (Técnico em Informática, Ensino Médio Integrado) | Praticar sem medo de danificar peças e receber retorno imediato | Realiza missões, monta, configura, diagnostica, repara, responde exercícios e consulta o próprio desempenho |
| Professor | Acompanhar a turma e intervir | Cria as contas dos alunos, libera missões, acompanha o dashboard, identifica dificuldades, atribui reforços e avalia |
| Administrador (o próprio professor-desenvolvedor, no início) | Manter o sistema | Cadastra professores e turmas, atualiza peças, cenários e questões |

## 2. Objetivos e indicadores

As metas abaixo são propostas e devem ser confirmadas no Documento 14.

| Objetivo | Indicador proposto |
| --- | --- |
| O aluno conclui a prática sozinho | Pelo menos 80% da turma conclui a missão do MVP sem ajuda do professor |
| O simulador funciona bem nas máquinas da escola | No mínimo 30 quadros por segundo em pelo menos 90% dos computadores da sala |
| A carga da turma não trava | 45 alunos iniciam a mesma missão ao mesmo tempo sem falhas |
| O aluno aprende com o erro | Queda na quantidade de erros de compatibilidade e de ordem entre a primeira e a terceira tentativa |
| O professor usa o painel | O painel é consultado em pelo menos uma aula por semana de uso |

## 2.1 Escopo por versão

| Versão | Conteúdo | Trilha |
| --- | --- | --- |
| MVP | Bancada de teste com CPU, cooler, 2 pentes de RAM, fonte e cabo de vídeo; jump nos pinos de Power; POST no monitor virtual | Montagem de hardware |
| 1ª versão | Montagem completa no gabinete, defeitos simples de montagem, orçamento de hardware, modos Guiado e Avaliação, painel do professor e gamificação básica | Montagem de hardware |
| 2ª versão | Instalação de software e de sistema operacional como cenários simulados | Instalação |
| 3ª versão | Configuração de BIOS, drivers e sistema | Configuração |
| 4ª versão | Diagnóstico de falhas de hardware e software | Diagnóstico |
| 5ª versão | Reparo de hardware, Bancada de Reparo e laudo técnico | Reparo |

## 3. Funcionalidades e prioridade

Prioridade: **Essencial** (sem ela não há MVP), **Importante** (1ª versão) e **Desejável** (versões seguintes).

| Funcionalidade | Descrição | Prioridade |
| --- | --- | --- |
| Entrada no sistema | Contas criadas pelo professor; todos os usuários entram com autenticação segura | Essencial |
| Cena 3D da bancada | Ambiente 3D com câmera orbital, zoom e seleção de peças | Essencial |
| Encaixe de peças | Pegar, arrastar e encaixar peças por proximidade (snapping), com indicação visual do encaixe correto | Essencial |
| Validação de compatibilidade | Soquete, tipo de memória, formato e potência; mensagem clara quando há erro | Essencial |
| Ordem de montagem | Árvore de dependências (ex.: pasta térmica antes do cooler) com aviso ao quebrar a ordem | Essencial |
| Protocolo ESD | Uso da pulseira antiestática como pré-requisito da prática | Essencial |
| Jump e POST | Fechar os pinos de Power com a chave de fenda e ver o POST no monitor virtual | Essencial |
| Modo Guiado | Passo a passo com dicas e feedback imediato | Essencial |
| Relatório da sessão | Tempo, erros, boas práticas e nota ao final da missão | Essencial |
| Montagem no gabinete | Fixação de espaçadores, placa-mãe, fonte, armazenamento, placas de expansão e cabos | Importante |
| Modo Prática Livre e Avaliação | Sem dicas, com tempo e nota registrados | Importante |
| Painel do professor e dashboard | Visão da turma, desempenho por aluno e por missão, erros mais frequentes | Importante |
| Gamificação | Pontos, níveis, insígnias e metas por missão; o aluno é premiado pelo processo correto, não só pela velocidade | Importante |
| Bipes e BIOS | Bipes de erro (com legenda visual), tela de setup e ordem de boot | Importante |
| Exercícios e avaliação | Questões graduadas, autoavaliação e retorno | Importante |
| Cenários de defeito | Defeitos sorteados ou escolhidos pelo professor | Desejável |
| Laudo técnico | Rascunho gerado a partir do relatório da sessão | Desejável |
| Minigames de apoio | Conversão binário/decimal e perfis de usuário (módulo I) | Desejável |

## 4. Fluxo principal do aluno (MVP)

1. Entra no sistema e escolhe a missão liberada pelo professor.
2. Lê a situação-problema (ex.: o computador da secretaria não liga).
3. Veste a pulseira antiestática, o que libera a bancada.
4. Instala CPU, cooler, memórias, fonte e cabo de vídeo, na ordem correta.
5. Faz o jump nos pinos de Power e liga a fonte.
6. Vê o POST no monitor virtual e conclui a missão.
7. Recebe o relatório com tempo, erros e boas práticas.

## 5. Requisitos não funcionais

- **Compatibilidade:** Chromium 157.x e Firefox 160.x em Kubuntu 26.04.
- **Desempenho:** mínimo de 30 quadros por segundo nos computadores da sala (Core i3 de 5ª geração, 4 GB de RAM); modelos leves e sombras pré-calculadas.
- **Carga e rede:** até 30 MB por missão na primeira carga; 45 alunos simultâneos em rede Gigabit; cache do navegador nas cargas seguintes.
- **Disponibilidade:** servido por servidor Ubuntu Server 26.04 LTS na rede local, sem depender de internet.
- **Acessibilidade:** texto alternativo nos recursos visuais, contraste adequado, navegação por teclado e legenda visual para os bipes.
- **Privacidade (LGPD):** a maior parte dos alunos é menor de idade; guardar apenas nome, turma e dados de desempenho, no servidor da escola, sem envio a terceiros. O acesso exige autenticação segura para todos os usuários: contas criadas pelo professor, senhas guardadas com hash seguro (Argon2 ou bcrypt), sessão com tempo de expiração, bloqueio temporário após tentativas falhas e conexão HTTPS com certificado interno (propostas a detalhar no Documento 10).
- **Manutenção:** peças, cenários, regras e questões em arquivos de dados (JSON), de modo que novos conteúdos não exijam alterar o código.
- **Idioma:** português do Brasil, com termos técnicos em inglês explicados na primeira ocorrência.

## 6. Fora do escopo

- Redes locais
- Programação ou código escrito pelo aluno
- Física complexa (gravidade, colisões contínuas)
- Conexão com hardware real
- Uso fora da rede da escola

## 7. Dependências e premissas

- Modelos 3D de acervos com licença aberta, adaptados no Blender, com a licença de cada um registrada.
- Teste em uma máquina real do laboratório antes do primeiro protótipo.
- Currículo da disciplina remodelado depois, com base nas etiquetas de módulo e aulas de cada missão.

## 8. Questões em aberto

Nenhuma no momento: as contas são criadas pelo professor, com autenticação segura para todos os usuários.

---

# Documento 5 – Histórias de usuário e critérios de aceite

Cada história segue o formato “Como \[usuário\], quero \[ação\], para \[benefício\]” e termina com critérios testáveis no formato Dado, Quando, Então. Uma história só é considerada pronta quando todos os critérios passam; a definição de pronto completa entra no Documento 15. Os valores numéricos são propostas e podem ser ajustados.

Versões: **MVP**, **V1** (1ª versão) e **V5** (5ª versão).

## 1. Acesso

**US-01 – Entrar no sistema (MVP).** Como aluno ou professor, quero entrar com meu usuário e senha, para acessar minhas missões e meus dados.

- Dado um usuário cadastrado, quando informa usuário e senha corretos, então entra e vê a tela inicial do seu perfil.
- Dado usuário ou senha incorretos, quando tenta entrar, então vê uma mensagem genérica que não revela qual dado errou.
- Dado 5 tentativas falhas seguidas, quando tenta uma sexta vez, então o acesso daquela conta fica bloqueado por alguns minutos.
- Dado uma sessão aberta e parada, quando passa o tempo de expiração, então o sistema pede nova autenticação.

**US-02 – Criar contas dos alunos (MVP).** Como professor, quero cadastrar os alunos da turma, para que cada um tenha sua conta.

- Dado o professor autenticado, quando informa nome e turma, então a conta é criada com uma senha provisória.
- Dado a primeira entrada do aluno, quando usa a senha provisória, então o sistema exige a troca da senha.
- Dado uma turma de 45 alunos, quando o professor importa a lista (arquivo de texto ou planilha), então todas as contas são criadas de uma vez.

## 2. Bancada virtual

**US-03 – Explorar a bancada em 3D (MVP).** Como aluno, quero girar, aproximar e selecionar peças, para observá-las de todos os lados.

- Dado a bancada aberta, quando arrasta com o mouse, então a câmera gira em volta da bancada.
- Dado uma peça sob o cursor, quando passa o mouse, então ela é realçada e mostra o nome.
- Dado uma peça selecionada, quando abre os detalhes, então vê nome, função e especificações principais.
- Dado um computador da sala, quando a cena roda, então mantém pelo menos 30 quadros por segundo.

**US-04 – Encaixar peças (MVP).** Como aluno, quero arrastar uma peça até seu lugar e vê-la encaixar, para montar o equipamento.

- Dado uma peça em arrasto, quando chega perto do local correto, então o local é realçado e a peça encaixa ao soltar.
- Dado uma peça solta longe de qualquer local, quando solta, então ela volta à posição anterior sem erro.
- Dado uma peça encaixada, quando o aluno a retira, então ela sai do local e libera o encaixe.

**US-05 – Validar compatibilidade (MVP).** Como aluno, quero ser avisado quando uma peça não combina com a outra, para aprender as regras de especificação.

- Dado uma CPU com soquete diferente do da placa-mãe, quando tenta encaixar, então o encaixe é recusado com a mensagem do motivo.
- Dado uma memória de tipo diferente do suportado, quando tenta encaixar, então o encaixe é recusado com o motivo.
- Dado uma fonte com potência abaixo da necessária, quando liga o equipamento, então vê o aviso de potência insuficiente.
- Dado qualquer recusa, quando ela ocorre, então o erro é registrado no relatório da sessão.

**US-06 – Respeitar a ordem de montagem (MVP).** Como aluno, quero saber quando pulei uma etapa, para criar o hábito do procedimento correto.

- Dado o cooler, quando tenta instalá-lo sem pasta térmica, então vê o aviso da etapa que falta.
- Dado a placa-mãe no gabinete, quando os espaçadores não foram colocados, então a fixação é recusada com explicação.
- Dado uma ordem incorreta, quando ela ocorre, então é registrada como erro de ordem no relatório.

**US-07 – Cumprir o protocolo ESD (MVP).** Como aluno, quero colocar a pulseira antiestática antes de mexer nas peças, para aprender a segurança do trabalho.

- Dado o início da missão, quando o aluno ainda não colocou a pulseira, então as peças sensíveis não podem ser manuseadas e o sistema explica o motivo.
- Dado a pulseira colocada, quando o aluno manuseia as peças, então a bancada fica liberada.
- Dado que o aluno tira a pulseira durante a prática, quando toca uma peça sensível, então recebe o aviso e o descuido é registrado.

**US-08 – Ligar o computador e ver o POST (MVP).** Como aluno, quero fazer o jump nos pinos de Power e ver o resultado, para validar minha montagem.

- Dado a montagem mínima correta, quando fecha os pinos de Power com a chave de fenda, então o equipamento liga e o monitor virtual exibe o POST.
- Dado a ausência de um componente mínimo (CPU, memória, fonte ou cabo de vídeo), quando tenta ligar, então o monitor fica sem imagem e o feedback indica a causa provável.
- Dado o POST concluído, quando o aluno confirma, então a missão é finalizada e o relatório é aberto.

## 3. Aprendizagem

**US-09 – Seguir o Modo Guiado (MVP).** Como aluno, quero ser conduzido passo a passo, para aprender com segurança na primeira vez.

- Dado o Modo Guiado, quando a missão começa, então a situação-problema e o primeiro passo aparecem na tela.
- Dado um passo concluído, quando o aluno avança, então o passo seguinte é indicado.
- Dado uma dúvida, quando pede dica, então recebe uma dica sem receber a resposta pronta.

**US-10 – Receber feedback imediato (MVP).** Como aluno, quero saber na hora se acertei ou errei, para corrigir e aprender.

- Dado um erro, quando ocorre, então a mensagem aparece em até 1 segundo e diz o que houve e como corrigir.
- Dado um acerto, quando ocorre, então há confirmação visual simples.

**US-11 – Ver o relatório da sessão (MVP).** Como aluno, quero ver meu desempenho ao final, para saber o que melhorar.

- Dado a missão concluída, quando o relatório abre, então mostra tempo total, erros por tipo, boas práticas cumpridas e nota.
- Dado o relatório gerado, quando o aluno sai, então ele fica salvo no servidor e pode ser consultado depois.
- Dado o relatório salvo, quando o professor consulta, então vê o mesmo conteúdo.

**US-12 – Fazer exercícios e autoavaliação (V1).** Como aluno, quero responder questões da missão e refletir sobre meu desempenho, para fixar o conteúdo.

- Dado o fim da missão, quando o aluno abre os exercícios, então recebe questões de dificuldade crescente.
- Dado uma resposta, quando a envia, então vê o resultado e a explicação.
- Dado a autoavaliação, quando a preenche, então ela é salva junto ao relatório.

## 4. Primeira versão (V1)

**US-13 – Montar o computador no gabinete (V1).** Como aluno, quero montar o computador completo no gabinete, para praticar o processo inteiro.

- Dado o gabinete aberto, quando instala espaçadores, placa-mãe, fonte, armazenamento, placa de expansão e cabos, então cada etapa é validada como na bancada.
- Dado a montagem concluída, quando liga o computador, então o POST completo é exibido.

**US-14 – Praticar sem dicas (V1).** Como aluno, quero refazer a missão sem ajuda e com avaliação, para provar que aprendi.

- Dado o modo Avaliação, quando a missão começa, então não há dicas e o tempo é contado.
- Dado a missão concluída, quando o relatório é gerado, então ele indica o modo usado.

**US-15 – Acompanhar a turma (V1).** Como professor, quero ver o desempenho de todos os alunos em um painel, para identificar quem precisa de apoio.

- Dado o painel aberto, quando escolhe uma turma, então vê a lista de alunos com o estado de cada missão (não iniciada, em andamento, concluída).
- Dado uma missão, quando a seleciona, então vê o tempo médio e os erros mais frequentes da turma.
- Dado um aluno, quando o seleciona, então vê o histórico de relatórios.
- Dado 45 alunos em atividade, quando o painel atualiza, então os dados aparecem em até 5 segundos.

**US-16 – Liberar missões (V1).** Como professor, quero escolher quais missões a turma pode abrir, para seguir meu planejamento de aula.

- Dado uma missão bloqueada, quando o professor a libera para a turma, então os alunos passam a vê-la.
- Dado uma missão liberada, quando o professor a bloqueia, então ela deixa de ser aberta por novos acessos.

**US-17 – Ganhar pontos e insígnias (V1).** Como aluno, quero acumular pontos e conquistas, para me manter motivado.

- Dado uma missão concluída, quando o relatório é gerado, então os pontos são somados ao meu total.
- Dado a pontuação da missão, quando é calculada, então boas práticas (ESD, ordem correta) valem mais do que a velocidade; o bônus de tempo é de no máximo 20% do total.
- Dado uma meta atingida, quando ocorre, então a insígnia correspondente é concedida.
- Dado o ranking opcional da turma, quando está ativo, então mostra posições sem expor os erros individuais.

**US-18 – Diagnosticar por bipes e BIOS (V1).** Como aluno, quero ouvir os bipes de erro e consultar a tela de setup, para aprender o diagnóstico sonoro.

- Dado uma falha de memória, quando liga o computador, então o sistema emite o padrão sonoro correspondente.
- Dado cada bipe, quando toca, então aparece uma legenda visual equivalente.
- Dado o setup da BIOS, quando o aluno o abre, então pode alterar a ordem de boot e ver as informações do hardware detectado.

## 5. Desejáveis (versões seguintes)

**US-19 – Resolver defeitos sorteados (V5).** Como aluno, quero receber um computador com defeito para diagnosticar e reparar.

- Dado um cenário de defeito, quando a missão começa, então o equipamento tem uma falha oculta definida nos dados.
- Dado o reparo concluído, quando o aluno testa o equipamento, então o sistema verifica se a causa correta foi resolvida.

**US-20 – Gerar o laudo técnico (V5).** Como aluno, quero um rascunho de laudo a partir da minha sessão, para treinar a redação técnica.

- Dado uma missão de reparo concluída, quando o aluno pede o laudo, então recebe um rascunho com equipamento, defeito relatado, testes realizados, diagnóstico, solução e orçamento.
- Dado o rascunho, quando o aluno o edita, então pode salvar e imprimir.

## 6. Histórias transversais

**US-21 – Usar o sistema com acessibilidade (MVP).** Como aluno com necessidades específicas, quero usar o sistema com recursos de acessibilidade, para participar das mesmas atividades.

- Dado qualquer imagem, peça ou ícone, quando lido por um leitor de tela, então tem texto alternativo.
- Dado o texto da interface, quando medido, então atende ao contraste mínimo recomendado (WCAG AA).
- Dado uma ação essencial (selecionar, encaixar, confirmar), quando o aluno usa só o teclado, então ela pode ser concluída.

**US-22 – Carregar rápido com a turma toda (MVP).** Como professor, quero que 45 alunos abram a mesma missão ao mesmo tempo, para não perder tempo de aula.

- Dado 45 alunos iniciando a mesma missão, quando carregam, então a primeira carga termina em até 30 segundos.
- Dado uma segunda carga da mesma missão, quando o navegador a abre, então os arquivos saem do cache.

---

# Documento 6 – Requisitos funcionais e não funcionais

A lista abaixo organiza o que o sistema deve fazer (RF) e as qualidades que deve ter (RNF). Cada requisito aponta a história de origem (Documento 5) e a versão em que entra. Os valores numéricos são propostas.

## 1. Requisitos funcionais

| ID | Requisito | Origem | Versão |
| --- | --- | --- | --- |
| RF-01 | Autenticar todos os usuários por usuário e senha | US-01 | MVP |
| RF-02 | Bloquear a conta temporariamente após 5 tentativas falhas seguidas | US-01 | MVP |
| RF-03 | Encerrar a sessão após período de inatividade | US-01 | MVP |
| RF-04 | Permitir ao professor criar contas de alunos, uma a uma ou por importação de lista | US-02 | MVP |
| RF-05 | Exigir a troca da senha provisória na primeira entrada | US-02 | MVP |
| RF-06 | Exibir a bancada 3D com câmera orbital, zoom e realce de peças | US-03 | MVP |
| RF-07 | Mostrar nome, função e especificações da peça selecionada | US-03 | MVP |
| RF-08 | Arrastar e encaixar peças por proximidade, com realce do local correto | US-04 | MVP |
| RF-09 | Devolver a peça à posição anterior quando solta fora de um local válido | US-04 | MVP |
| RF-10 | Permitir retirar peças já encaixadas | US-04 | MVP |
| RF-11 | Validar a compatibilidade das peças conforme o Documento 7 e explicar cada recusa | US-05 | MVP |
| RF-12 | Validar a ordem de montagem e avisar sobre a etapa que falta | US-06 | MVP |
| RF-13 | Exigir a pulseira antiestática antes de manusear peças sensíveis | US-07 | MVP |
| RF-14 | Simular o jump nos pinos de Power e exibir o POST no monitor virtual | US-08 | MVP |
| RF-15 | Indicar a causa provável quando o monitor fica sem imagem | US-08 | MVP |
| RF-16 | Oferecer o Modo Guiado com passos e dicas | US-09 | MVP |
| RF-17 | Dar feedback em até 1 segundo, dizendo o que houve e como corrigir | US-10 | MVP |
| RF-18 | Gerar o relatório da sessão (tempo, erros por tipo, boas práticas e nota) e salvá-lo no servidor | US-11 | MVP |
| RF-19 | Permitir ao aluno consultar os próprios relatórios anteriores | US-11 | MVP |
| RF-20 | Oferecer exercícios graduados e autoavaliação ao fim da missão | US-12 | V1 |
| RF-21 | Permitir a montagem completa no gabinete | US-13 | V1 |
| RF-22 | Oferecer o modo Avaliação, sem dicas e com tempo contado | US-14 | V1 |
| RF-23 | Exibir o painel do professor: alunos por turma, estado de cada missão, tempo médio, erros frequentes e histórico por aluno | US-15 | V1 |
| RF-24 | Permitir ao professor liberar e bloquear missões por turma | US-16 | V1 |
| RF-25 | Calcular pontos, níveis e insígnias e oferecer ranking opcional | US-17 | V1 |
| RF-26 | Emitir bipes de erro com legenda visual e oferecer a tela de BIOS (ordem de boot e hardware detectado) | US-18 | V1 |
| RF-27 | Apresentar cenários de defeito definidos em arquivo de dados | US-19 | V5 |
| RF-28 | Verificar se o reparo resolveu a causa do defeito | US-19 | V5 |
| RF-29 | Gerar rascunho de laudo técnico editável e imprimível | US-20 | V5 |
| RF-30 | Permitir ao administrador cadastrar professores e turmas e atualizar peças, cenários e questões por arquivos de dados | PRD | MVP |
| RF-31 | Marcar cada missão com o módulo e as aulas do currículo que ela atende | Documento 2 | MVP |

## 2. Requisitos não funcionais

| ID | Categoria | Requisito | Origem |
| --- | --- | --- | --- |
| RNF-01 | Desempenho | No mínimo 30 quadros por segundo nos computadores da sala | US-03 |
| RNF-02 | Carga | Até 30 MB por missão na primeira carga; com 45 alunos iniciando juntos, a primeira carga termina em até 30 segundos | US-22 |
| RNF-03 | Cache | Cargas seguintes da mesma missão saem do cache do navegador | US-22 |
| RNF-04 | Compatibilidade | Funcionar no Chromium 157.x e no Firefox 160.x em Kubuntu 26.04 | PRD |
| RNF-05 | Disponibilidade | Operar na rede local, sem internet, em servidor Ubuntu Server 26.04 LTS | PRD |
| RNF-06 | Capacidade | Atender 45 usuários simultâneos de uma turma em rede Gigabit | Documento 3 |
| RNF-07 | Segurança | Guardar senhas com hash seguro (Argon2 ou bcrypt), usar HTTPS com certificado interno e expirar sessões | US-01 |
| RNF-08 | Privacidade | Guardar apenas nome, turma e dados de desempenho, no servidor da escola e sem envio a terceiros | PRD |
| RNF-09 | Acessibilidade | Texto alternativo nos recursos visuais, contraste no nível WCAG AA, ações essenciais por teclado e legenda visual para sons | US-21 |
| RNF-10 | Manutenção | Peças, regras, cenários e questões em arquivos JSON validados por esquema | PRD |
| RNF-11 | Usabilidade | Interface em português do Brasil, com termos em inglês explicados na primeira ocorrência | PRD |
| RNF-12 | Desempenho do painel | Atualizar os dados de 45 alunos em até 5 segundos | US-15 |
| RNF-13 | Continuidade | Cópia de segurança automática diária dos dados de desempenho | Proposta |
| RNF-14 | Licenciamento | Todo modelo 3D com licença registrada e compatível com o uso escolar | Documento 3 |

---

# Documento 7 – Regras de negócio

As regras abaixo definem o comportamento do simulador e saem diretamente do currículo da disciplina. Os atributos das peças (soquete, tipo de memória, consumo e outros) ficam em arquivos de dados, descritos no Documento 11.

## 1. Compatibilidade de peças

| ID | Regra | Momento da verificação |
| --- | --- | --- |
| RN-01 | A CPU só encaixa em placa-mãe com o mesmo soquete | Ao encaixar |
| RN-02 | A memória deve ser do mesmo tipo (DDR3, DDR4 ou DDR5) que a placa-mãe aceita, e só encaixa em slot livre | Ao encaixar |
| RN-03 | A placa-mãe só entra em gabinete que aceite o seu formato; o gabinete aceita o seu formato e os menores (ATX, Micro-ATX, Mini-ITX) | Ao encaixar |
| RN-04 | O cooler deve ser compatível com o soquete e, no gabinete, caber na altura disponível | Ao encaixar |
| RN-05 | A potência da fonte deve ser pelo menos 20% maior que a soma dos consumos das peças (margem proposta) | Ao ligar |
| RN-06 | A fonte deve ter os conectores exigidos: 24 pinos para a placa-mãe, EPS de 4 ou 8 pinos para a CPU e PCIe de 6 ou 8 pinos para a placa de vídeo, quando exigido | Ao ligar |
| RN-07 | Armazenamento SATA ou M.2 só funciona se a placa-mãe tiver a interface correspondente | Ao encaixar |
| RN-08 | A placa de vídeo dedicada exige slot PCIe x16 livre e energia PCIe, quando aplicável | Ao encaixar e ao ligar |
| RN-09 | Conectores de energia e de dados só encaixam no conector correspondente e na orientação correta | Ao encaixar |
| RN-10 | Para exibir o POST, são necessários CPU, memória, fonte e cabo de vídeo ligado ao monitor | Ao ligar |

## 2. Ordem de montagem

Cada etapa só é liberada quando os pré-requisitos foram cumpridos; caso contrário, o sistema avisa e registra erro de ordem.

| Etapa | Pré-requisito | Observação |
| --- | --- | --- |
| 1. Pulseira antiestática | Nenhum | Antes de qualquer peça sensível |
| 2. CPU no soquete | Pulseira | Alinhar pelo triângulo dourado |
| 3. Pasta térmica | CPU instalada | Dosagem correta (gota central) |
| 4. Cooler | CPU e pasta térmica | Conectar ao conector CPU\_FAN |
| 5. Memórias | Pulseira | Slots indicados para dual-channel |
| 6. Cabo de vídeo | Placa-mãe com saída de vídeo ou placa de vídeo |  |
| 7. Cabos de energia (24 pinos e EPS) | Fonte com a chave desligada | Desligar a fonte antes de conectar |
| 8. Jump nos pinos de Power | Todas as etapas anteriores e fonte ligada | Fecha a bancada do MVP |

No gabinete (versão 1), a sequência é: espelho traseiro, espaçadores, placa-mãe já com CPU, cooler e memória, fonte, armazenamento, placa de expansão, cabos de energia e do painel frontal, checagem final e primeira energização.

## 3. Protocolo ESD

- **RN-11:** a pulseira deve estar colocada, e ligada ao ponto de aterramento da bancada, antes de manusear CPU, memória, placa-mãe, placas de expansão ou armazenamento.
- **RN-12:** se o aluno retira a pulseira e toca uma peça sensível, o sistema avisa e registra a violação no relatório.
- **RN-13:** a violação de ESD não destrói a peça no simulador, mas reduz a nota de segurança e aparece no painel do professor.

## 4. Pontuação da missão (proposta)

| Componente | Pontos | Como é calculado |
| --- | --- | --- |
| Segurança (ESD) | 20 | Pontuação total se a pulseira foi usada o tempo todo; desconto de 10 pontos por violação, até zero |
| Ordem de montagem | 30 | Desconto de 5 pontos por erro de ordem, até zero |
| Compatibilidade | 30 | Desconto de 5 pontos por peça recusada, até zero; repetir o erro na mesma peça conta uma vez |
| Tempo | 20 | Pontuação total se concluir dentro do tempo de referência da missão; cai de forma linear até zero em 2 vezes o tempo de referência |

- A nota vai de 0 a 100, e o bônus de tempo nunca passa de 20% dela.
- A missão é considerada concluída quando o POST é exibido, e aprovada com nota de 60 ou mais.
- No Modo Guiado, cada dica usada desconta 2 pontos, até 10. A nota do Modo Guiado é formativa e não entra no ranking; a nota do modo Avaliação é a oficial.
- O tempo de referência de cada missão é definido nos arquivos de dados, e não no código.

## 5. Gamificação

- **RN-14:** a nota de cada missão soma pontos ao total do aluno; em tentativas repetidas, só a melhor nota entra no ranking, e todas aparecem no histórico.
- **RN-15:** o nível do aluno sobe conforme o total de pontos (faixas a definir no Documento 8).
- **RN-16:** insígnias previstas: Técnico ESD-safe (3 missões seguidas sem violação), Montador Preciso (missão sem erro de ordem ou de compatibilidade), Ágil (missão concluída abaixo do tempo de referência) e Caçador de Defeitos (cenário de defeito resolvido, na versão 5).
- **RN-17:** o ranking é opcional e ativado pelo professor; mostra apenas posição e pontos, sem expor erros individuais.

## 6. Contas e acesso

- **RN-18:** a senha provisória é gerada pelo sistema, serve para uma única entrada e deve ser trocada logo em seguida.
- **RN-19:** a senha tem no mínimo 8 caracteres.
- **RN-20:** após 5 tentativas falhas seguidas, a conta fica bloqueada por 5 minutos; a sessão expira após 30 minutos de inatividade (valores propostos).
- **RN-21:** o aluno vê apenas os próprios dados e o ranking da turma; o professor vê apenas as turmas sob sua responsabilidade.

## 7. Missões e liberação

- **RN-22:** uma missão só abre se o professor a liberou para a turma e se o aluno concluiu a missão anterior da mesma trilha, seguindo a ordem de dificuldade da seção 14.
- **RN-23:** toda missão tem uma etiqueta com o módulo e as aulas do currículo que ela atende.
- **RN-24:** os relatórios são guardados durante o ano letivo; ao final, o professor pode arquivá-los ou excluí-los (proposta).

---

# Documento 8 – Design pedagógico e de gamificação

Este documento define como o aluno aprende dentro do VIRTUHAR3D: a estrutura de uma missão, os modos de uso, a avaliação, a intervenção do professor e a gamificação. A duração das etapas, as faixas de nível e os demais valores são propostas.

## 1. Princípios

- **Trabalho como princípio educativo:** toda missão é uma ordem de serviço de uma assistência técnica fictícia, com cliente, equipamento e relato do defeito, como na simulação da aula 80.
- **Aprender fazendo, com segurança:** o erro é permitido e explicado, nunca punido com perda definitiva.
- **Processo antes da velocidade:** segurança e procedimento correto valem mais pontos do que o tempo.
- **Contexto antes da definição:** a missão começa por um problema real, nunca por um conceito solto.
- **Integração com a Formação Geral Básica:** Física (eletricidade e descarga eletrostática), Matemática (potência e sistema binário), Língua Portuguesa (relatório e laudo) e Inglês técnico (POST, BIOS, jumper).
- **Acessibilidade:** mais de uma forma de perceber a informação (texto, imagem, som com legenda).

## 2. Estrutura de uma missão

Cada missão cabe em uma aula de 50 minutos e segue o ciclo abaixo.

| Etapa | Duração | O que acontece |
| --- | --- | --- |
| Ordem de serviço | 5 min | O cliente relata o problema; o aluno responde a 2 ou 3 perguntas de conhecimentos prévios |
| Micro-aula | 5 min | Explicação curta com apoio 3D e glossário |
| Prática | 30 min | O aluno executa a tarefa na bancada virtual |
| Exercícios | 7 min | Questões graduadas sobre o que praticou |
| Relatório e autoavaliação | 3 min | O aluno vê o desempenho e registra o que ainda precisa revisar |

## 3. Modos de uso

|  | Guiado | Prática Livre | Avaliação |
| --- | --- | --- | --- |
| Dicas | Sim, com desconto de 2 pontos | Não | Não |
| Tempo | Registrado | Registrado, sem pontuação de tempo | Contado e pontuado |
| Nota | Formativa | Formativa | Oficial |
| Ranking | Não | Não | Sim, se ativado pelo professor |
| Quando usar | Primeira vez na missão | Treino e repetição | Prova prática |
| Versão | MVP | V1 | V1 |

## 4. Níveis de profundidade

- **Essencial:** o que todo aluno precisa para concluir a missão.
- **Complementar:** explicações extras que aparecem quando o aluno erra ou pede mais.
- **Avançado:** cartões opcionais de desafio e pesquisa, que nunca interrompem a prática.

## 5. Cartões pedagógicos na interface

O sistema usa um conjunto reduzido de cartões, inspirado no manual editorial, que aparecem no momento certo da missão.

| Cartão | Quando aparece |
| --- | --- |
| Atenção | Antes de uma ação de risco ou de uma incompatibilidade provável |
| Segurança | ESD, desligar a fonte, uso de ferramentas |
| Erros frequentes | Depois de um erro, mostrando como evitá-lo |
| Dica profissional | Boas práticas do mercado, ao concluir uma etapa |
| Conexão com a FGB | Física, Matemática, Língua Portuguesa ou Inglês relacionados ao passo atual |
| Curiosidade | Contexto histórico ou tecnológico, ao final da missão |
| Desafio | Problema aberto e opcional (nível Avançado) |

## 6. Avaliação

| Tipo | Instrumento no sistema |
| --- | --- |
| Diagnóstica | Perguntas de conhecimentos prévios no início da missão |
| Formativa | Feedback imediato, dicas, cartões e relatório do Modo Guiado e da Prática Livre |
| Somativa | Nota do modo Avaliação, calculada pelas regras do Documento 7 |
| Autoavaliação | Quadro de metacognição ao final: o que consigo explicar, o que consigo executar e o que preciso rever |

Os exercícios usam os seis níveis cognitivos já presentes no currículo da disciplina: Fixação, Compreensão, Aplicação, Análise, Projeto e Integração. Cada missão traz questões dos níveis que fazem sentido para o seu conteúdo, sem proporção fixa.

## 7. Intervenção do professor

O painel mostra sinais para o professor agir durante e depois da aula.

| Sinal no painel | Ação possível |
| --- | --- |
| Aluno parado na mesma etapa por mais de 5 minutos | Ir até a bancada ou enviar uma dica |
| Mesmo erro repetido 3 vezes | Indicar reforço da regra correspondente |
| Violação de ESD | Retomar o protocolo com o aluno ou a turma |
| Erros mais frequentes da turma | Planejar uma revisão coletiva na aula seguinte |
| Aluno sem tentativas na semana | Liberar uma missão de recuperação |

## 8. Gamificação

- **Pontos:** a nota da missão (0 a 100, regras do Documento 7) soma ao total do aluno.
- **Níveis (faixas propostas):** Aprendiz (0 a 199), Montador (200 a 499), Técnico (500 a 999), Técnico Sênior (1.000 a 1.799) e Mestre (a partir de 1.800).
- **Insígnias:** as quatro do Documento 7, mais uma por missão concluída pela primeira vez.
- **Narrativa:** a assistência técnica ganha reputação conforme o aluno conclui ordens de serviço; clientes novos aparecem a cada missão.
- **Cooperação:** meta coletiva da turma (ex.: todas as ordens de serviço do mês concluídas), sem expor erros individuais.
- **Princípio de proteção:** nenhum elemento do jogo pode premiar atalhos que quebrem o procedimento, como ignorar o ESD para ganhar tempo.

## 9. Catálogo inicial de missões

Todas pertencem à trilha de montagem de hardware e carregam a etiqueta de módulo e aulas do currículo (RF-31).

| Missão | Versão | Aulas | Competência trabalhada |
| --- | --- | --- | --- |
| M00 – Conheça a bancada e o protocolo ESD (tutorial) | MVP | 10, 36 | Identificar componentes e aplicar proteção antiestática |
| M01 – Teste de bancada: do jump ao POST | MVP | 51, 60 | Montar o conjunto mínimo e validar o POST |
| M02 – Montagem completa no gabinete | V1 | 46 a 50 | Montar com ordem correta e organização de cabos |
| M03 – Falhas comuns de montagem | V1 | 52 | Identificar e corrigir erros simples de montagem |
| M04 – Orçamento e compatibilidade de peças | V1 | 22, 25, 34 | Especificar peças compatíveis dentro de um orçamento |
| M05 – BIOS, bipes e ordem de boot | V1 | 26 a 30, 62 | Interpretar sinais do POST e configurar o setup |
| M06 – Montagem cronometrada | V1 | 53 | Montar de forma ágil com qualidade |

---

# Documento 9 – UX: fluxos, telas e wireframes

Os [wireframes das cinco telas principais](https://claude.ai/artifact/FQgVCMndxVLbiEYCbByZqu) (entrada, missões, bancada 3D, relatório e painel do professor) acompanham este documento. Eles são de baixa fidelidade e definem a estrutura de cada tela, não o visual final.

## 1. Inventário de telas

| Tela | Usuário | Versão | Função |
| --- | --- | --- | --- |
| Entrada | Todos | MVP | Autenticação por usuário e senha |
| Troca de senha | Todos | MVP | Troca obrigatória da senha provisória no primeiro acesso |
| Missões | Aluno | MVP | Trilha de missões, com estado, modo e etiqueta de aulas |
| Ordem de serviço e micro-aula | Aluno | MVP | Relato do cliente, conhecimentos prévios e explicação curta |
| Bancada 3D | Aluno | MVP | Montagem, ESD, jump e POST |
| Relatório | Aluno | MVP | Nota, erros, boas práticas e autoavaliação |
| Contas e turmas | Professor | MVP | Criação de contas, uma a uma ou por importação de lista |
| Exercícios | Aluno | V1 | Questões graduadas da missão |
| BIOS | Aluno | V1 | Setup dentro da bancada: ordem de boot e hardware detectado |
| Meu progresso | Aluno | V1 | Pontos, nível e insígnias |
| Painel da turma | Professor | V1 | Estado das missões, sinais de alerta e erros frequentes |
| Detalhe do aluno | Professor | V1 | Histórico de relatórios do aluno |
| Liberação de missões | Professor | V1 | Liberar e bloquear missões por turma |

**Ajuste na regra RN-22:** como a liberação pelo professor só entra na V1, no MVP as missões M00 e M01 vêm liberadas por padrão.

## 2. Fluxo do aluno

1. Entra no sistema; no primeiro acesso, troca a senha provisória.
2. Vê a trilha de missões e escolhe uma missão disponível e o modo de uso.
3. Lê a ordem de serviço, responde às perguntas de conhecimentos prévios e vê a micro-aula.
4. Na bancada, coloca a pulseira antiestática, monta o conjunto na ordem correta e faz o jump nos pinos de Power.
5. Vê o POST no monitor virtual e conclui a prática.
6. Responde aos exercícios (V1).
7. Recebe o relatório, faz a autoavaliação e volta às missões.

## 3. Fluxo do professor

1. Entra no sistema e abre o painel da turma.
2. A partir do painel, cria contas, libera missões ou abre o detalhe de um aluno.
3. Acompanha os sinais de alerta e os erros mais frequentes para planejar a aula seguinte.

## 4. Layout da bancada 3D

- **Barra superior:** missão, modo de uso, tempo, estado da pulseira ESD e botão de dica.
- **Coluna esquerda:** lista de peças e ferramentas disponíveis.
- **Centro:** área 3D com o monitor virtual.
- **Coluna direita:** ordem de serviço e lista de passos.
- **Barra inferior:** feedback imediato, com o que houve e como corrigir.

## 5. Interação com a bancada

| Ação | Mouse | Teclado (alternativa) |
| --- | --- | --- |
| Girar a câmera | Arrastar no fundo | Teclas de seta com a cena em foco |
| Aproximar ou afastar | Roda do mouse | Teclas de mais e menos |
| Selecionar peça | Clique | Tab entre as peças e Enter |
| Mover e encaixar | Arrastar até o local realçado | Escolher o local de encaixe com as setas e confirmar com Espaço |
| Retirar peça | Arrastar para fora do local | Selecionar a peça e tecla Delete |

O sistema é pensado para computadores de mesa; não há suporte a toque no MVP.

## 6. Princípios de interface

- Contraste de texto no nível WCAG AA e área de clique de pelo menos 44 px.
- Texto de no mínimo 14 px e frases curtas, em português do Brasil.
- A cor nunca é o único sinal: erros, acertos e avisos também têm texto e ícone.
- Todo som tem legenda visual equivalente.
- A interface (menus, painéis, mensagens) é construída em HTML sobre a cena 3D, para ser acessível a leitores de tela.
- Mensagens de erro dizem o que houve e como corrigir, em até 1 segundo.

## 7. Tipos de mensagem

| Tipo | Quando aparece | Exemplo de conteúdo |
| --- | --- | --- |
| Acerto | Etapa concluída corretamente | Confirmação curta com ícone de visto |
| Aviso | Antes de uma ação de risco | Lembrete de desligar a fonte antes de conectar os cabos |
| Erro | Ação recusada | Motivo da recusa e como corrigir |
| Dica | O aluno pede ajuda no Modo Guiado | Pista sem a resposta pronta, com desconto de 2 pontos |

## 8. Tela de referência

Resolução mínima de 1366 por 768 pixels (confirmada), com layout que se adapta a telas maiores.

---

# Documento 10 – Arquitetura técnica e registro de decisões (ADR)

A arquitetura mantém o conjunto simples o bastante para um único desenvolvedor, com 10 horas por semana, e leve o bastante para computadores Core i3 com 4 GB de RAM. Todas as decisões abaixo são propostas, para você aprovar ou trocar. As versões exatas das ferramentas serão fixadas no repositório, usando as versões estáveis da época do desenvolvimento.

## 1. Visão geral

| Camada | Onde roda | Responsabilidade |
| --- | --- | --- |
| Aplicação web (front-end) | Navegador do aluno ou do professor | Interface, cena 3D, motor de regras e feedback |
| Servidor web | Servidor Ubuntu 26.04 LTS | HTTPS, entrega dos arquivos estáticos, compressão e cache |
| API | Servidor Ubuntu 26.04 LTS | Autenticação, missões, sessões, relatórios e painel |
| Banco de dados | Servidor Ubuntu 26.04 LTS | Contas, turmas, relatórios e progresso |
| Conteúdo | Arquivos no servidor | Peças, regras, missões, questões e modelos 3D |

## 2. Decisões

| ID | Decisão | Alternativa descartada | Motivo |
| --- | --- | --- | --- |
| ADR-01 | Aplicação web de página única, servida pela rede local | Aplicativo instalado em cada computador | Nada para instalar nos 45 computadores; atualização em um só lugar |
| ADR-02 | TypeScript, React e Vite no front-end | Next.js | Não há necessidade de renderização no servidor; Vite é mais simples e rápido |
| ADR-03 | Three.js com React Three Fiber e drei para a cena 3D | Babylon.js ou Three.js puro | Ecossistema grande e integração direta com React; sugerido no seu documento inicial |
| ADR-04 | Interface em HTML sobre o canvas 3D, com Tailwind | Interface desenhada dentro do 3D | Acessibilidade por leitores de tela e teclado |
| ADR-05 | Motor de regras em TypeScript puro, separado da cena 3D | Regras misturadas aos componentes 3D | Pode ser testado sem tela; usa os mesmos dados do Documento 11 |
| ADR-06 | Conteúdo em JSON validado por esquema | Conteúdo escrito no código | Novas peças, missões e questões sem alterar código |
| ADR-07 | API em Node.js com TypeScript (Fastify) | Python ou PHP | Mesma linguagem do front-end, um só ambiente para aprender e manter |
| ADR-08 | PostgreSQL em contêiner Docker | SQLite em modo WAL | Aprovado pelo administrador do servidor; comporta mais turmas no futuro, tem backup com pg\_dump e esquema versionado por migrações. O SQLite continua sendo a opção mais simples para uma turma só |
| ADR-09 | Sessão por cookie HttpOnly e Secure, senha com Argon2id e limite de tentativas | Tokens JWT | Mais simples e seguro para um sistema de rede local |
| ADR-10 | nginx como servidor web e proxy da API, com HTTPS | Acesso por HTTP simples | Autenticação segura exige HTTPS; nginx é amplamente documentado no Ubuntu |
| ADR-11 | Execução em contêineres Docker, com Docker Compose (API, banco de dados e nginx) | Serviços instalados direto no sistema (systemd) | Administrador aceitou instalar o Docker; ambiente igual no desenvolvimento e no servidor, com implantação e retorno de versão simples |
| ADR-12 | Modelos em GLB com compressão Meshopt e texturas em WebP | Formatos pesados ou texturas sem compressão | Respeita o limite de 30 MB por missão |
| ADR-13 | Cache HTTP com arquivos de nome versionado; sem PWA no MVP | PWA com modo offline | A rede local dispensa o modo offline; o cache do navegador resolve as cargas seguintes |
| ADR-14 | Bipes gerados pelo Web Audio, com legenda visual | Arquivos de áudio | Sem arquivos extras e fácil de legendar |
| ADR-15 | Testes automáticos do motor de regras (Vitest) e testes de ponta a ponta nas missões (Playwright) | Apenas testes manuais | Protege as regras dos Documentos 7 e 11 contra regressões |
| ADR-16 | Repositório Git único, com pastas para web, servidor, regras e conteúdo | Vários repositórios | Um desenvolvedor, versões sincronizadas |
| ADR-17 | Código hospedado no GitHub, com a esteira de integração no GitHub Actions | Servidor Git local (Gitea) com esteira no servidor da escola | Decisão do professor; dispensa manter a esteira no servidor e dá cópia externa do código |

## 3. Fluxo de dados de uma missão

1. O aluno escolhe a missão; o navegador baixa o conteúdo em JSON e os modelos 3D (ou os lê do cache).
2. Cada ação na bancada passa pelo motor de regras, que devolve o resultado (encaixou, recusou, erro de ordem) e a mensagem.
3. A interface mostra o feedback e a cena 3D atualiza a peça.
4. O navegador envia os eventos ao servidor em lotes a cada 5 segundos, para alimentar o painel do professor.
5. Ao concluir, o motor calcula a nota pelas regras do Documento 7 e o servidor grava o relatório.

O painel do professor consulta o servidor a cada 5 segundos. Com 45 alunos, isso dá cerca de 9 requisições por segundo, uma carga baixa para o servidor.

## 4. Interfaces principais da API

| Grupo | Funções |
| --- | --- |
| Autenticação | Entrar, sair, trocar senha, consultar o usuário atual |
| Missões | Listar missões disponíveis e baixar o conteúdo de uma missão |
| Sessões | Iniciar sessão, enviar eventos em lote, concluir e gravar o relatório |
| Relatórios | Listar os relatórios do aluno e de uma turma |
| Professor | Criar contas (individual ou por lista), liberar missões e ler o painel |

## 5. Segurança

- HTTPS em todo o tráfego, com certificado de uma autoridade certificadora interna da escola, instalada nos navegadores dos computadores dos alunos.
- Cookies de sessão com HttpOnly, Secure e SameSite; sessão expira após 30 minutos de inatividade.
- Limite de tentativas de entrada por conta e por endereço de rede.
- Cada rota confere o perfil do usuário: o aluno só lê os próprios dados e o professor só as próprias turmas.
- Política de segurança de conteúdo e cabeçalhos de proteção no nginx.
- Registro (log) de entradas, falhas e ações administrativas.

## 6. Operação do servidor

- **Dimensionamento proposto:** 2 núcleos, 4 GB de RAM (8 GB recomendado) e disco SSD, suficientes para uma turma de 45 alunos.
- **Backup:** cópia diária do banco de dados (pg\_dump) para outro disco, mais cópia do conteúdo (RNF-13).
- **Atualizações:** publicação de nova versão por imagens Docker versionadas, com possibilidade de voltar à versão anterior.
- **Certificado:** a instalação da autoridade certificadora interna nos 45 computadores é uma tarefa única, a combinar com quem administra o laboratório.

## 7. Estrutura do repositório

| Pasta | Conteúdo |
| --- | --- |
| web | Aplicação React e cena 3D |
| server | API em Node.js e acesso ao banco |
| rules | Motor de regras (compartilhado entre web e server) |
| content | JSON de peças, regras, missões e questões, e os modelos GLB |
| docs | Estes documentos |

## 8. Validação técnica inicial (Marco M1)

Antes de construir o MVP, um protótipo descartável deve provar quatro pontos em um computador real do laboratório: carregar um modelo GLB, selecionar e encaixar uma peça, manter pelo menos 30 quadros por segundo e abrir a página por HTTPS com a autoridade certificadora interna.

---

# Documento 11 – Modelo de dados

O modelo tem duas partes: o **conteúdo** (peças, regras, missões e questões), guardado em arquivos JSON validados por esquema, e o **banco de dados** (contas, turmas e desempenho), em PostgreSQL. Os nomes de campos usam português sem acentos, e os identificadores de conteúdo são textos estáveis (ex.: cpu-a), que nunca mudam depois de criados.

## 1. Conteúdo em arquivos JSON

Todo arquivo traz o campo schemaVersion, para permitir migrações futuras, e é validado por esquema na construção do projeto e no carregamento (RNF-10).

| Arquivo | Conteúdo |
| --- | --- |
| pecas.json | Catálogo de peças e ferramentas, com atributos de compatibilidade |
| regras.json | Parâmetros das regras do Documento 7 (margem da fonte, descontos e pesos da nota) |
| missoes/\*.json | Uma missão por arquivo, com passos, estado inicial e etiqueta de aulas |
| questoes.json | Banco de questões por missão e nível |
| insignias.json | Insígnias e condições |
| cenarios.json | Cenários de defeito (versão 5) |

### 1.1 Peça

| Campo | Descrição |
| --- | --- |
| id, tipo, nome | Identificador, categoria (cpu, cooler, ram, placa\_mae, fonte, gabinete, armazenamento, gpu, cabo, ferramenta) e nome exibido |
| modelo3d | Caminho do arquivo GLB |
| pontosDeEncaixe | Nomes dos locais de encaixe da peça no modelo 3D |
| sensivelESD | Verdadeiro para CPU, memória, placa-mãe, placas de expansão e armazenamento |
| consumoW | Consumo estimado, usado na regra da fonte |
| atributos | Campos específicos de cada tipo (veja abaixo) |
| descricao, textoAlternativo | Texto da peça e descrição para leitores de tela |
| licenca | Autor, tipo de licença (CC0, CC-BY...), origem e endereço do modelo 3D |

Atributos por tipo (os campos usados nas regras RN-01 a RN-10):

| Tipo | Atributos |
| --- | --- |
| cpu | soquete |
| cooler | soquetesCompativeis, alturaMm, potenciaTermicaW |
| ram | tipo (DDR3, DDR4 ou DDR5), capacidadeGB |
| placa\_mae | soquete, formato, tipoRam, slotsRam, slotsPcie, interfacesArmazenamento, saidaVideo, conectoresEnergia |
| fonte | potenciaW, conectores (24 pinos, EPS 4 ou 8, PCIe 6 ou 8, SATA) |
| gabinete | formatosAceitos, alturaMaxCoolerMm |
| armazenamento | interface (SATA ou M.2) |
| gpu | exigeEnergiaPcie, slot |

Exemplo resumido:

```json
{
  "id": "cpu-a",
  "tipo": "cpu",
  "nome": "Processador modelo A",
  "modelo3d": "modelos/cpu-a.glb",
  "pontosDeEncaixe": ["soquete"],
  "sensivelESD": true,
  "consumoW": 65,
  "atributos": { "soquete": "LGA1151" },
  "textoAlternativo": "Processador quadrado com contatos dourados na face inferior",
  "licenca": { "tipo": "CC0", "autor": "...", "origem": "..." }
}
```

### 1.2 Missão

| Campo | Descrição |
| --- | --- |
| id, titulo, trilha, versao | Identificação e posição no catálogo do Documento 8 |
| etiqueta | Módulo e aulas do currículo (RF-31) |
| ordemServico | Cliente fictício e relato do defeito |
| conhecimentosPrevios, microaula | Perguntas iniciais e conteúdo da explicação curta |
| pecasDisponiveis, estadoInicial | Peças na bancada e peças já instaladas no início |
| passos | Lista de passos, cada um com id, descrição, pré-requisitos (ids de outros passos) e ação esperada |
| tempoReferenciaSeg | Tempo de referência para a pontuação de tempo |
| cartoes | Cartões pedagógicos e gatilho de cada um (Documento 8) |
| questoes | Ids das questões da missão |

Exemplo resumido de passo:

```json
{
  "id": "instalar-cooler",
  "descricao": "Instalar o cooler sobre a CPU",
  "preRequisitos": ["instalar-cpu", "aplicar-pasta"],
  "acaoEsperada": { "tipo": "encaixar", "peca": "cooler-a", "em": "soquete" }
}
```

### 1.3 Questão

| Campo | Descrição |
| --- | --- |
| id, missao, nivel | Identificação e nível cognitivo (fixacao, compreensao, aplicacao, analise, projeto ou integracao) |
| enunciado, opcoes, correta | Texto, alternativas e alternativa certa |
| explicacao | Texto mostrado depois da resposta |
| tags | Assuntos relacionados, para reforço dirigido |

### 1.4 Cenário de defeito (versão 5)

| Campo | Descrição |
| --- | --- |
| id, equipamentoBase | Identificação e equipamento com a falha |
| defeito | Causa oculta, sintomas visíveis e padrão de bipes |
| solucao | Ação que resolve o defeito, usada na verificação do reparo (RF-28) |

## 2. Banco de dados (PostgreSQL)

| Tabela | Campos principais |
| --- | --- |
| usuarios | id, nome, usuario (único), hash\_senha, perfil (aluno, professor ou admin), senha\_provisoria, ativo, tentativas\_falhas, bloqueado\_ate, criado\_em |
| turmas | id, nome, ano\_letivo, professor\_id |
| matriculas | turma\_id, aluno\_id |
| liberacoes | turma\_id, missao\_id, liberada, atualizada\_em |
| sessoes\_login | id (hash do identificador), usuario\_id, expira\_em |
| sessoes\_missao | id, aluno\_id, missao\_id, modo, iniciada\_em, concluida\_em, estado, tempo\_seg, dicas\_usadas, nota\_total, nota\_esd, nota\_ordem, nota\_compat, nota\_tempo |
| eventos\_sessao | id, sessao\_id, instante\_ms, tipo, regra, detalhe |
| erros\_sessao | sessao\_id, tipo, regra, quantidade (resumo gravado ao concluir, para o painel) |
| respostas | sessao\_id, questao\_id, resposta, correta |
| autoavaliacoes | sessao\_id, explica, executa, revisar |
| pontuacao\_aluno | aluno\_id, pontos\_total, nivel |
| insignias\_aluno | aluno\_id, insignia\_id, conquistada\_em, sessao\_id |
| auditoria | id, usuario\_id, acao, detalhe, registrado\_em |

Relações principais: uma turma tem vários alunos (matriculas); um aluno tem várias sessões de missão; cada sessão tem vários eventos, erros, respostas e uma autoavaliação.

## 3. Convenções

- Datas e horas em UTC, no formato ISO 8601; a interface converte para o horário local. As tabelas são criadas e alteradas por migrações versionadas, guardadas no repositório.
- Notas em números inteiros de 0 a 100 (com 0 a 20 ou 0 a 30 por componente).
- A pontuação total e o nível do aluno são recalculados ao concluir cada sessão e guardados em pontuacao\_aluno, para o painel ler rápido.
- Para o ranking, vale a melhor nota do modo Avaliação em cada missão (RN-14).

## 4. Privacidade e retenção

- Só são guardados nome, usuário, turma e dados de desempenho (RNF-08).
- Os eventos detalhados de uma sessão podem ser apagados ao fim do ano letivo; os relatórios e as notas seguem a regra RN-24.
- Ao excluir um aluno, o sistema apaga suas sessões, respostas e insígnias, ou as torna anônimas, conforme a escolha do professor.
- A auditoria guarda quem fez cada ação administrativa, sem guardar senhas.

---

# Documento 12 – Guia de assets 3D

Este guia define o que deve ser produzido ou adaptado em 3D, com que limites e com que padrões, para que as peças funcionem no motor de regras (Documentos 7 e 11) e respeitem o desempenho das máquinas da sala. Os limites numéricos são propostas e devem ser conferidos no protótipo do Marco M1.

## 1. Lista de assets por versão

| Asset | Versão | Triângulos (máx.) |
| --- | --- | --- |
| Bancada de trabalho com tapete antiestático | MVP | 2.000 |
| Monitor virtual (com tela para o POST) | MVP | 3.000 |
| Placa-mãe com soquete, slots de memória, conectores e pinos do painel frontal | MVP | 15.000 |
| Processador | MVP | 1.000 |
| Cooler com ventoinha | MVP | 8.000 |
| Pente de memória (2 unidades iguais, mesmo modelo reaproveitado) | MVP | 2.000 |
| Fonte de alimentação | MVP | 5.000 |
| Cabos de energia (24 pinos e EPS) | MVP | 3.000 |
| Cabo de vídeo | MVP | 1.000 |
| Pulseira antiestática | MVP | 2.000 |
| Chave de fenda | MVP | 2.000 |
| Seringa de pasta térmica | MVP | 1.000 |
| Gabinete com painel lateral removível | V1 | 25.000 |
| Armazenamento (SSD e HD) | V1 | 4.000 |
| Placa de vídeo | V1 | 12.000 |
| Espaçadores, parafusos e espelho traseiro | V1 | 3.000 |
| Cabos SATA e do painel frontal | V1 | 4.000 |
| Placa de diagnóstico, notebook compacto e demais itens de reparo | V5 | a definir |

Os itens do MVP somam cerca de 47 mil triângulos, e os da V1 chegam a cerca de 95 mil, dentro da meta de 100 mil triângulos visíveis por cena. Instâncias repetidas (como as duas memórias) reaproveitam o mesmo modelo.

## 2. Formato e padrões técnicos

- **Formato:** glTF 2.0 em arquivo único (GLB), com compressão Meshopt.
- **Texturas:** WebP, de no máximo 1024 por 1024 pixels; peças pequenas usam 512 por 512 ou menos.
- **Materiais:** de preferência um material por peça, para reduzir chamadas de desenho; materiais simples (cor base, rugosidade e metal), sem transparência complexa.
- **Iluminação:** sombras e brilho pré-calculados (bake) nas texturas; sem sombras dinâmicas.
- **Escala e eixos:** unidades em metros, na escala real (uma placa-mãe ATX mede cerca de 30,5 por 24,4 cm); eixo Y para cima, como no padrão glTF.
- **Origem de cada peça:** no centro do ponto de contato principal, para facilitar o encaixe.
- **Tamanho de arquivo:** até 1,5 MB por peça e até 30 MB por missão, somando todos os modelos e texturas (RNF-02).

## 3. Pontos de encaixe

- Cada local de encaixe é um objeto vazio (empty) com nome começando por ponto\_, como ponto\_soquete, ponto\_ram1, ponto\_ram2 e ponto\_pcie1.
- Os nomes devem ser idênticos aos listados em pontosDeEncaixe no arquivo pecas.json (Documento 11).
- O eixo Y de cada ponto aponta no sentido em que a peça sai do encaixe, o que define a orientação correta.
- Peças que têm conectores (fonte e cabos) usam o mesmo padrão: ponto\_24pinos, ponto\_eps, ponto\_sata.

## 4. Nomenclatura

| Item | Regra | Exemplo |
| --- | --- | --- |
| Arquivo | minúsculas, hífen e sem acentos: tipo-identificador.glb | cpu-a.glb |
| Identificador da peça | igual ao id em pecas.json | cpu-a |
| Objetos internos | nomes em minúsculas e sem espaços | ventoinha, dissipador |
| Materiais | tipo\_material | placa\_mae\_pcb |
| Pastas | uma pasta por tipo | modelos/cpu, modelos/ram |

## 5. Origem dos modelos e licenças

- **Fontes sugeridas:** Sketchfab, Poly Pizza, Kenney.nl e GrabCAD, além de modelagem própria no Blender para as peças-chave (placa-mãe e conectores), que precisam de pontos de encaixe precisos.
- **Licenças aceitas:** CC0 e CC-BY. Evitar licenças que proíbem uso comercial ou modificação, porque os modelos serão adaptados e a escola pode querer compartilhar o projeto.
- **Marcas:** remover logotipos e marcas registradas das texturas, usando marcas genéricas.
- **Registro:** para cada modelo, guardar autor, tipo de licença, origem e endereço no campo licenca de pecas.json (Documento 11); a tela de créditos do aplicativo lista esses dados.
- **GrabCAD e similares:** conferir a licença de cada arquivo individualmente, pois os termos variam e muitos modelos não têm licença clara; sem licença clara, o modelo não entra.

## 6. Fluxo de produção de um asset

1. Escolher o modelo e conferir a licença.
2. Importar no Blender e limpar a geometria (remover detalhes internos invisíveis).
3. Reduzir os polígonos até o limite da tabela da seção 1.
4. Ajustar a escala real e a origem.
5. Criar os pontos de encaixe, com os nomes do Documento 11.
6. Preparar o material e a textura (WebP, tamanho dentro do limite).
7. Exportar para GLB e aplicar a compressão Meshopt.
8. Validar o arquivo com um validador de glTF e conferir triângulos e tamanho.
9. Registrar a peça em pecas.json, com licença e texto alternativo.
10. Testar o encaixe e o desempenho no protótipo.

## 7. Acessibilidade e leitura visual

- Cada peça tem texto alternativo e descrição em pecas.json (RNF-09).
- Peças diferentes se distinguem também por forma e rótulo, e não só por cor.
- O realce de seleção e de local de encaixe usa contorno e brilho com contraste suficiente sobre o fundo.

## 8. Critérios de aceite de um asset

Um modelo só é aprovado quando:

- a licença está registrada e é CC0 ou CC-BY;
- o número de triângulos está dentro do limite da seção 1;
- o arquivo tem até 1,5 MB e as texturas até 1024 pixels;
- a escala é real e a origem está no ponto de contato principal;
- os pontos de encaixe existem, com os nomes de pecas.json;
- não há logotipos de marcas;
- o texto alternativo está preenchido;
- o modelo carrega e encaixa no protótipo mantendo 30 quadros por segundo.

---

# Documento 13 – Roadmap, MVP e plano de releases

Este documento substitui os marcos do Documento 1. Como não há data prevista e o uso em aula só começa quando o projeto estiver concluído, as versões abaixo são marcos internos de desenvolvimento, e as datas são uma estimativa de planejamento, não um compromisso.

## 1. Premissas da estimativa

- Início do desenvolvimento em 1º de dezembro de 2026, com 10 horas por semana (cerca de 43 horas por mês).
- Esforço em horas estimado por mim, com incerteza de uns 40% para mais ou para menos; foi somada uma reserva de 25% para imprevistos, feriados e períodos de prova.
- A estimativa inclui produção dos modelos 3D, escrita do conteúdo das missões (textos, cartões e questões), testes e implantação no servidor.
- Não considerei o uso de assistentes de programação, que pode reduzir parte do esforço de código.

## 2. Plano de marcos e versões

| Marco | Entrega | Esforço (h) | Com reserva (h) | Fim estimado |
| --- | --- | --- | --- | --- |
| M1 – Protótipo técnico | Repositório, Docker Compose, um modelo GLB carregado, seleção e encaixe de uma peça, teste de 30 quadros por segundo e HTTPS em uma máquina do laboratório | 60 | 75 | Janeiro de 2027 |
| M2 – MVP | Bancada de teste completa (M00 e M01), regras, ESD, jump e POST, Modo Guiado, relatório, contas e acesso seguro | 340 | 425 | Novembro de 2027 |
| M3 – Teste interno do MVP | Testes com o professor e correções (ver seção 4) | 40 | 50 | Dezembro de 2027 |
| V1 – Montagem completa | Missões M02 a M06, gabinete, modos Livre e Avaliação, painel do professor, liberação de missões, gamificação, bipes, BIOS e exercícios | 515 | 644 | Março de 2029 |
| V2 – Instalação | Instalação de software e de sistema operacional | 160 | 200 | Agosto de 2029 |
| V3 – Configuração | Configuração de BIOS, drivers e sistema | 140 | 175 | Dezembro de 2029 |
| V4 – Diagnóstico | Diagnóstico de hardware e software | 160 | 200 | Maio de 2030 |
| V5 – Reparo | Bancada de Reparo, cenários de defeito e laudo técnico | 200 | 250 | Outubro de 2030 |
| **Total** |  | **1.615** | **2.019** | **Outubro de 2030** |

## 3. Composição do MVP (M2)

| Bloco | Esforço (h) |
| --- | --- |
| Modelos 3D do MVP (12 itens do Documento 12) | 55 |
| Motor de regras e testes | 40 |
| Cena 3D e interação | 60 |
| Telas e interface | 60 |
| API, banco de dados e acesso seguro | 60 |
| POST e simulação de energização | 20 |
| Conteúdo das missões M00 e M01 | 25 |
| Implantação no servidor, HTTPS e backup | 25 |
| Acessibilidade | 20 |
| Testes automáticos e correções | 25 |
| **Total** | **390** |

Desse total, 50 horas já estão no M1 (infraestrutura, primeiro modelo e encaixe básico), por isso o MVP aparece com 340 horas na tabela anterior.

## 4. Recomendação sobre o início de uso

O plano respeita a sua decisão de só colocar o sistema em uso quando estiver concluído. Em compensação, a conclusão está estimada para outubro de 2030, e testar só no fim concentra o risco de descobrir problemas de usabilidade tarde demais. Foram aceitos dois pontos de apoio:

- **Teste de usabilidade pontual** com 3 a 5 alunos ao final do MVP e ao final da V1, sem uso regular em aula, só para observar onde travam.
- **Ponto de corte opcional:** se o prazo pesar, a V1 (março de 2029) já cobre as aulas 31 a 34 e o núcleo prático dos módulos III a V; as versões V2 a V5 poderiam ser tratadas como uma segunda fase.

## 5. Ritmo de trabalho

- Duas sessões de 5 horas por semana, ou três de cerca de 3 horas e meia.
- Ciclos de duas semanas, com uma lista curta de tarefas (quadro Kanban simples) tirada do backlog.
- Revisão do cronograma a cada três meses, comparando as horas reais com as estimadas.

## 6. Critérios de saída de cada marco

| Marco | O marco termina quando |
| --- | --- |
| M1 | Um modelo real carrega e encaixa em uma máquina do laboratório com 30 quadros por segundo, e a página abre por HTTPS |
| M2 | O fluxo da seção 4 do Documento 4 funciona do início ao fim, e todos os critérios de aceite das histórias do MVP passam |
| M3 | Os problemas encontrados no teste interno estão corrigidos ou registrados no backlog |
| V1 a V5 | Todas as histórias da versão estão prontas, os testes automáticos passam e a trilha correspondente foi conferida com o currículo |

## 7. Riscos de cronograma

| Risco | Efeito | Resposta |
| --- | --- | --- |
| Modelos 3D demoram mais que o previsto | Atraso no M2 | Começar a produção de modelos já no M1 e reaproveitar peças |
| Volume de conteúdo das missões subestimado | Atraso nas versões V1 a V5 | Reutilizar a estrutura de missão e produzir o conteúdo em lotes |
| Semanas sem tempo de desenvolvimento | Estimativa corre | Revisão trimestral e ajuste das datas |
| Mudanças no currículo da disciplina | Retrabalho de missões | Etiquetas de módulo e aulas em cada missão (RF-31) |
| Desempenho insuficiente nas máquinas | Retrabalho de modelos | Validar o desempenho já no M1 |

---

# Documento 14 – Plano de testes e validação

Todo o projeto segue testes automatizados em todas as etapas: nenhuma entrega é considerada pronta sem que os testes correspondentes passem em uma esteira de integração contínua. As ferramentas e as metas numéricas são propostas.

## 1. Estratégia: pirâmide de testes

| Nível | O que verifica | Ferramenta proposta | Quando roda |
| --- | --- | --- | --- |
| Estático | Estilo, tipos e segredos no código | ESLint, Prettier, TypeScript em modo estrito, gitleaks | A cada commit e em cada integração |
| Unitário | Motor de regras, pontuação, cálculo de nota, utilitários | Vitest | A cada commit e em cada integração |
| Esquema | Todos os arquivos de conteúdo JSON contra os esquemas do Documento 11 | Validador de esquema (Zod ou JSON Schema) | A cada commit e em cada integração |
| Integração | API com banco PostgreSQL real em contêiner, migrações e permissões | Vitest com contêiner de banco | Em cada integração |
| Componentes | Telas e componentes de interface | Testing Library | Em cada integração |
| Ponta a ponta | Fluxos completos nos navegadores-alvo | Playwright com Chromium e Firefox | Em cada integração (resumido) e em cada versão (completo) |
| Acessibilidade | Violações de contraste, rótulos e navegação por teclado | axe-core dentro do Playwright | Em cada integração |
| Assets | Triângulos, tamanho, texturas, nomes, pontos de encaixe e licença de cada modelo (Documento 12) | Script verificador de assets | Em cada integração que altere modelos |
| Carga | 45 alunos carregando a missão e enviando eventos | k6 | A cada marco |
| Desempenho de tela | Quadros por segundo da cena em máquina real do laboratório | Script de benchmark | A cada marco (manual assistido) |
| Segurança | Dependências vulneráveis, imagens Docker e análise estática | Auditoria de dependências, Trivy e CodeQL ou Semgrep | Em cada integração e semanalmente |
| Recuperação | Backup e restauração do banco | Roteiro automatizado de restauração | A cada versão |

## 2. Metas de cobertura e qualidade

| Item | Meta proposta |
| --- | --- |
| Cobertura de linhas do motor de regras | 90% ou mais |
| Cobertura de linhas da API e da lógica do front-end | 80% ou mais |
| Violações de acessibilidade graves ou críticas | Nenhuma |
| Vulnerabilidades altas ou críticas em dependências e imagens | Nenhuma |
| Resposta da API com 45 usuários simultâneos | 95% das requisições em até 500 ms |
| Carga inicial da missão com 45 usuários | Até 30 segundos |
| Quadros por segundo na cena | 30 ou mais |

## 3. Rastreabilidade com as histórias de usuário

- Cada critério de aceite do Documento 5 vira pelo menos um teste automatizado, com o identificador da história no nome (ex.: US-05: recusa CPU de soquete diferente).
- A esteira gera um relatório que cruza histórias, critérios e testes, apontando qualquer critério sem teste.
- Uma história só passa para pronta quando todos os seus testes passam.

Nem tudo se automatiza. Ficam como verificação manual assistida: a leitura da interface por leitor de tela (Orca, no Kubuntu), o benchmark de quadros por segundo no laboratório real e a observação de uso com alunos.

## 4. Testes da bancada 3D

A interação em 3D é frágil para automatizar por cliques simulados. Por isso:

- O motor de regras é testado de forma isolada, sem tela, com todas as combinações de compatibilidade e de ordem do Documento 7.
- A aplicação tem um modo de teste, desligado em produção, que expõe comandos para posicionar e encaixar peças sem arrastar o mouse.
- Os testes de ponta a ponta percorrem cada missão inteira usando esse modo de teste e conferem o relatório final, a nota e o POST.
- Alguns testes de arrastar real são mantidos em pequeno número, para detectar regressões de interação.

## 5. Dados e ambientes de teste

- Contas fictícias de aluno, professor e administrador, criadas por um script de carga inicial (seed).
- Missões e modelos de teste leves, para a esteira rodar rápido.
- Ambiente de homologação no servidor, igual ao de produção, onde os testes de carga e o teste de implantação são executados antes de cada versão.

## 6. Portões de qualidade (quality gates)

| Portão | Condições |
| --- | --- |
| Integração (cada alteração) | Estático, unitário, esquema, integração, componentes, ponta a ponta resumido, acessibilidade, assets e segurança, todos verdes |
| Marco ou versão | O portão anterior, mais ponta a ponta completo, carga com 45 usuários, benchmark no laboratório, restauração de backup, relatório de rastreabilidade sem critério descoberto e implantação de teste em homologação |

Uma alteração que quebra um portão não entra na linha principal.

## 7. Validação com usuários

- **Teste de usabilidade:** 3 a 5 alunos executam tarefas pré-definidas enquanto são observados, com medição de tempo, erros e pedidos de ajuda, e questionário SUS (escala de usabilidade). Os indicadores do Documento 4 (80% concluem sem ajuda, 30 quadros por segundo, 45 alunos simultâneos) servem de critério.
- **Aceite do professor:** roteiro em que o professor percorre todas as missões da versão e o painel, conferindo o alinhamento com as aulas do currículo.
- **Momento:** ao final do MVP e da V1 (recomendação do Documento 13) e na conclusão do projeto.  Os testes com alunos antes da conclusão foram aceitos pelo professor.

## 8. Gestão de defeitos

| Severidade | Exemplo | Resposta |
| --- | --- | --- |
| Crítica | Falha de segurança, perda de dados ou sistema fora do ar | Corrigir antes de qualquer outra tarefa |
| Alta | Missão que não conclui ou nota calculada errada | Corrigir na iteração em curso |
| Média | Mensagem confusa ou erro visual | Planejar para a próxima iteração |
| Baixa | Ajuste cosmético | Backlog |

Todo defeito encontrado recebe, antes da correção, um teste que o reproduz, para que não volte.

---

# Documento 15 – Repositório, processo de desenvolvimento e definição de pronto

Este documento reúne o processo que governa toda a execução do projeto: metodologia, controle de versões, integração e entrega contínuas, definição de pronto e os entregáveis sinalizados de cada marco.

## 1. Metodologia

- **Desenvolvimento incremental e iterativo:** ciclos de duas semanas, com lista curta de tarefas tirada do backlog (quadro Kanban com limite de trabalho em andamento).
- **Etapas de cada marco:** planejamento, projeto, implementação, testes, revisão, entrega e retrospectiva.
- **Testes desde o início:** as regras do Documento 7 são escritas primeiro como testes (TDD) e depois como código.
- **Decisões registradas:** toda decisão técnica relevante vira um registro (ADR), como no Documento 10.
- **Entrega contínua:** a linha principal está sempre pronta para ser implantada em homologação.

## 2. Controle de versões

- Repositório Git único (estrutura do Documento 10), com a linha principal protegida.
- Ramos curtos por tarefa (feature/, fix/, docs/) e integração por pedido de mesclagem (pull request) com a esteira verde, mesmo trabalhando sozinho.
- Mensagens de commit no padrão Conventional Commits (feat, fix, docs, test, chore).
- Versionamento semântico, com tag em cada marco e arquivo CHANGELOG gerado a partir dos commits.

| Marco | Tag | Observação |
| --- | --- | --- |
| M1 | v0.1.0 | Protótipo técnico |
| M2 / M3 | v0.2.0 e seguintes v0.2.x | MVP e correções do teste interno |
| V1 | v0.5.0 | Montagem completa |
| V2 | v0.6.0 | Instalação |
| V3 | v0.7.0 | Configuração |
| V4 | v0.8.0 | Diagnóstico |
| V5 | v1.0.0 | Projeto concluído e liberado para uso em aula |

## 3. Arquivos e ferramentas padrão do repositório

| Item | Função |
| --- | --- |
| README | Como instalar, rodar, testar e implantar |
| CHANGELOG | Histórico de mudanças por versão |
| .editorconfig, ESLint e Prettier | Padrão de estilo |
| TypeScript em modo estrito | Verificação de tipos sem permissão de tipo solto |
| Husky e lint-staged | Verificações rápidas antes de cada commit |
| docker-compose.yml e .env.example | Ambiente completo reproduzível e configuração sem segredos no código |
| docs/ | Os documentos deste pacote, em Markdown, junto com o código |
| docs/operacao/ | Roteiros de instalação, atualização, backup, restauração e retorno de versão |

## 4. Esteira de integração e entrega (CI/CD)

1. Verificação estática: formatação, estilo, tipos e segredos.
2. Testes unitários e de esquema.
3. Testes de integração com PostgreSQL em contêiner.
4. Construção das imagens Docker.
5. Testes de ponta a ponta e de acessibilidade nos dois navegadores.
6. Verificação de assets e de segurança.
7. Publicação das imagens versionadas em um registro de imagens.
8. Implantação automática em homologação e teste rápido de fumaça (smoke test).
9. Promoção para produção com aprovação manual, e possibilidade de voltar à versão anterior.

Ambientes: desenvolvimento (a máquina do desenvolvedor, com Docker Compose), homologação e produção (ambos no servidor da escola).

## 5. Qualidade de código e operação

- Revisão de cada alteração com uma lista de verificação (testes, acessibilidade, segurança, documentação), mesmo sendo uma pessoa só; revisão por um colega de tecnologia sempre que houver oportunidade.
- Configuração por variáveis de ambiente, sem senhas no código.
- Registros (logs) estruturados em JSON e rota de verificação de saúde da API.
- Migrações de banco versionadas e testadas, com teste de restauração de backup a cada versão.
- Atualização regular das dependências, com alertas automáticos de vulnerabilidade.

## 6. Definição de preparado (Definition of Ready)

Uma tarefa só entra em um ciclo quando:

- tem uma história de usuário do Documento 5, com critérios de aceite;
- as regras envolvidas estão no Documento 7 e os dados no Documento 11;
- os assets necessários existem e atendem ao Documento 12;
- cabe em até 10 a 15 horas de trabalho.

## 7. Definição de pronto (Definition of Done)

Uma história ou entrega só está pronta quando:

- todos os critérios de aceite têm teste automatizado e passam;
- o código está integrado na linha principal com a esteira verde;
- as metas de cobertura, acessibilidade e segurança do Documento 14 foram cumpridas;
- a documentação e o CHANGELOG foram atualizados;
- a funcionalidade foi implantada em homologação e passou no teste de fumaça;
- nenhum defeito crítico ou alto está aberto.

## 8. Entregáveis sinalizados por marco

| Marco | Entregáveis | Testes obrigatórios para liberar |
| --- | --- | --- |
| M1 (v0.1.0) | Repositório com esteira funcionando, Docker Compose, protótipo 3D com encaixe, relatório de benchmark no laboratório | Estático, unitário, esquema, ponta a ponta resumido, benchmark de quadros por segundo e HTTPS |
| M2 (v0.2.0) | MVP com as histórias US-01 a US-11, US-21 e US-22; imagens Docker versionadas; roteiros de operação | Portão de marco completo do Documento 14 |
| V1 (v0.5.0) | Missões M02 a M06, painel do professor, gamificação, bipes, BIOS e exercícios | Portão de marco completo, mais conferência com o currículo |
| V2 a V4 (v0.6.0 a v0.8.0) | Trilhas de instalação, configuração e diagnóstico | Portão de marco completo |
| V5 (v1.0.0) | Reparo, cenários de defeito, laudo e documentação final de uso | Portão de marco completo, aceite do professor e teste final com alunos |

Cada entregável é publicado com a tag da versão, o relatório de testes, o relatório de rastreabilidade, o relatório de benchmark e o CHANGELOG correspondentes.

## 9. Backlog inicial: tarefas do M1

1. Criar o repositório com a estrutura do Documento 10 e o README.
2. Configurar TypeScript estrito, ESLint, Prettier, Vitest e os ganchos de commit.
3. Escrever o docker-compose com o banco PostgreSQL, a API e o nginx.
4. Montar a esteira de integração contínua com as etapas 1 a 4.
5. Criar o esqueleto da aplicação (Vite, React e cena 3D vazia).
6. Carregar um modelo GLB de teste com compressão Meshopt.
7. Implementar seleção e encaixe de uma peça em um ponto de encaixe.
8. Escrever o motor de regras mínimo, com teste da regra RN-01 (soquete).
9. Criar o script de benchmark de quadros por segundo.
10. Configurar HTTPS com a autoridade certificadora interna em uma máquina do laboratório.
11. Medir o desempenho no laboratório real e registrar o resultado.
12. Redigir o relatório do M1 e publicar a tag v0.1.0.

## 10. Checklist de prontidão para iniciar a codificação

| Item | Onde está | Estado |
| --- | --- | --- |
| Visão, escopo e público | Documento 1 | Pronto |
| Alinhamento com o currículo | Documento 2 | Pronto |
| Premissas, restrições e riscos | Documento 3 | Pronto |
| Requisitos do produto | Documentos 4 e 6 | Pronto |
| Histórias e critérios de aceite | Documento 5 | Pronto |
| Regras de negócio | Documento 7 | Pronto |
| Design pedagógico e gamificação | Documento 8 | Pronto |
| Telas e wireframes | Documento 9 | Pronto |
| Arquitetura e decisões | Documento 10 | Pronto |
| Modelo de dados | Documento 11 | Pronto |
| Guia de assets 3D | Documento 12 | Pronto |
| Roadmap e estimativas | Documento 13 | Pronto |
| Plano de testes | Documento 14 | Pronto |
| Processo, definição de pronto e backlog do M1 | Documento 15 | Pronto |
| Servidor aprovado (Docker, banco e dependências) | Documento 3 | Confirmado |

Hospedagem do código decidida: GitHub, na conta do professor, em repositório a ser criado com o nome do projeto (sugestão: virtuhar3d). A esteira de integração roda no GitHub Actions.
