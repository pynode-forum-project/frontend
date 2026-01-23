import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getPostById } from "../services/postApi";
import { getRepliesByPost, createReply, createSubReply, deleteReply } from "../services/replyApi";
import { uploadFile } from "../services/fileApi";
import { recordPostView } from "../services/historyApi";
import "./PostDetail.css";

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [replyPage, setReplyPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const repliesPerPage = 10;
  const [replyingTo, setReplyingTo] = useState(null);
  const [subReplyContent, setSubReplyContent] = useState({});
  const [subReplyAttachments, setSubReplyAttachments] = useState({});
  const [subReplyUploading, setSubReplyUploading] = useState({});

  // Check if user is admin
  const isAdmin = () => {
    return user?.type === "admin" || user?.type === "superadmin";
  };

  // Check if user is verified
  const isVerified = () => {
    return user?.emailVerified !== false && user?.type !== "unverified";
  };

  // Check if user is post owner
  const isOwner = post?.userId === user?.userId;

  // Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      if (!isAuthenticated) {
        navigate("/users/login");
        return;
      }

      setIsLoading(true);
      try {
        const response = await getPostById(id);
        if (response.success && response.data) {
          setPost(response.data.post || response.data);
        } else {
          setPost(null);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id, isAuthenticated, navigate]);

  // Fetch replies
  useEffect(() => {
    if (!isAuthenticated || !post) return;

    const fetchReplies = async () => {
      try {
        const response = await getRepliesByPost(id, {
          page: replyPage,
          limit: repliesPerPage,
        });
        if (response.success && response.data) {
          setReplies(response.data.replies || []);
          setTotalPages(response.data.pagination?.totalPages || 1);
          setTotal(response.data.pagination?.total || 0);
        }
      } catch (error) {
        console.error("Error fetching replies:", error);
        setReplies([]);
      }
    };

    fetchReplies();
  }, [id, replyPage, post, isAuthenticated]);

  // Record view history
  useEffect(() => {
    if (post && isAuthenticated) {
      recordPostView(id).catch(() => {
        // Silently fail - non-critical operation
      });
    }
  }, [id, post, isAuthenticated]);

  // Handle file upload for reply
  const handleReplyFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFiles(files.map((f) => f.name));

    try {
      const uploadPromises = files.map((file) =>
        uploadFile(file, "attachment").then((res) => res.data.url)
      );

      const urls = await Promise.all(uploadPromises);
      setReplyAttachments([...replyAttachments, ...urls]);
      setUploadingFiles([]);
    } catch (error) {
      console.error("Error uploading files:", error);
      setUploadingFiles([]);
    }
  };

  const handleRemoveReplyAttachment = (index) => {
    setReplyAttachments(replyAttachments.filter((_, i) => i !== index));
  };

  // Handle file upload for sub-reply
  const handleSubReplyFileSelect = async (e, replyId) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSubReplyUploading((prev) => ({
      ...prev,
      [replyId]: files.map((f) => f.name),
    }));

    try {
      const uploadPromises = files.map((file) =>
        uploadFile(file, "attachment").then((res) => res.data.url)
      );

      const urls = await Promise.all(uploadPromises);
      setSubReplyAttachments((prev) => ({
        ...prev,
        [replyId]: [...(prev[replyId] || []), ...urls],
      }));
      setSubReplyUploading((prev) => {
        const newState = { ...prev };
        delete newState[replyId];
        return newState;
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      setSubReplyUploading((prev) => {
        const newState = { ...prev };
        delete newState[replyId];
        return newState;
      });
    }
  };

  const handleRemoveSubReplyAttachment = (replyId, index) => {
    setSubReplyAttachments((prev) => ({
      ...prev,
      [replyId]: (prev[replyId] || []).filter((_, i) => i !== index),
    }));
  };

  // Create reply
  const handleCreateReply = async () => {
    if (!replyContent.trim()) return;

    try {
      await createReply(id, replyContent, replyAttachments);
      setReplyContent("");
      setReplyAttachments([]);
      // Refresh replies
      const response = await getRepliesByPost(id, {
        page: replyPage,
        limit: repliesPerPage,
      });
      if (response.success && response.data) {
        setReplies(response.data.replies || []);
      }
    } catch (error) {
      console.error("Error creating reply:", error);
      alert("Failed to post reply. Please try again.");
    }
  };

  // Create sub-reply
  const handleCreateSubReply = async (replyId) => {
    const content = subReplyContent[replyId];
    if (!content?.trim()) return;

    try {
      await createSubReply(
        replyId,
        content,
        subReplyAttachments[replyId] || []
      );
      setSubReplyContent((prev) => {
        const newState = { ...prev };
        delete newState[replyId];
        return newState;
      });
      setSubReplyAttachments((prev) => {
        const newState = { ...prev };
        delete newState[replyId];
        return newState;
      });
      setReplyingTo(null);
      // Refresh replies
      const response = await getRepliesByPost(id, {
        page: replyPage,
        limit: repliesPerPage,
      });
      if (response.success && response.data) {
        setReplies(response.data.replies || []);
      }
    } catch (error) {
      console.error("Error creating sub-reply:", error);
      alert("Failed to post reply. Please try again.");
    }
  };

  // Delete reply
  const handleDeleteReply = async (replyId) => {
    if (!window.confirm("Are you sure you want to delete this reply?")) {
      return;
    }

    try {
      await deleteReply(replyId);
      // Refresh replies
      const response = await getRepliesByPost(id, {
        page: replyPage,
        limit: repliesPerPage,
      });
      if (response.success && response.data) {
        setReplies(response.data.replies || []);
      }
    } catch (error) {
      console.error("Error deleting reply:", error);
      alert("Failed to delete reply. Please try again.");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get file name from URL
  const getFileName = (url) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      return decodeURIComponent(pathParts[pathParts.length - 1]);
    } catch {
      return url.split("/").pop() || "attachment";
    }
  };

  // Render nested replies recursively
  const renderNestedReplies = (nestedReplies, depth = 1) => {
    if (!nestedReplies || nestedReplies.length === 0 || depth > 5) {
      return null;
    }

    return (
      <div className="nested-replies" style={{ marginLeft: `${depth * 20}px` }}>
        {nestedReplies.map((nestedReply, index) => (
          <div key={nestedReply.replyId || index} className="reply-item nested">
            <div className="reply-header">
              <div className="reply-author">
                <span className="reply-author-name">
                  {nestedReply.user?.firstName} {nestedReply.user?.lastName}
                </span>
                <span className="reply-date">
                  {formatDate(nestedReply.dateCreated)}
                </span>
              </div>
              {(nestedReply.userId === user?.userId || isOwner || isAdmin()) && (
                <button
                  onClick={() => handleDeleteReply(nestedReply.replyId)}
                  className="delete-reply-btn"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="reply-content">{nestedReply.comment}</div>
            {nestedReply.attachments && nestedReply.attachments.length > 0 && (
              <div className="reply-attachments">
                {nestedReply.attachments.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="attachment-link"
                  >
                    📎 {getFileName(url)}
                  </a>
                ))}
              </div>
            )}
            {isVerified() &&
              post.status === "published" &&
              !post.isArchived &&
              depth < 5 && (
                <button
                  onClick={() =>
                    setReplyingTo(
                      replyingTo === nestedReply.replyId
                        ? null
                        : nestedReply.replyId
                    )
                  }
                  className="reply-btn"
                >
                  {replyingTo === nestedReply.replyId ? "Cancel" : "Reply"}
                </button>
              )}
            {replyingTo === nestedReply.replyId && (
              <div className="sub-reply-form">
                <textarea
                  className="reply-textarea"
                  placeholder="Write a reply..."
                  value={subReplyContent[nestedReply.replyId] || ""}
                  onChange={(e) =>
                    setSubReplyContent({
                      ...subReplyContent,
                      [nestedReply.replyId]: e.target.value,
                    })
                  }
                />
                <div className="file-upload-section">
                  <label className="file-upload-label">
                    <input
                      type="file"
                      multiple
                      className="file-input"
                      onChange={(e) =>
                        handleSubReplyFileSelect(e, nestedReply.replyId)
                      }
                      disabled={subReplyUploading[nestedReply.replyId]?.length > 0}
                    />
                    {subReplyUploading[nestedReply.replyId]?.length > 0
                      ? "Uploading..."
                      : "Add Files"}
                  </label>
                  {subReplyAttachments[nestedReply.replyId]?.length > 0 && (
                    <div className="attachments-list">
                      {subReplyAttachments[nestedReply.replyId].map(
                        (url, idx) => (
                          <div key={idx} className="attachment-item">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              📎 {getFileName(url)}
                            </a>
                            <button
                              onClick={() =>
                                handleRemoveSubReplyAttachment(
                                  nestedReply.replyId,
                                  idx
                                )
                              }
                              className="remove-attachment-btn"
                            >
                              ×
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleCreateSubReply(nestedReply.replyId)}
                  disabled={
                    !subReplyContent[nestedReply.replyId]?.trim() ||
                    subReplyUploading[nestedReply.replyId]?.length > 0
                  }
                  className="submit-reply-btn"
                >
                  Post Reply
                </button>
              </div>
            )}
            {nestedReply.replies &&
              renderNestedReplies(nestedReply.replies, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-container">
        <div className="error-message">
          <h2>Post not found</h2>
          <p>This post may have been deleted or you don't have access.</p>
          <Link to="/home" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      <button onClick={() => navigate("/home")} className="back-btn">
        ← Back to Home
      </button>

      {/* Post Content */}
      <div className="post-detail-card">
        <div className="post-status-badges">
          {post.status === "banned" && (
            <span className="status-badge banned">Banned</span>
          )}
          {post.status === "hidden" && (
            <span className="status-badge hidden">Hidden</span>
          )}
          {post.status === "deleted" && (
            <span className="status-badge deleted">Deleted</span>
          )}
          {post.isArchived && (
            <span className="status-badge archived">Archived - No Replies</span>
          )}
        </div>

        <h1 className="post-detail-title">{post.title}</h1>

        <div className="post-author-info">
          <div className="author-avatar">
            {post.author?.profileImageURL ? (
              <img
                src={post.author.profileImageURL}
                alt={`${post.author.firstName} ${post.author.lastName}`}
              />
            ) : (
              <div className="avatar-placeholder">
                {post.author?.firstName?.[0] || "U"}
              </div>
            )}
          </div>
          <div className="author-details">
            <p className="author-name">
              {post.author?.firstName} {post.author?.lastName}
            </p>
            <p className="post-date">{formatDate(post.dateCreated)}</p>
            {post.dateModified &&
              post.dateModified !== post.dateCreated && (
                <p className="post-modified">
                  Last edited: {formatDate(post.dateModified)}
                </p>
              )}
          </div>
        </div>

        <div className="post-content">{post.content}</div>

        {/* Post Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="post-attachments">
            <h3>Attachments:</h3>
            <div className="attachments-list">
              {post.attachments.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attachment-link"
                >
                  📎 {getFileName(url)}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Replies Section */}
      <div className="replies-section">
        <h2 className="replies-title">
          Replies ({post.replyCount ?? total ?? replies.length})
        </h2>

        {/* Reply Form */}
        {isVerified() && post.status === "published" && !post.isArchived && (
          <div className="reply-form">
            <textarea
              className="reply-textarea"
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <div className="file-upload-section">
              <label className="file-upload-label">
                <input
                  type="file"
                  multiple
                  className="file-input"
                  onChange={handleReplyFileSelect}
                  disabled={uploadingFiles.length > 0}
                />
                {uploadingFiles.length > 0 ? "Uploading..." : "Add Files"}
              </label>
              {replyAttachments.length > 0 && (
                <div className="attachments-list">
                  {replyAttachments.map((url, index) => (
                    <div key={index} className="attachment-item">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        📎 {getFileName(url)}
                      </a>
                      <button
                        onClick={() => handleRemoveReplyAttachment(index)}
                        className="remove-attachment-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleCreateReply}
              disabled={!replyContent.trim() || uploadingFiles.length > 0}
              className="submit-reply-btn"
            >
              Post Reply
            </button>
          </div>
        )}

        {post.isArchived && (
          <div className="archived-notice">
            This post is archived. Replies are disabled.
          </div>
        )}

        {/* Replies List */}
        <div className="replies-list">
          {replies.length === 0 ? (
            <p className="no-replies">No replies yet. Be the first to reply!</p>
          ) : (
            replies.map((reply) => (
              <div key={reply.replyId} className="reply-item">
                <div className="reply-header">
                  <div className="reply-author">
                    <div className="author-avatar small">
                      {reply.user?.profileImageURL ? (
                        <img
                          src={reply.user.profileImageURL}
                          alt={`${reply.user.firstName} ${reply.user.lastName}`}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {reply.user?.firstName?.[0] || "U"}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="reply-author-name">
                        {reply.user?.firstName} {reply.user?.lastName}
                      </span>
                      <span className="reply-date">
                        {formatDate(reply.dateCreated)}
                      </span>
                    </div>
                  </div>
                  {(reply.userId === user?.userId || isOwner || isAdmin()) && (
                    <button
                      onClick={() => handleDeleteReply(reply.replyId)}
                      className="delete-reply-btn"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="reply-content">{reply.comment}</div>
                {reply.attachments && reply.attachments.length > 0 && (
                  <div className="reply-attachments">
                    {reply.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="attachment-link"
                      >
                        📎 {getFileName(url)}
                      </a>
                    ))}
                  </div>
                )}
                {isVerified() &&
                  post.status === "published" &&
                  !post.isArchived && (
                    <button
                      onClick={() =>
                        setReplyingTo(
                          replyingTo === reply.replyId ? null : reply.replyId
                        )
                      }
                      className="reply-btn"
                    >
                      {replyingTo === reply.replyId ? "Cancel" : "Reply"}
                    </button>
                  )}
                {replyingTo === reply.replyId && (
                  <div className="sub-reply-form">
                    <textarea
                      className="reply-textarea"
                      placeholder="Write a reply..."
                      value={subReplyContent[reply.replyId] || ""}
                      onChange={(e) =>
                        setSubReplyContent({
                          ...subReplyContent,
                          [reply.replyId]: e.target.value,
                        })
                      }
                    />
                    <div className="file-upload-section">
                      <label className="file-upload-label">
                        <input
                          type="file"
                          multiple
                          className="file-input"
                          onChange={(e) =>
                            handleSubReplyFileSelect(e, reply.replyId)
                          }
                          disabled={subReplyUploading[reply.replyId]?.length > 0}
                        />
                        {subReplyUploading[reply.replyId]?.length > 0
                          ? "Uploading..."
                          : "Add Files"}
                      </label>
                      {subReplyAttachments[reply.replyId]?.length > 0 && (
                        <div className="attachments-list">
                          {subReplyAttachments[reply.replyId].map(
                            (url, idx) => (
                              <div key={idx} className="attachment-item">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  📎 {getFileName(url)}
                                </a>
                                <button
                                  onClick={() =>
                                    handleRemoveSubReplyAttachment(
                                      reply.replyId,
                                      idx
                                    )
                                  }
                                  className="remove-attachment-btn"
                                >
                                  ×
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleCreateSubReply(reply.replyId)}
                      disabled={
                        !subReplyContent[reply.replyId]?.trim() ||
                        subReplyUploading[reply.replyId]?.length > 0
                      }
                      className="submit-reply-btn"
                    >
                      Post Reply
                    </button>
                  </div>
                )}
                {reply.replies && renderNestedReplies(reply.replies, 1)}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {replies.length > 0 && totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setReplyPage((prev) => Math.max(1, prev - 1))}
              disabled={replyPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            <div className="pagination-pages">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (replyPage <= 3) {
                  pageNum = i + 1;
                } else if (replyPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = replyPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setReplyPage(pageNum)}
                    className={`pagination-btn ${
                      replyPage === pageNum ? "active" : ""
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() =>
                setReplyPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={replyPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}

        {/* Page Info */}
        {replies.length > 0 && (
          <div className="page-info">
            Showing {((replyPage - 1) * repliesPerPage) + 1} to{" "}
            {Math.min(replyPage * repliesPerPage, total)} of {total} replies
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
