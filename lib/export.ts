import { parse } from 'json2csv';
import { getAllTips } from './db';

function getTimestamp(): string {
  return new Date().toISOString().split('T')[0];
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportToCSV(): Promise<void> {
  try {
    const tips = await getAllTips();
    const csv = parse(tips);
    const filename = `tip-tracker-export-${getTimestamp()}.csv`;
    triggerDownload(csv, filename, 'text/csv;charset=utf-8;');
  } catch (err) {
    throw new Error(`Failed to export tips to CSV: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function exportToJSON(): Promise<void> {
  try {
    const tips = await getAllTips();
    const json = JSON.stringify(tips, null, 2);
    const filename = `tip-tracker-export-${getTimestamp()}.json`;
    triggerDownload(json, filename, 'application/json');
  } catch (err) {
    throw new Error(`Failed to export tips to JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
}
