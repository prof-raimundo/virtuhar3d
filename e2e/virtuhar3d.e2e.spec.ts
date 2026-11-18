import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function assertNoSeriousA11yViolations(page: Page, screenLabel: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );

  expect(
    blocking,
    `Violações WCAG AA críticas/graves em ${screenLabel}: ${JSON.stringify(blocking, null, 2)}`,
  ).toEqual([]);
}

async function loginAs(page: Page, usuario: string, senha: string): Promise<void> {
  await page.goto('/');
  await page.locator('#login-usuario').fill(usuario);
  await page.locator('#login-senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar no laboratório' }).click();
}

test.describe.serial('VIRTUHAR3D — E2E MVP e Auditoria WCAG AA', () => {
  test('US-01 e US-21: Login, erro genérico e auditoria WCAG AA na entrada', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', {
        name: 'Laboratório Virtual de Montagem e Manutenção de Computadores',
      }),
    ).toBeVisible();

    await assertNoSeriousA11yViolations(page, 'Login');

    // Tentativa inválida retorna mensagem genérica sem revelar qual campo errou
    await page.locator('#login-usuario').fill('aluno.teste');
    await page.locator('#login-senha').fill('SenhaErrada999');
    await page.getByRole('button', { name: 'Entrar no laboratório' }).click();

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/inválid|incorret/i);
  });

  test('US-07, US-09, US-11 e US-21: Fluxo completo da missão M00 (ESD, inspeção e teclado)', async ({
    page,
  }) => {
    await loginAs(page, 'aluno.teste', 'Aluno@Virtuhar2026');
    await expect(
      page.getByRole('heading', { name: 'Ordens de Serviço do Laboratório' }),
    ).toBeVisible();

    await assertNoSeriousA11yViolations(page, 'Trilha de Missões');

    // Abrir M00
    await page.locator('article', { hasText: 'M00' }).getByRole('button').click();
    await expect(page.getByRole('heading', { name: /M00 —/ })).toBeVisible();

    await assertNoSeriousA11yViolations(page, 'Ordem de Serviço M00');

    await page.getByRole('button', { name: 'Abrir Bancada 3D' }).click();
    await expect(page.getByRole('button', { name: /ESD: Desconectada/i })).toBeVisible();

    // Tentar manusear CPU sensível sem pulseira ESD -> deve recusar (US-07)
    const esdGate = await page.evaluate(() => {
      return window.__VIRTUHAR3D_TEST__?.snapPart('cpu-lga1151-i3', 'ponto_soquete');
    });
    expect(esdGate?.permitido).toBe(false);
    expect(esdGate?.regraId).toBe('RN-11');

    // Equipar pulseira ESD usando botão acessível na barra superior
    await page.getByRole('button', { name: /ESD: Desconectada/i }).click();
    await expect(page.getByRole('button', { name: /ESD: Conectada/i })).toBeVisible();

    // Passo 2 (M00): inspecionar placa-mãe via seleção na bandeja usando teclado (Tab + Enter)
    const placaBtn = page.getByRole('button', { name: /Placa-Mãe ATX LGA1151 DDR4/i });
    await placaBtn.focus();
    await page.keyboard.press('Enter');

    // Passo 3 (M00): selecionar CPU na bandeja via teclado e confirmar encaixe pelo botão acessível
    const cpuBtn = page.getByRole('button', { name: /Processador Core i3-8100/i });
    await cpuBtn.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /Encaixar \(Espaço\)/i }).click();

    await expect(page.getByRole('button', { name: 'Concluir Missão' })).toBeVisible();
    await page.getByRole('button', { name: 'Concluir Missão' }).click();

    await expect(
      page.getByRole('heading', { name: 'Concluir Ordem de Serviço e Autoavaliação' }),
    ).toBeVisible();
    await page.locator('#auto-explica').fill('A pulseira ESD evita descarga na placa-mãe e CPU.');
    await page.locator('#auto-executa').fill('Vesti a pulseira ESD e alinhei a CPU no soquete.');
    await page.locator('#auto-revisar').fill('Revisar leitura do chanfro do soquete.');
    await page.getByRole('button', { name: 'Finalizar e ver relatório' }).click();

    await expect(page.getByRole('heading', { name: /Relatório da Sessão — M00/ })).toBeVisible();
    await expect(page.getByText(/100\/100|\/100/)).toBeVisible();
    await assertNoSeriousA11yViolations(page, 'Relatório Final M00');
  });

  test('US-03 a US-11 e US-21: Fluxo completo da missão M01 (regras, bancada 3D, jump e POST)', async ({
    page,
  }) => {
    await loginAs(page, 'aluno.teste', 'Aluno@Virtuhar2026');
    await expect(
      page.getByRole('heading', { name: 'Ordens de Serviço do Laboratório' }),
    ).toBeVisible();

    // Abrir M01
    await page.locator('article', { hasText: 'M01' }).getByRole('button').click();
    await expect(page.getByRole('heading', { name: /M01 —/ })).toBeVisible();

    // Checar aba de Micro-aula e Peças
    await page.getByRole('tab', { name: /2\. Micro-aula e Peças/i }).click();
    await expect(
      page.getByRole('heading', { name: /Peças e Ferramentas na Bancada/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Abrir Bancada 3D' }).click();

    // Aguardar bridge 3D estar pronta
    await page.waitForFunction(() => Boolean(window.__VIRTUHAR3D_TEST__?.enabled));

    // Auditar acessibilidade da Bancada 3D com o canvas ativo
    await assertNoSeriousA11yViolations(page, 'Bancada 3D M01');

    // Verificar cena 3D/GLB e regras de compatibilidade/ordem + fluxo completo até POST
    const resultadoM01 = await page.evaluate(() => {
      const api = window.__VIRTUHAR3D_TEST__;
      if (!api) {
        throw new Error('Test mode bridge ausente');
      }

      const esdOk = api.equipEsd();

      // US-05: CPU AM4 incompatível com placa LGA1151 (RN-01)
      const cpuIncomp = api.snapPart('cpu-am4-ryzen', 'ponto_soquete');

      // US-05: RAM DDR3 incompatível com placa DDR4 (RN-02)
      const ramIncomp = api.snapPart('ram-ddr3-4gb', 'ponto_ram1');

      // US-06: Cooler antes da pasta térmica (ORDEM-COOLER-PASTA)
      const cpuOk = api.snapPart('cpu-lga1151-i3', 'ponto_soquete');
      const coolerSemPasta = api.snapPart('cooler-lga1151', 'ponto_soquete');

      const pastaOk = api.applyThermalPaste();
      const coolerOk = api.snapPart('cooler-lga1151', 'ponto_soquete');
      const ram1Ok = api.snapPart('ram-ddr4-8gb', 'ponto_ram1');
      const ram2Ok = api.snapPart('ram-ddr4-8gb', 'ponto_ram2');
      const fonteOk = api.snapPart('fonte-500w', 'ponto_fonte');
      const atx24Ok = api.snapPart('cabo-atx-24p', 'ponto_24pinos');
      const epsOk = api.snapPart('cabo-eps-8p', 'ponto_eps');
      const hdmiOk = api.snapPart('cabo-video-hdmi', 'ponto_hdmi_placa');
      const chaveOk = api.toggleFonte(true);
      const jumpOk = api.triggerJumpPower();

      return {
        esdOk,
        cpuIncomp,
        ramIncomp,
        cpuOk,
        coolerSemPasta,
        pastaOk,
        coolerOk,
        ram1Ok,
        ram2Ok,
        fonteOk,
        atx24Ok,
        epsOk,
        hdmiOk,
        chaveOk,
        jumpOk,
        state: api.getState(),
      };
    });

    expect(resultadoM01.esdOk.permitido).toBe(true);
    expect(resultadoM01.cpuIncomp.permitido).toBe(false);
    expect(resultadoM01.cpuIncomp.regraId).toBe('RN-01');
    expect(resultadoM01.ramIncomp.permitido).toBe(false);
    expect(resultadoM01.ramIncomp.regraId).toBe('RN-02');
    expect(resultadoM01.cpuOk.permitido).toBe(true);
    expect(resultadoM01.coolerSemPasta.permitido).toBe(false);
    expect(resultadoM01.coolerSemPasta.regraId).toBe('ORDEM-COOLER-PASTA');
    expect(resultadoM01.pastaOk.permitido).toBe(true);
    expect(resultadoM01.coolerOk.permitido).toBe(true);
    expect(resultadoM01.ram1Ok.permitido).toBe(true);
    expect(resultadoM01.ram2Ok.permitido).toBe(true);
    expect(resultadoM01.fonteOk.permitido).toBe(true);
    expect(resultadoM01.atx24Ok.permitido).toBe(true);
    expect(resultadoM01.epsOk.permitido).toBe(true);
    expect(resultadoM01.hdmiOk.permitido).toBe(true);
    expect(resultadoM01.chaveOk.permitido).toBe(true);
    expect(resultadoM01.jumpOk.permitido).toBe(true);
    expect(resultadoM01.state.estado.postExibido).toBe(true);

    // Legenda visual obrigatória para o bipe de POST (RNF-09 / ADR-14)
    await expect(page.getByText(/Legenda de áudio: 1 bipe curto/i)).toBeVisible();

    // Concluir missão e verificar persistência de erros e notas no relatório (US-05, US-06, US-11)
    await page.getByRole('button', { name: 'Concluir Missão' }).click();
    await page.getByRole('button', { name: 'Finalizar e ver relatório' }).click();

    await expect(page.getByRole('heading', { name: /Relatório da Sessão — M01/ })).toBeVisible();
    await expect(page.getByText('Pontuação por Critério Técnico')).toBeVisible();
    await expect(page.getByText(/Regra RN-01/)).toBeVisible();
    await expect(page.getByText(/Regra ORDEM-COOLER-PASTA/)).toBeVisible();
  });

  test('US-02, US-15, US-16 e US-21: Painel do professor, importação em lote, troca de senha e WCAG AA', async ({
    page,
  }) => {
    await loginAs(page, 'prof.raimundo', 'Prof@Virtuhar2026');
    await expect(
      page.getByRole('heading', { name: 'Contas, Turmas e Painel de Desempenho' }),
    ).toBeVisible();

    await assertNoSeriousA11yViolations(page, 'Painel do Professor');

    // Criar nova turma e importar alunos em lote
    await page.locator('#turma-nome').fill('3º Info E2E');
    await page.getByRole('button', { name: /Criar turma/i }).click();
    await expect(page.getByText(/Turma "3º Info E2E" criada/)).toBeVisible();

    await page
      .locator('#lote-alunos')
      .fill('Lucas E2E Silva;lucas.e2e\nMariana E2E Costa;mariana.e2e');
    await page.getByRole('button', { name: 'Importar alunos para a turma' }).click();

    await expect(page.getByText('Credenciais geradas (2)')).toBeVisible();
    const firstRowCells = page.locator('table tbody tr').first().locator('td');
    const usuarioGerado = (await firstRowCells.nth(1).innerText()).trim();
    const senhaProvisoria = (await firstRowCells.nth(2).innerText()).trim();

    // Sair como professor e entrar como novo aluno -> troca obrigatória de senha (US-02 / RN-19)
    await page.getByRole('button', { name: 'Sair' }).click();
    await loginAs(page, usuarioGerado, senhaProvisoria);

    await expect(page.getByRole('heading', { name: 'Troca obrigatória de senha' })).toBeVisible();
    await assertNoSeriousA11yViolations(page, 'Troca Obrigatória de Senha');

    await page.locator('#troca-atual').fill(senhaProvisoria);
    await page.locator('#troca-nova').fill('NovaSenhaE2E@2026');
    await page.locator('#troca-confirma').fill('NovaSenhaE2E@2026');
    await page.getByRole('button', { name: 'Salvar senha e continuar' }).click();

    await expect(
      page.getByRole('heading', { name: 'Ordens de Serviço do Laboratório' }),
    ).toBeVisible();
  });
});
