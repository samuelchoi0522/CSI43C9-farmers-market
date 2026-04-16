import { getAllVendorDefaults, type VendorDefaults } from "@/lib/api/defaults";
import { getVendors, type Vendor } from "@/lib/api/vendor";

/** Loads every vendor page from the API (active-only unless `includeInactive`). */
export async function fetchAllVendorsFromApi(includeInactive: boolean): Promise<Vendor[]> {
  const size = 500;
  let page = 0;
  const all: Vendor[] = [];
  let totalPages = 1;
  do {
    const res = await getVendors(page, size, includeInactive);
    const chunk = Array.isArray(res) ? res : (res.data ?? []);
    totalPages = Array.isArray(res) ? 1 : (res.totalPages ?? 1);
    all.push(...chunk);
    page += 1;
  } while (page < totalPages);
  return all;
}

export async function fetchAllDefaultsFromApi(): Promise<VendorDefaults[]> {
  const size = 500;
  let page = 0;
  const all: VendorDefaults[] = [];
  let totalPages = 1;
  do {
    const res = await getAllVendorDefaults(page, size);
    const chunk = res.data ?? [];
    all.push(...chunk);
    totalPages = res.totalPages ?? 1;
    page += 1;
  } while (page < totalPages);
  return all;
}
