
import { DeadlineTimeline } from "@/components/DeadlineTimeline";

const AllDeadlines = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">All Deadlines</h1>
          <p className="text-slate-600">Complete timeline of contract obligations and deadlines</p>
        </div>
        <DeadlineTimeline expanded={true} />
      </div>
    </div>
  );
};

export default AllDeadlines;
