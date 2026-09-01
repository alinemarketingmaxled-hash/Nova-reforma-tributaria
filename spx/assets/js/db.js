/* ============================================================
   SPX · camada de dados
   Tudo roda no navegador: os registros ficam em localStorage e
   as fotos em IndexedDB (que aguenta arquivos grandes).
   ============================================================ */

const CHAVE_DB = 'spx.obras.v1';
const CHAVE_SESSAO = 'spx.sessao.v1';

/* ─── utilitários ─────────────────────────────────────────── */

const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const hoje = () => new Date().toISOString().slice(0, 10);

const dia = (iso) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); };

const maisDias = (iso, n) => {
  const d = dia(iso); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const difDias = (de, ate) => Math.round((dia(ate) - dia(de)) / 86400000);

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const fmtData = (iso, longo = false) => {
  if (!iso) return '—';
  const d = dia(iso);
  return longo
    ? `${d.getDate()} de ${['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][d.getMonth()]} de ${d.getFullYear()}`
    : `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`;
};

const fmtPeriodo = (de, ate) => {
  const a = dia(de), b = dia(ate);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} a ${b.getDate()} de ${MESES[b.getMonth()]}`
    : `${a.getDate()} de ${MESES[a.getMonth()]} a ${b.getDate()} de ${MESES[b.getMonth()]}`;
};

const fmtQuando = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  if (s < 604800) return `há ${Math.floor(s / 86400)} dia(s)`;
  return fmtData(iso.slice(0, 10));
};

const moeda = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });

const iniciais = (nome = '') => nome.trim().split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase();

/* Segunda-feira da semana de uma data */
const segundaDa = (iso) => {
  const d = dia(iso);
  const off = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - off);
  return d.toISOString().slice(0, 10);
};

/* Número da semana no ano (ISO 8601) */
const numeroSemana = (iso) => {
  const d = dia(iso);
  d.setDate(d.getDate() + 4 - ((d.getDay() + 6) % 7));
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - jan1) / 86400000 + 1) / 7);
};

/* ─── catálogos do domínio ────────────────────────────────── */

const MOTIVOS_ATRASO = [
  { id: 'chuva',      rotulo: 'Chuva ou clima',              resp: 'Clima' },
  { id: 'material',   rotulo: 'Material não entregue',        resp: 'Fornecedor' },
  { id: 'projeto',    rotulo: 'Alteração de projeto',         resp: 'Arquiteto' },
  { id: 'detalhe',    rotulo: 'Detalhamento pendente',        resp: 'Arquiteto' },
  { id: 'aprovacao',  rotulo: 'Aprovação do cliente pendente', resp: 'Cliente' },
  { id: 'condominio', rotulo: 'Condomínio ou órgão público',  resp: 'Terceiros' },
  { id: 'equipe',     rotulo: 'Equipe reduzida',              resp: 'SPX' },
  { id: 'retrabalho', rotulo: 'Retrabalho ou não conformidade', resp: 'SPX' },
  { id: 'imprevisto', rotulo: 'Imprevisto na estrutura existente', resp: 'Obra' },
  { id: 'financeiro', rotulo: 'Liberação financeira',         resp: 'Cliente' },
  { id: 'outro',      rotulo: 'Outro motivo',                 resp: 'SPX' },
];

const motivoRotulo = (id) => (MOTIVOS_ATRASO.find(m => m.id === id) || {}).rotulo || 'Outro motivo';

const ETAPAS_PADRAO = [
  { nome: 'Projetos e aprovações',        peso: 5 },
  { nome: 'Demolição e remoções',         peso: 8 },
  { nome: 'Alvenaria e estrutura',        peso: 14 },
  { nome: 'Instalações hidráulicas',      peso: 10 },
  { nome: 'Instalações elétricas',        peso: 12 },
  { nome: 'Contrapiso e regularização',   peso: 8 },
  { nome: 'Revestimentos e pisos',        peso: 14 },
  { nome: 'Marcenaria',                   peso: 10 },
  { nome: 'Pintura',                      peso: 9 },
  { nome: 'Louças, metais e iluminação',  peso: 6 },
  { nome: 'Limpeza e entrega',            peso: 4 },
];

const PAPEIS = {
  engenheiro: { rotulo: 'Engenharia', desc: 'Lança o andamento, as fotos e os atrasos da semana' },
  arquiteto:  { rotulo: 'Arquitetura', desc: 'Acompanha a execução e responde às pendências de projeto' },
  cliente:    { rotulo: 'Cliente',     desc: 'Vê o andamento da obra em linguagem simples' },
};

/* ─── fotos (IndexedDB, com reserva em memória) ───────────── */

const Fotos = (() => {
  const memoria = new Map();
  let conexao = null;

  function abrir() {
    if (conexao) return conexao;
    conexao = new Promise((ok, erro) => {
      if (!('indexedDB' in window)) return erro(new Error('sem indexedDB'));
      const req = indexedDB.open('spx-fotos', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('fotos');
      req.onsuccess = () => ok(req.result);
      req.onerror = () => erro(req.error);
    }).catch(e => { conexao = null; throw e; });
    return conexao;
  }

  async function loja(modo) {
    const db = await abrir();
    return db.transaction('fotos', modo).objectStore('fotos');
  }

  const promessa = (req) => new Promise((ok, erro) => {
    req.onsuccess = () => ok(req.result);
    req.onerror = () => erro(req.error);
  });

  return {
    async salvar(id, dataUrl) {
      try { await promessa((await loja('readwrite')).put(dataUrl, id)); }
      catch { memoria.set(id, dataUrl); }
      return id;
    },
    async ler(id) {
      if (memoria.has(id)) return memoria.get(id);
      try { return await promessa((await loja('readonly')).get(id)); }
      catch { return null; }
    },
    async remover(id) {
      memoria.delete(id);
      try { await promessa((await loja('readwrite')).delete(id)); } catch { /* nada a fazer */ }
    },
    /* Reduz a imagem antes de guardar: obra tem muita foto e pouca banda. */
    comprimir(arquivo, largura = 1400, qualidade = 0.72) {
      return new Promise((ok, erro) => {
        const leitor = new FileReader();
        leitor.onerror = () => erro(new Error('não foi possível ler o arquivo'));
        leitor.onload = () => {
          const img = new Image();
          img.onerror = () => erro(new Error('arquivo de imagem inválido'));
          img.onload = () => {
            const escala = Math.min(1, largura / img.width);
            const cv = document.createElement('canvas');
            cv.width = Math.round(img.width * escala);
            cv.height = Math.round(img.height * escala);
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
            ok(cv.toDataURL('image/jpeg', qualidade));
          };
          img.src = leitor.result;
        };
        leitor.readAsDataURL(arquivo);
      });
    },
  };
})();

/* ─── banco ───────────────────────────────────────────────── */

const DB = {
  dados: null,

  carregar() {
    try {
      const cru = localStorage.getItem(CHAVE_DB);
      if (cru) { this.dados = JSON.parse(cru); return this.dados; }
    } catch { /* base corrompida: recomeça do exemplo */ }
    this.dados = semear();
    this.salvar();
    return this.dados;
  },

  salvar() {
    try { localStorage.setItem(CHAVE_DB, JSON.stringify(this.dados)); }
    catch (e) { console.warn('Não foi possível gravar os dados', e); }
    return this.dados;
  },

  zerar() {
    localStorage.removeItem(CHAVE_DB);
    localStorage.removeItem(CHAVE_SESSAO);
    this.dados = null;
  },

  /* usuários e sessão */
  usuario(id) { return this.dados.usuarios.find(u => u.id === id) || null; },
  nome(id) { return (this.usuario(id) || {}).nome || '—'; },

  entrar(email, senha) {
    const u = this.dados.usuarios.find(
      x => x.email.toLowerCase() === String(email).trim().toLowerCase() && x.senha === senha
    );
    if (!u) return null;
    localStorage.setItem(CHAVE_SESSAO, u.id);
    return u;
  },

  sessao() {
    const id = localStorage.getItem(CHAVE_SESSAO);
    return id ? this.usuario(id) : null;
  },

  sair() { localStorage.removeItem(CHAVE_SESSAO); },

  /* obras visíveis para quem está logado */
  obras(usuario) {
    if (!usuario) return [];
    return this.dados.obras.filter(o =>
      usuario.papel === 'engenheiro'
        ? o.engenheiro_id === usuario.id || usuario.admin
        : o.cliente_id === usuario.id || o.arquiteto_id === usuario.id
    );
  },

  obra(id) { return this.dados.obras.find(o => o.id === id) || null; },
};

/* ─── cálculos de andamento ───────────────────────────────── */

/* Percentual executado da obra: média das etapas ponderada pelo peso. */
function progressoObra(obra) {
  const total = obra.etapas.reduce((s, e) => s + e.peso, 0) || 1;
  return Math.round(obra.etapas.reduce((s, e) => s + e.peso * e.progresso, 0) / total);
}

/* Percentual que o cronograma previa para hoje: a régua da comparação. */
function progressoPlanejado(obra, data = hoje()) {
  const total = obra.etapas.reduce((s, e) => s + e.peso, 0) || 1;
  const soma = obra.etapas.reduce((s, e) => {
    const ini = e.inicio || obra.inicio;
    const fim = e.fim || obra.prazo;
    const span = Math.max(1, difDias(ini, fim));
    const pct = Math.max(0, Math.min(1, difDias(ini, data) / span));
    return s + e.peso * pct * 100;
  }, 0);
  return Math.round(soma / total);
}

/* Dias de atraso acumulados, somando o que os relatórios registraram. */
function diasAtrasoAcumulados(obra) {
  return obra.relatorios.reduce((s, r) => s + (r.atrasos || []).reduce((t, a) => t + Number(a.dias || 0), 0), 0);
}

function atrasosPorMotivo(obra) {
  const mapa = new Map();
  obra.relatorios.forEach(r => (r.atrasos || []).forEach(a => {
    mapa.set(a.motivo, (mapa.get(a.motivo) || 0) + Number(a.dias || 0));
  }));
  return [...mapa.entries()]
    .map(([motivo, dias]) => ({ motivo, rotulo: motivoRotulo(motivo), dias }))
    .sort((a, b) => b.dias - a.dias);
}

/* Semáforo da obra: verde no prazo, âmbar de olho, vermelho atrasada. */
function situacaoObra(obra) {
  const real = progressoObra(obra);
  const plan = progressoPlanejado(obra);
  const dif = real - plan;
  if (obra.status === 'concluida' || real >= 100) return { chave: 'ok', rotulo: 'Concluída', dif };
  if (dif >= -2) return { chave: 'ok', rotulo: 'No prazo', dif };
  if (dif >= -8) return { chave: 'warn', rotulo: 'Atenção', dif };
  return { chave: 'bad', rotulo: 'Atrasada', dif };
}

function relatoriosOrdenados(obra) {
  return [...obra.relatorios].sort((a, b) => (a.de < b.de ? 1 : -1));
}

function ultimoRelatorio(obra) { return relatoriosOrdenados(obra)[0] || null; }

/* A semana corrente já foi reportada? */
function semanaReportada(obra) {
  const seg = segundaDa(hoje());
  return obra.relatorios.some(r => r.de === seg);
}

function pendenciasAbertas(obra, papel) {
  return obra.pendencias.filter(p =>
    p.status !== 'resolvida' && (!papel || p.para === papel)
  );
}

function todasAsFotos(obra) {
  return relatoriosOrdenados(obra).flatMap(r =>
    (r.fotos || []).map(f => ({ ...f, relatorio_id: r.id, de: r.de, ate: r.ate, semana: r.semana }))
  );
}

/* ─── dados de demonstração ───────────────────────────────── */

/* Imagens de exemplo desenhadas em SVG; a obra real usa foto de verdade. */
function fotoExemplo(tom, texto) {
  const paletas = {
    a: ['#c8c2b6', '#8f877a', '#5d564c'],
    b: ['#b9c3c9', '#7e8b93', '#4d5960'],
    c: ['#d6c9b4', '#a8927a', '#6b5a45'],
    d: ['#c2c8bb', '#8b9382', '#565d4e'],
  };
  const [c1, c2, c3] = paletas[tom] || paletas.a;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<rect width="800" height="600" fill="url(#g)"/>
<g stroke="${c3}" stroke-opacity=".38" fill="none" stroke-width="3">
<path d="M0 420h800M0 470h800M120 260v340M300 200v400M520 240v360M680 300v300"/>
<path d="M120 300h180M300 340h220M520 380h160"/></g>
<rect x="60" y="120" width="240" height="180" fill="${c3}" fill-opacity=".22"/>
<rect x="420" y="60" width="300" height="220" fill="${c3}" fill-opacity=".14"/>
<rect x="0" y="520" width="800" height="80" fill="${c3}" fill-opacity=".3"/>
<text x="34" y="566" font-family="sans-serif" font-size="26" fill="#fff" fill-opacity=".92">${texto}</text>
<text x="766" y="42" text-anchor="end" font-family="sans-serif" font-size="17" fill="#fff" fill-opacity=".6">imagem de exemplo</text>
</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function montarEtapas(inicio, prazo, progressos) {
  const total = difDias(inicio, prazo);
  const somaPesos = ETAPAS_PADRAO.reduce((s, e) => s + e.peso, 0);
  let acumulado = 0;
  return ETAPAS_PADRAO.map((e, i) => {
    const ini = maisDias(inicio, Math.round((acumulado / somaPesos) * total));
    acumulado += e.peso;
    /* as etapas se sobrepõem um pouco, como acontece na obra real */
    const fim = maisDias(inicio, Math.min(total, Math.round((acumulado / somaPesos) * total) + 10));
    return { id: 'et' + (i + 1), nome: e.nome, peso: e.peso, progresso: progressos[i] ?? 0, inicio: ini, fim };
  });
}

function semear() {
  const base = hoje();
  const seg = segundaDa(base);
  const semanaDe = (n) => maisDias(seg, -7 * n);          // segunda de n semanas atrás
  const rel = (n, extra) => {
    const de = semanaDe(n), ate = maisDias(de, 5);
    return { id: uid('rel'), semana: numeroSemana(de), de, ate, criado_em: new Date(dia(ate)).toISOString(), comentarios: [], fotos: [], atrasos: [], ...extra };
  };

  const usuarios = [
    { id: 'u_eng',  nome: 'Rafael Lima',     email: 'eng@spx.com.br',     senha: 'spx123', papel: 'engenheiro', cargo: 'Engenheiro civil · CREA 5069481234', admin: true },
    { id: 'u_eng2', nome: 'Tiago Moretti',   email: 'tiago@spx.com.br',   senha: 'spx123', papel: 'engenheiro', cargo: 'Engenheiro residente' },
    { id: 'u_arq',  nome: 'Marina Costa',    email: 'arq@spx.com.br',     senha: 'spx123', papel: 'arquiteto',  cargo: 'Estúdio Marina Costa Arquitetura' },
    { id: 'u_arq2', nome: 'Bruno Nakamura',  email: 'bruno@nkm.arq.br',   senha: 'spx123', papel: 'arquiteto',  cargo: 'Nakamura Arquitetura' },
    { id: 'u_cli',  nome: 'Helena Duarte',   email: 'cliente@spx.com.br', senha: 'spx123', papel: 'cliente',    cargo: 'Proprietária' },
    { id: 'u_cli2', nome: 'Paulo Menezes',   email: 'paulo@aurora.com.br', senha: 'spx123', papel: 'cliente',   cargo: 'Grupo Aurora' },
    { id: 'u_cli3', nome: 'Camila Berto',    email: 'camila@email.com',   senha: 'spx123', papel: 'cliente',    cargo: 'Proprietária' },
  ];

  const obras = [
    {
      id: 'ob_vila',
      nome: 'Residência Vila Madalena',
      endereco: 'Rua Harmonia, 780 · Vila Madalena, São Paulo',
      tipo: 'Reforma residencial completa',
      area: 320,
      valor: 1180000,
      cliente_id: 'u_cli', arquiteto_id: 'u_arq', engenheiro_id: 'u_eng',
      inicio: maisDias(seg, -147), prazo: maisDias(seg, 112),
      status: 'andamento',
      etapas: montarEtapas(maisDias(seg, -147), maisDias(seg, 112), [100, 100, 100, 92, 78, 85, 40, 15, 0, 0, 0]),
      relatorios: [
        rel(0, {
          resumo: 'Semana concentrada no assentamento do porcelanato da área social. Chegamos a 40% do revestimento total. A equipe de elétrica finalizou a passagem de cabos do pavimento superior e iniciamos os testes de tomadas dos quartos.\n\nA bancada da cozinha foi conferida com a medida final de marcenaria e liberada para produção.',
          proximos: 'Concluir o porcelanato da sala e circulação, iniciar o rejunte e receber a primeira remessa de marcenaria dos dormitórios.',
          efetivo: 9, dias_trabalhados: 5, autor: 'u_eng',
          fotos: [
            { id: uid('f'), src: fotoExemplo('a', 'Porcelanato da sala em execução'), cap: 'Assentamento do porcelanato da sala, alinhamento conferido a laser', etapa: 'et7' },
            { id: uid('f'), src: fotoExemplo('b', 'Quadro elétrico do pavimento superior'), cap: 'Quadro do pavimento superior com circuitos identificados', etapa: 'et5' },
            { id: uid('f'), src: fotoExemplo('c', 'Área da cozinha'), cap: 'Cozinha pronta para receber a marcenaria', etapa: 'et8' },
          ],
          atrasos: [],
          comentarios: [
            { id: uid('c'), autor: 'u_cli', texto: 'Ficou lindo o piso. O tom do rejunte é o que combinamos com a Marina?', em: new Date(Date.now() - 6e7).toISOString() },
            { id: uid('c'), autor: 'u_arq', texto: 'É o cinza platina, Helena. Mandei a amostra para o Rafael conferir na obra antes de aplicar.', em: new Date(Date.now() - 3e7).toISOString() },
          ],
        }),
        rel(1, {
          resumo: 'Início do assentamento de revestimentos. Fizemos a paginação em obra junto com a arquiteta para conferir o recorte das peças na parede do banho social.\n\nO contrapiso foi liberado após 14 dias de cura e apresentou nível dentro da tolerância de 3 mm.',
          proximos: 'Avançar com o porcelanato da área social e concluir os testes elétricos.',
          efetivo: 8, dias_trabalhados: 4, autor: 'u_eng',
          fotos: [
            { id: uid('f'), src: fotoExemplo('c', 'Paginação do banho social'), cap: 'Paginação do banho social definida com a arquiteta', etapa: 'et7' },
            { id: uid('f'), src: fotoExemplo('d', 'Contrapiso liberado'), cap: 'Contrapiso curado e nivelado', etapa: 'et6' },
          ],
          atrasos: [
            { id: uid('a'), motivo: 'material', dias: 1, resp: 'Fornecedor', descricao: 'A remessa de porcelanato 120x120 chegou na quarta em vez de segunda. Perdemos um dia de assentamento.' },
          ],
        }),
        rel(2, {
          resumo: 'Execução do contrapiso de toda a área social e dos dormitórios, com caimento definido nas áreas molhadas. Também concluímos a impermeabilização dos dois banheiros do pavimento superior e fizemos o teste de estanqueidade por 72 horas, sem apontamentos.',
          proximos: 'Aguardar a cura do contrapiso e iniciar a paginação dos revestimentos.',
          efetivo: 10, dias_trabalhados: 5, autor: 'u_eng',
          fotos: [
            { id: uid('f'), src: fotoExemplo('d', 'Contrapiso em execução'), cap: 'Contrapiso da área social sendo sarrafeado', etapa: 'et6' },
            { id: uid('f'), src: fotoExemplo('b', 'Teste de estanqueidade'), cap: 'Teste de estanqueidade do banho da suíte', etapa: 'et4' },
          ],
          atrasos: [],
        }),
        rel(3, {
          resumo: 'Semana difícil. Choveu três dias e a laje descoberta da área gourmet não permitiu o avanço do contrapiso externo. Redirecionamos a equipe para a parte interna e adiantamos a infraestrutura elétrica dos dormitórios.\n\nAbrimos uma pendência com a arquitetura sobre a posição dos pontos de luz da escada.',
          proximos: 'Retomar o contrapiso externo assim que o tempo firmar.',
          efetivo: 7, dias_trabalhados: 2, autor: 'u_eng2',
          fotos: [
            { id: uid('f'), src: fotoExemplo('b', 'Area gourmet coberta com lona'), cap: 'Área gourmet protegida com lona durante a chuva', etapa: 'et6' },
          ],
          atrasos: [
            { id: uid('a'), motivo: 'chuva', dias: 3, resp: 'Clima', descricao: 'Três dias de chuva forte impediram o contrapiso da área externa e a movimentação de material pelo quintal.' },
            { id: uid('a'), motivo: 'detalhe', dias: 1, resp: 'Arquiteto', descricao: 'Faltava o detalhamento dos pontos de luz da escada; a elétrica ficou parada nesse trecho por um dia.' },
          ],
        }),
        rel(4, {
          resumo: 'Instalações hidráulicas do pavimento superior concluídas, com pressurização testada a 4 kgf/cm². A elétrica avançou nos eletrodutos da área social.\n\nRecebemos a aprovação do cliente para a troca do modelo de louças, o que não altera o prazo.',
          proximos: 'Iniciar a impermeabilização dos banheiros e o contrapiso.',
          efetivo: 10, dias_trabalhados: 5, autor: 'u_eng',
          fotos: [
            { id: uid('f'), src: fotoExemplo('a', 'Prumada hidraulica'), cap: 'Prumada hidráulica do pavimento superior testada', etapa: 'et4' },
            { id: uid('f'), src: fotoExemplo('c', 'Eletrodutos da area social'), cap: 'Eletrodutos embutidos na área social', etapa: 'et5' },
          ],
          atrasos: [],
        }),
        rel(5, {
          resumo: 'Fechamento da alvenaria nova do closet e do lavabo. A verga da abertura da sala foi executada conforme o projeto estrutural, com escoramento mantido por sete dias.\n\nIniciamos a distribuição hidráulica dos banheiros.',
          proximos: 'Concluir as prumadas hidráulicas e iniciar a elétrica do pavimento superior.',
          efetivo: 11, dias_trabalhados: 5, autor: 'u_eng',
          fotos: [
            { id: uid('f'), src: fotoExemplo('a', 'Alvenaria do closet'), cap: 'Alvenaria nova do closet levantada', etapa: 'et3' },
            { id: uid('f'), src: fotoExemplo('d', 'Verga da abertura da sala'), cap: 'Verga executada conforme projeto estrutural', etapa: 'et3' },
          ],
          atrasos: [
            { id: uid('a'), motivo: 'imprevisto', dias: 2, resp: 'Obra', descricao: 'Ao abrir a parede da sala encontramos uma viga fora da posição do projeto original. Foi necessário revisar o reforço com o calculista.' },
          ],
        }),
      ],
      pendencias: [
        { id: uid('p'), titulo: 'Definir o acabamento do rodapé da área social', descricao: 'Precisamos saber se mantém o rodapé de 15 cm pintado ou muda para o embutido em alumínio. A definição trava a compra do material desta semana.', para: 'arquiteto', de: 'u_eng', prazo: maisDias(seg, 4), status: 'aberta', criado_em: new Date(Date.now() - 2 * 864e5).toISOString(), respostas: [] },
        { id: uid('p'), titulo: 'Aprovar a amostra do rejunte cinza platina', descricao: 'A amostra está na obra desde sexta. Sem a aprovação não podemos rejuntar a área social.', para: 'cliente', de: 'u_eng', prazo: maisDias(seg, 2), status: 'aberta', criado_em: new Date(Date.now() - 4 * 864e5).toISOString(), respostas: [] },
        { id: uid('p'), titulo: 'Enviar o detalhamento da iluminação da escada', descricao: 'Os pontos de luz da escada não constam no projeto luminotécnico revisão 03.', para: 'arquiteto', de: 'u_eng', prazo: maisDias(seg, -10), status: 'resolvida', criado_em: new Date(Date.now() - 20 * 864e5).toISOString(),
          respostas: [{ id: uid('r'), autor: 'u_arq', texto: 'Enviei a revisão 04 com os três pontos na parede lateral, a 40 cm do piso de cada patamar.', em: new Date(Date.now() - 16 * 864e5).toISOString() }] },
      ],
    },

    {
      id: 'ob_loja',
      nome: 'Loja Conceito Oscar Freire',
      endereco: 'Rua Oscar Freire, 1120 · Jardins, São Paulo',
      tipo: 'Comercial · projeto de interiores',
      area: 180,
      valor: 740000,
      cliente_id: 'u_cli2', arquiteto_id: 'u_arq2', engenheiro_id: 'u_eng',
      inicio: maisDias(seg, -77), prazo: maisDias(seg, 56),
      status: 'andamento',
      etapas: montarEtapas(maisDias(seg, -77), maisDias(seg, 56), [100, 100, 90, 70, 60, 55, 20, 0, 0, 0, 0]),
      relatorios: [
        rel(0, {
          resumo: 'Concluímos o forro de gesso da área de vendas e iniciamos o contrapiso do estoque. A vitrine foi medida pelo fornecedor de vidro e a produção começa na segunda.',
          proximos: 'Contrapiso do estoque e início do revestimento da parede de destaque.',
          efetivo: 6, dias_trabalhados: 5, autor: 'u_eng',
          fotos: [{ id: uid('f'), src: fotoExemplo('b', 'Forro da area de vendas'), cap: 'Forro de gesso da área de vendas concluído', etapa: 'et3' }],
          atrasos: [
            { id: uid('a'), motivo: 'condominio', dias: 2, resp: 'Terceiros', descricao: 'A administração do prédio liberou a carga e descarga apenas depois das 18h em dois dias da semana, reduzindo o ritmo da equipe.' },
          ],
        }),
        rel(1, {
          resumo: 'Infraestrutura elétrica dos provadores concluída e circuito de iluminação da vitrine testado. A marcenaria confirmou o prazo de 25 dias para as gôndolas.',
          proximos: 'Fechar o forro da área de vendas.',
          efetivo: 6, dias_trabalhados: 5, autor: 'u_eng',
          fotos: [{ id: uid('f'), src: fotoExemplo('c', 'Infra eletrica dos provadores'), cap: 'Infraestrutura elétrica dos provadores', etapa: 'et5' }],
          atrasos: [],
        }),
        rel(2, {
          resumo: 'Semana de alvenaria: fechamento dos provadores e da parede do caixa. Recebemos a revisão 02 do projeto com a mudança na posição do balcão, o que exigiu refazer um trecho de 3 m de parede já levantada.',
          proximos: 'Iniciar a elétrica dos provadores.',
          efetivo: 7, dias_trabalhados: 5, autor: 'u_eng',
          fotos: [{ id: uid('f'), src: fotoExemplo('a', 'Alvenaria dos provadores'), cap: 'Alvenaria dos provadores em execução', etapa: 'et3' }],
          atrasos: [
            { id: uid('a'), motivo: 'projeto', dias: 3, resp: 'Arquiteto', descricao: 'A revisão 02 mudou a posição do balcão do caixa depois da parede levantada. Demolição e reexecução de 3 m de alvenaria.' },
          ],
        }),
      ],
      pendencias: [
        { id: uid('p'), titulo: 'Confirmar a cor da tinta epóxi do estoque', descricao: 'O fornecedor precisa da confirmação até quinta para entregar dentro da semana.', para: 'arquiteto', de: 'u_eng', prazo: maisDias(seg, 3), status: 'aberta', criado_em: new Date(Date.now() - 864e5).toISOString(), respostas: [] },
      ],
    },

    {
      id: 'ob_jardins',
      nome: 'Apartamento Jardins 142',
      endereco: 'Alameda Casa Branca, 142 · Jardins, São Paulo',
      tipo: 'Reforma de apartamento',
      area: 210,
      valor: 620000,
      cliente_id: 'u_cli3', arquiteto_id: 'u_arq', engenheiro_id: 'u_eng2',
      inicio: maisDias(seg, -35), prazo: maisDias(seg, 154),
      status: 'andamento',
      etapas: montarEtapas(maisDias(seg, -35), maisDias(seg, 154), [100, 85, 30, 10, 5, 0, 0, 0, 0, 0, 0]),
      relatorios: [
        rel(0, {
          resumo: 'Demolição concluída em 85%. A retirada do piso de tacos da sala revelou um contrapiso irregular, com desnível de até 4 cm, que vai exigir regularização adicional.\n\nOrçamento complementar enviado à cliente para aprovação.',
          proximos: 'Concluir a demolição e iniciar a alvenaria da suíte.',
          efetivo: 5, dias_trabalhados: 5, autor: 'u_eng2',
          fotos: [
            { id: uid('f'), src: fotoExemplo('d', 'Demolicao da sala'), cap: 'Sala após a retirada do piso de tacos', etapa: 'et2' },
            { id: uid('f'), src: fotoExemplo('a', 'Desnivel do contrapiso'), cap: 'Desnível de 4 cm identificado no contrapiso', etapa: 'et6' },
          ],
          atrasos: [
            { id: uid('a'), motivo: 'imprevisto', dias: 2, resp: 'Obra', descricao: 'Contrapiso existente fora de nível, não identificável antes da demolição. Serviço adicional de regularização em orçamento.' },
          ],
        }),
        rel(1, {
          resumo: 'Início da obra com a montagem do canteiro, proteção das áreas comuns do prédio e cadastro da equipe na portaria. Demolição das paredes da cozinha iniciada conforme o projeto de layout.',
          proximos: 'Avançar com a demolição da sala e dos banheiros.',
          efetivo: 5, dias_trabalhados: 4, autor: 'u_eng2',
          fotos: [{ id: uid('f'), src: fotoExemplo('c', 'Protecao das areas comuns'), cap: 'Proteção do hall e do elevador de serviço', etapa: 'et1' }],
          atrasos: [
            { id: uid('a'), motivo: 'condominio', dias: 1, resp: 'Terceiros', descricao: 'O condomínio exigiu ART e seguro adicionais antes de liberar o início, o que consumiu o primeiro dia.' },
          ],
        }),
      ],
      pendencias: [
        { id: uid('p'), titulo: 'Aprovar o orçamento complementar da regularização do contrapiso', descricao: 'Serviço adicional de R$ 18.400 para regularizar 96 m² de contrapiso fora de nível. Sem a aprovação a obra para no fim da demolição.', para: 'cliente', de: 'u_eng', prazo: maisDias(seg, 5), status: 'aberta', criado_em: new Date(Date.now() - 3 * 864e5).toISOString(), respostas: [] },
      ],
    },
  ];

  /* Fotografa o percentual da obra ao fim de cada semana relatada,
     para que a linha do tempo mostre o avanço de uma semana à outra. */
  obras.forEach(o => {
    const atual = progressoObra(o);
    const ordem = [...o.relatorios].sort((a, b) => (a.de < b.de ? -1 : 1));
    ordem.forEach((r, i) => {
      r.progresso_apos = Math.round(atual * (0.72 + 0.28 * ((i + 1) / ordem.length)));
    });
  });

  return { versao: 1, empresa: { nome: 'SPX Engenharia', sigla: 'SPX' }, usuarios, obras };
}
