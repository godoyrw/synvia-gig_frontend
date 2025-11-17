# Synvia Gig — Guia do Dashboard Analítico

## Visão geral
Este documento descreve o dashboard implementado em `views/SynviaGig.vue`, detalhando os datasets consumidos de `src/mock/data-dashboard.json`, o propósito de cada gráfico e as melhores práticas para interpretar os indicadores. A tela foi construída sobre o tema escuro da Aura/PrimeVue e usa o componente `BaseChart` (ECharts) para padronizar tooltips, paleta e responsividade.

- **Tempo de atualização:** os blocos consomem snapshots mockados que representam o último lote processado. Ao conectar na API real, mantenha o mesmo shape dos objetos `ranking*`.
- **Moeda:** todos os valores são exibidos em reais (R$) e usam abreviação compacta no eixo (K, M) para grandes números.
- **Status acompanhados:** `Liberado`, `Glosa`, `Em Revisão`, além de qualquer outro texto presente nos datasets, são mapeados dinamicamente.

## KPI cards
Os três cards iniciais sintetizam o comportamento do lote mensal:

1. **Taxa de Glosa** → `Σ Valor Glosa Item / (Σ Valor Liberado Item + Σ Valor Glosa Item)`.
2. **Ticket médio liberado** → `Σ Valor Liberado Item / Σ Qtd`.
3. **Itens processados** → soma direta do campo `Qtd`.

Os rótulos usam a cor primária e exibem variações percentuais simuladas para alinhar com o protótipo.

## Gráficos e painéis

### 1. Status dos Itens Processados
- **Dataset:** `rankingStatusItem.data`.
- **Composição:** barras empilhadas (Valor Liberado + Valor Glosa) no eixo X, com uma linha (Quantidade) no eixo secundário.
- **Uso:** identifica rapidamente os status que mais consomem volume financeiro versus volume operacional.
- **Insights sugeridos:**
  - Se `Valor Glosa` superar 30% do total em um status, priorize revisão de regras.
  - Compare a tendência de `Qtd` com o valor monetário para detectar tickets médios fora do padrão.

### 2. Linha do Tempo Operacional
- **Dataset:** `timeline` (derivado de `rankingPrestadorStatusItem.data`).
- **Formato:** lista cronológica com ícones e variações de cor conforme `Status Item`.
- **Uso:** expõe eventos críticos (glosas altas, liberações relevantes, novas revisões) contextualizando quando agir.

### 3. Heatmap Prestador × Status (Glosas)
- **Dataset:** `rankingPrestadorStatusItem.data`.
- **Composição:** os 6 prestadores com maiores glosas no eixo Y, todos os status no eixo X e intensidade pelo `Valor Glosa Item`.
- **Uso:** encontrar rapidamente concentrações de glosas por prestador e status específico.
- **Dica:** use o visualMap para entender a escala geral antes de agir em um quadrante.

### 4. Ranking de Operadoras (Valores)
- **Dataset:** `rankingOperadora.data`.
- **Composição:** barras horizontais empilhadas por operadora (Liberado vs Glosa) com tooltip trazendo `Qtd`.
- **Uso:** medir o peso financeiro de cada operadora e identificar onde o saldo líquido é mais crítico.

### 5. Distribuição de Status por Operadora
- **Dataset:** `rankingOperadoraStatus.data`.
- **Composição:** barras verticais empilhadas por operadora, separadas por status.
- **Uso:** entender como cada operadora distribui o valor glosado entre os diferentes status e priorizar renegociações.

### 6. Combinações Prestador × Operadora × Status
- **Dataset:** `rankingPrestadorOperadoraStatus.data`.
- **Composição:** Top 8 combinações (Prestador · Operadora) ordenadas por valor glosado, com pilhas para cada status.
- **Uso:** evidencia relações bilaterais críticas e onde a governança precisa atuar de forma conjunta.

### 7. Top Códigos ANS Glosados
- **Dataset:** `rankingCodAns.data` (limitado aos 15 maiores).
- **Composição:** barras horizontais simples, mostrando quantidade de ocorrências por código.
- **Tooltip:** detalha código, descrição resumida, valor liberado e glosado.
- **Uso:** priorizar revisões de catálogo e tabelas TUSS/ANS que geram mais glosas.

### 8. Comparativo por Código de Tabela
- **Dataset:** `rankingCodTabela.data`.
- **Composição:** gráfico misto com barras (Liberado vs Glosa) e linha (Qtd) compartilhando o mesmo eixo X.
- **Uso:** entender se altos valores decorrem de muitos itens ou de tickets elevados e comparar comportamento entre códigos internos.

## Fontes de dados
| Dataset | Campo no JSON | Observações |
| --- | --- | --- |
| Status dos Itens | `rankingStatusItem` | Baseia KPIs e gráfico principal.
| Prestador × Status | `rankingPrestadorStatusItem` | Utilizado no heatmap e timeline.
| Operadora | `rankingOperadora` | Ranking financeiro e totais por operadora.
| Operadora × Status | `rankingOperadoraStatus` | Distribuição de status por operadora.
| Prestador × Operadora × Status | `rankingPrestadorOperadoraStatus` | Combinações críticas.
| Códigos ANS | `rankingCodAns` | Ranking textual dos códigos mais glosados.
| Códigos de Tabela | `rankingCodTabela` | Comparativo financeiro + volume.

## Próximas ações sugeridas
1. **Conectar API real:** substituir `src/mock/data-dashboard.json` pela resposta do backend, mantendo os mesmos nomes de campos.
2. **Alertas dinâmicos:** aproveitar as métricas calculadas (glosaRate, ticketMedio) para disparar notificações quando ultrapassarem thresholds.
3. **Drill-down:** adicionar filtros de período, operadora e prestador para permitir análises interativas diretamente no dashboard.
4. **Exportação:** criar ação para exportar o dataset filtrado em CSV a partir das mesmas estruturas utilizadas nos gráficos.

Com este guia, o endpoint `/documentation` passa a oferecer uma referência funcional e contextual para todo o dashboard Synvia Gig, facilitando o onboarding de times de negócio e tecnologia.
