/* ============================================================
   SPX · aplicação: login, estrutura, rotas e painéis
   Pensado para o celular: abas na base, ações rápidas no botão
   central e uma grade de módulos no lugar do menu lateral.
   ============================================================ */

const TODOS = ['engenheiro', 'arquiteto', 'cliente'];

/* Cada módulo é uma tela; `papeis` diz quem pode abrir. */
const MODULOS = [
  { id: 'geral',         rota: '',              grupo: 'Acompanhamento', icone: 'obra',      nome: 'Visão geral',     desc: 'O retrato da obra hoje', papeis: TODOS },
  { id: 'semanas',       rota: 'semanas',       grupo: 'Acompanhamento', icone: 'semana',    nome: 'Semanas',         desc: 'Relatórios com fotos', papeis: TODOS },
  { id: 'fotos',         rota: 'fotos',         grupo: 'Acompanhamento', icone: 'fotos',     nome: 'Fotos',           desc: 'Todo o registro da obra', papeis: TODOS },
  { id: 'pendencias',    rota: 'pendencias',    grupo: 'Acompanhamento', icone: 'balao',     nome: 'Pendências',      desc: 'O que trava a obra', papeis: TODOS },

  { id: 'cronograma',    rota: 'cronograma',    grupo: 'Planejamento',   icone: 'etapas',    nome: 'Cronograma',      desc: 'Etapas, datas e avanço', papeis: TODOS },
  { id: 'planejamento',  rota: 'planejamento',  grupo: 'Planejamento',   icone: 'regua',     nome: 'Planejamento técnico', desc: 'Escopo, especificações e normas', papeis: TODOS },
  { id: 'custos',        rota: 'custos',        grupo: 'Planejamento',   icone: 'grafico',   nome: 'Custos',          desc: 'Orçamento, gasto e curva S', papeis: ['engenheiro'] },
  { id: 'recursos',      rota: 'recursos',      grupo: 'Planejamento',   icone: 'equipe',    nome: 'Recursos',        desc: 'Equipe e equipamentos', papeis: ['engenheiro'] },
  { id: 'riscos',        rota: 'riscos',        grupo: 'Planejamento',   icone: 'pendencia', nome: 'Riscos',          desc: 'Matriz e plano de resposta', papeis: ['engenheiro', 'arquiteto'] },

  { id: 'qualidade',     rota: 'qualidade',     grupo: 'Execução',       icone: 'ok',        nome: 'Qualidade',       desc: 'Inspeções e não conformidades', papeis: TODOS },
  { id: 'ssma',          rota: 'ssma',          grupo: 'Execução',       icone: 'escudo',    nome: 'Segurança e meio ambiente', desc: 'Normas NR, DDS e resíduos', papeis: ['engenheiro'] },
  { id: 'documentos',    rota: 'documentos',    grupo: 'Execução',       icone: 'doc',       nome: 'Documentação',    desc: 'Plantas, revisões e alterações', papeis: TODOS },

  { id: 'materiais',     rota: 'materiais',     grupo: 'Suprimentos',    icone: 'caixa',     nome: 'Materiais',       desc: 'Estoque e rastreabilidade', papeis: ['engenheiro'] },
  { id: 'compras',       rota: 'compras',       grupo: 'Suprimentos',    icone: 'carrinho',  nome: 'Compras',         desc: 'Pedidos e fornecedores', papeis: ['engenheiro'] },

  { id: 'financeiro',    rota: 'financeiro',    grupo: 'Gestão',         icone: 'dinheiro',  nome: 'Valores',         desc: 'Contrato, medições e pagamentos', papeis: ['engenheiro', 'cliente'] },
  { id: 'aprovacoes',    rota: 'aprovacoes',    grupo: 'Gestão',         icone: 'assinar',   nome: 'Aprovações',      desc: 'Decisões registradas', papeis: TODOS },
  { id: 'desempenho',    rota: 'desempenho',    grupo: 'Gestão',         icone: 'raio',      nome: 'Desempenho',      desc: 'Prazo, custo, qualidade e segurança', papeis: TODOS },
  { id: 'equipe',        rota: 'equipe',        grupo: 'Gestão',         icone: 'pessoas',   nome: 'Equipe e contrato', desc: 'Quem é quem na obra', papeis: TODOS },
];

const TELAS = {
  '': (o) => telaObra(o),
  semanas: telaSemanas, semana: telaSemana, 'nova-semana': telaFormSemana,
  fotos: telaFotos, pendencias: telaPendencias, equipe: telaEquipe,
  cronograma: telaCronograma, etapas: telaCronograma,
  planejamento: telaPlanejamento, custos: telaCustos, recursos: telaRecursos, riscos: telaRiscos,
  qualidade: telaQualidade, ssma: telaSSMA, documentos: telaDocumentos,
  materiais: telaMateriais, compras: telaCompras,
  aprovacoes: telaAprovacoes, desempenho: telaDesempenho, financeiro: telaFinanceiro,
};

/* Quantos itens desta obra pedem atenção de quem está logado. */
function contadorModulo(id, o, papel) {
  if (!o) return 0;
  if (id === 'pendencias') return pendenciasAbertas(o, papel).length;
  if (id === 'aprovacoes') return aprovacoesPendentes(o, papel).length;
  if (papel !== 'engenheiro') return 0;
  if (id === 'qualidade') return ncsAbertas(o).length;
  if (id === 'materiais') return materiaisEmFalta(o).length;
  if (id === 'compras') return pedidosAtrasados(o).length;
  if (id === 'financeiro') return parcelasAtrasadas(o).length;
  return 0;
}

const TINTA_GRUPO = { 'Acompanhamento': 1, 'Planejamento': 4, 'Execução': 2, 'Suprimentos': 6, 'Gestão': 3 };
const tintaDe = (m) => 'tt' + (TINTA_GRUPO[m.grupo] || 1);

const modulosDe = (papel) => MODULOS.filter(m => m.papeis.includes(papel));

const temaEscolhido = () => localStorage.getItem('spx.tema') || 'auto';

/* Claro, escuro ou o que o aparelho estiver usando. */
function aplicarTema() {
  const escolha = temaEscolhido();
  const escuro = escolha === 'escuro'
    || (escolha === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.tema = escuro ? 'escuro' : 'claro';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', escuro ? '#10141a' : '#f3f4f7');
}

const App = {
  usuario: null,
  obraId: null,

  iniciar() {
    aplicarTema();
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => { if (temaEscolhido() === 'auto') aplicarTema(); });
    DB.carregar();
    this.usuario = DB.sessao();
    if (!this.usuario) return telaLogin();
    this.abrirPortal();
  },

  abrirPortal() {
    const minhas = DB.obras(this.usuario);
    this.obraId = localStorage.getItem('spx.obra');
    if (!minhas.some(o => o.id === this.obraId)) this.obraId = minhas[0]?.id || null;
    montarEstrutura();
    window.addEventListener('hashchange', () => this.rotear());
    this.rotear();
  },

  obra() { return this.obraId ? DB.obra(this.obraId) : null; },

  trocarObra(id) {
    this.obraId = id;
    localStorage.setItem('spx.obra', id);
    this.ir(`#/obra/${id}`);
  },

  ir(hash) {
    if (location.hash === hash) this.rotear();
    else location.hash = hash;
  },

  ehEngenheiro() { return this.usuario.papel === 'engenheiro'; },
  podeEditar() { return this.ehEngenheiro(); },

  sair() { DB.sair(); location.hash = ''; location.reload(); },

  rotear() {
    const partes = (location.hash || '#/painel').replace(/^#\/?/, '').split('/').filter(Boolean);
    const raiz = partes[0] || 'painel';

    if (raiz === 'obra') {
      const obra = DB.obra(partes[1]);
      const minha = obra && DB.obras(this.usuario).some(o => o.id === obra.id);
      if (!minha) { aviso('Obra não encontrada no seu acesso.', 'bad'); return this.ir('#/painel'); }
      this.obraId = obra.id;
      localStorage.setItem('spx.obra', obra.id);

      const rota = partes[2] || '';
      const mod = MODULOS.find(m => m.rota === rota);
      if (mod && !mod.papeis.includes(this.usuario.papel)) {
        aviso('Este módulo é da engenharia.', 'bad');
        return this.ir(`#/obra/${obra.id}`);
      }
      const tela = TELAS[rota];
      if (!tela) return this.ir(`#/obra/${obra.id}`);
      tela(obra, partes[3]);
    } else if (raiz === 'modulos') {
      telaModulos();
    } else if (raiz === 'ajustes') {
      telaAjustes();
    } else {
      telaPainel();
    }

    marcarNav();
    window.scrollTo({ top: 0 });
  },
};

/* ─── tela de entrada ─────────────────────────────────────── */

function telaLogin() {
  const demo = [
    { email: 'eng@spx.com.br', nome: 'Rafael Lima', papel: 'Engenharia' },
    { email: 'arq@spx.com.br', nome: 'Marina Costa', papel: 'Arquitetura' },
    { email: 'cliente@spx.com.br', nome: 'Helena Duarte', papel: 'Cliente' },
  ];

  $('#app').innerHTML = `
  <div class="login">
    <div class="login__side">
      <div class="logo"><span class="logo__mark">SPX</span>
        <span class="logo__txt"><b>SPX Engenharia</b><span>Gestão de obras</span></span></div>
      <div class="login__pitch">
        <h1>A obra inteira<br><em>na palma da mão</em>.</h1>
        <p>Cronograma, custo, equipe, risco, qualidade, segurança, estoque e aprovação
           no mesmo lugar em que a equipe conta o que aconteceu na semana.</p>
        <ul class="login__feats">
          <li>${icone('semana')}<span>Relatório semanal com fotos, efetivo e motivo de atraso</span></li>
          <li>${icone('grafico')}<span>Curva S, índice de prazo e índice de custo</span></li>
          <li>${icone('ok')}<span>Inspeção de serviço, não conformidade e normas NR</span></li>
          <li>${icone('assinar')}<span>Aprovação digital de projeto, aditivo e medição</span></li>
        </ul>
      </div>
      <p style="color:rgba(255,255,255,.4);font-size:12px">SPX Engenharia · obras para escritórios de arquitetura</p>
    </div>

    <div class="login__form">
      <div class="login__box">
        <h2>Entrar</h2>
        <p class="sub">Use o seu e-mail de acesso à obra.</p>
        <div class="login__err" id="erro" hidden></div>
        <form id="formLogin">
          <div class="field"><label for="email">E-mail</label>
            <input class="inp" id="email" type="email" autocomplete="username" inputmode="email" required placeholder="voce@email.com"></div>
          <div class="field"><label for="senha">Senha</label>
            <input class="inp" id="senha" type="password" autocomplete="current-password" required placeholder="••••••"></div>
          <button class="btn btn--dark btn--lg btn--block" type="submit">Entrar ${icone('seta')}</button>
        </form>

        <div class="demo">
          <p class="demo__t">Acessos de demonstração · senha spx123</p>
          <div class="demo__grid">
            ${demo.map(d => `
              <button class="demo__btn" data-email="${d.email}" type="button">
                ${avatar(d.nome, 'me__av')}
                <span><b>${d.nome}</b><span>${d.papel} · ${d.email}</span></span>
              </button>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>`;

  const erro = (msg) => { const el = $('#erro'); el.textContent = msg; el.hidden = !msg; };

  $('#formLogin').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = DB.entrar($('#email').value, $('#senha').value);
    if (!u) return erro('E-mail ou senha não conferem. Confira os acessos de demonstração abaixo.');
    App.usuario = u;
    App.abrirPortal();
  });

  $$('.demo__btn').forEach(b => b.addEventListener('click', () => {
    $('#email').value = b.dataset.email;
    $('#senha').value = 'spx123';
    $('#formLogin').requestSubmit();
  }));
}

/* ─── estrutura ───────────────────────────────────────────── */

function montarEstrutura() {
  $('#app').innerHTML = `
  <div class="shell">
    <aside class="side" id="side">
      <div class="logo"><span class="logo__mark">SPX</span>
        <span class="logo__txt"><b>SPX Engenharia</b><span>Gestão de obras</span></span></div>
      <div class="side__scroll">
        <div id="navObra"></div>
        <nav class="nav" id="navPrincipal"></nav>
      </div>
      <div class="side__foot">
        <div class="me">
          ${avatar(App.usuario.nome, 'me__av')}
          <span class="me__t"><b>${esc(App.usuario.nome)}</b><span>${esc(PAPEIS[App.usuario.papel].rotulo)}</span></span>
          <button class="me__out" id="btnSair" title="Sair" aria-label="Sair">${icone('sair')}</button>
        </div>
      </div>
    </aside>

    <div class="main">
      <header class="top">
        <button class="btn btn--sm btn--ghost" id="btnVoltar" hidden aria-label="Voltar">${icone('volta')}</button>
        <div class="top__t"><h1 id="topoTitulo">Painel</h1><p id="topoSub"></p></div>
        <div id="topoAcoes" style="display:flex;gap:8px;align-items:center"></div>
      </header>
      <main class="view" id="view"></main>
    </div>
  </div>

  <nav class="tabbar" id="tabbar" aria-label="Navegação principal"></nav>`;

  $('#btnSair').addEventListener('click', () =>
    confirmar('Sair do portal', 'Você voltará para a tela de entrada.', () => App.sair(), 'Sair'));
  $('#btnVoltar').addEventListener('click', () => history.back());

  desenharNav();
  desenharTabs();
}

function desenharTabs() {
  const o = App.obra();
  const p = o ? `#/obra/${o.id}` : '#/painel';
  const eng = App.ehEngenheiro();

  const abas = [
    { href: '#/painel', ic: 'painel', txt: 'Início' },
    { href: `${p}/semanas`, ic: 'semana', txt: 'Semanas' },
    { fab: true, ic: 'mais', txt: eng ? 'Registrar' : 'Ações' },
    { href: '#/modulos', ic: 'etapas', txt: 'Módulos' },
    { href: '#/ajustes', ic: 'pessoas', txt: 'Conta' },
  ];

  $('#tabbar').innerHTML = abas.map(a => a.fab
    ? `<button class="tab tab--fab" id="tabFab"><i>${icone(a.ic)}</i><span>${a.txt}</span></button>`
    : `<a class="tab" href="${a.href}" data-tab="${a.href}">${icone(a.ic)}<span>${a.txt}</span></a>`).join('');

  $('#tabFab').addEventListener('click', acoesRapidas);
}

function desenharNav() {
  const minhas = DB.obras(App.usuario);
  const obra = App.obra();
  const papel = App.usuario.papel;

  const alvo = $('#navObra');
  if (obra) {
    alvo.innerHTML = `
      <p class="side__lbl">Obra</p>
      <button class="obra-pick" id="btnObra">
        <span class="obra-pick__i">${esc(iniciais(obra.nome))}</span>
        <span class="obra-pick__t"><b>${esc(obra.nome)}</b><span>${progressoObra(obra)}% executado</span></span>
        ${minhas.length > 1 ? `<svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>` : ''}
      </button>`;
    $('#btnObra').addEventListener('click', () =>
      minhas.length > 1 ? abrirSeletorObra() : App.ir(`#/obra/${obra.id}`));
  } else alvo.innerHTML = '';

  const p = obra ? `#/obra/${obra.id}` : '';
  let html = `<a href="#/painel" data-rota="#/painel">${icone('painel')}<span>${minhas.length > 1 ? 'Todas as obras' : 'Painel'}</span></a>`;

  if (obra) {
    let grupo = '';
    modulosDe(papel).forEach(m => {
      if (m.grupo !== grupo) { grupo = m.grupo; html += `<p class="side__lbl">${esc(grupo)}</p>`; }
      const n = contadorModulo(m.id, obra, papel);
      const href = m.rota ? `${p}/${m.rota}` : p;
      html += `<a href="${href}" data-rota="${href}">${icone(m.icone)}<span>${esc(m.nome)}</span>
        ${n ? `<span class="badge badge--bad">${n}</span>` : ''}</a>`;
    });
  }
  html += `<p class="side__lbl">Conta</p>
    <a href="#/ajustes" data-rota="#/ajustes">${icone('chave')}<span>Ajustes</span></a>`;

  $('#navPrincipal').innerHTML = html;
}

function marcarNav() {
  const atual = location.hash || '#/painel';
  $$('#navPrincipal a').forEach(a => a.classList.toggle('is-on', a.dataset.rota === atual));

  /* telas filhas das semanas mantêm o item aceso */
  if (/\/semana\/|nova-semana/.test(atual)) {
    $$('#navPrincipal a').forEach(a => a.classList.toggle('is-on', a.dataset.rota.endsWith('/semanas')));
  }

  const tabAtiva = atual.startsWith('#/modulos') ? '#/modulos'
    : atual.startsWith('#/ajustes') ? '#/ajustes'
    : /semana/.test(atual) ? 'semanas'
    : atual === '#/painel' ? '#/painel' : '';
  $$('#tabbar .tab[data-tab]').forEach(a => {
    const alvo = a.dataset.tab;
    a.classList.toggle('is-on', tabAtiva === '#/painel' ? alvo === '#/painel'
      : tabAtiva === 'semanas' ? alvo.endsWith('/semanas') : alvo === tabAtiva);
  });

  /* voltar aparece nas telas internas */
  const interna = !['#/painel', '#/modulos', '#/ajustes'].includes(atual);
  $('#btnVoltar').hidden = !interna;
}

function abrirSeletorObra() {
  const minhas = DB.obras(App.usuario);
  modal({
    titulo: 'Trocar de obra',
    corpo: `<div class="grid" style="gap:10px">${minhas.map(o => {
      const s = situacaoObra(o);
      return `<button class="demo__btn" data-obra="${o.id}" type="button">
        <span class="obra-pick__i" style="background:rgba(20,23,26,.06);color:var(--ink)">${esc(iniciais(o.nome))}</span>
        <span style="flex:1;min-width:0"><b>${esc(o.nome)}</b><span>${progressoObra(o)}% executado · ${esc(s.rotulo)}</span></span>
      </button>`;
    }).join('')}</div>`,
    acoes: [{ rotulo: 'Fechar', classe: 'btn--ghost', aoClicar: (_, f) => f() }],
    aoAbrir: (bg, fechar) => $$('[data-obra]', bg).forEach(b =>
      b.addEventListener('click', () => { fechar(); App.trocarObra(b.dataset.obra); })),
  });
}

/* ─── ações rápidas (botão central) ───────────────────────── */

function acoesRapidas() {
  const o = App.obra();
  if (!o) return App.ir('#/painel');
  const eng = App.ehEngenheiro();

  const itens = eng ? [
    { ic: 'semana', nome: 'Relatório da semana', desc: 'O que aconteceu, com fotos', fn: () => App.ir(`#/obra/${o.id}/nova-semana`) },
    { ic: 'ok', nome: 'Inspeção de serviço', desc: 'Ficha de verificação em campo', fn: () => formInspecao(o) },
    { ic: 'dinheiro', nome: 'Lançar custo', desc: 'Nota, folha ou serviço', fn: () => { App.ir(`#/obra/${o.id}/custos`); setTimeout(() => $('#btnCusto')?.click(), 60); } },
    { ic: 'caixa', nome: 'Movimentar estoque', desc: 'Entrada ou saída de material', fn: () => App.ir(`#/obra/${o.id}/materiais`) },
    { ic: 'escudo', nome: 'Registrar DDS', desc: 'Diálogo diário de segurança', fn: () => registrarSSMA(o, 'dds') },
    { ic: 'alerta', nome: 'Abrir pendência', desc: 'Algo travando a obra', fn: () => formPendencia(o) },
    { ic: 'assinar', nome: 'Pedir aprovação', desc: 'Projeto, aditivo ou medição', fn: () => formAprovacao(o) },
  ] : [
    { ic: 'assinar', nome: 'Ver o que espera por mim', desc: 'Aprovações pendentes', fn: () => App.ir(`#/obra/${o.id}/aprovacoes`) },
    { ic: 'alerta', nome: 'Abrir pendência', desc: 'Uma dúvida ou um pedido para a obra', fn: () => formPendencia(o) },
    { ic: 'semana', nome: 'Última semana', desc: 'O que aconteceu na obra', fn: () => App.ir(`#/obra/${o.id}/semanas`) },
    ...(App.usuario.papel === 'arquiteto'
      ? [{ ic: 'doc', nome: 'Publicar revisão', desc: 'Nova revisão de um documento', fn: () => App.ir(`#/obra/${o.id}/documentos`) }]
      : []),
  ];

  modal({
    titulo: eng ? 'O que você quer registrar?' : 'O que você quer fazer?',
    corpo: `<div class="lista">${itens.map((i, n) => linha({
      titulo: esc(i.nome), sub: esc(i.desc), icone: i.ic, acao: 'rap:' + n,
    })).join('')}</div>`,
    acoes: [{ rotulo: 'Fechar', classe: 'btn--ghost', aoClicar: (_, f) => f() }],
    aoAbrir: (bg, fechar) => $$('[data-lin^="rap:"]', bg).forEach(b =>
      b.addEventListener('click', () => { fechar(); itens[Number(b.dataset.lin.slice(4))].fn(); })),
  });
}

/* ─── cabeçalho e desenho da tela ─────────────────────────── */

function topo(titulo, sub = '', acoes = '') {
  $('#topoTitulo').textContent = titulo;
  $('#topoSub').textContent = sub;
  $('#topoAcoes').innerHTML = acoes;
}

function pintar(html) {
  $('#view').innerHTML = html;
  desenharNav();
  desenharTabs();
  $$('#view img[data-fid]').forEach(async el => {
    const src = await Fotos.ler(el.dataset.fid);
    if (src) el.src = src;
  });
}

const imgFoto = (f, alt = '') => f.src
  ? `<img src="${f.src}" alt="${esc(alt || f.cap)}" loading="lazy">`
  : `<img data-fid="${esc(f.id)}" alt="${esc(alt || f.cap)}" loading="lazy">`;

/* ─── grade de módulos ────────────────────────────────────── */

function telaModulos() {
  const o = App.obra();
  if (!o) { topo('Módulos'); return pintar(vazio('Escolha uma obra', 'Os módulos abrem dentro de uma obra.')); }
  const papel = App.usuario.papel;
  const lista = modulosDe(papel);

  topo('Módulos', o.nome);

  let grupo = '';
  let html = '';
  lista.forEach((m, i) => {
    if (m.grupo !== grupo) {
      if (grupo) html += '</div>';
      grupo = m.grupo;
      html += `<p class="mods__g">${esc(grupo)}</p><div class="mods">`;
    }
    const n = contadorModulo(m.id, o, papel);
    html += `
      <a class="mod" href="#/obra/${o.id}${m.rota ? '/' + m.rota : ''}">
        <span class="mod__i ${tintaDe(m)}">${icone(m.icone)}</span>
        <span class="mod__t"><b>${esc(m.nome)}</b><span>${esc(m.desc)}</span></span>
        ${n ? `<span class="badge badge--bad">${n}</span>` : ''}
      </a>`;
    if (i === lista.length - 1) html += '</div>';
  });

  pintar(html);
}

/* ─── painel ──────────────────────────────────────────────── */

function telaPainel() {
  const minhas = DB.obras(App.usuario);
  if (!minhas.length) {
    topo('Painel', 'Nenhuma obra vinculada ao seu acesso');
    return pintar(vazio('Sem obras por aqui', 'Assim que a SPX vincular você a uma obra, ela aparece nesta tela.'));
  }
  if (App.usuario.papel === 'cliente') return painelCliente(minhas);
  if (App.usuario.papel === 'arquiteto') return painelArquiteto(minhas);
  return painelEngenharia(minhas);
}

const saudacao = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
};

/* Cabeçalho com o anel da obra e o essencial do dia. */
function cabecalho(o, linhas = []) {
  const real = o ? progressoObra(o) : 0;
  const s = o ? situacaoObra(o) : null;
  return `
  <div class="hero">
    <div class="hero__t">
      <p class="hero__ola">${saudacao()}, ${esc(App.usuario.nome.split(' ')[0])}</p>
      <h2>${o ? esc(o.nome) : 'Suas obras'}</h2>
      <p class="hero__sub">${linhas[0] || ''}</p>
      <div class="hero__tags">${(linhas[1] || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
    </div>
    ${o ? `<div class="hero__ring">${donut(real, { tamanho: 104, traco: 11, meta: progressoPlanejado(o), situacao: s.chave, rotulo: '' })}</div>` : ''}
  </div>`;
}

/* Quatro atalhos do que a pessoa mais faz no dia a dia. */
function acoesEmBloco(itens) {
  return `<div class="qa">${itens.map((i, n) => `
    <button class="qa__b" data-qa="${n}">
      <span class="qa__i ${i.tinta}">${icone(i.ic)}</span>
      <span>${esc(i.txt)}</span>
    </button>`).join('')}</div>`;
}

function ligarAcoes(itens) {
  $$('[data-qa]').forEach(b => b.addEventListener('click', () => itens[Number(b.dataset.qa)].fn()));
}

function cartaoObra(o) {
  const real = progressoObra(o);
  const plan = progressoPlanejado(o);
  const s = situacaoObra(o);
  const ult = ultimoRelatorio(o);
  return `
  <a class="obra-card" href="#/obra/${o.id}">
    <div class="obra-card__h">
      <div style="flex:1;min-width:0">
        <h3>${esc(o.nome)}</h3>
        <p>${esc(o.tipo)} · ${o.area} m²</p>
      </div>
      ${tagSituacao(s)}
    </div>
    <div class="obra-card__b">
      ${donut(real, { tamanho: 96, traco: 10, meta: plan, situacao: s.chave, rotulo: '' })}
      <div class="obra-card__meta">
        <span class="row"><span>Previsto para hoje</span><b>${plan}%</b></span>
        <span class="row"><span>Prazo</span><b>${fmtData(o.prazo)}</b></span>
        <span class="row"><span>Último relatório</span><b>${ult ? fmtPeriodo(ult.de, ult.ate) : '—'}</b></span>
        <span class="row"><span>Pendências abertas</span><b>${pendenciasAbertas(o).length}</b></span>
      </div>
    </div>
  </a>`;
}

function painelEngenharia(minhas) {
  const semRelatorio = minhas.filter(o => !semanaReportada(o));
  const pendAbertas = minhas.reduce((s, o) => s + pendenciasAbertas(o).length, 0);
  const aprov = minhas.reduce((s, o) => s + aprovacoesPendentes(o).length, 0);
  const ncs = minhas.reduce((s, o) => s + ncsAbertas(o).length, 0);
  const falta = minhas.reduce((s, o) => s + materiaisEmFalta(o).length, 0);
  const atrasadas = minhas.filter(o => situacaoObra(o).chave === 'bad').length;

  topo('Painel da engenharia', `${minhas.length} obra(s) · semana ${numeroSemana(hoje())}`,
    `<a class="btn btn--accent btn--sm" href="#/obra/${(semRelatorio[0] || minhas[0]).id}/nova-semana">${icone('mais')}<span>Relatório</span></a>`);

  const alerta = semRelatorio.length ? `
    <div class="card" style="border-color:rgba(217,119,6,.35);background:var(--warn-soft);margin-bottom:16px">
      <div class="card__head" style="margin-bottom:10px">${icone('alerta')}<h2 style="color:#7a4600">Relatório da semana em aberto</h2></div>
      <p style="font-size:13.5px;color:#7a4600;margin-bottom:12px">
        ${semRelatorio.length === 1 ? 'Uma obra ainda não teve' : `${semRelatorio.length} obras ainda não tiveram`}
        o relatório de ${fmtPeriodo(segundaDa(hoje()), maisDias(segundaDa(hoje()), 5))} lançado.
      </p>
      <div class="chips">${semRelatorio.map(o =>
        `<a class="chip" href="#/obra/${o.id}/nova-semana">${icone('mais')}${esc(o.nome)}</a>`).join('')}</div>
    </div>` : '';

  const o = App.obra() || minhas[0];
  const rapidas = [
    { ic: 'semana', txt: 'Relatório', tinta: 'tt1', fn: () => App.ir(`#/obra/${o.id}/nova-semana`) },
    { ic: 'ok', txt: 'Inspeção', tinta: 'tt2', fn: () => formInspecao(o) },
    { ic: 'dinheiro', txt: 'Valores', tinta: 'tt3', fn: () => App.ir(`#/obra/${o.id}/financeiro`) },
    { ic: 'caixa', txt: 'Estoque', tinta: 'tt6', fn: () => App.ir(`#/obra/${o.id}/materiais`) },
  ];

  pintar(`
    ${cabecalho(o, [`Semana ${numeroSemana(hoje())} · ${minhas.length} obra(s) em acompanhamento`,
      [`${progressoObra(o)}% executado`, `${aprov} aprovação(ões) pendente(s)`]])}
    ${acoesEmBloco(rapidas)}
    ${alerta}
    <div class="grid g-4">
      ${kpi('Obras ativas', minhas.length, `${atrasadas} com atraso relevante`)}
      ${kpi('Relatórios a lançar', semRelatorio.length, semRelatorio.length ? 'referentes a esta semana' : 'semana em dia')}
      ${kpi('Aprovações pendentes', aprov, 'com cliente, arquiteto ou engenharia')}
      ${kpi('Não conformidades', ncs, ncs ? 'aguardando correção' : 'nenhuma aberta')}
    </div>

    <div class="sec-t"><h2>Obras</h2></div>
    <div class="grid g-3">${minhas.map(cartaoObra).join('')}</div>

    ${(pendAbertas || falta) ? `
    <div class="sec-t"><h2>Precisa de você</h2></div>
    <div class="grid g-2">
      ${pendAbertas ? `<a class="lin" href="#/obra/${App.obraId}/pendencias">
        <span class="lin__i">${icone('balao')}</span>
        <span class="lin__t"><b>${pendAbertas} pendência(s) aberta(s)</b><span>Cobrança de definição do cliente ou do arquiteto</span></span>
      </a>` : ''}
      ${falta ? `<a class="lin" href="#/obra/${App.obraId}/materiais">
        <span class="lin__i">${icone('caixa')}</span>
        <span class="lin__t"><b>${falta} item(ns) abaixo do mínimo</b><span>Repor antes que a frente de serviço pare</span></span>
      </a>` : ''}
    </div>` : ''}

    <div class="sec-t"><h2>Últimas semanas relatadas</h2></div>
    <div class="grid">${feedRelatorios(minhas, 3)}</div>
  `);

  ligarAcoes(rapidas);
}

function painelArquiteto(minhas) {
  const paraMim = minhas.flatMap(o => pendenciasAbertas(o, 'arquiteto').map(p => ({ ...p, obra: o })));
  const aprovar = minhas.flatMap(o => aprovacoesPendentes(o, 'arquiteto').map(a => ({ ...a, obra: o })));
  const atrasoProjeto = minhas.reduce((s, o) => s + atrasosPorMotivo(o)
    .filter(m => ['projeto', 'detalhe'].includes(m.motivo)).reduce((t, m) => t + m.dias, 0), 0);

  topo('Painel da arquitetura', `${minhas.length} obra(s) acompanhada(s)`);

  const o = App.obra() || minhas[0];

  pintar(`
    ${cabecalho(o, [`Semana ${numeroSemana(hoje())} · ${minhas.length} obra(s) acompanhada(s)`,
      [`${progressoObra(o)}% executado`, `${aprovar.length} decisão(ões) com você`]])}
    <div class="grid g-4">
      ${kpi('Obras acompanhadas', minhas.length)}
      ${kpi('Pendências com você', paraMim.length, paraMim.length ? 'a obra está esperando' : 'nada em aberto')}
      ${kpi('Aprovações com você', aprovar.length, aprovar.length ? 'decisão pendente' : 'nada pendente')}
      ${kpi('Atraso por projeto', atrasoProjeto + ' dias', 'alteração ou detalhamento')}
    </div>

    ${aprovar.length ? `
      <div class="sec-t"><h2>Esperando a sua decisão</h2></div>
      <div class="lista">${aprovar.map(a => linha({
        titulo: esc(a.titulo), sub: `${esc(a.obra.nome)} · ${aprovacaoRotulo(a.tipo)} · até ${fmtData(a.prazo)}`,
        icone: 'assinar', acao: 'ap:' + a.obra.id,
      })).join('')}</div>` : ''}

    ${paraMim.length ? `
      <div class="sec-t"><h2>Pendências de projeto</h2></div>
      <div class="grid" style="gap:10px">${paraMim.map(p => cartaoPendencia(p, p.obra)).join('')}</div>` : ''}

    <div class="sec-t"><h2>Obras</h2></div>
    <div class="grid g-3">${minhas.map(cartaoObra).join('')}</div>

    <div class="sec-t"><h2>O que aconteceu nas obras</h2></div>
    <div class="grid">${feedRelatorios(minhas, 3)}</div>
  `);

  $$('[data-lin^="ap:"]').forEach(b => b.addEventListener('click', () =>
    App.ir(`#/obra/${b.dataset.lin.slice(3)}/aprovacoes`)));
}

function painelCliente(minhas) {
  const o = App.obra() && minhas.some(x => x.id === App.obraId) ? App.obra() : minhas[0];
  App.obraId = o.id;
  const real = progressoObra(o);
  const plan = progressoPlanejado(o);
  const s = situacaoObra(o);
  const ult = ultimoRelatorio(o);
  const minhasPend = pendenciasAbertas(o, 'cliente');
  const minhasAprov = aprovacoesPendentes(o, 'cliente');
  const emAndamento = o.etapas.filter(e => e.progresso > 0 && e.progresso < 100);
  const proxima = o.etapas.find(e => e.progresso === 0);

  const parcela = proximaParcela(o);
  const rapidas = [
    { ic: 'semana', txt: 'Semanas', tinta: 'tt1', fn: () => App.ir(`#/obra/${o.id}/semanas`) },
    { ic: 'fotos', txt: 'Fotos', tinta: 'tt2', fn: () => App.ir(`#/obra/${o.id}/fotos`) },
    { ic: 'dinheiro', txt: 'Valores', tinta: 'tt3', fn: () => App.ir(`#/obra/${o.id}/financeiro`) },
    { ic: 'assinar', txt: 'Aprovar', tinta: 'tt5', fn: () => App.ir(`#/obra/${o.id}/aprovacoes`) },
  ];

  topo('A sua obra', esc(o.nome));

  pintar(`
    ${cabecalho(o, [`${esc(o.tipo)} · entrega prevista em ${fmtData(o.prazo, true)}`,
      [`${real}% concluído`, s.rotulo, `${diasAtrasoAcumulados(o)} dia(s) de atraso`]])}
    ${acoesEmBloco(rapidas)}
    <div class="split">
      <div>
        <div class="card">
          <div class="card__head"><h2>${esc(o.nome)}</h2>${tagSituacao(s)}</div>
          <div class="donut-wrap">
            ${donut(real, { tamanho: 168, traco: 16, meta: plan, situacao: s.chave, rotulo: 'concluído' })}
            <div class="donut-legend">
              <span class="li"><span class="key"></span><span>Executado até hoje: <b>${real}%</b></span></span>
              <span class="li"><span class="key key--meta"></span><span>Previsto no cronograma: <b>${plan}%</b></span></span>
              <span class="li">${icone('semana')}<span>Entrega prevista: <b>${fmtData(o.prazo, true)}</b></span></span>
              <span class="li">${icone('relogio')}<span>Atrasos registrados: <b>${diasAtrasoAcumulados(o)} dia(s)</b></span></span>
            </div>
          </div>
        </div>

        ${minhasAprov.length ? `
          <div class="sec-t"><h2>Esperando a sua aprovação</h2><span class="tag tag--bad">${minhasAprov.length}</span></div>
          <div class="lista">${minhasAprov.map(a => linha({
            titulo: esc(a.titulo),
            sub: `${aprovacaoRotulo(a.tipo)}${a.valor ? ' · ' + moeda(a.valor) : ''} · decisão até ${fmtData(a.prazo)}`,
            icone: 'assinar', acao: 'apc',
          })).join('')}</div>` : ''}

        ${ult ? `
        <div class="sec-t"><h2>O que aconteceu nesta semana</h2>
          <a class="btn btn--sm" href="#/obra/${o.id}/semanas">Ver todas ${icone('seta')}</a></div>
        ${cartaoRelatorio(o, ult, true)}` : vazio('Ainda sem relatório', 'A engenharia ainda não publicou a primeira semana desta obra.')}
      </div>

      <div>
        ${minhasPend.length ? `
          <div class="card" style="border-color:rgba(217,119,6,.4);background:var(--warn-soft);margin-bottom:16px">
            <div class="card__head" style="margin-bottom:10px">${icone('alerta')}<h3 style="color:#7a4600">Precisamos de você</h3></div>
            <div class="grid" style="gap:10px">${minhasPend.map(p => `
              <a href="#/obra/${o.id}/pendencias" style="display:block;background:var(--surface);border-radius:12px;padding:12px">
                <b style="font-size:13.5px;display:block;margin-bottom:3px">${esc(p.titulo)}</b>
                <span style="font-size:12.5px;color:var(--muted)">Resposta esperada até ${fmtData(p.prazo)}</span>
              </a>`).join('')}</div>
          </div>` : ''}

        <div class="card" style="margin-bottom:16px">
          <div class="card__head"><h3>Em execução agora</h3></div>
          ${emAndamento.length
            ? emAndamento.map(e => linhaEtapa(e)).join('')
            : '<p class="hint">Nenhuma etapa em execução no momento.</p>'}
          ${proxima ? `<p class="hint" style="margin-top:12px">A próxima etapa a começar é <b>${esc(proxima.nome)}</b>, prevista para ${fmtData(proxima.inicio)}.</p>` : ''}
        </div>

        ${parcela ? `
        <div class="card" style="margin-bottom:16px">
          <div class="card__head" style="margin-bottom:8px">${icone('dinheiro')}<h3>Próximo pagamento</h3>
            <span class="tag tag--${parcela.status === 'atrasado' ? 'bad' : 'info'}">${parcela.status === 'atrasado' ? 'Atrasada' : 'Em aberto'}</span></div>
          <p style="font-size:21px;font-weight:600;letter-spacing:-.03em">${moeda(parcela.valor)}</p>
          <p class="hint">${esc(parcela.descricao)} · vence em ${fmtData(parcela.vencimento, true)}</p>
          <a class="btn btn--sm btn--block" href="#/obra/${o.id}/financeiro" style="margin-top:12px">Ver todos os valores</a>
        </div>` : ''}

        <div class="card">
          <div class="card__head"><h3>Sua obra em números</h3></div>
          <div class="obra-card__meta">
            <span class="row"><span>Endereço</span><b style="text-align:right">${esc(o.endereco)}</b></span>
            <span class="row"><span>Área</span><b>${o.area} m²</b></span>
            <span class="row"><span>Início</span><b>${fmtData(o.inicio)}</b></span>
            <span class="row"><span>Arquitetura</span><b>${esc(DB.nome(o.arquiteto_id))}</b></span>
            <span class="row"><span>Engenharia</span><b>${esc(DB.nome(o.engenheiro_id))}</b></span>
            <span class="row"><span>Semanas relatadas</span><b>${o.relatorios.length}</b></span>
          </div>
        </div>
      </div>
    </div>`);

  $$('[data-lin="apc"]').forEach(b => b.addEventListener('click', () => App.ir(`#/obra/${o.id}/aprovacoes`)));
  ligarAcoes(rapidas);
}

function feedRelatorios(obras, limite = 5) {
  const todos = obras.flatMap(o => o.relatorios.map(r => ({ r, o })))
    .sort((a, b) => (a.r.de < b.r.de ? 1 : -1)).slice(0, limite);
  if (!todos.length) return vazio('Nenhum relatório ainda', 'As semanas relatadas pela engenharia aparecem aqui.');
  return `<div class="tl">${todos.map(({ r, o }) => `
    <div class="rel">
      <span class="rel__dot ${(r.atrasos || []).length ? 'is-bad' : 'is-ok'}"><i></i></span>
      ${cartaoRelatorio(o, r, false, true)}
    </div>`).join('')}</div>`;
}

/* ─── visão geral da obra ─────────────────────────────────── */

function telaObra(o) {
  const real = progressoObra(o);
  const plan = progressoPlanejado(o);
  const s = situacaoObra(o);
  const ult = ultimoRelatorio(o);
  const motivos = atrasosPorMotivo(o);
  const pend = pendenciasAbertas(o);
  const restam = difDias(hoje(), o.prazo);
  const eng = App.ehEngenheiro();
  const papel = App.usuario.papel;

  topo(o.nome, `${o.tipo} · ${o.endereco}`,
    eng ? `<a class="btn btn--accent btn--sm" href="#/obra/${o.id}/nova-semana">${icone('mais')}<span>Relatório</span></a>` : '');

  const atalhos = modulosDe(papel).filter(m => ['cronograma', 'custos', 'qualidade', 'aprovacoes', 'desempenho', 'materiais'].includes(m.id));

  pintar(`
    <div class="split">
      <div>
        <div class="card">
          <div class="card__head"><h2>Andamento da obra</h2>${tagSituacao(s)}</div>
          <div class="donut-wrap">
            ${donut(real, { tamanho: 160, traco: 15, meta: plan, situacao: s.chave, rotulo: 'executado' })}
            <div class="donut-legend">
              <span class="li"><span class="key"></span><span>Executado: <b>${real}%</b></span></span>
              <span class="li"><span class="key key--meta"></span><span>Previsto para hoje: <b>${plan}%</b></span></span>
              <span class="li">${icone('grafico')}<span>Diferença: <b style="color:var(--${s.chave})">${s.dif > 0 ? '+' : ''}${s.dif} p.p.</b></span></span>
              <span class="li">${icone('relogio')}<span>${restam >= 0 ? `Faltam <b>${restam} dias</b> para o prazo` : `Prazo vencido há <b>${-restam} dias</b>`}</span></span>
            </div>
          </div>
        </div>

        <div class="grid g-3" style="margin-top:16px">
          ${kpi('Semanas relatadas', o.relatorios.length, ult ? `última: ${fmtPeriodo(ult.de, ult.ate)}` : 'nenhuma ainda')}
          ${kpi('Dias de atraso', diasAtrasoAcumulados(o), 'somados desde o início')}
          ${kpi(eng ? 'Custo realizado' : 'Pendências abertas', eng ? moeda(custoRealizado(o)) : pend.length,
            eng ? `${Math.round((custoRealizado(o) / (o.custo_direto || 1)) * 100)}% do orçamento` : 'veja a aba pendências')}
        </div>

        <div class="sec-t"><h2>Atalhos</h2></div>
        <div class="mods">
          ${atalhos.map(m => {
            const n = contadorModulo(m.id, o, papel);
            return `<a class="mod" href="#/obra/${o.id}/${m.rota}">
              <span class="mod__i ${tintaDe(m)}">${icone(m.icone)}</span>
              <span class="mod__t"><b>${esc(m.nome)}</b><span>${esc(m.desc)}</span></span>
              ${n ? `<span class="badge badge--bad">${n}</span>` : ''}</a>`;
          }).join('')}
        </div>

        <div class="sec-t"><h2>Últimas semanas</h2>
          <a class="btn btn--sm" href="#/obra/${o.id}/semanas">Ver todas ${icone('seta')}</a></div>
        ${o.relatorios.length
          ? `<div class="tl">${relatoriosOrdenados(o).slice(0, 2).map(r => `
              <div class="rel"><span class="rel__dot ${(r.atrasos || []).length ? 'is-bad' : 'is-ok'}"><i></i></span>
              ${cartaoRelatorio(o, r)}</div>`).join('')}</div>`
          : vazio('Nenhuma semana relatada', 'O primeiro relatório semanal aparece aqui assim que for lançado.',
              eng ? `<a class="btn btn--dark" href="#/obra/${o.id}/nova-semana">${icone('mais')}Lançar a primeira semana</a>` : '')}
      </div>

      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card__head"><h3>Etapas</h3>
            <a class="btn btn--sm btn--ghost" href="#/obra/${o.id}/cronograma">Detalhar</a></div>
          ${o.etapas.slice(0, 6).map(e => linhaEtapa(e)).join('')}
          <p class="hint" style="margin-top:12px">${o.etapas.filter(e => e.progresso === 100).length} de ${o.etapas.length} etapas concluídas.</p>
        </div>

        <div class="card" style="margin-bottom:16px">
          <div class="card__head"><h3>Por que a obra atrasou</h3></div>
          ${motivos.length
            ? barras(motivos.map(m => ({ rotulo: m.rotulo, valor: m.dias, cor: '#a51c1c' })), { formato: (v) => v + 'd' })
            : '<p class="hint">Nenhum dia de atraso registrado até aqui.</p>'}
        </div>

        <div class="card">
          <div class="card__head"><h3>Contrato</h3></div>
          <div class="obra-card__meta">
            <span class="row"><span>Cliente</span><b>${esc(DB.nome(o.cliente_id))}</b></span>
            <span class="row"><span>Arquitetura</span><b>${esc(DB.nome(o.arquiteto_id))}</b></span>
            <span class="row"><span>Engenharia</span><b>${esc(DB.nome(o.engenheiro_id))}</b></span>
            <span class="row"><span>Início</span><b>${fmtData(o.inicio)}</b></span>
            <span class="row"><span>Prazo</span><b>${fmtData(o.prazo)}</b></span>
            ${papel !== 'arquiteto' ? `<span class="row"><span>Valor</span><b>${moeda(o.valor)}</b></span>` : ''}
          </div>
        </div>
      </div>
    </div>`);
}

/* ─── ajustes ─────────────────────────────────────────────── */

function telaAjustes() {
  topo('Conta', 'Seus dados e os dados do portal');
  pintar(`
    <div class="card" style="max-width:640px">
      <div class="card__head">${avatar(App.usuario.nome, 'me__av')}<h2>${esc(App.usuario.nome)}</h2></div>
      <div class="obra-card__meta" style="font-size:13.5px">
        <span class="row"><span>E-mail</span><b>${esc(App.usuario.email)}</b></span>
        <span class="row"><span>Perfil</span><b>${esc(PAPEIS[App.usuario.papel].rotulo)}</b></span>
        <span class="row"><span>Função</span><b style="text-align:right">${esc(App.usuario.cargo || '—')}</b></span>
        <span class="row"><span>Obras no seu acesso</span><b>${DB.obras(App.usuario).length}</b></span>
      </div>
      <button class="btn btn--block" id="btnSair2" style="margin-top:16px">${icone('sair')}Sair do portal</button>
    </div>

    <div class="card" style="max-width:640px;margin-top:16px">
      <div class="card__head">${icone('raio')}<h2>Aparência</h2></div>
      <div class="temas" id="temas">
        ${[
          { id: 'claro', nome: 'Claro', a: '#f3f4f7', b: '#fff', c: '#f59f0b' },
          { id: 'escuro', nome: 'Escuro', a: '#10141a', b: '#181c22', c: '#f5b02e' },
          { id: 'auto', nome: 'Do aparelho', a: '#f3f4f7', b: '#181c22', c: '#f59f0b' },
        ].map(t => `
          <button class="tema ${temaEscolhido() === t.id ? 'is-on' : ''}" data-tema="${t.id}" type="button">
            <span class="tema__p"><i style="background:${t.a}"></i><i style="background:${t.b}"></i><i style="background:${t.c}"></i></span>
            ${t.nome}
          </button>`).join('')}
      </div>
      <p class="hint" style="margin-top:12px">O tema escuro ajuda em obra à noite e economiza bateria.</p>
    </div>

    <div class="card" style="max-width:640px;margin-top:16px">
      <div class="card__head">${icone('chave')}<h2>Dados do portal</h2></div>
      <p class="hint" style="margin:0 0 14px">
        Este portal guarda tudo no próprio navegador: os registros no armazenamento local
        e as fotos no banco interno do navegador. Nada é enviado para fora deste aparelho,
        então cada pessoa vê apenas o que lançou aqui. Limpar os dados devolve o portal ao
        conteúdo de demonstração.
      </p>
      <button class="btn btn--bad" id="btnZerar">${icone('lixo')}Limpar dados e recomeçar</button>
    </div>`);

  $$('#temas [data-tema]').forEach(b => b.addEventListener('click', () => {
    localStorage.setItem('spx.tema', b.dataset.tema);
    aplicarTema();
    telaAjustes();
  }));

  $('#btnSair2').addEventListener('click', () =>
    confirmar('Sair do portal', 'Você voltará para a tela de entrada.', () => App.sair(), 'Sair'));
  $('#btnZerar').addEventListener('click', () => confirmar(
    'Limpar todos os dados',
    'Os relatórios, fotos e registros lançados neste navegador serão apagados e o portal volta ao conteúdo de demonstração.',
    () => { DB.zerar(); location.hash = ''; location.reload(); },
    'Limpar tudo'));
}

document.addEventListener('DOMContentLoaded', () => App.iniciar());
