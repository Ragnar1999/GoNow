import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchPlayers, type PlayerSummary } from '../api/client';
import { useFavorites } from '../hooks/useFavorites';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchPlayers(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000,
  });

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(query);
  }, [query]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const results = data?.data ?? [];

  return (
    <div className="go-grid-bg" style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.logoArea}>
          <div style={styles.stoneIcon}>&#x268A;</div>
          <h1 style={styles.title}>GoNow</h1>
        </div>
        <p style={styles.subtitle}>
          Track European Go players &middot; Search by name or EGD PIN
        </p>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <div className="search-wrapper">
            <span style={styles.searchIcon}>&#x1F50D;</span>
            <input
              className="search-input"
              type="text"
              value={query}
              onChange={handleChange}
              placeholder="Enter player name or PIN..."
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setDebouncedQuery(''); }}
                style={styles.clearBtn}
              >
                &times;
              </button>
            )}
          </div>
        </form>
      </div>

      {isLoading && (
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p>Searching the European Go Database...</p>
        </div>
      )}

      {isError && (
        <div style={styles.error}>
          Failed to search. Please check your connection and try again.
        </div>
      )}

      {results.length > 0 && (
        <div style={styles.results}>
          <p style={styles.resultCount}>
            Found {data?.total ?? results.length} player{results.length !== 1 ? 's' : ''}
          </p>
          <div style={styles.grid}>
            {results.map((player: PlayerSummary) => (
              <div
                key={player.pin}
                className="player-card"
                style={styles.card}
                onClick={() => navigate(`/player/${player.pin}`)}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.cardLeft}>
                    <GradeStone grade={player.grade} />
                    <div>
                      <h3 style={styles.playerName}>
                        {player.firstName} {player.lastName}
                      </h3>
                      <p style={styles.playerMeta}>
                        <span style={styles.flag}>{getFlag(player.countryCode)}</span>
                        {player.countryCode} &middot; PIN: {player.pin}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(player); }}
                    style={styles.favBtn}
                    title={isFavorite(player.pin) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFavorite(player.pin) ? '\u2605' : '\u2606'}
                  </button>
                </div>
                <div style={styles.stats}>
                  <div style={styles.stat}>
                    <span style={styles.statLabel}>Grade</span>
                    <span style={styles.statValue}>{player.grade}</span>
                  </div>
                  <div style={styles.stat}>
                    <span style={styles.statLabel}>Rating</span>
                    <span style={styles.statValue}>{player.rating ?? 'N/A'}</span>
                  </div>
                  <div style={styles.stat}>
                    <span style={styles.statLabel}>Tournaments</span>
                    <span style={styles.statValue}>{player.totalTournaments ?? 'N/A'}</span>
                  </div>
                </div>
                {player.club && (
                  <p style={styles.club}>{player.club}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {debouncedQuery.length >= 2 && !isLoading && results.length === 0 && (
        <div style={styles.noResults}>
          <p>No players found for "{debouncedQuery}"</p>
          <p style={styles.hint}>Try a different spelling or search by PIN number</p>
        </div>
      )}
    </div>
  );
}

function GradeStone({ grade }: { grade: string }) {
  const isDan = grade.toLowerCase().includes('d') && !grade.toLowerCase().includes('k');
  return (
    <div className={`stone-badge ${isDan ? 'stone-black' : 'stone-white'}`}>
      {grade}
    </div>
  );
}

function getFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    GB: '\uD83C\uDDEC\uD83C\uDDE7', DE: '\uD83C\uDDE9\uD83C\uDDEA',
    FR: '\uD83C\uDDEB\uD83C\uDDF7', NL: '\uD83C\uDDF3\uD83C\uDDF1',
    PL: '\uD83C\uDDF5\uD83C\uDDF1', CZ: '\uD83C\uDDE8\uD83C\uDDFF',
    RO: '\uD83C\uDDF7\uD83C\uDDF4', HU: '\uD83C\uDDED\uD83C\uDDFA',
    AT: '\uD83C\uDDE6\uD83C\uDDF9', CH: '\uD83C\uDDE8\uD83C\uDDED',
    IT: '\uD83C\uDDEE\uD83C\uDDF9', ES: '\uD83C\uDDEA\uD83C\uDDF8',
    SE: '\uD83C\uDDF8\uD83C\uDDEA', FI: '\uD83C\uDDEB\uD83C\uDDEE',
    DK: '\uD83C\uDDE9\uD83C\uDDF0', NO: '\uD83C\uDDF3\uD83C\uDDF4',
    RU: '\uD83C\uDDF7\uD83C\uDDFA', UA: '\uD83C\uDDFA\uD83C\uDDE6',
    BE: '\uD83C\uDDE7\uD83C\uDDEA', PT: '\uD83C\uDDF5\uD83C\uDDF9',
    IE: '\uD83C\uDDEE\uD83C\uDDEA', US: '\uD83C\uDDFA\uD83C\uDDF8',
    CA: '\uD83C\uDDE8\uD83C\uDDE6', AU: '\uD83C\uDDE6\uD83C\uDDFA',
    JP: '\uD83C\uDDEF\uD83C\uDDF5', KR: '\uD83C\uDDF0\uD83C\uDDF7',
    CN: '\uD83C\uDDE8\uD83C\uDDF3', UK: '\uD83C\uDDEC\uD83C\uDDE7',
  };
  return flags[countryCode] || countryCode;
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 920, margin: '0 auto', padding: '32px 16px', minHeight: '80vh' },
  hero: { textAlign: 'center', marginBottom: 40 },
  logoArea: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 },
  stoneIcon: {
    fontSize: 36, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(circle at 35% 35%, #444, #1a1a1a)',
    borderRadius: '50%', color: '#fff', boxShadow: '2px 3px 8px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: 36, fontWeight: 800, color: 'var(--slate)',
    letterSpacing: '-1px',
  },
  subtitle: { color: 'var(--text-light)', fontSize: 15, marginBottom: 28 },
  searchForm: { maxWidth: 520, margin: '0 auto' },
  searchIcon: { fontSize: 18, marginRight: 10, opacity: 0.6 },
  clearBtn: {
    background: 'none', border: 'none', fontSize: 22, cursor: 'pointer',
    color: '#b0a080', padding: '0 4px', lineHeight: 1,
  },
  loading: { textAlign: 'center', padding: 48, color: 'var(--text-light)' },
  spinner: {
    width: 36, height: 36, border: '3px solid var(--border)',
    borderTopColor: 'var(--wood-dark)', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
  },
  error: {
    background: '#fef3f0', border: '1px solid #f5c8b8', borderRadius: 10,
    padding: 16, color: '#c0392b', textAlign: 'center',
  },
  results: { marginTop: 8, animation: 'fadeIn 0.3s ease' },
  resultCount: { color: 'var(--text-light)', fontSize: 13, marginBottom: 16, paddingLeft: 4 },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 14,
  },
  card: {
    background: 'var(--card-bg)', borderRadius: 14, padding: 18,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer',
    border: '1px solid var(--border)',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { display: 'flex', gap: 12, alignItems: 'center' },
  playerName: { fontSize: 17, fontWeight: 600, color: 'var(--slate)', margin: 0 },
  playerMeta: { fontSize: 12, color: 'var(--text-light)', margin: '3px 0 0' },
  flag: { marginRight: 3 },
  favBtn: {
    background: 'none', border: 'none', fontSize: 22, cursor: 'pointer',
    color: 'var(--wood-dark)', padding: 0, lineHeight: 1,
  },
  stats: {
    display: 'flex', gap: 16, marginTop: 14,
    paddingTop: 12, borderTop: '1px solid var(--border)',
  },
  stat: { display: 'flex', flexDirection: 'column' as const },
  statLabel: { fontSize: 10, color: '#b0a080', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  statValue: { fontSize: 15, fontWeight: 700, color: 'var(--slate)' },
  club: { fontSize: 12, color: 'var(--text-light)', margin: '8px 0 0' },
  noResults: { textAlign: 'center', padding: 48, color: 'var(--text-light)' },
  hint: { fontSize: 13, color: '#b0a080', marginTop: 8 },
};
