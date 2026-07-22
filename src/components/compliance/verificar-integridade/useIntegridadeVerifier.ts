import { useRef, useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import { isManifest, sha256OfBytes } from "./manifest-utils";
import type { Manifest, ResultadoArquivo, Resumo } from "./types";

export function useIntegridadeVerifier() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manifestNome, setManifestNome] = useState<string | null>(null);
  const [arquivos, setArquivos] = useState<Map<string, Uint8Array>>(new Map());
  const [verificando, setVerificando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resumo, setResumo] = useState<Resumo | null>(null);

  const inputZipRef = useRef<HTMLInputElement>(null);
  const inputManifestRef = useRef<HTMLInputElement>(null);
  const inputArquivosRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setManifest(null);
    setManifestNome(null);
    setArquivos(new Map());
    setResumo(null);
    setProgresso(0);
    if (inputZipRef.current) inputZipRef.current.value = "";
    if (inputManifestRef.current) inputManifestRef.current.value = "";
    if (inputArquivosRef.current) inputArquivosRef.current.value = "";
  };

  const handleZip = async (file: File) => {
    try {
      setVerificando(true);
      setResumo(null);
      const zip = await JSZip.loadAsync(file);
      const novoMap = new Map<string, Uint8Array>();
      let manifestObj: Manifest | null = null;

      const entradas = Object.values(zip.files).filter((f) => !f.dir);
      for (const entrada of entradas) {
        const bytes = await entrada.async("uint8array");
        if (entrada.name === "manifest.json") {
          try {
            const txt = new TextDecoder().decode(bytes);
            const parsed = JSON.parse(txt);
            if (isManifest(parsed)) manifestObj = parsed;
          } catch {
            // segue — será tratado abaixo
          }
        } else {
          novoMap.set(entrada.name, bytes);
        }
      }

      if (!manifestObj) {
        toast.error("manifest.json não encontrado ou inválido dentro do ZIP.");
        setVerificando(false);
        return;
      }
      setManifest(manifestObj);
      setManifestNome(file.name);
      setArquivos(novoMap);
      toast.success(`ZIP carregado: ${entradas.length} arquivo(s).`);
    } catch (e) {
      toast.error(`Falha ao ler ZIP: ${e instanceof Error ? e.message : "erro"}`);
    } finally {
      setVerificando(false);
    }
  };

  const handleManifest = async (file: File) => {
    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt);
      if (!isManifest(parsed)) {
        toast.error("Arquivo não parece um manifest.json válido.");
        return;
      }
      setManifest(parsed);
      setManifestNome(file.name);
      setResumo(null);
      toast.success(
        `Manifest carregado — ${Object.keys(parsed.arquivos).length} arquivo(s) declarado(s).`,
      );
    } catch (e) {
      toast.error(`JSON inválido: ${e instanceof Error ? e.message : "erro"}`);
    }
  };

  const handleArquivos = async (files: FileList) => {
    const novoMap = new Map(arquivos);
    for (const f of Array.from(files)) {
      const bytes = new Uint8Array(await f.arrayBuffer());
      novoMap.set(f.name, bytes);
    }
    setArquivos(novoMap);
    setResumo(null);
    toast.success(`${files.length} arquivo(s) adicionado(s).`);
  };

  const verificar = async () => {
    if (!manifest) return;
    setVerificando(true);
    setProgresso(0);
    setResumo(null);

    const declarados = Object.entries(manifest.arquivos);
    const resultados: ResultadoArquivo[] = [];
    let ok = 0;
    let divergentes = 0;
    let ausentes = 0;

    for (let i = 0; i < declarados.length; i++) {
      const [nome, info] = declarados[i];
      const bytes = arquivos.get(nome);
      if (!bytes) {
        resultados.push({ nome, status: "ausente", hashEsperado: info.sha256 });
        ausentes++;
      } else {
        const hash = await sha256OfBytes(bytes);
        if (hash === info.sha256) {
          resultados.push({
            nome,
            status: "ok",
            hashEsperado: info.sha256,
            hashCalculado: hash,
          });
          ok++;
        } else {
          resultados.push({
            nome,
            status: "divergente",
            hashEsperado: info.sha256,
            hashCalculado: hash,
          });
          divergentes++;
        }
      }
      setProgresso(Math.round(((i + 1) / declarados.length) * 100));
    }

    let extras = 0;
    for (const [nome, bytes] of arquivos.entries()) {
      if (!manifest.arquivos[nome]) {
        const hash = await sha256OfBytes(bytes);
        resultados.push({ nome, status: "extra", hashCalculado: hash });
        extras++;
      }
    }

    setResumo({
      totalManifest: declarados.length,
      ok,
      divergentes,
      ausentes,
      extras,
      resultados,
    });
    setVerificando(false);
  };

  const podeVerificar = !!manifest && arquivos.size > 0 && !verificando;
  const integridadeOk =
    !!resumo && resumo.divergentes === 0 && resumo.ausentes === 0;

  return {
    manifest,
    manifestNome,
    arquivos,
    verificando,
    progresso,
    resumo,
    inputZipRef,
    inputManifestRef,
    inputArquivosRef,
    reset,
    handleZip,
    handleManifest,
    handleArquivos,
    verificar,
    podeVerificar,
    integridadeOk,
  };
}
