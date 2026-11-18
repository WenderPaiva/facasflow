import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  Download,
  ExternalLink,
  Eye,
  FileJson,
  HardDriveDownload,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-react';
import {
  BackupLogRecord,
  BackupRecord,
  BackupType,
  CompanySettingsRecord,
} from '../types/order';
import { formatDateTimeGoiasBR } from '../utils/financeEngine';
import { invokeBackupEngine } from '../services/supabaseDataService';

interface SettingsBackupsSectionProps {
  empresaId: string;
  companyName: string;
  settings: CompanySettingsRecord;
  backups: BackupRecord[];
  logs: BackupLogRecord[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onUpdateSettings: (
    updates: Pick<
      CompanySettingsRecord,
      'retencao_diaria' | 'retencao_mensal' | 'backup_automatico'
    >
  ) => Promise<void>;
  onDismissAlert: (logId: string) => Promise<void>;
  onRestored: () => Promise<void>;
}

const BACKUP_TYPE_META: Record<
  BackupType,
  { label: string; badgeClass: string }
> = {
  automatico: {
    label: 'Automático',
    badgeClass: 'bg-indigo-500/15 text-indigo-800 border-indigo-300/60',
  },
  manual: {
    label: 'Manual',
    badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-300/60',
  },
  pre_restauracao: {
    label: 'Pré-Restauração',
    badgeClass: 'bg-amber-500/15 text-amber-900 border-amber-300/60',
  },
};

const TABLE_LABELS: Record<string, string> = {
  clientes_empresas: 'Clientes / Empresas',
  ordens_servico: 'Ordens de Serviço',
  entregas: 'Entregas',
  retornos: 'Retornos / Garantia',
  estoque_itens: 'Itens de Estoque',
  notas: 'Notas / Canhotos',
  nota_itens: 'Itens de Notas',
  despesas: 'Despesas',
  prestadores_servico: 'Prestadores de Serviço',
  funcionarios_folha: 'Colaboradores CLT',
  investimentos: 'Investimentos',
};

function formatBytes(bytes: number): string {
  const safe = Number(bytes) || 0;
  if (safe < 1024) return `${safe} B`;
  if (safe < 1024 * 1024) return `${(safe / 1024).toFixed(1)} KB`;
  return `${(safe / (1024 * 1024)).toFixed(2)} MB`;
}

export const SettingsBackupsSection: React.FC<SettingsBackupsSectionProps> = ({
  empresaId,
  companyName,
  settings,
  backups,
  logs,
  loading,
  onRefresh,
  onUpdateSettings,
  onDismissAlert,
  onRestored,
}) => {
  const [retDaily, setRetDaily] = useState<number>(settings.retencao_diaria || 30);
  const [retMonthly, setRetMonthly] = useState<number>(settings.retencao_mensal || 12);
  const [autoEnabled, setAutoEnabled] = useState<boolean>(settings.backup_automatico ?? true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [creatingManual, setCreatingManual] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Preview & Restore state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    backupId: string;
    integrityOk: boolean;
    expectedSha256: string;
    actualSha256: string;
    schemaVersion: number;
    backupCounts: Record<string, number>;
    currentCounts: Record<string, number>;
  } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirmRestoreText, setConfirmRestoreText] = useState('');
  const [restoring, setRestoring] = useState(false);

  // Import JSON state
  const [importOpen, setImportOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importSnapshot, setImportSnapshot] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmImportText, setConfirmImportText] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setRetDaily(settings.retencao_diaria || 30);
    setRetMonthly(settings.retencao_mensal || 12);
    setAutoEnabled(settings.backup_automatico ?? true);
  }, [settings]);

  const activeAlerts = logs.filter(
    (l) => l.status === 'erro' && !l.alerta_dispensado
  );

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setActionMsg(null);
    try {
      await onUpdateSettings({
        retencao_diaria: Math.max(1, Math.min(365, Number(retDaily) || 30)),
        retencao_mensal: Math.max(1, Math.min(120, Number(retMonthly) || 12)),
        backup_automatico: autoEnabled,
      });
      setActionMsg({ type: 'ok', text: 'Política de retenção atualizada com sucesso.' });
    } catch (err: any) {
      setActionMsg({
        type: 'err',
        text: err?.message || 'Erro ao salvar configurações.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateManualBackup = async () => {
    setCreatingManual(true);
    setActionMsg(null);
    try {
      await invokeBackupEngine({ action: 'snapshot_company', tipo: 'manual' });
      await onRefresh();
      setActionMsg({
        type: 'ok',
        text: 'Snapshot manual gerado e gravado em bucket privado com SHA-256.',
      });
    } catch (err: any) {
      await onRefresh().catch(() => {});
      setActionMsg({
        type: 'err',
        text: err?.message || 'Falha ao gerar backup manual.',
      });
    } finally {
      setCreatingManual(false);
    }
  };

  const handleSignedDownload = async (backupId: string) => {
    setDownloadingId(backupId);
    setActionMsg(null);
    try {
      const res = await invokeBackupEngine({ action: 'signed_url', backupId });
      if (res?.signedUrl) {
        window.open(res.signedUrl, '_blank', 'noopener,noreferrer');
        setActionMsg({
          type: 'ok',
          text: 'URL assinada gerada (válida por 5 minutos).',
        });
      }
    } catch (err: any) {
      setActionMsg({
        type: 'err',
        text: err?.message || 'Não foi possível gerar a URL assinada.',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportJson = async (backupId: string) => {
    setDownloadingId(backupId);
    setActionMsg(null);
    try {
      const res = await invokeBackupEngine({ action: 'download_json', backupId });
      if (res?.snapshot) {
        const blob = new Blob([JSON.stringify(res.snapshot, null, 2)], {
          type: 'application/json;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facasflow_backup_${empresaId.slice(0, 8)}_${backupId.slice(0, 8)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      setActionMsg({
        type: 'err',
        text: err?.message || 'Erro ao exportar JSON verificado.',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenPreview = async (backupId: string) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewData(null);
    setPreviewError(null);
    setConfirmRestoreText('');
    try {
      const res = await invokeBackupEngine({ action: 'preview_backup', backupId });
      setPreviewData(res);
    } catch (err: any) {
      setPreviewError(err?.message || 'Falha ao carregar pré-visualização do backup.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!previewData || !previewData.integrityOk) return;
    setRestoring(true);
    setPreviewError(null);
    try {
      await invokeBackupEngine({
        action: 'restore_backup',
        backupId: previewData.backupId,
        confirmText: confirmRestoreText.trim().toUpperCase(),
      });
      setPreviewOpen(false);
      await onRestored();
      await onRefresh();
      setActionMsg({
        type: 'ok',
        text: 'Restauração concluída em transação! Um backup pré-restauração (90 dias) foi salvo automaticamente.',
      });
    } catch (err: any) {
      setPreviewError(err?.message || 'Erro ao restaurar backup.');
    } finally {
      setRestoring(false);
    }
  };

  const handleSelectImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (!parsed || typeof parsed !== 'object' || (!parsed.tables && !parsed.orders && !parsed.ordens_servico)) {
          setImportError('Arquivo JSON não possui estrutura válida de backup FacasFlow.');
          setImportSnapshot(null);
        } else {
          setImportSnapshot(parsed);
          setImportError(null);
        }
        setImportFileName(file.name);
        setConfirmImportText('');
        setImportOpen(true);
      } catch {
        setImportError('Não foi possível ler o JSON selecionado.');
        setImportFileName(file.name);
        setImportSnapshot(null);
        setImportOpen(true);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleConfirmImport = async () => {
    if (!importSnapshot) return;
    setImporting(true);
    setImportError(null);
    try {
      await invokeBackupEngine({
        action: 'import_backup',
        snapshot: importSnapshot,
        confirmText: confirmImportText.trim().toUpperCase(),
      });
      setImportOpen(false);
      await onRestored();
      await onRefresh();
      setActionMsg({
        type: 'ok',
        text: 'Importação JSON aplicada com sucesso após snapshot pré-restauração.',
      });
    } catch (err: any) {
      setImportError(err?.message || 'Erro ao importar JSON.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5 min-w-0">
      {/* Admin-only Backup Failure Alerts */}
      {activeAlerts.length > 0 && (
        <div className="rounded-[24px] bg-rose-500/15 border border-rose-500/70 p-4 sm:p-5 space-y-3 min-w-0">
          <div className="flex items-center gap-2 text-rose-900">
            <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">
              Alerta de Falha de Backup ({activeAlerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {activeAlerts.map((al) => (
              <div
                key={al.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/70 rounded-2xl p-3 border border-rose-300/70 text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-rose-900 block break-words">
                    {al.mensagem}
                  </span>
                  <span className="text-[11px] text-slate-600">
                    {formatDateTimeGoiasBR(al.created_at)} • {BACKUP_TYPE_META[al.tipo]?.label || al.tipo}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onDismissAlert(al.id)}
                  className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-xs font-bold text-slate-800 shrink-0 cursor-pointer"
                >
                  Dispensar alerta
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header & Retention Settings */}
      <div className="liquid-glass rounded-[28px] p-4 sm:p-6 space-y-5 min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-indigo-700 mb-1">
              <DatabaseBackup className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">
                Configurações & Backups por Empresa
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 break-words">
              {companyName}
            </h2>
            <p className="text-xs font-medium text-slate-600 mt-0.5">
              Backups isolados em bucket privado (<code className="font-mono">facasflow-backups</code>) com integridade SHA-256 e retenção configurável.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-800 inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>

            <label className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-800 inline-flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Importar JSON</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleSelectImportFile}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={handleCreateManualBackup}
              disabled={creatingManual}
              className="min-h-[44px] px-5 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              {creatingManual ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <HardDriveDownload className="w-4 h-4" />
              )}
              <span>Gerar Backup Manual</span>
            </button>
          </div>
        </div>

        {actionMsg && (
          <div
            className={`rounded-2xl p-3.5 text-xs font-bold border flex items-start gap-2 ${
              actionMsg.type === 'ok'
                ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-900'
                : 'bg-rose-500/15 border-rose-400/60 text-rose-900'
            }`}
          >
            {actionMsg.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            )}
            <span>{actionMsg.text}</span>
          </div>
        )}

        {/* Retention Policy Form */}
        <form
          onSubmit={handleSaveSettings}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/60 items-end"
        >
          <div className="flex items-center justify-between sm:justify-start gap-3 min-h-[44px] px-3.5 py-2 rounded-2xl bg-white/50 border border-white/75">
            <label htmlFor="chk-auto-bkp" className="text-xs font-bold text-slate-800 cursor-pointer">
              Backup automático ativo
            </label>
            <input
              id="chk-auto-bkp"
              type="checkbox"
              checked={autoEnabled}
              onChange={(e) => setAutoEnabled(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-800 block mb-1">
              Retenção Diária (dias)
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={retDaily}
              onChange={(e) => setRetDaily(Number(e.target.value))}
              className="liquid-glass-input w-full min-h-[44px] px-3.5 py-2 rounded-xl text-base text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-800 block mb-1">
              Retenção Mensal (meses)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={retMonthly}
              onChange={(e) => setRetMonthly(Number(e.target.value))}
              className="liquid-glass-input w-full min-h-[44px] px-3.5 py-2 rounded-xl text-base text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="liquid-glass-pill min-h-[44px] px-5 py-2 rounded-full text-sm font-bold text-indigo-800 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {savingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Salvar Política</span>
          </button>
        </form>
        <p className="text-[11px] font-medium text-slate-600">
          Backups pré-restauração são mantidos por 90 dias. A rotina automática diária nunca apaga o backup mais recente da empresa.
        </p>
      </div>

      {/* Backups List */}
      <div className="liquid-glass rounded-[28px] overflow-hidden min-w-0">
        <div className="p-4 sm:p-5 border-b border-white/60 flex items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Backups Disponíveis ({backups.length})
          </h3>
          <span className="text-xs font-semibold text-slate-600">
            Fuso: Goiás (UTC-3)
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 text-center text-sm font-medium text-slate-600">
            Nenhum backup registrado ainda. Clique em "Gerar Backup Manual" para criar o primeiro snapshot.
          </div>
        ) : (
          <>
            {/* Mobile Cards (< 768px) */}
            <div className="md:hidden divide-y divide-white/55">
              {backups.map((b) => {
                const tMeta = BACKUP_TYPE_META[b.tipo] || BACKUP_TYPE_META.manual;
                const totalRegs = Object.values(b.resumo_tabelas || {}).reduce(
                  (acc, n) => acc + (Number(n) || 0),
                  0
                );

                return (
                  <div key={b.id} className="p-4 space-y-2.5 text-xs min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${tMeta.badgeClass}`}
                      >
                        {tMeta.label}
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {formatBytes(b.tamanho_bytes)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 font-semibold block">Data</span>
                        <span className="font-bold text-slate-900">
                          {formatDateTimeGoiasBR(b.created_at)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Registros</span>
                        <span className="font-bold text-slate-900">{totalRegs} itens</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 font-semibold block">SHA-256</span>
                        <span className="font-mono text-[11px] text-emerald-800 font-bold break-all">
                          {b.sha256.slice(0, 24)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(b.id)}
                        className="min-h-[44px] px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Visualizar / Restaurar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportJson(b.id)}
                        disabled={downloadingId === b.id}
                        className="liquid-glass-pill min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileJson className="w-4 h-4 text-indigo-600" />
                        <span>JSON</span>
                      </button>

                      {b.storage_path && (
                        <button
                          type="button"
                          onClick={() => handleSignedDownload(b.id)}
                          disabled={downloadingId === b.id}
                          className="liquid-glass-pill min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4 text-emerald-600" />
                          <span>URL 5m</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-600 border-b border-white/60 bg-white/30">
                    <th className="py-3 px-4 font-extrabold">Data (Goiás)</th>
                    <th className="py-3 px-4 font-extrabold">Tipo</th>
                    <th className="py-3 px-4 font-extrabold">Tamanho</th>
                    <th className="py-3 px-4 font-extrabold">Integridade SHA-256</th>
                    <th className="py-3 px-4 text-right font-extrabold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/45 text-xs">
                  {backups.map((b) => {
                    const tMeta = BACKUP_TYPE_META[b.tipo] || BACKUP_TYPE_META.manual;
                    const totalRegs = Object.values(b.resumo_tabelas || {}).reduce(
                      (acc, n) => acc + (Number(n) || 0),
                      0
                    );
                    return (
                      <tr key={b.id} className="hover:bg-white/35 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-bold text-slate-900 block">
                            {formatDateTimeGoiasBR(b.created_at)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {totalRegs} registros • v{b.schema_version}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${tMeta.badgeClass}`}
                          >
                            {tMeta.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-slate-800">
                          {formatBytes(b.tamanho_bytes)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            title={b.sha256}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-300/60 font-mono text-[11px] font-bold"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            {b.sha256.slice(0, 10)}...
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {b.storage_path && (
                              <button
                                type="button"
                                onClick={() => handleSignedDownload(b.id)}
                                disabled={downloadingId === b.id}
                                className="liquid-glass-pill min-h-[44px] px-2.5 py-1.5 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>GZ</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleExportJson(b.id)}
                              disabled={downloadingId === b.id}
                              className="liquid-glass-pill min-h-[44px] px-2.5 py-1.5 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <FileJson className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>JSON</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(b.id)}
                              className="min-h-[44px] px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                              <span>Visualizar / Restaurar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Recent Logs */}
      <div className="liquid-glass rounded-[28px] p-4 sm:p-5 space-y-3 min-w-0">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
          Histórico de Execuções ({logs.length})
        </h3>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-600">Sem registros recentes.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {logs.slice(0, 20).map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/50 border border-white/75 text-xs"
              >
                <div className="flex items-start sm:items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 mt-1 sm:mt-0 ${
                      log.status === 'sucesso' ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  />
                  <span className="font-semibold text-slate-900 break-words">
                    {log.mensagem}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-600 shrink-0">
                  {formatDateTimeGoiasBR(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview & Restore Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/45 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Visualizar e Restaurar Backup"
            className="liquid-glass w-full md:max-w-2xl max-h-[92dvh] rounded-t-[28px] md:rounded-[28px] flex flex-col overflow-hidden shadow-2xl border border-white/80"
          >
            <div className="px-5 py-4 border-b border-white/60 flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Visualizar Antes de Restaurar
                </h4>
                <p className="text-xs text-slate-600">
                  Comparação entre registros no backup e o estado atual do banco.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label="Fechar pré-visualização"
                className="min-h-[44px] min-w-[44px] rounded-full liquid-glass-pill inline-flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {previewLoading ? (
                <div className="py-10 flex flex-col items-center gap-2 text-xs font-bold text-slate-700">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span>Verificando integridade SHA-256 e comparando tabelas...</span>
                </div>
              ) : previewError ? (
                <div className="rounded-2xl bg-rose-500/15 border border-rose-500/60 p-4 text-xs font-bold text-rose-900">
                  {previewError}
                </div>
              ) : previewData ? (
                <>
                  <div
                    className={`rounded-2xl p-4 border text-xs font-bold flex items-start gap-2.5 ${
                      previewData.integrityOk
                        ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-900'
                        : 'bg-rose-500/20 border-rose-500/70 text-rose-900'
                    }`}
                  >
                    {previewData.integrityOk ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0" />
                    )}
                    <div className="min-w-0 space-y-1">
                      <span className="block">
                        {previewData.integrityOk
                          ? `Integridade SHA-256 verificada (Schema v${previewData.schemaVersion}).`
                          : 'RESTAURAÇÃO BLOQUEADA: SHA-256 não confere com o snapshot original.'}
                      </span>
                      <span className="font-mono text-[11px] block break-all opacity-85">
                        Esperado: {previewData.expectedSha256}
                      </span>
                      {!previewData.integrityOk && (
                        <span className="font-mono text-[11px] block break-all">
                          Obtido: {previewData.actualSha256}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {Object.keys(TABLE_LABELS).map((tbl) => {
                      const bCount = previewData.backupCounts?.[tbl] ?? 0;
                      const cCount = previewData.currentCounts?.[tbl] ?? 0;
                      const changed = bCount !== cCount;
                      return (
                        <div
                          key={tbl}
                          className={`flex items-center justify-between gap-2 min-w-0 px-3.5 py-2.5 rounded-2xl border ${
                            changed
                              ? 'bg-amber-500/10 border-amber-400/50'
                              : 'bg-white/55 border-white/75'
                          }`}
                        >
                          <span className="font-bold text-slate-800 truncate">
                            {TABLE_LABELS[tbl]}
                          </span>
                          <span className="font-mono font-extrabold text-slate-900 shrink-0">
                            Backup: {bCount} / Atual: {cCount}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {previewData.integrityOk && (
                    <div className="space-y-2 pt-2 border-t border-white/60">
                      <label className="text-xs font-extrabold text-slate-900 block">
                        Para confirmar a restauração transacional (criará backup{' '}
                        <code className="font-mono">pre_restauracao</code> antes), digite{' '}
                        <strong className="text-rose-700">RESTAURAR</strong>:
                      </label>
                      <input
                        type="text"
                        value={confirmRestoreText}
                        onChange={(e) => setConfirmRestoreText(e.target.value)}
                        placeholder="RESTAURAR"
                        className="liquid-glass-input w-full min-h-[44px] px-3.5 py-2 rounded-xl text-base font-mono uppercase text-slate-900"
                      />
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="px-5 py-4 border-t border-white/60 bg-white/50 flex flex-wrap items-center justify-end gap-2 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-sm font-bold text-slate-700 cursor-pointer"
              >
                Fechar
              </button>
              {previewData?.integrityOk && (
                <button
                  type="button"
                  disabled={
                    restoring || confirmRestoreText.trim().toUpperCase() !== 'RESTAURAR'
                  }
                  onClick={handleConfirmRestore}
                  className="min-h-[44px] px-5 py-2 rounded-full bg-rose-600 disabled:bg-rose-300 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  {restoring && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirmar Restauração</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import JSON Confirmation Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/45 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Importar Backup JSON"
            className="liquid-glass w-full md:max-w-lg rounded-t-[28px] md:rounded-[28px] p-5 space-y-4 shadow-2xl border border-white/80 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-base font-extrabold text-slate-900">
                Importar Backup JSON
              </h4>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-full liquid-glass-pill inline-flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-700 break-all">
              Arquivo: <strong>{importFileName}</strong>
            </p>

            {importError && (
              <div className="rounded-xl bg-rose-500/15 border border-rose-500/60 p-3 text-xs font-bold text-rose-900">
                {importError}
              </div>
            )}

            {importSnapshot && (
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-900 block">
                  Um snapshot <code className="font-mono">pre_restauracao</code> será criado automaticamente antes de importar. Digite{' '}
                  <strong className="text-rose-700">IMPORTAR</strong> para prosseguir:
                </label>
                <input
                  type="text"
                  value={confirmImportText}
                  onChange={(e) => setConfirmImportText(e.target.value)}
                  placeholder="IMPORTAR"
                  className="liquid-glass-input w-full min-h-[44px] px-3.5 py-2 rounded-xl text-base font-mono uppercase text-slate-900"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-sm font-bold text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              {importSnapshot && (
                <button
                  type="button"
                  disabled={
                    importing || confirmImportText.trim().toUpperCase() !== 'IMPORTAR'
                  }
                  onClick={handleConfirmImport}
                  className="min-h-[44px] px-5 py-2 rounded-full bg-indigo-600 disabled:bg-indigo-300 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Importar Agora</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
