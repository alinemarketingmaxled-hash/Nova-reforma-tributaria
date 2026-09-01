/* ============================================================
   SPX · valores
   O lado comercial da obra: contrato, aditivos, medições e as
   parcelas que o cliente paga.
   ============================================================ */

const STATUS_PARCELA = {
  pago:     { rotulo: 'Paga',      cor: 'ok' },
  aberto:   { rotulo: 'Em aberto', cor: 'info' },
  atrasado: { rotulo: 'Atrasada',  cor: 'bad' },
};

function telaFinanceiro(o) {
  const chave = 'fin:' + o.id;
  const aba = ESTADO[chave] || 'resumo';
  const eng = App.ehEngenheiro();
  const fin = o.financeiro;

  const contrato = o.valor;
  const aditivos = totalAditivos(o);
  const atualizado = valorAtualizado(o);
  const faturado = totalFaturado(o);
  const recebido = totalRecebido(o);
  const falta = aReceber(o);
  const atrasadas = parcelasAtrasadas(o);
  const proxima = proximaParcela(o);
  const pctFaturado = Math.round((faturado / (atualizado || 1)) * 100);
  const pctFisico = progressoObra(o);

  topo('Valores', `${o.nome} · ${pctFaturado}% do contrato faturado`,
    eng ? `<button class="btn btn--sm" id="btnMedicao">${icone('mais')}<span>Medição</span></button>` : '');

  const resumo = () => `
    <div class="card" style="margin-bottom:16px">
      <div class="card__head">${icone('dinheiro')}<h2>Contrato</h2></div>
      <div class="obra-card__meta" style="font-size:13.5px">
        <span class="row"><span>Valor original</span><b>${moeda(contrato)}</b></span>
        <span class="row"><span>Aditivos aprovados</span><b>${aditivos ? '+ ' + moeda(aditivos) : '-'}</b></span>
        <span class="row" style="border-top:1px solid var(--line-2);padding-top:8px">
          <span><b>Valor atualizado</b></span><b style="font-size:16px">${moeda(atualizado)}</b></span>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card__head">${icone('grafico')}<h2>Faturado e executado</h2></div>
      <div class="et-linha">
        <div class="et-linha__h"><b>Obra executada</b><span>${pctFisico}%</span></div>
        <div class="track"><i style="--w:${pctFisico}%"></i></div>
      </div>
      <div class="et-linha">
        <div class="et-linha__h"><b>Contrato faturado</b><span>${pctFaturado}%</span></div>
        <div class="track"><i style="--w:${pctFaturado}%;background:var(--viz-dado)"></i></div>
      </div>
      <p class="hint" style="margin-top:12px">
        ${pctFaturado > pctFisico + 5 ? 'O faturamento está à frente do serviço executado.'
          : pctFaturado < pctFisico - 5 ? 'Há serviço executado ainda não faturado: vale antecipar a medição.'
          : 'Faturamento e execução andam juntos.'}
      </p>
    </div>

    ${proxima ? `
    <div class="card" style="margin-bottom:16px;border-color:${proxima.status === 'atrasado' ? 'color-mix(in srgb, var(--bad) 40%, transparent)' : 'var(--line)'}">
      <div class="card__head" style="margin-bottom:8px">${icone('relogio')}<h3>Próximo pagamento</h3>
        <span class="tag tag--${STATUS_PARCELA[proxima.status].cor}">${STATUS_PARCELA[proxima.status].rotulo}</span></div>
      <p style="font-size:22px;font-weight:600;letter-spacing:-.03em">${moeda(proxima.valor)}</p>
      <p class="hint">${esc(proxima.descricao)} · vencimento em ${fmtData(proxima.vencimento, true)}</p>
    </div>` : ''}

    <div class="grid g-3">
      ${kpi('Faturado', moeda(faturado), `${pctFaturado}% do contrato`)}
      ${kpi('Recebido', moeda(recebido), `${Math.round((recebido / (atualizado || 1)) * 100)}% do contrato`)}
      ${kpi('A receber', moeda(falta), atrasadas.length ? `${atrasadas.length} parcela(s) atrasada(s)` : 'nada vencido')}
    </div>`;

  const medicoes = () => fin.medicoes.length ? `
    <div class="lista">
      ${fin.medicoes.map(m => linha({
        titulo: `Medição ${String(m.numero).padStart(2, '0')}`,
        sub: `${fmtPeriodo(m.de, m.ate)} · ${m.pct}% do contrato${m.aprovada_em ? ' · aprovada em ' + fmtData(m.aprovada_em) : ''}`,
        tag: m.status === 'aprovada' ? '<span class="tag tag--ok">Aprovada</span>' : '<span class="tag tag--warn">Pendente</span>',
        valor: moeda(m.valor),
        acao: eng ? 'med:' + m.id : '',
      })).join('')}
    </div>
    <p class="hint" style="margin-top:12px">A medição mede o serviço executado no período e vira a parcela do mês.</p>`
    : vazio('Nenhuma medição ainda', 'A primeira medição aparece aqui no fechamento do mês.');

  const parcelas = () => `
    <div class="lista">
      ${fin.parcelas.map(p => linha({
        titulo: esc(p.descricao),
        sub: `Vencimento em ${fmtData(p.vencimento)}${p.pago_em ? ' · pago em ' + fmtData(p.pago_em) : ''}`,
        tag: `<span class="tag tag--${STATUS_PARCELA[p.status].cor}">${STATUS_PARCELA[p.status].rotulo}</span>`,
        valor: moeda(p.valor),
        acao: eng && p.status !== 'pago' ? 'par:' + p.id : '',
      })).join('')}
    </div>
    ${eng ? '<p class="hint" style="margin-top:12px">Toque em uma parcela em aberto para dar baixa no pagamento.</p>' : ''}`;

  const conteudo = { resumo, medicoes, parcelas };

  pintar(`
    ${abas('finAbas', [
      { id: 'resumo', rotulo: 'Resumo' },
      { id: 'medicoes', rotulo: 'Medições', contador: fin.medicoes.length },
      { id: 'parcelas', rotulo: 'Pagamentos', contador: fin.parcelas.length },
    ], aba)}
    <div style="margin-top:16px">${conteudo[aba]()}</div>`);

  ligarAbas('finAbas', (nova) => { ESTADO[chave] = nova; telaFinanceiro(o); });

  $$('[data-lin^="par:"]').forEach(b => b.addEventListener('click', () => {
    const p = fin.parcelas.find(x => x.id === b.dataset.lin.slice(4));
    confirmar('Dar baixa no pagamento',
      `${p.descricao} de ${moeda(p.valor)} será marcada como paga hoje.`,
      () => { p.status = 'pago'; p.pago_em = hoje(); DB.salvar(); aviso('Pagamento registrado.'); App.rotear(); },
      'Marcar como paga');
  }));

  $$('[data-lin^="med:"]').forEach(b => b.addEventListener('click', () => {
    const m = fin.medicoes.find(x => x.id === b.dataset.lin.slice(4));
    modal({
      titulo: `Medição ${String(m.numero).padStart(2, '0')}`,
      corpo: `
        <div class="obra-card__meta" style="font-size:13.5px">
          <span class="row"><span>Período</span><b>${fmtPeriodo(m.de, m.ate)}</b></span>
          <span class="row"><span>Percentual do contrato</span><b>${m.pct}%</b></span>
          <span class="row"><span>Valor</span><b>${moeda(m.valor)}</b></span>
          <span class="row"><span>Situação</span><b>${m.status === 'aprovada' ? 'Aprovada' : 'Pendente de aprovação'}</b></span>
        </div>`,
      acoes: [
        { rotulo: 'Fechar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
        ...(m.status !== 'aprovada' ? [{ rotulo: 'Enviar ao cliente', classe: 'btn--dark', aoClicar: (_, f) => {
          o.aprovacoes.unshift({
            id: uid('ap'), tipo: 'medicao',
            titulo: `Medição ${String(m.numero).padStart(2, '0')} · ${fmtPeriodo(m.de, m.ate)}`,
            descricao: `Medição de ${m.pct}% do contrato, referente ao serviço executado no período.`,
            valor: m.valor, aprovador: 'cliente', solicitante: App.usuario.id,
            status: 'pendente', prazo: maisDias(hoje(), 5), criado_em: hoje(),
            decidido_em: null, decidido_por: null, comentario: '',
          });
          DB.salvar(); f(); aviso('Medição enviada para aprovação do cliente.'); App.rotear();
        } }] : []),
      ],
    });
  }));

  $('#btnMedicao')?.addEventListener('click', () => {
    const ultima = fin.medicoes[0];
    const de = ultima ? maisDias(ultima.ate, 1) : o.inicio;
    modal({
      titulo: 'Nova medição',
      corpo: `
        <div class="row2">
          <div class="field"><label for="mDe">De</label><input class="inp" type="date" id="mDe" value="${de}"></div>
          <div class="field"><label for="mAte">Até</label><input class="inp" type="date" id="mAte" value="${hoje()}"></div>
        </div>
        <div class="row2">
          <div class="field"><label for="mPct">Percentual do contrato (%)</label>
            <input class="inp" type="number" inputmode="decimal" step="0.1" id="mPct" placeholder="0,0"></div>
          <div class="field"><label for="mValor">Valor (R$)</label>
            <input class="inp" type="number" inputmode="decimal" id="mValor" placeholder="0,00"></div>
        </div>
        <div class="field" style="margin:0"><label for="mVence">Vencimento da parcela</label>
          <input class="inp" type="date" id="mVence" value="${maisDias(hoje(), 10)}"></div>
        <p class="hint" style="margin-top:10px">Preencha o percentual e o valor sai proporcional ao contrato atualizado, ou informe o valor direto.</p>`,
      acoes: [
        { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
        { rotulo: 'Registrar', classe: 'btn--dark', aoClicar: (bg, f) => {
          const pct = Number($('#mPct', bg).value || 0);
          let valor = Number($('#mValor', bg).value || 0);
          if (!valor && pct) valor = Math.round((atualizado * pct) / 100);
          if (!valor) return aviso('Informe o percentual ou o valor da medição.', 'bad');
          const numero = fin.medicoes.length + 1;
          const med = {
            id: uid('md'), numero, de: $('#mDe', bg).value, ate: $('#mAte', bg).value,
            valor, pct: pct || Math.round((valor / (atualizado || 1)) * 1000) / 10,
            status: 'pendente', aprovada_em: null,
          };
          fin.medicoes.unshift(med);
          fin.parcelas.unshift({
            id: uid('pc'), numero, descricao: `Medição ${String(numero).padStart(2, '0')}`,
            valor, vencimento: $('#mVence', bg).value, pago_em: null, status: 'aberto', medicao_id: med.id,
          });
          DB.salvar(); f(); aviso('Medição registrada.'); App.rotear();
        } },
      ],
    });
  });
}
