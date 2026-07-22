export function downloadArquivoSPED(conteudo: string, nomeArquivo: string): void {
  const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function validarArquivoSPED(conteudo: string): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  const linhas = conteudo.split('\r\n');

  if (!linhas[0]?.startsWith('|0000|')) {
    erros.push('Arquivo deve iniciar com registro 0000');
  }

  if (!linhas[linhas.length - 1]?.startsWith('|9999|')) {
    erros.push('Arquivo deve terminar com registro 9999');
  }

  linhas.forEach((linha, index) => {
    if (linha && !linha.startsWith('|')) {
      erros.push(`Linha ${index + 1}: formato inválido`);
    }
  });

  return { valido: erros.length === 0, erros };
}
