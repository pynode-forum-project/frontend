import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { postAPI, replyAPI, historyAPI, fileAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiMessageCircle,
  FiSend,
  FiLock,
  FiUnlock,
  FiEye,
  FiEyeOff,
  FiPaperclip,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCornerDownRight,
} from "react-icons/fi";
import CreatePostModal from "../components/CreatePostModal";
import Avatar from "../components/Avatar";

// Recursive component for nested replies
const NestedReplies = ({
  replies,
  depth = 1,
  post,
  isVerified,
  user,
  isOwner,
  isAdmin,
  replyingTo,
  setReplyingTo,
  subReplyContent,
  setSubReplyContent,
  subReplyAttachments,
  setSubReplyAttachments,
  subReplyFiles,
  setSubReplyFiles,
  subReplyUploading,
  handleSubReplyFileSelect,
  handleRemoveSubReplyAttachment,
  createSubReplyMutation,
  deleteReplyMutation,
  deleteNestedReplyMutation,
  formatDate,
  getFileName,
  parentReplyId, // Top-level reply ID
  path = [], // Path to this nested reply (array of indices)
  parentReply = null, // Parent reply object to show "replying to" info
}) => {
  const maxDepth = 5; // Limit nesting depth to prevent infinite nesting

  if (depth > maxDepth) {
    return null;
  }

  // Generate a unique key for nested replies using path
  const getReplyKey = (index) => {
    return `${parentReplyId}-${[...path, index].join("-")}`;
  };

  // For nested replies, we don't need additional marginLeft since the parent container already has ml-4
  // Each nested level will be indented by the parent's ml-4 and pl-4

  return (
    <div className="space-y-3">
      {replies.map((subReply, subIndex) => {
        const replyKey = getReplyKey(subIndex);
        const currentPath = [...path, subIndex];
        const isReplying = replyingTo === replyKey;

        return (
          <div key={replyKey} className="bg-white/5 rounded-lg p-3 relative">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Show "Replying to @username" if this is a nested reply */}
                {parentReply && parentReply.user && (
                  <div className="mb-3 text-xs flex items-center gap-2 bg-primary-500/20 px-3 py-1.5 rounded-lg w-fit border border-primary-500/40 shadow-lg">
                    <FiCornerDownRight className="w-4 h-4 text-primary-400 flex-shrink-0" />
                    <span className="text-gray-300">Replying to</span>
                    <span className="text-primary-200 font-bold">
                      {parentReply.user.firstName} {parentReply.user.lastName}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <Avatar
                    profileImageUrl={subReply.user?.profileImageUrl}
                    firstName={subReply.user?.firstName}
                    lastName={subReply.user?.lastName}
                    size="w-6 h-6"
                  />
                  <div>
                    <p className="text-white font-medium text-xs">
                      {subReply.user?.firstName} {subReply.user?.lastName}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {subReply.dateCreated
                        ? formatDate(subReply.dateCreated)
                        : "Unknown date"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delete button for nested replies */}
              {(subReply.userId === user?.userId || isOwner || isAdmin()) && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this reply?",
                      )
                    ) {
                      deleteNestedReplyMutation.mutate({
                        parentReplyId: parentReplyId,
                        targetPath: currentPath,
                      });
                    }
                  }}
                  className="text-gray-500 hover:text-red-400 transition-colors ml-2"
                  title="Delete reply"
                >
                  <FiTrash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-gray-300 text-sm mb-2">{subReply.comment}</p>

            {/* Sub-reply Attachments */}
            {subReply.attachments && subReply.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {subReply.attachments.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-xs bg-white/5 rounded p-1.5 transition-colors"
                  >
                    <FiPaperclip className="w-2.5 h-2.5" />
                    {getFileName(url)}
                  </a>
                ))}
              </div>
            )}

            {/* Reply button for nested replies */}
            {isVerified() &&
              post.status === "published" &&
              !post.isArchived &&
              depth < maxDepth && (
                <button
                  onClick={() => setReplyingTo(isReplying ? null : replyKey)}
                  className="mt-2 text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
                >
                  <FiCornerDownRight className="w-3 h-3" />
                  {isReplying ? "Cancel" : "Reply"}
                </button>
              )}

            {/* Sub-reply form for nested replies */}
            {isReplying && (
              <div className="mt-3 ml-3 pl-3 border-l-2 border-primary-500/20 space-y-2">
                <textarea
                  className="input-field min-h-[70px] resize-y text-xs"
                  placeholder={`Reply to ${subReply.user?.firstName}...`}
                  value={subReplyContent[replyKey] || ""}
                  onChange={(e) =>
                    setSubReplyContent({
                      ...subReplyContent,
                      [replyKey]: e.target.value,
                    })
                  }
                />

                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleSubReplyFileSelect(e, replyKey)}
                      disabled={subReplyUploading[replyKey]?.length > 0}
                    />
                    <div className="btn-secondary flex items-center gap-1 w-fit text-xs px-2 py-1">
                      <FiPaperclip className="w-2.5 h-2.5" />
                      {subReplyUploading[replyKey]?.length > 0
                        ? "Uploading..."
                        : "Files"}
                    </div>
                  </label>

                  {subReplyAttachments[replyKey]?.length > 0 && (
                    <div className="space-y-1">
                      {subReplyAttachments[replyKey].map((url, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white/5 rounded p-1.5"
                        >
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-400 hover:text-primary-300 text-xs flex items-center gap-1 flex-1"
                          >
                            <FiPaperclip className="w-2 h-2" />
                            {getFileName(url)}
                          </a>
                          <button
                            onClick={() =>
                              handleRemoveSubReplyAttachment(replyKey, index)
                            }
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <FiXCircle className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    createSubReplyMutation.mutate({
                      replyId: parentReplyId, // Use parent reply ID
                      comment: subReplyContent[replyKey] || "",
                      attachments: subReplyAttachments[replyKey] || [],
                      postId: post.postId,
                      parentReplyId: parentReplyId,
                      targetPath: currentPath, // Pass the path to locate the target reply
                    })
                  }
                  disabled={
                    !subReplyContent[replyKey]?.trim() ||
                    createSubReplyMutation.isPending
                  }
                  className="btn-primary flex items-center gap-1 text-xs px-3 py-1.5"
                >
                  {createSubReplyMutation.isPending ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiSend className="w-2.5 h-2.5" /> Reply
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Recursively render nested replies */}
            {subReply.replies && subReply.replies.length > 0 && (
              <div className="mt-4 ml-4 pl-4 border-l-2 border-primary-500/40">
                <NestedReplies
                  replies={subReply.replies}
                  depth={depth + 1}
                  post={post}
                  isVerified={isVerified}
                  user={user}
                  isOwner={isOwner}
                  isAdmin={isAdmin}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  subReplyContent={subReplyContent}
                  setSubReplyContent={setSubReplyContent}
                  subReplyAttachments={subReplyAttachments}
                  setSubReplyAttachments={setSubReplyAttachments}
                  subReplyFiles={subReplyFiles}
                  setSubReplyFiles={setSubReplyFiles}
                  subReplyUploading={subReplyUploading}
                  handleSubReplyFileSelect={handleSubReplyFileSelect}
                  handleRemoveSubReplyAttachment={
                    handleRemoveSubReplyAttachment
                  }
                  createSubReplyMutation={createSubReplyMutation}
                  deleteReplyMutation={deleteReplyMutation}
                  deleteNestedReplyMutation={deleteNestedReplyMutation}
                  formatDate={formatDate}
                  getFileName={getFileName}
                  parentReplyId={parentReplyId}
                  path={currentPath}
                  parentReply={subReply}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isVerified, isAdmin } = useAuthStore();
  const [replyContent, setReplyContent] = useState("");
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [replyPage, setReplyPage] = useState(1);
  const repliesPerPage = 10;
  const [replyingTo, setReplyingTo] = useState(null); // For nested replies
  const [subReplyContent, setSubReplyContent] = useState({}); // { replyId: content }
  const [subReplyAttachments, setSubReplyAttachments] = useState({}); // { replyId: [urls] }
  const [subReplyFiles, setSubReplyFiles] = useState({}); // { replyId: [files] }
  const [subReplyUploading, setSubReplyUploading] = useState({}); // { replyId: [filenames] }

  // Fetch post
  const { data: postData, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => postAPI.getById(id),
  });

  // Fetch replies with pagination
  const { data: repliesData } = useQuery({
    queryKey: ["replies", id, replyPage],
    queryFn: () =>
      replyAPI.getByPost(id, { page: replyPage, limit: repliesPerPage }),
  });

  // Record view history
  useEffect(() => {
    if (postData?.data?.post) {
      historyAPI.record(id).catch(() => {});
    }
  }, [id, postData]);

  const post = postData?.data?.post;
  const replies = repliesData?.data?.replies || [];
  const repliesTopLevelPages =
    repliesData?.data?.topLevelPages ?? repliesData?.data?.totalPages ?? 1;
  const repliesTopLevelTotal =
    repliesData?.data?.topLevelTotal ?? repliesData?.data?.total ?? 0;
  const repliesTotalAll = repliesData?.data?.total ?? repliesTopLevelTotal ?? 0;
  const isOwner = post?.userId === user?.userId;

  // Mutations
  const createReplyMutation = useMutation({
    mutationFn: () => replyAPI.create(id, replyContent, replyAttachments),
    onSuccess: () => {
      queryClient.invalidateQueries(["replies", id]);
      setReplyContent("");
      setReplyAttachments([]);
      setSelectedFiles([]);
      toast.success("Reply posted!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to post reply");
    },
  });

  const handleReplyFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFiles(files.map((f) => f.name));

    try {
      const uploadPromises = files.map((file) =>
        fileAPI.upload(file, "attachment").then((res) => res.data.url),
      );

      const urls = await Promise.all(uploadPromises);
      setReplyAttachments([...replyAttachments, ...urls]);
      setSelectedFiles([...selectedFiles, ...files]);
      setUploadingFiles([]);
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error) {
      toast.error("Failed to upload file(s)");
      setUploadingFiles([]);
    }
  };

  const handleRemoveReplyAttachment = (index) => {
    setReplyAttachments(replyAttachments.filter((_, i) => i !== index));
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const getFileName = (url) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      return decodeURIComponent(pathParts[pathParts.length - 1]);
    } catch {
      return url.split("/").pop() || "attachment";
    }
  };

  const deletePostMutation = useMutation({
    mutationFn: () => postAPI.delete(id),
    onSuccess: () => {
      toast.success("Post deleted");
      navigate("/home");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => postAPI.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["post", id]);
      toast.success(post.isArchived ? "Replies enabled" : "Replies disabled");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => postAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(["post", id]);
      toast.success("Post visibility updated");
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (replyId) => replyAPI.delete(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries(["replies", id]);
      queryClient.invalidateQueries(["post", id]);
      toast.success("Reply deleted");
    },
  });

  // Delete nested reply mutation
  const deleteNestedReplyMutation = useMutation({
    mutationFn: ({ parentReplyId, targetPath }) =>
      replyAPI.deleteNested(parentReplyId, targetPath),
    onSuccess: () => {
      queryClient.invalidateQueries(["replies", id]);
      queryClient.invalidateQueries(["post", id]);
      toast.success("Reply deleted");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to delete reply");
    },
  });

  // Create sub-reply mutation
  const createSubReplyMutation = useMutation({
    mutationFn: ({
      replyId,
      comment,
      attachments,
      postId,
      parentReplyId,
      targetPath,
    }) =>
      replyAPI.createSubReply(
        replyId,
        comment,
        attachments,
        postId,
        parentReplyId,
        targetPath,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries(["replies", id]);
      queryClient.invalidateQueries(["post", id]);
      setReplyingTo(null);
      setSubReplyContent({});
      setSubReplyAttachments({});
      setSubReplyFiles({});
      toast.success("Reply posted!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to post reply");
    },
  });

  // Handle sub-reply file upload
  const handleSubReplyFileSelect = async (e, replyId) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSubReplyUploading((prev) => ({
      ...prev,
      [replyId]: files.map((f) => f.name),
    }));

    try {
      const uploadPromises = files.map((file) =>
        fileAPI.upload(file, "attachment").then((res) => res.data.url),
      );

      const urls = await Promise.all(uploadPromises);
      setSubReplyAttachments((prev) => ({
        ...prev,
        [replyId]: [...(prev[replyId] || []), ...urls],
      }));
      setSubReplyFiles((prev) => ({
        ...prev,
        [replyId]: [...(prev[replyId] || []), ...files],
      }));
      setSubReplyUploading((prev) => {
        const newState = { ...prev };
        delete newState[replyId];
        return newState;
      });
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error) {
      toast.error("Failed to upload file(s)");
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
    setSubReplyFiles((prev) => ({
      ...prev,
      [replyId]: (prev[replyId] || []).filter((_, i) => i !== index),
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="card p-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Post not found</h2>
        <p className="text-gray-400 mb-4">
          This post may have been deleted or you don't have access.
        </p>
        <button onClick={() => navigate("/home")} className="btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate("/home")}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <FiArrowLeft />
        Back to Home
      </button>

      {/* Post */}
      <div className="card p-8 mb-6 animate-fade-in">
        {/* Status badges */}
        <div className="flex gap-2 mb-4">
          {post.status === "banned" && (
            <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-sm">
              Banned
            </span>
          )}
          {post.status === "hidden" && (
            <span className="bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full text-sm">
              Hidden
            </span>
          )}
          {post.status === "deleted" && (
            <span className="bg-gray-500/10 text-gray-400 px-3 py-1 rounded-full text-sm">
              Deleted
            </span>
          )}
          {post.isArchived && (
            <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-sm">
              Archived - No Replies
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">{post.title}</h1>

        {/* Author info */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
          <Avatar
            profileImageUrl={post.user?.profileImageUrl}
            firstName={post.user?.firstName}
            lastName={post.user?.lastName}
            size="w-12 h-12"
          />
          <div>
            <p className="text-white font-medium">
              {post.user?.firstName} {post.user?.lastName}
            </p>
            <p className="text-gray-400 text-sm">
              {formatDate(post.dateCreated)}
            </p>
            {post.dateModified && (
              <p className="text-gray-500 text-xs">
                Last edited: {formatDate(post.dateModified)}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-gray-300 whitespace-pre-wrap mb-6">
          {post.content}
        </div>

        {/* Post Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mb-6 space-y-2">
            <h3 className="text-sm font-medium text-gray-400">Attachments:</h3>
            <div className="space-y-2">
              {post.attachments.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm bg-white/5 rounded-lg p-3 transition-colors"
                >
                  <FiPaperclip className="w-4 h-4" />
                  {getFileName(url)}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Owner/Admin actions */}
        {(isOwner || isAdmin()) && post.status !== "deleted" && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
            {isOwner && post.status !== "banned" && (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <FiEdit2 /> Edit
                </button>
                <button
                  onClick={() => archiveMutation.mutate()}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  {post.isArchived ? <FiUnlock /> : <FiLock />}
                  {post.isArchived ? "Enable Replies" : "Disable Replies"}
                </button>
                <button
                  onClick={() =>
                    updateStatusMutation.mutate(
                      post.status === "hidden" ? "published" : "hidden",
                    )
                  }
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  {post.status === "hidden" ? <FiEye /> : <FiEyeOff />}
                  {post.status === "hidden" ? "Show Post" : "Hide Post"}
                </button>
              </>
            )}
            {isOwner && (
              <button
                onClick={() => deletePostMutation.mutate()}
                className="btn-danger flex items-center gap-2 text-sm"
              >
                <FiTrash2 /> Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Replies Section */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <FiMessageCircle />
          Replies ({post?.replyCount ?? repliesTotalAll ?? replies.length})
        </h2>

        {/* Reply form */}
        {isVerified() && post.status === "published" && !post.isArchived && (
          <div className="mb-6 space-y-3">
            <textarea
              className="input-field min-h-[100px] resize-y"
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />

            {/* File upload for reply */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleReplyFileSelect}
                  disabled={uploadingFiles.length > 0}
                />
                <div className="btn-secondary flex items-center gap-2 w-fit text-sm">
                  <FiPaperclip />
                  {uploadingFiles.length > 0 ? "Uploading..." : "Add Files"}
                </div>
              </label>

              {/* Uploading indicator */}
              {uploadingFiles.length > 0 && (
                <div className="text-sm text-gray-400">
                  Uploading: {uploadingFiles.join(", ")}
                </div>
              )}

              {/* Attachments list */}
              {replyAttachments.length > 0 && (
                <div className="space-y-2">
                  {replyAttachments.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-2"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-2 flex-1"
                      >
                        <FiPaperclip className="w-3 h-3" />
                        {getFileName(url)}
                      </a>
                      <button
                        onClick={() => handleRemoveReplyAttachment(index)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <FiXCircle className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => createReplyMutation.mutate()}
              disabled={!replyContent.trim() || createReplyMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {createReplyMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiSend /> Post Reply
                </>
              )}
            </button>
          </div>
        )}

        {post.isArchived && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6 text-yellow-400">
            This post is archived. Replies are disabled.
          </div>
        )}

        {/* Replies list */}
        <div className="space-y-4">
          {replies.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No replies yet. Be the first to reply!
            </p>
          ) : (
            replies.map((reply) => (
              <div key={reply.replyId} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar
                      profileImageUrl={reply.user?.profileImageUrl}
                      firstName={reply.user?.firstName}
                      lastName={reply.user?.lastName}
                      size="w-8 h-8"
                    />
                    <div>
                      <p className="text-white font-medium text-sm">
                        {reply.user?.firstName} {reply.user?.lastName}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {formatDate(reply.dateCreated)}
                      </p>
                    </div>
                  </div>

                  {/* Delete button for reply owner, post owner, or admin */}
                  {(reply.userId === user?.userId || isOwner || isAdmin()) && (
                    <button
                      onClick={() => deleteReplyMutation.mutate(reply.replyId)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-gray-300 mb-3">{reply.comment}</p>

                {/* Reply Attachments */}
                {reply.attachments && reply.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {reply.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm bg-white/5 rounded-lg p-2 transition-colors"
                      >
                        <FiPaperclip className="w-3 h-3" />
                        {getFileName(url)}
                      </a>
                    ))}
                  </div>
                )}

                {/* Reply button */}
                {isVerified() &&
                  post.status === "published" &&
                  !post.isArchived && (
                    <button
                      onClick={() =>
                        setReplyingTo(
                          replyingTo === reply.replyId ? null : reply.replyId,
                        )
                      }
                      className="mt-3 text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
                    >
                      <FiCornerDownRight className="w-3 h-3" />
                      {replyingTo === reply.replyId ? "Cancel" : "Reply"}
                    </button>
                  )}

                {/* Sub-reply form */}
                {replyingTo === reply.replyId && (
                  <div className="mt-4 ml-4 pl-4 border-l-2 border-primary-500/30 space-y-3">
                    <textarea
                      className="input-field min-h-[80px] resize-y text-sm"
                      placeholder={`Reply to ${reply.user?.firstName}...`}
                      value={subReplyContent[reply.replyId] || ""}
                      onChange={(e) =>
                        setSubReplyContent({
                          ...subReplyContent,
                          [reply.replyId]: e.target.value,
                        })
                      }
                    />

                    {/* File upload for sub-reply */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) =>
                            handleSubReplyFileSelect(e, reply.replyId)
                          }
                          disabled={
                            subReplyUploading[reply.replyId]?.length > 0
                          }
                        />
                        <div className="btn-secondary flex items-center gap-2 w-fit text-xs">
                          <FiPaperclip />
                          {subReplyUploading[reply.replyId]?.length > 0
                            ? "Uploading..."
                            : "Add Files"}
                        </div>
                      </label>

                      {/* Uploading indicator */}
                      {subReplyUploading[reply.replyId]?.length > 0 && (
                        <div className="text-xs text-gray-400">
                          Uploading:{" "}
                          {subReplyUploading[reply.replyId].join(", ")}
                        </div>
                      )}

                      {/* Attachments list */}
                      {subReplyAttachments[reply.replyId]?.length > 0 && (
                        <div className="space-y-2">
                          {subReplyAttachments[reply.replyId].map(
                            (url, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-white/5 rounded-lg p-2"
                              >
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-400 hover:text-primary-300 text-xs flex items-center gap-2 flex-1"
                                >
                                  <FiPaperclip className="w-3 h-3" />
                                  {getFileName(url)}
                                </a>
                                <button
                                  onClick={() =>
                                    handleRemoveSubReplyAttachment(
                                      reply.replyId,
                                      index,
                                    )
                                  }
                                  className="text-gray-400 hover:text-red-400 transition-colors"
                                >
                                  <FiXCircle className="w-3 h-3" />
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        createSubReplyMutation.mutate({
                          replyId: reply.replyId,
                          comment: subReplyContent[reply.replyId] || "",
                          attachments: subReplyAttachments[reply.replyId] || [],
                          postId: post.postId,
                        })
                      }
                      disabled={
                        !subReplyContent[reply.replyId]?.trim() ||
                        createSubReplyMutation.isPending
                      }
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      {createSubReplyMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <FiSend className="w-3 h-3" /> Post Reply
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Recursive nested replies component */}
                {reply.replies && reply.replies.length > 0 && (
                  <div className="mt-4 ml-4 pl-4 border-l-2 border-primary-500/40">
                    <NestedReplies
                      replies={reply.replies}
                      depth={1}
                      post={post}
                      isVerified={isVerified}
                      user={user}
                      isOwner={isOwner}
                      isAdmin={isAdmin}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      subReplyContent={subReplyContent}
                      setSubReplyContent={setSubReplyContent}
                      subReplyAttachments={subReplyAttachments}
                      setSubReplyAttachments={setSubReplyAttachments}
                      subReplyFiles={subReplyFiles}
                      setSubReplyFiles={setSubReplyFiles}
                      subReplyUploading={subReplyUploading}
                      handleSubReplyFileSelect={handleSubReplyFileSelect}
                      handleRemoveSubReplyAttachment={
                        handleRemoveSubReplyAttachment
                      }
                      createSubReplyMutation={createSubReplyMutation}
                      deleteReplyMutation={deleteReplyMutation}
                      deleteNestedReplyMutation={deleteNestedReplyMutation}
                      formatDate={formatDate}
                      getFileName={getFileName}
                      parentReplyId={reply.replyId}
                      path={[]}
                      parentReply={reply}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {replies.length > 0 && repliesTopLevelPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setReplyPage((prev) => Math.max(1, prev - 1))}
              disabled={replyPage === 1}
              className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from(
                { length: Math.min(5, repliesTopLevelPages) },
                (_, i) => {
                  let pageNum;
                  if (repliesTopLevelPages <= 5) {
                    pageNum = i + 1;
                  } else if (replyPage <= 3) {
                    pageNum = i + 1;
                  } else if (replyPage >= repliesTopLevelPages - 2) {
                    pageNum = repliesTopLevelPages - 4 + i;
                  } else {
                    pageNum = replyPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setReplyPage(pageNum)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        replyPage === pageNum
                          ? "bg-primary-500 text-white"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                },
              )}
            </div>

            <button
              onClick={() =>
                setReplyPage((prev) => Math.min(repliesTopLevelPages, prev + 1))
              }
              disabled={replyPage === repliesTopLevelPages}
              className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Info */}
        {replies.length > 0 && (
          <div className="text-center text-gray-400 text-sm mt-4">
            Showing {(replyPage - 1) * repliesPerPage + 1} to{" "}
            {Math.min(replyPage * repliesPerPage, repliesTopLevelTotal)} of{" "}
            {repliesTopLevelTotal} floors
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <CreatePostModal
          onClose={() => setShowEditModal(false)}
          editPost={post}
        />
      )}
    </div>
  );
};

export default PostDetailPage;
