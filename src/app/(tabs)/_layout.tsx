// The native tab bar itself lives in src/components/AppTabs.tsx (and
// AppTabs.web.tsx for web), per AGENTS.md section 1.2.
//
// Why the extra (tabs) group, which AGENTS.md's suggested route map doesn't show:
// onboarding must sit OUTSIDE the tab navigator. NativeTabs treats any route
// without a Trigger as unreachable, so onboarding can't be a sibling of (home)
// and together. Wrapping the tabs in one group gives the root layout a single
// route to guard, which is what makes the hasCompletedOnboarding gate work.
export { default } from '@/components/AppTabs';
