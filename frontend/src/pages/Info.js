import React from 'react';
import { Container, Card, Table } from 'react-bootstrap';

const Info = () => {
  return (
    <Container>
      <h1 className="mb-4">Database Information</h1>

      <Card className="mb-4">
        <Card.Header>
          <h2>Counterparty Model</h2>
        </Card.Header>
        <Card.Body>
          <p>The Counterparty model stores information about entities that can be used as customers or performers in documents.</p>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Description</th>
                <th>Required</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>id</td>
                <td>INTEGER</td>
                <td>Primary key, auto-incremented</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>name</td>
                <td>STRING</td>
                <td>Person's name</td>
                <td>No</td>
              </tr>
              <tr>
                <td>company</td>
                <td>STRING</td>
                <td>Company name</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>director</td>
                <td>STRING</td>
                <td>Name of the company director</td>
                <td>No</td>
              </tr>
              <tr>
                <td>documentName</td>
                <td>STRING</td>
                <td>Name of the document that authorizes the counterparty</td>
                <td>No</td>
              </tr>
              <tr>
                <td>address</td>
                <td>STRING</td>
                <td>Physical address</td>
                <td>No</td>
              </tr>
              <tr>
                <td>bankAccount</td>
                <td>STRING</td>
                <td>Bank account number</td>
                <td>No</td>
              </tr>
              <tr>
                <td>bank</td>
                <td>STRING</td>
                <td>Bank name</td>
                <td>No</td>
              </tr>
              <tr>
                <td>bankCode</td>
                <td>STRING</td>
                <td>Bank identification code</td>
                <td>No</td>
              </tr>
              <tr>
                <td>code</td>
                <td>STRING</td>
                <td>Company identification code</td>
                <td>No</td>
              </tr>
              <tr>
                <td>individualCode</td>
                <td>STRING</td>
                <td>Individual taxpayer number</td>
                <td>No</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h2>Template Model</h2>
        </Card.Header>
        <Card.Body>
          <p>The Template model stores information about document templates uploaded to the system. The model uses the built-in <code>createdAt</code> field from Sequelize to track when templates were uploaded.</p>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Description</th>
                <th>Required</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>id</td>
                <td>INTEGER</td>
                <td>Primary key, auto-incremented</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>originalName</td>
                <td>STRING</td>
                <td>Original filename of the uploaded template</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>filename</td>
                <td>STRING</td>
                <td>Filename after processing by the system</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>path</td>
                <td>STRING</td>
                <td>File path where the template is stored</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>createdAt</td>
                <td>DATE</td>
                <td>Date when the template was created (automatically managed by Sequelize)</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>updatedAt</td>
                <td>DATE</td>
                <td>Date when the template was last updated (automatically managed by Sequelize)</td>
                <td>Yes</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

    </Container>
  );
};

export default Info;
