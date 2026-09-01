/* ============================================================
   SPX · peças de interface reutilizadas pelas telas
   ============================================================ */

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ─── ícones ──────────────────────────────────────────────── */

const ICONES = {
  painel: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/>',
  obra: '<path d="M3 21h18"/><path d="M5 21V8l7-4 7 4v13"/><path d="M9.5 21v-5h5v5"/>',
  semana: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  etapas: '<path d="M4 7l2.5 2.5L11 5"/><path d="M4 17l2.5 2.5L11 15"/><path d="M14 8h6M14 18h6"/>',
  fotos: '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10.5" r="2"/><path d="m4 17 5-4 4 3 3-2 4 3"/>',
  pendencia: '<path d="M12 3.5 21 20H3z"/><path d="M12 10v4M12 17h.01"/>',
  equipe: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M17.5 20a6.5 6.5 0 0 0-2.2-4.9"/>',
  grafico: '<path d="M4 19.5V12M10 19.5V5M16 19.5v-5.5M21.5 19.5h-19"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  ok: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/>',
  alerta: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16h.01"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 1.9"/>',
  chuva: '<path d="M7 16.5a4.5 4.5 0 0 1 .6-8.96 5.5 5.5 0 0 1 10.6 1.7A3.9 3.9 0 0 1 17.5 16.5z"/><path d="M8.5 19v2M12 19.5v2.5M15.5 19v2"/>',
  pessoas: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.4 3.4 0 0 1 0 6.6"/>',
  camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.4"/>',
  seta: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  volta: '<path d="M19 12H6M11 18l-6-6 6-6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  lixo: '<path d="M4 7h16M9.5 7V5h5v2M6.5 7l1 13h9l1-13"/>',
  editar: '<path d="M4 20h4L19 9a2.4 2.4 0 0 0-3.4-3.4L4.5 16.6z"/>',
  imprimir: '<path d="M7 9V3h10v6"/><rect x="3.5" y="9" width="17" height="7.5" rx="2"/><path d="M7 14h10v7H7z"/>',
  upload: '<path d="M12 16V4.5M7.5 9 12 4.5 16.5 9"/><path d="M4 15v3.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V15"/>',
  sair: '<path d="M15 5V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1"/><path d="M20 12H9M17 8l4 4-4 4"/>',
  balao: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.2A8 8 0 1 1 21 12z"/>',
  reta: '<path d="M3 12h18"/>',
  filtro: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  vazio: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 10.5h8M8 15h5"/>',
  chave: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  caixa: '<path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5z"/><path d="m3 8.5 9 4.5 9-4.5M12 13v7"/>',
  carrinho: '<circle cx="9.5" cy="19.5" r="1.6"/><circle cx="17" cy="19.5" r="1.6"/><path d="M3 4h2.2l2.3 11h11l2-8H6.2"/>',
  escudo: '<path d="M12 3 5 6v5.5c0 4.3 2.9 8.2 7 9.5 4.1-1.3 7-5.2 7-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
  dinheiro: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 10v4M18 10v4"/>',
  regua: '<rect x="2.5" y="8" width="19" height="8" rx="2"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
  raio: '<path d="M13 3 5 13h6l-1 8 8-10h-6z"/>',
  assinar: '<path d="M3 18c3.5 0 3-10 6-10s2.5 8 5 8 2-4 4-4"/><path d="M3 21h18"/>',
};

const icone = (nome, cls = '') =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nome] || ICONES.reta}</svg>`;

/* ─── gráfico de círculo ──────────────────────────────────── */

/*
  Anel de progresso. O traço cheio é o executado; o tracinho externo
  marca onde o cronograma dizia que a obra deveria estar hoje.
*/
function donut(pct, opcoes = {}) {
  const { tamanho = 132, traco = 13, meta = null, situacao = '', rotulo = 'executado' } = opcoes;
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const r = (tamanho - traco) / 2;
  const c = 2 * Math.PI * r;
  const meio = tamanho / 2;

  let marcador = '';
  if (meta !== null) {
    const ang = (Math.max(0, Math.min(100, meta)) / 100) * 2 * Math.PI - Math.PI / 2;
    const x1 = meio + Math.cos(ang) * (r - traco / 2 - 1.5);
    const y1 = meio + Math.sin(ang) * (r - traco / 2 - 1.5);
    const x2 = meio + Math.cos(ang) * (r + traco / 2 + 1.5);
    const y2 = meio + Math.sin(ang) * (r + traco / 2 + 1.5);
    marcador = `<line class="ring-meta" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="2.5" stroke-linecap="round"/>`;
  }

  return `<svg class="donut ${situacao ? 'is-' + situacao : ''}" width="${tamanho}" height="${tamanho}"
    viewBox="0 0 ${tamanho} ${tamanho}" role="img" aria-label="${p}% ${esc(rotulo)}">
    <circle class="ring-bg" cx="${meio}" cy="${meio}" r="${r}" fill="none" stroke-width="${traco}"/>
    <circle class="ring-fg" cx="${meio}" cy="${meio}" r="${r}" fill="none" stroke-width="${traco}"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - p / 100)).toFixed(1)}"
      transform="rotate(-90 ${meio} ${meio})"/>
    ${marcador}
    <text class="pct" x="${meio}" y="${meio + (tamanho > 110 ? 2 : 3)}" text-anchor="middle"
      font-size="${Math.round(tamanho * 0.26)}" dominant-baseline="middle">${p}%</text>
    ${tamanho > 110 ? `<text class="pct-sub" x="${meio}" y="${meio + tamanho * 0.19}" text-anchor="middle" font-size="${Math.round(tamanho * 0.088)}">${esc(rotulo)}</text>` : ''}
  </svg>`;
}

/* ─── avisos ──────────────────────────────────────────────── */

function aviso(texto, tipo = 'ok') {
  let caixa = $('.toasts');
  if (!caixa) {
    caixa = document.createElement('div');
    caixa.className = 'toasts';
    document.body.appendChild(caixa);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (tipo === 'bad' ? ' is-bad' : '');
  el.innerHTML = `${icone(tipo === 'bad' ? 'alerta' : 'ok')}<span>${esc(texto)}</span>`;
  caixa.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3200);
  setTimeout(() => el.remove(), 3600);
}

/* ─── modal ───────────────────────────────────────────────── */

/*
  Abre uma caixa de diálogo. `corpo` é HTML, `acoes` são botões.
  Devolve funções para fechar e para ler os campos do formulário.
*/
function modal({ titulo, corpo, acoes = [], aoAbrir }) {
  const fundo = document.createElement('div');
  fundo.className = 'modal-bg';
  fundo.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
      <div class="modal__h">
        <h3>${esc(titulo)}</h3>
        <button class="x-btn" data-x aria-label="Fechar">${icone('x')}</button>
      </div>
      <div class="modal__b">${corpo}</div>
      <div class="modal__f">${acoes.map((a, i) =>
        `<button class="btn ${a.classe || ''}" data-acao="${i}">${esc(a.rotulo)}</button>`).join('')}</div>
    </div>`;

  const fechar = () => { fundo.remove(); document.removeEventListener('keydown', naTecla); };
  const naTecla = (e) => { if (e.key === 'Escape') fechar(); };

  fundo.addEventListener('click', (e) => { if (e.target === fundo) fechar(); });
  $('[data-x]', fundo).addEventListener('click', fechar);
  acoes.forEach((a, i) => $(`[data-acao="${i}"]`, fundo).addEventListener('click', () => a.aoClicar?.(fundo, fechar)));
  document.addEventListener('keydown', naTecla);
  document.body.appendChild(fundo);
  aoAbrir?.(fundo, fechar);
  $('input,textarea,select', fundo)?.focus();
  return { fundo, fechar };
}

function confirmar(titulo, texto, aoConfirmar, rotulo = 'Confirmar') {
  modal({
    titulo,
    corpo: `<p style="font-size:14px;color:var(--ink-2)">${esc(texto)}</p>`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'btn--ghost', aoClicar: (_, f) => f() },
      { rotulo, classe: 'btn--dark', aoClicar: (_, f) => { f(); aoConfirmar(); } },
    ],
  });
}

/* ─── ampliar foto ────────────────────────────────────────── */

function ampliar(src, legenda = '') {
  const el = document.createElement('div');
  el.className = 'lightbox';
  el.innerHTML = `<button class="lightbox__x" aria-label="Fechar">${icone('x')}</button>
    <div><img src="${src}" alt="${esc(legenda)}">${legenda ? `<p>${esc(legenda)}</p>` : ''}</div>`;
  const fechar = () => { el.remove(); document.removeEventListener('keydown', tecla); };
  const tecla = (e) => { if (e.key === 'Escape') fechar(); };
  el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('.lightbox__x')) fechar(); });
  document.addEventListener('keydown', tecla);
  document.body.appendChild(el);
}

/* ─── abas internas de uma tela ───────────────────────────── */

/* Estado de interface que não vale a pena gravar: aba aberta, filtro. */
const ESTADO = {};

const abas = (id, opcoes, ativa) => `
  <div class="seg" data-abas="${esc(id)}">${opcoes.map(o => `
    <button type="button" data-aba="${esc(o.id)}" class="${o.id === ativa ? 'is-on' : ''}">
      ${esc(o.rotulo)}${o.contador ? ` (${o.contador})` : ''}
    </button>`).join('')}</div>`;

function ligarAbas(id, aoTrocar) {
  $$(`[data-abas="${id}"] [data-aba]`).forEach(b =>
    b.addEventListener('click', () => aoTrocar(b.dataset.aba)));
}

/* Linha de lista com título, apoio e um valor à direita. */
const linha = ({ titulo, sub, valor, subvalor, icone: ic, tag, acao }) => `
  <${acao ? 'button type="button"' : 'div'} class="lin${acao ? '' : ' lin--parado'}" ${acao ? `data-lin="${esc(acao)}"` : ''}>
    ${ic ? `<span class="lin__i">${icone(ic)}</span>` : ''}
    <span class="lin__t"><b>${titulo}</b>${sub ? `<span>${sub}</span>` : ''}</span>
    ${tag || ''}
    ${valor !== undefined ? `<span class="lin__x">${valor}${subvalor ? `<small>${subvalor}</small>` : ''}</span>` : ''}
  </${acao ? 'button' : 'div'}>`;

const voltarPara = (href, texto = 'Voltar') =>
  `<a class="btn btn--sm btn--ghost" href="${href}" style="margin-bottom:14px">${icone('volta')}${esc(texto)}</a>`;

/* ─── blocos comuns ───────────────────────────────────────── */

const vazio = (titulo, texto, botao = '') => `
  <div class="empty">${icone('vazio')}<b>${esc(titulo)}</b><p>${esc(texto)}</p>${botao}</div>`;

const kpi = (chave, valor, sub = '', extra = '') => `
  <div class="kpi">
    <div class="kpi__k">${extra}${esc(chave)}</div>
    <div class="kpi__v">${valor}</div>
    ${sub ? `<div class="kpi__s">${sub}</div>` : ''}
  </div>`;

/* Etapa em uma linha: nome e percentual em cima, barra embaixo. */
const linhaEtapa = (e, cor = '') => `
  <div class="et-linha">
    <div class="et-linha__h"><b>${esc(e.nome)}</b><span>${e.progresso}%</span></div>
    <div class="track"><i class="${e.progresso === 100 ? 'is-ok' : cor}" style="--w:${e.progresso}%"></i></div>
  </div>`;

const avatar = (nome, cls = 'cmt__av') => `<span class="${cls}">${esc(iniciais(nome))}</span>`;

const tagSituacao = (s) => `<span class="tag tag--${s.chave}"><span class="dot"></span>${esc(s.rotulo)}</span>`;

/* Carrega no <img> a foto do IndexedDB (ou a imagem de exemplo). */
async function pintarFoto(el, foto) {
  const src = foto.src || await Fotos.ler(foto.id);
  if (src) el.src = src;
  else el.replaceWith(Object.assign(document.createElement('div'),
    { className: 'empty', style: 'padding:12px;font-size:11px', textContent: 'foto indisponível' }));
}
