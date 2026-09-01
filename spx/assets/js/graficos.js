/* ============================================================
   SPX · gráficos
   Paleta conferida com o validador de contraste e daltonismo:
   severidade em três níveis (verde, âmbar, vermelho), uma cor
   só para valores, e o previsto sempre como linha tracejada
   cinza — referência, não série.
   ============================================================ */

const COR_DADO = '#2a78d6';   /* valores medidos */
const COR_PLANO = '#8b8f96';  /* linha de referência do planejado */

const fmtCurto = (v, moedaCurta) => moedaCurta
  ? (v >= 1000000 ? 'R$ ' + (v / 1000000).toFixed(1).replace('.', ',') + ' mi'
    : v >= 1000 ? 'R$ ' + Math.round(v / 1000) + ' mil' : 'R$ ' + Math.round(v))
  : Math.round(v) + '%';

/* ─── curva S ─────────────────────────────────────────────── */

/*
  Duas curvas no mesmo eixo: o previsto pelo cronograma e o
  executado até hoje. Passe `moeda: true` para a curva de custo.
*/
function curvaSGrafico(pontos, { moeda = false, titulo = '' } = {}) {
  const L = 44, R = 14, T = 14, B = 26, W = 340, H = 196;
  const largura = W - L - R, altura = H - T - B;
  const maxV = Math.max(...pontos.map(p => Math.max(p.previsto, p.realizado ?? 0)), moeda ? 1 : 100);
  const teto = moeda ? Math.ceil(maxV / 50000) * 50000 : 100;

  const x = (i) => L + (i / (pontos.length - 1)) * largura;
  const y = (v) => T + altura - (v / teto) * altura;

  const linha = (chave) => pontos
    .map((p, i) => (p[chave] === null || p[chave] === undefined ? null : `${x(i).toFixed(1)},${y(p[chave]).toFixed(1)}`))
    .filter(Boolean).join(' ');

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * teto);
  const iHoje = pontos.reduce((mel, p, i) => (p.data <= hoje() ? i : mel), 0);
  const ultimoReal = [...pontos].reverse().find(p => p.realizado !== null && p.realizado !== undefined);
  const ultimoPrev = pontos[pontos.length - 1];

  return `
  <figure class="chart" data-curva='${esc(JSON.stringify({ pontos, moeda }))}'>
    ${titulo ? `<figcaption class="chart__t">${esc(titulo)}</figcaption>` : ''}
    <div class="chart__legenda">
      <span class="lg"><svg viewBox="0 0 22 8" class="lg__m"><line x1="1" y1="4" x2="21" y2="4" stroke="${COR_PLANO}" stroke-width="2" stroke-dasharray="4 3"/></svg>Previsto</span>
      <span class="lg"><svg viewBox="0 0 22 8" class="lg__m"><line x1="1" y1="4" x2="21" y2="4" stroke="${COR_DADO}" stroke-width="2.5"/></svg>Realizado</span>
    </div>
    <div class="chart__area">
      <svg viewBox="0 0 ${W} ${H}" class="chart__svg" role="img"
        aria-label="Curva do previsto e do realizado ao longo da obra">
        ${ticks.map(t => `
          <line x1="${L}" y1="${y(t).toFixed(1)}" x2="${W - R}" y2="${y(t).toFixed(1)}" class="gridline"/>
          <text x="${L - 7}" y="${(y(t) + 3.5).toFixed(1)}" text-anchor="end" class="chart__tick">${fmtCurto(t, moeda)}</text>`).join('')}

        <line x1="${x(iHoje).toFixed(1)}" y1="${T}" x2="${x(iHoje).toFixed(1)}" y2="${T + altura}" class="hojeline"/>
        <text x="${x(iHoje).toFixed(1)}" y="${T - 3}" text-anchor="middle" class="chart__tick">hoje</text>

        <polyline points="${linha('previsto')}" fill="none" stroke="${COR_PLANO}" stroke-width="2"
          stroke-dasharray="5 4" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${linha('realizado')}" fill="none" stroke="${COR_DADO}" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round"/>

        ${ultimoReal ? `<circle cx="${x(pontos.indexOf(ultimoReal)).toFixed(1)}" cy="${y(ultimoReal.realizado).toFixed(1)}"
          r="4.5" fill="${COR_DADO}" stroke="var(--surface)" stroke-width="2"/>` : ''}

        <text x="${L}" y="${H - 8}" class="chart__tick">${fmtData(pontos[0].data)}</text>
        <text x="${W - R}" y="${H - 8}" text-anchor="end" class="chart__tick">${fmtData(ultimoPrev.data)}</text>

        <g class="chart__cursor" hidden>
          <line y1="${T}" y2="${T + altura}" class="cursorline"/>
          <circle r="5" fill="${COR_DADO}" stroke="var(--surface)" stroke-width="2"/>
        </g>
        <rect x="${L}" y="${T}" width="${largura}" height="${altura}" fill="transparent" class="chart__hit"/>
      </svg>
      <div class="chart__tip" hidden></div>
    </div>
    <div class="chart__resumo">
      <span>Previsto hoje <b>${fmtCurto(pontos[iHoje]?.previsto ?? 0, moeda)}</b></span>
      <span>Realizado <b style="color:${COR_DADO}">${fmtCurto(ultimoReal?.realizado ?? 0, moeda)}</b></span>
    </div>
    <details class="chart__tab">
      <summary>Ver os números</summary>
      <div class="chart__tabw">
        <table>
          <thead><tr><th>Data</th><th>Previsto</th><th>Realizado</th></tr></thead>
          <tbody>${pontos.map(p => `<tr><td>${fmtData(p.data)}</td><td>${fmtCurto(p.previsto, moeda)}</td>
            <td>${p.realizado === null || p.realizado === undefined ? '—' : fmtCurto(p.realizado, moeda)}</td></tr>`).join('')}</tbody>
        </table>
      </div>
    </details>
  </figure>`;
}

/* Cursor com o valor das duas curvas, no toque ou no mouse. */
function ligarCurvas(raiz = document) {
  $$('.chart[data-curva]', raiz).forEach(fig => {
    let dados;
    try { dados = JSON.parse(fig.dataset.curva); } catch { return; }
    const { pontos, moeda } = dados;
    const svg = $('.chart__svg', fig);
    const hit = $('.chart__hit', fig);
    const cursor = $('.chart__cursor', fig);
    const linha = $('line', cursor);
    const bola = $('circle', cursor);
    const tip = $('.chart__tip', fig);
    const L = 44, R = 14, T = 14, B = 26, W = 340, H = 196;
    const largura = W - L - R, altura = H - T - B;
    const maxV = Math.max(...pontos.map(p => Math.max(p.previsto, p.realizado ?? 0)), moeda ? 1 : 100);
    const teto = moeda ? Math.ceil(maxV / 50000) * 50000 : 100;
    const x = (i) => L + (i / (pontos.length - 1)) * largura;
    const y = (v) => T + altura - (v / teto) * altura;

    const mover = (ev) => {
      const r = svg.getBoundingClientRect();
      const px = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) * (W / r.width);
      const i = Math.max(0, Math.min(pontos.length - 1, Math.round(((px - L) / largura) * (pontos.length - 1))));
      const p = pontos[i];
      cursor.hidden = false;
      linha.setAttribute('x1', x(i)); linha.setAttribute('x2', x(i));
      const temReal = p.realizado !== null && p.realizado !== undefined;
      bola.setAttribute('cx', x(i));
      bola.setAttribute('cy', y(temReal ? p.realizado : p.previsto));
      tip.hidden = false;
      tip.innerHTML = `<b>${fmtData(p.data)}</b>
        <span>Previsto ${fmtCurto(p.previsto, moeda)}</span>
        ${temReal ? `<span style="color:${COR_DADO}">Realizado ${fmtCurto(p.realizado, moeda)}</span>` : '<span>Ainda não executado</span>'}`;
      tip.style.left = Math.max(4, Math.min(r.width - 130, (x(i) / W) * r.width - 60)) + 'px';
    };
    const sair = () => { cursor.hidden = true; tip.hidden = true; };

    hit.addEventListener('pointermove', mover);
    hit.addEventListener('pointerdown', mover);
    hit.addEventListener('pointerleave', sair);
    hit.addEventListener('touchmove', (e) => { e.preventDefault(); mover(e); }, { passive: false });
    hit.addEventListener('touchend', sair);
  });
}

/* ─── barras horizontais ──────────────────────────────────── */

/* Uma medida por categoria: uma cor só, o comprimento é o dado. */
function barras(itens, { cor = COR_DADO, formato = (v) => v } = {}) {
  const max = Math.max(1, ...itens.map(i => i.valor));
  return `<div class="bars">${itens.map(i => `
    <div class="bar">
      <span class="bar__t" title="${esc(i.rotulo)}">${esc(i.rotulo)}</span>
      <span class="bar__b"><i style="--w:${Math.round((i.valor / max) * 100)}%;background:${i.cor || cor}"></i></span>
      <span class="bar__v">${esc(formato(i.valor))}</span>
    </div>`).join('')}</div>`;
}

/* ─── matriz de risco ─────────────────────────────────────── */

/*
  Cinco níveis de probabilidade por cinco de impacto. A cor diz a
  severidade e o número diz quantos riscos caem naquela casa; a
  lista embaixo repete o nível por escrito.
*/
function matrizRisco(riscos, aoClicar = '') {
  const casas = [];
  for (let p = 5; p >= 1; p--) {
    for (let i = 1; i <= 5; i++) {
      const dentro = riscos.filter(r => r.probabilidade === p && r.impacto === i);
      const nivel = nivelRisco({ probabilidade: p, impacto: i });
      casas.push({ p, i, dentro, nivel });
    }
  }
  return `
  <div class="matriz-wrap">
    <div class="matriz">
      <span class="matriz__eixo matriz__eixo--y">Probabilidade</span>
      ${casas.map((c, idx) => `
        <button type="button" class="matriz__c ${c.dentro.length ? 'tem' : ''}"
          style="--c:${c.nivel.cor}" data-mx="${c.p}-${c.i}"
          aria-label="Probabilidade ${c.p}, impacto ${c.i}: ${c.dentro.length} risco(s), nível ${c.nivel.rotulo}"
          ${idx % 5 === 0 ? `data-lbl="${c.p}"` : ''}>
          ${c.dentro.length || ''}
        </button>`).join('')}
      <span class="matriz__eixo matriz__eixo--x">Impacto →</span>
    </div>
    <div class="matriz__leg">
      ${NIVEIS_RISCO.map(n => `<span class="lg"><i class="lg__p" style="background:${n.cor}"></i>${n.rotulo}</span>`).join('')}
    </div>
  </div>`;
}

/* ─── linha do tempo do cronograma ────────────────────────── */

/*
  Barras no período previsto de cada frente, com o executado
  preenchido e uma marca no dia de hoje. Passe `tarefas: true`
  para desenhar também as tarefas de dentro da frente.
*/
function gantt(obra, { tarefas = false, frentes = null } = {}) {
  const ini = obra.inicio, fim = obra.prazo;
  const total = Math.max(1, difDias(ini, fim));
  const pos = (d) => Math.max(0, Math.min(100, (difDias(ini, d) / total) * 100));
  const lista = frentes || obra.etapas;

  const barra = (item, tipo) => {
    const de = pos(item.inicio), ate = pos(item.fim);
    const atrasada = item.progresso < 100 && item.fim < hoje();
    return `
      <div class="gantt__l ${tipo === 'tarefa' ? 'gantt__l--t' : ''}">
        <div class="gantt__t">
          <b>${esc(item.nome)}</b>
          <span>${fmtData(item.inicio)} a ${fmtData(item.fim)} · ${item.progresso}%</span>
        </div>
        <div class="gantt__trilho">
          <div class="gantt__b ${atrasada ? 'is-atrasada' : ''}" style="--de:${de}%;--w:${Math.max(2, ate - de)}%">
            <i style="--p:${item.progresso}%"></i>
          </div>
        </div>
      </div>`;
  };

  return `
  <div class="gantt">
    <div class="gantt__hoje" style="--x:${pos(hoje())}%"><span>hoje</span></div>
    ${lista.map(f => barra(f, 'frente') +
      (tarefas ? (f.tarefas || []).map(t => barra(t, 'tarefa')).join('') : '')).join('')}
  </div>`;
}
