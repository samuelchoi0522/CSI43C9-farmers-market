"use client";

import { useEffect, useState } from "react";
import SidebarNavigation from "../components/SidebarNavigation";
import Button from "../components/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/figma/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/figma/card";
import { Input } from "../components/figma/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/figma/table";
import { getAllCategoryLabels, createCategoryLabel, deleteCategoryLabel, updateCategoryLabel, CategoryLabel } from "@/lib/api/vendorLabels";
import { getAllCustomColumns, getActiveCustomColumns, createCustomColumn, updateCustomColumn, deleteCustomColumn, deactivateCustomColumn, reactivateCustomColumn, CustomColumnMetadata } from "@/lib/api/customColumns";
import { getLabelColors, COLOR_PALETTE } from "@/lib/labelColors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/figma/select";
import { Label } from "../components/figma/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/figma/alert-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";

function LabelManagement() {
    const [labels, setLabels] = useState<CategoryLabel[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);
    const [editingLabel, setEditingLabel] = useState<CategoryLabel | null>(null);
    const [deletingLabel, setDeletingLabel] = useState<CategoryLabel | null>(null);

    const fetchLabels = async () => {
        setLoading(true);
        try {
            const data = await getAllCategoryLabels();
            setLabels(data);
        } catch (error) {
            console.error("Failed to fetch labels:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabels();
    }, []);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        try {
            await createCategoryLabel(newName, newColor);
            setNewName("");
            fetchLabels();
        } catch (error) {
            console.error("Failed to create label:", error);
        }
    };

    const handleDelete = async () => {
        if (!deletingLabel) return;
        try {
            await deleteCategoryLabel(deletingLabel.id);
            setDeletingLabel(null);
            fetchLabels();
        } catch (error) {
            console.error("Failed to delete label:", error);
        }
    };

    const handleUpdate = async () => {
        if (!editingLabel || !editingLabel.name.trim()) return;
        try {
            await updateCategoryLabel(editingLabel.id, editingLabel.name, editingLabel.color);
            setEditingLabel(null);
            fetchLabels();
        } catch (error) {
            console.error("Failed to update label:", error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Category Labels</CardTitle>
                <CardDescription>Manage global category labels for vendors.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="label-name">New Label Name</Label>
                            <Input
                                id="label-name"
                                placeholder="e.g. Organic, Local"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex gap-2">
                                {COLOR_PALETTE.map((color) => (
                                    <button
                                        key={color}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newColor === color ? "border-slate-900 scale-110" : "border-transparent"}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setNewColor(color)}
                                    />
                                ))}
                            </div>
                        </div>
                        <Button onClick={handleCreate} disabled={!newName.trim()}>
                            Add Label
                        </Button>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Preview</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Color Code</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">Loading labels...</TableCell>
                                </TableRow>
                            ) : labels.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">No labels found.</TableCell>
                                </TableRow>
                            ) : (
                                labels.map((label) => {
                                    const style = getLabelColors(label.name, label.color);
                                    const isEditing = !!editingLabel && editingLabel.id === label.id;

                                    return (
                                        <TableRow key={label.id}>
                                            <TableCell>
                                                <span
                                                    className="px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider"
                                                    style={{
                                                        backgroundColor: style.backgroundColor,
                                                        color: style.color,
                                                        borderColor: style.borderColor,
                                                    }}
                                                >
                                                    {isEditing ? editingLabel.name || "PREVIEW" : label.name}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <Input
                                                        value={editingLabel.name}
                                                        onChange={(e) => setEditingLabel({ ...editingLabel, name: e.target.value })}
                                                        className="h-8 max-w-[200px]"
                                                        placeholder="Label name"
                                                    />
                                                ) : (
                                                    <span className="font-medium">{label.name}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <div className="flex gap-1.5 flex-wrap max-w-[220px]">
                                                        {COLOR_PALETTE.map((color) => (
                                                            <button
                                                                key={color}
                                                                className={`w-5 h-5 rounded-full border transition-transform hover:scale-125 flex items-center justify-center ${editingLabel.color === color ? "border-slate-900 scale-125 z-10" : "border-transparent"}`}
                                                                style={{ backgroundColor: color }}
                                                                onClick={() => setEditingLabel({ ...editingLabel, color })}
                                                            >
                                                                {editingLabel.color === color && (
                                                                    <span className="material-icons text-[10px] text-white drop-shadow-sm">check</span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: style.backgroundColor }} />
                                                        <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase font-mono">{label.color || style.backgroundColor}</code>
                                                        {!label.color && <span className="text-[10px] text-slate-400 italic">(Auto)</span>}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isEditing ? (
                                                    <div className="flex justify-end gap-2 items-center">
                                                        {editingLabel.color && (
                                                            <Button 
                                                                variant="danger" 
                                                                size="sm" 
                                                                className="h-8 px-3 text-xs bg-red-700 hover:!bg-red-800 border-none shadow-sm" 
                                                                onClick={() => setDeletingLabel(label)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        )}
                                                        <div className="w-px h-4 bg-slate-200 mx-1" />
                                                        <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setEditingLabel(null)}>Cancel</Button>
                                                        <Button size="sm" className="h-8 px-3" onClick={handleUpdate}>Save</Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-8 w-8 p-0" 
                                                            onClick={() => setEditingLabel({
                                                                ...label,
                                                                color: label.color || getLabelColors(label.name).backgroundColor
                                                            })}
                                                        >
                                                            <span className="material-icons text-sm">edit</span>
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <AlertDialog open={!!deletingLabel} onOpenChange={(open) => !open && setDeletingLabel(null)}>
                <AlertDialogContent className="bg-white border-slate-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900">Delete Label?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500">
                            Are you sure you want to delete the label <strong>{deletingLabel?.name}</strong>? This action cannot be undone and will remove the label from all vendors.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-200 text-slate-700">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-red-700 hover:bg-red-800 text-white border-none"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

function CustomColumnManagement() {
    const [columns, setColumns] = useState<CustomColumnMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<"text" | "number" | "boolean" | "usd">("text");
    const [newIsRequired, setNewIsRequired] = useState(false);
    const [editingColumn, setEditingColumn] = useState<CustomColumnMetadata | null>(null);
    const [deletingColumn, setDeletingColumn] = useState<CustomColumnMetadata | null>(null);

    const fetchColumns = async () => {
        setLoading(true);
        try {
            const [all, active] = await Promise.all([
                getAllCustomColumns(),
                getActiveCustomColumns()
            ]);
            
            const activeIds = new Set(active.map(c => c.id));
            const columnsWithStatus = all.map(c => ({
                ...c,
                isActive: activeIds.has(c.id)
            }));
            
            setColumns(columnsWithStatus);
        } catch (error) {
            console.error("Failed to fetch custom columns:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchColumns();
    }, []);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        try {
            await createCustomColumn({
                name: newName,
                type: newType,
                isRequired: newIsRequired,
            });
            setNewName("");
            setNewIsRequired(false);
            fetchColumns();
        } catch (error) {
            console.error("Failed to create custom column:", error);
        }
    };

    const handleDelete = async () => {
        if (!deletingColumn || !deletingColumn.id) return;
        try {
            await deleteCustomColumn(deletingColumn.id);
            setDeletingColumn(null);
            fetchColumns();
        } catch (error) {
            console.error("Failed to delete custom column:", error);
        }
    };

    const handleToggleActive = async (column: CustomColumnMetadata) => {
        if (!column.id) return;
        try {
            if (column.isActive) {
                await deactivateCustomColumn(column.id);
            } else {
                await reactivateCustomColumn(column.id);
            }
            setEditingColumn(null);
            fetchColumns();
        } catch (error) {
            console.error("Failed to toggle column status:", error);
        }
    };

    const handleUpdate = async () => {
        if (!editingColumn || !editingColumn.id || !editingColumn.name.trim()) return;
        try {
            await updateCustomColumn(editingColumn.id, editingColumn);
            setEditingColumn(null);
            fetchColumns();
        } catch (error) {
            console.error("Failed to update custom column:", error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Custom Columns</CardTitle>
                <CardDescription>Add extra data fields to all vendor transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="col-name">Column Name</Label>
                            <Input
                                id="col-name"
                                placeholder="e.g. Health Permit #"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="w-40 space-y-2">
                            <Label>Type</Label>
                            <Select value={newType} onValueChange={(v: "text" | "number" | "boolean" | "usd") => setNewType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="boolean">Boolean</SelectItem>
                                    <SelectItem value="usd">USD (Currency)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-32 space-y-2">
                            <Label>Required</Label>
                            <Select 
                                value={newIsRequired ? "yes" : "no"} 
                                onValueChange={(v) => setNewIsRequired(v === "yes")}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleCreate} disabled={!newName.trim()}>
                            Add Column
                        </Button>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Required</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">Loading columns...</TableCell>
                                </TableRow>
                            ) : columns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">No custom columns found.</TableCell>
                                </TableRow>
                            ) : (
                                columns.map((col) => {
                                    const isEditing = !!editingColumn && editingColumn.id === col.id;
                                    return (
                                        <TableRow key={col.id} className={!col.isActive ? "opacity-60 bg-slate-50/50" : ""}>
                                            <TableCell>
                                                {col.isActive ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">Active</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 text-slate-600 border border-slate-300">Inactive</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <Input
                                                        value={editingColumn.name}
                                                        onChange={(e) => setEditingColumn({ ...editingColumn, name: e.target.value })}
                                                        className="h-8"
                                                    />
                                                ) : (
                                                    <span className="font-medium">{col.name}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="capitalize text-xs bg-slate-100 px-2 py-0.5 rounded-full">{col.type}</span>
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <Select 
                                                        value={editingColumn.isRequired ? "yes" : "no"} 
                                                        onValueChange={(v) => setEditingColumn({ ...editingColumn, isRequired: v === "yes" })}
                                                    >
                                                        <SelectTrigger size="sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white">
                                                            <SelectItem value="yes">Yes</SelectItem>
                                                            <SelectItem value="no">No</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <span className="text-sm">{col.isRequired ? "Yes" : "No"}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isEditing ? (
                                                    <div className="flex justify-end gap-2 items-center">
                                                        {editingColumn.isActive ? (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="text-amber-600 border-amber-200 hover:border-amber-400 h-8 px-3 text-xs"
                                                                onClick={() => handleToggleActive(editingColumn)}
                                                            >
                                                                Deactivate
                                                            </Button>
                                                        ) : (
                                                            <div className="flex gap-2 items-center">
                                                                <Button 
                                                                    variant="danger" 
                                                                    size="sm" 
                                                                    className="h-8 px-3 text-xs bg-red-700 hover:!bg-red-800 border-none shadow-sm"
                                                                    onClick={() => setDeletingColumn(editingColumn)}
                                                                >
                                                                    Delete
                                                                </Button>
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    className="text-[#10b981] border-[#10b981]/30 hover:border-[#10b981] h-8 px-3 text-xs"
                                                                    onClick={() => handleToggleActive(editingColumn)}
                                                                >
                                                                    Reactivate
                                                                </Button>
                                                            </div>
                                                        )}
                                                        <div className="w-px h-4 bg-slate-200 mx-1" />
                                                        <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setEditingColumn(null)}>Cancel</Button>
                                                        <Button size="sm" className="h-8 px-3" onClick={handleUpdate}>Save</Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingColumn(col)}>
                                                            <span className="material-icons text-sm">edit</span>
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <AlertDialog open={!!deletingColumn} onOpenChange={(open) => !open && setDeletingColumn(null)}>
                <AlertDialogContent className="bg-white border-slate-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900">Delete Custom Column?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500">
                            Are you sure you want to <strong>PERMANENTLY</strong> delete the column <strong>{deletingColumn?.name}</strong>? This will remove this data field and all its values from all transactions. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-200 text-slate-700">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-red-700 hover:bg-red-800 text-white border-none"
                        >
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

function AdminContent() {

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen flex transition-colors duration-300">
            <SidebarNavigation activeItem="Admin" />

            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 animate-slide-up">
                    <div>
                        <h2 className="text-2xl font-bold animate-fade-in">Administration</h2>
                        <p className="text-slate-700 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            Configure global settings and fields.
                        </p>
                    </div>
                </header>

                <Tabs defaultValue="labels" className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="labels">Category Labels</TabsTrigger>
                        <TabsTrigger value="columns">Custom Columns</TabsTrigger>
                    </TabsList>
                    <TabsContent value="labels" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <LabelManagement />
                    </TabsContent>
                    <TabsContent value="columns" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <CustomColumnManagement />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

export default function AdminPage() {
    return (
        <AdminContent />
    );
}
