/* ============================================================
   SPX · contratos e assinaturas
   O cliente assina o contrato, a ordem de serviço e os aditivos
   pelo aparelho, e dá o visto de cada semana acompanhada.
   ============================================================ */

const fmtHora = (iso) => {
  const d = new Date(iso);
  return `${fmtData(iso.slice(0, 10))} às ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
};

/* Semanas relatadas e quem já deu o visto em cada uma. */
function semanasComVisto(o) {
  return relatoriosOrdenados(o).map(r => ({
    relatorio: r,
    visto: (r.vistos || []).find(v => v.usuario === o.cliente_id) || null,
  }));
}

const semanasSemVisto = (o) => semanasComVisto(o).filter(x => !x.visto).length;

const contratosAguardando = (o, papel) => (o.contratos || [])
  .filter(c => c.status === 'aguardando' && (!papel || c.assinante === papel));

function telaAssinaturas(o) {
  const chave = 'assin:' + o.id;
  const aba = ESTADO[chave] || 'assinar';
  const eng = App.ehEngenheiro();
  const souCliente = App.usuario.papel === 'cliente';
  const contratos = o.contratos || [];
  const aguardando = contratos.filter(c => c.status === 'aguardando');
  const assinados = contratos.filter(c => c.status === 'assinado');
  const vistos = semanasComVisto(o);

  topo('Contratos e assinaturas', `${o.nome} · ${aguardando.length} documento(s) aguardando assinatura`,
    eng ? `<button class="btn btn--sm" id="btnDoc">${icone('mais')}<span>Enviar</span></button>` : '');

  const cartao = (c) => `
    <div class="card assin ${c.status === 'assinado' ? 'is-assinado' : ''}">
      <div class="card__head" style="margin-bottom:8px">
        <span class="tag tag--accent">${contratoRotulo(c.tipo)}</span>
        <span class="tag">${esc(c.codigo)}</span>
        ${c.status === 'assinado'
          ? '<span class="tag tag--ok">Assinado</span>'
          : '<span class="tag tag--warn">Aguardando assinatura</span>'}
      </div>
      <h3 style="font-size:15px;font-weight:600;letter-spacing:-.015em;margin-bottom:8px">${esc(c.titulo)}</h3>
      <p style="font-size:13.5px;color:var(--ink-2)">${esc(c.descricao)}</p>
      ${c.valor ? `<p style="font-size:19px;font-weight:600;letter-spacing:-.03em;margin-top:10px">${moeda(c.valor)}</p>` : ''}

      <ul class="clausulas">
        ${(c.clausulas || []).map(t => `<li>${icone('ok')}<span>${esc(t)}</span></li>`).join('')}
      </ul>

      ${c.assinatura ? `
        <div class="carimbo">
          <div class="carimbo__i">${icone('assinar')}</div>
          <div>
            <b>Assinado por ${esc(c.assinatura.nome)}</b>
            <span>${esc(PAPEIS[c.assinatura.papel].rotulo)} · ${fmtHora(c.assinatura.em)}</span>
            <span>Código de verificação ${esc(c.assinatura.codigo)}</span>
          </div>
        </div>
        <button class="btn btn--sm btn--block no-print" data-comp="${c.id}" style="margin-top:12px">
          ${icone('imprimir')}Ver comprovante</button>`
        : `
        <p class="hint" style="margin-top:12px">Emitido em ${fmtData(c.emitido_em, true)} · assinatura de ${PAPEIS[c.assinante].rotulo.toLowerCase()}</p>
        ${c.assinante === App.usuario.papel
          ? `<button class="btn btn--accent btn--block" data-assinar="${c.id}" style="margin-top:12px">${icone('assinar')}Assinar documento</button>`
          : ''}`}
    </div>`;

  const conteudo = {
    assinar: () => aguardando.length
      ? `<div class="grid" style="gap:12px">${aguardando.map(cartao).join('')}</div>`
      : vazio('Nenhum documento pendente', 'Contrato, ordem de serviço e aditivos aparecem aqui quando precisam de assinatura.'),

    assinados: () => assinados.length
      ? `<div class="grid" style="gap:12px">${assinados.map(cartao).join('')}</div>`
      : vazio('Nada assinado ainda', 'Os documentos já assinados ficam guardados aqui com data, hora e código.'),

    vistos: () => `
      <p class="hint" style="margin-bottom:14px">
        O visto é a confirmação de que o cliente leu o relatório daquela semana.
        Ele fica registrado com data e hora e serve de histórico do acompanhamento.
      </p>
      <div class="lista">
        ${vistos.map(({ relatorio: r, visto }) => linha({
          titulo: `Semana ${r.semana} · ${fmtPeriodo(r.de, r.ate)}`,
          sub: visto
            ? `Visto de ${esc(DB.nome(visto.usuario))} em ${fmtHora(visto.em)}`
            : 'Ainda sem visto do cliente',
          tag: visto ? '<span class="tag tag--ok">Com visto</span>' : '<span class="tag tag--warn">Sem visto</span>',
          icone: visto ? 'ok' : 'semana',
          acao: 'sem:' + r.id,
        })).join('')}
      </div>`,
  };

  pintar(`
    ${souCliente && (aguardando.length || semanasSemVisto(o)) ? `
      <div class="card" style="border-color:color-mix(in srgb, var(--warn) 40%, transparent);background:var(--warn-soft);margin-bottom:16px">
        <div class="card__head" style="margin-bottom:8px">${icone('alerta')}<h2 style="color:var(--warn-ink)">Precisa de você</h2></div>
        <p style="font-size:13.5px;color:var(--warn-ink)">
          ${aguardando.length ? `${aguardando.length} documento(s) para assinar` : ''}
          ${aguardando.length && semanasSemVisto(o) ? ' e ' : ''}
          ${semanasSemVisto(o) ? `${semanasSemVisto(o)} semana(s) sem o seu visto` : ''}.
        </p>
      </div>` : ''}

    ${abas('assinAbas', [
      { id: 'assinar', rotulo: 'Para assinar', contador: aguardando.length },
      { id: 'assinados', rotulo: 'Assinados', contador: assinados.length },
      { id: 'vistos', rotulo: 'Visto semanal', contador: vistos.filter(v => v.visto).length },
    ], aba)}

    <div style="margin-top:16px">${conteudo[aba]()}</div>`);

  ligarAbas('assinAbas', (nova) => { ESTADO[chave] = nova; telaAssinaturas(o); });

  $$('[data-assinar]').forEach(b => b.addEventListener('click', () =>
    assinarDocumento(o, contratos.find(c => c.id === b.dataset.assinar))));
  $$('[data-comp]').forEach(b => b.addEventListener('click', () =>
    verComprovante(o, contratos.find(c => c.id === b.dataset.comp))));
  $$('[data-lin^="sem:"]').forEach(b => b.addEventListener('click', () =>
    App.ir(`#/obra/${o.id}/semana/${b.dataset.lin.slice(4)}`)));
  $('#btnDoc')?.addEventListener('click', () => formDocumentoAssinatura(o));
}

/* ─── assinar ─────────────────────────────────────────────── */

function assinarDocumento(o, c) {
  modal({
    titulo: 'Assinar documento',
    corpo: `
      <p style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">
        ${contratoRotulo(c.tipo)} · ${esc(c.codigo)}</p>
      <h3 style="font-size:16px;font-weight:600;margin-bottom:10px">${esc(c.titulo)}</h3>
      <p style="font-size:13.5px;color:var(--ink-2);margin-bottom:12px">${esc(c.descricao)}</p>
      ${c.valor ? `<p style="font-size:19px;font-weight:600;margin-bottom:12px">${moeda(c.valor)}</p>` : ''}

      <ul class="clausulas">
        ${(c.clausulas || []).map(t => `<li>${icone('ok')}<span>${esc(t)}</span></li>`).join('')}
      </ul>

      <label class="lin" style="cursor:pointer;margin:14px 0 12px">
        <input type="checkbox" id="aLi" style="width:20px;height:20px;accent-color:var(--ink);flex:none">
        <span class="lin__t"><b style="font-weight:500;font-size:13.5px">
          Li o documento e concordo com o que está escrito acima.</b></span>
      </label>

      <div class="field" style="margin:0"><label for="aNome">Escreva o seu nome completo para assinar</label>
        <input class="inp" id="aNome" placeholder="${esc(App.usuario.nome)}" autocomplete="name"></div>
      <p class="hint" style="margin-top:10px">
        A assinatura fica registrada com o seu nome, a data, a hora e um código de verificação.
      </p>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Assinar', classe: 'btn--accent', aoClicar: (bg, f) => {
        const nome = $('#aNome', bg).value.trim();
        if (!$('#aLi', bg).checked) return aviso('Confirme que leu o documento.', 'bad');
        if (nome.split(/\s+/).length < 2) return aviso('Escreva o nome completo.', 'bad');
        c.assinatura = assinaturaDe(App.usuario, nome);
        c.status = 'assinado';
        DB.salvar();
        f();
        aviso('Documento assinado.');
        verComprovante(o, c);
      } },
    ],
  });
}

function verComprovante(o, c) {
  const a = c.assinatura;
  modal({
    titulo: 'Comprovante de assinatura',
    corpo: `
      <div class="comprovante" id="comprovante">
        <p class="comprovante__t">SPX Engenharia · comprovante de assinatura</p>
        <h3>${esc(c.titulo)}</h3>
        <div class="obra-card__meta" style="font-size:13px;margin-top:12px">
          <span class="row"><span>Documento</span><b>${esc(c.codigo)}</b></span>
          <span class="row"><span>Tipo</span><b>${contratoRotulo(c.tipo)}</b></span>
          <span class="row"><span>Obra</span><b style="text-align:right">${esc(o.nome)}</b></span>
          ${c.valor ? `<span class="row"><span>Valor</span><b>${moeda(c.valor)}</b></span>` : ''}
          <span class="row"><span>Assinado por</span><b>${esc(a.nome)}</b></span>
          <span class="row"><span>Perfil</span><b>${esc(PAPEIS[a.papel].rotulo)}</b></span>
          <span class="row"><span>Data e hora</span><b>${fmtHora(a.em)}</b></span>
          <span class="row"><span>Código</span><b>${esc(a.codigo)}</b></span>
        </div>
        <p class="comprovante__f">
          Assinatura registrada no portal da SPX Engenharia. O código acima identifica
          este registro e permite conferir a assinatura junto à empresa.
        </p>
      </div>`,
    acoes: [
      { rotulo: 'Fechar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Imprimir', classe: 'btn--dark', aoClicar: () => window.print() },
    ],
  });
}

/* ─── enviar documento para assinatura ────────────────────── */

function formDocumentoAssinatura(o) {
  modal({
    titulo: 'Enviar documento para assinatura',
    corpo: `
      <div class="row2">
        <div class="field"><label for="dcTipo">Tipo</label>
          <select class="sel" id="dcTipo">${TIPOS_CONTRATO.map(t => `<option value="${t.id}">${esc(t.rotulo)}</option>`).join('')}</select></div>
        <div class="field"><label for="dcCod">Código</label>
          <input class="inp" id="dcCod" placeholder="SPX-AD-2026-000-03"></div>
      </div>
      <div class="field"><label for="dcTit">Título</label>
        <input class="inp" id="dcTit" placeholder="Ex.: aditivo 03 · troca do piso da varanda"></div>
      <div class="field"><label for="dcDesc">O que está sendo contratado</label>
        <textarea class="txt" id="dcDesc" style="min-height:80px"
          placeholder="Explique o serviço em linguagem simples, como o cliente vai ler."></textarea></div>
      <div class="row2">
        <div class="field"><label for="dcValor">Valor (R$)</label>
          <input class="inp" type="number" inputmode="decimal" id="dcValor" placeholder="deixe vazio se não houver"></div>
        <div class="field"><label for="dcQuem">Quem assina</label>
          <select class="sel" id="dcQuem">
            <option value="cliente">Cliente</option>
            <option value="arquiteto">Arquitetura</option>
          </select></div>
      </div>
      <div class="field" style="margin:0"><label for="dcCla">Condições, uma por linha</label>
        <textarea class="txt" id="dcCla" style="min-height:90px"
          placeholder="Acréscimo de R$ 0,00 ao contrato&#10;Acréscimo de 0 dias ao prazo"></textarea></div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Enviar', classe: 'btn--dark', aoClicar: (bg, f) => {
        const titulo = $('#dcTit', bg).value.trim();
        if (!titulo) return aviso('Informe o título do documento.', 'bad');
        o.contratos = o.contratos || [];
        o.contratos.unshift({
          id: uid('ct'),
          tipo: $('#dcTipo', bg).value,
          codigo: $('#dcCod', bg).value.trim() || `SPX-DOC-${o.contratos.length + 1}`,
          titulo,
          descricao: $('#dcDesc', bg).value.trim(),
          valor: Number($('#dcValor', bg).value) || null,
          emitido_em: hoje(),
          assinante: $('#dcQuem', bg).value,
          status: 'aguardando',
          assinatura: null,
          clausulas: $('#dcCla', bg).value.split('\n').map(t => t.trim()).filter(Boolean),
        });
        DB.salvar(); f(); aviso('Documento enviado para assinatura.'); App.rotear();
      } },
    ],
  });
}

/* ─── visto da semana ─────────────────────────────────────── */

function darVisto(o, r) {
  r.vistos = r.vistos || [];
  if (r.vistos.some(v => v.usuario === App.usuario.id)) return;
  r.vistos.push({ usuario: App.usuario.id, em: new Date().toISOString() });
  DB.salvar();
  aviso('Visto registrado. A engenharia sabe que você acompanhou esta semana.');
  App.rotear();
}

const meuVisto = (r) => (r.vistos || []).find(v => v.usuario === App.usuario.id) || null;
