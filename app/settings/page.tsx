'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  Upload,
  Trash2,
  MapPin,
  Tag,
  Info,
  Plus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { useExport, useImportTips } from '@/hooks/useTips';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  getCustomLocations,
  addCustomLocation,
  removeCustomLocation,
  getCustomTourTypes,
  addCustomTourType,
  removeCustomTourType,
  resetToDefaults,
} from '@/lib/settings';

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function TagItem({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
      <span className="text-sm text-secondary-foreground">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={`Remove ${label}`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function AddItemRow({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (value: string) => void;
}) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue('');
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
        }}
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Add item"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { exportCSV, exportJSON } = useExport();
  const { importData, loading: importLoading } = useImportTips();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [locations, setLocations] = useState<string[]>([]);
  const [tourTypes, setTourTypes] = useState<string[]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setLocations(getCustomLocations());
    setTourTypes(getCustomTourTypes());
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'json' && ext !== 'csv') {
        toast.error('Invalid file', { description: 'Please select a .json or .csv file' });
        return;
      }

      const result = await importData(file);
      if (result.imported > 0) {
        toast.success('Import complete', {
          description: `${result.imported} tips imported${result.skipped > 0 ? `, ${result.skipped} skipped` : ''}`,
        });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [importData],
  );

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await db.tips.clear();
      toast.success('Data cleared', { description: 'All tips have been removed' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear data';
      toast.error('Clear failed', { description: message });
    } finally {
      setClearing(false);
      setShowClearDialog(false);
    }
  };

  const handleAddLocation = (name: string) => {
    addCustomLocation(name);
    setLocations(getCustomLocations());
  };

  const handleRemoveLocation = (name: string) => {
    removeCustomLocation(name);
    setLocations(getCustomLocations());
  };

  const handleAddTourType = (name: string) => {
    addCustomTourType(name);
    setTourTypes(getCustomTourTypes());
  };

  const handleRemoveTourType = (name: string) => {
    removeCustomTourType(name);
    setTourTypes(getCustomTourTypes());
  };

  const handleResetDefaults = () => {
    resetToDefaults();
    setLocations(getCustomLocations());
    setTourTypes(getCustomTourTypes());
    toast.success('Defaults restored', { description: 'Locations and tour types reset to defaults' });
  };

  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Tip Tracker';
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '';
  const version = '1.0.0';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>

      {/* Section 1: Data Management */}
      <SectionCard icon={Download} title="Data Management">
        <div className="space-y-4">
          {/* Export */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Export Tips</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={exportJSON}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Download className="h-4 w-4" />
                Export as JSON
              </button>
              <button
                type="button"
                onClick={exportCSV}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Download className="h-4 w-4" />
                Export as CSV
              </button>
            </div>
          </div>

          {/* Import */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Import Tips</p>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileChange}
                disabled={importLoading}
                className="flex-1 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground file:transition-colors hover:file:bg-primary/90 file:disabled:opacity-50"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Accepts .json or .csv files exported from Tip Tracker
            </p>
          </div>

          {/* Clear All */}
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setShowClearDialog(true)}
              disabled={clearing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              This will permanently delete all tips from your device
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Section 2: Custom Locations */}
      <SectionCard icon={MapPin} title="Custom Locations">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {locations.map((loc) => (
              <TagItem
                key={loc}
                label={loc}
                onRemove={() => handleRemoveLocation(loc)}
              />
            ))}
          </div>
          <AddItemRow
            placeholder="Add new location..."
            onAdd={handleAddLocation}
          />
        </div>
      </SectionCard>

      {/* Section 3: Custom Tour Types */}
      <SectionCard icon={Tag} title="Custom Tour Types">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {tourTypes.map((type) => (
              <TagItem
                key={type}
                label={type}
                onRemove={() => handleRemoveTourType(type)}
              />
            ))}
          </div>
          <AddItemRow
            placeholder="Add new tour type..."
            onAdd={handleAddTourType}
          />
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-sm text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Section 4: About */}
      <SectionCard icon={Info} title="About">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">App</span>
            <span className="font-medium text-foreground">{appName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium text-foreground">{version}</span>
          </div>
          {supportEmail && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Support</span>
              <a
                href={`mailto:${supportEmail}`}
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                {supportEmail}
              </a>
            </div>
          )}
          <div className="border-t border-border pt-2 text-center text-xs text-muted-foreground">
            Made with care for VIP Tour Guides
          </div>
        </div>
      </SectionCard>

      {/* Clear All Confirmation Dialog */}
      <ConfirmDialog
        open={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={handleClearAll}
        title="Clear All Data"
        message="This will permanently delete all tips from your device. This action cannot be undone. Make sure to export your data first."
        confirmLabel="Delete Everything"
        variant="danger"
      />
    </div>
  );
}
