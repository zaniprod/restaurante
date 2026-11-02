# Sistema de Caixa + Gestão Financeira — Calçadão Café e Restaurante

## Contexto e intenção

O restaurante da mãe do usuário funciona hoje com comanda física (papel):
o cliente pede, o atendente anota à mão, e no caixa a pessoa soma os
itens de cabeça/calculadora para cobrar. Não existe nenhum registro
estruturado de quanto foi vendido, muito menos separado por forma de
pagamento (dinheiro/pix/cartão), nem controle de despesas ou compras.

A ideia central: inserir um passo digital no momento do caixa — antes de
devolver o troco ou finalizar o atendimento, o atendente registra no
sistema o que foi vendido e como foi pago. Isso elimina o erro de conta
manual e gera, pela primeira vez, dados confiáveis de faturamento diário.
A partir disso, o sistema cresce para cobrir despesas e compras de
mercado, dando aos dois administradores (o usuário e a mãe) uma visão
real do balanço do negócio (receita − despesas).

## Objetivos (goals)

- **Tela de caixa** (login de operador único e compartilhado, aberto a
  manhã toda e usado pelos ~2 atendentes que se revezam): grade de
  categorias/itens do cardápio para montar a venda com cliques, campo
  numérico dedicado para "Buffet por KG" (valor vem da balança e varia a
  cada venda), total calculado automaticamente, pagamento com suporte a
  split entre dinheiro/pix/cartão e cálculo automático de troco para a
  parte em dinheiro.
- **Área admin** (login individual para o usuário e a mãe): relatório de
  faturamento diário separado por forma de pagamento; lista das vendas do
  dia; lançamento de despesas (descrição livre + valor + data);
  lançamento de compras de mercado item a item; relatório de balanço
  (receita − despesas) por período.
- **Correção de vendas**: qualquer venda finalizada pode ser editada ou
  cancelada, sem senha, tanto no caixa quanto pelo painel admin — mas
  fica marcada com uma tag visível ("editada"/"cancelada") em todo lugar
  onde aparece, garantindo transparência sem fricção.
- **Extremamente intuitivo**: quem usa o caixa no dia a dia não é
  público técnico. A usabilidade é o critério de sucesso mais importante
  do projeto.
- **Acessível de qualquer lugar**: hospedado na nuvem (o restaurante tem
  wifi), para os admins consultarem faturamento/despesas de casa ou do
  celular, além do PC do caixa.

## Não-objetivos (fora do escopo da v1)

- Edição do cardápio por tela — o cardápio fica cadastrado direto no
  banco de dados; o usuário avisa o desenvolvedor quando algo muda.
- Impressão de recibo/comanda.
- Gestão de mesas ou da comanda física em si — a comanda de papel
  continua existindo; o sistema cobre apenas o momento do caixa.
- Controle de estoque (quantidade em mãos) — a v1 registra o histórico
  de compras (o que foi comprado e seu custo), não níveis de estoque.
- Integrações com delivery ou apps de pedido externos.
- Login individual por atendente no caixa.
- Senha ou autorização extra para editar/cancelar uma venda.
- Leitura automática (OCR/IA) da foto da nota fiscal — os itens da
  compra são digitados manualmente pelo admin.

## Anti-objetivos (o que tornaria isso um fracasso mesmo funcionando)

- Qualquer coisa que torne o caixa mais lento ou confuso do que o
  papel+caneta atual — a adoção depende inteiramente de ser rápido e
  óbvio de usar.
- O sistema travar ou ficar inutilizável durante um horário de
  movimento (nenhum estado de erro pode impedir de finalizar uma venda).
- Números em que não se pode confiar — o objetivo inteiro do projeto é
  "ter certeza do balanço do negócio", então receita e despesa precisam
  ser sempre precisas e rastreáveis (por isso as tags de
  edição/cancelamento, mesmo sem bloqueio por senha).

## Restrições (constraints)

- O PC do caixa tem wifi e fica ligado e logado o dia inteiro.
- O cardápio atual (~65 itens em 7 categorias: Xis, Pratos, Bebidas,
  Sobremesas, Cafés, Dogs, Lanches) está documentado em
  `Cardápio/cardapio_calcadao.xlsx`. Alguns preços precisam de
  confirmação antes do lançamento (ver "Itens pendentes" abaixo).
- Orçamento enxuto: usar camadas gratuitas/baratas (Vercel + Supabase)
  por enquanto.

## Decisões tomadas nesta conversa

- **Stack**: Next.js na Vercel (app + hospedagem) e Supabase (banco
  Postgres + autenticação). Escolha do usuário; encaixa bem porque os
  relatórios financeiros precisam de agregação relacional (somas por
  dia, por forma de pagamento, por período) e o Supabase Auth separa
  limpo o login de operador do login de admin.
- **Papéis (roles)**: `operador` (login único compartilhado, usado pelos
  ~2 atendentes que se revezam, logado uma vez pela manhã) e `admin`
  (contas individuais para o usuário e a mãe).
- **Fluxo de venda**: clique para adicionar itens da grade de
  categorias; campo numérico dedicado para "Buffet por KG"; total
  recalculado automaticamente a cada item; pagamento com split entre
  dinheiro/pix/cartão e troco automático para a parte em dinheiro; venda
  salva com data/hora, itens e detalhamento do pagamento.
- **Correção de venda**: editar/cancelar sem senha, com tag visível
  "editada"/"cancelada" na lista de vendas do dia e nos relatórios.
  Pode ser feita tanto por quem está no caixa quanto pelos admins
  remotamente, pelo painel. Não há trava por tempo — uma venda de
  qualquer data pode ser editada, e os relatórios sempre refletem o
  estado atual dos dados (recalculados, não "congelados" por dia).
- **Histórico da edição** (decisão do desenvolvedor, não só a tag): ao
  editar uma venda, o sistema guarda uma cópia do estado anterior (itens
  e pagamento) antes de sobrescrever, visível no admin como "ver versão
  anterior". Isso atende ao anti-objetivo de números rastreáveis sem
  adicionar fricção nenhuma ao fluxo do caixa.
- **Sem desconto**: não existe ajuste manual de valor no checkout; o
  total é sempre a soma exata dos itens clicados (+ buffet por kg).
- **Buffet por KG**: a balança já mostra o valor final em reais; o
  campo é uma entrada direta de valor monetário (não peso × preço).
- **Despesas**: só admin lança; formulário simples (data + descrição
  livre + valor), sem categoria fixa. Despesas recorrentes (aluguel
  etc.) são lançadas manualmente todo mês, já que os valores variam.
- **Compras de mercado**: tipo específico de despesa para as compras
  diárias da mãe no mercado. O admin digita item a item (produto,
  quantidade, valor), com autocomplete sugerindo nomes de produtos já
  usados antes para agilizar, e anexa a foto da nota fiscal como
  referência. O valor total da compra entra automaticamente no total de
  despesas do período. Isso prepara o terreno para relatórios futuros
  tipo "quanto gastamos em tomate esse mês", pra identificar desperdício
  ou justificar compra em lote — sem leitura automática da foto na v1.
- **Relatórios**: faturamento diário por forma de pagamento; balanço do
  período = receita − despesas (despesas incluindo compras); lista de
  vendas do dia com as tags de edição/cancelamento.
- **Cardápio**: sem tela de administração; populado e atualizado direto
  no banco pelo desenvolvedor quando o usuário solicitar.

## Itens pendentes (confirmar antes do lançamento)

Preços ilegíveis ou riscados na planilha de origem, precisam de
confirmação com a mãe do usuário:

- Xis Mignon à Moda da Casa
- À la Minuta de Bife
- À la Minuta de Frango
- Energético (valor manuscrito pouco legível: R$13,16)
- Café Expresso Médio (valor manuscrito um pouco apagado: R$11)
- Café Carioca Expresso Médio (valor manuscrito um pouco apagado: R$11)

## Deixado para quem for construir (builder)

- Modelo de dados detalhado (tabelas para vendas, itens de venda,
  pagamentos, despesas, compras, itens de compra, itens de cardápio,
  usuários/papéis).
- Layout exato da grade do caixa e do dashboard admin (seguindo "rápido
  e óbvio" como restrição-guia).
- Visualizações exatas dos relatórios (tabelas vs. gráficos) de
  faturamento e balanço.
- Tratamento de erros e casos de borda de conectividade (o que acontece
  se o wifi cair no meio de uma venda).
