/* ============================================================
   SPX · domínio de gestão da obra
   Catálogos técnicos e o conteúdo de demonstração dos módulos
   de custo, recursos, risco, qualidade, suprimentos e SSMA.
   ============================================================ */

/* ─── catálogos ───────────────────────────────────────────── */

const CATEGORIAS_CUSTO = [
  { id: 'material',       rotulo: 'Material' },
  { id: 'mao_obra',       rotulo: 'Mão de obra' },
  { id: 'equipamento',    rotulo: 'Equipamento' },
  { id: 'servico',        rotulo: 'Serviço terceirizado' },
  { id: 'administrativo', rotulo: 'Administrativo' },
];
const custoRotulo = (id) => (CATEGORIAS_CUSTO.find(c => c.id === id) || {}).rotulo || 'Outros';

const CATEGORIAS_RISCO = ['Prazo', 'Custo', 'Qualidade', 'Segurança', 'Projeto', 'Suprimentos'];
const RESPOSTAS_RISCO = ['Mitigar', 'Evitar', 'Transferir', 'Aceitar'];

/* Severidade = probabilidade × impacto, em três faixas.
   Três níveis, e não quatro: âmbar e laranja não se distinguem
   uma da outra na tela nem para quem tem daltonismo. */
const NIVEIS_RISCO = [
  { id: 'baixo', rotulo: 'Baixo',  ate: 6,  cor: '#15803d' },
  { id: 'medio', rotulo: 'Médio',  ate: 14, cor: '#b98a00' },
  { id: 'alto',  rotulo: 'Alto',   ate: 25, cor: '#a51c1c' },
];
const nivelRisco = (r) => NIVEIS_RISCO.find(n => r.probabilidade * r.impacto <= n.ate) || NIVEIS_RISCO[2];

const TIPOS_DOC = [
  { id: 'planta',    rotulo: 'Planta' },
  { id: 'memorial',  rotulo: 'Memorial descritivo' },
  { id: 'detalhe',   rotulo: 'Detalhamento' },
  { id: 'art',       rotulo: 'ART / RRT' },
  { id: 'laudo',     rotulo: 'Laudo' },
  { id: 'relatorio', rotulo: 'Relatório' },
  { id: 'orcamento', rotulo: 'Orçamento' },
];
const docRotulo = (id) => (TIPOS_DOC.find(t => t.id === id) || {}).rotulo || 'Documento';

const STATUS_DOC = {
  para_obra:  { rotulo: 'Liberado para obra', cor: 'ok' },
  em_analise: { rotulo: 'Em análise',         cor: 'warn' },
  aprovado:   { rotulo: 'Aprovado',           cor: 'ok' },
  obsoleto:   { rotulo: 'Obsoleto',           cor: 'bad' },
};

const TIPOS_APROVACAO = [
  { id: 'projeto',   rotulo: 'Revisão de projeto' },
  { id: 'orcamento', rotulo: 'Orçamento' },
  { id: 'aditivo',   rotulo: 'Aditivo de escopo' },
  { id: 'medicao',   rotulo: 'Medição' },
  { id: 'material',  rotulo: 'Amostra de material' },
  { id: 'relatorio', rotulo: 'Relatório' },
];
const aprovacaoRotulo = (id) => (TIPOS_APROVACAO.find(t => t.id === id) || {}).rotulo || 'Solicitação';

const STATUS_PEDIDO = {
  cotacao:   { rotulo: 'Em cotação',    cor: 'info' },
  aprovado:  { rotulo: 'Pedido feito',  cor: 'warn' },
  transporte:{ rotulo: 'Em transporte', cor: 'warn' },
  entregue:  { rotulo: 'Entregue',      cor: 'ok' },
  parcial:   { rotulo: 'Entrega parcial', cor: 'bad' },
};

/* Fichas de verificação de serviço: o que se confere em cada inspeção. */
const FVS = {
  alvenaria: { rotulo: 'Alvenaria de vedação', itens: [
    'Locação conforme projeto de layout',
    'Prumo e nível dentro de 3 mm por metro',
    'Amarração e juntas de 10 mm uniformes',
    'Vergas e contravergas executadas nos vãos',
    'Encunhamento executado após 7 dias',
    'Local limpo e entulho removido'] },
  contrapiso: { rotulo: 'Contrapiso', itens: [
    'Substrato limpo, sem pó e sem material solto',
    'Nível e caimento conferidos com mangueira ou laser',
    'Espessura mínima de 3 cm',
    'Juntas de dilatação nos panos maiores que 20 m²',
    'Cura úmida mantida por 7 dias'] },
  revestimento: { rotulo: 'Revestimento cerâmico', itens: [
    'Substrato regularizado, curado e sem fissuras',
    'Paginação conferida com o projeto',
    'Argamassa colante adequada ao ambiente (AC-III)',
    'Juntas alinhadas e espaçamento uniforme',
    'Percussão sem som cavo nas peças',
    'Rejunte aplicado após 72 horas'] },
  eletrica: { rotulo: 'Instalação elétrica', itens: [
    'Eletrodutos e caixas conforme projeto',
    'Bitola dos condutores conforme a NBR 5410',
    'Circuitos identificados no quadro de distribuição',
    'Teste de continuidade e isolamento realizado',
    'Aterramento verificado',
    'Disjuntores e DR conforme projeto'] },
  hidraulica: { rotulo: 'Instalação hidrossanitária', itens: [
    'Traçado conforme projeto',
    'Teste de estanqueidade por 24 horas',
    'Declividade dos ramais de esgoto conferida',
    'Fixação e suportes das tubulações',
    'Registros e válvulas acessíveis para manutenção'] },
  impermeabilizacao: { rotulo: 'Impermeabilização', itens: [
    'Substrato seco, limpo e regularizado',
    'Cantos e ralos com reforço de tela',
    'Número de demãos conforme o fabricante',
    'Teste de estanqueidade por 72 horas',
    'Proteção mecânica executada antes do contrapiso'] },
  pintura: { rotulo: 'Pintura', itens: [
    'Superfície lixada e sem imperfeições',
    'Selador ou fundo preparador aplicado',
    'Duas demãos de acabamento',
    'Recortes e cantos sem escorrimento',
    'Pisos e esquadrias protegidos'] },
  marcenaria: { rotulo: 'Marcenaria', itens: [
    'Medidas conferidas em obra antes da produção',
    'Nível e prumo das peças instaladas',
    'Ferragens instaladas e reguladas',
    'Acabamento sem riscos, falhas ou emendas aparentes',
    'Fixação segura na estrutura'] },
};

/* Normas de segurança verificadas em campo. */
const NORMAS_NR = {
  'NR-18': { titulo: 'Condições de trabalho na construção', itens: [
    'Áreas de vivência limpas e em uso',
    'Proteção periférica e guarda-corpo nas aberturas',
    'Escadas e rampas com corrimão',
    'Instalações elétricas provisórias protegidas',
    'Sinalização de segurança visível',
    'Ordem e limpeza no canteiro'] },
  'NR-35': { titulo: 'Trabalho em altura', itens: [
    'Análise de risco da atividade emitida',
    'Cinto tipo paraquedista com talabarte duplo',
    'Pontos de ancoragem certificados',
    'Trabalhadores com treinamento válido',
    'Permissão de trabalho assinada'] },
  'NR-06': { titulo: 'Equipamento de proteção individual', itens: [
    'EPI entregue com ficha assinada',
    'Capacete, óculos e botina em uso',
    'Protetor auricular nas atividades ruidosas',
    'Luvas adequadas a cada serviço',
    'EPI dentro da validade do CA'] },
  'NR-10': { titulo: 'Segurança em instalações elétricas', itens: [
    'Desenergização e bloqueio antes da intervenção',
    'Equipe habilitada e autorizada',
    'Ferramental isolado em bom estado',
    'Quadros identificados e trancados'] },
};

const CLASSES_RESIDUO = [
  { id: 'A', rotulo: 'Classe A · alvenaria, concreto e argamassa' },
  { id: 'B', rotulo: 'Classe B · madeira, metal, papel e plástico' },
  { id: 'C', rotulo: 'Classe C · gesso e isopor' },
  { id: 'D', rotulo: 'Classe D · tintas, solventes e amianto' },
];

/* ─── conteúdo de demonstração dos módulos ───────────────── */

/* Distribui o custo direto pelas etapas, na proporção do peso. */
function orcarEtapas(obra, custoDireto) {
  const total = obra.etapas.reduce((s, e) => s + e.peso, 0) || 1;
  obra.etapas.forEach(e => { e.orcamento = Math.round((custoDireto * e.peso) / total / 100) * 100; });
}

/*
  A qual etapa pertence o gasto de uma data: a que está sendo
  executada segundo o peso acumulado do cronograma. Amarrar pela
  data crua joga custo demais nas primeiras etapas, porque elas
  se sobrepõem no calendário.
*/
function etapaDoAvanco(obra, data) {
  const total = obra.etapas.reduce((s, e) => s + e.peso, 0) || 1;
  const fracao = Math.min(0.999, Math.max(0, difDias(obra.inicio, data) / Math.max(1, difDias(obra.inicio, obra.prazo))));
  let acumulado = 0;
  for (const e of obra.etapas) {
    acumulado += e.peso / total;
    if (fracao <= acumulado) return e.id;
  }
  return obra.etapas[obra.etapas.length - 1].id;
}

/* Lançamentos de custo semana a semana, do início da obra até hoje. */
function gerarCustos(obra, cfg) {
  const materiais = cfg.materiais;
  const extras = [
    { cat: 'equipamento', desc: 'Locação de andaime fachadeiro', valor: 4200 },
    { cat: 'servico',     desc: 'Empreita de instalações elétricas', valor: 9800 },
    { cat: 'equipamento', desc: 'Locação de caçamba e betoneira', valor: 6500 },
    { cat: 'administrativo', desc: 'Seguro de obra e ART', valor: 3100 },
  ];
  const custos = [];
  const semanas = Math.max(1, Math.floor(difDias(obra.inicio, hoje()) / 7));

  for (let i = 0; i < semanas; i++) {
    const data = maisDias(obra.inicio, i * 7 + 4);
    const etapa = etapaDoAvanco(obra, data);

    custos.push({
      id: uid('c'), data, etapa, categoria: 'mao_obra',
      descricao: `Folha da equipe · semana ${numeroSemana(data)}`,
      valor: cfg.efetivo * 5 * cfg.diaria, fornecedor_id: null, doc: `FL-${numeroSemana(data)}`,
    });

    const m = materiais[i % materiais.length];
    custos.push({
      id: uid('c'), data, etapa, categoria: 'material',
      descricao: m.desc, valor: m.valor, fornecedor_id: m.forn || null, doc: `NF ${12000 + i * 37}`,
    });

    if (i % 2 === 1) {
      const x = extras[(i >> 1) % extras.length];
      custos.push({
        id: uid('c'), data, etapa, categoria: x.cat,
        descricao: x.desc, valor: x.valor, fornecedor_id: null, doc: `NF ${20000 + i * 11}`,
      });
    }
  }

  /*
    Ajusta a escala para o gasto acumulado ficar coerente com o
    serviço já executado. `cpi` acima de 1 deixa a obra com o
    custo sob controle; abaixo de 1, estourando o orçamento.
  */
  const alvo = (cfg.custoDireto * progressoObra(obra) / 100) / (cfg.cpi || 1);
  const soma = custos.reduce((t, c) => t + c.valor, 0) || 1;
  const fator = alvo / soma;
  custos.forEach(c => { c.valor = Math.max(100, Math.round((c.valor * fator) / 100) * 100); });

  return custos;
}

/* Inspeções de serviço já realizadas, distribuídas nas etapas concluídas. */
function gerarInspecoes(obra, lista) {
  return lista.map((it, i) => {
    const modelo = FVS[it.fvs];
    const reprovados = it.reprovar || [];
    return {
      id: uid('insp'),
      fvs: it.fvs,
      servico: modelo.rotulo,
      etapa: it.etapa,
      local: it.local,
      data: it.data,
      responsavel: it.resp || 'u_eng',
      itens: modelo.itens.map((texto, j) => ({ texto, ok: !reprovados.includes(j) })),
      resultado: reprovados.length ? (reprovados.length > 1 ? 'reprovado' : 'ressalva') : 'aprovado',
      obs: it.obs || '',
      nc_id: null,
    };
  });
}

/* ─── contratos e assinaturas ─────────────────────────────── */

const TIPOS_CONTRATO = [
  { id: 'contrato', rotulo: 'Contrato de prestação de serviços' },
  { id: 'ordem',    rotulo: 'Ordem de início de serviço' },
  { id: 'aditivo',  rotulo: 'Aditivo de contrato' },
  { id: 'termo',    rotulo: 'Termo de recebimento' },
  { id: 'outro',    rotulo: 'Outro documento' },
];
const contratoRotulo = (id) => (TIPOS_CONTRATO.find(t => t.id === id) || {}).rotulo || 'Documento';

/* Código curto que identifica a assinatura no comprovante. */
function codigoAssinatura() {
  return (Math.random().toString(36).slice(2, 6) + Date.now().toString(36).slice(-4)).toUpperCase();
}

function assinaturaDe(usuario, nomeDigitado) {
  return {
    nome: nomeDigitado,
    usuario: usuario.id,
    papel: usuario.papel,
    em: new Date().toISOString(),
    codigo: codigoAssinatura(),
  };
}

/* Documentos que o cliente assina ao longo da obra. */
function gerarContratos(obra, cfg, nomeCliente) {
  const assinouEm = (data) => ({
    nome: nomeCliente,
    usuario: obra.cliente_id,
    papel: 'cliente',
    em: new Date(dia(data).getTime() + 15 * 3600000).toISOString(),
    codigo: codigoAssinatura(),
  });

  return (cfg.contratos || []).map(c => ({
    id: uid('ct'),
    assinante: 'cliente',
    ...c,
    assinatura: c.status === 'assinado' ? assinouEm(c.assinado_em || c.emitido_em) : null,
  }));
}

/*
  Lado comercial da obra: medições mensais e as parcelas que
  o cliente paga. O sinal entra no começo e cada medição vira
  uma parcela com vencimento dez dias depois.
*/
function gerarFinanceiro(obra) {
  const contrato = obra.valor;
  const sinal = Math.round(contrato * 0.15 / 100) * 100;
  const medicoes = [{
    id: uid('md'), numero: 0, de: obra.inicio, ate: maisDias(obra.inicio, 5),
    valor: sinal, pct: 15, status: 'aprovada', aprovada_em: maisDias(obra.inicio, 4),
    descricao: 'Sinal de contrato',
  }];
  const parcelas = [{
    id: uid('pc'), numero: 0, descricao: 'Sinal de contrato', valor: sinal,
    vencimento: maisDias(obra.inicio, 5), pago_em: maisDias(obra.inicio, 4),
    status: 'pago', medicao_id: null,
  }];

  const meses = Math.max(1, Math.floor(difDias(obra.inicio, hoje()) / 30));
  let acumulado = 0;

  for (let m = 1; m <= meses; m++) {
    const de = maisDias(obra.inicio, (m - 1) * 30);
    const ate = maisDias(obra.inicio, m * 30 - 1);
    const pct = progressoPlanejado(obra, ate);
    const parcela = Math.max(0, pct - acumulado);
    acumulado = pct;
    if (parcela <= 0) continue;

    const valor = Math.round((contrato * 0.85 * parcela) / 100 / 100) * 100;
    const vence = maisDias(ate, 10);
    const med = {
      id: uid('md'), numero: m, de, ate, valor, pct: Math.round(parcela * 10) / 10,
      status: vence < hoje() ? 'aprovada' : 'pendente',
      aprovada_em: vence < hoje() ? maisDias(ate, 3) : null,
    };
    medicoes.push(med);
    parcelas.push({
      id: uid('pc'), numero: m, descricao: `Medição ${String(m).padStart(2, '0')}`, valor,
      vencimento: vence,
      pago_em: vence < maisDias(hoje(), -2) ? maisDias(vence, 1) : null,
      status: vence < maisDias(hoje(), -2) ? 'pago' : vence < hoje() ? 'atrasado' : 'aberto',
      medicao_id: med.id,
    });
  }

  return { medicoes: medicoes.reverse(), parcelas: parcelas.reverse() };
}

/*
  Preenche uma obra com os módulos de gestão. `cfg` traz o que muda
  de uma obra para outra: efetivo, diária e a lista de compras.
*/
function enriquecerObra(obra, cfg, usuarios = []) {
  const seg = segundaDa(hoje());
  const dSemana = (n, d = 0) => maisDias(seg, -7 * n + d);

  orcarEtapas(obra, cfg.custoDireto);
  obra.custo_direto = cfg.custoDireto;
  obra.custos = gerarCustos(obra, cfg);

  obra.recursos = {
    equipe: cfg.equipe.map(p => ({ id: uid('r'), ...p })),
    equipamentos: cfg.equipamentos.map(e => ({ id: uid('eq'), ...e })),
  };

  obra.riscos = cfg.riscos.map(r => ({ id: uid('rk'), status: 'monitorado', ...r }));

  obra.escopo = cfg.escopo;
  obra.especificacoes = cfg.especificacoes.map(e => ({ id: uid('esp'), ...e }));
  obra.normas = cfg.normas.map(n => ({ id: uid('nb'), ...n }));

  obra.inspecoes = gerarInspecoes(obra, cfg.inspecoes);
  obra.ncs = cfg.ncs.map(n => ({ id: uid('nc'), ...n }));

  obra.documentos = cfg.documentos.map(d => ({ id: uid('doc'), ...d }));
  obra.alteracoes = cfg.alteracoes.map(a => ({ id: uid('alt'), ...a }));

  obra.materiais = cfg.materiaisEstoque.map(m => ({ id: uid('mat'), ...m }));
  obra.movimentacoes = [];
  obra.materiais.forEach((m, i) => {
    obra.movimentacoes.push({
      id: uid('mov'), material_id: m.id, tipo: 'entrada', qtd: m.entrada,
      data: dSemana(3 - (i % 3), 1), doc: `NF ${31000 + i * 13}`, lote: `L${2026}${100 + i}`,
      responsavel: 'u_eng', obs: 'Recebido e conferido na portaria',
    });
    if (m.saida) obra.movimentacoes.push({
      id: uid('mov'), material_id: m.id, tipo: 'saida', qtd: m.saida,
      data: dSemana(1, 2), doc: `RQ-${200 + i}`, lote: `L${2026}${100 + i}`,
      responsavel: 'u_eng', obs: 'Requisição da frente de serviço',
    });
  });

  obra.pedidos = cfg.pedidos.map(p => ({ id: uid('ped'), ...p }));

  obra.ssma = {
    checklists: cfg.ssma.checklists.map(c => ({
      id: uid('nr'), ...c,
      itens: NORMAS_NR[c.norma].itens.map((texto, j) => ({ texto, ok: !(c.reprovar || []).includes(j) })),
    })),
    dds: cfg.ssma.dds.map(d => ({ id: uid('dds'), ...d })),
    ocorrencias: cfg.ssma.ocorrencias.map(o => ({ id: uid('oc'), ...o })),
    residuos: cfg.ssma.residuos.map(r => ({ id: uid('res'), ...r })),
  };

  obra.aprovacoes = cfg.aprovacoes.map(a => ({ id: uid('ap'), ...a }));
  obra.financeiro = gerarFinanceiro(obra);
  obra.contratos = gerarContratos(obra, cfg,
    (usuarios.find(u => u.id === obra.cliente_id) || {}).nome || 'Cliente');

  /* O cliente já acompanhou as semanas anteriores à atual. */
  relatoriosOrdenados(obra).slice(1, 4).forEach(r => {
    r.vistos = [{
      usuario: obra.cliente_id,
      em: new Date(dia(maisDias(r.ate, 2)).getTime() + 20 * 3600000).toISOString(),
    }];
  });

  return obra;
}
