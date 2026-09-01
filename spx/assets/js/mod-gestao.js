/* ============================================================
   SPX · gestão
   Fluxo de aprovação digital e painel de desempenho.
   ============================================================ */

/* ─── aprovações ──────────────────────────────────────────── */

function telaAprovacoes(o) {
  const minhas = aprovacoesPendentes(o, App.usuario.papel);
  const outras = aprovacoesPendentes(o).filter(a => a.aprovador !== App.usuario.papel);
  const decididas = o.aprovacoes.filter(a => a.status !== 'pendente')
    .sort((a, b) => (a.decidido_em < b.decidido_em ? 1 : -1));

  topo('Aprovações', `${o.nome} · ${minhas.length + outras.length} aguardando decisão`,
    App.usuario.papel !== 'cliente' ? `<button class="btn btn--sm" id="btnAprov">${icone('mais')}<span>Solicitar</span></button>` : '');

  const cartao = (a, destaque = false) => `
    <div class="card" ${destaque ? 'style="border-color:rgba(217,119,6,.4)"' : ''}>
      <div class="card__head" style="margin-bottom:8px">
        <span class="tag tag--accent">${aprovacaoRotulo(a.tipo)}</span>
        <h3 style="font-size:14.5px;flex:1">${esc(a.titulo)}</h3>
        ${a.status === 'pendente'
          ? `<span class="tag ${a.prazo < hoje() ? 'tag--bad' : 'tag--warn'}">${a.prazo < hoje() ? 'Vencida' : 'Até ' + fmtData(a.prazo)}</span>`
          : `<span class="tag tag--${a.status === 'aprovado' ? 'ok' : 'bad'}">${a.status === 'aprovado' ? 'Aprovado' : 'Reprovado'}</span>`}
      </div>
      <p style="font-size:13.5px;color:var(--ink-2)">${esc(a.descricao)}</p>
      ${a.valor ? `<p style="font-size:15px;font-weight:600;margin-top:10px">${moeda(a.valor)}</p>` : ''}
      <div class="pend__m" style="margin-top:10px">
        <span>Pedido de ${esc(DB.nome(a.solicitante))}</span>
        <span>Decide: ${esc(PAPEIS[a.aprovador].rotulo)}</span>
        ${a.decidido_em ? `<span>${a.status === 'aprovado' ? 'Aprovado' : 'Reprovado'} por ${esc(DB.nome(a.decidido_por))} em ${fmtData(a.decidido_em)}</span>` : ''}
      </div>
      ${a.comentario ? `<p class="hint" style="margin-top:8px">“${esc(a.comentario)}”</p>` : ''}
      ${destaque ? `
        <div style="display:flex;gap:9px;margin-top:14px;flex-wrap:wrap">
          <button class="btn btn--dark" style="flex:1" data-ok="${a.id}">${icone('ok')}Aprovar</button>
          <button class="btn btn--bad" style="flex:1" data-no="${a.id}">${icone('x')}Reprovar</button>
        </div>` : ''}
    </div>`;

  pintar(`
    ${minhas.length ? `
      <div class="sec-t"><h2>Esperando a sua decisão</h2><span class="tag tag--bad">${minhas.length}</span></div>
      <div class="grid" style="gap:12px;margin-bottom:8px">${minhas.map(a => cartao(a, true)).join('')}</div>` : ''}

    ${outras.length ? `
      <div class="sec-t"><h2>Aguardando outras pessoas</h2></div>
      <div class="grid" style="gap:12px">${outras.map(a => cartao(a)).join('')}</div>` : ''}

    ${!minhas.length && !outras.length ? vazio('Nada aguardando decisão', 'Projetos, orçamentos, aditivos e medições enviados para aprovação aparecem aqui.') : ''}

    ${decididas.length ? `
      <div class="sec-t"><h2>Histórico</h2></div>
      <div class="grid" style="gap:12px">${decididas.map(a => cartao(a)).join('')}</div>` : ''}`);

  $$('[data-ok]').forEach(b => b.addEventListener('click', () => decidir(o, b.dataset.ok, 'aprovado')));
  $$('[data-no]').forEach(b => b.addEventListener('click', () => decidir(o, b.dataset.no, 'reprovado')));
  $('#btnAprov')?.addEventListener('click', () => formAprovacao(o));
}

function decidir(o, id, decisao) {
  const a = o.aprovacoes.find(x => x.id === id);
  modal({
    titulo: decisao === 'aprovado' ? 'Aprovar' : 'Reprovar',
    corpo: `
      <p style="font-size:14px;font-weight:600;margin-bottom:4px">${esc(a.titulo)}</p>
      <p style="font-size:13.5px;color:var(--ink-2);margin-bottom:14px">${esc(a.descricao)}</p>
      <div class="field" style="margin:0"><label for="apCom">Comentário ${decisao === 'reprovado' ? '(explique o motivo)' : '(opcional)'}</label>
        <textarea class="txt" id="apCom" style="min-height:80px"></textarea></div>
      <p class="hint" style="margin-top:10px">A decisão fica registrada com o seu nome, a data e a hora.</p>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: decisao === 'aprovado' ? 'Confirmar aprovação' : 'Confirmar reprovação',
        classe: decisao === 'aprovado' ? 'btn--dark' : 'btn--bad',
        aoClicar: (bg, f) => {
          const comentario = $('#apCom', bg).value.trim();
          if (decisao === 'reprovado' && !comentario) return aviso('Explique o motivo da reprovação.', 'bad');
          a.status = decisao;
          a.comentario = comentario;
          a.decidido_em = hoje();
          a.decidido_por = App.usuario.id;
          DB.salvar(); f();
          aviso(decisao === 'aprovado' ? 'Aprovado e registrado.' : 'Reprovado e registrado.', decisao === 'aprovado' ? 'ok' : 'bad');
          App.rotear();
        } },
    ],
  });
}

function formAprovacao(o) {
  modal({
    titulo: 'Pedir uma aprovação',
    corpo: `
      <div class="field"><label for="apTit">O que precisa ser aprovado</label>
        <input class="inp" id="apTit" placeholder="Ex.: medição de setembro"></div>
      <div class="field"><label for="apDesc">Detalhe</label>
        <textarea class="txt" id="apDesc" style="min-height:80px" placeholder="Explique o que está sendo submetido e o efeito da decisão."></textarea></div>
      <div class="row2">
        <div class="field"><label for="apTipo">Tipo</label>
          <select class="sel" id="apTipo">${TIPOS_APROVACAO.map(t => `<option value="${t.id}">${esc(t.rotulo)}</option>`).join('')}</select></div>
        <div class="field"><label for="apQuem">Quem decide</label>
          <select class="sel" id="apQuem">
            <option value="cliente">Cliente</option>
            <option value="arquiteto">Arquitetura</option>
            <option value="engenheiro">Engenharia</option>
          </select></div>
      </div>
      <div class="row2">
        <div class="field"><label for="apValor">Valor envolvido (R$)</label>
          <input class="inp" type="number" inputmode="decimal" id="apValor" placeholder="deixe vazio se não houver"></div>
        <div class="field"><label for="apPrazo">Decisão até</label>
          <input class="inp" type="date" id="apPrazo" value="${maisDias(hoje(), 5)}"></div>
      </div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Enviar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const titulo = $('#apTit', bg).value.trim();
        if (!titulo) return aviso('Informe o que precisa ser aprovado.', 'bad');
        o.aprovacoes.unshift({
          id: uid('ap'), titulo, descricao: $('#apDesc', bg).value.trim(),
          tipo: $('#apTipo', bg).value, aprovador: $('#apQuem', bg).value,
          valor: Number($('#apValor', bg).value) || null,
          prazo: $('#apPrazo', bg).value, solicitante: App.usuario.id,
          status: 'pendente', criado_em: hoje(), decidido_em: null, decidido_por: null, comentario: '',
        });
        DB.salvar(); f(); aviso('Enviado para aprovação.'); App.rotear();
      } },
    ],
  });
}

/* ─── desempenho ──────────────────────────────────────────── */

function telaDesempenho(o) {
  const verCusto = App.ehEngenheiro();
  const spi = indicePrazo(o);
  const cpi = indiceCusto(o);
  const taxa = aprovacaoInspecoes(o);
  const conf = conformidadeNR(o);
  const rels = relatoriosOrdenados(o).slice(0, 8).reverse();
  const motivos = atrasosPorMotivo(o);
  const maxDias = Math.max(1, ...motivos.map(m => m.dias));

  const faixa = (v) => v >= 1 ? 'ok' : v >= 0.95 ? 'warn' : 'bad';
  const avancos = rels.map((r, i) => {
    const ant = i ? rels[i - 1] : null;
    return { rotulo: 'Semana ' + r.semana, valor: Math.max(0, (r.progresso_apos ?? 0) - (ant ? (ant.progresso_apos ?? 0) : (r.progresso_apos ?? 0))) };
  }).slice(1);

  topo('Desempenho', `${o.nome} · semana ${numeroSemana(hoje())}`);

  pintar(`
    <div class="grid" style="gap:12px;margin-bottom:16px">
      <div class="idx idx--${faixa(spi)}">
        <span class="idx__v">${spi.toFixed(2)}</span>
        <span class="idx__t"><b>Índice de prazo</b><span>Executado ${progressoObra(o)}% contra ${progressoPlanejado(o)}% previstos para hoje. Acima de 1,00 é obra adiantada.</span></span>
      </div>
      ${verCusto ? `
      <div class="idx idx--${faixa(cpi)}">
        <span class="idx__v">${cpi.toFixed(2)}</span>
        <span class="idx__t"><b>Índice de custo</b><span>${moeda(valorAgregado(o))} de serviço entregue para ${moeda(custoRealizado(o))} gastos.</span></span>
      </div>` : ''}
      <div class="idx idx--${taxa === null ? 'warn' : taxa >= 90 ? 'ok' : taxa >= 70 ? 'warn' : 'bad'}">
        <span class="idx__v">${taxa === null ? '—' : taxa + '%'}</span>
        <span class="idx__t"><b>Qualidade</b><span>Inspeções aprovadas de primeira, em ${o.inspecoes.length} verificações. ${ncsAbertas(o).length} não conformidade(s) aberta(s).</span></span>
      </div>
      <div class="idx idx--${conf === null ? 'warn' : conf >= 95 ? 'ok' : conf >= 80 ? 'warn' : 'bad'}">
        <span class="idx__v">${diasSemAcidente(o)}</span>
        <span class="idx__t"><b>Dias sem acidente</b><span>Conformidade média das verificações de norma: ${conf === null ? '—' : conf + '%'}.</span></span>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      ${curvaSGrafico(curvaS(o), { titulo: 'Avanço físico: previsto e realizado' })}
    </div>

    ${avancos.length ? `
    <div class="card" style="margin-bottom:16px">
      <div class="card__head">${icone('grafico')}<h2>Produtividade semanal</h2></div>
      ${barras(avancos, { formato: (v) => v + ' p.p.' })}
      <p class="hint" style="margin-top:12px">Quantos pontos percentuais da obra cada semana entregou.</p>
    </div>` : ''}

    <div class="card" style="margin-bottom:16px">
      <div class="card__head">${icone('alerta')}<h2>Onde o prazo foi perdido</h2>
        <span class="tag tag--bad">${diasAtrasoAcumulados(o)} dias</span></div>
      ${motivos.length
        ? barras(motivos.map(m => ({ rotulo: m.rotulo, valor: m.dias, cor: '#a51c1c' })), { formato: (v) => v + 'd' })
        : '<p class="hint">Nenhum dia de atraso registrado.</p>'}
    </div>

    ${verCusto ? `
    <div class="grid g-2">
      <div class="card">
        <div class="card__head">${icone('obra')}<h2>Suprimentos</h2></div>
        <div class="lista">
          ${linha({ titulo: 'Pedidos em aberto', valor: o.pedidos.filter(p => p.status !== 'entregue').length })}
          ${linha({ titulo: 'Entregas atrasadas', valor: pedidosAtrasados(o).length })}
          ${linha({ titulo: 'Itens abaixo do mínimo', valor: materiaisEmFalta(o).length })}
        </div>
      </div>
      <div class="card">
        <div class="card__head">${icone('pendencia')}<h2>Riscos e pendências</h2></div>
        <div class="lista">
          ${linha({ titulo: 'Riscos de severidade alta', valor: o.riscos.filter(r => r.status !== 'encerrado' && nivelRisco(r).id === 'alto').length })}
          ${linha({ titulo: 'Pendências abertas', valor: pendenciasAbertas(o).length })}
          ${linha({ titulo: 'Aprovações aguardando', valor: aprovacoesPendentes(o).length })}
        </div>
      </div>
    </div>` : ''}`);

  ligarCurvas();
}
