import App from "@/App";

/**
 * /home — current dashboard (tasks · calendar · inbox · deploys + quick actions).
 * Re-exports the existing top-level App component unchanged so all live data
 * fetching and Supabase real-time subscriptions keep working.
 *
 * NOTE: the App component still renders its own header/footer/sync strip,
 * which now visually duplicates the new Layout chrome. Cleanup pass to strip
 * those out is queued for the HOME panel rebuild in Task #15.
 */
export default function HomePage() {
  return <App />;
}
