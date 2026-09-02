import { detalheOrigem, ORIGEM_LABEL, type NightShiftDemand } from '../../shared/domain';
import { formatarDataHora } from './format';

const COLUNAS = [
  'DataHora',
  'RegistroCliente',
  'TecnicoPlantao',
  'Origem',
  'DetalheOrigem',
  'Tipo',
  'Recorrente',
] as const;

function celula(valor: string | number): string {
  const texto = String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/** CSV separado por ponto e vírgula e com BOM, para abrir direto no Excel pt-BR. */
export function gerarCsv(demandas: NightShiftDemand[]): string {
  const linhas = [COLUNAS.join(';')];

  for (const d of demandas) {
    linhas.push(
      [
        formatarDataHora(d.createdAt),
        d.clienteRegistro,
        d.tecnicoPlantao,
        ORIGEM_LABEL[d.origem],
        detalheOrigem(d),
        d.tipoDemanda,
        d.recorrente ? 'Sim' : 'Não',
      ]
        .map(celula)
        .join(';'),
    );
  }

  return `﻿${linhas.join('\r\n')}\r\n`;
}

export function baixarCsv(conteudo: string, nomeArquivo: string): void {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
