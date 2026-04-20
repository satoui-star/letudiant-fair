import { redirect } from 'next/navigation'

/**
 * Landing pages link to /exhibitor/login for "Espace Établissement". The real
 * login form lives at /login and already handles all roles via role-based
 * redirect in proxy.ts. We forward to /login with a hint so the UI can hint
 * at the exhibitor branding if desired, and pass ?role=exhibitor to pre-
 * select exhibitor flow on /register.
 */
export default function ExhibitorLoginRedirect() {
  redirect('/login?role=exhibitor')
}
