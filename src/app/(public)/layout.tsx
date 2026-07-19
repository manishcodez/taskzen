import { Suspense } from "react";

import { PreparePublicBackNavigation } from "@/components/auth/prepare-public-back-navigation";
import { PublicSiteHeader } from "@/components/layout/public-site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-atelier">
      <Suspense fallback={null}>
        <PreparePublicBackNavigation />
      </Suspense>
      <PublicSiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
