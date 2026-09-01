/* ============================================================
   SPX · telas de semana, etapas, fotos, pendências e equipe
   ============================================================ */

/* ─── cartão de relatório ─────────────────────────────────── */

function cartaoRelatorio(o, r, expandido = false, mostrarObra = false) {
  const anterior = relatoriosOrdenados(o).find(x => x.de < r.de);
  const avanco = anterior ? (r.progresso_apos ?? 0) - (anterior.progresso_apos ?? 0) : null;
  const atrasos = r.atrasos || [];
  const diasAtraso = atrasos.reduce((s, a) => s + Number(a.dias || 0), 0);
  const fotos = (r.fotos || []).slice(0, expandido ? 8 : 4);

  return `
  <article class="rel__card">
    <div class="rel__h">
      <span class="tag tag--accent">Semana ${r.semana}</span>
      <h3>${fmtPeriodo(r.de, r.ate)}</h3>
      ${mostrarObra ? `<span class="tag">${esc(o.nome)}</span>` : ''}
      ${diasAtraso ? `<span class="tag tag--bad"><span class="dot"></span>${diasAtraso} dia(s) de atraso</span>`
                   : '<span class="tag tag--ok"><span class="dot"></span>Sem atraso</span>'}
      <span class="when" style="margin-left:auto">${esc(DB.nome(r.autor))}</span>
    </div>

    <p class="rel__txt" ${expandido ? '' : 'style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden"'}>${esc(r.resumo)}</p>

    ${fotos.length ? `<div class="fotos" style="margin-top:14px;grid-template-columns:repeat(auto-fill,minmax(${expandido ? 200 : 130}px,1fr))">
      ${fotos.map(f => `<figure class="foto" data-ver="${esc(f.id)}" data-rel="${esc(r.id)}">
        ${imgFoto(f)}<figcaption class="foto__cap">${esc(f.cap)}</figcaption></figure>`).join('')}
    </div>` : ''}

    ${atrasos.length ? `<div class="grid" style="gap:8px;margin-top:14px">
      ${atrasos.map(a => `
        <div class="pend" style="padding:11px 13px;background:var(--bad-soft);border-color:rgba(220,38,38,.2)">
          <span class="pend__i" style="background:rgba(220,38,38,.12);color:var(--bad)">${icone('alerta')}</span>
          <span class="pend__t">
            <b>${esc(motivoRotulo(a.motivo))} · ${a.dias} dia(s)</b>
            <p>${esc(a.descricao)}</p>
            <span class="pend__m"><span>Responsável: ${esc(a.resp)}</span></span>
          </span>
        </div>`).join('')}
    </div>` : ''}

    ${expandido && r.proximos ? `
      <div class="card" style="margin-top:14px;background:var(--surface-2);border-radius:12px;padding:14px">
        <b style="font-size:13px;display:block;margin-bottom:5px">Próxima semana</b>
        <p style="font-size:13.5px;color:var(--ink-2);white-space:pre-wrap">${esc(r.proximos)}</p>
      </div>` : ''}

    <div class="rel__foot">
      <span class="i">${icone('grafico')}${avanco === null
        ? 'primeira semana relatada'
        : `<b style="color:var(--ink)">${avanco > 0 ? '+' : ''}${avanco} p.p.</b> na semana`}</span>
      <span class="i">${icone('grafico')}${r.progresso_apos ?? progressoObra(o)}% acumulado</span>
      <span class="i">${icone('pessoas')}${r.efetivo || 0} na equipe</span>
      <span class="i">${icone('semana')}${r.dias_trabalhados ?? 5} dia(s) trabalhados</span>
      <span class="i">${icone('camera')}${(r.fotos || []).length} foto(s)</span>
      <span class="i">${icone('balao')}${(r.comentarios || []).length}</span>
      ${expandido ? '' : `<a class="btn btn--sm btn--ghost" style="margin-left:auto" href="#/obra/${o.id}/semana/${r.id}">Abrir ${icone('seta')}</a>`}
    </div>
  </article>`;
}

/* clique nas miniaturas abre a foto ampliada */
function ligarFotos(o) {
  $$('#view [data-ver]').forEach(fig => fig.addEventListener('click', async () => {
    const rel = o.relatorios.find(r => r.id === fig.dataset.rel);
    const f = (rel?.fotos || []).find(x => x.id === fig.dataset.ver)
      || todasAsFotos(o).find(x => x.id === fig.dataset.ver);
    if (!f) return;
    ampliar(f.src || await Fotos.ler(f.id), f.cap);
  }));
}

/* ─── lista de semanas ────────────────────────────────────── */

function telaSemanas(o) {
  const rels = relatoriosOrdenados(o);
  topo('Semanas', `${o.nome} · ${rels.length} relatório(s)`,
    App.podeEditar() ? `<a class="btn btn--accent" href="#/obra/${o.id}/nova-semana">${icone('mais')}<span>Nova semana</span></a>` : '');

  pintar(rels.length
    ? `<div class="tl">${rels.map(r => `
        <div class="rel"><span class="rel__dot ${(r.atrasos || []).length ? 'is-bad' : 'is-ok'}"><i></i></span>
        ${cartaoRelatorio(o, r)}</div>`).join('')}</div>`
    : vazio('Nenhuma semana relatada', 'Cada semana de obra vira um registro com resumo, fotos e motivo de atraso.',
        App.podeEditar() ? `<a class="btn btn--dark" href="#/obra/${o.id}/nova-semana">${icone('mais')}Lançar a primeira semana</a>` : ''));

  ligarFotos(o);
}

/* ─── uma semana ──────────────────────────────────────────── */

function telaSemana(o, rid) {
  const r = o.relatorios.find(x => x.id === rid);
  if (!r) { aviso('Relatório não encontrado.', 'bad'); return App.ir(`#/obra/${o.id}/semanas`); }

  topo(`Semana ${r.semana}`, `${o.nome} · ${fmtPeriodo(r.de, r.ate)}`, `
    <button class="btn btn--sm" id="btnImprimir">${icone('imprimir')}<span>Imprimir</span></button>
    ${App.podeEditar() ? `<a class="btn btn--sm" href="#/obra/${o.id}/nova-semana/${r.id}">${icone('editar')}<span>Editar</span></a>` : ''}`);

  pintar(`
    <div class="print-only" style="margin-bottom:18px">
      <h2 style="font-size:17px">${esc(o.nome)} · relatório semanal ${r.semana}</h2>
      <p style="font-size:12px;color:#555">${esc(o.endereco)} · ${fmtPeriodo(r.de, r.ate)} · SPX Engenharia</p>
    </div>

    <a class="btn btn--sm btn--ghost no-print" href="#/obra/${o.id}/semanas" style="margin-bottom:14px">${icone('volta')}Todas as semanas</a>

    ${cartaoRelatorio(o, r, true)}

    <div class="card no-print" style="margin-top:16px">
      <div class="card__head">${icone('balao')}<h3>Conversa sobre esta semana</h3></div>
      <div id="listaCmt">
        ${(r.comentarios || []).length
          ? r.comentarios.map(c => `
            <div class="cmt">${avatar(DB.nome(c.autor))}
              <div class="cmt__b">
                <div class="cmt__h"><b>${esc(DB.nome(c.autor))}</b>
                  <span>${esc(PAPEIS[DB.usuario(c.autor)?.papel]?.rotulo || '')} · ${fmtQuando(c.em)}</span></div>
                <p>${esc(c.texto)}</p>
              </div>
            </div>`).join('')
          : '<p class="hint" style="margin-bottom:14px">Nenhum comentário ainda. Dúvida sobre a semana? Escreva abaixo.</p>'}
      </div>
      <form id="formCmt" style="margin-top:14px">
        <textarea class="txt" id="cmtTexto" style="min-height:80px"
          placeholder="Escreva para a equipe da obra..."></textarea>
        <button class="btn btn--dark" style="margin-top:10px" type="submit">Enviar comentário</button>
      </form>
    </div>`);

  ligarFotos(o);
  $('#btnImprimir').addEventListener('click', () => window.print());

  $('#formCmt').addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = $('#cmtTexto').value.trim();
    if (!texto) return;
    r.comentarios = r.comentarios || [];
    r.comentarios.push({ id: uid('c'), autor: App.usuario.id, texto, em: new Date().toISOString() });
    DB.salvar();
    aviso('Comentário enviado.');
    App.rotear();
  });
}

/* ─── formulário da semana ────────────────────────────────── */

let rascunhoFotos = [];

function telaFormSemana(o, rid) {
  if (!App.podeEditar()) { aviso('Somente a engenharia lança relatórios.', 'bad'); return App.ir(`#/obra/${o.id}`); }

  const existente = rid ? o.relatorios.find(r => r.id === rid) : null;
  const de = existente ? existente.de : segundaDa(hoje());
  const ate = existente ? existente.ate : maisDias(de, 5);
  rascunhoFotos = existente ? (existente.fotos || []).map(f => ({ ...f, existente: true })) : [];

  const atrasos = existente ? [...(existente.atrasos || [])] : [];
  const daSemana = new Set(tarefasDaSemana(o, de, ate).map(t => t.id));

  topo(existente ? `Editar semana ${existente.semana}` : 'Relatório da semana',
    `${o.nome} · ${fmtPeriodo(de, ate)}`);

  pintar(`
    <a class="btn btn--sm btn--ghost" href="#/obra/${o.id}/semanas" style="margin-bottom:14px">${icone('volta')}Voltar</a>

    <form id="formSemana" class="grid" style="gap:16px;max-width:940px">

      <div class="card">
        <div class="card__head">${icone('semana')}<h2>Período</h2></div>
        <div class="row3">
          <div class="field" style="margin:0"><label for="fDe">Início da semana</label>
            <input class="inp" type="date" id="fDe" value="${de}" required></div>
          <div class="field" style="margin:0"><label for="fAte">Fim da semana</label>
            <input class="inp" type="date" id="fAte" value="${ate}" required></div>
          <div class="field" style="margin:0"><label for="fDias">Dias trabalhados</label>
            <input class="inp" type="number" id="fDias" min="0" max="7" value="${existente?.dias_trabalhados ?? 5}"></div>
        </div>
        <div class="row2" style="margin-top:14px">
          <div class="field" style="margin:0"><label for="fEfetivo">Pessoas na obra</label>
            <input class="inp" type="number" id="fEfetivo" min="0" max="200" value="${existente?.efetivo ?? 8}"></div>
          <div class="field" style="margin:0"><label for="fAutor">Responsável pelo relatório</label>
            <select class="sel" id="fAutor">
              ${DB.dados.usuarios.filter(u => u.papel === 'engenheiro').map(u =>
                `<option value="${u.id}" ${(existente?.autor || App.usuario.id) === u.id ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}
            </select></div>
        </div>
      </div>

      <div class="card">
        <div class="card__head">${icone('balao')}<h2>O que aconteceu nesta semana</h2></div>
        <div class="field">
          <textarea class="txt" id="fResumo" required style="min-height:150px"
            placeholder="Descreva os serviços executados, as decisões tomadas em obra e o que foi conferido.">${esc(existente?.resumo || '')}</textarea>
          <p class="hint">É este texto que o cliente e o arquiteto leem primeiro. Escreva em linguagem simples.</p>
        </div>
        <div class="field" style="margin:0"><label for="fProximos">O que vem na próxima semana</label>
          <textarea class="txt" id="fProximos" style="min-height:80px"
            placeholder="Serviços previstos para a semana seguinte.">${esc(existente?.proximos || '')}</textarea></div>
      </div>

      <div class="card">
        <div class="card__head">${icone('camera')}<h2>Fotos da semana</h2></div>
        <div class="drop" id="drop">
          ${icone('upload')}
          <b>Toque para escolher as fotos</b>
          <span>ou arraste os arquivos até aqui · elas são reduzidas antes de guardar</span>
          <input type="file" id="fArquivos" accept="image/*" multiple hidden>
        </div>
        <div class="up-grid" id="preview"></div>
      </div>

      <div class="card">
        <div class="card__head">${icone('etapas')}<h2>Andamento das tarefas</h2></div>
        <p class="hint" style="margin:-8px 0 14px">As tarefas previstas para esta semana já vêm abertas.
          Arraste para atualizar; o percentual da obra é recalculado a partir daqui.</p>
        <div id="listaTarefas">
          ${o.etapas.map(f => {
            const abertas = f.tarefas.filter(t => daSemana.has(t.id));
            const outras = f.tarefas.filter(t => !daSemana.has(t.id));
            const linhaT = (t, desta) => `
              <div class="etapa" data-tarefa="${t.id}" data-frente="${f.id}" ${desta ? '' : 'data-extra hidden'}>
                <div class="etapa__t"><b>${esc(t.nome)}</b>
                  <span>${esc(f.nome)} · ${t.duracao} dia(s) · ${fmtData(t.inicio)} a ${fmtData(t.fim)}</span></div>
                <div class="etapa__pct" data-pct>${t.progresso}%</div>
                <div class="etapa__rng"><input type="range" min="0" max="100" step="5" value="${t.progresso}" aria-label="${esc(t.nome)}"></div>
              </div>`;
            return abertas.map(t => linhaT(t, true)).join('') + outras.map(t => linhaT(t, false)).join('');
          }).join('')}
        </div>
        <label class="chip" style="margin-top:12px">
          <input type="checkbox" id="verTodas" style="width:18px;height:18px;accent-color:var(--ink)">
          Mostrar todas as tarefas da obra
        </label>
        <p class="hint" style="margin-top:12px">Percentual da obra com estes valores: <b id="pctObra">${progressoObra(o)}%</b></p>
      </div>

      <div class="card">
        <div class="card__head">${icone('alerta')}<h2>Houve atraso nesta semana?</h2></div>
        <div class="seg" id="segAtraso" style="margin-bottom:14px">
          <button type="button" data-v="nao" class="${atrasos.length ? '' : 'is-on'}">Não, semana normal</button>
          <button type="button" data-v="sim" class="${atrasos.length ? 'is-on' : ''}">Sim, registrar motivo</button>
        </div>
        <div id="areaAtrasos" ${atrasos.length ? '' : 'hidden'}>
          <div class="grid" id="listaAtrasos" style="gap:12px"></div>
          <button class="btn btn--sm" type="button" id="btnAddAtraso" style="margin-top:12px">${icone('mais')}Adicionar outro motivo</button>
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;padding-bottom:20px">
        <button class="btn btn--accent btn--lg" type="submit">${existente ? 'Salvar alterações' : 'Publicar relatório da semana'}</button>
        <a class="btn btn--ghost btn--lg" href="#/obra/${o.id}/semanas">Cancelar</a>
        ${existente ? `<button class="btn btn--bad btn--lg" type="button" id="btnExcluir" style="margin-left:auto">${icone('lixo')}Excluir</button>` : ''}
      </div>
    </form>`);

  /* ── fotos ── */
  const preview = $('#preview');
  const desenharPreview = () => {
    preview.innerHTML = rascunhoFotos.map((f, i) => `
      <div class="up" data-i="${i}">
        <div class="up__img">${f.src || f.dataUrl ? `<img src="${f.src || f.dataUrl}" alt="">` : `<img data-fid="${esc(f.id)}" alt="">`}</div>
        <div class="up__b">
          <input value="${esc(f.cap || '')}" placeholder="Legenda da foto" data-cap>
          <select class="sel" style="font-size:12px;padding:5px 8px;margin-top:4px" data-etapa>
            <option value="">Sem etapa</option>
            ${o.etapas.map(e => `<option value="${e.id}" ${f.etapa === e.id ? 'selected' : ''}>${esc(e.nome)}</option>`).join('')}
          </select>
          <button class="x" type="button" data-rm>Remover</button>
        </div>
      </div>`).join('');

    $$('#preview img[data-fid]').forEach(async el => {
      const src = await Fotos.ler(el.dataset.fid);
      if (src) el.src = src;
    });
    $$('#preview [data-cap]').forEach((el, i) => el.addEventListener('input', () => { rascunhoFotos[i].cap = el.value; }));
    $$('#preview [data-etapa]').forEach((el, i) => el.addEventListener('change', () => { rascunhoFotos[i].etapa = el.value; }));
    $$('#preview [data-rm]').forEach((el, i) => el.addEventListener('click', () => {
      rascunhoFotos.splice(i, 1); desenharPreview();
    }));
  };
  desenharPreview();

  const receber = async (arquivos) => {
    const imagens = [...arquivos].filter(a => a.type.startsWith('image/'));
    if (!imagens.length) return;
    for (const arq of imagens) {
      try {
        const dataUrl = await Fotos.comprimir(arq);
        rascunhoFotos.push({ id: uid('f'), dataUrl, cap: '', etapa: '' });
      } catch { aviso(`Não consegui ler ${arq.name}.`, 'bad'); }
    }
    desenharPreview();
    aviso(`${imagens.length} foto(s) adicionada(s).`);
  };

  const drop = $('#drop'), input = $('#fArquivos');
  drop.addEventListener('click', () => input.click());
  input.addEventListener('change', () => { receber(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', e => receber(e.dataTransfer.files));

  /* ── tarefas ── */
  const recalcular = () => {
    const pesoTotal = o.etapas.reduce((s, f) => s + f.peso, 0) || 1;
    const soma = o.etapas.reduce((s, f) => {
      const dur = f.tarefas.reduce((t, x) => t + x.duracao, 0) || 1;
      const feito = f.tarefas.reduce((t, x) => {
        const li = $(`[data-tarefa="${x.id}"]`);
        const v = li ? Number($('input[type=range]', li).value) : x.progresso;
        return t + x.duracao * v;
      }, 0);
      return s + f.peso * (feito / dur);
    }, 0);
    $('#pctObra').textContent = Math.round(soma / pesoTotal) + '%';
  };
  $$('#listaTarefas .etapa').forEach(li => {
    const rng = $('input[type=range]', li);
    rng.addEventListener('input', () => { $('[data-pct]', li).textContent = rng.value + '%'; recalcular(); });
  });
  $('#verTodas').addEventListener('change', (e) => {
    $$('#listaTarefas [data-extra]').forEach(li => { li.hidden = !e.target.checked; });
  });

  /* ── atrasos ── */
  const lista = $('#listaAtrasos');
  const linhaAtraso = (a = {}) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.cssText = 'background:var(--surface-2);padding:14px';
    div.innerHTML = `
      <div class="row2">
        <div class="field" style="margin:0"><label>Motivo</label>
          <select class="sel" data-motivo>
            ${MOTIVOS_ATRASO.map(m => `<option value="${m.id}" ${a.motivo === m.id ? 'selected' : ''}>${esc(m.rotulo)}</option>`).join('')}
          </select></div>
        <div class="field" style="margin:0"><label>Dias perdidos</label>
          <input class="inp" type="number" min="0" max="30" step="0.5" value="${a.dias ?? 1}" data-dias></div>
      </div>
      <div class="field" style="margin:14px 0 0"><label>O que aconteceu</label>
        <textarea class="txt" style="min-height:70px" data-desc
          placeholder="Explique o que travou o serviço. Este texto vai para o cliente.">${esc(a.descricao || '')}</textarea></div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:10px">
        <span class="hint" data-resp style="flex:1">Responsável: ${esc(a.resp || (MOTIVOS_ATRASO.find(m => m.id === (a.motivo || 'chuva')) || {}).resp)}</span>
        <button class="btn btn--sm btn--bad" type="button" data-rm>Remover</button>
      </div>`;
    const sel = $('[data-motivo]', div);
    const atualizarResp = () => {
      const m = MOTIVOS_ATRASO.find(x => x.id === sel.value);
      $('[data-resp]', div).textContent = 'Responsável: ' + (m ? m.resp : 'SPX');
    };
    sel.addEventListener('change', atualizarResp);
    $('[data-rm]', div).addEventListener('click', () => div.remove());
    lista.appendChild(div);
  };
  atrasos.forEach(linhaAtraso);
  $('#btnAddAtraso').addEventListener('click', () => linhaAtraso());

  $$('#segAtraso button').forEach(b => b.addEventListener('click', () => {
    $$('#segAtraso button').forEach(x => x.classList.toggle('is-on', x === b));
    const sim = b.dataset.v === 'sim';
    $('#areaAtrasos').hidden = !sim;
    if (sim && !lista.children.length) linhaAtraso();
  }));

  /* ── datas ── */
  $('#fDe').addEventListener('change', () => {
    const d = $('#fDe').value;
    if (d) $('#fAte').value = maisDias(d, 5);
  });

  /* ── gravar ── */
  $('#formSemana').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resumo = $('#fResumo').value.trim();
    if (!resumo) return aviso('Escreva o resumo da semana.', 'bad');

    const deV = $('#fDe').value, ateV = $('#fAte').value;
    if (!deV || !ateV || deV > ateV) return aviso('Confira as datas do período.', 'bad');

    const duplicada = o.relatorios.some(r => r.de === deV && r.id !== rid);
    if (duplicada) return aviso('Já existe um relatório para esta semana. Edite o que existe.', 'bad');

    /* atualiza as tarefas com o que ficou nos controles */
    $$('#listaTarefas .etapa').forEach(li => {
      const achado = tarefaPorId(o, li.dataset.tarefa);
      if (achado) achado.tarefa.progresso = Number($('input[type=range]', li).value);
    });
    o.etapas.forEach(sincronizarFrente);

    /* guarda as fotos novas e descarta do navegador as que saíram */
    const fotos = [];
    if (existente) {
      const mantidas = new Set(rascunhoFotos.map(f => f.id));
      for (const f of existente.fotos || []) {
        if (!f.src && !mantidas.has(f.id)) await Fotos.remover(f.id);
      }
    }
    for (const f of rascunhoFotos) {
      if (f.dataUrl) await Fotos.salvar(f.id, f.dataUrl);
      fotos.push({ id: f.id, cap: f.cap || 'Foto da semana', etapa: f.etapa || '', ...(f.src ? { src: f.src } : {}) });
    }

    const novosAtrasos = ($('#areaAtrasos').hidden ? [] : $$('#listaAtrasos > .card'))
      .map(div => {
        const motivo = $('[data-motivo]', div).value;
        return {
          id: uid('a'),
          motivo,
          dias: Number($('[data-dias]', div).value || 0),
          descricao: $('[data-desc]', div).value.trim() || motivoRotulo(motivo),
          resp: (MOTIVOS_ATRASO.find(m => m.id === motivo) || {}).resp || 'SPX',
        };
      })
      .filter(a => a.dias > 0);

    const campos = {
      semana: numeroSemana(deV), de: deV, ate: ateV,
      resumo, proximos: $('#fProximos').value.trim(),
      efetivo: Number($('#fEfetivo').value || 0),
      dias_trabalhados: Number($('#fDias').value || 0),
      autor: $('#fAutor').value,
      fotos, atrasos: novosAtrasos,
      progresso_apos: progressoObra(o),
    };

    let alvo;
    if (existente) {
      Object.assign(existente, campos);
      alvo = existente;
    } else {
      alvo = { id: uid('rel'), criado_em: new Date().toISOString(), comentarios: [], ...campos };
      o.relatorios.push(alvo);
    }
    DB.salvar();
    rascunhoFotos = [];
    aviso(existente ? 'Relatório atualizado.' : 'Relatório da semana publicado.');
    App.ir(`#/obra/${o.id}/semana/${alvo.id}`);
  });

  if (existente) {
    $('#btnExcluir').addEventListener('click', () => confirmar(
      'Excluir relatório',
      `A semana ${existente.semana} e as fotos ligadas a ela serão apagadas.`,
      async () => {
        for (const f of existente.fotos || []) if (!f.src) await Fotos.remover(f.id);
        o.relatorios = o.relatorios.filter(r => r.id !== existente.id);
        DB.salvar();
        aviso('Relatório excluído.');
        App.ir(`#/obra/${o.id}/semanas`);
      }, 'Excluir'));
  }
}

/* ─── fotos ───────────────────────────────────────────────── */

function telaFotos(o) {
  const fotos = todasAsFotos(o);
  const etapasComFoto = o.etapas.filter(e => fotos.some(f => f.etapa === e.id));
  const filtro = (telaFotos.filtro || {})[o.id] || '';
  const visiveis = filtro ? fotos.filter(f => f.etapa === filtro) : fotos;

  topo('Fotos da obra', `${o.nome} · ${fotos.length} foto(s) em ${o.relatorios.length} semana(s)`);

  const porSemana = new Map();
  visiveis.forEach(f => {
    const chave = `${f.semana}|${f.de}|${f.ate}`;
    if (!porSemana.has(chave)) porSemana.set(chave, []);
    porSemana.get(chave).push(f);
  });

  pintar(`
    ${etapasComFoto.length ? `<div class="chips" style="margin-bottom:18px">
      <button class="chip ${filtro ? '' : 'is-on'}" data-filtro="">Todas</button>
      ${etapasComFoto.map(e => `<button class="chip ${filtro === e.id ? 'is-on' : ''}" data-filtro="${e.id}">${esc(e.nome)}</button>`).join('')}
    </div>` : ''}

    ${visiveis.length ? [...porSemana.entries()].map(([chave, lista]) => {
      const [semana, de, ate] = chave.split('|');
      return `
        <div class="sec-t"><h2>Semana ${semana}</h2><span class="tag">${fmtPeriodo(de, ate)}</span>
          <a class="btn btn--sm btn--ghost" href="#/obra/${o.id}/semana/${lista[0].relatorio_id}">Abrir relatório</a></div>
        <div class="fotos" style="margin-bottom:8px">
          ${lista.map(f => `<figure class="foto" data-ver="${esc(f.id)}" data-rel="${esc(f.relatorio_id)}">
            ${imgFoto(f)}<figcaption class="foto__cap">${esc(f.cap)}</figcaption></figure>`).join('')}
        </div>`;
    }).join('') : vazio('Nenhuma foto ainda', 'As fotos entram junto com o relatório de cada semana.')}
  `);

  ligarFotos(o);
  $$('[data-filtro]').forEach(b => b.addEventListener('click', () => {
    telaFotos.filtro = { ...(telaFotos.filtro || {}), [o.id]: b.dataset.filtro };
    telaFotos(o);
  }));
}

/* ─── pendências ──────────────────────────────────────────── */

const CORES_PEND = { arquiteto: 'info', cliente: 'warn', engenheiro: 'accent' };

function cartaoPendencia(p, o) {
  const atrasada = p.status !== 'resolvida' && p.prazo < hoje();
  const cor = p.status === 'resolvida' ? 'ok' : atrasada ? 'bad' : (CORES_PEND[p.para] || 'info');
  return `
  <div class="pend" data-pend="${p.id}">
    <span class="pend__i" style="background:var(--${cor}-soft);color:var(--${cor === 'accent' ? 'warn' : cor})">
      ${icone(p.status === 'resolvida' ? 'ok' : 'pendencia')}</span>
    <span class="pend__t">
      <b>${esc(p.titulo)}</b>
      <p>${esc(p.descricao)}</p>
      <span class="pend__m">
        <span class="tag tag--${cor}">${p.status === 'resolvida' ? 'Resolvida' : 'Para ' + PAPEIS[p.para].rotulo.toLowerCase()}</span>
        ${o ? `<span>${esc(o.nome)}</span>` : ''}
        <span>Aberta por ${esc(DB.nome(p.de))}</span>
        <span>${p.status === 'resolvida' ? 'Concluída' : atrasada ? `Venceu em ${fmtData(p.prazo)}` : `Até ${fmtData(p.prazo)}`}</span>
        ${(p.respostas || []).length ? `<span>${p.respostas.length} resposta(s)</span>` : ''}
      </span>
    </span>
  </div>`;
}

function telaPendencias(o) {
  const abertas = o.pendencias.filter(p => p.status !== 'resolvida');
  const resolvidas = o.pendencias.filter(p => p.status === 'resolvida');
  const minhas = abertas.filter(p => p.para === App.usuario.papel);
  const outras = abertas.filter(p => p.para !== App.usuario.papel);

  topo('Pendências', `${o.nome} · ${abertas.length} em aberto`,
    `<button class="btn btn--accent btn--sm" id="btnNovaPend">${icone('mais')}<span>Nova pendência</span></button>`);

  pintar(`
    ${minhas.length ? `<div class="sec-t"><h2>Esperando você</h2><span class="tag tag--bad">${minhas.length}</span></div>
      <div class="grid" style="gap:10px">${minhas.map(p => cartaoPendencia(p)).join('')}</div>` : ''}

    <div class="sec-t"><h2>${minhas.length ? 'Outras pendências abertas' : 'Pendências abertas'}</h2></div>
    ${outras.length ? `<div class="grid" style="gap:10px">${outras.map(p => cartaoPendencia(p)).join('')}</div>`
      : (minhas.length ? '' : vazio('Nada travando a obra', 'Quando algo depender do cliente ou do arquiteto, registre aqui para ficar documentado.'))}

    ${resolvidas.length ? `<div class="sec-t"><h2>Resolvidas</h2></div>
      <div class="grid" style="gap:10px">${resolvidas.map(p => cartaoPendencia(p)).join('')}</div>` : ''}
  `);

  $$('[data-pend]').forEach(el => el.addEventListener('click', () => {
    abrirPendencia(o, o.pendencias.find(p => p.id === el.dataset.pend));
  }));
  $('#btnNovaPend').addEventListener('click', () => formPendencia(o));
}

function abrirPendencia(o, p) {
  const respostas = (p.respostas || []).map(r => `
    <div class="cmt">${avatar(DB.nome(r.autor))}
      <div class="cmt__b">
        <div class="cmt__h"><b>${esc(DB.nome(r.autor))}</b><span>${fmtQuando(r.em)}</span></div>
        <p>${esc(r.texto)}</p>
      </div>
    </div>`).join('');

  const podeResolver = App.ehEngenheiro() || p.de === App.usuario.id;

  modal({
    titulo: p.titulo,
    corpo: `
      <p style="font-size:14px;color:var(--ink-2);margin-bottom:14px;white-space:pre-wrap">${esc(p.descricao)}</p>
      <div class="pend__m" style="margin-bottom:16px">
        <span class="tag tag--${p.status === 'resolvida' ? 'ok' : 'info'}">${p.status === 'resolvida' ? 'Resolvida' : 'Para ' + PAPEIS[p.para].rotulo.toLowerCase()}</span>
        <span>Aberta por ${esc(DB.nome(p.de))} em ${fmtData(p.criado_em.slice(0, 10))}</span>
        <span>Prazo ${fmtData(p.prazo)}</span>
      </div>
      ${respostas ? `<div style="border-top:1px solid var(--line);padding-top:6px">${respostas}</div>` : ''}
      ${p.status !== 'resolvida' ? `
        <div class="field" style="margin:14px 0 0"><label for="pResp">Sua resposta</label>
          <textarea class="txt" id="pResp" style="min-height:80px" placeholder="Responda o que a obra precisa saber."></textarea></div>` : ''}`,
    acoes: [
      { rotulo: 'Fechar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      ...(p.status !== 'resolvida' ? [
        { rotulo: 'Responder', classe: '', aoClicar: (bg, f) => {
          const texto = $('#pResp', bg).value.trim();
          if (!texto) return aviso('Escreva a resposta.', 'bad');
          p.respostas = p.respostas || [];
          p.respostas.push({ id: uid('r'), autor: App.usuario.id, texto, em: new Date().toISOString() });
          p.status = 'respondida';
          DB.salvar(); f(); aviso('Resposta registrada.'); App.rotear();
        } },
        ...(podeResolver ? [{ rotulo: 'Marcar como resolvida', classe: 'btn--dark', aoClicar: (bg, f) => {
          const texto = $('#pResp', bg).value.trim();
          if (texto) {
            p.respostas = p.respostas || [];
            p.respostas.push({ id: uid('r'), autor: App.usuario.id, texto, em: new Date().toISOString() });
          }
          p.status = 'resolvida';
          DB.salvar(); f(); aviso('Pendência resolvida.'); App.rotear();
        } }] : []),
      ] : []),
    ],
  });
}

function formPendencia(o) {
  modal({
    titulo: 'Nova pendência',
    corpo: `
      <div class="field"><label for="pTit">O que precisa ser resolvido</label>
        <input class="inp" id="pTit" placeholder="Ex.: Definir o modelo da cuba do lavabo"></div>
      <div class="field"><label for="pDesc">Detalhe</label>
        <textarea class="txt" id="pDesc" style="min-height:90px"
          placeholder="Explique o que está travado e o que acontece se não for definido."></textarea></div>
      <div class="row2">
        <div class="field"><label for="pPara">Quem responde</label>
          <select class="sel" id="pPara">
            <option value="arquiteto">Arquitetura</option>
            <option value="cliente">Cliente</option>
            <option value="engenheiro">Engenharia</option>
          </select></div>
        <div class="field"><label for="pPrazo">Resposta até</label>
          <input class="inp" type="date" id="pPrazo" value="${maisDias(hoje(), 5)}"></div>
      </div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Abrir pendência', classe: 'btn--dark', aoClicar: (bg, f) => {
        const titulo = $('#pTit', bg).value.trim();
        if (!titulo) return aviso('Escreva o título da pendência.', 'bad');
        o.pendencias.push({
          id: uid('p'), titulo,
          descricao: $('#pDesc', bg).value.trim(),
          para: $('#pPara', bg).value,
          de: App.usuario.id,
          prazo: $('#pPrazo', bg).value || maisDias(hoje(), 5),
          status: 'aberta', criado_em: new Date().toISOString(), respostas: [],
        });
        DB.salvar(); f(); aviso('Pendência aberta.'); App.rotear();
      } },
    ],
  });
}

/* ─── equipe e contrato ───────────────────────────────────── */

function telaEquipe(o) {
  const pessoas = [
    { u: DB.usuario(o.cliente_id), papel: 'Cliente' },
    { u: DB.usuario(o.arquiteto_id), papel: 'Arquitetura' },
    { u: DB.usuario(o.engenheiro_id), papel: 'Engenharia' },
  ].filter(p => p.u);

  topo('Equipe e contrato', o.nome,
    App.podeEditar() ? `<button class="btn btn--sm" id="btnEditarObra">${icone('editar')}<span>Editar obra</span></button>` : '');

  pintar(`
    <div class="grid g-3">
      ${pessoas.map(({ u, papel }) => `
        <div class="card">
          <div class="card__head" style="margin-bottom:12px">
            ${avatar(u.nome, 'me__av')}
            <div style="flex:1"><h3 style="font-size:15px">${esc(u.nome)}</h3>
              <p style="font-size:12.5px;color:var(--muted)">${esc(papel)}</p></div>
          </div>
          <div class="obra-card__meta">
            <span class="row"><span>Função</span><b style="text-align:right">${esc(u.cargo || '—')}</b></span>
            <span class="row"><span>E-mail</span><b style="text-align:right;overflow-wrap:anywhere">${esc(u.email)}</b></span>
          </div>
        </div>`).join('')}
    </div>

    <div class="sec-t"><h2>Dados da obra</h2></div>
    <div class="card" style="max-width:620px">
      <div class="obra-card__meta" style="font-size:13.5px">
        <span class="row"><span>Obra</span><b>${esc(o.nome)}</b></span>
        <span class="row"><span>Tipo</span><b>${esc(o.tipo)}</b></span>
        <span class="row"><span>Endereço</span><b style="text-align:right">${esc(o.endereco)}</b></span>
        <span class="row"><span>Área</span><b>${o.area} m²</b></span>
        <span class="row"><span>Início</span><b>${fmtData(o.inicio, true)}</b></span>
        <span class="row"><span>Prazo</span><b>${fmtData(o.prazo, true)}</b></span>
        ${App.usuario.papel !== 'arquiteto' ? `<span class="row"><span>Valor do contrato</span><b>${moeda(o.valor)}</b></span>` : ''}
        <span class="row"><span>Semanas relatadas</span><b>${o.relatorios.length}</b></span>
        <span class="row"><span>Dias de atraso</span><b>${diasAtrasoAcumulados(o)}</b></span>
      </div>
    </div>`);

  if (!App.podeEditar()) return;
  $('#btnEditarObra').addEventListener('click', () => modal({
    titulo: 'Editar obra',
    corpo: `
      <div class="field"><label for="oNome">Nome</label><input class="inp" id="oNome" value="${esc(o.nome)}"></div>
      <div class="field"><label for="oEnd">Endereço</label><input class="inp" id="oEnd" value="${esc(o.endereco)}"></div>
      <div class="row2">
        <div class="field"><label for="oTipo">Tipo</label><input class="inp" id="oTipo" value="${esc(o.tipo)}"></div>
        <div class="field"><label for="oArea">Área (m²)</label><input class="inp" type="number" id="oArea" value="${o.area}"></div>
      </div>
      <div class="row2">
        <div class="field"><label for="oIni">Início</label><input class="inp" type="date" id="oIni" value="${o.inicio}"></div>
        <div class="field"><label for="oPrazo">Prazo</label><input class="inp" type="date" id="oPrazo" value="${o.prazo}"></div>
      </div>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo: 'Salvar', classe: 'btn--dark', aoClicar: (bg, f) => {
        Object.assign(o, {
          nome: $('#oNome', bg).value.trim() || o.nome,
          endereco: $('#oEnd', bg).value.trim(),
          tipo: $('#oTipo', bg).value.trim(),
          area: Number($('#oArea', bg).value || o.area),
          inicio: $('#oIni', bg).value || o.inicio,
          prazo: $('#oPrazo', bg).value || o.prazo,
        });
        DB.salvar(); f(); aviso('Obra atualizada.'); App.rotear();
      } },
    ],
  }));
}
