## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-07-05 - TanStack Query v5 refetchInterval Callback
**Learning:** In @tanstack/react-query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`.
**Action:** Always access the data via `query.state.data` in the `refetchInterval` callback to prevent errors and infinite network polling.
## 2024-07-16 - Static Animation Hydration Pitfall
**Learning:** When removing JS-driven hydration of CSS animations (e.g., removing `isVisible ? 'animate-fade' : ''`) to improve FCP, you must also explicitly remove any associated base CSS rules that manage initial hidden state (like `opacity: 0`). Leaving the initial hidden state in the CSS while applying the animation class directly in JSX causes the element to remain permanently invisible or behave unexpectedly if the animation is disabled. Next.js can server-render static classes, so applying them directly is preferred, but the base CSS must match.
**Action:** When converting lazy JS-hydrated animations to static CSS classes, search for and remove any `opacity: 0` or similar hidden-state utility classes in the element's CSS rules.
## 2026-07-16 - GitHub Actions Permissions
**Learning:** When a GitHub Actions workflow using `actions/github-script` or `GITHUB_TOKEN` fails with 'HttpError: Resource not accessible by integration' while attempting to comment on a pull request or issue, the token lacks necessary write access.
**Action:** Resolve this by adding a `permissions` block to the specific job, granting `pull-requests: write` and `issues: write` (along with `contents: read` if checking out code).
