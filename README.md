# Document Template Editor

A web application for editing Word document templates with dynamic fields. This application allows users to upload .docx templates with placeholders like `{customer.name}`, fill in values for these placeholders, and export the final document with the placeholders replaced by the actual values.

## Technologies Used

### Frontend
- React (TypeScript)
- React Router for navigation
- React Bootstrap for UI components
- Axios for API requests

### Backend
- Node.js with Express
- docx for .docx file manipulation
- mammoth.js for converting .docx to HTML for preview
- multer for file uploads

## Project Structure

```
contract-editor/
├── backend/                # Backend server code
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── server.js           # Express server setup
│   └── package.json        # Backend dependencies
│
├── frontend/               # React frontend code
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── pages/          # Page components
│       │   ├── UploadTemplate.js    # Template upload page
│       │   ├── TemplatesList.js     # List of templates
│       │   └── TemplateEditor.js    # Template editor
│       ├── App.js          # Main component with routing
│       ├── index.js        # Entry point
│       └── package.json    # Frontend dependencies
│
└── README.md               # Project documentation
```

## Installation and Setup

### Prerequisites
- Node.js (v14 or later) - only needed for local development
- npm or yarn - only needed for local development
- Docker and Docker Compose (for full application deployment)

For Docker-based setup instructions, see [DOCKER.md](DOCKER.md). This is the recommended way to run the application.

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a .env file in the backend directory:
   ```
   cp .env.example .env
   ```
   Then edit the .env file to set your database credentials and other configuration options.

4. Start the server:
   ```
   npm start
   ```
   The server will run on http://localhost:5000

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```
   The application will be available at http://localhost:3000

## Usage

1. **Upload a Template**
   - Navigate to the "Upload Template" page
   - Select a .docx file with placeholders like `{customer.name}`
   - Click "Upload" to process the template

2. **View Templates**
   - Navigate to the "Templates" page to see all uploaded templates
   - Click "Edit" on a template to open it in the editor

3. **Edit Template**
   - Fill in the form fields on the left panel
   - See the preview update in real-time on the right panel
   - Toggle between "Edit View" (with highlighted placeholders) and "Final View"
   - Click "Export Document" to download the final document

## API Endpoints

- `POST /api/templates` - Upload a new template
- `GET /api/templates` - Get all templates
- `GET /api/templates/:id` - Get a specific template
- `POST /api/templates/:id/preview` - Generate a preview with values
- `POST /api/templates/:id/export` - Export the final document

## Features

- Upload .docx templates with dynamic fields
- Automatic detection of placeholders in the format `{variable.name}`
- Split-panel interface with form and preview
- Real-time preview updates
- Support for different field types (text, date, number)
- Export to .docx with all formatting preserved
- Responsive design for different screen sizes
- Counterparties management with database storage
- Auto-fill form fields from saved counterparties
- Full Docker support for easy deployment and development

## Database Schema

### Counterparty Model

The Counterparty model stores information about entities that can be used as customers or performers in documents.

| Field           | Type    | Description                                           | Required |
|-----------------|---------|-------------------------------------------------------|----------|
| id              | INTEGER | Primary key, auto-incremented                         | Yes      |
| name            | STRING  | Person's name                                         | No       |
| company         | STRING  | Company name                                          | Yes      |
| director        | STRING  | Name of the company director                          | No       |
| documentName    | STRING  | Name of the document that authorizes the counterparty | No       |
| address         | STRING  | Physical address                                      | No       |
| bankAccount     | STRING  | Bank account number                                   | No       |
| bank            | STRING  | Bank name                                             | No       |
| bankCode        | STRING  | Bank identification code                              | No       |
| code            | STRING  | Company identification code                           | No       |
| individualCode  | STRING  | Individual taxpayer number                            | No       |

### Template Model

The Template model stores information about document templates uploaded to the system. The model uses the built-in `createdAt` field from Sequelize to track when templates were uploaded.

| Field           | Type    | Description                                           | Required |
|-----------------|---------|-------------------------------------------------------|----------|
| id              | INTEGER | Primary key, auto-incremented                         | Yes      |
| originalName    | STRING  | Original filename of the uploaded template            | Yes      |
| filename        | STRING  | Filename after processing by the system               | Yes      |
| path            | STRING  | File path where the template is stored                | Yes      |
