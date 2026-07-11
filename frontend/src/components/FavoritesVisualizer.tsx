import { useState, useEffect, useRef } from 'react';
import type { PlayerSummary } from '../api/client';
import { getPlayerGames } from '../api/client';

interface HeadToHead {
  pin1: number;
  pin2: number;
  wins1: number;
  wins2: number;
  total: number;
}

export default function FavoritesVisualizer({ players }: { players: PlayerSummary[] }) {
  const [headToHeadData, setHeadToHeadData] = useState<HeadToHead[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchHeadToHeadData = async () => {
      setLoading(true);
      const h2h: HeadToHead[] = [];

      // Fetch games for all players
      const allGames: Map<number, any[]> = new Map();
      for (const player of players) {
        try {
          const gamesRes = await getPlayerGames(player.pin, 200);
          allGames.set(player.pin, gamesRes.data);
        } catch {
          allGames.set(player.pin, []);
        }
      }

      // Calculate head-to-head between all pairs
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const p1 = players[i];
          const p2 = players[j];

          let wins1 = 0;
          let wins2 = 0;

          // Check p1's games for matches with p2
          const p1Games = allGames.get(p1.pin) || [];
          const checkedGameIds = new Set();
          for (const game of p1Games) {
            const gamePins = [game.player1.pin, game.player2.pin];
            if (gamePins.includes(p1.pin) && gamePins.includes(p2.pin) && !checkedGameIds.has(game.id)) {
              checkedGameIds.add(game.id);
              console.log("DEBUG: Game result:", game);
              // Try to parse result - let's check possible formats
              if (game.result) {
                const result = game.result.toLowerCase();
                const isP1Player1 = game.player1.pin === p1.pin;
                const p1Color = isP1Player1 ? game.color1?.toLowerCase() : game.color2?.toLowerCase();
                
                if (result.includes("jigo") || result === "j" || result === "=") {
                  // ignore jigo
                } else if (result.includes("b") && !result.includes("w")) {
                  // Black won
                  if (p1Color === "black" || p1Color === "b") wins1++;
                  else wins2++;
                } else if (result.includes("w") && !result.includes("b")) {
                  // White won
                  if (p1Color === "white" || p1Color === "w") wins1++;
                  else wins2++;
                } else if (result.includes("+") || result.includes("-")) {
                   // Fallback for some weird formats
                   const parts = result.split("+");
                   if (parts.length > 0) {
                      const firstPart = parts[0].trim();
                      if (firstPart === "b") {
                        if (p1Color === "black" || p1Color === "b") wins1++;
                        else wins2++;
                      } else if (firstPart === "w") {
                        if (p1Color === "white" || p1Color === "w") wins1++;
                        else wins2++;
                      }
                   }
                }
              }
            }
          }

          h2h.push({
            pin1: p1.pin,
            pin2: p2.pin,
            wins1,
            wins2,
            total: wins1 + wins2,
          });
        }
      }

      setHeadToHeadData(h2h);
      setLoading(false);
    };

    fetchHeadToHeadData();
  }, [players]);

  useEffect(() => {
    if (!loading && canvasRef.current && players.length > 1) {
      drawGraph(canvasRef.current, players, headToHeadData);
    }
  }, [loading, players, headToHeadData]);

  // Helper to draw the graph
  const drawGraph = (
    canvas: HTMLCanvasElement,
    players: PlayerSummary[],
    headToHead: HeadToHead[]
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate node positions in circle
    const nodePositions: Map<number, { x: number; y: number }> = new Map();
    players.forEach((player, index) => {
      const angle = (index / players.length) * 2 * Math.PI - Math.PI / 2;
      nodePositions.set(player.pin, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });

    // Draw edges (relationships) first
    for (const h2h of headToHead) {
      const pos1 = nodePositions.get(h2h.pin1)!;
      const pos2 = nodePositions.get(h2h.pin2)!;
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Draw a thick line for total games
      const lineWidth = 3 + h2h.total * 1.5;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';

      // Draw gradient based on who is winning more
      const gradient = ctx.createLinearGradient(pos1.x, pos1.y, pos2.x, pos2.y);
      if (h2h.wins1 > h2h.wins2) {
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(1, '#d4c5a1');
      } else if (h2h.wins2 > h2h.wins1) {
        gradient.addColorStop(0, '#d4c5a1');
        gradient.addColorStop(1, '#1a1a1a');
      } else {
        gradient.addColorStop(0, '#888');
        gradient.addColorStop(1, '#888');
      }
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(pos1.x, pos1.y);
      ctx.lineTo(pos2.x, pos2.y);
      ctx.stroke();

      // Draw game count in the middle
      const midX = (pos1.x + pos2.x) / 2;
      const midY = (pos1.y + pos2.y) / 2;
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${h2h.wins1}-${h2h.wins2}`, midX, midY);
    }

    // Draw nodes (players)
    players.forEach((player) => {
      const pos = nodePositions.get(player.pin)!;
      const isDan = player.grade.toLowerCase().includes('d') && !player.grade.toLowerCase().includes('k');
      const nodeRadius = 35;

      // Draw outer glow
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius + 5, 0, 2 * Math.PI);
      ctx.fillStyle = isDan ? 'rgba(26,26,26,0.2)' : 'rgba(212,197,161,0.3)';
      ctx.fill();

      // Draw node
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = isDan ? '#1a1a1a' : '#fff';
      ctx.strokeStyle = isDan ? '#000' : '#d4c5a1';
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();

      // Draw grade
      ctx.fillStyle = isDan ? '#fff' : '#333';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.grade, pos.x, pos.y - 5);

      // Draw name below node
      ctx.fillStyle = '#333';
      ctx.font = '13px sans-serif';
      ctx.fillText(player.firstName, pos.x, pos.y + nodeRadius + 18);
      ctx.fillText(player.lastName, pos.x, pos.y + nodeRadius + 32);
    });
  };

  // Sort players by rating (descending) for leaderboard
  const sortedPlayers = [...players].sort((a, b) => {
    const ratingA = a.rating ?? 0;
    const ratingB = b.rating ?? 0;
    return ratingB - ratingA;
  });

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>Favorite Players Showdown!</h2>

      {/* Leaderboard */}
      <div style={styles.leaderboard}>
        <h3 style={styles.leaderboardTitle}>🏆 Rating Leaderboard</h3>
        <div style={styles.leaderboardGrid}>
          {sortedPlayers.map((player, index) => {
            const isDan = player.grade.toLowerCase().includes('d') && !player.grade.toLowerCase().includes('k');
            const rank = index + 1;
            const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
            return (
              <div
                key={player.pin}
                style={{
                  ...styles.leaderboardRow,
                  background: rank === 1 ? 'linear-gradient(135deg, #ffd70033, #ffed4e22)' : 'var(--card-bg)',
                  boxShadow: rank === 1 ? '0 4px 16px rgba(255, 215, 0, 0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <div style={styles.rankBadge}>{medalEmoji}</div>
                <div className={`stone-badge ${isDan ? 'stone-black' : 'stone-white'}`} style={{ width: 40, height: 40, fontSize: 14 }}>
                  {player.grade}
                </div>
                <div style={styles.playerInfo}>
                  <div style={styles.playerName}>
                    {player.firstName} {player.lastName}
                  </div>
                  <div style={styles.playerMeta}>{player.countryCode}</div>
                </div>
                <div style={styles.rating}>
                  <div style={styles.ratingLabel}>Rating</div>
                  <div style={styles.ratingValue}>{player.rating ?? 'N/A'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Relationship Graph */}
      <div style={styles.graphSection}>
        <h3 style={styles.graphTitle}>🤝 Player Relationships (Head-to-Head)</h3>
        {loading ? (
          <div style={styles.loading}>Loading head-to-head data...</div>
        ) : (
          <div style={styles.canvasContainer}>
            <canvas
              ref={canvasRef}
              width={700}
              height={500}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            <p style={styles.graphHelp}>
              Thick lines = more games played. Gradient shows who has more wins!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--slate)',
    marginBottom: 16,
  },
  leaderboard: {
    background: 'var(--card-bg)',
    borderRadius: 14,
    padding: 18,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: '1px solid var(--border)',
    marginBottom: 20,
  },
  leaderboardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--slate)',
    margin: '0 0 12px',
  },
  leaderboardGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  leaderboardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid var(--border)',
  },
  rankBadge: {
    fontSize: 22,
    fontWeight: 700,
    minWidth: 35,
    textAlign: 'center',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--slate)',
  },
  playerMeta: {
    fontSize: 12,
    color: 'var(--text-light)',
  },
  rating: {
    textAlign: 'right',
  },
  ratingLabel: {
    fontSize: 10,
    color: '#b0a080',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--slate)',
  },
  graphSection: {
    background: 'var(--card-bg)',
    borderRadius: 14,
    padding: 18,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: '1px solid var(--border)',
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--slate)',
    margin: '0 0 12px',
  },
  loading: {
    textAlign: 'center',
    padding: 40,
    color: 'var(--text-light)',
    fontSize: 14,
  },
  canvasContainer: {
    textAlign: 'center',
  },
  graphHelp: {
    fontSize: 12,
    color: 'var(--text-light)',
    marginTop: 8,
  },
};
