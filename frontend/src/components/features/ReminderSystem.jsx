import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';

const ReminderSystem = () => {
  const reminders = [
    { id: 1, title: "Google Research Fellowship", organization: "Google Inc.", days_until_deadline: 5 },
    { id: 2, title: "Scholarship Program", organization: "University Grants", days_until_deadline: 12 },
    { id: 3, title: "Startup Accelerator", organization: "TechHub", days_until_deadline: 20 }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="text-blue-600" />
          <h1 className="text-2xl font-bold">Smart Reminders</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <h2 className="text-lg font-semibold mb-3 text-blue-800">Upcoming Deadlines</h2>
            <div className="space-y-3">
              {reminders.map(reminder => (
                <div key={reminder.id} className="p-4 rounded-lg border-l-4 border-blue-200 pl-4 py-2 bg-white hover:border-blue-300 transition-colors">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{reminder.title}</h3>
                        <p className="text-sm text-gray-600">{reminder.organization}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 rounded text-sm font-medium bg-red-500 text-white">
                          {reminder.days_until_deadline} days left
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-red-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, (30 - reminder.days_until_deadline) / 30 * 100))}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderSystem;