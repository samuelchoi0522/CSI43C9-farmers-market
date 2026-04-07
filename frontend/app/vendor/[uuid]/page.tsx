import VendorClient from "./VendorClient";

// The server runs this during the GitHub Actions build
export function generateStaticParams() {
  return [{ uuid: 'template' }];
}

// The server passes the generated param to your client component
export default function VendorPage() {
  return <VendorClient/>;
}
