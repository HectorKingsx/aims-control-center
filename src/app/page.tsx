import SystemStatusGrid from "@/components/command/SystemStatusGrid";
import FounderAttention from "@/components/command/FounderAttention";
import DailyKpi from "@/components/command/DailyKpi";
import ApprovalQueuePreview from "@/components/command/ApprovalQueuePreview";
import PipelineSummary from "@/components/command/PipelineSummary";
import PublishingSchedule from "@/components/command/PublishingSchedule";
import CostSummary from "@/components/command/CostSummary";

export default function CommandCenterPage() {
  return (
    <div className="space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold">Command Center</h1>
        <p className="text-sm text-base-muted mt-0.5">
          The Daily Economics — status operasional AIMS hari ini.
        </p>
      </div>
      <FounderAttention />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <DailyKpi />
        <ApprovalQueuePreview />
      </div>
      <PipelineSummary />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <PublishingSchedule />
        <CostSummary />
      </div>
      <SystemStatusGrid />
    </div>
  );
}
