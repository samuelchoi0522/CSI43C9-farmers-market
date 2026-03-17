"use client";

import { useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Button from "./Button";
import { CategoryLabel } from "@/lib/api/vendorLabels";
import { COLOR_PALETTE, getLabelColors } from "@/lib/labelColors";

interface LabelPickerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  labels: CategoryLabel[];
  checkedIds?: number[];
  loading?: boolean;
  error?: string | null;
  showCheckboxes?: boolean;
  onToggle: (label: CategoryLabel, nextChecked: boolean) => Promise<void> | void;
  onCreate: (name: string, color: string | null) => Promise<void> | void;
  onEdit: (label: CategoryLabel, name: string, color: string | null) => Promise<void> | void;
  onDelete?: (label: CategoryLabel) => Promise<void> | void;
}

export default function LabelPickerDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  labels,
  checkedIds = [],
  loading,
  error,
  showCheckboxes = true,
  onToggle,
  onCreate,
  onEdit,
  onDelete,
}: LabelPickerDialogProps) {
  const palette = COLOR_PALETTE;
  const [searchTerm, setSearchTerm] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColorInput, setNewLabelColorInput] = useState(palette[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColorInput, setEditingColorInput] = useState(palette[0]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredLabels = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return labels;
    return labels.filter((label) => label.name.toLowerCase().includes(term));
  }, [labels, searchTerm]);

  const handleCreate = async () => {
    const trimmed = newLabelName.trim();
    if (!trimmed || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setLocalError(null);
      const nextColor = palette.includes(newLabelColorInput) ? newLabelColorInput : null;
      await onCreate(trimmed, nextColor);
      setNewLabelName("");
    } catch {
      setLocalError("Failed to create label.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSave = async () => {
    if (editingId === null || isSubmitting) return;
    const trimmed = editingName.trim();
    if (!trimmed) return;
    const label = labels.find((item) => item.id === editingId);
    if (!label) return;

    try {
      setIsSubmitting(true);
      setLocalError(null);
      const nextColor = palette.includes(editingColorInput) ? editingColorInput : null;
      await onEdit(label, trimmed, nextColor);
      setEditingId(null);
      setEditingName("");
    } catch {
      setLocalError("Failed to update label.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-xl translate-x-[-50%] translate-y-[-50%] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <DialogPrimitive.Title className="text-sm font-semibold">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-xs text-slate-400 mt-1">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close className="rounded-sm opacity-70 text-slate-500 dark:text-slate-300 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          <div className="p-4 space-y-3">
            <input
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
              placeholder="Search labels..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-4">
              {loading ? (
                <p className="text-xs text-slate-500">Loading labels...</p>
              ) : filteredLabels.length === 0 ? (
                <p className="text-xs text-slate-500">No labels found.</p>
              ) : (
                filteredLabels.map((label) => {
                  const colors = getLabelColors(label.name, label.color);
                  const isChecked = checkedIds.includes(label.id);
                  return (
                    <div key={label.id} className="flex items-center gap-2">
                      {showCheckboxes ? (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggle(label, !isChecked)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-[#10b981] focus:ring-[#10b981]"
                        />
                      ) : (
                        <span className="h-4 w-4" />
                      )}
                      {editingId === label.id ? (
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              className="flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                              value={editingName}
                              onChange={(event) => setEditingName(event.target.value)}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            {palette.map((swatch) => (
                              <button
                                key={swatch}
                                type="button"
                                className="relative h-6 w-6 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center"
                                style={{ backgroundColor: swatch }}
                                onClick={() => {
                                  setEditingColorInput(swatch);
                                }}
                                aria-label={`Use ${swatch}`}
                              >
                                {editingColorInput.toLowerCase() === swatch.toLowerCase() ? (
                                  <span className="material-icons text-[14px] text-white drop-shadow">
                                    check
                                  </span>
                                ) : null}
                              </button>
                            ))}
                            <div className="flex-1" />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleEditSave}
                              disabled={isSubmitting || editingName.trim().length === 0}
                            >
                              Confirm
                            </Button>
                            {onDelete ? (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={async () => {
                                  const confirmed = window.confirm(
                                    `Delete label "${label.name}"? This will remove it from vendors.`,
                                  );
                                  if (!confirmed) return;
                                  await onDelete(label);
                                  setEditingId(null);
                                  setEditingName("");
                                }}
                                disabled={isSubmitting}
                              >
                                Delete
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex-1 rounded-md px-3 py-1 text-xs font-semibold tracking-wide"
                          style={{
                            backgroundColor: colors.backgroundColor,
                            color: colors.color,
                            border: `1px solid ${colors.borderColor}`,
                          }}
                        >
                          {label.name.toUpperCase()}
                        </div>
                      )}
                      {editingId === label.id ? (
                        <button
                          type="button"
                          className="text-xs text-slate-400 hover:text-slate-200"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                          onClick={() => {
                            setEditingId(label.id);
                            setEditingName(label.name);
                            const nextColor =
                              label.color && palette.includes(label.color)
                                ? label.color
                                : getLabelColors(label.name).backgroundColor;
                            setEditingColorInput(nextColor);
                          }}
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {error || localError ? (
              <p className="text-xs text-red-500">{error ?? localError}</p>
            ) : null}
          </div>

          <div className="px-4 pb-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                placeholder="Create a new label"
                value={newLabelName}
                onChange={(event) => setNewLabelName(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {palette.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className="relative h-6 w-6 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center"
                  style={{ backgroundColor: swatch }}
                  onClick={() => {
                    setNewLabelColorInput(swatch);
                  }}
                  aria-label={`Use ${swatch}`}
                >
                  {newLabelColorInput.toLowerCase() === swatch.toLowerCase() ? (
                    <span className="material-icons text-[14px] text-white drop-shadow">
                      check
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={handleCreate}
              disabled={isSubmitting || newLabelName.trim().length === 0}
            >
              Create a new label
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
