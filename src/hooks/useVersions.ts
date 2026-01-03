import { useState, useCallback } from 'react';

export interface Version {
  id: string;
  entity_type: string;
  entity_id: string;
  version_number: number;
  data: Record<string, unknown>;
  changed_by: string | null;
  changed_at: string;
  change_summary: string | null;
}

/**
 * Hook para controle de versões
 * Versão simplificada usando estado local (tabela entity_versions não existe)
 */
export function useVersions(entityType: string, entityId: string) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading] = useState(false);

  const createVersion = useCallback((data: Record<string, unknown>, summary?: string) => {
    const newVersion: Version = {
      id: crypto.randomUUID(),
      entity_type: entityType,
      entity_id: entityId,
      version_number: versions.length + 1,
      data,
      changed_by: null,
      changed_at: new Date().toISOString(),
      change_summary: summary || null,
    };
    setVersions(prev => [newVersion, ...prev]);
    return newVersion;
  }, [entityType, entityId, versions.length]);

  const restoreVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    return version?.data;
  }, [versions]);

  return {
    versions,
    isLoading,
    restoreVersion,
    createVersion,
    currentVersion: versions[0],
  };
}

export default useVersions;
