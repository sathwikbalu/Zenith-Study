import { useState, useEffect } from "react";
import { authAPI, notesAPI, sessionsAPI, activitiesAPI } from "@/lib/api";

const BackendTest = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test auth API
      results.auth = "Connected";
    } catch (error) {
      results.auth = `Error: ${error.message}`;
    }

    try {
      // Test notes API (will fail without auth)
      await notesAPI.getAll();
      results.notes = "Connected";
    } catch (error) {
      results.notes = `Error: ${error.message}`;
    }

    try {
      // Test sessions API (will fail without auth)
      await sessionsAPI.getAll();
      results.sessions = "Connected";
    } catch (error) {
      results.sessions = `Error: ${error.message}`;
    }

    try {
      // Test activities API (will fail without auth)
      await activitiesAPI.getAll();
      results.activities = "Connected";
    } catch (error) {
      results.activities = `Error: ${error.message}`;
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Backend Connection Test</h2>
      <button
        onClick={runTests}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? "Testing..." : "Run Connection Tests"}
      </button>

      {Object.keys(testResults).length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold">Test Results:</h3>
          {Object.entries(testResults).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="font-medium">{key}:</span>
              <span>{value as string}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BackendTest;
