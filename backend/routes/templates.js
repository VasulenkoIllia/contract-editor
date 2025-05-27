const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const Template = require('../models/Template');

// Helper function to create normalized values with field name variations
const createNormalizedValues = (values) => {
  const normalizedValues = { ...values };

  // Define field name variations mapping
  const fieldVariations = {
    // Customer variations
    '{customer.bankAccount}': ['{customer.bankacc}'],
    '{customer.bankCode}': ['{customer.bankcode}'],
    '{customer.individualCode}': ['{customer.individualcode}'],
    '{customer.address}': ['{customer.adress}'],
    '{customer.bank}': [],
    '{customer.code}': [],
    '{customer.company}': [],
    '{customer.director}': [],
    '{customer.documentName}': [],
    '{customer.name}': [],

    // Performer variations
    '{performer.address}': ['{performer.adress}'],
    '{performer.bankAccount}': ['{performer.bankacc}'],
    '{performer.bankCode}': ['{performer.bankcode}'],
    '{performer.individualCode}': ['{performer.individualcode}'],
    '{performer.bank}': [],
    '{performer.code}': [],
    '{performer.documentName}': [],
    '{performer.name}': []
  };

  // Create variations for each field
  Object.entries(fieldVariations).forEach(([mainField, variations]) => {
    if (normalizedValues[mainField]) {
      // If main field has a value, copy it to all variations
      variations.forEach(variation => {
        normalizedValues[variation] = normalizedValues[mainField];
      });
    } else {
      // If main field doesn't have a value, check if any variation has a value
      variations.forEach(variation => {
        if (normalizedValues[variation]) {
          normalizedValues[mainField] = normalizedValues[variation];
          // Copy to other variations too
          variations.forEach(otherVar => {
            if (otherVar !== variation) {
              normalizedValues[otherVar] = normalizedValues[variation];
            }
          });
        }
      });
    }
  });

  return normalizedValues;
};

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Use custom filename if provided, otherwise use original name
    const customFilename = req.body.customFilename ?
      req.body.customFilename + path.extname(file.originalname) :
      file.originalname;
    cb(null, uniqueSuffix + '-' + customFilename);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only .docx files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// In-memory storage for templates and their values
const templates = [];
const templateValues = {}; // Store values for each template

// Helper function to resolve file paths consistently
const resolveFilePath = (filePath) => {
  // If the path already exists, return it
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  // Check if it's just a filename (no directory)
  if (path.dirname(filePath) === '.') {
    const resolvedPath = path.join(__dirname, '../uploads', filePath);
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }

  // Try to resolve the path relative to the uploads directory
  const resolvedPath = path.join(__dirname, '../uploads', path.basename(filePath));
  if (fs.existsSync(resolvedPath)) {
    return resolvedPath;
  }

  // If we get here, the file wasn't found
  throw new Error(`File not found at path: ${filePath}`);
};

// Helper function to extract placeholders from document
const extractPlaceholders = async (filePath) => {
  try {
    const resolvedPath = resolveFilePath(filePath);
    const result = await mammoth.extractRawText({ path: resolvedPath });
    const text = result.value;

    // Find all placeholders in the format {placeholder}
    const placeholderRegex = /\{([^{}]+)\}/g;
    const matches = text.match(placeholderRegex) || [];

    // Remove duplicates
    return [...new Set(matches)];
  } catch (error) {
    console.error('Error extracting placeholders:', error);
    throw new Error('Failed to process template');
  }
};

// POST /api/templates - Upload a new template
router.post('/', upload.single('template'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Store only the filename instead of the full path
    const filename = req.file.filename;
    const filePath = req.file.path;
    const placeholders = await extractPlaceholders(filePath);

    // Create template in database
    const dbTemplate = await Template.create({
      originalName: req.file.originalname,
      filename: filename,
      path: filename // Store only the filename, not the full path
    });

    // Store in in-memory storage as well
    const template = {
      id: dbTemplate.id.toString(),
      originalName: dbTemplate.originalName,
      filename: dbTemplate.filename,
      path: dbTemplate.path,
      uploadDate: dbTemplate.createdAt
    };
    templates.push(template);

    res.status(201).json({
      id: dbTemplate.id,
      originalName: dbTemplate.originalName,
      uploadDate: dbTemplate.createdAt,
      placeholders: placeholders
    });
  } catch (error) {
    console.error('Error uploading template:', error);
    res.status(500).json({ message: error.message || 'Failed to upload template' });
  }
});

// GET /api/templates - Get all templates
router.get('/', async (req, res) => {
  try {
    // Fetch templates from database
    const dbTemplates = await Template.findAll({
      attributes: ['id', 'originalName', 'createdAt', 'path']
    });

    // For each template, extract placeholders
    const templatesList = await Promise.all(dbTemplates.map(async template => {
      try {
        const placeholders = await extractPlaceholders(template.path);
        return {
          id: template.id,
          originalName: template.originalName,
          uploadDate: template.createdAt,
          placeholders: placeholders
        };
      } catch (error) {
        console.error(`Error extracting placeholders for template ${template.id}:`, error);
        return {
          id: template.id,
          originalName: template.originalName,
          uploadDate: template.createdAt,
          placeholders: [],
          error: 'Failed to extract placeholders'
        };
      }
    }));

    res.json(templatesList);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
});

// GET /api/templates/:id - Get a specific template
router.get('/:id', async (req, res) => {
  try {
    // Fetch template from database
    const template = await Template.findByPk(req.params.id, {
      attributes: ['id', 'originalName', 'createdAt', 'path']
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Extract placeholders from the template file
    let placeholders = [];
    let extractError = null;
    try {
      placeholders = await extractPlaceholders(template.path);
    } catch (error) {
      console.error(`Error extracting placeholders for template ${template.id}:`, error);
      extractError = 'Failed to extract placeholders';
    }

    const response = {
      id: template.id,
      originalName: template.originalName,
      uploadDate: template.createdAt,
      placeholders: placeholders
    };

    if (extractError) {
      response.error = extractError;
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ message: 'Failed to fetch template' });
  }
});

// POST /api/templates/:id/preview - Generate a preview with values
router.post('/:id/preview', async (req, res) => {
  try {
    // Fetch template from database
    const template = await Template.findByPk(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const { values, mode } = req.body;

    // Resolve the file path
    const resolvedPath = resolveFilePath(template.path);

    // Convert DOCX to HTML
    const result = await mammoth.convertToHtml({ path: resolvedPath });
    let html = result.value;

    // Create normalized values with field name variations
    const normalizedValues = createNormalizedValues(values);

    // Extract placeholders from the template file
    const placeholders = await extractPlaceholders(template.path);

    // Replace placeholders with values
    placeholders.forEach(placeholder => {
      const value = normalizedValues[placeholder] || '';

      // Escape special characters in the placeholder for regex
      const escapedPlaceholder = escapeRegExp(placeholder);

      if (mode === 'edit') {
        // In edit mode, highlight placeholders
        const highlightedValue = value
          ? `<span class="placeholder-highlight">${value}</span>`
          : `<span class="placeholder-highlight">${placeholder}</span>`;
        html = html.replace(new RegExp(escapedPlaceholder, 'g'), highlightedValue);
      } else {
        // In final mode, just show the values
        html = html.replace(new RegExp(escapedPlaceholder, 'g'), value);
      }
    });

    res.json({ html });
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ message: 'Failed to generate preview' });
  }
});

// POST /api/templates/:id/export - Export the final document
router.post('/:id/export', async (req, res) => {
  try {
    // Fetch template from database
    const template = await Template.findByPk(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Use saved values if they exist, otherwise use the values from the request
    let { values, customFilename } = req.body;

    // Get values from in-memory storage
    const savedValues = templateValues[req.params.id];
    if (savedValues) {
      // Merge saved values with any new values from the request
      values = { ...savedValues, ...values };
      console.log('Using saved values for export');
    }

    // Create normalized values with field name variations
    const normalizedValues = createNormalizedValues(values);

    // Resolve the file path
    const resolvedPath = resolveFilePath(template.path);

    // Extract placeholders from the template file
    const placeholders = await extractPlaceholders(template.path);

    // Log for debugging
    console.log('Exporting document with placeholders:', placeholders);
    console.log('Values provided:', Object.keys(values).length);
    console.log('Normalized values provided:', Object.keys(normalizedValues).length);

    try {
      // First try with docxtemplater
      try {
        const PizZip = require('pizzip');
        const Docxtemplater = require('docxtemplater');

        // Read the original document content
        const content = fs.readFileSync(resolvedPath, 'binary');

        // Create a zip object from the content
        const zip = new PizZip(content);

        // Create a new docxtemplater instance
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          delimiters: { start: '{', end: '}' } // Explicitly set delimiters to match our placeholders
        });

        // Prepare the data for docxtemplater
        // Convert from {placeholder} format to placeholder format
        const data = {};
        Object.keys(normalizedValues).forEach(key => {
          // Remove the curly braces from the key
          const cleanKey = key.replace(/[{}]/g, '');
          data[cleanKey] = normalizedValues[key];
        });

        // Set the template variables
        doc.setData(data);

        // Render the document (replace all variables with their values)
        doc.render();

        // Generate the document buffer
        const buffer = doc.getZip().generate({
          type: 'nodebuffer',
          compression: 'DEFLATE'
        });

        // Send the document
        const exportFilename = customFilename ?
          `${customFilename}.docx` :
          `${template.originalName.replace('.docx', '')}_filled.docx`;
        res.setHeader('Content-Disposition', `attachment; filename=${exportFilename}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);
        return; // Exit early if successful
      } catch (docxError) {
        console.error('Docxtemplater approach failed, falling back to direct replacement:', docxError);
        // Fall back to direct replacement if docxtemplater fails
      }

      // Fallback approach: Direct XML manipulation
      const PizZip = require('pizzip');

      // Read the original document content
      const originalContent = fs.readFileSync(resolvedPath);

      // Create a temporary file for processing
      const tempFilePath = path.join(path.dirname(resolvedPath), `temp-${Date.now()}.docx`);
      fs.writeFileSync(tempFilePath, originalContent);

      // Load the document as a binary from the temporary file
      const content = fs.readFileSync(tempFilePath, 'binary');

      // Create a zip object from the content
      const zip = new PizZip(content);

      // Process each XML file in the document to replace placeholders
      const xmlFiles = [];
      Object.keys(zip.files).forEach(fileName => {
        if (fileName.startsWith('word/') && fileName.endsWith('.xml')) {
          xmlFiles.push(fileName);
        }
      });

      // Log for debugging
      console.log('Processing XML files:', xmlFiles);

      // Replace placeholders in each XML file
      xmlFiles.forEach(fileName => {
        let content = zip.files[fileName].asText();

        // Replace each placeholder with its value
        placeholders.forEach(placeholder => {
          const value = normalizedValues[placeholder] || '';
          // Escape special XML characters in the value
          const escapedValue = value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');

          // Create a regex that handles potential XML tag splitting of placeholders
          const escapedPlaceholder = escapeRegExp(placeholder);
          const regex = new RegExp(escapedPlaceholder, 'g');

          // Replace the placeholder with the value
          content = content.replace(regex, escapedValue);
        });

        // Update the file content in the zip
        zip.file(fileName, content);
      });

      // Generate the document buffer
      const buffer = zip.generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      // Clean up temporary files
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      // Send the document
      const exportFilename = customFilename ?
        `${customFilename}.docx` :
        `${template.originalName.replace('.docx', '')}_filled.docx`;
      res.setHeader('Content-Disposition', `attachment; filename=${exportFilename}`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(buffer);
    } catch (innerError) {
      // If all approaches fail, log it
      console.error('Error in document processing:', innerError);
      throw innerError;
    }
  } catch (error) {
    console.error('Error exporting document:', error);
    res.status(500).json({ message: 'Failed to export document: ' + error.message });
  }
});

// Helper function to escape special characters in regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// POST /api/templates/:id/values - Save template values
router.post('/:id/values', async (req, res) => {
  try {
    // Check if template exists in database
    const template = await Template.findByPk(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const { values } = req.body;

    // Save the values to in-memory storage
    templateValues[req.params.id] = values;

    console.log(`Saved values for template ${req.params.id}`);

    res.status(200).json({
      message: 'Template values saved successfully',
      templateId: req.params.id
    });
  } catch (error) {
    console.error('Error saving template values:', error);
    res.status(500).json({ message: 'Failed to save template values' });
  }
});

// GET /api/templates/:id/values - Get saved template values
router.get('/:id/values', async (req, res) => {
  try {
    // Check if template exists in database
    const template = await Template.findByPk(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Get values from in-memory storage
    const values = templateValues[req.params.id] || {};
    res.status(200).json(values);
  } catch (error) {
    console.error('Error getting template values:', error);
    res.status(500).json({ message: 'Failed to get template values' });
  }
});

// PATCH /api/templates/:id/rename - Rename a template
router.patch('/:id/rename', async (req, res) => {
  try {
    const { newName } = req.body;

    if (!newName || typeof newName !== 'string' || newName.trim() === '') {
      return res.status(400).json({ message: 'New name is required' });
    }

    // Ensure the name ends with .docx
    let finalName = newName;
    if (!finalName.toLowerCase().endsWith('.docx')) {
      finalName = `${finalName}.docx`;
    }

    // Find the template in the database
    const template = await Template.findByPk(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Update the template name
    template.originalName = finalName;
    await template.save();

    // Update in-memory storage
    const templateIndex = templates.findIndex(t => t.id === req.params.id);
    if (templateIndex !== -1) {
      templates[templateIndex].originalName = newName;
    }

    res.status(200).json({
      message: 'Template renamed successfully',
      template: {
        id: template.id,
        originalName: template.originalName,
        uploadDate: template.createdAt
      }
    });
  } catch (error) {
    console.error('Error renaming template:', error);
    res.status(500).json({ message: 'Failed to rename template' });
  }
});

// DELETE /api/templates/:id - Delete a template
router.delete('/:id', async (req, res) => {
  try {
    // Find the template in the database
    const template = await Template.findByPk(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Get the file path before deleting the template
    let filePath;
    try {
      filePath = resolveFilePath(template.path);
    } catch (error) {
      console.error('Error resolving file path:', error);
      filePath = null;
    }

    // Delete the template from the database
    await template.destroy();

    // Remove the file if path was resolved
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    // Clean up in-memory storage
    const templateIndex = templates.findIndex(t => t.id === req.params.id);
    if (templateIndex !== -1) {
      templates.splice(templateIndex, 1);
    }
    if (templateValues[req.params.id]) {
      delete templateValues[req.params.id];
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ message: 'Failed to delete template' });
  }
});

module.exports = router;
