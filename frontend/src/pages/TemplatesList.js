import React, { useState, useEffect } from 'react';
import {Container, Card, Table, Button, Alert, Spinner, Modal, Form} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TemplatesList = () => {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // State for rename modal
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [templateToRename, setTemplateToRename] = useState(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Fetch templates from API
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get('/api/templates');
      setTemplates(response.data);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Error loading templates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle template deletion
  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    try {
      setDeleteLoading(true);

      await axios.delete(`/api/templates/${templateToDelete.id}`);

      // Remove deleted template from state
      setTemplates(templates.filter(t => t.id !== templateToDelete.id));

      // Close modal
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Error deleting template. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle template renaming
  const handleRenameClick = (template) => {
    setTemplateToRename(template);
    // Remove .docx extension if present for editing
    const baseName = template.originalName.replace(/\.docx$/i, '');
    setNewTemplateName(baseName);
    setShowRenameModal(true);
  };

  const confirmRename = async () => {
    if (!templateToRename || !newTemplateName.trim()) return;

    try {
      setRenameLoading(true);

      // Add .docx extension to the new name
      const newNameWithExtension = `${newTemplateName}.docx`;

      const response = await axios.patch(`/api/templates/${templateToRename.id}/rename`, {
        newName: newNameWithExtension
      });

      // Update template in state
      setTemplates(templates.map(t =>
        t.id === templateToRename.id
          ? { ...t, originalName: response.data.template.originalName }
          : t
      ));

      // Close modal
      setShowRenameModal(false);
      setTemplateToRename(null);
      setNewTemplateName('');
    } catch (err) {
      console.error('Error renaming template:', err);
      setError('Error renaming template. Please try again.');
    } finally {
      setRenameLoading(false);
    }
  };

  // Render loading spinner
  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="mt-4 contracts-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Templates</h2>
        <Button variant="primary" onClick={() => navigate('/upload')}>
          Upload New Template
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {templates.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <h4 className="mb-3">No templates found</h4>
            <p className="text-muted mb-4">Upload a template to get started</p>
            <Button variant="primary" onClick={() => navigate('/upload')}>
              Upload Template
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Template Name</th>
                  <th>Uploaded</th>
                  <th>Placeholders</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td>{template.originalName}</td>
                    <td>{formatDate(template.uploadDate)}</td>
                    <td>{template.placeholders.length}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => navigate(`/editor/${template.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleRenameClick(template)}
                      >
                        Rename
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(template)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the template
          <strong>{templateToDelete ? ` "${templateToDelete.originalName}"` : ''}?</strong>
          <p className="text-danger mt-2 mb-0">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleteLoading}>
            {deleteLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Deleting...</span>
              </>
            ) : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Rename Modal */}
      <Modal show={showRenameModal} onHide={() => setShowRenameModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Rename Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>New Template Name</Form.Label>
              <Form.Control
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Enter new template name"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRenameModal(false)} disabled={renameLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmRename} disabled={renameLoading || !newTemplateName.trim()}>
            {renameLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Renaming...</span>
              </>
            ) : 'Rename'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TemplatesList;
