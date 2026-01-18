"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function CopilotContent() {
  const [usageInputs, setUsageInputs] = useState<Record<number, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Convex hooks
  const savedData = useQuery(api.copilot.getUsageData);
  const saveUsageData = useMutation(api.copilot.saveUsageData);
  
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const percentagePerDay = 100 / 30;

  // Load saved data on mount
  useEffect(() => {
    if (savedData && !isInitialized) {
      // Convert string keys back to number keys for local state
      const inputs: Record<number, string> = {};
      Object.entries(savedData.usageInputs).forEach(([key, value]) => {
        inputs[parseInt(key, 10)] = value;
      });
      setUsageInputs(inputs);
      setIsInitialized(true);
    } else if (savedData === null && !isInitialized) {
      // No saved data exists, mark as initialized
      setIsInitialized(true);
    }
  }, [savedData, isInitialized]);

  // Debounced save function
  const saveToConvex = useCallback(
    async (inputs: Record<number, string>) => {
      // Convert number keys to string keys for Convex
      const stringKeyInputs: Record<string, string> = {};
      Object.entries(inputs).forEach(([key, value]) => {
        stringKeyInputs[key.toString()] = value;
      });
      await saveUsageData({ usageInputs: stringKeyInputs });
    },
    [saveUsageData]
  );

  const handleUsageChange = (day: number, value: string) => {
    const newInputs = {
      ...usageInputs,
      [day]: value
    };
    setUsageInputs(newInputs);
    
    // Save to Convex (debounce could be added here for performance)
    saveToConvex(newInputs);
  };

  const getCumulativePercentage = (day: number): string => {
    return (percentagePerDay * day).toFixed(2);
  };

  const getDifference = (day: number): string | null => {
    const input = usageInputs[day];
    if (!input || input.trim() === '') return null;
    
    const actualUsage = parseFloat(input);
    if (isNaN(actualUsage)) return null;
    
    const cumulativeExpected = percentagePerDay * day;
    const difference = cumulativeExpected - actualUsage;
    return difference.toFixed(2);
  };

  const getDifferenceColor = (difference: string | null): string => {
    if (!difference) return "text-[#858585]";
    const diff = parseFloat(difference);
    if (diff > 0) return "text-[#4ec9b0]"; // Positive = under budget (good) - teal
    if (diff < 0) return "text-[#f48771]"; // Negative = over budget (bad) - red
    return "text-[#cccccc]"; // Zero = on target - white
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    const data = [{ day: 0, expected: 0, actual: 0 }];
    
    let cumulativeActual = 0;
    
    for (let i = 1; i <= 30; i++) {
      const input = usageInputs[i];
      const actualUsage = input && input.trim() !== '' ? parseFloat(input) : 0;
      
      if (!isNaN(actualUsage)) {
        cumulativeActual += actualUsage;
      }
      
      data.push({
        day: i,
        expected: parseFloat((percentagePerDay * i).toFixed(2)),
        actual: parseFloat(cumulativeActual.toFixed(2))
      });
    }
    
    return data;
  }, [usageInputs, percentagePerDay]);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="overflow-x-auto">
        <table className="border-collapse border border-[#2d2d2d]">
          <tbody>
            {/* Row 1: Day numbers */}
            <tr>
              <td className="border border-[#2d2d2d] bg-[#2d2d2d] px-3 py-2 text-xs font-semibold text-[#cccccc] whitespace-nowrap">
                day
              </td>
              {days.map((day) => (
                <td
                  key={`day-${day}`}
                  className="border border-[#2d2d2d] px-3 py-2 text-xs text-[#cccccc] text-center min-w-[60px]"
                >
                  {day}
                </td>
              ))}
            </tr>
            
            {/* Row 2: Cumulative percentages */}
            <tr>
              <td className="border border-[#2d2d2d] bg-[#2d2d2d] px-3 py-2 text-xs font-semibold text-[#cccccc] whitespace-nowrap">
                %
              </td>
              {days.map((day) => (
                <td
                  key={`percent-${day}`}
                  className="border border-[#2d2d2d] px-3 py-2 text-xs text-[#cccccc] text-center"
                >
                  {getCumulativePercentage(day)}%
                </td>
              ))}
            </tr>
            
            {/* Row 3: Manual input fields */}
            <tr>
              <td className="border border-[#2d2d2d] bg-[#2d2d2d] px-3 py-2 text-xs font-semibold text-[#cccccc] whitespace-nowrap">
                usage
              </td>
              {days.map((day) => (
                <td
                  key={`input-${day}`}
                  className="border border-[#2d2d2d] p-1"
                >
                  <input
                    type="text"
                    value={usageInputs[day] || ''}
                    onChange={(e) => handleUsageChange(day, e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#1e1e1e] border border-[#3d3d3d] px-2 py-1 text-xs text-[#cccccc] focus:outline-none focus:border-[#007acc] text-center"
                  />
                </td>
              ))}
            </tr>
            
            {/* Row 4: Difference calculation */}
            <tr>
              <td className="border border-[#2d2d2d] bg-[#2d2d2d] px-3 py-2 text-xs font-semibold text-[#cccccc] whitespace-nowrap">
                %
              </td>
              {days.map((day) => {
                const difference = getDifference(day);
                return (
                  <td
                    key={`auto-${day}`}
                    className={`border border-[#2d2d2d] px-3 py-2 text-xs text-center font-medium ${getDifferenceColor(difference)}`}
                  >
                    {difference ? `${difference}%` : ''}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Chart Section */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-[#cccccc] mb-4">Monthly Progress</h3>
        <div className="bg-[#1e1e1e] border border-[#2d2d2d] p-4 rounded">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
              <XAxis 
                dataKey="day" 
                stroke="#858585"
                tick={{ fill: '#858585', fontSize: 12 }}
                label={{ value: 'Day', position: 'insideBottom', offset: -5, fill: '#cccccc' }}
              />
              <YAxis 
                stroke="#858585"
                tick={{ fill: '#858585', fontSize: 12 }}
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: '#cccccc' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e1e1e', 
                  border: '1px solid #2d2d2d',
                  borderRadius: '4px',
                  color: '#cccccc'
                }}
                labelStyle={{ color: '#cccccc' }}
              />
              <Legend 
                wrapperStyle={{ color: '#cccccc', paddingTop: '20px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="expected" 
                stroke="#007acc" 
                strokeWidth={2}
                dot={false}
                name="Expected"
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#4ec9b0" 
                strokeWidth={2}
                dot={{ fill: '#4ec9b0', r: 3 }}
                name="Actual"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
