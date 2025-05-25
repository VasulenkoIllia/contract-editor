import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Form, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';

const CounterpartiesList = () => {
  const [counterparties, setCounterparties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State for modal
  const [showModal, setShowModal] = useState(false);
  const [editingCounterparty, setEditingCounterparty] = useState(null);
  const [formData, setFormData] = useState({
    company: '',
    director: '',
    documentName: '',
    address: '',
    bankAccount: '',
    bank: '',
    bankCode: '',
    code: '',
    individualCode: ''
  });

  // Fetch counterparties
  const fetchCounterparties = async (search = '') => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/counterparties${search ? `?search=${search}` : ''}`);
      setCounterparties(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch counterparties. Please try again later.');
      console.error('Error fetching counterparties:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load counterparties on component mount
  useEffect(() => {
    fetchCounterparties();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchCounterparties(searchTerm);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Open modal for adding a new counterparty
  const handleAddNew = () => {
    setEditingCounterparty(null);
    setFormData({
      company: '',
      director: '',
      documentName: '',
      address: '',
      bankAccount: '',
      bank: '',
      bankCode: '',
      code: '',
      individualCode: ''
    });
    setShowModal(true);
  };

  // Open modal for editing an existing counterparty
  const handleEdit = (counterparty) => {
    setEditingCounterparty(counterparty);
    setFormData({
      company: counterparty.company || '',
      director: counterparty.director || '',
      documentName: counterparty.documentName || '',
      address: counterparty.address || '',
      bankAccount: counterparty.bankAccount || '',
      bank: counterparty.bank || '',
      bankCode: counterparty.bankCode || '',
      code: counterparty.code || '',
      individualCode: counterparty.individualCode || ''
    });
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCounterparty) {
        // Update existing counterparty
        await axios.post(`/api/counterparties`, {
          ...formData,
          id: editingCounterparty.id
        });
      } else {
        // Create new counterparty
        await axios.post('/api/counterparties', formData);
      }

      // Close modal and refresh list
      setShowModal(false);
      fetchCounterparties(searchTerm);
    } catch (err) {
      setError('Failed to save counterparty. Please try again.');
      console.error('Error saving counterparty:', err);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this counterparty?')) {
      try {
        await axios.delete(`/api/counterparties/${id}`);
        fetchCounterparties(searchTerm);
      } catch (err) {
        setError('Failed to delete counterparty. Please try again.');
        console.error('Error deleting counterparty:', err);
      }
    }
  };

  return (
    <Container>
      <h1 className="mb-4">Counterparties</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-3">
        <Col md={6}>
          <Form onSubmit={handleSearch}>
            <Form.Group as={Row}>
              <Col sm={8}>
                <Form.Control
                  type="text"
                  placeholder="Search by company name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col sm={4}>
                <Button type="submit" variant="primary">Search</Button>
              </Col>
            </Form.Group>
          </Form>
        </Col>
        <Col md={6} className="text-end">
          <Button variant="success" onClick={handleAddNew}>Add New Counterparty</Button>
        </Col>
      </Row>

      {loading ? (
        <p>Loading counterparties...</p>
      ) : counterparties.length === 0 ? (
        <p>No counterparties found. Add a new one to get started.</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Company</th>
              <th>Director</th>
              <th>Address</th>
              <th>Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {counterparties.map((counterparty) => (
              <tr key={counterparty.id}>
                <td>{counterparty.company}</td>
                <td>{counterparty.director}</td>
                <td>{counterparty.address}</td>
                <td>{counterparty.code}</td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(counterparty)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(counterparty.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingCounterparty ? 'Edit Counterparty' : 'Add New Counterparty'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Company Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Director</Form.Label>
                  <Form.Control
                    type="text"
                    name="director"
                    value={formData.director}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Document Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="documentName"
                    value={formData.documentName}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Bank Account</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankAccount"
                    value={formData.bankAccount}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Bank</Form.Label>
                  <Form.Control
                    type="text"
                    name="bank"
                    value={formData.bank}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Bank Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankCode"
                    value={formData.bankCode}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Individual Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="individualCode"
                    value={formData.individualCode}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default CounterpartiesList;
