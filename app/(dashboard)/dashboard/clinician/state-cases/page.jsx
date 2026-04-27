import { getStatePerformance, getCaseProgression } from "@/lib/queries";
import StateCasesContent from "./StateCasesContent";

export const metadata = {
  title: "State Cases - Clinician Dashboard",
  description: "View and filter autism screening cases by state.",
};

export const dynamic = "force-dynamic";

export default async function StateCasesPage() {
  const performance = await getStatePerformance();
  const cases = await getCaseProgression();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">State Performance & Case Progression</h1>
        <p className="text-gray-600">
          Monitor state-wise early action scores, track monthly improvements, and evaluate service quality.
        </p>
      </div>

      <StateCasesContent initialPerformance={performance} initialData={cases} />
    </div>
  );
}
