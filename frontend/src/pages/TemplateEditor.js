import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert, Spinner, Card, InputGroup, FormControl, ListGroup, Modal } from 'react-bootstrap';
import axios from 'axios';

const TemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewPdfUrl, setPreviewPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState('edit'); // 'edit', 'final', or 'xodo'
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilename, setExportFilename] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Counterparty state
  const [counterparties, setCounterparties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedPerformer, setSelectedPerformer] = useState(null);
  const searchTimeoutRef = useRef(null);

  // New counterparty form state
  const [newCounterpartyForm, setNewCounterpartyForm] = useState({
    genericName: '',
    signatureName: '',
    company: '',
    director: '',
    documentName: '',
    address: '',
    postAddress: '',
    phone: '',
    email: '',
    bankAccount: '',
    bank: '',
    bankCode: '',
    code: '',
    individualCode: ''
  });
  const [createCounterpartyLoading, setCreateCounterpartyLoading] = useState(false);
  const [createCounterpartyError, setCreateCounterpartyError] = useState('');
  const [createCounterpartySuccess, setCreateCounterpartySuccess] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEntitySelectionModal, setShowEntitySelectionModal] = useState(false);
  const [showCreateCounterpartyModal, setShowCreateCounterpartyModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null); // 'customer' or 'performer'

  // Cleanup PDF URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewPdfUrl) {
        window.URL.revokeObjectURL(previewPdfUrl);
      }
    };
  }, [previewPdfUrl]);

  // Fetch counterparties
  useEffect(() => {
    const fetchCounterparties = async () => {
      try {
        const response = await axios.get('/api/counterparties');
        setCounterparties(response.data);
      } catch (err) {
        console.error('Error fetching counterparties:', err);
      }
    };

    fetchCounterparties();
  }, []);

  // Search counterparties
  const searchCounterparties = async (term) => {
    try {
      // Clear previous timeout if it exists
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set a new timeout to debounce the search
      searchTimeoutRef.current = setTimeout(async () => {
        if (term.trim() === '') {
          setSearchResults([]);
          return;
        }

        const response = await axios.get(`/api/counterparties?search=${encodeURIComponent(term)}`);
        setSearchResults(response.data);
      }, 300);
    } catch (err) {
      console.error('Error searching counterparties:', err);
    }
  };

  // Handle counterparty search input change
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    searchCounterparties(term);
  };

  // Select counterparty as customer
  const selectAsCustomer = (counterparty) => {
    setSelectedCustomer(counterparty);

    // Auto-fill customer fields while preserving existing values
    const newValues = { ...formValues };

    // Map counterparty fields to customer fields
    template.placeholders.forEach(placeholder => {
      const placeholderLower = placeholder.toLowerCase();
      const fieldWithoutBraces = placeholder.replace(/[{}]/g, '');

      // Only fill customer-related fields
      // Check if this is a customer field and not a performer field
      if (placeholderLower.startsWith('{customer.') &&
          !placeholderLower.includes('performer') &&
          !placeholderLower.includes('executor') &&
          !placeholderLower.includes('contractor') &&
          !placeholderLower.includes('seller') &&
          !placeholderLower.includes('provider')) {
        // Extract the field name after customer.
        const fieldName = fieldWithoutBraces.split('.')[1].toLowerCase();

        // Map specific fields - only if the field is empty or if we have a value to replace it
        if (fieldName === 'company' && counterparty.company && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.company;
        } else if (fieldName === 'director' && counterparty.director && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.director;
        } else if (fieldName === 'address' && counterparty.address && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.address;
        } else if (fieldName === 'postaddress' && counterparty.postAddress && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.postAddress;
        } else if (fieldName === 'phone' && counterparty.phone && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.phone;
        } else if (fieldName === 'email' && counterparty.email && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.email;
        } else if (fieldName === 'bank' && counterparty.bank && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.bank;
        } else if (fieldName === 'bankaccount' && counterparty.bankAccount && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.bankAccount;
        } else if (fieldName === 'bankcode' && counterparty.bankCode && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.bankCode;
        } else if (fieldName === 'code' && counterparty.code && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.code;
        } else if (fieldName === 'individualcode' && counterparty.individualCode && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.individualCode;
        } else if ((fieldName === 'documentname' || fieldName === 'document') && counterparty.documentName && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.documentName;
        } else if (fieldName === 'genericname' && counterparty.genericName && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.genericName;
        } else if (fieldName === 'signaturename' && counterparty.signatureName && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.signatureName;
        }
      }
      // More general matching for customer-related fields
      else if (
        (placeholderLower.includes('customer') ||
         placeholderLower.includes('client') ||
         placeholderLower.includes('buyer')) &&
        !placeholderLower.includes('performer') &&
        !placeholderLower.includes('executor') &&
        !placeholderLower.includes('contractor') &&
        !placeholderLower.includes('seller') &&
        !placeholderLower.includes('provider')
      ) {
        if (placeholderLower.includes('company') && counterparty.company && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.company;
        } else if (placeholderLower.includes('director') && counterparty.director && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.director;
        } else if (placeholderLower.includes('address') && !placeholderLower.includes('post') && counterparty.address && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.address;
        } else if ((placeholderLower.includes('postaddress') || placeholderLower.includes('post_address') || placeholderLower.includes('postAddress')) && counterparty.postAddress && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.postAddress;
        } else if (placeholderLower.includes('phone') && counterparty.phone && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.phone;
        } else if (placeholderLower.includes('email') && counterparty.email && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.email;
        } else if (placeholderLower.includes('bank') && !placeholderLower.includes('code') && !placeholderLower.includes('account') && counterparty.bank && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.bank;
        } else if ((placeholderLower.includes('bankaccount') || placeholderLower.includes('bank_account') || placeholderLower.includes('bankAccount')) && counterparty.bankAccount && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.bankAccount;
        } else if ((placeholderLower.includes('bankcode') || placeholderLower.includes('bank_code') || placeholderLower.includes('bankCode')) && counterparty.bankCode && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.bankCode;
        } else if (placeholderLower.includes('code') && !placeholderLower.includes('bank') && !placeholderLower.includes('individual') && counterparty.code && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.code;
        } else if ((placeholderLower.includes('individualcode') || placeholderLower.includes('individual_code') || placeholderLower.includes('individualCode')) && counterparty.individualCode && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.individualCode;
        } else if ((placeholderLower.includes('document') || placeholderLower.includes('documentname') || placeholderLower.includes('documentName')) && counterparty.documentName && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.documentName;
        } else if ((placeholderLower.includes('genericname') || placeholderLower.includes('generic_name') || placeholderLower.includes('genericName')) && counterparty.genericName && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.genericName;
        } else if ((placeholderLower.includes('signaturename') || placeholderLower.includes('signature_name') || placeholderLower.includes('signatureName')) && counterparty.signatureName && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.signatureName;
        } else if (placeholderLower.includes('name') && !placeholderLower.includes('document') && !placeholderLower.includes('generic') && !placeholderLower.includes('signature') && counterparty.genericName && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.genericName;
        }
      }
    });

    setFormValues(newValues);
    getPreview(newValues);
    setSearchTerm('');
    setSearchResults([]);
  };

  // Select counterparty as performer
  const selectAsPerformer = (counterparty) => {
    setSelectedPerformer(counterparty);

    // Auto-fill performer fields while preserving existing values
    const newValues = { ...formValues };

    // Map counterparty fields to performer fields
    template.placeholders.forEach(placeholder => {
      const placeholderLower = placeholder.toLowerCase();
      const fieldWithoutBraces = placeholder.replace(/[{}]/g, '');

      // Only fill performer-related fields
      // Check if this is a performer field and not a customer field
      if (placeholderLower.startsWith('{performer.') &&
          !placeholderLower.includes('customer') &&
          !placeholderLower.includes('client') &&
          !placeholderLower.includes('buyer')) {
        // Extract the field name after performer.
        const fieldName = fieldWithoutBraces.split('.')[1].toLowerCase();

        // Map specific fields - only if the field is empty or if we have a value to replace it
        if (fieldName === 'company' && counterparty.company && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.company;
        } else if (fieldName === 'director' && counterparty.director && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.director;
        } else if (fieldName === 'address' && counterparty.address && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.address;
        } else if (fieldName === 'postaddress' && counterparty.postAddress && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.postAddress;
        } else if (fieldName === 'phone' && counterparty.phone && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.phone;
        } else if (fieldName === 'email' && counterparty.email && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.email;
        } else if (fieldName === 'bank' && counterparty.bank && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.bank;
        } else if (fieldName === 'bankaccount' && counterparty.bankAccount && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.bankAccount;
        } else if (fieldName === 'bankcode' && counterparty.bankCode && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.bankCode;
        } else if (fieldName === 'code' && counterparty.code && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.code;
        } else if (fieldName === 'individualcode' && counterparty.individualCode && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.individualCode;
        } else if ((fieldName === 'documentname' || fieldName === 'document') && counterparty.documentName && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.documentName;
        } else if (fieldName === 'genericname' && counterparty.genericName && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.genericName;
        } else if (fieldName === 'signaturename' && counterparty.signatureName && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.signatureName;
        }
      }
      // More general matching for performer-related fields
      else if (
        (placeholderLower.includes('performer') ||
         placeholderLower.includes('executor') ||
         placeholderLower.includes('contractor') ||
         placeholderLower.includes('seller') ||
         placeholderLower.includes('provider')) &&
        !placeholderLower.includes('customer') &&
        !placeholderLower.includes('client') &&
        !placeholderLower.includes('buyer')
      ) {
        if (placeholderLower.includes('company') && counterparty.company && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.company;
        } else if (placeholderLower.includes('director') && counterparty.director && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.director;
        } else if (placeholderLower.includes('address') && !placeholderLower.includes('post') && counterparty.address && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.address;
        } else if ((placeholderLower.includes('postaddress') || placeholderLower.includes('post_address') || placeholderLower.includes('postAddress')) && counterparty.postAddress && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.postAddress;
        } else if (placeholderLower.includes('phone') && counterparty.phone && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.phone;
        } else if (placeholderLower.includes('email') && counterparty.email && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.email;
        } else if (placeholderLower.includes('bank') && !placeholderLower.includes('code') && !placeholderLower.includes('account') && counterparty.bank && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.bank;
        } else if ((placeholderLower.includes('bankaccount') || placeholderLower.includes('bank_account') || placeholderLower.includes('bankAccount')) && counterparty.bankAccount && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.bankAccount;
        } else if ((placeholderLower.includes('bankcode') || placeholderLower.includes('bank_code') || placeholderLower.includes('bankCode')) && counterparty.bankCode && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.bankCode;
        } else if (placeholderLower.includes('code') && !placeholderLower.includes('bank') && !placeholderLower.includes('individual') && counterparty.code && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.code;
        } else if ((placeholderLower.includes('individualcode') || placeholderLower.includes('individual_code') || placeholderLower.includes('individualCode')) && counterparty.individualCode && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.individualCode;
        } else if ((placeholderLower.includes('document') || placeholderLower.includes('documentname') || placeholderLower.includes('documentName')) && counterparty.documentName && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.documentName;
        } else if ((placeholderLower.includes('genericname') || placeholderLower.includes('generic_name') || placeholderLower.includes('genericName')) && counterparty.genericName && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.genericName;
        } else if ((placeholderLower.includes('signaturename') || placeholderLower.includes('signature_name') || placeholderLower.includes('signatureName')) && counterparty.signatureName && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.signatureName;
        } else if (placeholderLower.includes('name') && !placeholderLower.includes('document') && !placeholderLower.includes('generic') && !placeholderLower.includes('signature') && counterparty.genericName && (!newValues[placeholder] || newValues[placeholder].trim() === '')) {
          newValues[placeholder] = counterparty.genericName;
        }
      }
    });

    setFormValues(newValues);
    getPreview(newValues);
    setSearchTerm('');
    setSearchResults([]);
  };


  // Handle input changes in the new counterparty form
  const handleNewCounterpartyInputChange = (e) => {
    const { name, value } = e.target;
    setNewCounterpartyForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create a new counterparty from the modal form
  const createNewCounterparty = async () => {
    try {
      setCreateCounterpartyLoading(true);
      setCreateCounterpartyError('');
      setCreateCounterpartySuccess(false);

      if (!newCounterpartyForm.company.trim()) {
        setCreateCounterpartyError('Company is required');
        setCreateCounterpartyLoading(false);
        return;
      }

      const response = await axios.post('/api/counterparties', newCounterpartyForm);

      // Add the new counterparty to the list
      setCounterparties(prev => {
        const exists = prev.some(c => c.id === response.data.counterparty.id);
        if (exists) {
          return prev.map(c => c.id === response.data.counterparty.id ? response.data.counterparty : c);
        } else {
          return [...prev, response.data.counterparty];
        }
      });

      setCreateCounterpartySuccess(true);

      // Reset form
      setNewCounterpartyForm({
        genericName: '',
        signatureName: '',
        company: '',
        director: '',
        documentName: '',
        address: '',
        postAddress: '',
        phone: '',
        email: '',
        bankAccount: '',
        bank: '',
        bankCode: '',
        code: '',
        individualCode: ''
      });

      // Close modal after a delay
      setTimeout(() => {
        setShowCreateCounterpartyModal(false);
        setCreateCounterpartySuccess(false);
      }, 1500);
    } catch (err) {
      setCreateCounterpartyError('Error creating counterparty. Please try again.');
      console.error('Error creating counterparty:', err);
    } finally {
      setCreateCounterpartyLoading(false);
    }
  };

  // Fetch template data and saved values
  useEffect(() => {
    const fetchTemplateAndValues = async () => {
      try {
        setLoading(true);

        // Get template data
        const templateResponse = await axios.get(`/api/templates/${id}`);
        setTemplate(templateResponse.data);

        // Initialize form values with empty strings
        const initialValues = {};
        templateResponse.data.placeholders.forEach(placeholder => {
          initialValues[placeholder] = '';
        });

        try {
          // Try to get saved values
          const valuesResponse = await axios.get(`/api/templates/${id}/values`);
          if (valuesResponse.data && Object.keys(valuesResponse.data).length > 0) {
            // Merge saved values with initial values
            const savedValues = valuesResponse.data;
            console.log('Loaded saved values:', savedValues);

            // Update form values with saved values
            setFormValues({ ...initialValues, ...savedValues });

            // Get initial preview with saved values
            await getPreview({ ...initialValues, ...savedValues });
          } else {
            // No saved values, use empty initial values
            setFormValues(initialValues);
            await getPreview(initialValues);
          }
        } catch (valuesErr) {
          console.error('Error loading saved values:', valuesErr);
          // If there's an error loading saved values, just use empty initial values
          setFormValues(initialValues);
          await getPreview(initialValues);
        }
      } catch (err) {
        setError('Error loading template. Please try again later.');
        console.error('Error loading template:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateAndValues();
  }, [id]);

  // Get preview when form values change
  const getPreview = async (values, mode = previewMode) => {
    try {
      setPreviewLoading(true);

      // For edit and final modes, get HTML preview
      const response = await axios.post(`/api/templates/${id}/preview`, {
        values,
        mode
      });
      setPreviewHtml(response.data.html);
      setPreviewPdfUrl(''); // Clear PDF URL when showing HTML
    } catch (err) {
      console.error('Error getting preview:', err);
      // Don't set error state here to avoid disrupting the user experience
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newValues = { ...formValues, [name]: value };
    setFormValues(newValues);

    // Debounce preview update
    const timeoutId = setTimeout(() => {
      getPreview(newValues);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Handle preview mode toggle
  const togglePreviewMode = () => {
    let newMode;
    if (previewMode === 'edit') {
      newMode = 'final';
    } else {
      newMode = 'edit';
    }
    setPreviewMode(newMode);
    getPreview(formValues, newMode);
  };

  // Format placeholder for display
  const formatPlaceholder = (placeholder) => {
    // Remove curly braces and convert to title case
    const withoutBraces = placeholder.replace(/[{}]/g, '');
    return withoutBraces
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  // Group placeholders by entity
  const getPlaceholdersByEntity = (entity) => {
    if (!template || !template.placeholders) return [];

    return template.placeholders.filter(placeholder => {
      const placeholderLower = placeholder.toLowerCase();
      // Allow all counterparty fields to be used as both customer and performer
      if (entity === 'customer') {
        return placeholderLower.includes('customer') ||
               placeholderLower.includes('client') ||
               placeholderLower.includes('buyer') ||
               // Include counterparty fields that don't have a specific prefix
               (placeholderLower.includes('counterparty') &&
                !placeholderLower.includes('performer') &&
                !placeholderLower.includes('executor') &&
                !placeholderLower.includes('contractor') &&
                !placeholderLower.includes('seller') &&
                !placeholderLower.includes('provider'));
      } else if (entity === 'performer') {
        return placeholderLower.includes('performer') ||
               placeholderLower.includes('executor') ||
               placeholderLower.includes('contractor') ||
               placeholderLower.includes('seller') ||
               placeholderLower.includes('provider') ||
               // Include counterparty fields that don't have a specific prefix
               (placeholderLower.includes('counterparty') &&
                !placeholderLower.includes('customer') &&
                !placeholderLower.includes('client') &&
                !placeholderLower.includes('buyer'));
      } else if (entity === 'agreement') {
        return placeholderLower.includes('agreement');
      }
      return false;
    });
  };

  // Handle edit button click
  const handleEditClick = () => {
    setShowEntitySelectionModal(true);
  };

  // Handle entity selection
  const handleEntitySelect = (entity) => {
    setEditingEntity(entity);
    setShowEntitySelectionModal(false);
    setShowEditModal(true);
  };

  // Determine input type based on placeholder name
  const getInputType = (placeholder) => {
    const lowerPlaceholder = placeholder.toLowerCase();
    if (lowerPlaceholder.includes('date')) return 'date';
    // Agreement Number should be a string, not just a number
    if ((lowerPlaceholder.includes('number') || lowerPlaceholder.includes('amount')) &&
        !lowerPlaceholder.includes('agreement.number')) return 'number';
    return 'text';
  };

  // Get default value for a placeholder
  const getDefaultValue = (placeholder) => {
    const lowerPlaceholder = placeholder.toLowerCase();
    if (lowerPlaceholder === 'agreement.dateend') {
      // Set default to December 31, 2025
      return '2025-12-31';
    }
    return '';
  };

  // Get placeholder example for a field
  const getPlaceholderExample = (placeholder) => {
    const lowerPlaceholder = placeholder.toLowerCase();
    if (lowerPlaceholder === 'agreement.number') {
      return '22-45/2025';
    } else if (lowerPlaceholder === 'agreement.datestart') {
      return '08.06.2024';
    } else if (lowerPlaceholder === 'agreement.dateend') {
      return 'Останній день цього року';
    } else if (lowerPlaceholder === 'agreement.subscriptionprice') {
      return '650 грн. (Шістсот п\'ятдесят гривень 00 копійок).';
    } else if (lowerPlaceholder === 'agreement.onehourprice') {
      return '500 грн. (п\'ятсот грн. нуль коп.)';
    } else if (lowerPlaceholder.includes('genericname')) {
      return 'Степанюка Павла Васильовича';
    } else if (lowerPlaceholder.includes('signaturename')) {
      return 'Павло СТЕПАНЮК';
    } else if (lowerPlaceholder.includes('company')) {
      return 'ФОП, ТзОВ';
    } else if (lowerPlaceholder.includes('director')) {
      return 'Степанюк Павло Васильович';
    } else if (lowerPlaceholder.includes('documentname')) {
      return 'Виписка Статут';
    } else if (lowerPlaceholder.includes('address') && !lowerPlaceholder.includes('post')) {
      return '44681, Волинська обл., Луцький р-н, с.Прилуьке, вул. Миру, будинок № 30';
    } else if (lowerPlaceholder.includes('postaddress')) {
      return '44681, Волинська обл., Луцький р-н, с.Прилуьке, вул. Миру, будинок № 30';
    } else if (lowerPlaceholder.includes('phone')) {
      return '+380996644888';
    } else if (lowerPlaceholder.includes('email')) {
      return 'firma@gmail.com';
    } else if (lowerPlaceholder.includes('bankaccount')) {
      return 'UA063052990000026004020811892';
    } else if (lowerPlaceholder.includes('bank') && !lowerPlaceholder.includes('code') && !lowerPlaceholder.includes('account')) {
      return 'Назва банку';
    } else if (lowerPlaceholder.includes('bankcode')) {
      return 'МФО';
    } else if (lowerPlaceholder.includes('code') && !lowerPlaceholder.includes('bank') && !lowerPlaceholder.includes('individual')) {
      return 'ЄДРПОУ';
    } else if (lowerPlaceholder.includes('individualcode')) {
      return 'ІПН';
    }

    // Default placeholder
    return `Enter ${formatPlaceholder(placeholder).toLowerCase()}`;
  };

  // Save template values
  const handleSave = async () => {
    try {
      setSaveLoading(true);
      setSaveError('');
      setSaveSuccess(false);

      await axios.post(`/api/templates/${id}/values`, {
        values: formValues
      });

      setSaveSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      setSaveError('Error saving values. Please try again.');
      console.error('Error saving values:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Show export modal
  const handleExportClick = () => {
    setExportFilename(template.originalName.replace('.docx', ''));
    setShowExportModal(true);
  };

  // Export document
  const handleExport = async () => {
    try {
      setExportLoading(true);
      setExportError('');
      setExportSuccess(false);

      // First save the current values
      try {
        await axios.post(`/api/templates/${id}/values`, {
          values: formValues
        });
        console.log('Values saved before export');
      } catch (saveErr) {
        console.error('Error saving values before export:', saveErr);
        // Continue with export even if save fails
      }

      const response = await axios.post(`/api/templates/${id}/export`, {
        values: formValues,
        customFilename: exportFilename
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exportFilename}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setExportSuccess(true);
      setShowExportModal(false);
    } catch (err) {
      setExportError('Error exporting document. Please try again.');
      console.error('Error exporting document:', err);
    } finally {
      setExportLoading(false);
    }
  };

  // Reset form values to template defaults
  const handleReset = () => {
    // Initialize form values with empty strings
    const initialValues = {};
    template.placeholders.forEach(placeholder => {
      initialValues[placeholder] = '';
    });

    setFormValues(initialValues);
    getPreview(initialValues);

    // Clear selected counterparties
    setSelectedCustomer(null);
    setSelectedPerformer(null);
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          {error}
          <div className="mt-3">
            <Button onClick={() => navigate('/templates')} variant="outline-primary">
              Back to Templates
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4 mb-5">
      <h2 className="mb-4">Template Editor: {template.originalName}</h2>

      {exportSuccess && (
        <Alert variant="success" dismissible onClose={() => setExportSuccess(false)}>
          Document exported successfully!
        </Alert>
      )}

      {exportError && (
        <Alert variant="danger" dismissible onClose={() => setExportError('')}>
          {exportError}
        </Alert>
      )}

      <Row>
        {/* Left Panel - Form */}
        <Col md={5} className="mb-4">
          <Card>
            <Card.Header>
              <h4>Fill Template Fields</h4>
            </Card.Header>
            <Card.Body>
              {/* Counterparty Search */}
              <Card className="mb-4">
                <Card.Header>
                  <h5>Counterparty Search</h5>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted small mb-2">
                    Search for existing counterparties or save current form values as a new counterparty.
                    Select a counterparty as Customer or Performer to auto-fill related fields.
                  </p>
                  <InputGroup className="mb-3">
                    <FormControl
                      placeholder="Search counterparties..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                    <Button
                      variant="outline-primary"
                      onClick={() => setShowCreateCounterpartyModal(true)}
                    >
                      Create New
                    </Button>
                  </InputGroup>

                  {/* Selected Counterparties */}
                  <div className="mb-3">
                    {selectedCustomer && (
                      <div className="d-flex align-items-center mb-2">
                        <span className="badge bg-primary me-2">Customer</span>
                        <span className="flex-grow-1">{selectedCustomer.company}</span>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => setSelectedCustomer(null)}
                        >
                          ×
                        </Button>
                      </div>
                    )}

                    {selectedPerformer && (
                      <div className="d-flex align-items-center">
                        <span className="badge bg-success me-2">Performer</span>
                        <span className="flex-grow-1">{selectedPerformer.company}</span>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => setSelectedPerformer(null)}
                        >
                          ×
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <ListGroup className="mb-3">
                      {searchResults.map(counterparty => (
                        <ListGroup.Item key={counterparty.id} className="d-flex justify-content-between align-items-center">
                          <span>{counterparty.company}</span>
                          <div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => selectAsCustomer(counterparty)}
                            >
                              As Customer
                            </Button>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => selectAsPerformer(counterparty)}
                            >
                              As Performer
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>

              {/* Edit Button */}
              <div className="d-grid gap-2 mb-3">
                <Button
                  variant="primary"
                  onClick={handleEditClick}
                >
                  Edit Fields
                </Button>
              </div>
            </Card.Body>
            <Card.Footer>
              <div className="d-grid gap-2">
                <div className="d-flex gap-2 mb-2">
                  <Button
                    variant="warning"
                    onClick={handleReset}
                    className="flex-grow-1"
                  >
                    Reset Fields
                  </Button>
                </div>

                <Button
                  variant="primary"
                  onClick={handleExportClick}
                  disabled={exportLoading}
                >
                  {exportLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">Exporting...</span>
                    </>
                  ) : 'Export Document'}
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </Col>

        {/* Right Panel - Preview */}
        <Col md={7}>
          <Card className="preview-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4>Document Preview</h4>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={togglePreviewMode}
              >
                {previewMode === 'edit'
                  ? 'Show Final View'
                  : 'Show Edit View'}
              </Button>
            </Card.Header>
            <Card.Body className="preview-container">
              {previewLoading ? (
                <div className="text-center my-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading preview...</span>
                  </Spinner>
                </div>
              ) : (
                <div
                  className="document-preview"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="mt-4">
        <Button variant="outline-secondary" onClick={() => navigate('/templates')}>
          Back to Templates
        </Button>
      </div>


      {/* Entity Selection Modal */}
      <Modal show={showEntitySelectionModal} onHide={() => setShowEntitySelectionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select Entity to Edit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Choose which entity you want to edit:</p>
          <div className="d-grid gap-2">
            <Button
              variant="primary"
              size="lg"
              className="mb-2"
              onClick={() => handleEntitySelect('customer')}
            >
              Edit Customer Fields
            </Button>
            <Button
              variant="success"
              size="lg"
              className="mb-2"
              onClick={() => handleEntitySelect('performer')}
            >
              Edit Performer Fields
            </Button>
            <Button
              variant="info"
              size="lg"
              onClick={() => handleEntitySelect('agreement')}
            >
              Edit Agreement Fields
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowEntitySelectionModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Fields Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingEntity === 'customer' ? 'Edit Customer Fields' :
             editingEntity === 'performer' ? 'Edit Performer Fields' :
             'Edit Agreement Fields'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {saveSuccess && (
            <Alert variant="success" className="mb-3 py-2">
              Values saved successfully!
            </Alert>
          )}

          {saveError && (
            <Alert variant="danger" className="mb-3 py-2" dismissible onClose={() => setSaveError('')}>
              {saveError}
            </Alert>
          )}

          <Form>
            {editingEntity && getPlaceholdersByEntity(editingEntity).map((placeholder) => (
              <Form.Group className="mb-3" key={placeholder}>
                <Form.Label>{formatPlaceholder(placeholder)}</Form.Label>
                <Form.Control
                  type={getInputType(placeholder)}
                  name={placeholder}
                  value={formValues[placeholder] || getDefaultValue(placeholder)}
                  onChange={handleInputChange}
                  placeholder={getPlaceholderExample(placeholder)}
                />
              </Form.Group>
            ))}
            {editingEntity && getPlaceholdersByEntity(editingEntity).length === 0 && (
              <Alert variant="info">
                No fields found for this entity. Please check if your template contains fields for {editingEntity}.
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleSave();
              setShowEditModal(false);
            }}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create New Counterparty Modal */}
      <Modal show={showCreateCounterpartyModal} onHide={() => setShowCreateCounterpartyModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Counterparty</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createCounterpartySuccess && (
            <Alert variant="success" className="mb-3">
              Counterparty created successfully!
            </Alert>
          )}

          {createCounterpartyError && (
            <Alert variant="danger" className="mb-3">
              {createCounterpartyError}
            </Alert>
          )}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Generic Name</Form.Label>
              <Form.Control
                type="text"
                name="genericName"
                value={newCounterpartyForm.genericName}
                onChange={handleNewCounterpartyInputChange}
                placeholder="Степанюка Павла Васильовича"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Signature Name</Form.Label>
              <Form.Control
                type="text"
                name="signatureName"
                value={newCounterpartyForm.signatureName}
                onChange={handleNewCounterpartyInputChange}
                placeholder="Павло СТЕПАНЮК"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Company*</Form.Label>
              <Form.Control
                type="text"
                name="company"
                value={newCounterpartyForm.company}
                onChange={handleNewCounterpartyInputChange}
                required
                placeholder="ФОП, ТзОВ"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Director</Form.Label>
              <Form.Control
                type="text"
                name="director"
                value={newCounterpartyForm.director}
                onChange={handleNewCounterpartyInputChange}
                placeholder="Степанюк Павло Васильович"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Document Name</Form.Label>
              <Form.Control
                type="text"
                name="documentName"
                value={newCounterpartyForm.documentName}
                onChange={handleNewCounterpartyInputChange}
                placeholder="Виписка Статут"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={newCounterpartyForm.address}
                onChange={handleNewCounterpartyInputChange}
                placeholder="44681, Волинська обл., Луцький р-н, с.Прилуьке, вул. Миру, будинок № 30"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Postal Address</Form.Label>
              <Form.Control
                type="text"
                name="postAddress"
                value={newCounterpartyForm.postAddress}
                onChange={handleNewCounterpartyInputChange}
                placeholder="44681, Волинська обл., Луцький р-н, с.Прилуьке, вул. Миру, будинок № 30"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={newCounterpartyForm.phone}
                onChange={handleNewCounterpartyInputChange}
                placeholder="+380996644888"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={newCounterpartyForm.email}
                onChange={handleNewCounterpartyInputChange}
                placeholder="firma@gmail.com"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Bank Account</Form.Label>
              <Form.Control
                type="text"
                name="bankAccount"
                value={newCounterpartyForm.bankAccount}
                onChange={handleNewCounterpartyInputChange}
                placeholder="UA063052990000026004020811892"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Bank</Form.Label>
              <Form.Control
                type="text"
                name="bank"
                value={newCounterpartyForm.bank}
                onChange={handleNewCounterpartyInputChange}
                placeholder="Назва банку"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Bank Code</Form.Label>
              <Form.Control
                type="text"
                name="bankCode"
                value={newCounterpartyForm.bankCode}
                onChange={handleNewCounterpartyInputChange}
                placeholder="МФО"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Code</Form.Label>
              <Form.Control
                type="text"
                name="code"
                value={newCounterpartyForm.code}
                onChange={handleNewCounterpartyInputChange}
                placeholder="ЄДРПОУ"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Individual Code</Form.Label>
              <Form.Control
                type="text"
                name="individualCode"
                value={newCounterpartyForm.individualCode}
                onChange={handleNewCounterpartyInputChange}
                placeholder="ІПН"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateCounterpartyModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={createNewCounterparty}
            disabled={createCounterpartyLoading}
          >
            {createCounterpartyLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Creating...</span>
              </>
            ) : 'Create Counterparty'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Export Document Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Export Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {exportError && (
            <Alert variant="danger" className="mb-3" dismissible onClose={() => setExportError('')}>
              {exportError}
            </Alert>
          )}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Document Name</Form.Label>
              <Form.Control
                type="text"
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                placeholder="Enter document name (without extension)"
              />
              <Form.Text className="text-muted">
                The document will be exported as [name].docx
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={exportLoading}
          >
            {exportLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Exporting...</span>
              </>
            ) : 'Export Document'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TemplateEditor;
