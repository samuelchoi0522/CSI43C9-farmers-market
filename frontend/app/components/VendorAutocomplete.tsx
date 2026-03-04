import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import { Popover, PopoverContent, PopoverTrigger } from '../components/figma/popover';
import { cn } from '../../lib/utils';

interface Vendor {
  id: string;
  name: string;
}

interface VendorAutocompleteProps {
  vendors: Vendor[];
  onSelect: (vendor: Vendor) => void;
  placeholder?: string;
}

export function VendorAutocomplete({ vendors, onSelect, placeholder = "Search vendor..." }: VendorAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            role="combobox"
            aria-expanded={open}
            className="flex h-12 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:border-gray-300"
          >
            <span className={cn("truncate", value ? "text-gray-900" : "text-gray-500")}>
              {value
                ? vendors.find((vendor) => vendor.name === value)?.name
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-500 opacity-70" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-gray-200 text-gray-900" align="start">
          <Command className="w-full bg-white text-gray-900">
            <CommandInput 
              placeholder="Start typing name..." 
              className="flex h-11 w-full rounded-t-md bg-white py-3 px-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none border-b border-gray-200"
            />
            <CommandList className="max-h-[250px] overflow-y-auto p-1 bg-white">
              <CommandEmpty className="py-6 text-center text-sm text-gray-500">No results found.</CommandEmpty>
              <CommandGroup className="text-gray-900">
                {vendors.map((vendor) => (
                  <CommandItem
                    key={vendor.id}
                    value={vendor.name}
                    onSelect={(currentValue) => {
                      // cmdk provides the value in lowercase or normalized form
                      // We find the original vendor object by name (case-insensitive)
                      const found = vendors.find(v => v.name.toLowerCase() === currentValue.toLowerCase());
                      if (found) {
                        setValue(found.name);
                        onSelect(found);
                        setOpen(false);
                      }
                    }}
                    className="flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm text-gray-900 outline-none hover:bg-blue-50 aria-selected:bg-blue-50 aria-selected:text-blue-900"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-blue-600",
                        value === vendor.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {vendor.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
