export default function CloneTable({ clones, onDelete }) {
    if (!clones || clones.length === 0) return null;

    return (
        <div className="history-section animate-fade-in" style={{ marginTop: '2rem' }}>
            <h2 className="history-title">
                <span>📁 Cloned Repositories</span>
            </h2>
            <div className="table-wrapper">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th style={{ width: '30%' }}>Repository</th>
                            <th style={{ width: '40%' }}>Local Path</th>
                            <th style={{ width: '20%' }}>Time Cleared</th>
                            <th style={{ width: '10%' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clones.map((item) => (
                            <tr key={item.id}>
                                <td style={{
                                    fontFamily: 'monospace',
                                    color: 'var(--text-primary)',
                                    maxWidth: '200px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }} title={item.repoUrl}>
                                    {item.repoUrl}
                                </td>
                                <td style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.8rem',
                                    maxWidth: '300px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }} title={item.path}>
                                    {item.path}
                                </td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(item.timestamp).toLocaleString()}</td>
                                <td>
                                    <button
                                        onClick={() => onDelete(item.id)}
                                        className="delete-btn"
                                        title="Delete Local Clone"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style jsx>{`
                .table-wrapper {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    max-width: 100%;
                    border-radius: 8px;
                    border: 1px solid var(--border-color, #333);
                }
                .history-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 600px; /* Force scroll on small screens */
                    table-layout: fixed; /* Enforce column widths */
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
