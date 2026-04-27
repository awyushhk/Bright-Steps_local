"use client";

import { useState, useMemo } from "react";
import { Trophy, TrendingUp, TrendingDown, Minus, Filter, Activity, Star, ShieldAlert } from "lucide-react";

export default function StateCasesContent({ initialPerformance, initialData }) {
  const [filterState, setFilterState] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [sortBy, setSortBy] = useState("improvement"); // improvement or name

  const filteredData = useMemo(() => {
    let filtered = initialData.filter(item => {
      const matchState = filterState ? item.state === filterState : true;
      const matchRisk = filterRisk ? item.latestRisk === filterRisk : true;
      return matchState && matchRisk;
    });

    if (sortBy === "improvement") {
      filtered.sort((a, b) => {
        const aScore = a.progression.reduce((sum, p) => sum + p.improvementScore, 0);
        const bScore = b.progression.reduce((sum, p) => sum + p.improvementScore, 0);
        return bScore - aScore;
      });
    } else {
      filtered.sort((a, b) => a.childName.localeCompare(b.childName));
    }

    return filtered;
  }, [initialData, filterState, filterRisk, sortBy]);

  const renderRankBadge = (index) => {
    if (index === 0) return <Trophy className="h-10 w-10 text-yellow-400" />;
    if (index === 1) return <Trophy className="h-8 w-8 text-gray-400" />;
    if (index === 2) return <Trophy className="h-6 w-6 text-amber-700" />;
    return <span className="text-xl font-bold text-gray-500">#{index + 1}</span>;
  };

  const renderTrendIcon = (score) => {
    if (score > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (score < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getRiskColor = (risk) => {
    if (risk === 'High') return 'text-red-600 bg-red-50 border-red-100';
    if (risk === 'Medium') return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-green-600 bg-green-50 border-green-100';
  };

  return (
    <div className="space-y-8">
      {/* Leaderboard Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-600" />
          State Performance Leaderboard
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {initialPerformance.map((state, index) => (
            <div 
              key={state.state} 
              className={`relative rounded-2xl p-6 shadow-sm border ${
                index === 0 
                  ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-blue-400 shadow-xl scale-105 z-10' 
                  : 'bg-white text-gray-800 border-gray-100'
              }`}
            >
              {index === 0 && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                  Top Ranked
                </div>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {renderRankBadge(index)}
                  <h3 className={`text-xl font-bold ${index === 0 ? 'text-white' : 'text-gray-900'}`}>
                    {state.state}
                  </h3>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-black ${index === 0 ? 'text-white' : 'text-blue-600'}`}>
                    {state.totalScore}
                  </div>
                  <div className={`text-xs uppercase tracking-wider ${index === 0 ? 'text-blue-200' : 'text-gray-500'}`}>
                    Total Score
                  </div>
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-4 mt-6 pt-6 border-t ${index === 0 ? 'border-white/20' : 'border-gray-100'}`}>
                <div>
                  <div className={`text-xs uppercase ${index === 0 ? 'text-blue-200' : 'text-gray-500'}`}>Early Action</div>
                  <div className="font-semibold">{state.earlyActionScore} pts</div>
                </div>
                <div>
                  <div className={`text-xs uppercase ${index === 0 ? 'text-blue-200' : 'text-gray-500'}`}>Improvement</div>
                  <div className="font-semibold">{state.improvementScore} pts</div>
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <div className={`text-xs uppercase flex items-center gap-1 ${index === 0 ? 'text-blue-200' : 'text-gray-500'}`}>
                    <Star className="w-3 h-3" /> Service Quality
                  </div>
                  <div className="font-semibold">{state.serviceQualityScore} pts</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Progression Table */}
      <div className="space-y-4 pt-8 border-t border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-600" />
            Monthly Child Progression
          </h2>

          <div className="flex flex-wrap gap-3 items-center bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
            <Filter className="h-4 w-4 text-gray-400 ml-2" />
            <select 
              className="border-none bg-transparent text-sm focus:ring-0 cursor-pointer text-gray-700 font-medium"
              value={filterState}
              onChange={e => setFilterState(e.target.value)}
            >
              <option value="">All States</option>
              <option value="Kerala">Kerala</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
            <div className="w-px h-5 bg-gray-200" />
            <select 
              className="border-none bg-transparent text-sm focus:ring-0 cursor-pointer text-gray-700 font-medium"
              value={filterRisk}
              onChange={e => setFilterRisk(e.target.value)}
            >
              <option value="">All Latest Risks</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <div className="w-px h-5 bg-gray-200" />
            <select 
              className="border-none bg-transparent text-sm focus:ring-0 cursor-pointer text-gray-700 font-medium"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="improvement">Sort: Improvement</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-4 font-semibold whitespace-nowrap">Child Info</th>
                  <th className="px-4 py-4 font-semibold text-center border-l border-gray-200 bg-gray-100/50">February</th>
                  <th className="px-4 py-4 font-semibold text-center border-l border-gray-200 bg-gray-100/50">March</th>
                  <th className="px-4 py-4 font-semibold text-center border-l border-gray-200 bg-gray-100/50">April</th>
                  <th className="px-4 py-4 font-semibold text-right border-l border-gray-200">Total Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No progression records match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((caseItem) => {
                    const totalImprovement = caseItem.progression.reduce((sum, p) => sum + p.improvementScore, 0);
                    
                    return (
                      <tr key={caseItem.childId} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-bold text-gray-900">{caseItem.childName}</div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <span>{caseItem.state}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className={`font-medium ${caseItem.actioned === 'Yes' ? 'text-blue-600' : 'text-gray-400'}`}>
                              Actioned: {caseItem.actioned}
                            </span>
                          </div>
                        </td>
                        
                        {/* Month Columns */}
                        {["February", "March", "April"].map(month => {
                          const p = caseItem.progression.find(prog => prog.month === month);
                          return (
                            <td key={month} className="px-4 py-3 border-l border-gray-100 text-center align-top">
                              {p ? (
                                <div className="flex flex-col items-center gap-1.5">
                                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getRiskColor(p.riskAssessment)}`}>
                                    {p.riskAssessment}
                                  </span>
                                  {p.result ? (
                                    <span className="text-xs font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]" title={p.result}>
                                      {p.result}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">No Action</span>
                                  )}
                                  <div className="flex items-center gap-1 mt-1 text-xs font-semibold" title="Monthly Improvement Score">
                                    {renderTrendIcon(p.improvementScore)}
                                    <span className={p.improvementScore > 0 ? "text-green-600" : p.improvementScore < 0 ? "text-red-600" : "text-gray-400"}>
                                      {p.improvementScore > 0 ? `+${p.improvementScore}` : p.improvementScore}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}

                        <td className="px-4 py-4 border-l border-gray-100 text-right align-middle">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm ${
                            totalImprovement > 0 ? 'bg-green-100 text-green-700' :
                            totalImprovement < 0 ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {totalImprovement > 0 ? '+' : ''}{totalImprovement}
                            {renderTrendIcon(totalImprovement)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
