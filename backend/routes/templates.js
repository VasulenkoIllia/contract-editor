const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const { Document, Packer, Paragraph, TextRun } = require('docx');

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
    cb(null, uniqueSuffix + '-' + file.originalname);
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

// In-memory storage for templates and their values (in a real app, this would be a database)
const templates = [];
const templateValues = {}; // Store values for each template

// Helper function to extract placeholders from document
const extractPlaceholders = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
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

    const filePath = req.file.path;
    const placeholders = await extractPlaceholders(filePath);

    const template = {
      id: Date.now().toString(),
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: filePath,
      uploadDate: new Date(),
      placeholders
    };

    templates.push(template);

    res.status(201).json({
      id: template.id,
      originalName: template.originalName,
      uploadDate: template.uploadDate,
      placeholders: template.placeholders
    });
  } catch (error) {
    console.error('Error uploading template:', error);
    res.status(500).json({ message: error.message || 'Failed to upload template' });
  }
});

// GET /api/templates - Get all templates
router.get('/', (req, res) => {
  const templatesList = templates.map(template => ({
    id: template.id,
    originalName: template.originalName,
    uploadDate: template.uploadDate,
    placeholders: template.placeholders
  }));

  res.json(templatesList);
});

// GET /api/templates/:id - Get a specific template
router.get('/:id', (req, res) => {
  const template = templates.find(t => t.id === req.params.id);

  if (!template) {
    return res.status(404).json({ message: 'Template not found' });
  }

  res.json({
    id: template.id,
    originalName: template.originalName,
    uploadDate: template.uploadDate,
    placeholders: template.placeholders
  });
});

// POST /api/templates/:id/preview - Generate a preview with values
router.post('/:id/preview', async (req, res) => {
  try {
    const template = templates.find(t => t.id === req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const { values, mode } = req.body;

    // Convert DOCX to HTML
    const result = await mammoth.convertToHtml({ path: template.path });
    let html = result.value;

    // Replace placeholders with values
    template.placeholders.forEach(placeholder => {
      const value = values[placeholder] || '';

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
    const template = templates.find(t => t.id === req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Use saved values if they exist, otherwise use the values from the request
    let { values } = req.body;
    const savedValues = templateValues[req.params.id];

    if (savedValues) {
      // Merge saved values with any new values from the request
      values = { ...savedValues, ...values };
      console.log('Using saved values for export');
    }

    // Log for debugging
    console.log('Exporting document with placeholders:', template.placeholders);
    console.log('Values provided:', Object.keys(values).length);

    try {
      // First try with docxtemplater
      try {
        const PizZip = require('pizzip');
        const Docxtemplater = require('docxtemplater');

        // Read the original document content
        const content = fs.readFileSync(template.path, 'binary');

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
        Object.keys(values).forEach(key => {
          // Remove the curly braces from the key
          const cleanKey = key.replace(/[{}]/g, '');
          data[cleanKey] = values[key];
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
        res.setHeader('Content-Disposition', `attachment; filename=${template.originalName.replace('.docx', '')}_filled.docx`);
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
      const originalContent = fs.readFileSync(template.path);

      // Create a temporary file for processing
      const tempFilePath = path.join(path.dirname(template.path), `temp-${Date.now()}.docx`);
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
        template.placeholders.forEach(placeholder => {
          const value = values[placeholder] || '';
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
      res.setHeader('Content-Disposition', `attachment; filename=${template.originalName.replace('.docx', '')}_filled.docx`);
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
router.post('/:id/values', (req, res) => {
  try {
    const template = templates.find(t => t.id === req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const { values } = req.body;

    // Save the values for this template
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
router.get('/:id/values', (req, res) => {
  try {
    const template = templates.find(t => t.id === req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Get the saved values for this template or return empty object if none exist
    const values = templateValues[req.params.id] || {};

    res.status(200).json(values);
  } catch (error) {
    console.error('Error getting template values:', error);
    res.status(500).json({ message: 'Failed to get template values' });
  }
});

// DELETE /api/templates/:id - Delete a template
router.delete('/:id', (req, res) => {
  const templateIndex = templates.findIndex(t => t.id === req.params.id);

  if (templateIndex === -1) {
    return res.status(404).json({ message: 'Template not found' });
  }

  const template = templates[templateIndex];

  // Remove the file
  try {
    fs.unlinkSync(template.path);
  } catch (error) {
    console.error('Error deleting file:', error);
  }

  // Remove from the array and any saved values
  templates.splice(templateIndex, 1);
  if (templateValues[req.params.id]) {
    delete templateValues[req.params.id];
  }

  res.status(204).send();
});

module.exports = router;
