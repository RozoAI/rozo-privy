import { AiServicesContent } from "@/components/ai-services/ai-services-content";
import { FabActions } from "@/components/fab-actions";
import { PageHeader } from "@/components/page-header";
import { Binoculars } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Services - Rozo AI",
  description: "Discover AI services",
};

export default function AiServicesPage() {
  return (
    <div className="w-full mb-14 flex flex-col gap-4 mt-4 relative">
      <PageHeader title="Discovery" icon={<Binoculars className="size-6" />} />
      <AiServicesContent />
      <FabActions className="bottom-20" />
    </div>
  );
}
