import React from 'react';

const PostList = ({ posts = [] }) => {
  if (!Array.isArray(posts) || posts.length === 0) {
    return <div className="post-list-empty">No posts to show.</div>;
  }

  return (
    <div className="post-list">
      {posts.map((p, index) => (
        <article key={p.postId || p.id || index} className="post-item">
          <h3 className="post-title">{p.title || 'Untitled'}</h3>
          <div className="post-meta">
            <span className="post-author">{p.userFirstName || p.userId || 'Unknown'}</span>
            <span className="post-date">{p.dateCreated ? new Date(p.dateCreated).toLocaleString() : ''}</span>
            {typeof p.replyCount === 'number' && (
              <span className="post-replies">{p.replyCount} replies</span>
            )}
          </div>
          <p className="post-snippet">{p.content ? p.content.slice(0, 200) : ''}</p>
        </article>
      ))}
    </div>
  );
};

export default PostList;
