import JSZip from 'jszip';

interface ZipParams {
  txtUrl: string;
  fileName: string;
  hash: string;
  empresa: { razao_social: string; cnpj: string };
  periodo: { inicio: string; fim: string };
  totalLinhas: number;
  totalLancamentos: number;
  tipo?: 'ECD' | 'ECF';
}

function gerarReadme(params: ZipParams): string {
  const { fileName, hash, empresa, periodo, totalLinhas, totalLancamentos, tipo = 'ECD' } = params;
  const geradoEm = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const tituloLongo = tipo === 'ECD'
    ? 'SPED ECD — Escrituração Contábil Digital'
    : 'SPED ECF — Escrituração Contábil Fiscal';
  const pvaNome = tipo === 'ECD' ? 'PVA-ECD' : 'PVA-ECF';
  const linkPva = tipo === 'ECD'
    ? 'https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/download/pgd/sped-ecd'
    : 'https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/download/pgd/sped-ecf';

  return [
    '='.repeat(70),
    tituloLongo,
    'Pacote preliminar gerado pelo sistema',
    '='.repeat(70),
    '',
    '## DADOS DA EMPRESA',
    `  Razão Social...: ${empresa.razao_social}`,
    `  CNPJ...........: ${empresa.cnpj}`,
    `  Período........: ${periodo.inicio}  a  ${periodo.fim}`,
    '',
    '## DADOS DO ARQUIVO',
    `  Nome do TXT....: ${fileName}`,
    `  Total de linhas: ${totalLinhas.toLocaleString('pt-BR')}`,
    `  Lançamentos....: ${totalLancamentos.toLocaleString('pt-BR')}`,
    `  Gerado em......: ${geradoEm} (America/Sao_Paulo)`,
    '',
    '## INTEGRIDADE — Hash SHA-256',
    `  ${hash}`,
    '',
    '  Verifique a integridade do TXT antes de transmitir:',
    '   • Linux/macOS:   shasum -a 256 ' + fileName,
    '   • Windows (PS):  Get-FileHash ' + fileName + ' -Algorithm SHA256',
    '  O valor exibido deve ser EXATAMENTE igual ao hash acima.',
    '',
    '='.repeat(70),
    `## PASSO A PASSO — Validação no ${pvaNome}`,
    '='.repeat(70),
    '',
    `1) BAIXE O ${pvaNome} (Programa Validador da Receita Federal):`,
    `   ${linkPva}`,
    '   Use sempre a versão MAIS RECENTE compatível com o ano-calendário.',
    '',
    `2) ABRA O ${pvaNome} e selecione:`,
    '   Menu  →  Escrituração  →  Importar',
    `   Aponte para o arquivo: ${fileName}`,
    '',
    '3) EXECUTE A VALIDAÇÃO COMPLETA:',
    '   Menu  →  Escrituração  →  Verificar Pendências',
    '   Aguarde a verificação de todos os blocos (0, I, J, K, 9 etc.).',
    '',
    '4) ANALISE O RELATÓRIO DE PENDÊNCIAS:',
    '   • ERROS    → IMPEDEM a transmissão. Corrija no sistema e gere novamente.',
    '   • AVISOS   → Não impedem, mas avalie e justifique se necessário.',
    '   • OCORRÊNCIAS → Apenas informativas.',
    '',
    '5) ASSINATURA DIGITAL:',
    '   Menu  →  Escrituração  →  Assinar',
    '   Use Certificado Digital e-CNPJ (A1 ou A3) válido do contador',
    '   responsável e/ou do representante legal.',
    '',
    '6) TRANSMISSÃO OFICIAL:',
    '   Menu  →  Escrituração  →  Transmitir',
    '   Após o envio, salve o RECIBO DE TRANSMISSÃO emitido pelo SPED.',
    `   Cadastre o número do recibo no sistema (aba "${tipo}" → "Registrar transmissão").`,
    '',
    '='.repeat(70),
    '## PRAZOS LEGAIS (referência)',
    '='.repeat(70),
    tipo === 'ECD'
      ? '  ECD → Último dia útil de MAIO do ano seguinte ao ano-calendário.'
      : '  ECF → Último dia útil de JULHO do ano seguinte ao ano-calendário.',
    '  Em caso de extinção, cisão, fusão ou incorporação, prazos especiais se aplicam.',
    '  Consulte a Instrução Normativa RFB vigente.',
    '',
    '='.repeat(70),
    '## AVISO IMPORTANTE',
    '='.repeat(70),
    '  Este pacote foi gerado por sistema de terceiros e é considerado PRELIMINAR.',
    `  A validação OFICIAL e a transmissão SÓ podem ser feitas pelo ${pvaNome} da RFB.`,
    '  Em caso de divergência entre o relatório do sistema e o PVA, prevalece o PVA.',
    '',
    '  Conteúdo do ZIP:',
    `   • ${fileName}   (arquivo SPED para importar no ${pvaNome})`,
    '   • README.txt              (este arquivo)',
    '',
    '='.repeat(70),
    '',
  ].join('\n');
}

export async function baixarSpedZip(params: ZipParams) {
  const { txtUrl, fileName } = params;
  const resp = await fetch(txtUrl);
  if (!resp.ok) throw new Error('Falha ao baixar o arquivo TXT');
  const txt = await resp.text();

  const zip = new JSZip();
  zip.file(fileName, txt);
  zip.file('README.txt', gerarReadme(params));

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.replace(/\.txt$/i, '.zip');
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
