import React, { useEffect, useState } from 'react';
import PostList from '../components/PostList';

const History = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history', { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (mounted) setPosts(body.data?.posts || body.data || []);
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to fetch history');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => { mounted = false };
  }, []);

  return (
    <div className="container mt-4">
      <h2>Recently Viewed Posts</h2>

      {loading && <div>Loading...</div>}
      {error && <div className="text-danger">{error}</div>}

      {!loading && !error && <PostList posts={posts} />}
    </div>
  );
};

export default History;
