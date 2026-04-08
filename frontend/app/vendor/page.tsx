import VendorClient from "./VendorClient";
import { Suspense } from "react";

// The server runs this during the GitHub Actions build
export function generateStaticParams() {
  return [{ uuid: 'template' }];
}

// The server passes the generated param to your client component
export default function VendorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading vendor...</div>}>
      <VendorClient />
    </Suspense>
  );
}
