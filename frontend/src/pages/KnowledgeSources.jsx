
import { useEffect, useState } from "react";
import "./KnowledgeSources.css";
import api from "../services/api";

const KnowledgeSources = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [sourceType, setSourceType] = useState("website");

  const [name, setName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Fetch knowledge sources
  const fetchSources = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/knowledge");

      console.log("Knowledge API Response:", response.data);

      if (response.data.success) {
        setSources(response.data.data || []);
      } else {
        setError("Unable to fetch knowledge sources.");
      }
    } catch (err) {
      console.error("Knowledge Sources Error:", err);
      setError(
        err.response?.data?.message ||
        "Unable to load knowledge sources."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  // Close modal
  const closeModal = () => {
    if (isSubmitting) return;

    setShowModal(false);
    setName("");
    setSourceUrl("");
    setSelectedFile(null);
    setSourceType("website");
    setFormError("");
  };

  // Add website or PDF
  const handleAddSource = async () => {
    setFormError("");

    if (!name.trim()) {
      setFormError("Please enter a source name.");
      return;
    }

    if (sourceType === "website" && !sourceUrl.trim()) {
      setFormError("Please enter a website URL.");
      return;
    }

    if (sourceType === "pdf" && !selectedFile) {
      setFormError("Please select a PDF file.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (sourceType === "website") {
        await api.post("/knowledge", {
          name: name.trim(),
          sourceUrl: sourceUrl.trim(),
        });
      } else {
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("file", selectedFile);

        await api.post("/knowledge/upload-pdf", formData);
      }

      closeModalAfterSuccess();
      await fetchSources();
    } catch (err) {
      console.error("Add Source Error:", err);
      setFormError(
        err.response?.data?.message ||
        "Unable to add knowledge source."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModalAfterSuccess = () => {
    setShowModal(false);
    setName("");
    setSourceUrl("");
    setSelectedFile(null);
    setSourceType("website");
    setFormError("");
  };

  // Delete knowledge source
  const handleDeleteSource = async (sourceId, sourceName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${sourceName}"?`
    );

    if (!confirmed) return;

    setDeletingId(sourceId);

    try {
      await api.delete(`/knowledge/${sourceId}`);

      setSources((previousSources) =>
        previousSources.filter(
          (source) => source._id !== sourceId
        )
      );
    } catch (err) {
      console.error("Delete Source Error:", err);

      alert(
        err.response?.data?.message ||
        "Unable to delete knowledge source."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="knowledge-page">
      <div className="knowledge-header">
        <div>
          <p>WORKSPACE / KNOWLEDGE</p>
          <h1>Knowledge Sources</h1>
          <span>
            Manage the information your AI assistant learns from.
          </span>
        </div>

        <button
          className="add-source-btn"
          onClick={() => setShowModal(true)}
        >
          + Add Source
        </button>
      </div>

      {/* Summary cards */}
      <div className="knowledge-summary">
        <div>
          <span>Total Sources</span>
          <h2>{sources.length}</h2>
        </div>

        <div>
          <span>Completed</span>
          <h2>
            {sources.filter(
              (source) => source.status === "completed"
            ).length}
          </h2>
        </div>
      </div>

      {/* Sources list */}
      <div className="sources-container">
        <div className="sources-heading">
          <h2>Your Sources</h2>
          <span>{sources.length} sources</span>
        </div>

        {loading && <p>Loading knowledge sources...</p>}

        {error && (
          <p className="knowledge-error">{error}</p>
        )}

        {!loading && !error && sources.length === 0 && (
          <div className="empty-sources">
            <h3>No knowledge sources yet</h3>
            <p>Add a website or PDF to train your AI assistant.</p>
          </div>
        )}

        {!loading && !error && sources.length > 0 && (
          <div className="sources-list">
            {sources.map((source) => (
              <div className="source-item" key={source._id}>
                <div className="source-icon">
                  {source.type === "pdf" ? "PDF" : "WEB"}
                </div>

                <div className="source-info">
                  <h3>{source.name}</h3>
                  <p>{source.sourceUrl || "PDF Document"}</p>
                </div>

                <span className={`source-status ${source.status}`}>
                  {source.status}
                </span>

                <button
                  className="delete-source-btn"
                  onClick={() =>
                    handleDeleteSource(source._id, source.name)
                  }
                  disabled={deletingId === source._id}
                >
                  {deletingId === source._id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Source Modal */}
      {showModal && (
        <div className="source-modal-overlay">
          <div className="source-modal">
            <div className="source-modal-header">
              <div>
                <h2>Add Knowledge Source</h2>
                <p>Choose how you want to add knowledge.</p>
              </div>

              <button
                className="modal-close-btn"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>

            <div className="source-type-options">
              <button
                className={sourceType === "website" ? "selected" : ""}
                onClick={() => setSourceType("website")}
                disabled={isSubmitting}
              >
                🌐 Website
              </button>

              <button
                className={sourceType === "pdf" ? "selected" : ""}
                onClick={() => setSourceType("pdf")}
                disabled={isSubmitting}
              >
                📄 PDF Document
              </button>
            </div>

            <div className="modal-form-group">
              <label>Source Name</label>
              <input
                type="text"
                placeholder="e.g. Company Website"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {sourceType === "website" ? (
              <div className="modal-form-group">
                <label>Website URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
              </div>
            ) : (
              <div className="modal-form-group">
                <label>Upload PDF</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) =>
                    setSelectedFile(e.target.files?.[0] || null)
                  }
                />
              </div>
            )}

            {formError && (
              <p className="knowledge-error">{formError}</p>
            )}

            <div className="modal-actions">
              <button
                className="modal-cancel-btn"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                className="modal-submit-btn"
                onClick={handleAddSource}
                disabled={
                  isSubmitting ||
                  !name.trim() ||
                  (sourceType === "website"
                    ? !sourceUrl.trim()
                    : !selectedFile)
                }
              >
                {isSubmitting ? "Adding..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeSources;
