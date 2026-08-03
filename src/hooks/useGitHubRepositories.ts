import { useCallback, useEffect, useState } from 'react';
import type { GitHubRepo } from '../types';
import { getAllRepositories } from '../services/github';
import { profile } from '../data/profile';

export function useGitHubRepositories() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState<'live' | 'cache' | 'stale'>('live');

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError('');
    try {
      const result = await getAllRepositories(profile.githubUsername, force);
      setRepos(result.repos);
      setSource(result.stale ? 'stale' : result.cached ? 'cache' : 'live');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not contact GitHub.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  return { repos, loading, error, source, reload: () => load(true) };
}
