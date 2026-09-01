/* ============================================================
   SPX · módulos de execução e supervisão
   Inspeções de serviço, não conformidades, documentação
   técnica e segurança e meio ambiente.
   ============================================================ */

const GRAVIDADES = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
const STATUS_NC = { aberta: 'Aberta', em_acao: 'Em ação', verificacao: 'Em verificação', encerrada: 'Encerrada' };

/* ─── qualidade: inspeções e não conformidades ────────────── */

function telaQualidade(o) {
  const chave = 'qual:' + o.id;
  const aba = ESTADO[chave] || 'inspecoes';
  const taxa = aprovacaoInspecoes(o);
  const abertas = ncsAbertas(o);
  const inspecoes = [...o.inspecoes].sort((a, b) => (a.data < b.data ? 1 : -1));

  topo('Qualidade', `${o.nome} · ${o.inspecoes.length} inspeção(ões) e ${abertas.length} NC aberta(s)`,
    App.podeEditar() ? `<button class="btn btn--sm btn--accent" id="btnInsp">${icone('mais')}<span>Inspecionar</span></button>` : '');

  const tagResultado = (r) => r === 'aprovado' ? '<span class="tag tag--ok">Aprovado</span>'
    : r === 'ressalva' ? '<span class="tag tag--warn">Com ressalva</span>'
    : '<span class="tag tag--bad">Reprovado</span>';

  const conteudo = {
    inspecoes: () => inspecoes.length ? `<div class="lista">${inspecoes.map(i => linha({
        titulo: esc(i.servico),
        sub: `${esc(i.local)} · ${fmtData(i.data)} · ${esc(DB.nome(i.responsavel))}`,
        tag: tagResultado(i.resultado),
        valor: `${i.itens.filter(x => x.ok).length}/${i.itens.length}`,
        subvalor: 'itens conformes',
        acao: 'insp:' + i.id,
      })).join('')}</div>`
      : vazio('Nenhuma inspeção registrada', 'Cada serviço concluído pode ser verificado com uma ficha própria antes de liberar a próxima etapa.'),

    ncs: () => o.ncs.length ? `<div class="lista">${[...o.ncs]
        .sort((a, b) => (a.status === 'encerrada' ? 1 : 0) - (b.status === 'encerrada' ? 1 : 0))
        .map(n => linha({
          titulo: esc(n.titulo),
          sub: `${esc(GRAVIDADES[n.gravidade])} · aberta em ${fmtData(n.aberta_em)} · ${esc(DB.nome(n.responsavel))}`,
          tag: n.status === 'encerrada' ? '<span class="tag tag--ok">Encerrada</span>'
             : n.prazo < hoje() ? '<span class="tag tag--bad">Vencida</span>'
             : `<span class="tag tag--warn">${esc(STATUS_NC[n.status])}</span>`,
          valor: fmtData(n.prazo),
          subvalor: 'prazo',
          acao: 'nc:' + n.id,
        })).join('')}</div>`
      : vazio('Nenhuma não conformidade', 'Quando uma inspeção reprova um serviço, o registro da correção fica aqui.'),
  };

  pintar(`
    <div class="grid g-3" style="margin-bottom:16px">
      ${kpi('Inspeções aprovadas', taxa === null ? '-' : taxa + '%', `${o.inspecoes.length} inspeção(ões) realizadas`)}
      ${kpi('NC abertas', abertas.length, abertas.length ? 'aguardando correção' : 'nada pendente')}
      ${kpi('NC vencidas', abertas.filter(n => n.prazo < hoje()).length, 'passaram do prazo de ação')}
    </div>

    ${abas('qualAbas', [
      { id: 'inspecoes', rotulo: 'Inspeções', contador: o.inspecoes.length },
      { id: 'ncs', rotulo: 'Não conformidades', contador: o.ncs.length },
    ], aba)}

    <div style="margin-top:16px">${conteudo[aba]()}</div>

    ${aba === 'ncs' && App.podeEditar() ? `<button class="btn btn--block" id="btnNC" style="margin-top:14px">${icone('mais')}Abrir não conformidade</button>` : ''}`);

  ligarAbas('qualAbas', (nova) => { ESTADO[chave] = nova; telaQualidade(o); });
  $$('[data-lin^="insp:"]').forEach(b => b.addEventListener('click', () =>
    verInspecao(o, o.inspecoes.find(i => i.id === b.dataset.lin.slice(5)))));
  $$('[data-lin^="nc:"]').forEach(b => b.addEventListener('click', () =>
    verNC(o, o.ncs.find(n => n.id === b.dataset.lin.slice(3)))));
  $('#btnInsp')?.addEventListener('click', () => formInspecao(o));
  $('#btnNC')?.addEventListener('click', () => formNC(o, null));
}

function verInspecao(o, i) {
  modal({
    titulo: i.servico,
    corpo: `
      <div class="pend__m" style="margin-bottom:14px">
        <span class="tag ${i.resultado === 'aprovado' ? 'tag--ok' : i.resultado === 'ressalva' ? 'tag--warn' : 'tag--bad'}">
          ${i.resultado === 'aprovado' ? 'Aprovado' : i.resultado === 'ressalva' ? 'Aprovado com ressalva' : 'Reprovado'}</span>
        <span>${esc(i.local)}</span><span>${fmtData(i.data)}</span><span>${esc(DB.nome(i.responsavel))}</span>
      </div>
      <div class="lista">
        ${i.itens.map(x => `
          <div class="lin lin--parado">
            <span class="lin__i" style="background:var(--${x.ok ? 'ok' : 'bad'}-soft);color:var(--${x.ok ? 'ok' : 'bad'})">
              ${icone(x.ok ? 'ok' : 'x')}</span>
            <span class="lin__t"><b style="font-weight:500;font-size:13.5px">${esc(x.texto)}</b></span>
          </div>`).join('')}
      </div>
      ${i.obs ? `<div style="background:var(--surface-2);border-radius:10px;padding:12px;margin-top:14px">
        <b style="font-size:12px;display:block;margin-bottom:3px">Observação</b>
        <span style="font-size:13.5px;color:var(--ink-2)">${esc(i.obs)}</span></div>` : ''}`,
    acoes: [{ rotulo: 'Fechar', classe: 'btn--ghost', aoClicar: (_, f) => f() }],
  });
}

function formInspecao(o) {
  const tipos = Object.entries(FVS);

  const listaItens = (fvs) => FVS[fvs].itens.map((t, j) => `
    <label class="lin" style="cursor:pointer">
      <input type="checkbox" data-item="${j}" checked style="width:20px;height:20px;accent-color:var(--ink);flex:none">
      <span class="lin__t"><b style="font-weight:500;font-size:13.5px">${esc(t)}</b></span>
    </label>`).join('');

  const m = modal({
    titulo: 'Nova inspeção de serviço',
    corpo: `
      <div class="field"><label for="iFvs">Serviço a verificar</label>
        <select class="sel" id="iFvs">${tipos.map(([id, t]) => `<option value="${id}">${esc(t.rotulo)}</option>`).join('')}</select></div>
      <div class="row2">
        <div class="field"><label for="iLocal">Local</label>
          <input class="inp" id="iLocal" placeholder="Ex.: banho da suíte"></div>
        <div class="field"><label for="iData">Data</label>
          <input class="inp" type="date" id="iData" value="${hoje()}"></div>
      </div>
      <div class="field"><label>Itens verificados</label>
        <div class="lista" id="iItens">${listaItens(tipos[0][0])}</div>
        <p class="hint">Desmarque o que não estiver conforme. O resultado sai automaticamente.</p></div>
      <div class="field" style="margin:0"><label for="iObs">Observação</label>
        <textarea class="txt" id="iObs" style="min-height:70px" placeholder="O que precisa ser corrigido ou acompanhado."></textarea></div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Registrar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const fvs = $('#iFvs', bg).value;
        const local = $('#iLocal', bg).value.trim();
        if (!local) return aviso('Informe o local inspecionado.', 'bad');

        const itens = FVS[fvs].itens.map((texto, j) => ({ texto, ok: $(`[data-item="${j}"]`, bg).checked }));
        const falhas = itens.filter(x => !x.ok).length;
        const insp = {
          id: uid('insp'), fvs, servico: FVS[fvs].rotulo, local,
          etapa: (o.etapas.find(e => e.progresso > 0 && e.progresso < 100) || o.etapas[0]).id,
          data: $('#iData', bg).value || hoje(),
          responsavel: App.usuario.id, itens,
          resultado: falhas === 0 ? 'aprovado' : falhas === 1 ? 'ressalva' : 'reprovado',
          obs: $('#iObs', bg).value.trim(), nc_id: null,
        };
        o.inspecoes.push(insp);
        DB.salvar();
        f();
        aviso(`Inspeção ${falhas === 0 ? 'aprovada' : falhas === 1 ? 'registrada com ressalva' : 'reprovada'}.`,
          falhas > 1 ? 'bad' : 'ok');

        /* Serviço com item não conforme já abre a não conformidade. */
        if (falhas) {
          formNC(o, null, {
            titulo: `${insp.servico} · ${local}`,
            descricao: `Itens não conformes na inspeção de ${fmtData(insp.data)}: ${itens.filter(x => !x.ok).map(x => x.texto).join('; ')}.`,
            etapa: insp.etapa,
            gravidade: falhas > 1 ? 'alta' : 'media',
          });
        } else App.rotear();
      } },
    ],
  });

  /* Trocar o serviço troca só a lista de itens. */
  $('#iFvs', m.fundo).addEventListener('change', (e) => {
    $('#iItens', m.fundo).innerHTML = listaItens(e.target.value);
  });
}

function verNC(o, n) {
  const podeAgir = App.podeEditar();
  modal({
    titulo: n.titulo,
    corpo: `
      <p style="font-size:14px;color:var(--ink-2);margin-bottom:12px">${esc(n.descricao)}</p>
      <div style="background:var(--surface-2);border-radius:10px;padding:12px;margin-bottom:14px">
        <b style="font-size:12px;display:block;margin-bottom:3px">Ação corretiva</b>
        <span style="font-size:13.5px;color:var(--ink-2)">${esc(n.acao)}</span>
      </div>
      <div class="obra-card__meta" style="font-size:13.5px">
        <span class="row"><span>Gravidade</span><b>${esc(GRAVIDADES[n.gravidade])}</b></span>
        <span class="row"><span>Situação</span><b>${esc(STATUS_NC[n.status])}</b></span>
        <span class="row"><span>Responsável</span><b>${esc(DB.nome(n.responsavel))}</b></span>
        <span class="row"><span>Aberta em</span><b>${fmtData(n.aberta_em)}</b></span>
        <span class="row"><span>Prazo</span><b>${fmtData(n.prazo)}</b></span>
        ${n.fechada_em ? `<span class="row"><span>Encerrada em</span><b>${fmtData(n.fechada_em)}</b></span>` : ''}
      </div>`,
    acoes: [
      { rotulo: 'Fechar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      ...(podeAgir && n.status !== 'encerrada' ? [
        { rotulo: 'Editar', classe: '', aoClicar: (_, f) => { f(); formNC(o, n); } },
        { rotulo: 'Encerrar', classe: 'btn--dark', aoClicar: (_, f) => {
          n.status = 'encerrada'; n.fechada_em = hoje();
          DB.salvar(); f(); aviso('Não conformidade encerrada.'); App.rotear();
        } },
      ] : []),
    ],
  });
}

function formNC(o, n, pre = {}) {
  modal({
    titulo: n ? 'Editar não conformidade' : 'Abrir não conformidade',
    corpo: `
      <div class="field"><label for="nTit">O que está não conforme</label>
        <input class="inp" id="nTit" value="${esc(n?.titulo || pre.titulo || '')}"></div>
      <div class="field"><label for="nDesc">Descrição</label>
        <textarea class="txt" id="nDesc" style="min-height:80px">${esc(n?.descricao || pre.descricao || '')}</textarea></div>
      <div class="field"><label for="nAcao">Ação corretiva</label>
        <textarea class="txt" id="nAcao" style="min-height:70px" placeholder="O que será feito para corrigir e evitar a repetição.">${esc(n?.acao || '')}</textarea></div>
      <div class="row2">
        <div class="field"><label for="nGrav">Gravidade</label>
          <select class="sel" id="nGrav">${Object.entries(GRAVIDADES).map(([id, r]) =>
            `<option value="${id}" ${(n?.gravidade || pre.gravidade) === id ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
        <div class="field"><label for="nPrazo">Prazo</label>
          <input class="inp" type="date" id="nPrazo" value="${n?.prazo || maisDias(hoje(), 7)}"></div>
      </div>
      <div class="row2">
        <div class="field"><label for="nResp">Responsável</label>
          <select class="sel" id="nResp">${DB.dados.usuarios.map(u =>
            `<option value="${u.id}" ${(n?.responsavel || App.usuario.id) === u.id ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select></div>
        <div class="field"><label for="nStatus">Situação</label>
          <select class="sel" id="nStatus">${Object.entries(STATUS_NC).map(([id, r]) =>
            `<option value="${id}" ${(n?.status || 'aberta') === id ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
      </div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => { f(); App.rotear(); } },
      { rotulo: 'Salvar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const titulo = $('#nTit', bg).value.trim();
        if (!titulo) return aviso('Informe o que está não conforme.', 'bad');
        const dados = {
          titulo, descricao: $('#nDesc', bg).value.trim(), acao: $('#nAcao', bg).value.trim(),
          gravidade: $('#nGrav', bg).value, prazo: $('#nPrazo', bg).value,
          responsavel: $('#nResp', bg).value, status: $('#nStatus', bg).value,
          etapa: n?.etapa || pre.etapa || o.etapas[0].id,
        };
        if (n) Object.assign(n, dados);
        else o.ncs.push({ id: uid('nc'), aberta_em: hoje(), fechada_em: null, ...dados });
        DB.salvar(); f(); aviso('Não conformidade registrada.'); App.rotear();
      } },
    ],
  });
}

/* ─── documentação técnica ────────────────────────────────── */

function telaDocumentos(o) {
  const chave = 'doc:' + o.id;
  const aba = ESTADO[chave] || 'documentos';
  const editavel = App.podeEditar() || App.usuario.papel === 'arquiteto';
  const vigentes = o.documentos.filter(d => d.status !== 'obsoleto');
  const impactoDias = o.alteracoes.filter(a => a.status === 'aprovada').reduce((s, a) => s + a.dias, 0);
  const impactoCusto = o.alteracoes.filter(a => a.status === 'aprovada').reduce((s, a) => s + a.custo, 0);

  topo('Documentação', `${o.nome} · ${vigentes.length} documento(s) vigente(s)`,
    editavel ? `<button class="btn btn--sm" id="btnDoc">${icone('mais')}<span>Documento</span></button>` : '');

  const conteudo = {
    documentos: () => `<div class="lista">${o.documentos.map(d => linha({
        titulo: `${esc(d.codigo)} · ${esc(d.titulo)}`,
        sub: `${docRotulo(d.tipo)} · ${esc(d.disciplina)} · ${fmtData(d.data)} · ${esc(DB.nome(d.autor))}`,
        tag: `<span class="tag tag--${STATUS_DOC[d.status].cor}">${STATUS_DOC[d.status].rotulo}</span>`,
        valor: 'rev. ' + d.revisao,
        acao: 'doc:' + d.id,
      })).join('')}</div>`,

    alteracoes: () => `
      <div class="grid g-2" style="margin-bottom:16px">
        ${kpi('Impacto no prazo', impactoDias + ' dias', 'somando as alterações aprovadas')}
        ${kpi('Impacto no custo', moeda(impactoCusto), 'somando as alterações aprovadas')}
      </div>
      <div class="lista">${o.alteracoes.map(a => linha({
        titulo: esc(a.descricao),
        sub: `${fmtData(a.data)} · ${esc(a.motivo)} · pedido de ${esc(DB.nome(a.solicitante))}${a.documento ? ' · ' + esc(a.documento) : ''}`,
        tag: a.status === 'aprovada' ? '<span class="tag tag--ok">Aprovada</span>'
           : a.status === 'recusada' ? '<span class="tag tag--bad">Recusada</span>'
           : '<span class="tag tag--warn">Proposta</span>',
        valor: moeda(a.custo),
        subvalor: `+${a.dias} dia(s)`,
        acao: editavel ? 'alt:' + a.id : '',
      })).join('')}</div>
      ${editavel ? `<button class="btn btn--block" id="btnAlt" style="margin-top:14px">${icone('mais')}Registrar alteração</button>` : ''}`,
  };

  pintar(`
    ${abas('docAbas', [
      { id: 'documentos', rotulo: 'Documentos', contador: o.documentos.length },
      { id: 'alteracoes', rotulo: 'Alterações', contador: o.alteracoes.length },
    ], aba)}
    <div style="margin-top:16px">${conteudo[aba]()}</div>`);

  ligarAbas('docAbas', (nova) => { ESTADO[chave] = nova; telaDocumentos(o); });
  $$('[data-lin^="doc:"]').forEach(b => b.addEventListener('click', () =>
    verDocumento(o, o.documentos.find(d => d.id === b.dataset.lin.slice(4)))));
  $$('[data-lin^="alt:"]').forEach(b => b.addEventListener('click', () =>
    formAlteracao(o, o.alteracoes.find(a => a.id === b.dataset.lin.slice(4)))));
  $('#btnDoc')?.addEventListener('click', () => formDocumento(o, null));
  $('#btnAlt')?.addEventListener('click', () => formAlteracao(o, null));
}

function verDocumento(o, d) {
  const editavel = App.podeEditar() || App.usuario.papel === 'arquiteto';
  modal({
    titulo: `${d.codigo} · rev. ${d.revisao}`,
    corpo: `
      <p style="font-size:15px;font-weight:600;margin-bottom:10px">${esc(d.titulo)}</p>
      <div class="obra-card__meta" style="font-size:13.5px;margin-bottom:14px">
        <span class="row"><span>Tipo</span><b>${docRotulo(d.tipo)}</b></span>
        <span class="row"><span>Disciplina</span><b>${esc(d.disciplina)}</b></span>
        <span class="row"><span>Situação</span><b>${STATUS_DOC[d.status].rotulo}</b></span>
        <span class="row"><span>Emitido em</span><b>${fmtData(d.data)}</b></span>
        <span class="row"><span>Autor</span><b>${esc(DB.nome(d.autor))}</b></span>
      </div>
      ${d.historico?.length ? `
        <b style="font-size:12px;display:block;margin-bottom:8px">Histórico de revisões</b>
        <div class="lista">${d.historico.map(h => linha({
          titulo: `Revisão ${esc(h.rev)}`, sub: `${esc(h.nota)} · ${esc(DB.nome(h.por))}`, valor: fmtData(h.data),
        })).join('')}</div>` : '<p class="hint">Sem revisões anteriores registradas.</p>'}`,
    acoes: [
      { rotulo: 'Fechar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      ...(editavel ? [{ rotulo: 'Nova revisão', classe: 'btn--dark', aoClicar: (_, f) => { f(); formRevisao(o, d); } }] : []),
    ],
  });
}

function formRevisao(o, d) {
  const prox = String(Number(d.revisao) + 1).padStart(2, '0');
  modal({
    titulo: `Nova revisão de ${d.codigo}`,
    corpo: `
      <div class="row2">
        <div class="field"><label for="vRev">Revisão</label><input class="inp" id="vRev" value="${prox}"></div>
        <div class="field"><label for="vData">Data</label><input class="inp" type="date" id="vData" value="${hoje()}"></div>
      </div>
      <div class="field"><label for="vNota">O que mudou</label>
        <textarea class="txt" id="vNota" style="min-height:80px" placeholder="Descreva a alteração desta revisão."></textarea></div>
      <div class="field" style="margin:0"><label for="vStatus">Situação</label>
        <select class="sel" id="vStatus">
          <option value="em_analise">Em análise</option>
          <option value="aprovado">Aprovado</option>
          <option value="para_obra" selected>Liberado para obra</option>
        </select></div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Publicar revisão', classe: 'btn--dark', aoClicar: (bg, f) => {
        const nota = $('#vNota', bg).value.trim();
        if (!nota) return aviso('Descreva o que mudou nesta revisão.', 'bad');
        d.historico = d.historico || [];
        d.historico.unshift({ rev: $('#vRev', bg).value, data: $('#vData', bg).value, nota, por: App.usuario.id });
        d.revisao = $('#vRev', bg).value;
        d.data = $('#vData', bg).value;
        d.status = $('#vStatus', bg).value;
        d.autor = App.usuario.id;
        DB.salvar(); f(); aviso(`${d.codigo} agora está na revisão ${d.revisao}.`); App.rotear();
      } },
    ],
  });
}

function formDocumento(o, d) {
  modal({
    titulo: d ? 'Editar documento' : 'Novo documento',
    corpo: `
      <div class="row2">
        <div class="field"><label for="dCod">Código</label><input class="inp" id="dCod" value="${esc(d?.codigo || '')}" placeholder="ARQ-EXE-01"></div>
        <div class="field"><label for="dRev">Revisão</label><input class="inp" id="dRev" value="${esc(d?.revisao || '00')}"></div>
      </div>
      <div class="field"><label for="dTit">Título</label><input class="inp" id="dTit" value="${esc(d?.titulo || '')}"></div>
      <div class="row2">
        <div class="field"><label for="dTipo">Tipo</label>
          <select class="sel" id="dTipo">${TIPOS_DOC.map(t => `<option value="${t.id}" ${d?.tipo === t.id ? 'selected' : ''}>${esc(t.rotulo)}</option>`).join('')}</select></div>
        <div class="field"><label for="dDisc">Disciplina</label><input class="inp" id="dDisc" value="${esc(d?.disciplina || 'Arquitetura')}"></div>
      </div>
      <div class="field" style="margin:0"><label for="dStatus">Situação</label>
        <select class="sel" id="dStatus">${Object.entries(STATUS_DOC).map(([id, s]) =>
          `<option value="${id}" ${d?.status === id ? 'selected' : ''}>${s.rotulo}</option>`).join('')}</select></div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Salvar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const codigo = $('#dCod', bg).value.trim(), titulo = $('#dTit', bg).value.trim();
        if (!codigo || !titulo) return aviso('Informe o código e o título.', 'bad');
        const dados = {
          codigo, titulo, revisao: $('#dRev', bg).value.trim() || '00',
          tipo: $('#dTipo', bg).value, disciplina: $('#dDisc', bg).value.trim(),
          status: $('#dStatus', bg).value, autor: App.usuario.id, data: hoje(),
        };
        if (d) Object.assign(d, dados);
        else o.documentos.unshift({ id: uid('doc'), historico: [], ...dados });
        DB.salvar(); f(); aviso('Documento salvo.'); App.rotear();
      } },
    ],
  });
}

function formAlteracao(o, a) {
  modal({
    titulo: a ? 'Alteração de escopo' : 'Registrar alteração',
    corpo: `
      <div class="field"><label for="aDesc">O que mudou</label>
        <input class="inp" id="aDesc" value="${esc(a?.descricao || '')}" placeholder="Ex.: troca do rodapé da área social"></div>
      <div class="field"><label for="aMot">Motivo</label>
        <input class="inp" id="aMot" value="${esc(a?.motivo || '')}" placeholder="Pedido do cliente, revisão de projeto, imprevisto"></div>
      <div class="row2">
        <div class="field"><label for="aDias">Impacto no prazo (dias)</label>
          <input class="inp" type="number" inputmode="numeric" id="aDias" value="${a?.dias ?? 0}"></div>
        <div class="field"><label for="aCusto">Impacto no custo (R$)</label>
          <input class="inp" type="number" inputmode="decimal" id="aCusto" value="${a?.custo ?? 0}"></div>
      </div>
      <div class="row2">
        <div class="field"><label for="aQuem">Solicitante</label>
          <select class="sel" id="aQuem">${DB.dados.usuarios.map(u =>
            `<option value="${u.id}" ${(a?.solicitante || App.usuario.id) === u.id ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select></div>
        <div class="field"><label for="aStatus">Situação</label>
          <select class="sel" id="aStatus">
            <option value="proposta" ${a?.status === 'proposta' ? 'selected' : ''}>Proposta</option>
            <option value="aprovada" ${a?.status === 'aprovada' ? 'selected' : ''}>Aprovada</option>
            <option value="recusada" ${a?.status === 'recusada' ? 'selected' : ''}>Recusada</option>
          </select></div>
      </div>
      <div class="field" style="margin:0"><label for="aDoc">Documento de referência</label>
        <input class="inp" id="aDoc" value="${esc(a?.documento || '')}" placeholder="ARQ-EXE-01 rev. 04"></div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Salvar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const descricao = $('#aDesc', bg).value.trim();
        if (!descricao) return aviso('Descreva a alteração.', 'bad');
        const dados = {
          descricao, motivo: $('#aMot', bg).value.trim(),
          dias: Number($('#aDias', bg).value || 0), custo: Number($('#aCusto', bg).value || 0),
          solicitante: $('#aQuem', bg).value, status: $('#aStatus', bg).value,
          documento: $('#aDoc', bg).value.trim(), data: a?.data || hoje(),
        };
        if (a) Object.assign(a, dados); else o.alteracoes.unshift({ id: uid('alt'), ...dados });
        DB.salvar(); f(); aviso('Alteração registrada.'); App.rotear();
      } },
    ],
  });
}

/* ─── segurança e meio ambiente ───────────────────────────── */

function telaSSMA(o) {
  const chave = 'ssma:' + o.id;
  const aba = ESTADO[chave] || 'checklists';
  const s = o.ssma;
  const conf = conformidadeNR(o);
  const noMes = s.dds.filter(d => difDias(d.data, hoje()) <= 30).length;
  const volume = s.residuos.reduce((t, r) => t + r.volume, 0);

  topo('Segurança e meio ambiente', `${o.nome} · ${diasSemAcidente(o)} dias sem acidente`,
    App.podeEditar() ? `<button class="btn btn--sm" id="btnSsma">${icone('mais')}<span>Registrar</span></button>` : '');

  const pct = (c) => Math.round((c.itens.filter(i => i.ok).length / c.itens.length) * 100);

  const conteudo = {
    checklists: () => `<div class="lista">${s.checklists.map(c => linha({
        titulo: `${esc(c.norma)} · ${esc(NORMAS_NR[c.norma].titulo)}`,
        sub: `${fmtData(c.data)} · ${esc(DB.nome(c.responsavel))}`,
        tag: pct(c) === 100 ? '<span class="tag tag--ok">Conforme</span>' : '<span class="tag tag--warn">Com pendência</span>',
        valor: pct(c) + '%',
        subvalor: 'conformidade',
        acao: 'nr:' + c.id,
      })).join('')}</div>`,

    dds: () => `<div class="lista">${s.dds.map(d => linha({
        titulo: esc(d.tema),
        sub: `${fmtData(d.data)} · conduzido por ${esc(DB.nome(d.responsavel))}`,
        valor: d.participantes,
        subvalor: 'presentes',
      })).join('')}</div>
      <p class="hint" style="margin-top:12px">Diálogo diário de segurança: o tema conversado com a equipe antes de começar o dia.</p>`,

    ocorrencias: () => s.ocorrencias.length
      ? `<div class="lista">${s.ocorrencias.map(x => `
          <div class="card">
            <div class="card__head" style="margin-bottom:8px">
              <h3 style="font-size:14px">${x.tipo === 'quase_acidente' ? 'Quase acidente'
                : x.tipo === 'ambiental' ? 'Ocorrência ambiental' : 'Acidente'}</h3>
              <span class="tag tag--${x.gravidade === 'alta' ? 'bad' : 'warn'}">${fmtData(x.data)}</span>
            </div>
            <p style="font-size:13.5px;color:var(--ink-2);margin-bottom:10px">${esc(x.descricao)}</p>
            <div style="background:var(--surface-2);border-radius:10px;padding:11px">
              <b style="font-size:12px;display:block;margin-bottom:3px">Ação tomada</b>
              <span style="font-size:13px;color:var(--ink-2)">${esc(x.acao)}</span>
            </div>
          </div>`).join('')}</div>`
      : vazio('Nenhuma ocorrência registrada', 'Quase acidentes também entram aqui: são eles que evitam o acidente seguinte.'),

    residuos: () => `<div class="lista">${s.residuos.map(r => linha({
        titulo: esc((CLASSES_RESIDUO.find(c => c.id === r.classe) || {}).rotulo || r.classe),
        sub: `${fmtData(r.data)} · ${esc(r.destinacao)} · ${esc(r.cdf)}`,
        valor: r.volume + ' m³',
      })).join('')}</div>
      <p class="hint" style="margin-top:12px">O CDF é o controle de transporte e destinação emitido pelo receptor licenciado.</p>`,
  };

  pintar(`
    <div class="grid g-4" style="margin-bottom:16px">
      ${kpi('Dias sem acidente', diasSemAcidente(o), 'desde o início da obra')}
      ${kpi('Conformidade NR', conf === null ? '-' : conf + '%', `${s.checklists.length} verificação(ões)`)}
      ${kpi('DDS no mês', noMes, 'diálogos de segurança')}
      ${kpi('Resíduos destinados', volume + ' m³', 'com CDF emitido')}
    </div>

    ${abas('ssmaAbas', [
      { id: 'checklists', rotulo: 'Normas NR', contador: s.checklists.length },
      { id: 'dds', rotulo: 'DDS', contador: s.dds.length },
      { id: 'ocorrencias', rotulo: 'Ocorrências', contador: s.ocorrencias.length },
      { id: 'residuos', rotulo: 'Resíduos', contador: s.residuos.length },
    ], aba)}

    <div style="margin-top:16px">${conteudo[aba]()}</div>`);

  ligarAbas('ssmaAbas', (nova) => { ESTADO[chave] = nova; telaSSMA(o); });
  $$('[data-lin^="nr:"]').forEach(b => b.addEventListener('click', () => {
    const c = s.checklists.find(x => x.id === b.dataset.lin.slice(3));
    modal({
      titulo: `${c.norma} · ${NORMAS_NR[c.norma].titulo}`,
      corpo: `<div class="lista">${c.itens.map(i => `
        <div class="lin lin--parado">
          <span class="lin__i" style="background:var(--${i.ok ? 'ok' : 'bad'}-soft);color:var(--${i.ok ? 'ok' : 'bad'})">${icone(i.ok ? 'ok' : 'x')}</span>
          <span class="lin__t"><b style="font-weight:500;font-size:13.5px">${esc(i.texto)}</b></span>
        </div>`).join('')}</div>
        <p class="hint" style="margin-top:12px">Verificado em ${fmtData(c.data)} por ${esc(DB.nome(c.responsavel))}.</p>`,
      acoes: [{ rotulo: 'Fechar', classe: 'btn--ghost', aoClicar: (_, f) => f() }],
    });
  }));

  $('#btnSsma')?.addEventListener('click', () => registrarSSMA(o, aba));
}

function registrarSSMA(o, aba) {
  const s = o.ssma;

  if (aba === 'dds') return modal({
    titulo: 'Registrar DDS',
    corpo: `
      <div class="field"><label for="dTema">Tema conversado</label>
        <input class="inp" id="dTema" placeholder="Ex.: uso do cinto no andaime"></div>
      <div class="row2">
        <div class="field"><label for="dData">Data</label><input class="inp" type="date" id="dData" value="${hoje()}"></div>
        <div class="field"><label for="dPart">Participantes</label>
          <input class="inp" type="number" inputmode="numeric" id="dPart" value="${o.recursos.equipe.filter(p => p.ativo).length}"></div>
      </div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Registrar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const tema = $('#dTema', bg).value.trim();
        if (!tema) return aviso('Informe o tema.', 'bad');
        s.dds.unshift({ id: uid('dds'), tema, data: $('#dData', bg).value, participantes: Number($('#dPart', bg).value || 0), responsavel: App.usuario.id });
        DB.salvar(); f(); aviso('DDS registrado.'); App.rotear();
      } },
    ],
  });

  if (aba === 'ocorrencias') return modal({
    titulo: 'Registrar ocorrência',
    corpo: `
      <div class="row2">
        <div class="field"><label for="oTipo">Tipo</label>
          <select class="sel" id="oTipo">
            <option value="quase_acidente">Quase acidente</option>
            <option value="acidente_sem">Acidente sem afastamento</option>
            <option value="acidente_com">Acidente com afastamento</option>
            <option value="ambiental">Ocorrência ambiental</option>
          </select></div>
        <div class="field"><label for="oData">Data</label><input class="inp" type="date" id="oData" value="${hoje()}"></div>
      </div>
      <div class="field"><label for="oDesc">O que aconteceu</label>
        <textarea class="txt" id="oDesc" style="min-height:90px"></textarea></div>
      <div class="field" style="margin:0"><label for="oAcao">Ação tomada</label>
        <textarea class="txt" id="oAcao" style="min-height:70px"></textarea></div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Registrar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const descricao = $('#oDesc', bg).value.trim();
        if (!descricao) return aviso('Descreva a ocorrência.', 'bad');
        const tipo = $('#oTipo', bg).value;
        s.ocorrencias.unshift({
          id: uid('oc'), tipo, data: $('#oData', bg).value, descricao,
          acao: $('#oAcao', bg).value.trim(),
          gravidade: tipo === 'acidente_com' ? 'alta' : tipo === 'quase_acidente' ? 'media' : 'alta',
        });
        DB.salvar(); f(); aviso('Ocorrência registrada.', 'bad'); App.rotear();
      } },
    ],
  });

  if (aba === 'residuos') return modal({
    titulo: 'Registrar destinação de resíduo',
    corpo: `
      <div class="field"><label for="sClasse">Classe</label>
        <select class="sel" id="sClasse">${CLASSES_RESIDUO.map(c => `<option value="${c.id}">${esc(c.rotulo)}</option>`).join('')}</select></div>
      <div class="row2">
        <div class="field"><label for="sVol">Volume (m³)</label><input class="inp" type="number" inputmode="decimal" id="sVol" value="1"></div>
        <div class="field"><label for="sData">Data</label><input class="inp" type="date" id="sData" value="${hoje()}"></div>
      </div>
      <div class="field"><label for="sDest">Destinação</label>
        <input class="inp" id="sDest" placeholder="Aterro licenciado, cooperativa, receptor"></div>
      <div class="field" style="margin:0"><label for="sCdf">Número do CDF</label>
        <input class="inp" id="sCdf" placeholder="CDF-2026-0000"></div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Registrar', classe: 'btn--dark', aoClicar: (bg, f) => {
        s.residuos.unshift({
          id: uid('res'), classe: $('#sClasse', bg).value,
          volume: Number($('#sVol', bg).value || 0), data: $('#sData', bg).value,
          destinacao: $('#sDest', bg).value.trim() || 'Receptor licenciado',
          cdf: $('#sCdf', bg).value.trim() || '-',
        });
        DB.salvar(); f(); aviso('Destinação registrada.'); App.rotear();
      } },
    ],
  });

  /* checklist de norma */
  const normas = Object.keys(NORMAS_NR);
  let atual = normas[0];
  const listaItens = (n) => NORMAS_NR[n].itens.map((t, j) => `
    <label class="lin" style="cursor:pointer">
      <input type="checkbox" data-nr="${j}" checked style="width:20px;height:20px;accent-color:var(--ink);flex:none">
      <span class="lin__t"><b style="font-weight:500;font-size:13.5px">${esc(t)}</b></span>
    </label>`).join('');

  const m = modal({
    titulo: 'Verificação de norma',
    corpo: `
      <div class="row2">
        <div class="field"><label for="kNorma">Norma</label>
          <select class="sel" id="kNorma">${normas.map(n => `<option value="${n}">${n} · ${esc(NORMAS_NR[n].titulo)}</option>`).join('')}</select></div>
        <div class="field"><label for="kData">Data</label><input class="inp" type="date" id="kData" value="${hoje()}"></div>
      </div>
      <div class="field" style="margin:0"><label>Itens verificados</label>
        <div class="lista" id="kItens">${listaItens(atual)}</div>
        <p class="hint">Desmarque o que estiver irregular no canteiro.</p></div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Registrar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const norma = $('#kNorma', bg).value;
        s.checklists.unshift({
          id: uid('nr'), norma, data: $('#kData', bg).value, responsavel: App.usuario.id,
          itens: NORMAS_NR[norma].itens.map((texto, j) => ({ texto, ok: $(`[data-nr="${j}"]`, bg).checked })),
        });
        DB.salvar(); f(); aviso('Verificação registrada.'); App.rotear();
      } },
    ],
  });

  $('#kNorma', m.fundo).addEventListener('change', (e) => {
    $('#kItens', m.fundo).innerHTML = listaItens(e.target.value);
  });
}
