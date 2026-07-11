import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { useState } from 'react';
import FavoritesVisualizer from '../components/FavoritesVisualizer';

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();
  const navigate = useNavigate();
  const [showVisualizer, setShowVisualizer] = useState(false);

  if (favorites.length === 0) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Favorite Players</h1>
        <div style={styles.empty}>
          <div style={styles.emptyStone}>&#x2686;</div>
          <h2 style={styles.emptyTitle}>No favorites yet</h2>
          <p style={styles.emptyText}>
            Search for players and add them to track their progress.
          </p>
          <button onClick={() => navigate('/')} style={styles.searchBtn}>Search Players</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Favorite Players</h1>
      <p style={styles.count}>{favorites.length} player{favorites.length !== 1 ? 's' : ''} tracked</p>
      
      {/* Visualize button if we have at least 2 favorites */}
      {favorites.length >= 2 && (
        <button
          onClick={() => setShowVisualizer(!showVisualizer)}
          style={styles.visualizeBtn}
        >
          {showVisualizer ? 'Hide Showdown' : '🎉 Visualize Favorites Showdown!'}
        </button>
      )}

      <div style={styles.grid}>
        {favorites.map(player => {
          const isDan = player.grade.toLowerCase().includes('d') && !player.grade.toLowerCase().includes('k');
          return (
            <div key={player.pin} className="player-card" style={styles.card}
              onClick={() => navigate(`/player/${player.pin}`)}>
              <div style={styles.cardTop}>
                <div className={`stone-badge ${isDan ? 'stone-black' : 'stone-white'}`}>
                  {player.grade}
                </div>
                <div style={styles.cardInfo}>
                  <h3 style={styles.playerName}>{player.firstName} {player.lastName}</h3>
                  <p style={styles.playerMeta}>{player.countryCode} &middot; PIN: {player.pin}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFavorite(player.pin); }}
                  style={styles.removeBtn} title="Remove">&times;</button>
              </div>
              <div style={styles.stats}>
                <div style={styles.stat}>
                  <span style={styles.statLabel}>Rating</span>
                  <span style={styles.statValue}>{player.rating ?? 'N/A'}</span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statLabel}>Tournaments</span>
                  <span style={styles.statValue}>{player.totalTournaments ?? 'N/A'}</span>
                </div>
              </div>
              {player.club && <p style={styles.club}>{player.club}</p>}
              <div style={styles.viewProfile}>View Profile &rarr;</div>
            </div>
          );
        })}
      </div>

      {/* Visualizer section */}
      {showVisualizer && favorites.length >= 2 && (
        <FavoritesVisualizer players={favorites} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 920, margin: '0 auto', padding: '20px 16px' },
  title: { fontSize: 26, fontWeight: 800, color: 'var(--slate)', marginBottom: 4 },
  count: { color: 'var(--text-light)', fontSize: 13, marginBottom: 16 },
  visualizeBtn: {
    background: 'linear-gradient(135deg, var(--wood-dark), #5a4a32)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '12px 28px',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 24,
    boxShadow: '0 4px 12px rgba(90, 74, 50, 0.3)',
    transition: 'transform 0.1s ease',
  },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyStone: { fontSize: 56, color: 'var(--border)', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 600, color: 'var(--slate)', marginBottom: 8 },
  emptyText: { color: 'var(--text-light)', fontSize: 14, marginBottom: 24 },
  searchBtn: {
    background: 'var(--wood-dark)', color: '#fff', border: 'none', borderRadius: 10,
    padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14,
  },
  card: {
    background: 'var(--card-bg)', borderRadius: 14, padding: 18,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer',
    border: '1px solid var(--border)',
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: 12 },
  cardInfo: { flex: 1 },
  playerName: { fontSize: 17, fontWeight: 600, color: 'var(--slate)', margin: 0 },
  playerMeta: { fontSize: 12, color: 'var(--text-light)', margin: '3px 0 0' },
  removeBtn: {
    background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
    color: '#ccc', padding: 0, lineHeight: 1,
  },
  stats: {
    display: 'flex', gap: 16, marginTop: 14,
    paddingTop: 12, borderTop: '1px solid var(--border)',
  },
  stat: { display: 'flex', flexDirection: 'column' as const },
  statLabel: { fontSize: 10, color: '#b0a080', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  statValue: { fontSize: 15, fontWeight: 700, color: 'var(--slate)' },
  club: { fontSize: 12, color: 'var(--text-light)', margin: '8px 0 0' },
  viewProfile: { marginTop: 10, fontSize: 12, color: 'var(--wood-dark)', fontWeight: 600 },
};
