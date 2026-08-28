/* ═══════════════════════════════════════════════════════════
   Nova Reforma Tributária — comportamento
   Sem dependências. Todo cálculo roda no navegador.
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

const brl = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
const brlC = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', minimumFractionDigits:2 });
const num = (n, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits:d, maximumFractionDigits:d });

/* compacta valores grandes: R$ 1,3 mi */
function brlShort(v){
  const a = Math.abs(v);
  if (a >= 1e9) return (v < 0 ? '−' : '') + 'R$ ' + num(a / 1e9, 1) + ' bi';
  if (a >= 1e6) return (v < 0 ? '−' : '') + 'R$ ' + num(a / 1e6, 1) + ' mi';
  if (a >= 1e5) return (v < 0 ? '−' : '') + 'R$ ' + num(a / 1e3, 0) + ' mil';
  return (v < 0 ? '−' : '') + brl.format(a);
}

/* ─────────────── 1. tema ─────────────── */
(() => {
  const root = document.documentElement;
  const stored = (() => { try { return localStorage.getItem('rt-tema'); } catch { return null; } })();
  const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = stored || (prefers ? 'dark' : 'light');

  $('#themeToggle')?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('rt-tema', root.dataset.theme); } catch {}
  });
})();

/* ─────────────── 2. navegação ─────────────── */
(() => {
  const burger = $('#burger'), menu = $('#mobilenav');
  burger?.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('#mobilenav a').forEach(a => a.addEventListener('click', () => {
    menu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
  }));

  const links = $$('.rail a[data-spy]');
  const alvos = links.map(a => $('#' + a.dataset.spy)).filter(Boolean);
  if (!alvos.length) return;

  const spy = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('is-on', l.dataset.spy === e.target.id));
    });
  }, { rootMargin:'-45% 0px -50% 0px', threshold:0 });
  alvos.forEach(s => spy.observe(s));
})();

/* ─────────────── 3. revelação + contadores ─────────────── */
(() => {
  const alvos = $$('.card, .tl, .strip > div, .section__head, .qa, .hero__head');
  alvos.forEach((el, i) => {
    el.setAttribute('data-reveal', '');
    el.style.transitionDelay = Math.min(i % 6, 5) * 55 + 'ms';
  });

  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
      $$('[data-count]', e.target).forEach(anima);
    });
  }, { threshold:.12, rootMargin:'0px 0px -40px' });
  alvos.forEach(el => io.observe(el));

  function anima(el){
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const alvo = parseFloat(el.dataset.count);
    const dec  = parseInt(el.dataset.decimals || '0', 10);
    const dur  = 1150;
    const t0   = performance.now();
    (function passo(t){
      const p = clamp((t - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = num(alvo * e, dec);
      if (p < 1) requestAnimationFrame(passo);
    })(t0);
  }
})();

/* ─────────────── 4. impactos por setor ─────────────── */
(() => {
  const painel = $('#sectorPanel');
  if (!painel) return;

  const DADOS = {
    industria: {
      titulo:'Indústria e manufatura',
      texto:'O setor que mais tende a ganhar. A cadeia industrial acumula insumos tributados em ' +
            'cada etapa e hoje convive com crédito restrito, substituição tributária e resíduo ' +
            'de imposto embutido no custo. Com crédito financeiro amplo, esse resíduo desaparece.',
      metros:[['Aproveitamento de crédito',88],['Complexidade da transição',62],['Pressão sobre o preço final',30]],
      pontos:[
        'Fim da substituição tributária elimina a antecipação de imposto sobre margem presumida.',
        'Bens de capital e energia passam a gerar crédito integral, reduzindo custo de investimento.',
        'Benefícios de ICMS estaduais se extinguem — quem depende deles precisa recompor margem.',
        'Cobrança no destino redesenha a lógica de localização de centros de distribuição.'
      ]
    },
    varejo:{
      titulo:'Comércio e varejo',
      texto:'Crédito amplo sobre mercadoria, frete, energia e aluguel melhora bastante o resultado ' +
            'fiscal. Em contrapartida, o imposto passa a aparecer destacado na nota e a formação ' +
            'de preço precisa ser refeita do zero.',
      metros:[['Aproveitamento de crédito',80],['Complexidade da transição',58],['Pressão sobre o preço final',52]],
      pontos:[
        'Preço deixa de ter tributo “por dentro” — tabelas e políticas de desconto mudam.',
        'Cesta Básica Nacional com alíquota zero e reduções de 60% exigem catálogo bem classificado.',
        'Split payment antecipa a saída de caixa do imposto para o momento da liquidação.',
        'Fornecedor no Simples que não transfere crédito integral passa a custar mais caro.'
      ]
    },
    servicos:{
      titulo:'Serviços em geral',
      texto:'O ponto de maior atenção. Quem tem folha alta e poucas compras tributadas vai da ' +
            'alíquota atual de ISS somada a PIS/Cofins para uma alíquota cheia com pouca base ' +
            'de crédito para abater.',
      metros:[['Aproveitamento de crédito',26],['Complexidade da transição',48],['Pressão sobre o preço final',86]],
      pontos:[
        'Salários e encargos não geram crédito — a folha vira o principal fator de exposição.',
        'Profissões liberais regulamentadas têm redução de 30% sobre a alíquota de referência.',
        'Cliente B2B recupera o imposto integralmente: repassar preço fica mais viável no B2B do que no B2C.',
        'Cobrança no destino altera a disputa entre municípios e o cadastro de tomadores.'
      ]
    },
    agro:{
      titulo:'Agronegócio e alimentos',
      texto:'Tratamento diferenciado extenso: produtor rural abaixo do limite fica fora do regime ' +
            'com crédito presumido para o comprador, e boa parte dos alimentos entra em redução ' +
            'de 60% ou em alíquota zero.',
      metros:[['Aproveitamento de crédito',72],['Complexidade da transição',66],['Pressão sobre o preço final',24]],
      pontos:[
        'Cesta Básica Nacional de Alimentos com alíquota zero, sem quebra da cadeia de crédito.',
        'Crédito presumido nas aquisições de produtor rural pessoa física não contribuinte.',
        'Insumos agropecuários mantêm redução relevante de alíquota.',
        'Exportação segue desonerada, agora com devolução de crédito mais previsível.'
      ]
    },
    saude:{
      titulo:'Saúde e educação',
      texto:'Regimes com redução de 60% da alíquota de referência. O alívio é real, mas a base ' +
            'de crédito é curta — a maior parte do custo é pessoal — e a classificação de cada ' +
            'serviço define o enquadramento.',
      metros:[['Aproveitamento de crédito',36],['Complexidade da transição',54],['Pressão sobre o preço final',48]],
      pontos:[
        'Redução de 60% para serviços de saúde, educação e dispositivos médicos elencados em lei.',
        'Enquadramento depende de lista taxativa: o que fica fora volta à alíquota cheia.',
        'Planos de saúde têm regime específico próprio, distinto do prestador de serviço.',
        'Instituições imunes e sem fins lucrativos exigem análise à parte.'
      ]
    },
    tec:{
      titulo:'Tecnologia e software',
      texto:'Fim da disputa entre ICMS e ISS sobre software — passa tudo a ser IBS e CBS, o que ' +
            'simplifica enormemente. O desafio é a alíquota cheia sobre operações com margem ' +
            'alta e custo concentrado em pessoas.',
      metros:[['Aproveitamento de crédito',34],['Complexidade da transição',44],['Pressão sobre o preço final',78]],
      pontos:[
        'Acaba a insegurança sobre licenciamento, SaaS e serviço — mesma regra para todos.',
        'Infraestrutura de nuvem, licenças e ferramentas passam a gerar crédito integral.',
        'Exportação de software é desonerada, com devolução de crédito acumulado.',
        'Venda para consumidor final pessoa física sente a alíquota cheia sem repasse de crédito.'
      ]
    }
  };

  function render(chave){
    const d = DADOS[chave];
    if (!d) return;
    painel.innerHTML = `
      <div class="sec__grid">
        <div>
          <h3>${d.titulo}</h3>
          <p>${d.texto}</p>
          <ul class="sec__points">${d.pontos.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
        <div class="sec__meters">
          ${d.metros.map(([r, v]) => `
            <div class="meter">
              <b>${r}<span>${v}%</span></b>
              <i style="--w:${v}%"></i>
            </div>`).join('')}
        </div>
      </div>`;
  }

  $$('.sectors__tabs .chip').forEach(b => b.addEventListener('click', () => {
    $$('.sectors__tabs .chip').forEach(o => {
      o.classList.toggle('is-on', o === b);
      o.setAttribute('aria-selected', String(o === b));
    });
    render(b.dataset.sector);
  }));

  render('industria');
})();

/* ─────────────── 5. raio-x do negócio ─────────────── */
(() => {
  const form = $('#diagForm');
  if (!form) return;

  /* perfis por setor — estimativas de ordem de grandeza, ajustáveis pelo usuário */
  const SETOR = {
    varejo:      { rot:'Comércio e varejo',        aliq:26.5, ins:65, folha:12, atual:{simples:4.0,presumido:12.0,real:13.5},
                   nota:'Regime geral. Itens da Cesta Básica Nacional têm alíquota zero e vários alimentos, redução de 60% — depende da classificação do catálogo.' },
    ecommerce:   { rot:'E-commerce',               aliq:26.5, ins:62, folha:14, atual:{simples:4.2,presumido:12.5,real:13.8},
                   nota:'Regime geral, com cobrança no destino: o imposto passa a pertencer ao estado e ao município do comprador.' },
    industria:   { rot:'Indústria',                aliq:26.5, ins:55, folha:18, atual:{simples:4.5,presumido:11.5,real:12.5},
                   nota:'Regime geral. Ganho vem do crédito amplo sobre insumos, energia e bens de capital.' },
    servicos:    { rot:'Serviços em geral',        aliq:26.5, ins:22, folha:38, atual:{simples:6.0,presumido:8.65,real:14.25},
                   nota:'Regime geral, alíquota cheia. Folha não gera crédito — é o setor de maior exposição.' },
    tec:         { rot:'Tecnologia e software',    aliq:26.5, ins:25, folha:42, atual:{simples:6.0,presumido:6.65,real:12.25},
                   nota:'Regime geral. Acaba a disputa ICMS × ISS sobre software; exportação é desonerada.' },
    marketing:   { rot:'Marketing e agência',      aliq:26.5, ins:28, folha:40, atual:{simples:6.0,presumido:6.65,real:12.25},
                   nota:'Regime geral. Mídia, produção e freelancers com nota geram crédito; equipe própria não.' },
    liberal:     { rot:'Profissão liberal',        aliq:18.55, ins:18, folha:45, atual:{simples:6.0,presumido:6.65,real:12.25},
                   nota:'Redução de 30% sobre a alíquota de referência para profissões regulamentadas — 18,55% no cenário de 26,5%.' },
    saude:       { rot:'Saúde e educação',         aliq:10.6, ins:25, folha:45, atual:{simples:6.0,presumido:6.65,real:12.25},
                   nota:'Redução de 60% sobre a alíquota de referência — 10,6% no cenário de 26,5%, conforme lista legal.' },
    agro:        { rot:'Agronegócio e alimentos',  aliq:10.6, ins:60, folha:15, atual:{simples:4.0,presumido:8.0,real:9.0},
                   nota:'Redução de 60% para grande parte dos alimentos e insumos agropecuários; itens da cesta básica, alíquota zero.' },
    construcao:  { rot:'Construção e imobiliário', aliq:18.55, ins:50, folha:25, atual:{simples:4.5,presumido:7.5,real:10.0},
                   nota:'Regime específico de bens imóveis, com redutor de alíquota e redutor de base sobre o valor do terreno.' },
    transporte:  { rot:'Transporte e logística',   aliq:26.5, ins:45, folha:30, atual:{simples:5.0,presumido:9.0,real:11.5},
                   nota:'Regime geral no frete; transporte coletivo de passageiros tem redução de 60%.' },
    alimentacao: { rot:'Bares e restaurantes',     aliq:26.5, ins:42, folha:28, atual:{simples:5.0,presumido:10.0,real:12.0},
                   nota:'Regime específico do setor, com apuração própria sobre a receita e crédito limitado.' }
  };

  const REGIME = {
    simples:   'Continua existindo. Você escolherá entre recolher IBS e CBS dentro da guia unificada — mais simples, porém transferindo crédito reduzido — ou por fora, gerando crédito integral ao cliente.',
    presumido: 'Hoje o PIS/Cofins é cumulativo a 3,65% e não gera crédito. No novo sistema, todo insumo com nota vira crédito — é onde costuma estar o maior ganho do Presumido.',
    real:      'Você já convive com não cumulatividade parcial. A mudança está na amplitude: passa a creditar também uso, consumo, energia e serviços antes vedados.'
  };

  const el = {
    nome:$('#dNome'), setor:$('#dSetor'), fat:$('#dFat'), regime:$('#dRegime'),
    ins:$('#dInsumos'), folha:$('#dFolha'), atual:$('#dAtual'), nova:$('#dNova'),
    benef:$('#dBenef'), split:$('#dSplit')
  };
  let canal = 'misto';
  let tocou = { ins:false, folha:false, atual:false, nova:false };

  /* máscara de moeda */
  const digitos = s => (s || '').replace(/\D/g, '');
  function mascara(){
    const v = digitos(el.fat.value).slice(0, 12);
    el.fat.value = v ? Number(v).toLocaleString('pt-BR') : '';
  }
  const faturamento = () => Number(digitos(el.fat.value) || 0);

  /* aplica os padrões do setor + regime nos campos ainda não tocados */
  function preencher(forcar){
    const s = SETOR[el.setor.value];
    const r = el.regime.value;
    if (forcar || !tocou.ins)   el.ins.value   = s.ins;
    if (forcar || !tocou.folha) el.folha.value = s.folha;
    if (forcar || !tocou.nova)  el.nova.value  = s.aliq;
    if (forcar || !tocou.atual) el.atual.value = s.atual[r];
    $('#dSetorHint').textContent  = s.nota;
    $('#dRegimeHint').textContent = REGIME[r];
    $('#dNovaHint').textContent   = s.aliq < 26.5
      ? `Sugerido ${num(s.aliq,2).replace(/,?0+$/,'')}% — já considera a redução aplicável ao seu setor.`
      : 'Alíquota de referência cheia. Reduza para 18,55% (redução de 30%) ou 10,6% (redução de 60%) se o seu enquadramento permitir.';
  }

  function calcular(){
    const fat  = faturamento();
    const mes  = fat / 12;
    const ins  = +el.ins.value / 100;
    const folha= +el.folha.value;
    const atual= +el.atual.value;
    const aliq = +el.nova.value;
    const nome = (el.nome.value || '').trim();

    /* rótulos ao vivo */
    $('#vdInsumos').textContent = el.ins.value + '%';
    $('#vdFolha').textContent   = folha + '%';
    $('#vdAtual').textContent   = num(atual, 2).replace(/,?0+$/, '') + '%';
    $('#vdNova').textContent    = num(aliq, 2).replace(/,?0+$/, '') + '%';
    $('#dFatHint').textContent  = fat
      ? `${brl.format(mes)} por mês · ${porte(fat)}`
      : 'Informe o faturamento para calcular.';

    /* núcleo do cálculo */
    const debito    = mes * aliq / 100;
    const credito   = mes * ins * aliq / 100;
    const liquido   = debito - credito;
    const cargaNova = aliq * (1 - ins);           // % sobre a receita
    const delta     = cargaNova - atual;           // pontos percentuais
    const hojeMes   = mes * atual / 100;
    const deltaAno  = (delta / 100) * fat;
    const caixa     = el.split.checked ? debito : 0;

    /* cabeçalho */
    $('#dTitulo').textContent = nome ? `Leitura de ${nome}` : 'Leitura do seu negócio';
    const vd = $('#dVeredito');
    if (delta <= -0.75)      { vd.textContent = 'Tende a ganhar';   }
    else if (delta < 0.75)   { vd.textContent = 'Praticamente neutro'; }
    else if (delta < 4)      { vd.textContent = 'Carga sobe';       }
    else                     { vd.textContent = 'Carga sobe muito'; }

    $('#dDelta').textContent = (delta > 0 ? '+' : delta < 0 ? '−' : '') + num(Math.abs(delta), 1);
    const base = delta >= 0
      ? 'pontos percentuais a mais de carga sobre a receita, comparando hoje com o sistema pleno de 2033'
      : 'pontos percentuais a menos de carga sobre a receita, comparando hoje com o sistema pleno de 2033';
    $('#dDeltaTxt').textContent = el.regime.value === 'simples'
      ? base + '. Atenção: a comparação assume que você passe a recolher IBS e CBS pelo regime regular — permanecendo na guia unificada do Simples, a sua carga direta muda pouco.'
      : base;

    /* barras comparativas */
    const teto = Math.max(hojeMes, liquido, 1);
    $('#dBarA').style.setProperty('--w', clamp(hojeMes / teto * 100, 2, 100) + '%');
    $('#dBarB').style.setProperty('--w', clamp(liquido / teto * 100, 2, 100) + '%');
    $('#dValA').textContent = brl.format(hojeMes);
    $('#dValB').textContent = brl.format(liquido);

    $('#dAnual').innerHTML = fat
      ? (Math.abs(deltaAno) < 1
          ? 'No agregado do ano, o resultado é praticamente o mesmo.'
          : `No ano, isso representa <b>${deltaAno >= 0 ? 'um custo adicional' : 'uma economia'} de ${brlShort(Math.abs(deltaAno))}</b> sobre um faturamento de ${brlShort(fat)}.`)
      : 'Informe o faturamento para ver o efeito anual.';

    /* cartões */
    $('#dDebito').textContent  = brl.format(debito);
    $('#dCredito').textContent = brl.format(credito);
    $('#dLiquido').textContent = brl.format(liquido);
    $('#dCaixa').textContent   = el.split.checked ? brl.format(caixa) : '—';

    /* ── exposição ── */
    let risco = clamp((delta + 3) / 12 * 55, 0, 55);
    const fatores = [];

    if (delta >= 4)      { fatores.push(['!', `A carga sobe <b>${num(delta,1)} p.p.</b> sobre a receita. Sem repasse de preço, isso sai direto da margem.`, true]); }
    else if (delta >= .75){ fatores.push(['!', `Alta moderada de <b>${num(delta,1)} p.p.</b> — dá para absorver com ganho de crédito e revisão de fornecedores.`, false]); }
    else if (delta <= -.75){ fatores.push(['✓', `A carga <b>cai ${num(-delta,1)} p.p.</b>. O crédito amplo mais do que compensa a alíquota maior.`, false]); }
    else                  { fatores.push(['≈', 'Efeito praticamente neutro na carga. O impacto real fica no caixa e nos sistemas.', false]); }

    if (folha >= 35){ risco += 15; fatores.push(['!', `Folha em <b>${folha}% da receita</b>. Salários não geram crédito de IBS e CBS — é a sua maior fonte de exposição.`, true]); }
    else if (folha >= 25){ risco += 8; fatores.push(['·', `Folha em ${folha}% da receita, sem direito a crédito. Vale monitorar.`, false]); }

    if (+el.ins.value < 25){ risco += 12; fatores.push(['!', `Só <b>${el.ins.value}%</b> da receita vira compra com nota. Base de crédito curta contra alíquota cheia.`, true]); }
    else if (+el.ins.value >= 55){ fatores.push(['✓', `<b>${el.ins.value}%</b> da receita gera crédito integral — o novo sistema trabalha a seu favor.`, false]); }

    if (el.benef.checked){ risco += 15; fatores.push(['!', 'Você depende de <b>benefício de ICMS</b>. Ele se extingue na transição, com compensação parcial e temporária pelo Fundo de Compensação até 2032.', true]); }

    if (el.regime.value === 'simples'){
      risco += canal === 'b2c' ? 4 : 12;
      fatores.push(['·', canal === 'b2c'
        ? 'No Simples vendendo a consumidor final, permanecer na guia unificada costuma ser a rota natural — o cliente não aproveita crédito.'
        : 'No Simples vendendo para empresas, o crédito reduzido que você transfere <b>encarece você</b> frente a um concorrente do regime regular.', canal !== 'b2c']);
    }

    if (canal === 'b2c' && delta >= 2){ risco += 8; fatores.push(['!', 'Vendendo a consumidor final, o repasse de preço é limitado: o cliente não recupera o imposto.', true]); }
    if (canal === 'b2b' && delta >= 2){ fatores.push(['✓', 'Vendendo para empresas, o seu cliente credita o imposto integralmente — o repasse de preço é bem mais viável.', false]); }

    if (el.split.checked && caixa > 0){
      risco += 6;
      fatores.push(['·', `Com split payment, <b>${brl.format(caixa)} por mês</b> saem do caixa no ato da liquidação. O crédito volta na apuração, mas o giro sente o descasamento.`, false]);
    }

    risco = clamp(Math.round(risco), 4, 100);
    const nivel = risco < 30 ? 'Exposição baixa' : risco < 55 ? 'Exposição moderada' : risco < 78 ? 'Exposição alta' : 'Exposição crítica';
    $('#dRiscoTag').textContent = nivel;
    $('#dRiscoBar').style.setProperty('--w', risco + '%');
    $('#dFatores').innerHTML = fatores.map(([ic, txt, alto]) =>
      `<li><span class="ic${alto ? ' ic--hi' : ''}">${ic}</span><span>${txt}</span></li>`).join('');

    /* ── prioridades ── */
    const acoes = [];
    if (el.benef.checked) acoes.push(['Quantifique a dependência do benefício de ICMS',
      'Calcule quanto da sua margem vem do incentivo e simule o resultado sem ele em 2029, 2031 e 2033. Essa conta define a sua estratégia de preço para a década.']);
    if (+el.ins.value < 30) acoes.push(['Mapeie tudo que pode virar crédito',
      'Energia, aluguel, software, frete, manutenção, serviços terceirizados: no novo sistema quase toda compra com nota gera crédito. Formalizar despesas hoje informais aumenta a sua base.']);
    if (delta >= 2) acoes.push(['Reprecifique antes de ser obrigado',
      `Com o imposto fora do preço, a sua tabela precisa ser reconstruída. Simule margem com carga de ${num(cargaNova,1)}% da receita e teste a elasticidade do seu cliente.`]);
    if (el.regime.value === 'simples') acoes.push(['Decida entre Simples e regime regular',
      canal === 'b2c'
        ? 'Vendendo a consumidor final, a guia unificada tende a vencer. Reavalie se a sua parcela B2B crescer.'
        : 'Vendendo para empresas, simule os dois cenários: o crédito integral que você passaria a transferir pode valer mais do que a economia da guia unificada.']);
    if (el.split.checked) acoes.push(['Reprojete o capital de giro',
      `Refaça o fluxo de caixa considerando ${brl.format(caixa)} por mês saindo na liquidação, e não mais no vencimento da guia. Renegocie prazo com fornecedores antes de 2027.`]);
    if (folha >= 30) acoes.push(['Revise a estrutura de contratação',
      'Folha não gera crédito; serviço contratado de pessoa jurídica, sim. Avalie — com apoio jurídico e sem descaracterizar vínculo — o desenho da sua estrutura de custos.']);
    if (canal !== 'b2c') acoes.push(['Qualifique a sua base de fornecedores',
      'Fornecedor fora do regime ou no Simples com crédito reduzido passa a custar mais caro na prática. Inclua o perfil tributário no seu critério de compra.']);

    acoes.push(['Acerte a classificação fiscal do catálogo',
      'NCM e NBS corretos são o que define alíquota, redução e regime específico. Errar aqui contamina todo o resto do cálculo.']);
    acoes.push(['Prepare ERP e emissor ainda em 2026',
      'Os campos de IBS, CBS e IS já constam das notas técnicas vigentes. Este é o ano de errar sem custo material — ele não se repete.']);

    const top = acoes.slice(0, 5);
    $('#dAcoesTag').textContent = `${top.length} frentes`;
    $('#dAcoes').innerHTML = top.map(([t, d]) => `<li><span><b>${t}</b>${d}</span></li>`).join('');
  }

  function porte(fat){
    if (fat <= 360000)    return 'microempresa';
    if (fat <= 4800000)   return 'pequeno porte';
    if (fat <= 30000000)  return 'porte médio';
    if (fat <= 300000000) return 'porte médio-grande';
    return 'grande porte';
  }

  /* eventos */
  el.fat.addEventListener('input', () => { mascara(); calcular(); });
  el.setor.addEventListener('change', () => { preencher(false); calcular(); });
  el.regime.addEventListener('change', () => { preencher(false); calcular(); });
  el.ins.addEventListener('input',   () => { tocou.ins = true;   calcular(); });
  el.folha.addEventListener('input', () => { tocou.folha = true; calcular(); });
  el.atual.addEventListener('input', () => { tocou.atual = true; calcular(); });
  el.nova.addEventListener('input',  () => { tocou.nova = true;  calcular(); });
  el.nome.addEventListener('input', calcular);
  el.benef.addEventListener('change', calcular);
  el.split.addEventListener('change', calcular);
  form.addEventListener('submit', e => e.preventDefault());

  $$('#dCanal button').forEach(b => b.addEventListener('click', () => {
    canal = b.dataset.v;
    $$('#dCanal button').forEach(o => o.classList.toggle('is-on', o === b));
    calcular();
  }));

  $('#dReset').addEventListener('click', () => {
    tocou = { ins:false, folha:false, atual:false, nova:false };
    preencher(true);
    calcular();
  });

  preencher(true);
  mascara();
  calcular();
})();

/* ─────────────── 6. checklist ─────────────── */
(() => {
  const lista = $('#ckList');
  if (!lista) return;

  const itens = $$('input[data-ck]', lista);
  const CHAVE = 'rt-checklist';
  const ler = () => { try { return JSON.parse(localStorage.getItem(CHAVE) || '[]'); } catch { return []; } };
  const gravar = v => { try { localStorage.setItem(CHAVE, JSON.stringify(v)); } catch {} };

  const salvos = ler();
  itens.forEach(i => { if (salvos.includes(i.dataset.ck)) i.checked = true; });

  const CIRC = 2 * Math.PI * 52;
  $('#gaugeFg').style.strokeDasharray = CIRC;
  $('#ckTotal').textContent = itens.length;

  function atualizar(){
    const feitos = itens.filter(i => i.checked);
    const pct = Math.round(feitos.length / itens.length * 100);
    $('#ckDone').textContent = feitos.length;
    $('#ckPct').textContent = pct + '%';
    $('#gaugeFg').style.strokeDashoffset = CIRC * (1 - pct / 100);
    $('#ckStage').textContent =
      pct === 0   ? 'Não iniciado' :
      pct < 34    ? 'Início'       :
      pct < 67    ? 'Em andamento' :
      pct < 100   ? 'Avançado'     : 'Pronto';
    gravar(feitos.map(i => i.dataset.ck));
  }

  itens.forEach(i => i.addEventListener('change', atualizar));
  $('#ckReset').addEventListener('click', () => {
    itens.forEach(i => i.checked = false);
    atualizar();
  });
  atualizar();
})();

/* ─────────────── 7. formulário de contato ─────────────── */
(() => {
  const form = $('#leadForm');
  if (!form) return;
  const ok = $('#formOk');

  const REGRAS = {
    nome:    v => v.trim().length >= 2 || 'Informe o seu nome.',
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Informe um e-mail válido.',
    empresa: v => v.trim().length >= 2 || 'Informe a sua empresa.'
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valido = true;

    for (const [campo, regra] of Object.entries(REGRAS)){
      const input = form.elements[campo];
      const alvo  = $(`[data-err="${campo}"]`, form);
      const r = regra(input.value);
      const msg = r === true ? '' : r;
      alvo.textContent = msg;
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg && valido){ input.focus(); valido = false; }
    }
    if (!valido) return;

    /* Sem backend: o site é estático. Trocar por fetch() para o seu CRM
       ou apontar o form para um endpoint quando houver servidor. */
    ok.hidden = false;
    ok.textContent = `Obrigado, ${form.elements.nome.value.trim().split(' ')[0]}. Recebemos o seu pedido — retornamos em até um dia útil.`;
    form.querySelector('button[type=submit]').disabled = true;
  });
})();

/* ─────────────── 8. ano no rodapé ─────────────── */
$('#year').textContent = new Date().getFullYear();

})();
