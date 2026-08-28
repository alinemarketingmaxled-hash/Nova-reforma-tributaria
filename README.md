# Nova Reforma Tributária

Site profissional sobre a reforma tributária brasileira (EC 132/2023 · LC 214/2025), com
ferramentas interativas que traduzem a mudança em números do próprio negócio do visitante.

Estático, sem build e sem dependências: HTML, CSS e JavaScript puros.

## O que o site tem

| Seção | O que faz |
|---|---|
| **Hero + bento** | Panorama da reforma em cartões: avanço da transição, alíquota de referência, o que substitui o quê |
| **Os novos tributos** | CBS, IBS e Imposto Seletivo — o que cada um substitui, quando entra e quem administra |
| **Cronograma** | Linha do tempo 2026 → 2033, destacando o ano corrente |
| **Impactos por setor** | Painel com abas: indústria, varejo, serviços, agro, saúde/educação e tecnologia |
| **Raio-X do seu negócio** | Diagnóstico personalizado — o visitante informa faturamento, setor, regime e estrutura de custos e recebe carga estimada, efeito no caixa, grau de exposição e prioridades |
| **Checklist de adequação** | 10 frentes de trabalho com progresso salvo em `localStorage` |
| **FAQ** | Seis perguntas frequentes, também publicadas como `FAQPage` (JSON-LD) |
| **Contato** | Formulário de captação com validação no cliente |

Extras: tema claro/escuro com preferência salva, navegação lateral com scroll-spy,
animação de entrada respeitando `prefers-reduced-motion`, folha de estilo de impressão
e dados estruturados para busca.

## Como o Raio-X calcula

Todo o cálculo roda no navegador — nenhum dado do visitante sai da máquina dele.

```
débito   = receita × alíquota
crédito  = receita × %insumos × alíquota
líquido  = débito − crédito
carga    = alíquota × (1 − %insumos)          # % sobre a receita
variação = carga − carga_atual                 # em pontos percentuais
```

Cada setor tem um perfil de partida (alíquota aplicável, percentual típico de insumos e de
folha, carga atual por regime) que preenche os campos automaticamente. Qualquer valor pode
ser ajustado pelo visitante; campos tocados manualmente deixam de ser sobrescritos ao
trocar de setor, e o botão *Restaurar valores sugeridos* volta ao perfil.

O grau de exposição soma fatores de risco — variação da carga, peso da folha, base de
crédito curta, dependência de benefício de ICMS, venda B2C, permanência no Simples
vendendo B2B — e a lista de prioridades é montada a partir desses mesmos fatores.

> **Ressalva importante:** é um modelo de ordem de grandeza, feito para orientar a conversa.
> Ignora diferimentos, cashback, trava de crédito por inadimplência do fornecedor e as
> particularidades de cada regime específico. Os percentuais de referência (26,5% para o
> regime geral, 18,55% e 10,6% para as reduções de 30% e 60%) são estimativas: a alíquota
> definitiva será fixada por lei ordinária.

## Estrutura

```
index.html              página única, todo o conteúdo
assets/css/styles.css   tokens de design + componentes, numerados por seção
assets/js/main.js       tema, navegação, setores, Raio-X, checklist, formulário
```

## Rodando localmente

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Não há passo de build. Abrir o `index.html` direto pelo `file://` também funciona,
com a ressalva de que o `localStorage` fica isolado por origem.

## Personalizando

- **Marca e textos** — tudo em `index.html`; a marca é o `R` em `.brand__mark` e `.rail__mark`.
- **Cores, raios e sombras** — os tokens no topo de `styles.css` (`:root` e `:root[data-theme="dark"]`).
  A paleta é monocromática de propósito: mudar `--dark` e `--bg` já reveste o site inteiro.
- **Perfis setoriais do Raio-X** — o objeto `SETOR` em `main.js`, com `aliq`, `ins`, `folha`,
  `atual` (por regime) e a nota explicativa exibida abaixo do seletor.
- **Conteúdo dos setores** — o objeto `DADOS` em `main.js`.
- **Formulário de contato** — hoje é estático: valida e exibe confirmação, sem enviar nada.
  Para integrar, substituir o bloco marcado em `main.js` (seção 7) por um `fetch()` para o
  seu endpoint ou CRM, ou apontar o `<form>` para um serviço de formulários.

## Publicação

Qualquer host estático serve — GitHub Pages, Vercel, Netlify, Cloudflare Pages ou um bucket.
Para GitHub Pages: *Settings → Pages → Deploy from a branch*, apontando para a raiz do repositório.

## Aviso

Conteúdo informativo. Não constitui consultoria jurídica ou contábil, e a legislação segue
em regulamentação — confira sempre as fontes oficiais citadas no rodapé antes de decidir.
