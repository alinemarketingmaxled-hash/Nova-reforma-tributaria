# Nova Reforma Tributária

Site sobre a reforma tributária brasileira (EC 132/2023 e LC 214/2025), com ferramentas
interativas que traduzem a mudança em números do próprio negócio de quem visita.

Estático, sem build e sem dependências: HTML, CSS e JavaScript puros.

## O que o site tem

| Seção | O que faz |
|---|---|
| **Hero e bento** | Panorama em cartões: avanço da transição, alíquota de referência, o que substitui o quê, onde a regra está escrita |
| **Os novos tributos** | CBS, IBS e Imposto Seletivo, mais os quatro conceitos estruturais: não cumulatividade plena, split payment, cobrança no destino e cashback |
| **Split payment** | As seis etapas do caminho de uma venda, mais um simulador de parcelamento que mostra a retenção parcela a parcela |
| **Cronograma** | Linha do tempo de 2026 a 2033, destacando o ano corrente |
| **Regimes diferenciados** | Tabela das faixas de alíquota: zero, redução de 60%, redução de 30%, regime geral, regimes específicos e Simples Nacional |
| **Impactos por setor** | Painel com abas para oito setores, cada um com medidores e pontos de atenção |
| **Raio-X do seu negócio** | Análise personalizada completa (detalhada abaixo) |
| **Checklist de adequação** | Doze frentes de trabalho, com progresso salvo em `localStorage` |
| **Glossário** | Dezoito termos da reforma, com filtro de busca que ignora acentos |
| **FAQ** | Nove perguntas frequentes, também publicadas como `FAQPage` em JSON-LD |

Extras: tema claro e escuro com preferência salva, navegação lateral com scroll-spy,
animação de entrada que respeita `prefers-reduced-motion`, folha de estilo de impressão
e dados estruturados para busca.

O site não tem formulário de contato nem captação de leads. Ele existe para informar e
para calcular, e termina no glossário e nas perguntas frequentes.

## O Raio-X do seu negócio

Todo o cálculo roda no navegador. Nenhum dado do visitante sai da máquina dele.

### O que ele pergunta

**Quem é você:** nome da empresa, setor (doze opções), tipo de cliente atendido e
percentual de receita vindo de exportação.

**Os seus números:** faturamento anual, regime tributário, margem líquida atual, quanto da
receita vai para fornecedores, quantos desses fornecedores são do Simples ou informais,
quanto vai para folha de pagamento e prazo médio de recebimento.

**Ajuste fino:** carga atual sobre consumo, alíquota de IBS e CBS aplicável, uso de
benefício de ICMS e se o split payment deve entrar na conta do caixa.

Todo controle percentual mostra, ao lado da porcentagem, o valor em reais por mês que ela
representa, calculado sobre o faturamento informado. Assim "22% para fornecedores" aparece
junto de "R$ 110.000 por mês", e a parcela de fornecedores do Simples é medida sobre o
gasto com fornecedores, não sobre a receita. O prazo de recebimento mostra quanto fica em
contas a receber.

### O que ele devolve

Variação da carga em pontos percentuais e em reais por ano, comparativo de hoje contra
2033, débito bruto, crédito efetivo de insumos, imposto líquido, margem líquida projetada,
capital de giro adicional exigido pelo split payment, capacidade estimada de repasse ao
preço, **projeção ano a ano de 2026 a 2033**, grau de exposição com os fatores que o
explicam, e até seis prioridades de ação montadas a partir do cenário informado.

### Como calcula

```
insumoEfetivo = %insumos × (1 − %fornecedoresSimples × 0,75)
débito        = receita × (1 − %exportação) × alíquota
crédito       = receita × insumoEfetivo × alíquota      # mantido também na exportação
líquido       = débito − crédito
carga         = líquido ÷ receita
variação      = carga − cargaAtual                      # em pontos percentuais
giroAdicional = débito × max(0, 50 − prazoRecebimento) ÷ 30
```

A projeção ano a ano aplica os degraus da transição fixados pela EC 132/2023. Para cada
ano, a alíquota nova vale `alíquota × (fraçãoCBS × 0,332 + fraçãoIBS × 0,668)`, usando a
divisão estimada de 8,8% para a CBS e 17,7% para o IBS dentro dos 26,5% de referência.
Sobre isso incide a mesma conta de débito menos crédito acima. A carga antiga decai
conforme PIS e Cofins são extintos em 2027 e ICMS e ISS caem para 90%, 80%, 70% e 60%
entre 2029 e 2032.

Cada setor tem um perfil de partida que preenche os campos automaticamente. Campos
ajustados à mão deixam de ser sobrescritos quando o visitante troca de setor, e o botão
*Restaurar valores sugeridos* volta tudo ao perfil.

> **Ressalva importante:** é um modelo de ordem de grandeza, feito para orientar decisões e
> conversas internas. Ignora diferimentos, cashback, trava de crédito por inadimplência do
> fornecedor e as particularidades de cada regime específico. Os percentuais de referência
> (26,5% no regime geral, 18,55% e 10,6% nas reduções de 30% e 60%) são estimativas, e a
> alíquota definitiva será fixada por lei ordinária.

## O simulador de parcelamento

Responde à pergunta prática: em uma venda 30/40/60, quanto o split retém em cada parcela.

```
imposto  = valor × alíquota          # o imposto vai por fora do preço
total    = valor + imposto
fatia    = imposto ÷ total           # proporção de imposto em cada real cobrado
retido   = parcela × fatia           # em cada liquidação
```

O campo de prazos aceita `30/40/60`, `30 40 60`, `30,40,60` e `0` para venda à vista.
O veredito compara o momento médio de saída do imposto com os cerca de 50 dias que a guia
de hoje leva para vencer, e é por isso que prazo longo pode favorecer o caixa.

## Estrutura

```
index.html              página única, todo o conteúdo
assets/css/styles.css   tokens de design e componentes, numerados por seção
assets/js/main.js       tema, navegação, setores, Raio-X, checklist, glossário
```

## Rodando localmente

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Não há passo de build. Abrir o `index.html` direto pelo `file://` também funciona, com a
ressalva de que o `localStorage` fica isolado por origem.

## Personalizando

- **Marca e textos:** tudo em `index.html`. A marca é o `R` em `.brand__mark` e `.rail__mark`.
- **Cores, raios e sombras:** os tokens no topo de `styles.css`, em `:root`, no bloco
  `@media(prefers-color-scheme:dark)` e em `:root[data-theme="dark"]`. A paleta é
  monocromática de propósito, então mudar `--dark` e `--bg` reveste o site inteiro.
- **Perfis setoriais do Raio-X:** o objeto `SETOR` em `main.js`, com alíquota, percentuais
  de insumo, folha, fornecedores do Simples, prazo, margem, parcela federal da carga atual
  e a carga por regime.
- **Perfis de cliente:** o objeto `CLIENTE` em `main.js`, com capacidade de repasse e peso
  no grau de exposição.
- **Degraus da transição:** o array `ANOS` em `main.js`.
- **Conteúdo dos setores:** o objeto `DADOS`. **Glossário:** o array `TERMOS`.

## Publicação

Qualquer host estático serve: GitHub Pages, Vercel, Netlify, Cloudflare Pages ou um bucket.
Para GitHub Pages, vá em *Settings, Pages, Deploy from a branch* e aponte para a raiz do
repositório.

## Aviso

Conteúdo informativo. Não constitui consultoria jurídica ou contábil, e a legislação segue
em regulamentação. Confira sempre as fontes oficiais citadas no rodapé antes de decidir.
