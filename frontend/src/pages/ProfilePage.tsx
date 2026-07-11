import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getPlayer } from '../api/client';
import { useFavorites } from '../hooks/useFavorites';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

export default function ProfilePage() {
  const { pin } = useParams<{ pin: string }>();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();

  const { data: player, isLoading, isError, error } = useQuery({
    queryKey: ['player', pin],
    queryFn: () => getPlayer(Number(pin)),
    enabled: !!pin,
  });

  const errorMessage = isError && error instanceof Error && 'response' in error
    ? (error as any).response?.data?.detail || 'Failed to load player data.'
    : isError ? 'Failed to load player data.' : null;

  // Move useMemo BEFORE early returns to follow Rules of Hooks
  const chartData = useMemo(() =>
    player?.rating_history
      ?.filter(h => h.rating_after != null)
      .map(h => ({
        date: h.date?.split(' ')[0] ?? '',
        tournament: h.tournament,
        rating: Math.round(h.rating_after!),
        ratingBefore: h.rating_before ? Math.round(h.rating_before) : null,
        placement: h.placement,
        grade: h.grade,
        won: h.won,
        lost: h.lost,
      })) ?? [],
    [player?.rating_history]
  );

  const peakRating = useMemo(() =>
    chartData.length > 0 ? Math.max(...chartData.map(d => d.rating)) : null,
    [chartData]
  );

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p>Loading player data...</p>
        </div>
      </div>
    );
  }

  if (isError || !player) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Failed to load player data.</p>
          {errorMessage && (
            <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>{errorMessage}</p>
          )}
          {errorMessage?.includes('authentication') || errorMessage?.includes('token') ? (
            <p style={{ fontSize: 12, color: '#b0a080' }}>
              Please check your EGD API token in <code>backend/.env</code>
            </p>
          ) : null}
          <button onClick={() => navigate('/')} style={styles.backBtn}>Back to Search</button>
        </div>
      </div>
    );
  }

  const fav = isFavorite(player.pin);
  const isDan = player.grade.toLowerCase().includes('d') && !player.grade.toLowerCase().includes('k');
  // Format photo URL: if it doesn't start with http, assume it's a filename in EGD's photos directory
  const photoUrl = player.biography?.photo 
    ? (player.biography.photo.startsWith('http') 
      ? player.biography.photo 
      : `https://europeangodatabase.eu/EGD/Photos/${player.biography.photo}`)
    : undefined;

  return (
    <div className="go-grid-bg" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backArrow}>&larr;</button>
        <div style={styles.headerInfo}>
          <div style={styles.headerTop}>
            {photoUrl ? (
              <img src={photoUrl} alt="" style={styles.photo} />
            ) : (
              <div className={`stone-badge ${isDan ? 'stone-black' : 'stone-white'}`}
                style={{ width: 48, height: 48, fontSize: 14 }}>
                {player.grade}
              </div>
            )}
            <div>
              <h1 style={styles.name}>{player.firstName} {player.lastName}</h1>
              <p style={styles.meta}>
                PIN: {player.pin} &middot; {player.countryCode} &middot; {player.club || 'No club'}
                {photoUrl && <span style={styles.gradeLabel}> &middot; {player.grade}</span>}
              </p>
            </div>
          </div>
        </div>
        <button onClick={() => toggleFavorite(player)}
          style={{ ...styles.favBtn, ...(fav ? styles.favBtnActive : {}) }}>
          {fav ? '\u2605 Favorited' : '\u2606 Favorite'}
        </button>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <StatCard label="Grade" value={player.grade} accent />
        <StatCard label="GoR Rating" value={player.rating?.toString() ?? 'N/A'} />
        <StatCard label="Change" value={player.deltaRating != null ? `${player.deltaRating > 0 ? '+' : ''}${player.deltaRating}` : 'N/A'}
          valueColor={player.deltaRating != null ? (player.deltaRating > 0 ? '#27ae60' : '#e74c3c') : undefined} />
        <StatCard label="Proposed" value={player.proposedGrade ?? 'N/A'} />
        <StatCard label="Tournaments" value={player.totalTournaments?.toString() ?? 'N/A'} />
        <StatCard label="EGF Rank" value={player.egfPlacement?.toString() ?? 'N/A'} />
      </div>

      {/* Biography */}
      {player.biography?.biography && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>About</h2>
          <div style={styles.biographyCard}>
            <p style={styles.biographyText}>{player.biography.biography}</p>
          </div>
        </div>
      )}

      {/* Rating Evolution Chart */}
      {chartData.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Rating Evolution</h2>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 24, left: 12, bottom: 5 }}
                accessibilityLayer
                role="img"
                aria-label={`Rating evolution chart for ${player.firstName} ${player.lastName}, showing rating changes over ${chartData.length} tournaments`}
              >
                <defs>
                  <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--wood-dark)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--wood-dark)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8dcc8" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#999' }}
                  tickFormatter={(d) => d.substring(0, 7)}
                  axisLine={{ stroke: '#e8dcc8' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: '#999' }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />
                <Tooltip content={<RatingTooltip />} cursor={{ stroke: 'var(--wood-dark)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                {peakRating && (
                  <ReferenceLine
                    y={peakRating}
                    stroke="#27ae60"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    label={{ value: `Peak: ${peakRating}`, position: 'insideTopRight', fill: '#27ae60', fontSize: 11 }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="rating"
                  fill="url(#ratingGradient)"
                  stroke="none"
                />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="var(--wood-dark)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'var(--wood-dark)', stroke: '#fff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: 'var(--stone-black)', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.chartSummary}>
            <span>First: <strong>{chartData[0].rating}</strong></span>
            <span>Current: <strong>{chartData[chartData.length - 1].rating}</strong></span>
            <span>Peak: <strong>{peakRating}</strong></span>
            <span>Change: <strong style={{
              color: (chartData[chartData.length - 1].rating - chartData[0].rating) >= 0 ? '#27ae60' : '#e74c3c'
            }}>
              {chartData[chartData.length - 1].rating - chartData[0].rating > 0 ? '+' : ''}
              {chartData[chartData.length - 1].rating - chartData[0].rating}
            </strong></span>
          </div>
        </div>
      )}

      {/* Tournament History Table */}
      {player.rating_history.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Tournament History</h2>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Tournament</th>
                  <th style={styles.th}>Grade</th>
                  <th style={styles.th}>Rating</th>
                  <th style={styles.th}>Place</th>
                  <th style={styles.th}>W/L</th>
                </tr>
              </thead>
              <tbody>
                {player.rating_history.map((h, i) => {
                  const delta = h.rating_before != null && h.rating_after != null
                    ? h.rating_after - h.rating_before : null;
                  return (
                    <tr key={i} style={i % 2 === 0 ? styles.tr : styles.trAlt}>
                      <td style={styles.td}>{h.date?.split(' ')[0] ?? ''}</td>
                      <td style={styles.td}>
                        {h.tournament}
                        {h.city && <span style={{ color: '#b0a080', fontSize: 11 }}> ({h.city})</span>}
                      </td>
                      <td style={styles.td}>{h.grade}</td>
                      <td style={styles.td}>
                        {h.rating_after != null ? Math.round(h.rating_after) : 'N/A'}
                        {delta != null && (
                          <span style={{
                            color: delta > 0 ? '#27ae60' : delta < 0 ? '#e74c3c' : '#999',
                            fontSize: 11, marginLeft: 4, fontWeight: 600,
                          }}>
                            ({delta > 0 ? '+' : ''}{Math.round(delta)})
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>#{h.placement}</td>
                      <td style={styles.td}>{h.won}/{h.lost}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface ChartDataPoint {
  date: string;
  tournament: string;
  rating: number;
  ratingBefore: number | null;
  placement: number;
  grade: string;
  won: number;
  lost: number;
  city?: string;
}

function RatingTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const delta = d.ratingBefore != null ? d.rating - d.ratingBefore : null;
  return (
    <div style={styles.tooltip}>
      <p style={{ fontWeight: 600, marginBottom: 2, color: 'var(--slate)' }}>{d.tournament}</p>
      <p style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>{d.date} &middot; {d.city}</p>
      <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
        <span>Rating: <strong>{d.rating}</strong></span>
        {delta != null && (
          <span style={{ color: delta > 0 ? '#27ae60' : delta < 0 ? '#e74c3c' : '#999', fontWeight: 600 }}>
            ({delta > 0 ? '+' : ''}{delta})
          </span>
        )}
      </div>
      <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
        Place: #{d.placement} &middot; W/L: {d.won}/{d.lost} &middot; {d.grade}
      </p>
    </div>
  );
}

function StatCard({ label, value, accent, valueColor }: {
  label: string; value: string; accent?: boolean; valueColor?: string;
}) {
  return (
    <div style={{ ...styles.statCard, ...(accent ? styles.statCardAccent : {}) }}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, ...(valueColor ? { color: valueColor } : {}) }}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 920, margin: '0 auto', padding: '20px 16px' },
  loading: { textAlign: 'center', padding: 60, color: 'var(--text-light)' },
  spinner: {
    width: 36, height: 36, border: '3px solid var(--border)',
    borderTopColor: 'var(--wood-dark)', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
  },
  error: { textAlign: 'center', padding: 60, color: '#c0392b' },
  backBtn: {
    background: 'var(--wood-dark)', color: '#fff', border: 'none', borderRadius: 8,
    padding: '8px 18px', cursor: 'pointer', fontSize: 14, marginTop: 16,
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 16,
    marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid var(--border)',
  },
  backArrow: {
    background: 'none', border: 'none', fontSize: 22, cursor: 'pointer',
    color: 'var(--wood-dark)', padding: '4px 8px',
  },
  headerInfo: { flex: 1 },
  headerTop: { display: 'flex', alignItems: 'center', gap: 14 },
  photo: {
    width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' as const,
    border: '2px solid var(--border)',
  },
  gradeLabel: { fontWeight: 600, color: 'var(--wood-dark)' },
  name: { fontSize: 26, fontWeight: 800, color: 'var(--slate)', margin: 0, letterSpacing: '-0.5px' },
  meta: { fontSize: 13, color: 'var(--text-light)', margin: '3px 0 0' },
  favBtn: {
    background: 'var(--card-bg)', color: 'var(--wood-dark)', border: '2px solid var(--border)',
    borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    whiteSpace: 'nowrap' as const, transition: 'all 0.15s',
  },
  favBtnActive: {
    background: 'var(--wood-dark)', color: '#fff', border: '2px solid var(--wood-dark)',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(125px, 1fr))',
    gap: 10, marginBottom: 28,
  },
  statCard: {
    background: 'var(--card-bg)', borderRadius: 12, padding: '14px 10px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)', textAlign: 'center' as const,
    border: '1px solid var(--border)',
  },
  statCardAccent: {
    background: 'var(--slate)', border: '1px solid var(--slate)',
  },
  statLabel: {
    display: 'block', fontSize: 10, color: '#b0a080',
    textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: 4,
  },
  statValue: { display: 'block', fontSize: 18, fontWeight: 700, color: 'var(--slate)' },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 18, fontWeight: 700, color: 'var(--slate)', marginBottom: 14,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  chartContainer: {
    background: 'var(--card-bg)', borderRadius: 14, padding: '16px 8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1px solid var(--border)',
    position: 'relative' as const,
  },
  chartSummary: {
    display: 'flex', justifyContent: 'space-around', marginTop: 12,
    fontSize: 12, color: 'var(--text-light)',
  },
  tooltip: {
    background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10,
    padding: '10px 14px', fontSize: 12, lineHeight: 1.6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  tableWrapper: {
    overflowX: 'auto' as const, background: 'var(--card-bg)', borderRadius: 14,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1px solid var(--border)',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: {
    textAlign: 'left' as const, padding: '10px 14px', borderBottom: '2px solid var(--border)',
    fontWeight: 600, color: '#b0a080', fontSize: 11, textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  tr: { borderBottom: '1px solid #f5f0e6' },
  trAlt: { borderBottom: '1px solid #f5f0e6', background: '#fdfbf6' },
  td: { padding: '9px 14px', color: 'var(--text)' },
  biographyCard: {
    background: 'var(--card-bg)',
    borderRadius: 14,
    padding: '18px 16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    border: '1px solid var(--border)',
  },
  biographyText: {
    margin: 0,
    fontSize: 14,
    color: 'var(--text)',
    lineHeight: 1.7,
  },
};
