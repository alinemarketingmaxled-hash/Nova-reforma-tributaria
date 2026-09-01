/* ============================================================
   SPX · aplicação: login, estrutura, rotas e painéis
   ============================================================ */

const App = {
  usuario: null,
  obraId: null,

  iniciar() {
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

  /* Só a engenharia lança e edita o andamento; os demais leem e comentam. */
  podeEditar() { return this.ehEngenheiro(); },

  sair() {
    DB.sair();
    location.hash = '';
    location.reload();
  },

  rotear() {
    const partes = (location.hash || '#/painel').replace(/^#\/?/, '').split('/').filter(Boolean);
    const raiz = partes[0] || 'painel';

    if (raiz === 'obra') {
      const obra = DB.obra(partes[1]);
      const permitida = obra && DB.obras(this.usuario).some(o => o.id === obra.id);
      if (!permitida) { aviso('Obra não encontrada no seu acesso.', 'bad'); return this.ir('#/painel'); }
      this.obraId = obra.id;
      localStorage.setItem('spx.obra', obra.id);

      const aba = partes[2] || 'geral';
      const telas = {
        geral: () => telaObra(obra),
        semanas: () => telaSemanas(obra),
        semana: () => telaSemana(obra, partes[3]),
        'nova-semana': () => telaFormSemana(obra, partes[3] || null),
        etapas: () => telaEtapas(obra),
        fotos: () => telaFotos(obra),
        pendencias: () => telaPendencias(obra),
        equipe: () => telaEquipe(obra),
      };
      (telas[aba] || telas.geral)();
    } else if (raiz === 'ajustes') {
      telaAjustes();
    } else {
      telaPainel();
    }

    marcarNav();
    window.scrollTo({ top: 0 });
    fecharMenu();
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
        <span class="logo__txt"><b>SPX Engenharia</b><span>Portal de obras</span></span></div>
      <div class="login__pitch">
        <h1>A obra da semana,<br><em>contada por inteiro</em>.</h1>
        <p>Um lugar só para a engenharia lançar o que andou, o arquiteto responder o que trava
           e o cliente ver o quanto já foi feito, com foto e com o motivo de cada atraso.</p>
        <ul class="login__feats">
          <li>${icone('semana')}<span>Relatório semanal com fotos, efetivo e clima</span></li>
          <li>${icone('grafico')}<span>Percentual executado comparado ao cronograma</span></li>
          <li>${icone('pendencia')}<span>Motivo e responsável de cada dia de atraso</span></li>
          <li>${icone('equipe')}<span>Uma visão para o cliente, uma para o arquiteto, uma para a engenharia</span></li>
        </ul>
      </div>
      <p style="color:rgba(255,255,255,.4);font-size:12px">SPX Engenharia · acompanhamento de obras para escritórios de arquitetura</p>
    </div>

    <div class="login__form">
      <div class="login__box">
        <h2>Entrar</h2>
        <p class="sub">Use o seu e-mail de acesso à obra.</p>
        <div class="login__err" id="erro" hidden></div>
        <form id="formLogin">
          <div class="field"><label for="email">E-mail</label>
            <input class="inp" id="email" type="email" autocomplete="username" required placeholder="voce@email.com"></div>
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

  const erro = (msg) => {
    const el = $('#erro');
    el.textContent = msg;
    el.hidden = !msg;
  };

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

/* ─── estrutura (menu lateral + topo) ─────────────────────── */

function montarEstrutura() {
  $('#app').innerHTML = `
  <div class="shell">
    <aside class="side" id="side">
      <div class="logo"><span class="logo__mark">SPX</span>
        <span class="logo__txt"><b>SPX Engenharia</b><span>Portal de obras</span></span></div>
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
        <button class="burger" id="btnMenu" aria-label="Abrir menu">${icone('etapas')}</button>
        <div class="top__t"><h1 id="topoTitulo">Painel</h1><p id="topoSub"></p></div>
        <div id="topoAcoes" style="display:flex;gap:8px;align-items:center"></div>
      </header>
      <main class="view" id="view"></main>
    </div>
  </div>`;

  $('#btnSair').addEventListener('click', () => confirmar('Sair do portal', 'Você voltará para a tela de entrada.', () => App.sair(), 'Sair'));
  $('#btnMenu').addEventListener('click', abrirMenu);

  desenharNav();
}

function abrirMenu() {
  $('#side').classList.add('is-open');
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  scrim.addEventListener('click', fecharMenu);
  document.body.appendChild(scrim);
}
function fecharMenu() {
  $('#side')?.classList.remove('is-open');
  $('.scrim')?.remove();
}

function desenharNav() {
  const minhas = DB.obras(App.usuario);
  const obra = App.obra();

  /* seletor de obra */
  const alvo = $('#navObra');
  if (obra) {
    alvo.innerHTML = `
      <p class="side__lbl">Obra</p>
      <button class="obra-pick" id="btnObra">
        <span class="obra-pick__i">${esc(iniciais(obra.nome))}</span>
        <span class="obra-pick__t"><b>${esc(obra.nome)}</b><span>${progressoObra(obra)}% executado</span></span>
        ${minhas.length > 1 ? `<svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>` : ''}
      </button>`;
    if (minhas.length > 1) $('#btnObra').addEventListener('click', abrirSeletorObra);
    else $('#btnObra').addEventListener('click', () => App.ir(`#/obra/${obra.id}`));
  } else {
    alvo.innerHTML = '';
  }

  const p = obra ? `#/obra/${obra.id}` : '';
  const pendMinhas = obra ? pendenciasAbertas(obra, App.usuario.papel).length : 0;

  const itens = [
    { href: '#/painel', icone: 'painel', rotulo: minhas.length > 1 ? 'Todas as obras' : 'Painel' },
  ];

  if (obra) {
    itens.push(
      { href: p, icone: 'obra', rotulo: 'Visão geral', sep: 'Acompanhamento' },
      { href: `${p}/semanas`, icone: 'semana', rotulo: 'Semanas' },
      { href: `${p}/etapas`, icone: 'etapas', rotulo: 'Etapas e cronograma' },
      { href: `${p}/fotos`, icone: 'fotos', rotulo: 'Fotos' },
      { href: `${p}/pendencias`, icone: 'pendencia', rotulo: 'Pendências', badge: pendMinhas },
      { href: `${p}/equipe`, icone: 'equipe', rotulo: 'Equipe e contrato' },
    );
  }
  itens.push({ href: '#/ajustes', icone: 'chave', rotulo: 'Ajustes', sep: 'Conta' });

  $('#navPrincipal').innerHTML = itens.map(i => `
    ${i.sep ? `<p class="side__lbl">${esc(i.sep)}</p>` : ''}
    <a href="${i.href}" data-rota="${i.href}">
      ${icone(i.icone)}<span>${esc(i.rotulo)}</span>
      ${i.badge ? `<span class="badge badge--bad">${i.badge}</span>` : ''}
    </a>`).join('');
}

function marcarNav() {
  const atual = location.hash || '#/painel';
  $$('#navPrincipal a').forEach(a => {
    const r = a.dataset.rota;
    const ativo = r === atual || (r !== '#/painel' && r.split('/').length > 2 && atual.startsWith(r));
    a.classList.toggle('is-on', ativo);
  });
  /* rotas filhas de "semanas" mantêm o item aceso */
  if (/\/semana(\/|$)|nova-semana/.test(atual)) {
    $$('#navPrincipal a').forEach(a => a.classList.toggle('is-on', a.dataset.rota.endsWith('/semanas')));
  }
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

/* ─── cabeçalho da área de conteúdo ───────────────────────── */

function topo(titulo, sub = '', acoes = '') {
  $('#topoTitulo').textContent = titulo;
  $('#topoSub').textContent = sub;
  $('#topoAcoes').innerHTML = acoes;
}

/* Desenha a tela e recarrega as fotos guardadas no navegador. */
function pintar(html) {
  $('#view').innerHTML = html;
  desenharNav();
  $$('#view img[data-fid]').forEach(async el => {
    const src = await Fotos.ler(el.dataset.fid);
    if (src) el.src = src;
    else el.closest('.foto,.up')?.classList.add('is-vazia');
  });
}

const imgFoto = (f, alt = '') => f.src
  ? `<img src="${f.src}" alt="${esc(alt || f.cap)}" loading="lazy">`
  : `<img data-fid="${esc(f.id)}" alt="${esc(alt || f.cap)}" loading="lazy">`;

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

/* cartão de obra usado nos painéis */
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
  const atrasoTotal = minhas.reduce((s, o) => s + diasAtrasoAcumulados(o), 0);
  const atrasadas = minhas.filter(o => situacaoObra(o).chave === 'bad').length;

  topo('Painel da engenharia', `${minhas.length} obra(s) em acompanhamento · semana ${numeroSemana(hoje())}`,
    minhas.length ? `<a class="btn btn--accent" href="#/obra/${(semRelatorio[0] || minhas[0]).id}/nova-semana">${icone('mais')}<span>Relatório da semana</span></a>` : '');

  const alerta = semRelatorio.length ? `
    <div class="card" style="border-color:rgba(217,119,6,.35);background:var(--warn-soft)">
      <div class="card__head" style="margin-bottom:10px">
        ${icone('alerta', 'i')}<h2 style="color:#7a4600">Relatório da semana em aberto</h2>
      </div>
      <p style="font-size:13.5px;color:#7a4600;margin-bottom:12px">
        ${semRelatorio.length === 1 ? 'Uma obra ainda não teve' : `${semRelatorio.length} obras ainda não tiveram`}
        o relatório da semana de ${fmtPeriodo(segundaDa(hoje()), maisDias(segundaDa(hoje()), 5))} lançado.
      </p>
      <div class="chips">${semRelatorio.map(o =>
        `<a class="chip" href="#/obra/${o.id}/nova-semana">${icone('mais')}${esc(o.nome)}</a>`).join('')}</div>
    </div>` : '';

  pintar(`
    ${alerta}
    <div class="grid g-4" style="margin-top:${alerta ? '16px' : '0'}">
      ${kpi('Obras ativas', minhas.length, `${atrasadas} com atraso relevante`)}
      ${kpi('Relatórios a lançar', semRelatorio.length, semRelatorio.length ? 'referentes a esta semana' : 'semana em dia')}
      ${kpi('Pendências abertas', pendAbertas, 'aguardando cliente ou arquiteto')}
      ${kpi('Dias de atraso registrados', atrasoTotal, 'somando todas as obras')}
    </div>

    <div class="sec-t" style="margin-top:26px"><h2>Obras</h2></div>
    <div class="grid g-3">${minhas.map(cartaoObra).join('')}</div>

    <div class="sec-t"><h2>Últimas semanas relatadas</h2></div>
    <div class="grid">${feedRelatorios(minhas, 4)}</div>
  `);
}

function painelArquiteto(minhas) {
  const paraMim = minhas.flatMap(o => pendenciasAbertas(o, 'arquiteto').map(p => ({ ...p, obra: o })));
  const atrasoProjeto = minhas.reduce((s, o) => s + atrasosPorMotivo(o)
    .filter(m => ['projeto', 'detalhe'].includes(m.motivo)).reduce((t, m) => t + m.dias, 0), 0);

  topo('Painel da arquitetura', `${minhas.length} obra(s) acompanhada(s)`);

  pintar(`
    <div class="grid g-4">
      ${kpi('Obras acompanhadas', minhas.length)}
      ${kpi('Pendências com você', paraMim.length, paraMim.length ? 'a engenharia está esperando' : 'nada em aberto')}
      ${kpi('Dias de atraso por projeto', atrasoProjeto, 'alteração ou detalhamento')}
      ${kpi('Semana', numeroSemana(hoje()), fmtPeriodo(segundaDa(hoje()), maisDias(segundaDa(hoje()), 5)))}
    </div>

    ${paraMim.length ? `
      <div class="sec-t"><h2>Esperando a sua resposta</h2></div>
      <div class="grid" style="gap:10px">${paraMim.map(p => cartaoPendencia(p, p.obra)).join('')}</div>` : ''}

    <div class="sec-t"><h2>Obras</h2></div>
    <div class="grid g-3">${minhas.map(cartaoObra).join('')}</div>

    <div class="sec-t"><h2>O que aconteceu nas obras</h2></div>
    <div class="grid">${feedRelatorios(minhas, 5)}</div>
  `);
}

function painelCliente(minhas) {
  const o = App.obra() && minhas.some(x => x.id === App.obraId) ? App.obra() : minhas[0];
  App.obraId = o.id;
  const real = progressoObra(o);
  const plan = progressoPlanejado(o);
  const s = situacaoObra(o);
  const ult = ultimoRelatorio(o);
  const minhasPend = pendenciasAbertas(o, 'cliente');
  const emAndamento = o.etapas.filter(e => e.progresso > 0 && e.progresso < 100);
  const proxima = o.etapas.find(e => e.progresso === 0);

  topo('A sua obra', esc(o.nome));

  pintar(`
    <div class="split">
      <div>
        <div class="card">
          <div class="card__head"><h2>${esc(o.nome)}</h2>${tagSituacao(s)}</div>
          <div class="donut-wrap">
            ${donut(real, { tamanho: 168, traco: 16, meta: plan, situacao: s.chave, rotulo: 'concluído' })}
            <div class="donut-legend">
              <span class="li"><span class="key"></span><span>Executado até hoje: <b>${real}%</b></span></span>
              <span class="li"><span class="key key--meta"></span><span>Previsto no cronograma: <b>${plan}%</b></span></span>
              <span class="li">${icone('semana', 'i')}<span>Entrega prevista: <b>${fmtData(o.prazo, true)}</b></span></span>
              <span class="li">${icone('relogio', 'i')}<span>Atrasos registrados: <b>${diasAtrasoAcumulados(o)} dia(s)</b></span></span>
            </div>
          </div>
        </div>

        ${ult ? `
        <div class="sec-t"><h2>O que aconteceu nesta semana</h2>
          <a class="btn btn--sm" href="#/obra/${o.id}/semanas">Ver todas as semanas ${icone('seta')}</a></div>
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

        <div class="card">
          <div class="card__head"><h3>Sua obra em números</h3></div>
          <div class="grid" style="gap:12px">
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
      </div>
    </div>`);
}

/* últimos relatórios de várias obras */
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
  const maxDias = Math.max(1, ...motivos.map(m => m.dias));
  const pend = pendenciasAbertas(o);
  const restam = difDias(hoje(), o.prazo);

  topo(o.nome, `${o.tipo} · ${o.endereco}`,
    App.podeEditar()
      ? `<a class="btn btn--accent" href="#/obra/${o.id}/nova-semana">${icone('mais')}<span>Relatório da semana</span></a>`
      : `<a class="btn" href="#/obra/${o.id}/semanas">${icone('semana')}<span>Semanas</span></a>`);

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
              <span class="li">${icone('grafico', 'i')}<span>Diferença: <b style="color:var(--${s.chave === 'ok' ? 'ok' : s.chave === 'warn' ? 'warn' : 'bad'})">${s.dif > 0 ? '+' : ''}${s.dif} p.p.</b></span></span>
              <span class="li">${icone('relogio', 'i')}<span>${restam >= 0 ? `Faltam <b>${restam} dias</b> para o prazo` : `Prazo vencido há <b>${-restam} dias</b>`}</span></span>
            </div>
          </div>
        </div>

        <div class="grid g-3" style="margin-top:16px">
          ${kpi('Semanas relatadas', o.relatorios.length, ult ? `última: ${fmtPeriodo(ult.de, ult.ate)}` : 'nenhuma ainda')}
          ${kpi('Dias de atraso', diasAtrasoAcumulados(o), 'somados desde o início')}
          ${kpi('Pendências abertas', pend.length, pend.length ? 'veja a aba pendências' : 'nada travando a obra')}
        </div>

        <div class="sec-t"><h2>Últimas semanas</h2>
          <a class="btn btn--sm" href="#/obra/${o.id}/semanas">Ver todas ${icone('seta')}</a></div>
        ${o.relatorios.length
          ? `<div class="tl">${relatoriosOrdenados(o).slice(0, 3).map(r => `
              <div class="rel"><span class="rel__dot ${(r.atrasos || []).length ? 'is-bad' : 'is-ok'}"><i></i></span>
              ${cartaoRelatorio(o, r)}</div>`).join('')}</div>`
          : vazio('Nenhuma semana relatada', 'O primeiro relatório semanal aparece aqui assim que for lançado.',
              App.podeEditar() ? `<a class="btn btn--dark" href="#/obra/${o.id}/nova-semana">${icone('mais')}Lançar a primeira semana</a>` : '')}
      </div>

      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card__head"><h3>Etapas</h3>
            <a class="btn btn--sm btn--ghost" href="#/obra/${o.id}/etapas">Detalhar</a></div>
          ${o.etapas.slice(0, 6).map(e => linhaEtapa(e)).join('')}
          <p class="hint">${o.etapas.filter(e => e.progresso === 100).length} de ${o.etapas.length} etapas concluídas.</p>
        </div>

        <div class="card" style="margin-bottom:16px">
          <div class="card__head"><h3>Por que a obra atrasou</h3></div>
          ${motivos.length ? `<div class="bars">${motivos.map(m => `
            <div class="bar">
              <span class="bar__t" title="${esc(m.rotulo)}">${esc(m.rotulo)}</span>
              <span class="bar__b"><i style="--w:${Math.round((m.dias / maxDias) * 100)}%"></i></span>
              <span class="bar__v">${m.dias}d</span>
            </div>`).join('')}</div>`
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
            ${App.usuario.papel !== 'arquiteto' ? `<span class="row"><span>Valor</span><b>${moeda(o.valor)}</b></span>` : ''}
          </div>
        </div>
      </div>
    </div>`);
}

/* ─── ajustes ─────────────────────────────────────────────── */

function telaAjustes() {
  topo('Ajustes', 'Conta e dados do portal');
  pintar(`
    <div class="card" style="max-width:640px">
      <div class="card__head"><h2>Sua conta</h2></div>
      <div class="obra-card__meta" style="font-size:13.5px">
        <span class="row"><span>Nome</span><b>${esc(App.usuario.nome)}</b></span>
        <span class="row"><span>E-mail</span><b>${esc(App.usuario.email)}</b></span>
        <span class="row"><span>Perfil</span><b>${esc(PAPEIS[App.usuario.papel].rotulo)}</b></span>
        <span class="row"><span>Função</span><b>${esc(App.usuario.cargo || '—')}</b></span>
      </div>
    </div>

    <div class="card" style="max-width:640px;margin-top:16px">
      <div class="card__head"><h2>Dados do portal</h2></div>
      <p class="hint" style="margin:0 0 14px">
        Este portal guarda tudo no próprio navegador: os registros ficam no armazenamento local
        e as fotos no banco interno do navegador. Nada é enviado para fora deste aparelho, então
        cada pessoa vê apenas o que lançou aqui. Limpar os dados devolve o portal ao conteúdo
        de demonstração.
      </p>
      <button class="btn btn--bad" id="btnZerar">${icone('lixo')}Limpar dados e recomeçar</button>
    </div>`);

  $('#btnZerar').addEventListener('click', () => confirmar(
    'Limpar todos os dados',
    'Os relatórios, fotos e pendências lançados neste navegador serão apagados e o portal volta ao conteúdo de demonstração.',
    () => { DB.zerar(); location.hash = ''; location.reload(); },
    'Limpar tudo'));
}

document.addEventListener('DOMContentLoaded', () => App.iniciar());
