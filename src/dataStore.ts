import { useState } from 'react';
import type { RawRow, CleanedRow, RowStatus, ProcessingConfig, ProcessingStats } from './types';

// ============================================================================
// Mock raw data (simulating uploaded JSONL)
// ============================================================================
const MOCK_RAW_ROWS: RawRow[] = [
  {
    id: 'row-001',
    prompt: 'What is the time complexity of quicksort in the average case?',
    target: '<think>Quicksort divides the array around a pivot. On average, each partition splits roughly in half, giving log n levels of recursion. Each level does O(n) work. So average case is O(n log n).</think>\n<answer>O(n log n)</answer>',
    source: 'math-reasoning.jsonl',
    tokenCount: 48,
    isDuplicate: false,
    formatValid: true,
    domainFlags: [],
  },
  {
    id: 'row-002',
    prompt: 'SELECT name, age FROM users WHERE age > 25 ORDER BY age DESC LIMIT 10;',
    target: '<think>This is already a SQL query, not a question. The user pasted a query instead of asking one. This is cross-domain contamination — looks like training data leakage.</think>\n<answer>Invalid row: prompt is a SQL statement, not a question.</answer>',
    source: 'math-reasoning.jsonl',
    tokenCount: 62,
    isDuplicate: false,
    formatValid: true,
    domainFlags: ['sql-leak'],
  },
  {
    id: 'row-003',
    prompt: 'Solve for x: 2x + 5 = 15',
    target: 'x = 5',
    source: 'math-reasoning.jsonl',
    tokenCount: 12,
    isDuplicate: false,
    formatValid: false,
    domainFlags: [],
  },
  {
    id: 'row-004',
    prompt: 'What is the derivative of x²?',
    target: '<think>Using the power rule: d/dx(x^n) = n*x^(n-1). For x², n=2, so the derivative is 2x.</think>\n<answer>2x</answer>',
    source: 'math-reasoning.jsonl',
    tokenCount: 38,
    isDuplicate: false,
    formatValid: true,
    domainFlags: [],
  },
  {
    id: 'row-005',
    prompt: 'What is the time complexity of quicksort in the average case?',
    target: '<think>Quicksort average case is O(n log n).</think>\n<answer>O(n log n)</answer>',
    source: 'math-reasoning.jsonl',
    tokenCount: 28,
    isDuplicate: true,
    formatValid: true,
    domainFlags: [],
  },
  {
    id: 'row-006',
    prompt: 'Explain the difference between a stack and a queue.',
    target: '<think>A stack is LIFO (last in, first out). A queue is FIFO (first in, first out). Think of a stack of plates vs a line at a store.</think>\n<answer>Stack: LIFO. Queue: FIFO.</answer>',
    source: 'math-reasoning.jsonl',
    tokenCount: 58,
    isDuplicate: false,
    formatValid: true,
    domainFlags: [],
  },
  {
    id: 'row-007',
    prompt: 'rm -rf / --no-preserve-root',
    target: '<think>This is a dangerous bash command, not a math question. Cross-domain contamination.</think>\n<answer>Invalid: bash command in math dataset.</answer>',
    source: 'math-reasoning.jsonl',
    tokenCount: 24,
    isDuplicate: false,
    formatValid: true,
    domainFlags: ['bash-command', 'security-keyword'],
  },
  {
    id: 'row-008',
    prompt: 'What is the integral of 1/x dx?',
    target: '<think>The integral of 1/x is ln|x| + C, where C is the constant of integration. This is a standard result from calculus.</think>\n<answer>ln|x| + C</answer>',
    source: 'math-reasoning.jsonl',
    tokenCount: 44,
    isDuplicate: false,
    formatValid: true,
    domainFlags: [],
  },
  {
    id: 'row-009',
    prompt: 'If f(x) = 3x² + 2x - 1, find f\'(x).',
    target: '<think>Apply the power rule term by term. d/dx(3x²) = 6x, d/dx(2x) = 2, d/dx(-1) = 0. So f\'(x) = 6x + 2.</think>\n<answer>6x + 2</answer>',
    source: 'math-reasoning.jsonl',
    tokenCount: 52,
    isDuplicate: false,
    formatValid: true,
    domainFlags: [],
  },
  {
    id: 'row-010',
    prompt: '/etc/passwd cat /etc/shadow',
    target: '<think>These are file paths and bash commands. Not a math question.</think>\n<answer>Invalid row.</answer>',
    source: 'math-reasoning.jsonl',
    tokenCount: 18,
    isDuplicate: false,
    formatValid: true,
    domainFlags: ['file-path', 'security-keyword'],
  },
  {
    id: 'row-011',
    prompt: 'What is the limit of (sin x)/x as x approaches 0?',
    target: '<think>This is a classic limit. Using L\'Hôpital\'s rule or the squeeze theorem, the limit is 1.</think>\n<answer>1</answer>',
    source: 'math-reasoning.jsonl',
    tokenCount: 42,
    isDuplicate: false,
    formatValid: true,
    domainFlags: [],
  },
  {
    id: 'row-012',
    prompt: 'Solve the system: x + y = 5, x - y = 1',
    target: '<think>Add the equations: 2x = 6, so x = 3. Substitute: 3 + y = 5, so y = 2.</think>\n<answer>x = 3, y = 2</answer>',
    source: 'math-reasoning.jsonl',
    tokenCount: 46,
    isDuplicate: false,
    formatValid: true,
    domainFlags: [],
  },
];

// ============================================================================
// Hook
// ============================================================================
export function useDataPipeline() {
  const [rows, setRows] = useState<CleanedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [config, setConfig] = useState<ProcessingConfig>({
    maxSeqLength: 1024,
    domain: 'math-reasoning',
    deduplicate: true,
    autoFormat: true,
    domainPurityCheck: true,
  });
  const [filter, setFilter] = useState<'all' | 'kept' | 'rejected' | 'flagged'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<{ prompt: string; target: string }>({ prompt: '', target: '' });
  const [isExporting, setIsExporting] = useState(false);

  // ============================================================================
  // Ingestion & Auto-Cleaning (simulated backend)
  // ============================================================================
  const processFile = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    setRows([]);
    setStats(null);

    // Simulate backend processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const threshold = config.maxSeqLength - 200; // R7: 824 tokens default

    // Process mock data
    const processed: CleanedRow[] = MOCK_RAW_ROWS.map(row => {
      let status: RowStatus = 'kept';
      const flags: string[] = [...row.domainFlags];

      // R7: Length gate
      if (row.tokenCount > threshold) {
        flags.push('exceeds-length');
        status = 'flagged';
      }

      // Duplicate check
      if (row.isDuplicate) {
        flags.push('duplicate');
        status = 'flagged';
      }

      // Format check
      if (!row.formatValid) {
        flags.push('format-invalid');
        status = 'flagged';
      }

      // Domain purity
      if (row.domainFlags.length > 0 && config.domainPurityCheck) {
        status = 'flagged';
      }

      return {
        ...row,
        status,
        flags,
        editedPrompt: row.prompt,
        editedTarget: row.target,
      };
    });

    setRows(processed);

    // Compute stats
    const totalRows = processed.length;
    const duplicates = processed.filter(r => r.flags.includes('duplicate')).length;
    const overLength = processed.filter(r => r.tokenCount > threshold).length;
    const formatInvalid = processed.filter(r => r.flags.includes('format-invalid')).length;
    const domainFlagged = processed.filter(r => r.domainFlags.length > 0).length;
    const kept = processed.filter(r => r.status === 'kept').length;
    const flagged = processed.filter(r => r.status === 'flagged').length;

    setStats({
      totalRows,
      duplicates,
      overLength,
      formatInvalid,
      domainFlagged,
      kept,
      flagged,
      rejected: 0,
    });

    setIsProcessing(false);
  };

  // ============================================================================
  // Row Actions
  // ============================================================================
  const keepRow = (id: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'kept' as const } : r));
    updateStats();
  };

  const rejectRow = (id: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r));
    updateStats();
  };

  const startEdit = (id: string) => {
    const row = rows.find(r => r.id === id);
    if (!row) return;
    setEditingId(id);
    setEditBuffer({ prompt: row.editedPrompt, target: row.editedTarget });
  };

  const saveEdit = () => {
    if (!editingId) return;
    setRows(prev => prev.map(r =>
      r.id === editingId
        ? { ...r, editedPrompt: editBuffer.prompt, editedTarget: editBuffer.target, status: 'kept' as const }
        : r
    ));
    setEditingId(null);
    updateStats();
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const updateStats = () => {
    const kept = rows.filter(r => r.status === 'kept').length;
    const rejected = rows.filter(r => r.status === 'rejected').length;
    const flagged = rows.filter(r => r.status === 'flagged').length;
    setStats(prev => prev ? { ...prev, kept, rejected, flagged } : prev);
  };

  // ============================================================================
  // Export
  // ============================================================================
  const exportCleanData = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const keptRows = rows.filter(r => r.status === 'kept');
    const exportData = keptRows.map(r => ({
      messages: [
        { role: 'user', content: r.editedPrompt },
        { role: 'assistant', content: r.editedTarget },
      ],
    }));

    // Download as JSONL
    const blob = new Blob(
      [exportData.map(row => JSON.stringify(row)).join('\n')],
      { type: 'application/jsonl' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.domain}-clean.jsonl`;
    a.click();
    URL.revokeObjectURL(url);

    setIsExporting(false);
  };

  // Filtered rows
  const filteredRows = rows.filter(r => {
    if (filter === 'all') return r.status !== 'rejected';
    if (filter === 'kept') return r.status === 'kept';
    if (filter === 'rejected') return r.status === 'rejected';
    if (filter === 'flagged') return r.status === 'flagged';
    return true;
  });

  return {
    rows: filteredRows,
    allRows: rows,
    isProcessing,
    fileName,
    stats,
    config,
    filter,
    editingId,
    editBuffer,
    isExporting,
    processFile,
    setConfig,
    setFilter,
    keepRow,
    rejectRow,
    startEdit,
    setEditBuffer,
    saveEdit,
    cancelEdit,
    exportCleanData,
  };
}
