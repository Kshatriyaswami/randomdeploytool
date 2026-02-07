"use client";

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import DeploymentForm from '@/components/DeploymentForm';
import StatusPanel from '@/components/StatusPanel';
import HistoryTable from '@/components/HistoryTable';
import CloneTable from '@/components/CloneTable';

export default function Home() {
  const [deploymentStatus, setDeploymentStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [clones, setClones] = useState([]);
  const pollIntervalRef = useRef(null);

  const fetchData = async () => {
    // Fetch History
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) { console.error(err); }

    // Fetch Clones
    try {
      const res = await fetch('/api/clones');
      const data = await res.json();
      setClones(data.clones || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll for updates every 5s
    return () => clearInterval(interval);
  }, []);

  const handleDeploy = async (repoUrl, platform, authToken, repoId) => {
    try {
      setDeploymentStatus({ status: 'cloning', logs: ['Initializing...'], repoUrl, platform });

      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, platform, authToken, repoId }),
      });

      const data = await res.json();

      if (res.ok) {
        startPolling(data.id);
        fetchData(); // Update clones list immediately
      } else {
        setDeploymentStatus(prev => ({ ...prev, status: 'failure', logs: [...prev.logs, `Error: ${data.error}`] }));
      }
    } catch (err) {
      setDeploymentStatus(prev => ({ ...prev, status: 'failure', logs: [...prev.logs, `Error: ${err.message}`] }));
    }
  };

  const startPolling = (id) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status?id=${id}`);
        const data = await res.json();

        if (res.ok) {
          setDeploymentStatus({
            id: data.id,
            status: data.status,
            logs: data.logs || [],
            url: data.url,
            repoUrl: data.repoUrl,
            platform: data.platform
          });

          if (data.status === 'success' || data.status === 'failure') {
            clearInterval(pollIntervalRef.current);
            fetchData();
          }
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 1000);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this deployment history?')) return;
    try {
      await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleDeleteClone = async (id) => {
    if (!confirm('Are you sure you want to delete this cloned repository from your local disk?')) return;
    try {
      await fetch(`/api/clones?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Delete clone failed', err);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="container">
        <Header />

        <DeploymentForm onDeploy={handleDeploy} />

        {deploymentStatus && (
          <StatusPanel
            status={deploymentStatus.status}
            logs={deploymentStatus.logs}
            url={deploymentStatus.url}
          />
        )}

        <HistoryTable history={history} onDelete={handleDelete} />

        <CloneTable clones={clones} onDelete={handleDeleteClone} />
      </div>
    </main>
  );
}
