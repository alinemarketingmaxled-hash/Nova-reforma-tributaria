# SPX Engenharia · Gestão de Obras

Sistema para a SPX gerir obras junto com escritórios de arquitetura, feito para
o celular: o engenheiro lança do canteiro, o arquiteto responde do escritório e
o cliente acompanha do sofá. Três perfis leem a mesma obra de jeitos diferentes.

Abra em `https://<seu-dominio>/spx/` (ou `spx/index.html`). Não precisa de
instalação, servidor nem banco de dados.

## Acessos de demonstração

| Perfil       | E-mail                | Senha    |
|--------------|-----------------------|----------|
| Engenharia   | eng@spx.com.br        | `spx123` |
| Arquitetura  | arq@spx.com.br        | `spx123` |
| Cliente      | cliente@spx.com.br    | `spx123` |

A tela de entrada tem um atalho para cada um desses acessos.

## No celular

A navegação fica em quatro abas embaixo — **Início, Semanas, Módulos e Conta** —
com um botão central que abre as ações rápidas de quem está logado: o engenheiro
registra relatório, inspeção, custo, estoque, DDS, pendência e pedido de
aprovação sem procurar em menu. O tema acompanha o aparelho e pode ser fixado em
claro ou escuro em **Conta → Aparência**. No computador a mesma coisa aparece
como menu lateral.

## Módulos

**Acompanhamento** — visão geral, semanas, fotos e pendências.
**Planejamento** — cronograma, planejamento técnico, custos, recursos e riscos.
**Execução** — qualidade, segurança e meio ambiente, documentação.
**Suprimentos** — materiais e compras.
**Gestão** — valores, aprovações, desempenho, equipe e contrato.

### Cronograma

Segue o formato que a SPX já usa no MS Project: **frentes de serviço com tarefas
dentro**, cada tarefa com duração em dias, início, término, predecessora (término
a início ou início a início, com defasagem) e responsável. A semana de obra tem
seis dias — domingo não conta nas datas. O percentual da frente é a média das
tarefas ponderada pela duração, e o da obra é a média das frentes.

### Relatório da semana

Uma tela só, pensada para o canteiro: período, dias trabalhados e efetivo; o que
aconteceu em texto corrido; fotos com legenda e etapa, reduzidas antes de
guardar; as tarefas previstas para a semana já abertas com controle deslizante; e
a pergunta “houve atraso?”, que registra motivo, dias perdidos e o responsável
(clima, fornecedor, arquiteto, cliente, terceiros ou a própria SPX). Publicado, o
relatório entra na linha do tempo e pode ser impresso ou salvo em PDF.

### Valores

Contrato original, aditivos aprovados e valor atualizado; medições com percentual
e situação; parcelas com vencimento, pagamento e atraso; e a comparação entre o
quanto foi faturado e o quanto foi executado. O cliente vê a mesma coisa em
linguagem direta, com o próximo pagamento em destaque.

### Custos

Orçamento de custo direto distribuído pelas frentes, lançamentos por categoria,
curva S de desembolso e o **índice de custo**: serviço entregue dividido pelo
gasto. Acima de 1,00, a obra gasta menos do que entrega.

### Qualidade e segurança

Fichas de verificação de serviço (alvenaria, contrapiso, revestimento, elétrica,
hidráulica, impermeabilização, pintura e marcenaria) que geram não conformidade
automática quando um item reprova. Do lado de segurança, verificações de NR-18,
NR-35, NR-06 e NR-10, registro de DDS, ocorrências e destinação de resíduos com
CDF.

### Aprovações

Projeto, orçamento, aditivo, medição, amostra e relatório entram no mesmo fluxo:
quem pediu, quem decide, prazo, decisão e comentário, com nome e data gravados.

## Como o percentual e os índices são calculados

- **Executado**: média das frentes ponderada pela duração das tarefas.
- **Previsto para hoje**: cada tarefa tem início e fim, então o cronograma diz
  quanto dela já deveria estar pronto. O tracinho no anel marca esse valor.
- **Índice de prazo**: executado dividido pelo previsto. Acima de 1,00, adiantada.
- **Índice de custo**: serviço entregue (percentual executado sobre o orçamento)
  dividido pelo gasto real. Acima de 1,00, custo sob controle.
- **Semáforo**: até 2 pontos abaixo do previsto é *No prazo*; entre 2 e 8,
  *Atenção*; mais que isso, *Atrasada*.

## Cores dos gráficos

A paleta passou pelo validador de contraste e daltonismo, nos dois temas. O
previsto é sempre uma linha tracejada cinza (referência, não série) e o realizado
uma linha cheia azul. A severidade do risco tem três níveis, e não quatro, porque
âmbar e laranja não se distinguem na tela nem para quem tem daltonismo. Todo
gráfico traz um “ver os números” com a tabela equivalente.

## Onde ficam os dados

Tudo fica **no próprio navegador**: os registros no `localStorage` e as fotos no
IndexedDB. Nada é enviado para fora do aparelho.

Na prática, cada pessoa vê o que lançou no próprio navegador, e o login serve
para escolher o perfil, não para proteger informação. Para a equipe toda enxergar
a mesma obra é preciso ligar o portal a um servidor: os pontos de troca estão
isolados em `assets/js/db.js` (`DB.carregar`, `DB.salvar`, `DB.entrar` e o objeto
`Fotos`), e as telas não falam com armazenamento diretamente.

*Conta → Limpar dados* devolve o portal ao conteúdo de demonstração.

## Arquivos

```
spx/
├── index.html                página única
└── assets/
    ├── css/app.css           sistema visual, temas claro e escuro
    └── js/
        ├── wbs.js            frentes, tarefas, predecessoras e datas
        ├── gestao.js         catálogos técnicos e montagem dos módulos
        ├── seed-gestao.js    conteúdo de demonstração das três obras
        ├── db.js             armazenamento e todos os cálculos
        ├── ui.js             ícones, anel de progresso, modais e listas
        ├── graficos.js       curva S, matriz de risco, barras e Gantt
        ├── telas.js          semanas, fotos, pendências e equipe
        ├── mod-planejamento.js  cronograma, custos, recursos, riscos, escopo
        ├── mod-execucao.js      qualidade, documentação, segurança
        ├── mod-suprimentos.js   estoque e compras
        ├── mod-financeiro.js    contrato, medições e pagamentos
        ├── mod-gestao.js        aprovações e desempenho
        └── app.js            login, estrutura, abas, rotas e painéis
```

Sem dependências e sem etapa de build: é HTML, CSS e JavaScript.
