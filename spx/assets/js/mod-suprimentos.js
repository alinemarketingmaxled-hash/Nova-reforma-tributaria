/* ============================================================
   SPX · suprimentos
   Estoque com rastreabilidade, pedidos de compra e fornecedores.
   ============================================================ */

const TIPOS_MOV = { entrada: 'Entrada', saida: 'Saída', devolucao: 'Devolução', perda: 'Perda' };

/* ─── materiais e estoque ─────────────────────────────────── */

function telaMateriais(o) {
  const faltando = materiaisEmFalta(o);
  const noMes = o.movimentacoes.filter(m => difDias(m.data, hoje()) <= 30).length;

  topo('Materiais', `${o.nome} · ${o.materiais.length} itens controlados`,
    App.podeEditar() ? `<button class="btn btn--sm" id="btnMat">${icone('mais')}<span>Item</span></button>` : '');

  pintar(`
    <div class="grid g-3" style="margin-bottom:16px">
      ${kpi('Itens controlados', o.materiais.length, 'com saldo e mínimo definidos')}
      ${kpi('Abaixo do mínimo', faltando.length, faltando.length ? 'precisam de reposição' : 'estoque em dia')}
      ${kpi('Movimentações no mês', noMes, 'entradas e saídas')}
    </div>

    ${faltando.length ? `
      <div class="card" style="border-color:rgba(217,119,6,.35);background:var(--warn-soft);margin-bottom:16px">
        <div class="card__head" style="margin-bottom:10px">${icone('alerta')}<h2 style="color:#7a4600">Repor antes que pare a frente</h2></div>
        <div class="chips">${faltando.map(m =>
          `<span class="chip">${esc(m.nome)} · ${saldoMaterial(o, m)} ${esc(m.unidade)}</span>`).join('')}</div>
      </div>` : ''}

    <div class="lista">
      ${o.materiais.map(m => {
        const saldo = saldoMaterial(o, m);
        const baixo = saldo <= m.minimo;
        return linha({
          titulo: esc(m.nome),
          sub: `${esc(m.codigo)} · mínimo ${m.minimo} ${esc(m.unidade)}${m.fornecedor_id ? ' · ' + esc(DB.fornecedorNome(m.fornecedor_id)) : ''}`,
          tag: baixo ? '<span class="tag tag--bad">Repor</span>' : '',
          valor: `<span style="color:var(--${baixo ? 'bad' : 'ink'})">${saldo}</span>`,
          subvalor: esc(m.unidade),
          acao: 'mat:' + m.id,
        });
      }).join('')}
    </div>`);

  $$('[data-lin^="mat:"]').forEach(b => b.addEventListener('click', () =>
    verMaterial(o, o.materiais.find(m => m.id === b.dataset.lin.slice(4)))));
  $('#btnMat')?.addEventListener('click', () => formMaterial(o, null));
}

function verMaterial(o, m) {
  const movs = o.movimentacoes.filter(x => x.material_id === m.id).sort((a, b) => (a.data < b.data ? 1 : -1));
  const saldo = saldoMaterial(o, m);
  const editavel = App.podeEditar();

  modal({
    titulo: m.nome,
    corpo: `
      <div class="grid g-2" style="margin-bottom:14px">
        ${kpi('Saldo atual', `${saldo} ${esc(m.unidade)}`, saldo <= m.minimo ? 'abaixo do mínimo' : 'acima do mínimo')}
        ${kpi('Mínimo', `${m.minimo} ${esc(m.unidade)}`, esc(m.codigo))}
      </div>
      <b style="font-size:12px;display:block;margin-bottom:8px">Movimentações</b>
      <div class="lista">
        ${movs.length ? movs.map(x => linha({
          titulo: `${TIPOS_MOV[x.tipo]} de ${x.qtd} ${esc(m.unidade)}`,
          sub: `${fmtData(x.data)} · ${esc(x.doc || '—')}${x.lote ? ' · lote ' + esc(x.lote) : ''} · ${esc(DB.nome(x.responsavel))}`,
          valor: (x.tipo === 'saida' || x.tipo === 'perda' ? '−' : '+') + x.qtd,
        })).join('') : '<p class="hint">Nenhuma movimentação registrada.</p>'}
      </div>`,
    acoes: [
      { rotulo: 'Fechar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      ...(editavel ? [
        { rotulo: 'Saída', classe: '', aoClicar: (_, f) => { f(); formMovimento(o, m, 'saida'); } },
        { rotulo: 'Entrada', classe: 'btn--dark', aoClicar: (_, f) => { f(); formMovimento(o, m, 'entrada'); } },
      ] : []),
    ],
  });
}

function formMovimento(o, m, tipo) {
  modal({
    titulo: `${TIPOS_MOV[tipo]} de ${m.nome}`,
    corpo: `
      <div class="row2">
        <div class="field"><label for="vQtd">Quantidade (${esc(m.unidade)})</label>
          <input class="inp" type="number" inputmode="decimal" id="vQtd" min="0" step="0.01" placeholder="0"></div>
        <div class="field"><label for="vData">Data</label>
          <input class="inp" type="date" id="vData" value="${hoje()}"></div>
      </div>
      <div class="row2">
        <div class="field"><label for="vTipo">Tipo</label>
          <select class="sel" id="vTipo">${Object.entries(TIPOS_MOV).map(([id, r]) =>
            `<option value="${id}" ${id === tipo ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
        <div class="field"><label for="vDoc">Nota ou requisição</label>
          <input class="inp" id="vDoc" placeholder="${tipo === 'entrada' ? 'NF 12345' : 'RQ-001'}"></div>
      </div>
      <div class="row2">
        <div class="field"><label for="vLote">Lote</label>
          <input class="inp" id="vLote" placeholder="Para rastrear o material"></div>
        <div class="field"><label for="vEtapa">Etapa</label>
          <select class="sel" id="vEtapa">${o.etapas.map(e => `<option value="${e.id}">${esc(e.nome)}</option>`).join('')}</select></div>
      </div>
      <div class="field" style="margin:0"><label for="vObs">Observação</label>
        <input class="inp" id="vObs" placeholder="Conferido por quem, estado do material"></div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Registrar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const qtd = Number($('#vQtd', bg).value || 0);
        if (qtd <= 0) return aviso('Informe a quantidade.', 'bad');
        o.movimentacoes.push({
          id: uid('mov'), material_id: m.id, tipo: $('#vTipo', bg).value, qtd,
          data: $('#vData', bg).value || hoje(), doc: $('#vDoc', bg).value.trim(),
          lote: $('#vLote', bg).value.trim(), etapa: $('#vEtapa', bg).value,
          responsavel: App.usuario.id, obs: $('#vObs', bg).value.trim(),
        });
        DB.salvar(); f();
        aviso(`Saldo de ${m.nome}: ${saldoMaterial(o, m)} ${m.unidade}.`);
        App.rotear();
      } },
    ],
  });
}

function formMaterial(o, m) {
  modal({
    titulo: m ? 'Editar item' : 'Novo item de estoque',
    corpo: `
      <div class="field"><label for="mNome">Material</label>
        <input class="inp" id="mNome" value="${esc(m?.nome || '')}" placeholder="Ex.: argamassa colante AC-III"></div>
      <div class="row3">
        <div class="field"><label for="mCod">Código</label><input class="inp" id="mCod" value="${esc(m?.codigo || '')}" placeholder="MAT-000"></div>
        <div class="field"><label for="mUn">Unidade</label><input class="inp" id="mUn" value="${esc(m?.unidade || '')}" placeholder="sc, m², un"></div>
        <div class="field"><label for="mMin">Mínimo</label><input class="inp" type="number" inputmode="numeric" id="mMin" value="${m?.minimo ?? 10}"></div>
      </div>
      <div class="field" style="margin:0"><label for="mForn">Fornecedor</label>
        <select class="sel" id="mForn"><option value="">Sem fornecedor</option>
          ${DB.dados.fornecedores.map(f => `<option value="${f.id}" ${m?.fornecedor_id === f.id ? 'selected' : ''}>${esc(f.nome)}</option>`).join('')}</select></div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Salvar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const nome = $('#mNome', bg).value.trim();
        if (!nome) return aviso('Informe o material.', 'bad');
        const dados = {
          nome, codigo: $('#mCod', bg).value.trim() || 'MAT-' + (o.materiais.length + 1),
          unidade: $('#mUn', bg).value.trim() || 'un',
          minimo: Number($('#mMin', bg).value || 0),
          fornecedor_id: $('#mForn', bg).value || null,
        };
        if (m) Object.assign(m, dados);
        else o.materiais.push({ id: uid('mat'), etapa: o.etapas[0].id, ...dados });
        DB.salvar(); f(); aviso('Item salvo.'); App.rotear();
      } },
    ],
  });
}

/* ─── compras e fornecedores ──────────────────────────────── */

function telaCompras(o) {
  const chave = 'compras:' + o.id;
  const aba = ESTADO[chave] || 'pedidos';
  const atrasados = pedidosAtrasados(o);
  const emAberto = o.pedidos.filter(p => p.status !== 'entregue');
  const total = o.pedidos.reduce((s, p) => s + p.total, 0);

  topo('Compras', `${o.nome} · ${emAberto.length} pedido(s) em aberto`,
    App.podeEditar() ? `<button class="btn btn--sm" id="btnPedido">${icone('mais')}<span>Pedido</span></button>` : '');

  const estrelas = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  const conteudo = {
    pedidos: () => `<div class="lista">${[...o.pedidos]
      .sort((a, b) => (a.entrega_prevista < b.entrega_prevista ? -1 : 1))
      .map(p => {
        const atrasado = p.status !== 'entregue' && p.entrega_prevista < hoje();
        const st = STATUS_PEDIDO[p.status];
        return linha({
          titulo: esc(p.descricao),
          sub: `${esc(DB.fornecedorNome(p.fornecedor_id))} · entrega ${fmtData(p.entrega_prevista)}${p.entrega_real ? ' · entregue ' + fmtData(p.entrega_real) : ''}`,
          tag: atrasado ? '<span class="tag tag--bad">Atrasado</span>' : `<span class="tag tag--${st.cor}">${st.rotulo}</span>`,
          valor: moeda(p.total),
          acao: 'ped:' + p.id,
        });
      }).join('')}</div>`,

    fornecedores: () => `<div class="lista">${DB.dados.fornecedores.map(f => {
      const meus = o.pedidos.filter(p => p.fornecedor_id === f.id);
      return linha({
        titulo: esc(f.nome),
        sub: `${esc(f.categoria)} · ${esc(f.contato)} · ${esc(f.telefone)}`,
        valor: `<span title="${f.avaliacao} de 5">${estrelas(f.avaliacao)}</span>`,
        subvalor: `${meus.length} pedido(s)`,
      });
    }).join('')}</div>`,
  };

  pintar(`
    <div class="grid g-3" style="margin-bottom:16px">
      ${kpi('Pedidos em aberto', emAberto.length, 'aguardando entrega')}
      ${kpi('Entregas atrasadas', atrasados.length, atrasados.length ? 'cobrar o fornecedor' : 'nenhuma atrasada')}
      ${kpi('Comprado na obra', moeda(total), `${o.pedidos.length} pedido(s)`)}
    </div>

    ${abas('compAbas', [
      { id: 'pedidos', rotulo: 'Pedidos', contador: o.pedidos.length },
      { id: 'fornecedores', rotulo: 'Fornecedores', contador: DB.dados.fornecedores.length },
    ], aba)}

    <div style="margin-top:16px">${conteudo[aba]()}</div>`);

  ligarAbas('compAbas', (nova) => { ESTADO[chave] = nova; telaCompras(o); });
  $$('[data-lin^="ped:"]').forEach(b => b.addEventListener('click', () =>
    verPedido(o, o.pedidos.find(p => p.id === b.dataset.lin.slice(4)))));
  $('#btnPedido')?.addEventListener('click', () => formPedido(o, null));
}

function verPedido(o, p) {
  const editavel = App.podeEditar();
  modal({
    titulo: p.descricao,
    corpo: `
      <div class="obra-card__meta" style="font-size:13.5px;margin-bottom:14px">
        <span class="row"><span>Fornecedor</span><b>${esc(DB.fornecedorNome(p.fornecedor_id))}</b></span>
        <span class="row"><span>Situação</span><b>${STATUS_PEDIDO[p.status].rotulo}</b></span>
        <span class="row"><span>Emitido em</span><b>${fmtData(p.emissao)}</b></span>
        <span class="row"><span>Entrega prevista</span><b>${fmtData(p.entrega_prevista)}</b></span>
        ${p.entrega_real ? `<span class="row"><span>Entregue em</span><b>${fmtData(p.entrega_real)}</b></span>` : ''}
        <span class="row"><span>Valor</span><b>${moeda(p.total)}</b></span>
      </div>
      <div style="background:var(--surface-2);border-radius:10px;padding:12px">
        <b style="font-size:12px;display:block;margin-bottom:3px">Itens</b>
        <span style="font-size:13.5px;color:var(--ink-2)">${esc(p.itens)}</span>
      </div>
      ${editavel ? `<div class="field" style="margin:16px 0 0"><label for="pStatus">Atualizar situação</label>
        <select class="sel" id="pStatus">${Object.entries(STATUS_PEDIDO).map(([id, s]) =>
          `<option value="${id}" ${p.status === id ? 'selected' : ''}>${s.rotulo}</option>`).join('')}</select></div>` : ''}`,
    acoes: [
      { rotulo: 'Fechar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      ...(editavel ? [{ rotulo: 'Salvar', classe: 'btn--dark', aoClicar: (bg, f) => {
        p.status = $('#pStatus', bg).value;
        if (p.status === 'entregue' && !p.entrega_real) p.entrega_real = hoje();
        DB.salvar(); f(); aviso('Pedido atualizado.'); App.rotear();
      } }] : []),
    ],
  });
}

function formPedido(o) {
  modal({
    titulo: 'Novo pedido de compra',
    corpo: `
      <div class="field"><label for="qDesc">O que está sendo comprado</label>
        <input class="inp" id="qDesc" placeholder="Ex.: louças e metais dos banhos"></div>
      <div class="field"><label for="qForn">Fornecedor</label>
        <select class="sel" id="qForn">${DB.dados.fornecedores.map(f => `<option value="${f.id}">${esc(f.nome)}</option>`).join('')}</select></div>
      <div class="row2">
        <div class="field"><label for="qTotal">Valor (R$)</label>
          <input class="inp" type="number" inputmode="decimal" id="qTotal" placeholder="0,00"></div>
        <div class="field"><label for="qEntrega">Entrega prevista</label>
          <input class="inp" type="date" id="qEntrega" value="${maisDias(hoje(), 15)}"></div>
      </div>
      <div class="field"><label for="qStatus">Situação</label>
        <select class="sel" id="qStatus">${Object.entries(STATUS_PEDIDO).map(([id, s]) =>
          `<option value="${id}" ${id === 'cotacao' ? 'selected' : ''}>${s.rotulo}</option>`).join('')}</select></div>
      <div class="field" style="margin:0"><label for="qItens">Itens</label>
        <textarea class="txt" id="qItens" style="min-height:70px" placeholder="Quantidades e especificações."></textarea></div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Criar pedido', classe: 'btn--dark', aoClicar: (bg, f) => {
        const descricao = $('#qDesc', bg).value.trim();
        if (!descricao) return aviso('Descreva o pedido.', 'bad');
        o.pedidos.unshift({
          id: uid('ped'), descricao, fornecedor_id: $('#qForn', bg).value,
          total: Number($('#qTotal', bg).value || 0), status: $('#qStatus', bg).value,
          emissao: hoje(), entrega_prevista: $('#qEntrega', bg).value, entrega_real: null,
          itens: $('#qItens', bg).value.trim(),
        });
        DB.salvar(); f(); aviso('Pedido criado.'); App.rotear();
      } },
    ],
  });
}
