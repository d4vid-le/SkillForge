import { useDataPipeline } from '../dataStore';
import { UploadPanel } from './UploadPanel';
import { ReviewQueue } from './ReviewQueue';
import { ExportPanel } from './ExportPanel';

export function DataStage() {
  const pipeline = useDataPipeline();

  return (
    <div className="min-h-screen bg-[#1e1e1e] px-5 py-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">Data Pipeline</h1>
            <p className="text-[11px] text-[#8e8e93] mt-0.5">
              Ingest, clean, review, and export training-ready JSONL
            </p>
          </div>
          {pipeline.stats && (
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="text-[#8e8e93]">
                {pipeline.stats.kept} kept
              </span>
              <span className="text-[#ffd60a]">
                {pipeline.stats.flagged} flagged
              </span>
              <span className="text-[#ff453a]">
                {pipeline.stats.rejected} rejected
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Upload & Config */}
      <UploadPanel
        isProcessing={pipeline.isProcessing}
        fileName={pipeline.fileName}
        config={pipeline.config}
        stats={pipeline.stats}
        onProcess={pipeline.processFile}
        onConfigChange={pipeline.setConfig}
      />

      {/* Review Queue */}
      {pipeline.rows.length > 0 && (
        <ReviewQueue
          rows={pipeline.rows}
          filter={pipeline.filter}
          editingId={pipeline.editingId}
          editBuffer={pipeline.editBuffer}
          onFilterChange={pipeline.setFilter}
          onKeep={pipeline.keepRow}
          onReject={pipeline.rejectRow}
          onStartEdit={pipeline.startEdit}
          onEditBufferChange={pipeline.setEditBuffer}
          onSaveEdit={pipeline.saveEdit}
          onCancelEdit={pipeline.cancelEdit}
        />
      )}

      {/* Export */}
      {pipeline.stats && pipeline.stats.kept > 0 && (
        <ExportPanel
          keptCount={pipeline.stats.kept}
          isExporting={pipeline.isExporting}
          onExport={pipeline.exportCleanData}
        />
      )}
    </div>
  );
}
