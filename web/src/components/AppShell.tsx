import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `navbar__link${isActive ? ' navbar__link--active' : ''}`

/**
 * Route-specific layout: the landing page keeps the wide marketing
 * container, the camera becomes a full-bleed stage with the navbar
 * floating over the feed, and the app screens (upload/results) get a
 * wider report container than the old reading column.
 */
function mainClassFor(pathname: string): string {
  if (pathname === '/') return 'container page container--wide'
  if (pathname === '/camera') return 'page-stage'
  return 'container page container--app'
}

export function AppShell() {
  const { pathname } = useLocation()
  const isCamera = pathname === '/camera'
  return (
    <>
      <header className={`navbar${isCamera ? ' navbar--overlay' : ''}`}>
        <div className="navbar__inner">
          <NavLink to="/" className="navbar__brand">
            KinematicIQ
          </NavLink>
          <nav className="navbar__links" aria-label="Main navigation">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/camera" className={navLinkClass}>
              Camera
            </NavLink>
            <NavLink to="/upload" className={navLinkClass}>
              Upload
            </NavLink>
            <NavLink to="/results" className={navLinkClass}>
              Results
            </NavLink>
            <NavLink to="/history" className={navLinkClass}>
              History
            </NavLink>
          </nav>
        </div>
      </header>
      <main className={mainClassFor(pathname)}>
        <Outlet />
      </main>
    </>
  )
}
