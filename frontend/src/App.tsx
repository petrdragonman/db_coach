export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">DB Coach</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tailwind is working. Next: seating plan prototype.
        </p>

        <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
          Status: <span className="font-medium text-emerald-700">Ready</span>
        </div>

        <button className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Create session
        </button>
      </div>
    </div>
  );
}
