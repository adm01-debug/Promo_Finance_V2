import JSZip from 'jszip';

interface ZipParams {
  txtUrl: string;
  fileName: string;
  hash: string;
  empresa: { razao_social: string; cnpj: string };
  periodo: { inicio: string; fim: string };
  totalLinhas: number;
  totalLancamentos: number;
}

export async function baixarSpedZip({ txtUrl, fileName, hash, empresa, periodo, totalLinhas, totalLancamentos }: ZipParams) {
  const resp = await fetch(txtUrl);
  if (!resp.ok) throw new Error('Falha ao baixar o arquivo TXT');
  const txt = await resp.text();

  const zip = new JSZip();
  zip.file(fileName, txt);
  zip.file(
    'README.txt',
    [
      'SPED ECD — Escrituração Contábil Digital',
      '==========================================',
      '',
      `Empresa: ${empresa.razao_social}`,
      `CNPJ: ${empresa.cnpj}`,
      `Período: ${periodo.inicio} a ${periodo.fim}`,
      `Arquivo: ${fileName}`,
      `Total de linhas: ${totalLinhas}`,
      `Total de lançamentos: ${totalLancamentos}`,
      '',
      'Hash SHA-256 (verifique a integridade do arquivo):',
      hash,
      '',
      'INSTRUÇÕES:',
      '1. Importe o arquivo .txt no PVA-ECD (Programa Validador da Receita Federal).',
      '2. Execute a validação completa.',
      '3. Corrija eventuais avisos antes da transmissão oficial.',
      '4. Assine digitalmente com certificado e-CNPJ A1/A3 antes do envio.',
      '',
      'Este arquivo é PRELIMINAR. Sempre valide no PVA-ECD oficial da RFB.',
    ].join('\n'),
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.replace(/\.txt$/, '.zip');
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
