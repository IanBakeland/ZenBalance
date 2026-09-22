import { Stack } from 'expo-router';

// Lives outside (tabs) on purpose: NativeTabs only renders for routes nested
// under its own layout, so a sibling Stack here is what makes the focus
// session a true full-screen mode with no tab bar underneath it.
export default Stack;
