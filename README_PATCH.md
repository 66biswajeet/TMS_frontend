# Frontend Axios + Redux + Role Redirect Patch

## Install
- `pnpm add axios redux react-redux redux-thunk`
- `.env.local`: `NEXT_PUBLIC_API_BASE_URL=http://localhost:5050`
- Wrap `app/layout.tsx` body with `<Providers>{children}</Providers>`

## Role Redirect
- `lib/redirectByRole.ts` maps role/rank to route.
- `app/login/page.tsx` uses it after successful login.

## Redux Modules
- Located under `redux/modules/*` (auth, tasks, users, roles, branches, templates, metrics, attendance).

## Axios
- `lib/axios.ts` adds Bearer token automatically and redirects to `/login` on 401.
