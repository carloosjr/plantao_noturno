export interface AdquirenteConfig {
  versao: string;
  conexao: string;
  modelos: string[];
}

export const ADQUIRENTES_CONFIG: Record<string, AdquirenteConfig> = {
  Playstore: {
    versao: '8.0.0.0',
    conexao: 'Wi-Fi + 4G',
    modelos: ['Smartphone Android'],
  },
  Rede: {
    versao: '8.0.0.0',
    conexao: 'Wi-Fi + 4G',
    modelos: ['L400', 'N960K'],
  },
  Stone: {
    versao: '8.0.0.0',
    conexao: 'Wi-Fi + 4G',
    modelos: ['L400', 'P2', 'GPOS700X', 'A8', 'T8', 'L300', 'P2 A11', 'GPOS730'],
  },
  Pagbank: {
    versao: '8.0.0.0',
    conexao: 'Wi-Fi + 4G',
    modelos: ['P2', 'A50', 'A920', 'A930', 'SK800'],
  },
  Cielo: {
    versao: '8.0.0.0',
    conexao: 'Wi-Fi + 4G',
    modelos: ['Lio v3', 'L400', 'L300', 'DX8000', 'GPOS720'],
  },
  Getnet: {
    versao: '8.0.0.0',
    conexao: 'Wi-Fi + 4G',
    modelos: ['P3', 'P2', 'DX8000', 'A8', 'N920'],
  },
  Safrapay: {
    versao: '7.0.1.0',
    conexao: 'Wi-Fi',
    modelos: ['P3', 'A8', 'P2'],
  },
  'Sicoob/Sipag': {
    versao: '7.0.1.0',
    conexao: 'Wi-Fi + 4G',
    modelos: ['DX8000', 'P2', 'X990', 'X990 Plus', 'X990 Pro'],
  },
  'Fiserv Caixa/Bin/Sicredi': {
    versao: '6.1.6.0',
    conexao: 'Wi-Fi + 4G',
    modelos: ['DX8000', 'P2'],
  },
  'Mercado Pago': {
    versao: '7.0.1.0',
    conexao: 'Wi-Fi + 4G',
    modelos: ['N950'],
  },
  Clover: {
    versao: '8.0.0.0',
    conexao: 'Wi-Fi + 4G',
    modelos: ['Clover Flex 3 (C405)'],
  },
  Quickpay: {
    versao: '6.0.7.0',
    conexao: 'Wi-Fi + 4G',
    modelos: ['GPOS720', 'A910'],
  },
};

export const CONEXOES_SMART = [
  'Wi-Fi',
  '4G / Dados Móveis',
  'Wi-Fi + 4G',
  'Ethernet / Cabo',
];

export interface DescricaoGrupo {
  id: string;
  main: string;
  subs: string[];
  img: string;
}

export interface EstadoSmartForm {
  // Identificação do Cliente
  registro: string;
  nome: string;
  linkCliente: string;
  cnpj: string;

  // Dispositivo & Adquirência Smart
  adquirente: string;
  versao: string;
  conexao: string;
  modelo: string;

  // Cabeçalho
  produto: string;
  caminho: string;
  resumo: string;

  // Detalhamento
  descricoes: DescricaoGrupo[];

  // Passos
  passos: string[];

  // Evidências
  linkHedgedoc: string;
  linkPrint: string;
  linkVideo: string;
  linkArquivo: string;
  linkDiscord: string;
}

export const ESTADO_SMART_VAZIO: EstadoSmartForm = {
  registro: '',
  nome: '',
  linkCliente: '',
  cnpj: '',

  adquirente: '',
  versao: '',
  conexao: '',
  modelo: '',

  produto: 'Smart',
  caminho: '',
  resumo: '',

  descricoes: [{ id: '1', main: '', subs: [''], img: '' }],
  passos: [''],

  linkHedgedoc: '',
  linkPrint: '',
  linkVideo: '',
  linkArquivo: '',
  linkDiscord: '',
};

export const EXEMPLO_SMART: EstadoSmartForm = {
  registro: '58410',
  nome: 'Restaurante Sabor & Arte',
  linkCliente: 'https://saborarte.meusoftcom.com.br/',
  cnpj: '12.345.678/0001-99',

  adquirente: 'Stone',
  versao: '8.0.0.0',
  conexao: 'Wi-Fi + 4G',
  modelo: 'L400',

  produto: 'Smart',
  caminho: 'Mesas>Comanda>Lançamento de Itens',
  resumo: 'Ao selecionar observação personalizada no produto, o app do Smart fecha abruptamente.',

  descricoes: [
    {
      id: 'd-1',
      main: 'Ao abrir o Smart e acessar o atendimento de mesa:',
      subs: ['Mesas > Mesa 04 > Adicionar Produto', 'Selecionar produto com complementos'],
      img: 'https://hedgedoc.softhubs.com.br/uploads/49851b87-39c8-4d08-9b08-fe6e293e1cb5.png',
    },
    {
      id: 'd-2',
      main: 'Tentar incluir texto livre nas observações:',
      subs: ["Clicar no campo 'Observações'", 'Digitar instrução personalizada e confirmar'],
      img: 'https://hedgedoc.softhubs.com.br/uploads/d908358b-050f-4c3f-b7b4-1437d8e5497b.png',
    },
    {
      id: 'd-3',
      main: 'Ao clicar em Confirmar Lançamento:',
      subs: ['O aplicativo fecha inesperadamente retornando para a tela inicial da maquininha'],
      img: 'https://hedgedoc.softhubs.com.br/uploads/38ebb9c9-6809-4860-b948-aaa277fdbe98.png',
    },
  ],

  passos: [
    'Realizar login no aplicativo Smart',
    'Acessar o mapa de mesas',
    'Abrir a mesa 04',
    'Selecionar o item com adicionais',
    'Digitar uma observação e salvar',
  ],

  linkHedgedoc: 'https://hedgedoc.softhubs.com.br/smart-bug-obs',
  linkPrint: 'https://hedgedoc.softhubs.com.br/uploads/smart-crash.png',
  linkVideo: 'https://drive.google.com/file/d/smart-video-crash',
  linkArquivo: 'https://cdn.discordapp.com/attachments/log-smart.txt',
  linkDiscord: 'Discord: #smart-mobile > caso-obs-fechando',
};

export interface ChecklistSmart {
  hasCliente: boolean;
  hasDevice: boolean;
  hasCaminho: boolean;
  resumoValid: boolean;
  descValid: boolean;
  stepsValid: boolean;
  evidValid: boolean;
  score: number;
}

export function validarChecklistSmart(form: EstadoSmartForm): ChecklistSmart {
  const hasCliente = Boolean(form.registro.trim());
  const hasDevice = Boolean(
    form.adquirente.trim() &&
    form.versao.trim() &&
    form.conexao.trim() &&
    form.modelo.trim()
  );
  const hasCaminho = Boolean(form.caminho.trim());
  const resumoTrim = form.resumo.trim();
  const resumoValid = Boolean(resumoTrim && resumoTrim.length <= 180);

  const descValid = form.descricoes.some((g) => g.main.trim().length > 0);
  const validSteps = form.passos.filter((s) => s.trim().length > 0);
  const stepsValid = validSteps.length >= 2;

  const temEvidencia = Boolean(
    form.linkHedgedoc.trim() ||
    form.linkPrint.trim() ||
    form.linkVideo.trim() ||
    form.linkArquivo.trim() ||
    form.linkDiscord.trim() ||
    form.linkCliente.trim()
  );

  let score = 0;
  if (hasCliente) score += 15;
  if (hasDevice) score += 15;
  if (hasCaminho) score += 15;
  if (resumoValid) score += 15;
  if (descValid) score += 15;
  if (stepsValid) score += 15;
  if (temEvidencia) score += 10;

  return {
    hasCliente,
    hasDevice,
    hasCaminho,
    resumoValid,
    descValid,
    stepsValid,
    evidValid: temEvidencia,
    score,
  };
}

export function gerarRelatorioSmart(form: EstadoSmartForm): string {
  const registro = form.registro.trim();
  const nome = form.nome.trim();
  const linkCliente = form.linkCliente.trim();
  const cnpj = form.cnpj.trim();

  const adquirente = form.adquirente.trim();
  const versao = form.versao.trim();
  const conexao = form.conexao.trim();
  const modelo = form.modelo.trim();

  const produto = 'Smart';
  let caminho = form.caminho.trim();
  if (caminho) {
    caminho = caminho.replace(/\s*>\s*/g, '>');
  }
  const resumo = form.resumo.trim();

  const linkHedge = form.linkHedgedoc.trim();
  const printEv = form.linkPrint.trim();
  const videoEv = form.linkVideo.trim();
  const arqEv = form.linkArquivo.trim();
  const discordEv = form.linkDiscord.trim();

  // 1) Metadados do cliente
  let clienteInfo = '';
  if (registro || nome || cnpj) {
    const infoItems: string[] = [];
    if (registro) infoItems.push(`Registro: ${registro}`);
    if (nome) infoItems.push(`Cliente: ${nome}`);
    if (cnpj) infoItems.push(`CNPJ: ${cnpj}`);
    clienteInfo = `<!-- Identificação: ${infoItems.join(' | ')} -->\n`;
  }

  // 2) Cabeçalho: Smart > Caminho: Resumo
  const camText = caminho || 'Não informado';
  const resText = resumo || 'Não informado';
  const headerLine = `${produto} > ${camText}: ${resText}`;

  // 3) Descrição detalhada
  const descLines: string[] = [];
  form.descricoes.forEach((group, gIdx) => {
    const mainText = group.main.trim();
    if (mainText) {
      descLines.push(`${gIdx + 1} - ${mainText}`);
      group.subs.forEach((sub, sIdx) => {
        if (sub.trim()) {
          descLines.push(`${gIdx + 1}.${sIdx + 1} - ${sub.trim()}`);
        }
      });
      if (group.img && group.img.trim()) {
        const imgUrl = group.img.trim();
        descLines.push(imgUrl.startsWith('![](') ? imgUrl : `![](${imgUrl})`);
      }
      descLines.push('');
    }
  });

  const detailedDescText =
    descLines.length > 0 ? descLines.join('\n').trim() : '1 - Não informado';

  // 4) Passos a reproduzir
  const validSteps = form.passos.filter((s) => s.trim() !== '');
  let stepsText = '';
  if (validSteps.length > 0) {
    stepsText = validSteps.map((s, i) => `${i + 1}- ${s.trim()}`).join('\n');
  } else {
    stepsText = '1- Não informado';
  }

  // 5) Evidências e Dados do Dispositivo
  const dadosTerminal: string[] = [];
  if (adquirente) dadosTerminal.push(`Adquirente: ${adquirente}`);
  if (versao) dadosTerminal.push(`Versão Atual: ${versao}`);
  if (conexao) dadosTerminal.push(`Conexão: ${conexao}`);
  if (modelo) dadosTerminal.push(`Dispositivo: ${modelo}`);

  const evidenciasList: string[] = [];
  if (dadosTerminal.length > 0) {
    evidenciasList.push(`[Terminal Smart] ${dadosTerminal.join(' | ')}`);
  }
  if (linkCliente) evidenciasList.push(linkCliente);
  if (linkHedge) evidenciasList.push(linkHedge);
  if (printEv) {
    evidenciasList.push(printEv.startsWith('http') ? `[Print] ${printEv}` : printEv);
  }
  if (videoEv) evidenciasList.push(`[Vídeo] ${videoEv}`);
  if (arqEv) evidenciasList.push(`[Arquivo] ${arqEv}`);
  if (discordEv) evidenciasList.push(discordEv);

  const evidenciasText =
    evidenciasList.length > 0 ? evidenciasList.join('\n') : 'Não informado';

  // 6) Faltou:
  const missingQuestions: string[] = [];
  if (!registro) missingQuestions.push('Qual é o número de registro do cliente?');
  if (!adquirente) missingQuestions.push('Qual é a adquirência do Smart (Playstore, Rede, Stone, Cielo, etc.)?');
  if (!versao) missingQuestions.push('Qual é a versão atual do Smart instalada?');
  if (!conexao) missingQuestions.push('Qual é a conexão utilizada (Wi-Fi ou 4G)?');
  if (!modelo) missingQuestions.push('Qual é o modelo do dispositivo POS homologado?');
  if (!caminho) missingQuestions.push('Qual é o caminho em tela no Smart?');
  if (!resumo) missingQuestions.push('Qual é a descrição resumida do ocorrido?');
  if (validSteps.length === 0) missingQuestions.push('Quais são os passos a reproduzir no Smart?');
  if (evidenciasList.length === 0) missingQuestions.push('Tem link das prints, vídeos ou conversa no Discord?');

  let finalReport = `${clienteInfo}${headerLine}\n\n${detailedDescText}\n\n**Passos a reproduzir:**\n${stepsText}\n\n**Evidências:**\n${evidenciasText}`;

  if (missingQuestions.length > 0) {
    finalReport += `\n\nFaltou:\n` + missingQuestions.map((q) => `- ${q}`).join('\n');
  }

  return finalReport;
}
