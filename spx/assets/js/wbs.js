/* ============================================================
   SPX · estrutura analítica da obra
   O cronograma segue o formato que a SPX já usa: frentes de
   serviço com tarefas dentro, cada tarefa com duração em dias,
   início, término e predecessora (com defasagem quando existe).
   A semana de obra tem seis dias: domingo não conta.
   ============================================================ */

/* Soma dias de trabalho pulando domingo. */
function somarUteis(iso, dias) {
  const d = dia(iso);
  let restam = Math.max(0, Math.ceil(dias));
  while (restam > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) restam--;
  }
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/* Diferença em dias de trabalho entre duas datas. */
function difUteis(de, ate) {
  let n = 0;
  const d = dia(de), fim = dia(ate);
  while (d < fim) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) n++; }
  return n;
}

const TIPOS_LIGACAO = {
  TI: 'término a início',
  II: 'início a início',
};

/*
  Monta as frentes e as tarefas a partir do catálogo, calculando
  as datas em cadeia. Cada tarefa começa quando a predecessora
  termina (TI) ou quando ela começa (II), somada a defasagem.
*/
function montarWBS(inicioObra, catalogo, escala = 1) {
  const porRef = {};
  const frentes = [];

  catalogo.forEach((f, i) => {
    const idF = f.id || 'f' + (i + 1);
    let cursor = inicioObra;

    if (f.apos) {
      const base = porRef[f.apos];
      const lag = Math.round((f.lag || 0) * escala);
      if (base) cursor = f.tipo === 'II' ? somarUteis(base.inicio, lag) : somarUteis(base.fim, lag);
    } else if (f.lag) {
      cursor = somarUteis(inicioObra, Math.round(f.lag * escala));
    }

    const tarefas = [];
    f.tarefas.forEach((t, j) => {
      /* tarefa paralela começa junto com a anterior; as demais, em sequência */
      const dur = Math.round(t.dur * escala * 2) / 2;
      const inicio = (t.ii && j) ? somarUteis(tarefas[j - 1].inicio, Math.round((t.lag || 0) * escala)) : cursor;
      const fim = somarUteis(inicio, dur);
      tarefas.push({
        id: `${idF}t${j + 1}`,
        num: `${i + 1}.${j + 1}`,
        nome: t.nome,
        duracao: dur,
        inicio, fim,
        progresso: 0,
        recurso: t.rec || '',
        predecessora: j ? `${idF}t${j}` : (f.apos ? porRef[f.apos]?.ultima : null),
        ligacao: (t.ii && j) ? 'II' : 'TI',
        defasagem: t.lag || 0,
      });
      if (!(t.ii && j)) cursor = fim;
    });

    const frente = {
      id: idF,
      nome: f.nome,
      num: String(i + 1),
      tarefas,
      inicio: tarefas.reduce((m, t) => (t.inicio < m ? t.inicio : m), tarefas[0].inicio),
      fim: tarefas.reduce((m, t) => (t.fim > m ? t.fim : m), tarefas[0].fim),
      progresso: 0,
      peso: 0,
    };
    frente.peso = Math.round(tarefas.reduce((s, t) => s + t.duracao, 0) * 10) / 10;
    porRef[idF] = { inicio: frente.inicio, fim: frente.fim, ultima: tarefas[tarefas.length - 1].id };
    frentes.push(frente);
  });

  return frentes;
}

/* O percentual da frente é a média das tarefas ponderada pela duração. */
function sincronizarFrente(f) {
  if (!f.tarefas?.length) return f.progresso;
  const total = f.tarefas.reduce((s, t) => s + t.duracao, 0) || 1;
  f.progresso = Math.round(f.tarefas.reduce((s, t) => s + t.duracao * t.progresso, 0) / total);
  f.inicio = f.tarefas.reduce((m, t) => (t.inicio < m ? t.inicio : m), f.tarefas[0].inicio);
  f.fim = f.tarefas.reduce((m, t) => (t.fim > m ? t.fim : m), f.tarefas[0].fim);
  return f.progresso;
}

const todasTarefas = (o) => o.etapas.flatMap(f => (f.tarefas || []).map(t => ({ ...t, frente: f })));

/* Tarefas que a equipe deve tocar nesta semana. */
function tarefasDaSemana(o, de = segundaDa(hoje()), ate = maisDias(segundaDa(hoje()), 6)) {
  return todasTarefas(o).filter(t => t.inicio <= ate && t.fim >= de && t.progresso < 100);
}

function tarefaPorId(o, id) {
  for (const f of o.etapas) {
    const t = (f.tarefas || []).find(x => x.id === id);
    if (t) return { tarefa: t, frente: f };
  }
  return null;
}

const nomeTarefa = (o, id) => (tarefaPorId(o, id)?.tarefa.nome) || '-';

/* ─── catálogos de frentes por tipo de obra ───────────────── */

const WBS_RESIDENCIAL = [
  { id: 'f1', nome: 'Limpeza e proteção', tarefas: [
    { nome: 'Montagem do canteiro e proteção das áreas comuns', dur: 3, rec: 'Servente' },
    { nome: 'Ensacamento e remoção de entulho', dur: 14, rec: 'Servente', ii: true },
    { nome: 'Limpeza grossa durante o período de obra', dur: 25, rec: 'Servente', ii: true },
  ] },
  { id: 'f2', nome: 'Demolição e construção', apos: 'f1', tipo: 'II', lag: 1, tarefas: [
    { nome: 'Demolição de paredes', dur: 3, rec: 'Pedreiro' },
    { nome: 'Demolição do contrapiso dos banheiros', dur: 2, rec: 'Pedreiro' },
    { nome: 'Retirada de caixilharia', dur: 2, rec: 'Pedreiro' },
    { nome: 'Demolição de forros e sancas existentes', dur: 2.5, rec: 'Pedreiro' },
    { nome: 'Execução de alvenaria baixa', dur: 4, rec: 'Pedreiro' },
    { nome: 'Construção de alvenaria completa', dur: 5, rec: 'Pedreiro' },
    { nome: 'Requadração de cortes para infraestrutura', dur: 4, rec: 'Pedreiro' },
  ] },
  { id: 'f3', nome: 'Instalações hidráulicas', apos: 'f2', tipo: 'II', lag: 12, tarefas: [
    { nome: 'Execução de pontos de água fria', dur: 4, rec: 'Encanador' },
    { nome: 'Execução de pontos de esgoto', dur: 2.5, rec: 'Encanador' },
    { nome: 'Mudança dos pontos de vaso sanitário', dur: 2, rec: 'Encanador' },
    { nome: 'Alteração de registros de gaveta', dur: 1.5, rec: 'Encanador' },
    { nome: 'Execução de novos pontos de dreno', dur: 2, rec: 'Encanador' },
  ] },
  { id: 'f4', nome: 'Instalações elétricas', apos: 'f2', tipo: 'II', lag: 10, tarefas: [
    { nome: 'Infraestrutura e cabeamento de pontos 110 V', dur: 4, rec: 'Eletricista' },
    { nome: 'Infraestrutura e cabeamento de pontos 220 V', dur: 3, rec: 'Eletricista' },
    { nome: 'Infraestrutura de telefone, dados, áudio e câmera', dur: 3, rec: 'Eletricista' },
    { nome: 'Distribuição dos circuitos de iluminação', dur: 3, rec: 'Eletricista' },
    { nome: 'Distribuição dos pontos de interruptores', dur: 3, rec: 'Eletricista' },
    { nome: 'Adequação do quadro de distribuição', dur: 3, rec: 'Eletricista' },
    { nome: 'Instalação de DR e DPS', dur: 3, rec: 'Eletricista' },
  ] },
  { id: 'f5', nome: 'Impermeabilização', apos: 'f3', tipo: 'TI', lag: 0, tarefas: [
    { nome: 'Impermeabilização dos banheiros com pré-ancoragem', dur: 5, rec: 'Empreiteiro' },
    { nome: 'Teste de estanqueidade de 72 horas', dur: 3, rec: 'Engenharia' },
  ] },
  { id: 'f6', nome: 'Contrapiso e regularização', apos: 'f5', tipo: 'TI', tarefas: [
    { nome: 'Execução de contrapiso das áreas secas', dur: 3, rec: 'Pedreiro' },
    { nome: 'Execução de contrapiso das áreas molhadas', dur: 2, rec: 'Pedreiro' },
    { nome: 'Regularização e cura', dur: 7, rec: 'Pedreiro' },
  ] },
  { id: 'f7', nome: 'Drywall e forros', apos: 'f6', tipo: 'II', lag: 2, tarefas: [
    { nome: 'Forro em placas de gesso acartonado com proteção acústica', dur: 10, rec: 'Gesseiro' },
    { nome: 'Instalação de tabica', dur: 3, rec: 'Gesseiro' },
    { nome: 'Reforço no forro para luminária de embutir', dur: 2, rec: 'Gesseiro' },
    { nome: 'Estrutura de forro para porta de correr', dur: 2, rec: 'Gesseiro' },
    { nome: 'Cortineiro e sanca iluminada', dur: 3, rec: 'Gesseiro' },
    { nome: 'Parede em drywall com proteção acústica', dur: 3, rec: 'Gesseiro' },
  ] },
  { id: 'f8', nome: 'Revestimentos e pisos', apos: 'f6', tipo: 'TI', lag: 2, tarefas: [
    { nome: 'Assentamento de revestimento de piso 1,20 x 1,20', dur: 6, rec: 'Azulejista' },
    { nome: 'Assentamento de rodapé', dur: 1.5, rec: 'Azulejista' },
    { nome: 'Assentamento de perfil de arremate', dur: 1, rec: 'Azulejista' },
    { nome: 'Assentamento de revestimento de parede', dur: 5, rec: 'Azulejista' },
    { nome: 'Rejunte e limpeza', dur: 3, rec: 'Azulejista' },
  ] },
  { id: 'f9', nome: 'Marcenaria', apos: 'f8', tipo: 'TI', lag: 2, tarefas: [
    { nome: 'Medição final em obra', dur: 1, rec: 'Marcenaria' },
    { nome: 'Instalação da marcenaria da cozinha', dur: 5, rec: 'Marcenaria' },
    { nome: 'Instalação do closet e dos dormitórios', dur: 5, rec: 'Marcenaria' },
    { nome: 'Regulagem de ferragens e acabamento', dur: 2, rec: 'Marcenaria' },
  ] },
  { id: 'f10', nome: 'Pintura', apos: 'f7', tipo: 'TI', lag: 1, tarefas: [
    { nome: 'Emassamento e pintura de forro', dur: 10, rec: 'Pintor' },
    { nome: 'Emassamento e pintura de paredes', dur: 12, rec: 'Pintor' },
    { nome: 'Retoques finais', dur: 3, rec: 'Pintor' },
  ] },
  { id: 'f11', nome: 'Louças, metais e iluminação', apos: 'f10', tipo: 'II', lag: 8, tarefas: [
    { nome: 'Instalação de louças e metais', dur: 4, rec: 'Encanador' },
    { nome: 'Instalação de luminárias e tomadas', dur: 4, rec: 'Eletricista' },
    { nome: 'Testes finais de elétrica e hidráulica', dur: 2, rec: 'Engenharia' },
  ] },
  { id: 'f12', nome: 'Limpeza e entrega', apos: 'f11', tipo: 'TI', tarefas: [
    { nome: 'Limpeza fina', dur: 3, rec: 'Servente' },
    { nome: 'Vistoria com o cliente e lista de pendências', dur: 2, rec: 'Engenharia' },
    { nome: 'Correção das pendências e entrega das chaves', dur: 3, rec: 'Engenharia' },
  ] },
];

const WBS_COMERCIAL = [
  { id: 'f1', nome: 'Canteiro e proteção', tarefas: [
    { nome: 'Proteção do piso e da fachada', dur: 2, rec: 'Servente' },
    { nome: 'Remoção de entulho durante a obra', dur: 12, rec: 'Servente', ii: true },
  ] },
  { id: 'f2', nome: 'Demolição e alvenaria', apos: 'f1', tipo: 'II', lag: 1, tarefas: [
    { nome: 'Demolição do layout anterior', dur: 4, rec: 'Pedreiro' },
    { nome: 'Alvenaria dos provadores', dur: 4, rec: 'Pedreiro' },
    { nome: 'Parede do caixa e do estoque', dur: 3, rec: 'Pedreiro' },
  ] },
  { id: 'f3', nome: 'Instalações hidráulicas', apos: 'f2', tipo: 'II', lag: 4, tarefas: [
    { nome: 'Pontos de água e esgoto da copa', dur: 3, rec: 'Encanador' },
    { nome: 'Banho de funcionários', dur: 3, rec: 'Encanador' },
  ] },
  { id: 'f4', nome: 'Instalações elétricas', apos: 'f2', tipo: 'II', lag: 3, tarefas: [
    { nome: 'Infraestrutura da área de vendas', dur: 5, rec: 'Eletricista' },
    { nome: 'Circuitos dos provadores e do caixa', dur: 4, rec: 'Eletricista' },
    { nome: 'Trilhos e iluminação de destaque', dur: 4, rec: 'Eletricista' },
    { nome: 'Quadro, DR e DPS', dur: 3, rec: 'Eletricista' },
  ] },
  { id: 'f5', nome: 'Forro e drywall', apos: 'f4', tipo: 'II', lag: 4, tarefas: [
    { nome: 'Forro de gesso da área de vendas', dur: 8, rec: 'Gesseiro' },
    { nome: 'Sanca e cortineiro da vitrine', dur: 3, rec: 'Gesseiro' },
  ] },
  { id: 'f6', nome: 'Contrapiso e revestimentos', apos: 'f5', tipo: 'TI', tarefas: [
    { nome: 'Contrapiso do estoque', dur: 3, rec: 'Pedreiro' },
    { nome: 'Piso da área de vendas', dur: 6, rec: 'Azulejista' },
    { nome: 'Parede de destaque', dur: 4, rec: 'Azulejista' },
    { nome: 'Pintura epóxi do estoque', dur: 3, rec: 'Pintor' },
  ] },
  { id: 'f7', nome: 'Mobiliário e vitrine', apos: 'f6', tipo: 'TI', tarefas: [
    { nome: 'Instalação das gôndolas', dur: 5, rec: 'Marcenaria' },
    { nome: 'Balcão do caixa', dur: 3, rec: 'Marcenaria' },
    { nome: 'Vidros e vitrine', dur: 3, rec: 'Vidraceiro' },
  ] },
  { id: 'f8', nome: 'Pintura e acabamento', apos: 'f7', tipo: 'II', lag: 2, tarefas: [
    { nome: 'Pintura geral', dur: 6, rec: 'Pintor' },
    { nome: 'Retoques e arremates', dur: 3, rec: 'Pintor' },
  ] },
  { id: 'f9', nome: 'Entrega', apos: 'f8', tipo: 'TI', tarefas: [
    { nome: 'Limpeza fina', dur: 2, rec: 'Servente' },
    { nome: 'Vistoria e entrega', dur: 2, rec: 'Engenharia' },
  ] },
];

const WBS_APARTAMENTO = [
  { id: 'f1', nome: 'Canteiro e proteção', tarefas: [
    { nome: 'Proteção do hall e do elevador de serviço', dur: 2, rec: 'Servente' },
    { nome: 'Cadastro da equipe e plano de reforma', dur: 2, rec: 'Engenharia' },
    { nome: 'Ensacamento e remoção de entulho', dur: 16, rec: 'Servente', ii: true },
  ] },
  { id: 'f2', nome: 'Demolição', apos: 'f1', tipo: 'II', lag: 2, tarefas: [
    { nome: 'Demolição das paredes da cozinha', dur: 4, rec: 'Pedreiro' },
    { nome: 'Retirada do piso de tacos', dur: 4, rec: 'Pedreiro' },
    { nome: 'Demolição dos banheiros', dur: 4, rec: 'Pedreiro' },
  ] },
  { id: 'f3', nome: 'Alvenaria e estrutura', apos: 'f2', tipo: 'TI', tarefas: [
    { nome: 'Alvenaria da nova suíte', dur: 5, rec: 'Pedreiro' },
    { nome: 'Requadração para infraestrutura', dur: 3, rec: 'Pedreiro' },
  ] },
  { id: 'f4', nome: 'Instalações hidráulicas', apos: 'f3', tipo: 'II', lag: 2, tarefas: [
    { nome: 'Pontos de água fria e quente', dur: 5, rec: 'Encanador' },
    { nome: 'Ramais de esgoto', dur: 4, rec: 'Encanador' },
  ] },
  { id: 'f5', nome: 'Instalações elétricas', apos: 'f3', tipo: 'II', lag: 3, tarefas: [
    { nome: 'Infraestrutura e cabeamento', dur: 6, rec: 'Eletricista' },
    { nome: 'Quadro de distribuição', dur: 3, rec: 'Eletricista' },
  ] },
  { id: 'f6', nome: 'Impermeabilização e contrapiso', apos: 'f4', tipo: 'TI', tarefas: [
    { nome: 'Impermeabilização dos banheiros', dur: 4, rec: 'Empreiteiro' },
    { nome: 'Regularização do contrapiso', dur: 8, rec: 'Pedreiro' },
  ] },
  { id: 'f7', nome: 'Revestimentos', apos: 'f6', tipo: 'TI', tarefas: [
    { nome: 'Piso da área social', dur: 6, rec: 'Azulejista' },
    { nome: 'Revestimento dos banheiros', dur: 6, rec: 'Azulejista' },
    { nome: 'Rejunte e arremates', dur: 3, rec: 'Azulejista' },
  ] },
  { id: 'f8', nome: 'Marcenaria', apos: 'f7', tipo: 'TI', lag: 2, tarefas: [
    { nome: 'Medição final e produção', dur: 2, rec: 'Marcenaria' },
    { nome: 'Instalação da marcenaria', dur: 8, rec: 'Marcenaria' },
  ] },
  { id: 'f9', nome: 'Pintura', apos: 'f8', tipo: 'II', lag: 4, tarefas: [
    { nome: 'Emassamento e pintura de forro', dur: 8, rec: 'Pintor' },
    { nome: 'Pintura das paredes', dur: 10, rec: 'Pintor' },
  ] },
  { id: 'f10', nome: 'Louças, metais e entrega', apos: 'f9', tipo: 'TI', tarefas: [
    { nome: 'Instalação de louças, metais e luminárias', dur: 5, rec: 'Encanador' },
    { nome: 'Limpeza fina e vistoria', dur: 4, rec: 'Engenharia' },
  ] },
];

const WBS = { ob_vila: WBS_RESIDENCIAL, ob_loja: WBS_COMERCIAL, ob_jardins: WBS_APARTAMENTO };
