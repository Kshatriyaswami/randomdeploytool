import { Terminal, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function StatusPanel({ status, logs, error, url }) {
    if (!status || status === 'idle') return null;

    return (
        <div className="status-card">
            <div className="status-header">
                <div className="status-title">
                    <Terminal size={16} />
                    <span>Deployment Status</span>
                </div>
                <div>
                    {status === 'success' && <span className="status-badge success">Live</span>}
                    {status === 'failure' && <span className="status-badge failure">Failed</span>}
                    {(status !== 'success' && status !== 'failure') && <span className="status-badge running">Running</span>}
                </div>
            </div>

            <div className="status-content">
                <div className="steps-indicator">
                    {['CLONING', 'BUILDING', 'DEPLOYING', 'SUCCESS'].map((step, idx) => {
                        const currentIdx = ['cloning', 'building', 'deploying', 'success'].indexOf(status);
                        const isCompleted = currentIdx > idx || status === 'success';
                        const isCurrent = currentIdx === idx;

                        return (
                            <div key={step} className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}>
                                <div className="step-dot" />
                                {step}
                            </div>
                        )
                    })}
                </div>

                <div className="logs-container">
                    {logs.map((log, i) => (
                        <div key={i} className="log-line">
                            <span className="log-time">[{log.split(']')[0].replace('[', '')}]</span>
                            <span className="log-msg">{log.split(']')[1]}</span>
                        </div>
                    ))}
                    {(status !== 'success' && status !== 'failure') && (
                        <div style={{ color: 'var(--accent-primary)', marginTop: 8 }}>
                            <span className="cursor-blink">_</span>
                        </div>
                    )}
                </div>

                {status === 'success' && (
                    <div className="result-box success animate-fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <CheckCircle2 color="var(--success)" size={20} />
                            <div>
                                <h3 style={{ color: 'var(--success)', fontSize: '0.9rem' }}>Deployment Successful</h3>
                                <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#58a6ff', textDecoration: 'underline' }}>{url}</a>
                            </div>
                        </div>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="visit-btn">
                            Visit Site
                        </a>
                    </div>
                )}

                {status === 'failure' && (
                    <div className="result-box failure animate-fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <AlertCircle color="var(--error)" size={20} />
                            <h3 style={{ color: '#fa7a7a', fontSize: '0.9rem' }}>Deployment Failed</h3>
                        </div>
                        <p style={{ marginTop: 8, color: '#8b949e', fontSize: '0.8rem' }}>
                            The mock deployment encountered an error. In a real scenario, check your build commands.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
