# SPX Engenharia · Portal de Obras

Aplicativo para a SPX acompanhar obras junto com escritórios de arquitetura.
Cada semana de obra vira um registro com resumo, fotos, percentual executado e,
quando houve atraso, o motivo e o responsável. Três perfis leem a mesma obra de
jeitos diferentes: cliente, arquitetura e engenharia.

Abra em `https://<seu-dominio>/spx/` (ou `spx/index.html`). Não precisa de
instalação, servidor ou banco de dados.

## Acessos de demonstração

| Perfil       | E-mail                | Senha    |
|--------------|-----------------------|----------|
| Engenharia   | eng@spx.com.br        | `spx123` |
| Arquitetura  | arq@spx.com.br        | `spx123` |
| Cliente      | cliente@spx.com.br    | `spx123` |

Na tela de entrada há um atalho para cada um desses acessos.

## O que cada perfil vê

**Engenharia** — lança tudo. Painel com as obras, aviso das semanas ainda não
relatadas, formulário do relatório semanal, controle do percentual de cada
etapa, abertura de pendências e edição dos dados da obra.

**Arquitetura** — acompanha a execução, vê o que trava por causa de projeto
(alteração ou detalhamento pendente aparecem separados no painel), responde às
pendências direcionadas a ela e comenta nas semanas. Não vê o valor do contrato.

**Cliente** — tela simples: o círculo com o percentual concluído, o que
aconteceu na semana com fotos, o motivo de cada atraso em linguagem direta, o
que está em execução agora e o que a obra espera dele.

## O relatório da semana

O formulário reúne, em uma tela só:

- **período** da semana, dias trabalhados e número de pessoas na obra;
- **o que aconteceu**, em texto corrido — é o que o cliente lê primeiro;
- **fotos**, escolhidas ou arrastadas, com legenda e etapa; são reduzidas para
  1400 px antes de guardar;
- **andamento das etapas**, em controles deslizantes que recalculam o
  percentual da obra na hora;
- **atraso**: começa em "não". Ao marcar "sim", registra motivo, dias perdidos e
  explicação. O responsável (clima, fornecedor, arquiteto, cliente, terceiros ou
  a própria SPX) vem do motivo escolhido;
- **o que vem na próxima semana**.

Publicado, o relatório entra na linha do tempo e pode ser impresso ou salvo em
PDF pelo botão *Imprimir* (a impressão sai sem menus).

## Como o percentual é calculado

Cada etapa tem um **peso** (quanto ela representa na obra) e um **percentual
executado**. O número da obra é a média das etapas ponderada pelos pesos.

O tracinho no anel do gráfico marca o **previsto para hoje**: cada etapa tem
data de início e fim, e o cronograma diz quanto dela já deveria estar pronta.
A comparação entre os dois números vira o semáforo da obra:

| Diferença               | Situação   |
|-------------------------|------------|
| até 2 pontos abaixo     | No prazo   |
| entre 2 e 8 abaixo      | Atenção    |
| mais de 8 abaixo        | Atrasada   |

A barra *Por que a obra atrasou* soma os dias registrados em cada relatório,
agrupados por motivo — é o histórico que sustenta uma conversa sobre prazo.

## Onde ficam os dados

Tudo fica **no próprio navegador**: os registros no `localStorage` e as fotos no
IndexedDB (que aguenta arquivos grandes). Nada é enviado para fora do aparelho.

Na prática isso significa que cada pessoa vê o que lançou no próprio navegador,
e o login serve para escolher o perfil, não para proteger informação. Para a
equipe toda enxergar a mesma obra é preciso ligar o portal a um servidor: os
pontos de troca estão isolados em `assets/js/db.js` (`DB.carregar`, `DB.salvar`,
`DB.entrar` e o objeto `Fotos`), e as telas não falam com armazenamento
diretamente.

*Ajustes → Limpar dados* devolve o portal ao conteúdo de demonstração.

## Arquivos

```
spx/
├── index.html              página única
└── assets/
    ├── css/app.css         sistema visual
    └── js/
        ├── db.js           dados, cálculos de progresso e conteúdo de exemplo
        ├── ui.js           ícones, gráfico de círculo, modais e avisos
        ├── telas.js        semanas, etapas, fotos, pendências e equipe
        └── app.js          login, estrutura, rotas e painéis
```

Sem dependências e sem etapa de build: é HTML, CSS e JavaScript.
