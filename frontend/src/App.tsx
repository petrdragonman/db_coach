import { Link, Route, Routes } from "react-router-dom";
import SeatingPlanPage from "./pages/SeatingPlanPage";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-base font-semibold text-slate-900">
            DB Coach
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              to="/seating"
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Seating plan
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4">
        <Routes>
          <Route
            path="/"
            element={
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h1 className="text-xl font-semibold text-slate-900">
                  Welcome
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  We’re building the seating plan prototype first.
                </p>

                <div className="mt-4">
                  <Link
                    to="/seating"
                    className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Open seating planner
                  </Link>
                </div>
              </div>
            }
          />
          <Route path="/seating" element={<SeatingPlanPage />} />
        </Routes>
      </main>
    </div>
  );
}
