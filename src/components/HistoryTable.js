
export default function HistoryTable({ history, onDelete }) {
    if (!history || history.length === 0) return null;

    return (
        <div className="history-section animate-fade-in">
            <h2 className="history-title">
                <span>📜 Deployment History</span>
            </h2>
            <div className="table-wrapper">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th style={{ width: '25%' }}>Repository</th>
                            <th style={{ width: '15%' }}>Platform</th>
                            <th style={{ width: '15%' }}>URL</th>
                            <th style={{ width: '20%' }}>Time</th>
                            <th style={{ width: '15%' }}>Status</th>
                            <th style={{ width: '10%' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((item) => (
                            <tr key={item.id}>
                                <td style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{item.repoUrl}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{item.platform}</td>
                                <td>
                                    {item.url ? (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="visit-link"
                                        >
                                            Visit 🔗
                                        </a>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                                    )}
                                </td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(item.timestamp).toLocaleString()}</td>
                                <td>
                                    <span className={`status-tag ${item.status}`}>
                                        {item.status.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        onClick={() => onDelete(item.id)}
                                        className="delete-btn"
                                        title="Delete Deployment"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style jsx>{`
                .visit-link {
                    color: var(--accent-color, #4facfe);
                    text-decoration: none;
                    font-weight: 500;
                }
                .visit-link:hover {
                    text-decoration: underline;
                }
                .delete-btn {
                    background: rgba(218, 54, 51, 0.1);
                    border: 1px solid rgba(218, 54, 51, 0.3);
                    color: #ff7b72;
                    cursor: pointer;
                    transition: all 0.2s;
                    padding: 8px;
                    border-radius: 6px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .delete-btn:hover {
                    background: rgba(218, 54, 51, 0.25);
                    color: #ff5b52;
                    transform: scale(1.1);
                    box-shadow: 0 0 8px rgba(218, 54, 51, 0.4);
                }
            `}</style>
        </div>
    );
}
