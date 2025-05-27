import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UploadTemplate = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Validate file type and size
  const validateAndSetFile = (selectedFile) => {
    setError('');

    // Check if file exists
    if (!selectedFile) {
      return;
    }

    // Check file type
    if (!selectedFile.name.endsWith('.docx')) {
      setError('Only .docx files are supported.');
      return;
    }

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError('');

      const formData = new FormData();
      formData.append('template', file);

      const response = await axios.post('/api/templates', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      setSuccess(true);

      // Redirect to editor after short delay
      setTimeout(() => {
        navigate(`/editor/${response.data.id}`);
      }, 1500);

    } catch (err) {
      console.error('Upload error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error uploading template. Please try again.');
      }
      setIsUploading(false);
    }
  };

  return (
    <Container className="mt-4 upload-container">
      <h2 className="mb-4">Upload Template</h2>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          Template uploaded successfully! Redirecting to editor...
        </Alert>
      )}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <div
              className={`file-drop-area mb-4 ${isDragging ? 'active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input
                type="file"
                id="fileInput"
                accept=".docx"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {file ? (
                <div className="selected-file">
                  <p className="mb-0">Selected file: <strong>{file.name}</strong></p>
                  <p className="text-muted">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="mb-2">Drag and drop your .docx template here</p>
                  <p className="text-muted mb-2">or</p>
                  <Button variant="outline-primary" size="sm">
                    Browse Files
                  </Button>
                </div>
              )}
            </div>

            {isUploading && (
              <div className="mb-4">
                <ProgressBar
                  now={uploadProgress}
                  label={`${uploadProgress}%`}
                  animated
                />
              </div>
            )}

            <div className="d-grid gap-2">
              <Button
                variant="primary"
                type="submit"
                disabled={!file || isUploading || success}
              >
                {isUploading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Uploading...</span>
                  </>
                ) : 'Upload Template'}
              </Button>

              <Button
                variant="outline-secondary"
                onClick={() => navigate('/templates')}
                disabled={isUploading}
              >
                Back to Templates
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Header>
          <h4>Template Requirements</h4>
        </Card.Header>
        <Card.Body>
          <p>Upload a Word document (.docx) containing placeholders in the format:</p>
          <ul className="table-bordered text-success">
            <p2>Correct</p2>
            <li><code>{'{customer.company}'}</code> - Customer Data</li>
            <li><code>{'{performer.company}'}</code> - Performer Data</li>
            <li><code>{'{agreement.SubscriptionPrice}'}</code> - Agreement Data</li>
          </ul>
          <ul className="table-bordered text-danger">
            <p2>Incorrect</p2>
            <li><code>{'{customer. company}'}</code> - Customer Data</li>
            <li><code>{'{performer .company}'}</code> - Performer Data</li>
            <li><code>{'{ agreement . SubscriptionPrice }'}</code> - Agreement Data</li>
          </ul>
          <p>The system will automatically detect these placeholders and create form fields for them.</p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UploadTemplate;
