import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `navbar__link${isActive ? ' navbar__link--active' : ''}`

export function AppShell() {
  const isLanding = useLocation().pathname === '/'
  return (
    <>
      <header className="navbar">
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
          </nav>
        </div>
      </header>
      <main className={`container page${isLanding ? ' container--wide' : ''}`}>
        <Outlet />
      </main>
    </>
  )
}
