/* ============================================================
   SPX · módulos de planejamento
   Cronograma, custos, recursos, riscos e planejamento técnico.
   ============================================================ */

/* ─── cronograma ──────────────────────────────────────────── */

function telaCronograma(o) {
  const chave = 'crono:' + o.id;
  const aberta = ESTADO[chave];
  const editavel = App.podeEditar();
  const real = progressoObra(o), plan = progressoPlanejado(o);
  const s = situacaoObra(o);
  const emCurso = o.etapas.filter(f => f.progresso > 0 && f.progresso < 100);
  const daSemana = tarefasDaSemana(o);

  topo('Cronograma', `${o.nome} · entrega em ${fmtData(o.prazo, true)}`,
    editavel ? `<button class="btn btn--sm" id="btnNovaFrente">${icone('mais')}<span>Frente</span></button>` : '');

  const previstoDa = (item) => Math.round(Math.max(0, Math.min(1,
    difDias(item.inicio, hoje()) / Math.max(1, difDias(item.inicio, item.fim)))) * 100);

  pintar(`
    <div class="grid g-3" style="margin-bottom:16px">
      ${kpi('Executado', real + '%', `previsto para hoje: ${plan}%`)}
      ${kpi('Situação', `<span style="font-size:19px">${s.rotulo}</span>`, `${s.dif > 0 ? '+' : ''}${s.dif} pontos percentuais`)}
      ${kpi('Tarefas desta semana', daSemana.length, `${o.etapas.reduce((t, f) => t + f.tarefas.length, 0)} tarefas no total`)}
    </div>

    ${daSemana.length ? `
    <div class="card" style="margin-bottom:16px">
      <div class="card__head">${icone('semana')}<h2>O que está aberto nesta semana</h2></div>
      <div class="lista">
        ${daSemana.slice(0, 6).map(t => linha({
          titulo: esc(t.nome),
          sub: `${esc(t.frente.nome)} · ${t.duracao} dia(s) · até ${fmtData(t.fim)}${t.recurso ? ' · ' + esc(t.recurso) : ''}`,
          valor: t.progresso + '%',
          tag: t.fim < hoje() ? '<span class="tag tag--bad">Vencida</span>' : '',
        })).join('')}
      </div>
    </div>` : ''}

    <div class="card" style="margin-bottom:16px">
      <div class="card__head">${icone('grafico')}<h2>Frentes no tempo</h2>
        <span class="tag">${o.etapas.filter(f => f.progresso === 100).length} de ${o.etapas.length} prontas</span></div>
      ${gantt(o)}
      <p class="hint" style="margin-top:14px">A barra clara é o período previsto e a escura é o executado.
        Frente em vermelho passou da data sem estar concluída.</p>
    </div>

    <div class="sec-t"><h2>Estrutura da obra</h2>
      <span class="tag">${emCurso.length} frente(s) em curso</span></div>

    <div class="grid" style="gap:10px">
      ${o.etapas.map(f => {
        const prev = previstoDa(f);
        const atrasada = f.progresso < prev - 10;
        const abertaAqui = aberta === f.id;
        return `
        <div class="card" style="padding:0;overflow:hidden">
          <button class="lin" data-frente="${f.id}" style="border:0;border-radius:0;background:transparent;padding:15px">
            <span class="lin__i" style="background:var(--t${(Number(f.num) % 6) + 1});color:var(--t${(Number(f.num) % 6) + 1}i)">
              <b style="font-size:12px;font-weight:700">${esc(f.num)}</b></span>
            <span class="lin__t">
              <b>${esc(f.nome)}</b>
              <span>${f.tarefas.length} tarefas · ${difUteis(f.inicio, f.fim)} dias de obra · ${fmtData(f.inicio)} a ${fmtData(f.fim)}</span>
            </span>
            ${atrasada ? '<span class="tag tag--bad">Atrasada</span>' : f.progresso === 100 ? '<span class="tag tag--ok">Pronta</span>' : ''}
            <span class="lin__x">${f.progresso}%<small>previsto ${prev}%</small></span>
          </button>

          ${abertaAqui ? `
          <div style="padding:0 15px 15px">
            <div class="track" style="margin-bottom:14px"><i class="${f.progresso === 100 ? 'is-ok' : ''}" style="--w:${f.progresso}%"></i></div>
            <div class="lista">
              ${f.tarefas.map(t => `
                <div class="lin lin--parado" style="align-items:flex-start">
                  <span class="lin__i" style="background:var(--surface-2);color:var(--muted)">
                    <b style="font-size:11px;font-weight:600">${esc(t.num)}</b></span>
                  <span class="lin__t">
                    <b style="font-size:13.5px">${esc(t.nome)}</b>
                    <span>${t.duracao} dia(s) · ${fmtData(t.inicio)} a ${fmtData(t.fim)}${t.recurso ? ' · ' + esc(t.recurso) : ''}</span>
                    ${t.predecessora ? `<span>depende de ${esc(nomeTarefa(o, t.predecessora))}${t.ligacao === 'II' ? ' (início a início)' : ''}${t.defasagem ? ` + ${t.defasagem} dia(s)` : ''}</span>` : ''}
                    ${editavel ? `
                      <span style="display:flex;align-items:center;gap:10px;margin-top:8px">
                        <input type="range" min="0" max="100" step="5" value="${t.progresso}" data-tarefa="${t.id}" aria-label="${esc(t.nome)}" style="flex:1">
                        <b data-pct-t="${t.id}" style="font-size:13px;width:42px;text-align:right">${t.progresso}%</b>
                      </span>` : `
                      <span class="track" style="margin-top:8px"><i class="${t.progresso === 100 ? 'is-ok' : ''}" style="--w:${t.progresso}%"></i></span>`}
                  </span>
                  ${editavel ? `<button class="x-btn" data-edt="${t.id}" title="Editar tarefa">${icone('editar')}</button>` : `<span class="lin__x">${t.progresso}%</span>`}
                </div>`).join('')}
            </div>
            ${editavel ? `
              <div style="display:flex;gap:9px;margin-top:12px;flex-wrap:wrap">
                <button class="btn btn--sm" data-nova-tarefa="${f.id}">${icone('mais')}Tarefa</button>
                <button class="btn btn--sm btn--ghost" data-edf="${f.id}">${icone('editar')}Renomear frente</button>
              </div>` : ''}
          </div>` : ''}
        </div>`;
      }).join('')}
    </div>`);

  $$('[data-frente]').forEach(b => b.addEventListener('click', () => {
    ESTADO[chave] = ESTADO[chave] === b.dataset.frente ? null : b.dataset.frente;
    telaCronograma(o);
  }));

  if (!editavel) return;

  $$('[data-tarefa]').forEach(rng => {
    const alvo = $(`[data-pct-t="${rng.dataset.tarefa}"]`);
    rng.addEventListener('input', () => { alvo.textContent = rng.value + '%'; });
    rng.addEventListener('change', () => {
      const achado = tarefaPorId(o, rng.dataset.tarefa);
      achado.tarefa.progresso = Number(rng.value);
      sincronizarFrente(achado.frente);
      DB.salvar();
      aviso(`${achado.tarefa.nome}: ${rng.value}%`);
      telaCronograma(o);
    });
  });

  $$('[data-edt]').forEach(b => b.addEventListener('click', () =>
    formTarefa(o, tarefaPorId(o, b.dataset.edt))));
  $$('[data-nova-tarefa]').forEach(b => b.addEventListener('click', () =>
    formTarefa(o, { frente: o.etapas.find(f => f.id === b.dataset.novaTarefa), tarefa: null })));
  $$('[data-edf]').forEach(b => b.addEventListener('click', () =>
    formFrente(o, o.etapas.find(f => f.id === b.dataset.edf))));
  $('#btnNovaFrente')?.addEventListener('click', () => formFrente(o, null));
}

/* ─── frente e tarefa ─────────────────────────────────────── */

function formFrente(o, f) {
  modal({
    titulo: f ? 'Renomear frente' : 'Nova frente de serviço',
    corpo: `
      <div class="field"><label for="fNome">Nome da frente</label>
        <input class="inp" id="fNome" value="${esc(f?.nome || '')}" placeholder="Ex.: Instalações elétricas"></div>
      ${f ? '' : `<div class="field" style="margin:0"><label for="fInicio">Início previsto</label>
        <input class="inp" type="date" id="fInicio" value="${hoje()}"></div>`}`,
    acoes: [
      ...(f ? [{ rotulo: 'Excluir', classe: 'btn--bad', aoClicar: (_, x) => {
        o.etapas = o.etapas.filter(y => y.id !== f.id);
        DB.salvar(); x(); aviso('Frente removida.'); App.rotear();
      } }] : []),
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, x) => x() },
      { rotulo: 'Salvar', classe: 'btn--dark', aoClicar: (bg, x) => {
        const nome = $('#fNome', bg).value.trim();
        if (!nome) return aviso('Dê um nome à frente.', 'bad');
        if (f) { f.nome = nome; }
        else {
          const inicio = $('#fInicio', bg).value || hoje();
          o.etapas.push({
            id: uid('f'), num: String(o.etapas.length + 1), nome, tarefas: [],
            inicio, fim: somarUteis(inicio, 5), progresso: 0, peso: 1,
          });
        }
        DB.salvar(); x(); aviso('Frente salva.'); App.rotear();
      } },
    ],
  });
}

function formTarefa(o, alvo) {
  const { frente, tarefa } = alvo;
  const outras = todasTarefas(o).filter(t => t.id !== tarefa?.id);

  modal({
    titulo: tarefa ? 'Editar tarefa' : `Nova tarefa em ${frente.nome}`,
    corpo: `
      <div class="field"><label for="tNome">Tarefa</label>
        <input class="inp" id="tNome" value="${esc(tarefa?.nome || '')}" placeholder="Ex.: execução de pontos de água fria"></div>
      <div class="row3">
        <div class="field"><label for="tDur">Duração (dias)</label>
          <input class="inp" type="number" inputmode="decimal" step="0.5" min="0.5" id="tDur" value="${tarefa?.duracao ?? 3}"></div>
        <div class="field"><label for="tIni">Início</label>
          <input class="inp" type="date" id="tIni" value="${tarefa?.inicio || hoje()}"></div>
        <div class="field"><label for="tProg">Executado (%)</label>
          <input class="inp" type="number" min="0" max="100" step="5" id="tProg" value="${tarefa?.progresso ?? 0}"></div>
      </div>
      <div class="row2">
        <div class="field"><label for="tRec">Responsável ou equipe</label>
          <input class="inp" id="tRec" value="${esc(tarefa?.recurso || '')}" placeholder="Pedreiro, eletricista, marcenaria"></div>
        <div class="field"><label for="tLig">Ligação</label>
          <select class="sel" id="tLig">
            <option value="TI" ${tarefa?.ligacao !== 'II' ? 'selected' : ''}>Término a início</option>
            <option value="II" ${tarefa?.ligacao === 'II' ? 'selected' : ''}>Início a início</option>
          </select></div>
      </div>
      <div class="field" style="margin:0"><label for="tPred">Predecessora</label>
        <select class="sel" id="tPred">
          <option value="">Nenhuma</option>
          ${outras.map(t => `<option value="${t.id}" ${tarefa?.predecessora === t.id ? 'selected' : ''}>${esc(t.frente.num)}.${esc(t.num.split('.')[1])} ${esc(t.nome)}</option>`).join('')}
        </select>
        <p class="hint">O término da tarefa é calculado pela duração, pulando domingo.</p></div>`,
    acoes: [
      ...(tarefa ? [{ rotulo: 'Excluir', classe: 'btn--bad', aoClicar: (_, x) => {
        frente.tarefas = frente.tarefas.filter(t => t.id !== tarefa.id);
        sincronizarFrente(frente); DB.salvar(); x(); aviso('Tarefa removida.'); App.rotear();
      } }] : []),
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, x) => x() },
      { rotulo: 'Salvar', classe: 'btn--dark', aoClicar: (bg, x) => {
        const nome = $('#tNome', bg).value.trim();
        if (!nome) return aviso('Descreva a tarefa.', 'bad');
        const dur = Math.max(0.5, Number($('#tDur', bg).value || 1));
        const inicio = $('#tIni', bg).value || hoje();
        const dados = {
          nome, duracao: dur, inicio, fim: somarUteis(inicio, dur),
          progresso: Math.max(0, Math.min(100, Number($('#tProg', bg).value || 0))),
          recurso: $('#tRec', bg).value.trim(),
          ligacao: $('#tLig', bg).value,
          predecessora: $('#tPred', bg).value || null,
          defasagem: tarefa?.defasagem || 0,
        };
        if (tarefa) Object.assign(tarefa, dados);
        else frente.tarefas.push({ id: uid('t'), num: `${frente.num}.${frente.tarefas.length + 1}`, ...dados });
        frente.peso = Math.round(frente.tarefas.reduce((s2, t) => s2 + t.duracao, 0) * 10) / 10;
        sincronizarFrente(frente);
        DB.salvar(); x(); aviso('Tarefa salva.'); App.rotear();
      } },
    ],
  });
}

/* ─── custos ──────────────────────────────────────────────── */

function telaCustos(o) {
  const orcado = o.custo_direto || 0;
  const real = custoRealizado(o);
  const va = valorAgregado(o);
  const cpi = indiceCusto(o);
  const saldo = orcado - real;
  const porEtapa = custoPorEtapa(o).filter(x => x.orcado || x.gasto);

  const nivelCpi = cpi >= 1 ? 'ok' : cpi >= 0.95 ? 'warn' : 'bad';
  const leituraCpi = cpi >= 1
    ? 'O serviço entregue vale mais do que já foi gasto.'
    : cpi >= 0.95 ? 'Gasto ligeiramente acima do serviço entregue.' : 'Gasto acima do serviço entregue; revise as frentes mais caras.';

  topo('Custos', `${o.nome} · ${Math.round((real / (orcado || 1)) * 100)}% do orçamento consumido`,
    App.podeEditar() ? `<button class="btn btn--sm btn--accent" id="btnCusto">${icone('mais')}<span>Lançar</span></button>` : '');

  pintar(`
    <div class="grid g-2" style="margin-bottom:16px">
      ${kpi('Orçamento de custo direto', moeda(orcado), `contrato de ${moeda(o.valor)}`)}
      ${kpi('Realizado', moeda(real), `${Math.round((real / (orcado || 1)) * 100)}% do orçamento`)}
      ${kpi('Saldo', moeda(saldo), saldo >= 0 ? 'ainda disponível' : 'acima do orçado')}
      ${kpi('Serviço entregue', moeda(va), `${progressoObra(o)}% da obra executada`)}
    </div>

    <div class="idx idx--${nivelCpi}" style="margin-bottom:16px">
      <span class="idx__v">${cpi.toFixed(2)}</span>
      <span class="idx__t"><b>Índice de custo</b><span>${leituraCpi} Serviço entregue dividido pelo gasto: acima de 1,00 é bom.</span></span>
    </div>

    <div class="card" style="margin-bottom:16px">
      ${curvaSGrafico(curvaS(o, true), { moeda: true, titulo: 'Desembolso previsto e realizado' })}
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card__head">${icone('grafico')}<h2>Onde o dinheiro foi</h2></div>
      ${barras(custoPorCategoria(o).map(c => ({ rotulo: c.rotulo, valor: c.valor })), { formato: moeda })}
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card__head">${icone('etapas')}<h2>Orçado e gasto por etapa</h2></div>
      <div class="lista">
        ${porEtapa.map(x => {
          const pct = x.orcado ? Math.round((x.gasto / x.orcado) * 100) : 0;
          const estouro = x.gasto > x.orcado;
          return linha({
            titulo: esc(x.etapa.nome),
            sub: `${moeda(x.gasto)} de ${moeda(x.orcado)} · ${x.etapa.progresso}% executado`,
            valor: `<span style="color:var(--${estouro ? 'bad' : 'ink'})">${pct}%</span>`,
            subvalor: estouro ? 'acima do orçado' : 'do orçado',
          });
        }).join('')}
      </div>
    </div>

    <div class="sec-t"><h2>Últimos lançamentos</h2></div>
    <div class="lista">
      ${[...o.custos].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 12).map(c => linha({
        titulo: esc(c.descricao),
        sub: `${fmtData(c.data)} · ${custoRotulo(c.categoria)}${c.doc ? ' · ' + esc(c.doc) : ''}${c.fornecedor_id ? ' · ' + esc(DB.fornecedorNome(c.fornecedor_id)) : ''}`,
        valor: moeda(c.valor),
      })).join('')}
    </div>`);

  ligarCurvas();
  if (!App.podeEditar()) return;
  $('#btnCusto').addEventListener('click', () => modal({
    titulo: 'Lançar custo',
    corpo: `
      <div class="field"><label for="cDesc">Descrição</label>
        <input class="inp" id="cDesc" placeholder="Ex.: Compra de argamassa colante"></div>
      <div class="row2">
        <div class="field"><label for="cValor">Valor (R$)</label>
          <input class="inp" type="number" id="cValor" min="0" step="0.01" inputmode="decimal" placeholder="0,00"></div>
        <div class="field"><label for="cData">Data</label>
          <input class="inp" type="date" id="cData" value="${hoje()}"></div>
      </div>
      <div class="row2">
        <div class="field"><label for="cCat">Categoria</label>
          <select class="sel" id="cCat">${CATEGORIAS_CUSTO.map(c => `<option value="${c.id}">${esc(c.rotulo)}</option>`).join('')}</select></div>
        <div class="field"><label for="cEtapa">Etapa</label>
          <select class="sel" id="cEtapa">${o.etapas.map(e => `<option value="${e.id}">${esc(e.nome)}</option>`).join('')}</select></div>
      </div>
      <div class="row2">
        <div class="field"><label for="cForn">Fornecedor</label>
          <select class="sel" id="cForn"><option value="">Sem fornecedor</option>
            ${DB.dados.fornecedores.map(f => `<option value="${f.id}">${esc(f.nome)}</option>`).join('')}</select></div>
        <div class="field"><label for="cDoc">Nota ou documento</label>
          <input class="inp" id="cDoc" placeholder="NF 12345"></div>
      </div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Lançar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const valor = Number($('#cValor', bg).value || 0);
        const descricao = $('#cDesc', bg).value.trim();
        if (!descricao || valor <= 0) return aviso('Informe a descrição e um valor maior que zero.', 'bad');
        o.custos.push({
          id: uid('c'), descricao, valor,
          data: $('#cData', bg).value || hoje(),
          categoria: $('#cCat', bg).value,
          etapa: $('#cEtapa', bg).value,
          fornecedor_id: $('#cForn', bg).value || null,
          doc: $('#cDoc', bg).value.trim(),
        });
        DB.salvar(); f(); aviso('Custo lançado.'); App.rotear();
      } },
    ],
  }));
}

/* ─── recursos ────────────────────────────────────────────── */

function telaRecursos(o) {
  const equipe = o.recursos.equipe;
  const ativos = equipe.filter(p => p.ativo);
  const custoDia = ativos.reduce((s, p) => s + p.custo_dia, 0);
  const porFuncao = [...ativos.reduce((m, p) => m.set(p.funcao, (m.get(p.funcao) || 0) + 1), new Map())]
    .map(([rotulo, valor]) => ({ rotulo, valor })).sort((a, b) => b.valor - a.valor);
  const emObra = o.recursos.equipamentos.filter(e => e.situacao === 'em_obra');
  const rels = relatoriosOrdenados(o).slice(0, 8).reverse();

  topo('Recursos', `${o.nome} · ${ativos.length} pessoas e ${emObra.length} equipamentos em obra`,
    App.podeEditar() ? `<button class="btn btn--sm" id="btnPessoa">${icone('mais')}<span>Pessoa</span></button>` : '');

  pintar(`
    <div class="grid g-3" style="margin-bottom:16px">
      ${kpi('Equipe ativa', ativos.length, `${equipe.length - ativos.length} prevista(s) para depois`)}
      ${kpi('Custo de mão de obra', moeda(custoDia), 'por dia trabalhado')}
      ${kpi('Equipamentos em obra', emObra.length, `${o.recursos.equipamentos.length} no total`)}
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card__head">${icone('pessoas')}<h2>Equipe por função</h2></div>
      ${porFuncao.length ? barras(porFuncao, { formato: (v) => v + (v > 1 ? ' pessoas' : ' pessoa') })
        : '<p class="hint">Nenhuma pessoa ativa no momento.</p>'}
    </div>

    ${rels.length ? `
    <div class="card" style="margin-bottom:16px">
      <div class="card__head">${icone('grafico')}<h2>Efetivo por semana</h2></div>
      ${barras(rels.map(r => ({ rotulo: 'Semana ' + r.semana, valor: r.efetivo || 0 })), { formato: (v) => v + ' pessoas' })}
      <p class="hint" style="margin-top:12px">Números lançados no relatório de cada semana.</p>
    </div>` : ''}

    <div class="sec-t"><h2>Pessoas</h2></div>
    <div class="lista">
      ${equipe.map(p => linha({
        titulo: esc(p.nome),
        sub: `${esc(p.funcao)} · ${esc(p.empresa)} · ${fmtData(p.de)} a ${fmtData(p.ate)}`,
        tag: p.ativo ? '<span class="tag tag--ok">Em obra</span>' : '<span class="tag">Prevista</span>',
        valor: App.podeEditar() ? moeda(p.custo_dia) : undefined,
        subvalor: App.podeEditar() ? 'por dia' : undefined,
        acao: App.podeEditar() ? 'pessoa:' + p.id : '',
      })).join('')}
    </div>

    <div class="sec-t"><h2>Equipamentos</h2>
      ${App.podeEditar() ? '<button class="btn btn--sm" id="btnEquip">' + icone('mais') + 'Equipamento</button>' : ''}</div>
    <div class="lista">
      ${o.recursos.equipamentos.map(e => linha({
        titulo: esc(e.nome),
        sub: `${esc(e.tipo)}${e.fornecedor_id ? ' · ' + esc(DB.fornecedorNome(e.fornecedor_id)) : ''} · ${fmtData(e.de)} a ${fmtData(e.ate)}`,
        tag: e.situacao === 'em_obra' ? '<span class="tag tag--ok">Em obra</span>'
           : e.situacao === 'manutencao' ? '<span class="tag tag--warn">Manutenção</span>'
           : '<span class="tag">Devolvido</span>',
        valor: e.custo_mes ? moeda(e.custo_mes) : '—',
        subvalor: e.custo_mes ? 'por mês' : 'próprio',
        acao: App.podeEditar() ? 'equip:' + e.id : '',
      })).join('')}
    </div>`);

  if (!App.podeEditar()) return;

  $$('[data-lin^="pessoa:"]').forEach(b => b.addEventListener('click', () =>
    formPessoa(o, equipe.find(p => p.id === b.dataset.lin.slice(7)))));
  $$('[data-lin^="equip:"]').forEach(b => b.addEventListener('click', () =>
    formEquipamento(o, o.recursos.equipamentos.find(e => e.id === b.dataset.lin.slice(6)))));
  $('#btnPessoa').addEventListener('click', () => formPessoa(o, null));
  $('#btnEquip').addEventListener('click', () => formEquipamento(o, null));
}

function formPessoa(o, p) {
  modal({
    titulo: p ? 'Pessoa da equipe' : 'Adicionar à equipe',
    corpo: `
      <div class="field"><label for="pNome">Nome</label><input class="inp" id="pNome" value="${esc(p?.nome || '')}"></div>
      <div class="row2">
        <div class="field"><label for="pFun">Função</label><input class="inp" id="pFun" value="${esc(p?.funcao || '')}" placeholder="Pedreiro"></div>
        <div class="field"><label for="pEmp">Empresa</label><input class="inp" id="pEmp" value="${esc(p?.empresa || 'SPX')}"></div>
      </div>
      <div class="row2">
        <div class="field"><label for="pDe">Entrada</label><input class="inp" type="date" id="pDe" value="${p?.de || hoje()}"></div>
        <div class="field"><label for="pAte">Saída prevista</label><input class="inp" type="date" id="pAte" value="${p?.ate || o.prazo}"></div>
      </div>
      <div class="row2">
        <div class="field"><label for="pCusto">Custo por dia (R$)</label><input class="inp" type="number" inputmode="decimal" id="pCusto" value="${p?.custo_dia ?? 300}"></div>
        <div class="field"><label for="pAtivo">Situação</label>
          <select class="sel" id="pAtivo">
            <option value="1" ${p?.ativo !== false ? 'selected' : ''}>Em obra</option>
            <option value="0" ${p?.ativo === false ? 'selected' : ''}>Prevista ou encerrada</option>
          </select></div>
      </div>`,
    acoes: [
      ...(p ? [{ rotulo: 'Remover', classe: 'btn--bad', aoClicar: (_, f) => {
        o.recursos.equipe = o.recursos.equipe.filter(x => x.id !== p.id);
        DB.salvar(); f(); aviso('Pessoa removida.'); App.rotear();
      } }] : []),
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Salvar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const nome = $('#pNome', bg).value.trim();
        if (!nome) return aviso('Informe o nome.', 'bad');
        const dados = {
          nome, funcao: $('#pFun', bg).value.trim() || 'Ajudante',
          empresa: $('#pEmp', bg).value.trim() || 'SPX',
          de: $('#pDe', bg).value, ate: $('#pAte', bg).value,
          custo_dia: Number($('#pCusto', bg).value || 0),
          ativo: $('#pAtivo', bg).value === '1',
        };
        if (p) Object.assign(p, dados); else o.recursos.equipe.push({ id: uid('r'), ...dados });
        DB.salvar(); f(); aviso('Equipe atualizada.'); App.rotear();
      } },
    ],
  });
}

function formEquipamento(o, e) {
  modal({
    titulo: e ? 'Equipamento' : 'Adicionar equipamento',
    corpo: `
      <div class="field"><label for="qNome">Equipamento</label><input class="inp" id="qNome" value="${esc(e?.nome || '')}" placeholder="Betoneira 400 L"></div>
      <div class="row2">
        <div class="field"><label for="qTipo">Origem</label>
          <select class="sel" id="qTipo">
            <option ${e?.tipo === 'Próprio' ? 'selected' : ''}>Próprio</option>
            <option ${e?.tipo === 'Locação' ? 'selected' : ''}>Locação</option>
          </select></div>
        <div class="field"><label for="qSit">Situação</label>
          <select class="sel" id="qSit">
            <option value="em_obra" ${e?.situacao === 'em_obra' ? 'selected' : ''}>Em obra</option>
            <option value="manutencao" ${e?.situacao === 'manutencao' ? 'selected' : ''}>Manutenção</option>
            <option value="devolvido" ${e?.situacao === 'devolvido' ? 'selected' : ''}>Devolvido</option>
          </select></div>
      </div>
      <div class="row2">
        <div class="field"><label for="qDe">De</label><input class="inp" type="date" id="qDe" value="${e?.de || hoje()}"></div>
        <div class="field"><label for="qAte">Até</label><input class="inp" type="date" id="qAte" value="${e?.ate || o.prazo}"></div>
      </div>
      <div class="field"><label for="qCusto">Custo mensal (R$)</label>
        <input class="inp" type="number" inputmode="decimal" id="qCusto" value="${e?.custo_mes ?? 0}"></div>`,
    acoes: [
      ...(e ? [{ rotulo: 'Remover', classe: 'btn--bad', aoClicar: (_, f) => {
        o.recursos.equipamentos = o.recursos.equipamentos.filter(x => x.id !== e.id);
        DB.salvar(); f(); aviso('Equipamento removido.'); App.rotear();
      } }] : []),
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Salvar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const nome = $('#qNome', bg).value.trim();
        if (!nome) return aviso('Informe o equipamento.', 'bad');
        const dados = {
          nome, tipo: $('#qTipo', bg).value, situacao: $('#qSit', bg).value,
          de: $('#qDe', bg).value, ate: $('#qAte', bg).value,
          custo_mes: Number($('#qCusto', bg).value || 0), fornecedor_id: e?.fornecedor_id || null,
        };
        if (e) Object.assign(e, dados); else o.recursos.equipamentos.push({ id: uid('eq'), ...dados });
        DB.salvar(); f(); aviso('Equipamento salvo.'); App.rotear();
      } },
    ],
  });
}

/* ─── riscos ──────────────────────────────────────────────── */

function telaRiscos(o) {
  const chave = 'risco:' + o.id;
  const filtro = ESTADO[chave] || '';
  const ativos = o.riscos.filter(r => r.status !== 'encerrado');
  const lista = (filtro
    ? ativos.filter(r => `${r.probabilidade}-${r.impacto}` === filtro)
    : ativos).sort((a, b) => (b.probabilidade * b.impacto) - (a.probabilidade * a.impacto));
  const altos = ativos.filter(r => nivelRisco(r).id === 'alto');
  const materializados = o.riscos.filter(r => r.status === 'materializado');

  topo('Riscos', `${o.nome} · ${ativos.length} risco(s) em acompanhamento`,
    App.podeEditar() ? `<button class="btn btn--sm" id="btnRisco">${icone('mais')}<span>Risco</span></button>` : '');

  pintar(`
    <div class="grid g-3" style="margin-bottom:16px">
      ${kpi('Riscos abertos', ativos.length, 'em acompanhamento')}
      ${kpi('Severidade alta', altos.length, altos.length ? 'exigem ação imediata' : 'nenhum no momento')}
      ${kpi('Já aconteceram', materializados.length, 'viraram problema real')}
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card__head">${icone('pendencia')}<h2>Matriz de risco</h2>
        ${filtro ? '<button class="btn btn--sm btn--ghost" id="limparMx">Limpar filtro</button>' : ''}</div>
      ${matrizRisco(ativos)}
      <p class="hint" style="margin-top:12px">Toque em uma casa para ver os riscos daquele cruzamento de
        probabilidade e impacto. A severidade é o produto dos dois.</p>
    </div>

    <div class="sec-t"><h2>${filtro ? 'Riscos da casa selecionada' : 'Todos os riscos'}</h2></div>
    <div class="lista">
      ${lista.length ? lista.map(r => {
        const n = nivelRisco(r);
        return linha({
          titulo: esc(r.titulo),
          sub: `${esc(r.categoria)} · ${esc(r.resposta)} · ${esc(DB.nome(r.responsavel))}${r.status === 'materializado' ? ' · já aconteceu' : ''}`,
          tag: `<span class="tag" style="background:color-mix(in srgb, ${n.cor} 16%, transparent);color:${n.cor}">${n.rotulo}</span>`,
          valor: `${r.probabilidade}×${r.impacto}`,
          subvalor: 'prob × impacto',
          acao: 'risco:' + r.id,
        });
      }).join('') : vazio('Nenhum risco nesta casa', 'Escolha outra casa da matriz ou limpe o filtro.')}
    </div>`);

  $$('[data-mx]').forEach(b => b.addEventListener('click', () => {
    ESTADO[chave] = ESTADO[chave] === b.dataset.mx ? '' : b.dataset.mx;
    telaRiscos(o);
  }));
  $('#limparMx')?.addEventListener('click', () => { ESTADO[chave] = ''; telaRiscos(o); });
  $$('[data-lin^="risco:"]').forEach(b => b.addEventListener('click', () =>
    formRisco(o, o.riscos.find(r => r.id === b.dataset.lin.slice(6)))));
  $('#btnRisco')?.addEventListener('click', () => formRisco(o, null));
}

function formRisco(o, r) {
  const editavel = App.podeEditar();
  const n = r ? nivelRisco(r) : null;
  modal({
    titulo: r ? 'Risco' : 'Novo risco',
    corpo: editavel ? `
      <div class="field"><label for="rTit">Risco</label>
        <input class="inp" id="rTit" value="${esc(r?.titulo || '')}" placeholder="O que pode dar errado"></div>
      <div class="row2">
        <div class="field"><label for="rCat">Categoria</label>
          <select class="sel" id="rCat">${CATEGORIAS_RISCO.map(c => `<option ${r?.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="field"><label for="rResp">Resposta</label>
          <select class="sel" id="rResp">${RESPOSTAS_RISCO.map(c => `<option ${r?.resposta === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      </div>
      <div class="row2">
        <div class="field"><label for="rProb">Probabilidade (1 a 5)</label>
          <input class="inp" type="number" min="1" max="5" id="rProb" value="${r?.probabilidade ?? 3}"></div>
        <div class="field"><label for="rImp">Impacto (1 a 5)</label>
          <input class="inp" type="number" min="1" max="5" id="rImp" value="${r?.impacto ?? 3}"></div>
      </div>
      <div class="field"><label for="rAcao">Ação prevista</label>
        <textarea class="txt" id="rAcao" style="min-height:80px">${esc(r?.acao || '')}</textarea></div>
      <div class="row2">
        <div class="field"><label for="rDono">Responsável</label>
          <select class="sel" id="rDono">${DB.dados.usuarios.map(u => `<option value="${u.id}" ${r?.responsavel === u.id ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select></div>
        <div class="field"><label for="rStatus">Situação</label>
          <select class="sel" id="rStatus">
            <option value="monitorado" ${r?.status === 'monitorado' ? 'selected' : ''}>Monitorado</option>
            <option value="materializado" ${r?.status === 'materializado' ? 'selected' : ''}>Já aconteceu</option>
            <option value="encerrado" ${r?.status === 'encerrado' ? 'selected' : ''}>Encerrado</option>
          </select></div>
      </div>` : `
      <p style="font-size:14px;color:var(--ink-2);margin-bottom:12px">${esc(r.acao)}</p>
      <div class="obra-card__meta" style="font-size:13.5px">
        <span class="row"><span>Categoria</span><b>${esc(r.categoria)}</b></span>
        <span class="row"><span>Severidade</span><b style="color:${n.cor}">${n.rotulo} (${r.probabilidade}×${r.impacto})</b></span>
        <span class="row"><span>Resposta</span><b>${esc(r.resposta)}</b></span>
        <span class="row"><span>Responsável</span><b>${esc(DB.nome(r.responsavel))}</b></span>
      </div>`,
    acoes: editavel ? [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Salvar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const titulo = $('#rTit', bg).value.trim();
        if (!titulo) return aviso('Descreva o risco.', 'bad');
        const dados = {
          titulo, categoria: $('#rCat', bg).value, resposta: $('#rResp', bg).value,
          probabilidade: Math.max(1, Math.min(5, Number($('#rProb', bg).value || 3))),
          impacto: Math.max(1, Math.min(5, Number($('#rImp', bg).value || 3))),
          acao: $('#rAcao', bg).value.trim(),
          responsavel: $('#rDono', bg).value, status: $('#rStatus', bg).value,
          prazo: r?.prazo || maisDias(hoje(), 30),
        };
        if (r) Object.assign(r, dados); else o.riscos.push({ id: uid('rk'), ...dados });
        DB.salvar(); f(); aviso('Risco salvo.'); App.rotear();
      } },
    ] : [{ rotulo: 'Fechar', classe: 'btn--ghost', aoClicar: (_, f) => f() }],
  });
}

/* ─── planejamento técnico ────────────────────────────────── */

function telaPlanejamento(o) {
  const chave = 'plan:' + o.id;
  const aba = ESTADO[chave] || 'escopo';
  const editavel = App.podeEditar() || App.usuario.papel === 'arquiteto';

  topo('Planejamento técnico', `${o.nome} · escopo, especificações e normas`);

  const conteudo = {
    escopo: () => `
      <div class="card" style="margin-bottom:16px">
        <div class="card__head">${icone('ok')}<h2>Está incluído no contrato</h2></div>
        <div class="lista">${o.escopo.incluido.map(t => linha({ titulo: esc(t), icone: 'ok' })).join('')}</div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card__head">${icone('x')}<h2>Não está incluído</h2></div>
        <div class="lista">${o.escopo.excluido.map(t => linha({ titulo: esc(t), icone: 'x' })).join('')}</div>
        <p class="hint" style="margin-top:12px">O que está fora do escopo só entra na obra como aditivo aprovado.</p>
      </div>
      <div class="card">
        <div class="card__head">${icone('alerta')}<h2>Premissas assumidas</h2></div>
        <div class="lista">${o.escopo.premissas.map(t => linha({ titulo: esc(t), icone: 'alerta' })).join('')}</div>
      </div>`,

    especificacoes: () => `
      <div class="lista">
        ${o.especificacoes.map(e => {
          const et = o.etapas.find(x => x.id === e.etapa);
          return `
          <div class="card">
            <div class="card__head" style="margin-bottom:8px">
              <h3 style="font-size:14.5px">${esc(e.item)}</h3>
              <span class="tag">${esc(e.norma)}</span>
            </div>
            <p style="font-size:13.5px;color:var(--ink-2);margin-bottom:10px">${esc(e.especificacao)}</p>
            <div style="background:var(--surface-2);border-radius:10px;padding:11px">
              <b style="font-size:12px;display:block;margin-bottom:3px">Critério de aceitação</b>
              <span style="font-size:13px;color:var(--ink-2)">${esc(e.criterio)}</span>
            </div>
            ${et ? `<p class="hint" style="margin-top:10px">Etapa: ${esc(et.nome)}</p>` : ''}
          </div>`;
        }).join('')}
      </div>`,

    normas: () => `
      <div class="lista">
        ${o.normas.map(n => linha({
          titulo: `${esc(n.codigo)} · ${esc(n.titulo)}`,
          sub: esc(n.aplicacao),
          tag: n.status === 'atende'
            ? '<span class="tag tag--ok">Atende</span>'
            : '<span class="tag tag--warn">A verificar</span>',
          acao: editavel ? 'norma:' + n.id : '',
        })).join('')}
      </div>
      <p class="hint" style="margin-top:12px">
        As normas de segurança do trabalho (NR) são verificadas no módulo de segurança e meio ambiente.
      </p>`,
  };

  pintar(`
    ${abas('planAbas', [
      { id: 'escopo', rotulo: 'Escopo' },
      { id: 'especificacoes', rotulo: 'Especificações', contador: o.especificacoes.length },
      { id: 'normas', rotulo: 'Normas', contador: o.normas.length },
    ], aba)}
    <div style="margin-top:16px">${conteudo[aba]()}</div>`);

  ligarAbas('planAbas', (nova) => { ESTADO[chave] = nova; telaPlanejamento(o); });

  $$('[data-lin^="norma:"]').forEach(b => b.addEventListener('click', () => {
    const n = o.normas.find(x => x.id === b.dataset.lin.slice(6));
    n.status = n.status === 'atende' ? 'verificar' : 'atende';
    DB.salvar();
    aviso(`${n.codigo}: ${n.status === 'atende' ? 'atende' : 'a verificar'}.`);
    telaPlanejamento(o);
  }));
}
