import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <NavLink to="/" style={styles.logo}>
          <span style={styles.logoStone}>&#x268A;</span>
          GoNow
        </NavLink>
        <div style={styles.links}>
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.activeLink : {}),
            })}
          >
            Search
          </NavLink>
          <NavLink
            to="/favorites"
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.activeLink : {}),
            })}
          >
            Favorites
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    background: 'var(--slate)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  inner: {
    maxWidth: 920,
    margin: '0 auto',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
  },
  logo: {
    fontSize: 20,
    fontWeight: 800,
    color: 'var(--wood)',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    letterSpacing: '-0.5px',
  },
  logoStone: {
    fontSize: 22,
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at 35% 35%, #555, #1a1a1a)',
    borderRadius: '50%',
    color: '#fff',
    boxShadow: '1px 2px 4px rgba(0,0,0,0.4)',
  },
  links: {
    display: 'flex',
    gap: 4,
  },
  link: {
    padding: '7px 16px',
    borderRadius: 8,
    textDecoration: 'none',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  activeLink: {
    background: 'rgba(220,179,92,0.15)',
    color: 'var(--wood)',
  },
};
