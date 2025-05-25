import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';
import UploadTemplate from './pages/UploadTemplate';
import TemplatesList from './pages/TemplatesList';
import TemplateEditor from './pages/TemplateEditor';
import CounterpartiesList from './pages/CounterpartiesList';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand href="/">Document Template Editor</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link href="/templates">Templates</Nav.Link>
                <Nav.Link href="/upload">Upload Template</Nav.Link>
                <Nav.Link href="/counterparties">Counterparties</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container className="mt-4">
          <Routes>
            <Route path="/templates" element={<TemplatesList />} />
            <Route path="/upload" element={<UploadTemplate />} />
            <Route path="/editor/:id" element={<TemplateEditor />} />
            <Route path="/counterparties" element={<CounterpartiesList />} />
            <Route path="/" element={<Navigate to="/templates" replace />} />
          </Routes>
        </Container>

        <footer className="footer mt-auto py-3 bg-light">
          <Container className="text-center">
            <span className="text-muted">Document Template Editor &copy; {new Date().getFullYear()}</span>
          </Container>
        </footer>
      </div>
    </Router>
  );
}

export default App;
