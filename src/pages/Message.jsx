import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { sendMessage, getMessages } from "../services/messageApi";
import { uploadFile } from "../services/fileApi";
import "./Message.css";

const Message = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && (user?.type === "admin" || user?.type === "superadmin")) {
      loadMessages();
    }
  }, [isAuthenticated, user]);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMessages(1, 20);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = files.map(file => uploadFile(file));
      const urls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...urls]);
    } catch (err) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleAttachmentChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = files.map(file => uploadFile(file));
      const urls = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...urls]);
    } catch (err) {
      setError(err.message || "Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !message) {
      setError("Email and message are required");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        email,
        message,
        userId: user?.userId || null
      };

      if (images.length > 0) {
        payload.images = images;
      }
      if (attachments.length > 0) {
        payload.attachments = attachments;
      }

      const result = await sendMessage(payload);

      if (result.ok) {
        setSuccess("Message sent successfully!");
        setMessage("");
        setImages([]);
        setAttachments([]);
        if (isAuthenticated && (user?.type === "admin" || user?.type === "superadmin")) {
          loadMessages();
        }
      } else {
        setError(result.body?.message || "Failed to send message");
      }
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="message-container">
        <p>Please log in to view messages.</p>
      </div>
    );
  }

  const isAdmin = user?.type === "admin" || user?.type === "superadmin";

  return (
    <div className="message-container">
      <h1>Messages</h1>

      <div className="message-content">
        <div className="message-form-section">
          <h2>Send a Message</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!user?.email}
                required
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="6"
                required
              />
            </div>

            <div className="form-group">
              <label>Images (optional)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                disabled={uploading}
              />
              {images.length > 0 && (
                <div className="file-list">
                  {images.map((url, index) => (
                    <div key={index} className="file-item">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {url}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="btn-remove"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Attachments (optional)</label>
              <input
                type="file"
                multiple
                onChange={handleAttachmentChange}
                disabled={uploading}
              />
              {attachments.length > 0 && (
                <div className="file-list">
                  {attachments.map((url, index) => (
                    <div key={index} className="file-item">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {url}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="btn-remove"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {uploading && <p>Uploading files...</p>}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {isAdmin && (
          <div className="message-list-section">
            <h2>Inbox</h2>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p>{error}</p>
            ) : messages.length === 0 ? (
              <p>No messages found.</p>
            ) : (
              <div className="message-list">
                {messages.map((msg) => (
                  <div key={msg.messageId} className="message-item">
                    <div className="message-header">
                      <span className="message-email">{msg.email}</span>
                      <span className="message-status">{msg.status}</span>
                    </div>
                    <p className="message-text">{msg.message}</p>
                    {msg.images && msg.images.length > 0 && (
                      <div className="message-files">
                        <strong>Images:</strong>
                        <ul>
                          {msg.images.map((img, idx) => (
                            <li key={idx}>
                              <a href={img} target="_blank" rel="noopener noreferrer">
                                {img}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="message-files">
                        <strong>Attachments:</strong>
                        <ul>
                          {msg.attachments.map((att, idx) => (
                            <li key={idx}>
                              <a href={att} target="_blank" rel="noopener noreferrer">
                                {att}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <span className="message-date">
                      {new Date(msg.dateCreated).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
