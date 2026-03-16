"use client";

import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Button from "./Button";
import {
  CategoryLabel,
  createCategoryLabel,
  deleteCategoryLabel,
  getAllCategoryLabels,
  updateCategoryLabel,
} from "@/lib/api/vendorLabels";

interface ManageLabelsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManageLabelsDialog({
  isOpen,
  onOpenChange,
}: ManageLabelsDialogProps) {
  const [labels, setLabels] = useState<CategoryLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLabelName, setNewLabelName] = useState("");
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [saving, setSaving] = useState(false);

  const existingNames = useMemo(
    () => new Set(labels.map((label) => label.name.trim().toLowerCase())),
    [labels],
  );

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setNewLabelName("");
      setEditingLabelId(null);
      setEditingName("");
      return;
    }

    const loadLabels = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetched = await getAllCategoryLabels();
        setLabels(fetched);
      } catch (err) {
        console.error("Failed to load labels:", err);
        setError("Failed to load labels.");
      } finally {
        setLoading(false);
      }
    };

    loadLabels();
  }, [isOpen]);

  const handleCreate = async () => {
    const trimmed = newLabelName.trim();
    if (!trimmed || saving) return;
    if (existingNames.has(trimmed.toLowerCase())) {
      setError("That label already exists.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const created = await createCategoryLabel(trimmed);
      setLabels((prev) => [...prev, created]);
      setNewLabelName("");
    } catch (err) {
      console.error("Failed to create label:", err);
      setError("Failed to create label.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (label: CategoryLabel) => {
    setEditingLabelId(label.id);
    setEditingName(label.name);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingLabelId(null);
    setEditingName("");
  };

  const handleUpdate = async () => {
    if (editingLabelId === null || saving) return;
    const trimmed = editingName.trim();
    if (!trimmed) return;

    const currentLabel = labels.find((label) => label.id === editingLabelId);
    const isSameName =
      currentLabel?.name.trim().toLowerCase() === trimmed.toLowerCase();
    if (!isSameName && existingNames.has(trimmed.toLowerCase())) {
      setError("That label already exists.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await updateCategoryLabel(editingLabelId, trimmed);
      setLabels((prev) =>
        prev.map((label) => (label.id === updated.id ? updated : label)),
      );
      cancelEdit();
    } catch (err) {
      console.error("Failed to update label:", err);
      setError("Failed to update label.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (labelId: number) => {
    if (saving) return;
    const label = labels.find((item) => item.id === labelId);
    const confirmed = window.confirm(
      `Delete label "${label?.name ?? "label"}"? This will remove it from vendors.`,
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      setError(null);
      await deleteCategoryLabel(labelId);
      setLabels((prev) => prev.filter((item) => item.id !== labelId));
      if (editingLabelId === labelId) {
        cancelEdit();
      }
    } catch (err) {
      console.error("Failed to delete label:", err);
      setError("Failed to delete label.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-lg duration-200 text-slate-900 dark:text-slate-100 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl">
          <div className="flex items-start justify-between gap-6">
            <div>
              <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
                Manage Labels
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Add, edit, or remove global category labels used across vendors.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="rounded-sm opacity-70 text-slate-600 dark:text-slate-300 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 dark:focus:ring-slate-100">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Add new label
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981]"
                placeholder="e.g. Organic, Baked Goods"
                value={newLabelName}
                onChange={(event) => setNewLabelName(event.target.value)}
              />
              <Button
                variant="primary"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleCreate}
                disabled={saving || newLabelName.trim().length === 0}
              >
                Add Label
              </Button>
            </div>
            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Existing labels
            </h4>
            {loading ? (
              <p className="text-sm text-slate-500">Loading labels...</p>
            ) : labels.length === 0 ? (
              <p className="text-sm text-slate-500">No labels found.</p>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className="flex flex-col gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {editingLabelId === label.id ? (
                      <input
                        className="flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981]"
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                      />
                    ) : (
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {label.name}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {editingLabelId === label.id ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleUpdate}
                            disabled={saving || editingName.trim().length === 0}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEdit}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(label)}
                            disabled={saving}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(label.id)}
                            disabled={saving}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
