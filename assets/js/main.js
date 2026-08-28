/* ═══════════════════════════════════════════════════════════
   Nova Reforma Tributária, comportamento
   Sem dependências. Todo cálculo roda no navegador do visitante.
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

const brl  = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
const num  = (n, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits:d, maximumFractionDigits:d });
const pct  = n => num(n, 2).replace(/,?0+$/, '') + '%';

function brlShort(v){
  const a = Math.abs(v), sinal = v < 0 ? '−' : '';
  if (a >= 1e9) return sinal + 'R$ ' + num(a / 1e9, 1) + ' bi';
  if (a >= 1e6) return sinal + 'R$ ' + num(a / 1e6, 1) + ' mi';
  if (a >= 1e5) return sinal + 'R$ ' + num(a / 1e3, 0) + ' mil';
  return sinal + brl.format(a);
}

/* ─────────────── 1. tema ─────────────── */
(() => {
  const root = document.documentElement;
  const stored = (() => { try { return localStorage.getItem('rt-tema'); } catch { return null; } })();
  const marcado = root.dataset.theme;
  const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = stored || marcado || (prefers ? 'dark' : 'light');

  $('#themeToggle')?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('rt-tema', root.dataset.theme); } catch {}
  });
})();

/* ─────────────── 2. navegação ─────────────── */
(() => {
  const burger = $('#burger'), menu = $('#mobilenav');
  burger?.addEventListener('click', () => {
    const abrir = menu.hidden;
    menu.hidden = !abrir;
    burger.setAttribute('aria-expanded', String(abrir));
  });
  $$('#mobilenav a').forEach(a => a.addEventListener('click', () => {
    menu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
  }));

  const links = $$('.rail a[data-spy]');
  const alvos = links.map(a => $('#' + a.dataset.spy)).filter(Boolean);
  if (!alvos.length) return;
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('is-on', l.dataset.spy === e.target.id));
  }), { rootMargin:'-45% 0px -50% 0px', threshold:0 });
  alvos.forEach(s => spy.observe(s));
})();

/* ─────────────── 3. revelação e contadores ─────────────── */
(() => {
  const alvos = $$('.card, .tl, .strip > div, .section__head, .qa, .hero__head, .tablewrap');
  alvos.forEach((el, i) => {
    el.setAttribute('data-reveal', '');
    el.style.transitionDelay = Math.min(i % 6, 5) * 55 + 'ms';
  });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
    $$('[data-count]', e.target).forEach(anima);
  }), { threshold:.12, rootMargin:'0px 0px -40px' });
  alvos.forEach(el => io.observe(el));

  function anima(el){
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const alvo = parseFloat(el.dataset.count);
    const dec  = parseInt(el.dataset.decimals || '0', 10);
    const t0   = performance.now();
    (function passo(t){
      const p = clamp((t - t0) / 1150, 0, 1);
      el.textContent = num(alvo * (1 - Math.pow(1 - p, 3)), dec);
      if (p < 1) requestAnimationFrame(passo);
    })(t0);
  }
})();

/* ─────────────── 4. impactos por setor ─────────────── */
(() => {
  const painel = $('#sectorPanel');
  if (!painel) return;

  const DADOS = {
    industria:{
      titulo:'Indústria e manufatura',
      texto:'O setor que mais tende a ganhar. A cadeia industrial acumula insumos tributados em cada etapa e hoje convive com crédito restrito, substituição tributária e resíduo de imposto embutido no custo. Com crédito financeiro amplo, esse resíduo desaparece.',
      metros:[['Aproveitamento de crédito',88],['Complexidade da transição',62],['Pressão sobre o preço final',30]],
      pontos:['Fim da substituição tributária elimina a antecipação de imposto sobre margem presumida.',
              'Bens de capital e energia passam a gerar crédito integral, reduzindo o custo de investir.',
              'Benefícios de ICMS estaduais se extinguem, e quem depende deles precisa recompor margem.',
              'Cobrança no destino redesenha a lógica de localização de centros de distribuição.']},
    varejo:{
      titulo:'Comércio e varejo',
      texto:'Crédito amplo sobre mercadoria, frete, energia e aluguel melhora bastante o resultado fiscal. Em contrapartida, o imposto passa a aparecer destacado na nota e a formação de preço precisa ser refeita do zero.',
      metros:[['Aproveitamento de crédito',80],['Complexidade da transição',58],['Pressão sobre o preço final',52]],
      pontos:['Preço deixa de ter tributo por dentro, então tabelas e políticas de desconto mudam.',
              'Cesta Básica Nacional com alíquota zero e reduções de 60% exigem catálogo bem classificado.',
              'Split payment antecipa a saída de caixa do imposto para o momento da liquidação.',
              'Fornecedor no Simples que não transfere crédito integral passa a custar mais caro.']},
    servicos:{
      titulo:'Serviços em geral',
      texto:'O ponto de maior atenção. Quem tem folha alta e poucas compras tributadas sai da alíquota atual de ISS somada a PIS e Cofins para uma alíquota cheia, com pouca base de crédito para abater.',
      metros:[['Aproveitamento de crédito',26],['Complexidade da transição',48],['Pressão sobre o preço final',86]],
      pontos:['Salários e encargos não geram crédito, então a folha vira o principal fator de exposição.',
              'Profissões liberais regulamentadas têm redução de 30% sobre a alíquota de referência.',
              'Cliente empresarial recupera o imposto integralmente, o que torna o repasse mais viável no B2B.',
              'Cobrança no destino altera a disputa entre municípios e o cadastro de tomadores.']},
    agro:{
      titulo:'Agronegócio e alimentos',
      texto:'Tratamento diferenciado extenso: o produtor rural abaixo do limite fica fora do regime, com crédito presumido para o comprador, e boa parte dos alimentos entra em redução de 60% ou em alíquota zero.',
      metros:[['Aproveitamento de crédito',72],['Complexidade da transição',66],['Pressão sobre o preço final',24]],
      pontos:['Cesta Básica Nacional de Alimentos com alíquota zero, sem quebra da cadeia de crédito.',
              'Crédito presumido nas aquisições de produtor rural pessoa física não contribuinte.',
              'Insumos agropecuários mantêm redução relevante de alíquota.',
              'Exportação segue desonerada, agora com devolução de crédito mais previsível.']},
    saude:{
      titulo:'Saúde e educação',
      texto:'Regimes com redução de 60% da alíquota de referência. O alívio é real, mas a base de crédito é curta, porque a maior parte do custo é pessoal, e a classificação de cada serviço define o enquadramento.',
      metros:[['Aproveitamento de crédito',36],['Complexidade da transição',54],['Pressão sobre o preço final',48]],
      pontos:['Redução de 60% para serviços de saúde, educação e dispositivos médicos elencados em lei.',
              'O enquadramento depende de lista taxativa: o que fica fora volta à alíquota cheia.',
              'Planos de saúde têm regime específico próprio, distinto do prestador de serviço.',
              'Instituições imunes e sem fins lucrativos exigem análise à parte.']},
    tec:{
      titulo:'Tecnologia e software',
      texto:'Acaba a disputa entre ICMS e ISS sobre software, porque tudo passa a ser IBS e CBS, o que simplifica enormemente. O desafio é a alíquota cheia sobre operações de margem alta e custo concentrado em pessoas.',
      metros:[['Aproveitamento de crédito',34],['Complexidade da transição',44],['Pressão sobre o preço final',78]],
      pontos:['Acaba a insegurança sobre licenciamento, SaaS e serviço, com a mesma regra para todos.',
              'Infraestrutura de nuvem, licenças e ferramentas passam a gerar crédito integral.',
              'Exportação de software é desonerada, com devolução de crédito acumulado.',
              'Venda para pessoa física sente a alíquota cheia, sem repasse de crédito ao cliente.']},
    construcao:{
      titulo:'Construção e imobiliário',
      texto:'Regime específico de bens imóveis, com redutor de alíquota e redutor de base sobre o valor do terreno. A cadeia é intensiva em materiais tributados, o que amplia bastante o crédito disponível.',
      metros:[['Aproveitamento de crédito',66],['Complexidade da transição',72],['Pressão sobre o preço final',44]],
      pontos:['Redutor social e redutor de ajuste reduzem a base nas operações com imóveis.',
              'Materiais, locação de equipamento e serviços de terceiros geram crédito integral.',
              'Contratos longos precisam de cláusula de reequilíbrio para atravessar 2029 a 2032.',
              'Locação de imóveis por pessoa física tem regra própria, com limites de enquadramento.']},
    transporte:{
      titulo:'Transporte e logística',
      texto:'Frete segue no regime geral, enquanto o transporte coletivo de passageiros tem redução de 60%. Combustível, pedágio, manutenção e frota passam a gerar crédito, o que muda bastante a conta do setor.',
      metros:[['Aproveitamento de crédito',70],['Complexidade da transição',60],['Pressão sobre o preço final',38]],
      pontos:['Combustíveis têm regime monofásico próprio, com crédito para o adquirente contribuinte.',
              'Aquisição de frota e manutenção passam a gerar crédito integral.',
              'Transporte coletivo de passageiros entra na redução de 60%.',
              'Cobrança no destino redistribui a arrecadação entre estados de origem e de destino.']}
  };

  function render(chave){
    const d = DADOS[chave]; if (!d) return;
    painel.innerHTML = `
      <div class="sec__grid">
        <div>
          <h3>${d.titulo}</h3>
          <p>${d.texto}</p>
          <ul class="sec__points">${d.pontos.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
        <div class="sec__meters">
          ${d.metros.map(([r,v]) => `<div class="meter"><b>${r}<span>${v}%</span></b><i style="--w:${v}%"></i></div>`).join('')}
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

  /* Divisão estimada da alíquota de referência entre os dois tributos.
     CBS federal cerca de 8,8 e IBS subnacional cerca de 17,7 em 26,5. */
  const CBS_SHARE = 8.8 / 26.5;
  const IBS_SHARE = 1 - CBS_SHARE;

  /* Degraus da transição, conforme a EC 132/2023.
     ibs  = fração da alíquota cheia de IBS cobrada no ano
     velho = fração de ICMS e ISS ainda vigente
     cbs  = fração da CBS vigente (PIS e Cofins caem junto)   */
  const ANOS = [
    { ano:2026, cbs:0,    ibs:0,    velho:1,   fed:1, nota:'Ano-teste: alíquotas de 0,9% e 0,1% são compensáveis, então o efeito é praticamente nulo.' },
    { ano:2027, cbs:1,    ibs:0,    velho:1,   fed:0, nota:'CBS integral, PIS e Cofins extintos. IBS ainda no piso e ICMS e ISS cheios.' },
    { ano:2028, cbs:1,    ibs:0,    velho:1,   fed:0, nota:'Mesma configuração de 2027, último ano antes de o IBS começar a subir.' },
    { ano:2029, cbs:1,    ibs:0.10, velho:0.90,fed:0, nota:'IBS a 10% da alíquota cheia, ICMS e ISS reduzidos a 90%.' },
    { ano:2030, cbs:1,    ibs:0.20, velho:0.80,fed:0, nota:'IBS a 20%, ICMS e ISS a 80%.' },
    { ano:2031, cbs:1,    ibs:0.30, velho:0.70,fed:0, nota:'IBS a 30%, ICMS e ISS a 70%.' },
    { ano:2032, cbs:1,    ibs:0.40, velho:0.60,fed:0, nota:'IBS a 40%, ICMS e ISS a 60%. Último ano de convivência.' },
    { ano:2033, cbs:1,    ibs:1,    velho:0,   fed:0, nota:'Sistema pleno: só IBS, CBS e Imposto Seletivo.' }
  ];

  /* Perfis de partida por setor. Estimativas de ordem de grandeza, todas ajustáveis.
     fed = parcela da carga atual que é federal (PIS e Cofins); o resto é ICMS ou ISS. */
  const SETOR = {
    varejo:      { aliq:26.5, ins:65, folha:12, forn:25, prazo:20, margem:6,  fed:.30, atual:{simples:4.0,presumido:12.0,real:13.5},
                   nota:'Regime geral. Itens da Cesta Básica Nacional têm alíquota zero e vários alimentos ficam na redução de 60%, o que depende da classificação do catálogo.' },
    ecommerce:   { aliq:26.5, ins:62, folha:14, forn:25, prazo:15, margem:6,  fed:.30, atual:{simples:4.2,presumido:12.5,real:13.8},
                   nota:'Regime geral, com cobrança no destino: o imposto passa a pertencer ao estado e ao município do comprador.' },
    industria:   { aliq:26.5, ins:55, folha:18, forn:15, prazo:45, margem:9,  fed:.30, atual:{simples:4.5,presumido:11.5,real:12.5},
                   nota:'Regime geral. O ganho vem do crédito amplo sobre insumos, energia e bens de capital.' },
    servicos:    { aliq:26.5, ins:22, folha:38, forn:35, prazo:30, margem:14, fed:.42, atual:{simples:6.0,presumido:8.65,real:14.25},
                   nota:'Regime geral, alíquota cheia. Folha não gera crédito, e por isso este é o grupo de maior exposição.' },
    tec:         { aliq:26.5, ins:25, folha:42, forn:30, prazo:30, margem:18, fed:.55, atual:{simples:6.0,presumido:6.65,real:12.25},
                   nota:'Regime geral. Acaba a disputa entre ICMS e ISS sobre software, e a exportação é desonerada.' },
    marketing:   { aliq:26.5, ins:28, folha:40, forn:45, prazo:30, margem:15, fed:.55, atual:{simples:6.0,presumido:6.65,real:12.25},
                   nota:'Regime geral. Mídia, produção e prestadores com nota geram crédito; equipe própria não gera.' },
    liberal:     { aliq:18.55,ins:18, folha:45, forn:35, prazo:30, margem:22, fed:.55, atual:{simples:6.0,presumido:6.65,real:12.25},
                   nota:'Redução de 30% sobre a alíquota de referência para profissões regulamentadas, o que dá 18,55% no cenário de 26,5%.' },
    saude:       { aliq:10.6, ins:25, folha:45, forn:25, prazo:45, margem:12, fed:.55, atual:{simples:6.0,presumido:6.65,real:12.25},
                   nota:'Redução de 60% sobre a alíquota de referência, o que dá 10,6% no cenário de 26,5%, conforme a lista legal.' },
    agro:        { aliq:10.6, ins:60, folha:15, forn:40, prazo:45, margem:10, fed:.40, atual:{simples:4.0,presumido:8.0,real:9.0},
                   nota:'Redução de 60% para grande parte dos alimentos e insumos agropecuários, e alíquota zero para itens da cesta básica.' },
    construcao:  { aliq:18.55,ins:50, folha:25, forn:35, prazo:60, margem:10, fed:.45, atual:{simples:4.5,presumido:7.5,real:10.0},
                   nota:'Regime específico de bens imóveis, com redutor de alíquota e redutor de base sobre o valor do terreno.' },
    transporte:  { aliq:26.5, ins:45, folha:30, forn:25, prazo:35, margem:8,  fed:.40, atual:{simples:5.0,presumido:9.0,real:11.5},
                   nota:'Regime geral no frete. O transporte coletivo de passageiros tem redução de 60%.' },
    alimentacao: { aliq:26.5, ins:42, folha:28, forn:40, prazo:5,  margem:7,  fed:.35, atual:{simples:5.0,presumido:10.0,real:12.0},
                   nota:'Regime específico do setor, com apuração própria sobre a receita e crédito limitado.' }
  };

  const REGIME = {
    simples:  'Continua existindo. Você escolherá entre recolher IBS e CBS dentro da guia unificada, transferindo crédito reduzido, ou por fora, gerando crédito integral ao cliente.',
    presumido:'Hoje o PIS e a Cofins são cumulativos a 3,65% e não geram crédito. No novo sistema todo insumo com nota vira crédito, e costuma ser aí que está o maior ganho do Presumido.',
    real:     'Você já convive com não cumulatividade parcial. A mudança está na amplitude: passa a creditar também uso, consumo, energia e serviços antes vedados.'
  };

  /* Perfil do cliente: quanto ele aproveita do crédito que você transfere,
     e portanto qual a sua liberdade para repassar preço. */
  const CLIENTE = {
    regular:   { rot:'empresas do regime regular', repasse:.85, risco:0,
                 nota:'O seu cliente credita 100% do IBS e da CBS que você destacar, então o imposto é neutro para ele e o repasse de preço é bem mais fácil.' },
    misto:     { rot:'perfil misto de clientes',   repasse:.55, risco:5,
                 nota:'Parte da sua carteira credita o imposto e parte não. O repasse funciona de forma desigual, e vale segmentar a política de preço.' },
    simples:   { rot:'empresas do Simples',        repasse:.35, risco:9,
                 nota:'Optantes do Simples aproveitam crédito reduzido, então enxergam boa parte do seu imposto como custo. O repasse encontra resistência.' },
    consumidor:{ rot:'consumidor final',           repasse:.20, risco:14,
                 nota:'Pessoa física não recupera imposto algum. Todo aumento de carga aparece direto na etiqueta e disputa com a elasticidade do seu preço.' },
    publico:   { rot:'órgãos públicos',            repasse:.30, risco:11,
                 nota:'Entes públicos não creditam, e o preço está preso a contrato e a licitação. O caminho de repasse costuma ser o pedido formal de reequilíbrio.' }
  };

  const el = {
    nome:$('#dNome'), setor:$('#dSetor'), cliente:$('#dCliente'), export:$('#dExport'),
    fat:$('#dFat'), regime:$('#dRegime'), margem:$('#dMargem'), ins:$('#dInsumos'),
    forn:$('#dFornSimples'), folha:$('#dFolha'), prazo:$('#dPrazo'),
    atual:$('#dAtual'), nova:$('#dNova'), benef:$('#dBenef'), split:$('#dSplit')
  };
  /* cada percentual do questionário carrega o valor em reais que ele representa */
  const val = id => $('#rd' + id);
  const mostra = (id, reais, sufixo = 'por mês') => {
    val(id).textContent = reais === null ? '' : `${brl.format(reais)} ${sufixo}`;
  };
  const AJUSTAVEIS = ['ins','folha','atual','nova','forn','prazo','margem'];
  let tocou = {};

  const digitos = s => (s || '').replace(/\D/g, '');
  const mascara = () => {
    const v = digitos(el.fat.value).slice(0, 12);
    el.fat.value = v ? Number(v).toLocaleString('pt-BR') : '';
  };
  const faturamento = () => Number(digitos(el.fat.value) || 0);

  function preencher(forcar){
    const s = SETOR[el.setor.value], r = el.regime.value;
    const set = (k, v) => { if (forcar || !tocou[k]) el[k].value = v; };
    set('ins', s.ins); set('folha', s.folha); set('forn', s.forn);
    set('prazo', s.prazo); set('margem', s.margem); set('nova', s.aliq);
    set('atual', s.atual[r]);
    $('#dSetorHint').textContent   = s.nota;
    $('#dRegimeHint').textContent  = REGIME[r];
    $('#dClienteHint').textContent = CLIENTE[el.cliente.value].nota;
    $('#dNovaHint').textContent = s.aliq < 26.5
      ? `Sugerido ${pct(s.aliq)}, já considerando a redução aplicável ao seu setor.`
      : 'Alíquota de referência cheia. Reduza para 18,55% na redução de 30% ou 10,6% na de 60%, se o seu enquadramento permitir.';
  }

  function calcular(){
    const fat    = faturamento();
    const mes    = fat / 12;
    const exp    = +el.export.value / 100;
    const ins    = +el.ins.value / 100;
    const forn   = +el.forn.value / 100;
    const folha  = +el.folha.value;
    const prazo  = +el.prazo.value;
    const margem = +el.margem.value;
    const atual  = +el.atual.value;
    const aliq   = +el.nova.value;
    const cli    = CLIENTE[el.cliente.value];
    const nome   = (el.nome.value || '').trim();
    const fed    = SETOR[el.setor.value].fed;

    /* rótulos ao vivo */
    const põe = (id, txt) => { const e = $('#vd' + id); e.firstChild.nodeValue = txt; };
    põe('Export',      el.export.value + '%');
    põe('Insumos',     el.ins.value + '%');
    põe('FornSimples', el.forn.value + '%');
    põe('Folha',       folha + '%');
    põe('Margem',      pct(margem));
    põe('Prazo',       prazo === 0 ? 'à vista' : prazo + ' dias');
    põe('Atual',       pct(atual));
    põe('Nova',        pct(aliq));

    /* o que cada percentual vale em dinheiro, para a conta ficar concreta */
    const gastoInsumos = mes * ins;
    if (!fat){
      ['Export','Insumos','FornSimples','Folha','Margem','Prazo','Atual','Nova']
        .forEach(id => mostra(id, null));
    } else {
      mostra('Export',      mes * exp);
      mostra('Insumos',     gastoInsumos);
      mostra('FornSimples', gastoInsumos * forn);
      mostra('Folha',       mes * folha / 100);
      mostra('Margem',      mes * margem / 100);
      mostra('Atual',       mes * atual / 100);
      mostra('Nova',        mes * (1 - exp) * aliq / 100, 'de débito');
      val('Prazo').textContent = prazo === 0
        ? 'recebe na hora'
        : `${brl.format(mes * prazo / 30)} a receber`;
    }
    $('#dFatHint').textContent = fat ? `${brl.format(mes)} por mês, ${porte(fat)}` : 'Informe o faturamento para calcular.';
    $('#dClienteHint').textContent = cli.nota;

    /* ── núcleo ──
       Fornecedor do Simples ou informal transfere crédito muito menor.
       Adotamos perda de 75% sobre a parcela vinda dessas fontes.        */
    const perdaForn   = forn * .75;
    const insEfetivo  = ins * (1 - perdaForn);
    const baseTrib    = mes * (1 - exp);            // exportação é desonerada
    const debito      = baseTrib * aliq / 100;
    const credito     = mes * insEfetivo * aliq / 100;   // crédito é mantido também na exportação
    const creditoCheio= mes * ins * aliq / 100;
    const perdido     = creditoCheio - credito;
    const liquido     = debito - credito;
    const cargaNova   = mes > 0 ? liquido / mes * 100 : 0;
    const delta       = cargaNova - atual;
    const hojeMes     = mes * atual / 100;
    const deltaAno    = (delta / 100) * fat;
    const margemNova  = margem - delta;

    /* Capital de giro: sem split, a guia vence por volta de 50 dias após a venda.
       Com split, o imposto sai no recebimento. A diferença é giro adicional.     */
    const diasAntes = el.split.checked ? Math.max(0, 50 - prazo) : 0;
    const giro      = debito * diasAntes / 30;

    /* ── cabeçalho ── */
    $('#dTitulo').textContent = nome ? `Leitura de ${nome}` : 'Leitura do seu negócio';
    $('#dVeredito').textContent =
      delta <= -.75 ? 'Tende a ganhar' : delta < .75 ? 'Praticamente neutro' :
      delta < 4 ? 'Carga sobe' : 'Carga sobe muito';
    $('#dDelta').textContent = (delta > 0 ? '+' : delta < 0 ? '−' : '') + num(Math.abs(delta), 1);

    const baseTxt = (delta >= 0 ? 'pontos percentuais a mais' : 'pontos percentuais a menos') +
      ' de carga sobre a receita, comparando hoje com o sistema pleno de 2033';
    $('#dDeltaTxt').textContent = el.regime.value === 'simples'
      ? baseTxt + '. Atenção: a comparação assume que você passe a recolher IBS e CBS pelo regime regular. Permanecendo na guia unificada do Simples, a sua carga direta muda pouco.'
      : baseTxt;

    const teto = Math.max(hojeMes, liquido, 1);
    $('#dBarA').style.setProperty('--w', clamp(hojeMes / teto * 100, 2, 100) + '%');
    $('#dBarB').style.setProperty('--w', clamp(Math.max(liquido,0) / teto * 100, 2, 100) + '%');
    $('#dValA').textContent = brl.format(hojeMes);
    $('#dValB').textContent = brl.format(liquido);

    $('#dAnual').innerHTML = !fat ? 'Informe o faturamento para ver o efeito anual.'
      : Math.abs(deltaAno) < 1 ? 'No agregado do ano, o resultado é praticamente o mesmo.'
      : `No ano, isso representa <b>${deltaAno >= 0 ? 'um custo adicional' : 'uma economia'} de ${brlShort(Math.abs(deltaAno))}</b> sobre um faturamento de ${brlShort(fat)}.`;

    /* ── indicadores ── */
    $('#dDebito').textContent  = brl.format(debito);
    $('#dCredito').textContent = brl.format(credito);
    $('#dCreditoSub').textContent = perdido > 1
      ? `${brl.format(perdido)} por mês se perdem em fornecedor do Simples ou informal`
      : 'recuperável integralmente, todo mês';

    $('#dLiquido').textContent = brl.format(liquido);
    $('#dLiquidoSub').textContent = liquido < 0
      ? 'saldo credor: você acumula crédito a ressarcir, típico de exportador'
      : 'o que sobra para recolher';

    $('#dMargemNova').textContent = pct(margemNova);
    $('#dMargemSub').textContent = margemNova <= 0
      ? `a variação consome toda a sua margem de ${pct(margem)}`
      : delta > 0 ? `perde ${num(delta,1)} p.p., ou seja ${num(delta/margem*100,0)}% da margem de ${pct(margem)}`
      : delta < 0 ? `ganha ${num(-delta,1)} p.p. sobre a margem de ${pct(margem)}`
      : `a margem de ${pct(margem)} fica praticamente igual`;

    $('#dGiro').textContent = el.split.checked ? brl.format(giro) : 'não aplicado';
    $('#dGiroSub').textContent = !el.split.checked ? 'split payment desmarcado'
      : diasAntes === 0 ? 'o seu prazo de recebimento é longo, o split quase não antecipa nada'
      : `o imposto sai ${diasAntes} dias antes do que sairia pela guia`;

    $('#dRepasse').textContent = Math.round(cli.repasse * 100) + '%';
    $('#dRepasseSub').textContent = `estimativa para quem vende a ${cli.rot}`;

    /* ── projeção ano a ano ── */
    const serie = ANOS.map(a => {
      const taxa  = aliq * (a.cbs * CBS_SHARE + a.ibs * IBS_SHARE);
      const novo  = taxa * (1 - exp) - taxa * insEfetivo;   // débito menos crédito
      const velho = atual * (fed * a.fed + (1 - fed) * a.velho);
      return { ...a, carga: novo + velho };
    });
    const maxC = Math.max(...serie.map(s => Math.abs(s.carga)), atual, 0.1);
    $('#dProj').innerHTML = serie.map(s => `
      <div class="proj__row${s.ano === 2026 ? ' is-now' : ''}${s.ano === 2033 ? ' is-end' : ''}" title="${s.nota}">
        <span class="proj__y">${s.ano}</span>
        <span class="proj__track"><i style="--w:${clamp(Math.max(s.carga,0) / maxC * 100, 1.5, 100)}%"></i></span>
        <b class="proj__v">${pct(s.carga)}</b>
        <b class="proj__r">${fat ? brl.format(mes * s.carga / 100) : ''}</b>
      </div>`).join('');

    /* ── exposição ── */
    let risco = clamp((delta + 3) / 12 * 48, 0, 48) + cli.risco;
    const F = [];

    if (delta >= 4)        F.push(['!', `A carga sobe <b>${num(delta,1)} p.p.</b> sobre a receita. Sem repasse de preço, isso sai direto da margem.`, true]);
    else if (delta >= .75) F.push(['!', `Alta moderada de <b>${num(delta,1)} p.p.</b>, absorvível com ganho de crédito e revisão de fornecedores.`, false]);
    else if (delta <= -.75)F.push(['+', `A carga <b>cai ${num(-delta,1)} p.p.</b>. O crédito amplo mais do que compensa a alíquota maior.`, false]);
    else                   F.push(['=', 'Efeito praticamente neutro na carga. O impacto real fica no caixa e nos sistemas.', false]);

    if (margemNova <= 0)      { risco += 16; F.push(['!', `A variação <b>consome toda a sua margem</b> de ${pct(margem)}. Reprecificar deixa de ser opção e vira condição de sobrevivência.`, true]); }
    else if (delta > margem*.3){ risco += 10; F.push(['!', `A carga adicional consome <b>${num(delta/margem*100,0)}% da sua margem</b> líquida atual.`, true]); }

    F.push([cli.repasse >= .7 ? '+' : '!', cli.nota, cli.repasse < .4]);

    if (folha >= 35)      { risco += 13; F.push(['!', `Folha em <b>${folha}% da receita</b>. Salários não geram crédito de IBS e CBS, e essa é a sua maior fonte de exposição.`, true]); }
    else if (folha >= 25) { risco += 7;  F.push(['·', `Folha em ${folha}% da receita, sem direito a crédito. Vale monitorar.`, false]); }

    if (+el.ins.value < 25)      { risco += 11; F.push(['!', `Só <b>${el.ins.value}%</b> da receita vira compra com nota. Base de crédito curta contra alíquota cheia.`, true]); }
    else if (+el.ins.value >= 55){ F.push(['+', `<b>${el.ins.value}%</b> da receita gera crédito, e o novo sistema trabalha a seu favor.`, false]); }

    if (+el.forn.value >= 30) { risco += 9; F.push(['!', `<b>${el.forn.value}%</b> das suas compras vêm do Simples ou de informais, o que joga fora cerca de <b>${brl.format(perdido)} por mês</b> de crédito.`, true]); }

    if (exp > 0) F.push(['+', `<b>${el.export.value}%</b> da receita é exportação, desonerada de IBS e CBS com crédito mantido. Isso tende a gerar saldo credor a ressarcir.`, false]);

    if (el.benef.checked) { risco += 14; F.push(['!', 'Você depende de <b>benefício de ICMS</b>, que se extingue na transição, com compensação parcial e temporária pelo Fundo de Compensação até 2032.', true]); }

    if (el.regime.value === 'simples'){
      risco += el.cliente.value === 'consumidor' ? 3 : 11;
      F.push(['·', el.cliente.value === 'consumidor'
        ? 'No Simples vendendo a consumidor final, permanecer na guia unificada costuma ser a rota natural, porque o cliente não aproveita crédito.'
        : 'No Simples vendendo para empresas, o crédito reduzido que você transfere <b>encarece você</b> frente a um concorrente do regime regular.',
        el.cliente.value !== 'consumidor']);
    }

    if (el.split.checked && giro > 0){
      risco += 6;
      F.push(['·', `Com split payment e recebimento em ${prazo === 0 ? 'à vista' : prazo + ' dias'}, você precisa de <b>${brl.format(giro)}</b> a mais de capital de giro.`, false]);
    }

    risco = clamp(Math.round(risco), 4, 100);
    $('#dRiscoTag').textContent = risco < 30 ? 'Exposição baixa' : risco < 55 ? 'Exposição moderada' : risco < 78 ? 'Exposição alta' : 'Exposição crítica';
    $('#dRiscoBar').style.setProperty('--w', risco + '%');
    $('#dFatores').innerHTML = F.map(([ic,txt,alto]) =>
      `<li><span class="ic${alto ? ' ic--hi' : ''}">${ic}</span><span>${txt}</span></li>`).join('');

    /* ── prioridades ── */
    const A = [];
    if (margemNova <= 0 || delta > margem * .3) A.push(['Reprecifique antes de ser obrigado',
      `A carga projetada é de ${pct(cargaNova)} da receita contra ${pct(atual)} hoje. Refaça a tabela com o imposto por fora e teste a elasticidade de cada faixa de cliente.`]);
    if (el.benef.checked) A.push(['Quantifique a dependência do benefício de ICMS',
      'Calcule quanto da sua margem vem do incentivo e simule o resultado sem ele em 2029, 2031 e 2033. Essa conta define a sua estratégia de preço para a década.']);
    if (+el.forn.value >= 30) A.push(['Renegocie com fornecedores do Simples e informais',
      `Cerca de ${brl.format(perdido)} por mês de crédito se perdem aí. Peça desconto equivalente, ou migre para fornecedor do regime regular, que transfere crédito integral.`]);
    if (+el.ins.value < 30) A.push(['Mapeie tudo que pode virar crédito',
      'Energia, aluguel, software, frete, manutenção e serviços terceirizados: quase toda compra com nota gera crédito. Formalizar despesas hoje informais aumenta a sua base.']);
    if (el.split.checked && giro > 0) A.push(['Reprojete o capital de giro',
      `Você precisa de cerca de ${brl.format(giro)} a mais em giro, porque o imposto passa a sair ${diasAntes} dias antes. Renegocie prazo com fornecedores antes de 2027.`]);
    if (cli.repasse < .5) A.push(['Monte uma política de preço por tipo de cliente',
      `Vendendo a ${cli.rot}, o repasse é limitado. Segmente a tabela: quem credita o imposto aceita preço com destaque, quem não credita olha só o valor final.`]);
    if (exp > 0) A.push(['Estruture o pedido de ressarcimento de crédito',
      'Com exportação relevante você acumula saldo credor. O prazo de devolução vira linha de fluxo de caixa, e o processo precisa de documentação desde já.']);
    if (folha >= 30) A.push(['Revise a estrutura de custos',
      'Folha não gera crédito, e serviço contratado de pessoa jurídica gera. Avalie o desenho da sua estrutura com apoio jurídico, sem descaracterizar vínculo de emprego.']);
    if (el.regime.value === 'simples') A.push(['Decida entre Simples e regime regular',
      el.cliente.value === 'consumidor'
        ? 'Vendendo a consumidor final, a guia unificada tende a vencer. Reavalie se a sua parcela de venda para empresas crescer.'
        : 'Vendendo para empresas, simule os dois cenários: o crédito integral que você passaria a transferir pode valer mais do que a economia da guia unificada.']);

    A.push(['Acerte a classificação fiscal do catálogo',
      'NCM e NBS corretos são o que define alíquota, redução e regime específico. Errar aqui contamina todo o resto do cálculo.']);
    A.push(['Prepare ERP e emissor ainda em 2026',
      'Os campos de IBS, CBS e IS já constam das notas técnicas vigentes. Este é o ano de errar sem custo material, e ele não se repete.']);

    const top = A.slice(0, 6);
    $('#dAcoesTag').textContent = `${top.length} frentes`;
    $('#dAcoes').innerHTML = top.map(([t,d]) => `<li><span><b>${t}</b>${d}</span></li>`).join('');
  }

  function porte(fat){
    if (fat <= 360000)    return 'microempresa';
    if (fat <= 4800000)   return 'empresa de pequeno porte';
    if (fat <= 30000000)  return 'porte médio';
    if (fat <= 300000000) return 'porte médio-grande';
    return 'grande porte';
  }

  el.fat.addEventListener('input', () => { mascara(); calcular(); });
  ['setor','regime'].forEach(k => el[k].addEventListener('change', () => { preencher(false); calcular(); }));
  el.cliente.addEventListener('change', calcular);
  AJUSTAVEIS.forEach(k => el[k].addEventListener('input', () => { tocou[k] = true; calcular(); }));
  ['nome'].forEach(k => el[k].addEventListener('input', calcular));
  ['export'].forEach(k => el[k].addEventListener('input', calcular));
  ['benef','split'].forEach(k => el[k].addEventListener('change', calcular));
  form.addEventListener('submit', e => e.preventDefault());

  $('#dReset').addEventListener('click', () => { tocou = {}; preencher(true); calcular(); });

  preencher(true); mascara(); calcular();
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
    const p = Math.round(feitos.length / itens.length * 100);
    $('#ckDone').textContent = feitos.length;
    $('#ckPct').textContent = p + '%';
    $('#gaugeFg').style.strokeDashoffset = CIRC * (1 - p / 100);
    $('#ckStage').textContent = p === 0 ? 'Não iniciado' : p < 34 ? 'Início' : p < 67 ? 'Em andamento' : p < 100 ? 'Avançado' : 'Pronto';
    gravar(feitos.map(i => i.dataset.ck));
  }
  itens.forEach(i => i.addEventListener('change', atualizar));
  $('#ckReset').addEventListener('click', () => { itens.forEach(i => i.checked = false); atualizar(); });
  atualizar();
})();

/* ─────────────── 7. glossário ─────────────── */
(() => {
  const caixa = $('#glos');
  if (!caixa) return;

  const TERMOS = [
    ['IVA dual','Modelo adotado pelo Brasil: dois impostos sobre valor agregado com a mesma base e as mesmas regras, um federal (CBS) e um compartilhado entre estados e municípios (IBS).'],
    ['Alíquota de referência','O percentual padrão de IBS e CBS, estimado em torno de 26,5% somados. Serve de base para as reduções de 30% e de 60%, e será fixado por lei ordinária.'],
    ['Não cumulatividade plena','Regra que transforma em crédito todo o tributo pago na etapa anterior, inclusive sobre bens de uso e consumo. É o coração da reforma.'],
    ['Crédito financeiro','O crédito passa a acompanhar o pagamento efetivo do imposto, e não mais a vinculação física do insumo ao produto, como acontece hoje no ICMS.'],
    ['Split payment','Separação automática do imposto no momento da liquidação financeira. O banco ou adquirente recolhe a parcela de IBS e CBS e repassa ao vendedor apenas o líquido.'],
    ['Tributação no destino','O imposto passa a pertencer ao estado e ao município de quem compra, e não mais de quem vende. É o que encerra a guerra fiscal do ICMS.'],
    ['Imposto por fora','O tributo deixa de compor a própria base de cálculo e passa a ser destacado no documento fiscal, o que torna a carga visível no preço.'],
    ['Cashback','Devolução de parte do IBS e da CBS pagos por famílias de baixa renda inscritas no CadÚnico, com percentuais maiores em energia, água, esgoto e gás de cozinha.'],
    ['Cesta Básica Nacional','Lista de alimentos com alíquota zero de IBS e CBS, definida em lei complementar, sem quebra da cadeia de crédito.'],
    ['Regime diferenciado','Faixa de redução da alíquota de referência, de 60% ou de 30%, aplicada a grupos listados em lei, como saúde, educação e profissões regulamentadas.'],
    ['Regime específico','Conjunto de regras próprias de base, apuração e crédito para setores como combustíveis, serviços financeiros, planos de saúde, bens imóveis e hotelaria.'],
    ['Crédito presumido','Crédito atribuído por lei ao adquirente quando o fornecedor está fora do regime, como na compra de produtor rural pessoa física não contribuinte.'],
    ['Comitê Gestor do IBS','Entidade que reúne estados, Distrito Federal e municípios para administrar, arrecadar e distribuir o IBS de forma unificada em todo o país.'],
    ['Imposto Seletivo','Tributo extrafiscal, monofásico, sobre bens e serviços prejudiciais à saúde ou ao meio ambiente. Não gera crédito e integra a base do IBS e da CBS.'],
    ['Fundo de Compensação','Mecanismo temporário que compensa, até 2032, empresas que perdem benefícios fiscais de ICMS concedidos por prazo certo e sob condição.'],
    ['Saldo credor','Situação em que o crédito de insumos supera o débito das vendas, típica de exportador. O saldo é passível de ressarcimento em dinheiro.'],
    ['Ano-teste','2026, quando CBS e IBS são cobrados a 0,9% e 0,1% de forma compensável. Serve para testar sistemas e obrigações acessórias sem carga adicional relevante.'],
    ['Nota Técnica','Documento que define os campos e as validações do documento fiscal eletrônico. É por ela que o seu ERP sabe como emitir nota com IBS, CBS e IS.']
  ];

  caixa.innerHTML = TERMOS.map(([t, d]) =>
    `<article class="glos__item"><h3>${t}</h3><p>${d}</p></article>`).join('');

  const itens = $$('.glos__item', caixa);
  const vazio = $('#glosEmpty');
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  $('#glosQ').addEventListener('input', e => {
    const q = norm(e.target.value.trim());
    let achou = 0;
    itens.forEach(it => {
      const ok = !q || norm(it.textContent).includes(q);
      it.hidden = !ok;
      if (ok) achou++;
    });
    vazio.hidden = achou > 0;
  });
})();

/* ─────────────── 8. ano no rodapé ─────────────── */
$('#year').textContent = new Date().getFullYear();

})();
