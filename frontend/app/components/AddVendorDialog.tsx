import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, Plus } from 'lucide-react';
import { VendorAutocomplete } from './VendorAutocomplete';
import { cn } from '../../lib/utils';

interface Vendor {
  id: string;
  name: string;
}

interface AddVendorDialogProps {
  vendors: Vendor[];
  onAdd: (vendor: Vendor) => void;
}

export function AddVendorDialog({ vendors, onAdd }: AddVendorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const handleAdd = () => {
    if (selectedVendor) {
      onAdd(selectedVendor);
      setSelectedVendor(null);
      setIsOpen(false);
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <DialogPrimitive.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-all shadow-sm">
          <Plus size={16} />
          Add Vendor
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200 text-gray-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight text-gray-900">
              Add Vendor to Tracker
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-gray-600">
              Search for a vendor name to start entering their sales data.
            </DialogPrimitive.Description>
          </div>
          
          <div className="py-4">
            <VendorAutocomplete 
              vendors={vendors} 
              onSelect={setSelectedVendor} 
              placeholder="Search by vendor name..."
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <DialogPrimitive.Close asChild>
              <button className="mt-2 inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 ring-offset-white transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:mt-0">
                Cancel
              </button>
            </DialogPrimitive.Close>
            <button
              onClick={handleAdd}
              disabled={!selectedVendor}
              className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white ring-offset-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Add Row
            </button>
          </div>
          
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 text-gray-600 ring-offset-white transition-opacity hover:opacity-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-600">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
