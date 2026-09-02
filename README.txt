Preciso implementar um módulo chamado "Plantão Noturno" para registrar e analisar a origem das demandas recebidas pela equipe de suporte durante o plantão.

IMPORTANTE:
O objetivo deste módulo NÃO é acompanhar resolução de chamados.
Não quero status de resolução, solução aplicada, SLA, prioridade, causa raiz ou encerramento.
O objetivo é apenas documentar:

1. Qual demanda chegou.
2. De qual cliente veio.
3. Qual técnico do plantão recebeu.
4. De onde essa demanda se originou.
5. Qual o tipo da demanda.
6. Se ela é recorrente.

Implemente seguindo a stack e os padrões já existentes no projeto.
Não troque framework, arquitetura ou biblioteca de componentes caso o projeto já possua um padrão.

Se for necessário criar do zero, prefira:
- React
- TypeScript
- Componentização
- Interface responsiva
- API REST
- Banco de dados real

Não utilize dados mockados em produção.
Não utilize localStorage como persistência definitiva.
O protótipo utilizava localStorage apenas para demonstração.

========================================
1. ESTRUTURA DO MÓDULO
========================================

O módulo terá somente três opções no menu lateral:

- Painel do plantão
- Registrar demanda
- Demandas registradas

Não haverá no menu:

- Relatórios
- Indicadores
- Clientes
- Grupos de WhatsApp
- Técnicos
- Motivos / Causas
- Configurações

Também NÃO haverá login ou identificação de usuário nessa aplicação.

Manter identidade visual semelhante a um dashboard administrativo moderno:

- Sidebar azul-marinho
- Fundo geral cinza muito claro
- Cards brancos
- Azul como cor principal
- Bordas suaves
- Cantos arredondados
- Interface limpa
- Desktop como prioridade, mas responsiva

========================================
2. TELA: REGISTRAR DEMANDA
========================================

Título:
"Novo registro de demanda"

Subtítulo:
"Registre rapidamente de onde vêm as demandas recebidas pelo plantão."

Não exibir botão "Dúvidas sobre o registro".

CAMPOS:

1. Registro do cliente

Campo:
- Numérico
- Obrigatório
- Não permitir letras
- Visualmente destacado
- Placeholder: "Digite o registro do cliente"

Campo salvo:
clienteRegistro

----------------------------------------

2. Técnico do plantão

Select obrigatório.

Opções:

- Osiel
- Hercílio
- Matheus
- Bezerra

Campo salvo:
tecnicoPlantao

----------------------------------------

3. Origem da demanda

Radio buttons.

Somente estas três opções:

- Continuação de atendimento
- Grupo de WhatsApp
- Cliente chamou diretamente

Campo salvo:
origem

Não adicionar outras origens.

----------------------------------------

4. DADOS CONDICIONAIS DA ORIGEM

A interface deve alterar os campos de acordo com a origem selecionada.

SE ORIGEM = "Continuação de atendimento"

Mostrar:

Técnico anterior
- Campo texto
- Obrigatório

Protocolo / chamado anterior
- Campo texto
- Opcional

Campos salvos:

tecnicoAnterior
protocoloAnterior

Não mostrar estes campos para outras origens.

----------------------------------------

SE ORIGEM = "Grupo de WhatsApp"

Mostrar:

Nome do grupo

Deve ser SELECT e obrigatório.

As opções disponíveis devem ser exatamente:

Glaçaí
Maná Comendoria
ldorado
TRATT
Sonho Doce
Miss Make
Famiglia Muccini
Belém Velho Restaurante
Materiais MDW
Marterra
Panificadora Prime
Espetinho da Praia
DLIGHT
PORTO 60
JS MOTOS AVELLOZ
Conexfer
Magnum
Liderança Motos
Personalitte
Farina
Grao Forneria
Hidrauldiesel Truck S
Mibra

Campo salvo:
grupoWhatsapp

Não permitir digitação livre neste momento.

----------------------------------------

SE ORIGEM = "Cliente chamou diretamente"

Não solicitar informações complementares de origem.

----------------------------------------

5. Tipo da demanda

Select obrigatório.

Opções:

- Fiscal
- PDV / Caixa
- TEF / Pagamentos
- Estoque
- Financeiro
- Banco de dados
- Infraestrutura
- Implantação
- Outro

Campo:
tipoDemanda

----------------------------------------

É uma demanda recorrente?

Radio:

- Não
- Sim

Default:
Não

Campo:
recorrente

----------------------------------------

BOTÕES:

Cancelar
Registrar demanda

Ao salvar:

- Validar campos obrigatórios.
- Validar também campos condicionais.
- Registrar automaticamente data e hora.
- Persistir no banco.
- Exibir feedback visual de sucesso.

Não criar campos adicionais de resolução.

========================================
3. MODELO DE DADOS
========================================

Criar uma estrutura semelhante a:

NightShiftDemand {
    id: number | uuid

    clienteRegistro: number

    tecnicoPlantao:
        "Osiel" |
        "Hercílio" |
        "Matheus" |
        "Bezerra"

    origem:
        "CONTINUACAO" |
        "GRUPO_WHATSAPP" |
        "CLIENTE_DIRETO"

    tecnicoAnterior: string | null

    protocoloAnterior: string | null

    grupoWhatsapp: string | null

    tipoDemanda: string

    recorrente: boolean

    createdAt: datetime
}

Regras:

Se origem = CONTINUACAO:
    tecnicoAnterior obrigatório
    grupoWhatsapp = null

Se origem = GRUPO_WHATSAPP:
    grupoWhatsapp obrigatório
    tecnicoAnterior = null
    protocoloAnterior = null

Se origem = CLIENTE_DIRETO:
    tecnicoAnterior = null
    protocoloAnterior = null
    grupoWhatsapp = null

Não salvar campos incompatíveis com a origem selecionada.

========================================
4. TELA: PAINEL DO PLANTÃO
========================================

Título:
"Painel do plantão"

Subtítulo:
"Entenda de onde vêm as demandas recebidas pela equipe durante o plantão."

O painel deve utilizar SOMENTE registros reais existentes no banco.

NÃO incluir dados demonstrativos ou mocks.

Quando não houver dados:
- Todos os indicadores devem ficar em zero.
- Gráficos devem ficar vazios.
- Mostrar estado vazio na listagem.

----------------------------------------

FILTRO DE PERÍODO

No topo:

- Hoje
- Últimos 7 dias
- Últimos 30 dias
- Todo período

Todo o dashboard deve reagir ao período selecionado.

----------------------------------------

CARDS PRINCIPAIS

Exibir:

Demandas recebidas
= total de registros no período

Continuações
= quantidade cuja origem é CONTINUACAO

Mostrar também:
% sobre o total

Grupos de WhatsApp
= quantidade cuja origem é GRUPO_WHATSAPP

Mostrar:
% sobre o total

Cliente direto
= quantidade cuja origem é CLIENTE_DIRETO

Mostrar:
% sobre o total

Demandas recorrentes
= recorrente = true

Mostrar:
% sobre o total

========================================
5. GRÁFICO: ORIGEM DAS DEMANDAS
========================================

Exibir comparação entre:

- Continuação de atendimento
- Grupo de WhatsApp
- Cliente chamou diretamente

Pode utilizar barras horizontais.

Mostrar quantidade absoluta e, se possível, percentual.

========================================
6. INDICADOR: CARGA HERDADA
========================================

Criar um indicador chamado:

"Carga herdada"

Objetivo:
Mostrar quanto do trabalho recebido pelo plantão foi originado em atendimentos anteriores.

Fórmula:

Carga Herdada =
Quantidade de demandas com origem CONTINUACAO
/
Total de demandas do período
* 100

Exemplo:

40 demandas recebidas
28 continuações

Carga herdada = 70%

Exibir visualmente como donut/progresso percentual.

Também mostrar:

Continuações: X
Demais origens: Y
Total: Z

========================================
7. TIPOS DE DEMANDA MAIS RECEBIDOS
========================================

Criar ranking agrupando por:

tipoDemanda

Exemplo:

Fiscal                  15
PDV / Caixa             11
TEF / Pagamentos         8
Estoque                   4

Ordenar do maior para o menor.

Mostrar preferencialmente barras horizontais.

========================================
8. PRINCIPAIS ORIGENS ESPECÍFICAS
========================================

Este quadro deve ajudar a descobrir exatamente de onde está vindo a carga do plantão.

Para continuações:

Agrupar por:
tecnicoAnterior

Exemplo:

Técnico anterior: João     10
Técnico anterior: Maria     8

Para demandas de WhatsApp:

Agrupar por:
grupoWhatsapp

Exemplo:

Grupo: Magnum               7
Grupo: Farina               6

Ordenar por quantidade decrescente.

Não misturar o técnico do plantão com o técnico anterior.

O técnico do plantão é quem RECEBEU a demanda.

O técnico anterior é quem estava no atendimento que virou uma continuação.

========================================
9. DEMANDAS RECENTES NO PAINEL
========================================

Na parte inferior do Painel, mostrar tabela com as últimas demandas.

Colunas:

Data / hora
Registro do cliente
Técnico do plantão
Origem
Detalhe da origem
Tipo da demanda
Recorrente

Detalhe da origem deve funcionar assim:

CONTINUACAO:
mostrar tecnicoAnterior

GRUPO_WHATSAPP:
mostrar grupoWhatsapp

CLIENTE_DIRETO:
mostrar "Contato direto do cliente"

Ordenar:
createdAt DESC

Mostrar inicialmente as últimas 15.

========================================
10. TELA: DEMANDAS REGISTRADAS
========================================

Essa tela será utilizada para consulta.

Título:
"Demandas registradas"

Subtítulo:
"Consulte e filtre todas as demandas documentadas pela equipe do plantão."

Adicionar os seguintes filtros:

Registro do cliente
- Busca por número

Período
- Hoje
- Últimos 7 dias
- Últimos 30 dias
- Todo período

Técnico do plantão
- Todos
- Osiel
- Hercílio
- Matheus
- Bezerra

Origem
- Todas
- Continuação de atendimento
- Grupo de WhatsApp
- Cliente chamou diretamente

Tipo da demanda
- Todos
- Fiscal
- PDV / Caixa
- TEF / Pagamentos
- Estoque
- Financeiro
- Banco de dados
- Infraestrutura
- Implantação
- Outro

Recorrente
- Todos
- Sim
- Não

Adicionar botão:
"Limpar filtros"

========================================
11. INDICADORES DA CONSULTA
========================================

Acima da tabela da consulta, exibir:

Resultados encontrados
Continuações
Grupos de WhatsApp
Recorrentes

Esses números devem considerar os filtros atualmente aplicados.

========================================
12. TABELA DE DEMANDAS REGISTRADAS
========================================

Colunas:

Data / hora
Registro
Técnico
Origem
Detalhe da origem
Tipo
Recorrente

Ordenação padrão:
mais recente primeiro.

Ao clicar em uma linha:
abrir painel lateral/drawer com os detalhes completos.

========================================
13. DRAWER DE DETALHES
========================================

Mostrar:

Data e hora
Registro do cliente
Técnico do plantão
Origem
Tipo da demanda
Recorrente

Se for CONTINUACAO:

Técnico anterior
Protocolo anterior

Se for GRUPO_WHATSAPP:

Nome do grupo

Não mostrar campos vazios ou que não pertençam àquela origem.

========================================
14. EXPORTAÇÃO CSV
========================================

Na tela Demandas registradas, adicionar:

"Exportar CSV"

O arquivo deve respeitar os filtros atualmente selecionados.

Colunas:

DataHora
RegistroCliente
TecnicoPlantao
Origem
DetalheOrigem
Tipo
Recorrente

Gerar arquivo compatível com Excel.

========================================
15. API
========================================

Se estiver criando backend, implementar algo equivalente a:

POST /api/night-shift-demands

Cria um registro.

GET /api/night-shift-demands

Filtros possíveis:

startDate
endDate
clienteRegistro
tecnicoPlantao
origem
tipoDemanda
recorrente

Exemplo:

GET /api/night-shift-demands?tecnicoPlantao=Osiel&origem=GRUPO_WHATSAPP

----------------------------------------

GET /api/night-shift-demands/dashboard

Parâmetros:

startDate
endDate

Resposta sugerida:

{
    "total": 0,
    "continuacoes": 0,
    "gruposWhatsapp": 0,
    "clientesDiretos": 0,
    "recorrentes": 0,
    "cargaHerdadaPercentual": 0,

    "porOrigem": [],
    "porTipo": [],
    "porTecnicoAnterior": [],
    "porGrupoWhatsapp": [],
    "recentes": []
}

Evite trazer todos os registros para o frontend e calcular métricas grandes no navegador.
Quando houver banco/backend, fazer os agrupamentos no backend ou diretamente no banco.

========================================
16. BANCO DE DADOS
========================================

Criar índices pelo menos em:

createdAt
clienteRegistro
tecnicoPlantao
origem
tipoDemanda
recorrente

Isso será importante para os filtros e dashboard.

========================================
17. REGRAS DE NEGÓCIO IMPORTANTES
========================================

1. O sistema serve para analisar a ENTRADA de demandas do plantão.

2. Não implementar fluxo de resolução.

3. Não implementar status de chamado.

4. Não implementar prioridade.

5. Não implementar SLA.

6. Não implementar solução aplicada.

7. Não implementar motivo/causa de encerramento.

8. Não implementar login.

9. Não utilizar dados mockados no dashboard.

10. Não mostrar funcionalidades que não estão descritas nesta especificação.

11. O lançamento precisa ser rápido, pois será realizado pelos próprios técnicos durante o plantão.

12. O objetivo gerencial principal é responder perguntas como:

- Quantas demandas chegam ao plantão?
- Quanto é carga herdada do atendimento diurno?
- Quais técnicos anteriores mais geram continuações?
- Quais grupos de WhatsApp mais geram atendimento?
- Quais clientes mais acionam o plantão?
- Quais tipos de demanda mais chegam?
- Qual técnico do plantão está recebendo mais demandas?
- Quantas demandas são recorrentes?

========================================
18. CRITÉRIOS DE ACEITE
========================================

Considere concluído somente quando:

- For possível registrar uma demanda.
- Os campos condicionais funcionarem corretamente.
- O registro estiver persistido no banco.
- O painel utilizar os dados registrados.
- Nenhum dado mockado for exibido.
- Os filtros funcionarem.
- A carga herdada estiver calculada corretamente.
- Rankings forem baseados nos dados reais.
- A tela de demandas registradas conseguir consultar os registros.
- O drawer de detalhes funcionar.
- A exportação CSV funcionar.
- As três telas estiverem navegáveis entre si.
- Não houver tela de login.
- O menu possuir somente as três opções solicitadas.
- A interface estiver responsiva.
- O código estiver organizado em componentes reutilizáveis.

Antes de finalizar, revise toda a implementação e remova qualquer funcionalidade ou campo adicional que não esteja previsto nesta especificação.