import React from 'react';
import { Container, Card, Table } from 'react-bootstrap';

const Info = () => {
  return (
    <Container>
      <h1 className="mb-4">Field Information</h1>

      <Card className="mb-4">
        <Card.Header>
          <h2>Available Fields</h2>
        </Card.Header>
        <Card.Body>
          <p>The following fields can be used in document templates:</p>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Field</th>
                <th>Description</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>genericName</td>
                <td>Ім'я особи в родовому відмінку</td>
                <td>Степанюка Павла Васильовича</td>
              </tr>
              <tr>
                <td>company</td>
                <td>Назва компанії</td>
                <td>ФОП, ТзОВ</td>
              </tr>
              <tr>
                <td>director</td>
                <td>Ім'я Директора</td>
                <td>Степанюк Павло Васильович</td>
              </tr>
              <tr>
                <td>documentName</td>
                <td>Документ компанії</td>
                <td>Виписка Статут</td>
              </tr>
              <tr>
                <td>address</td>
                <td>Юридична адреса</td>
                <td>44681, Волинська обл., Луцький р-н, с.Прилуьке, вул. Миру, будинок № 30</td>
              </tr>
              <tr>
                <td>bankAccount</td>
                <td>Номер рахунку</td>
                <td>UA063052990000026004020811892</td>
              </tr>
              <tr>
                <td>code</td>
                <td>Код фірми</td>
                <td>ЄДРПОУ</td>
              </tr>
              <tr>
                <td>individualCode</td>
                <td>Код фізичної особи</td>
                <td>ІПН</td>
              </tr>
              <tr>
                <td>bankCode</td>
                <td>Код банку</td>
                <td>МФО</td>
              </tr>
              <tr>
                <td>postAddress</td>
                <td>Адреса для фізичних листів</td>
                <td>44681, Волинська обл., Луцький р-н, с.Прилуьке, вул. Миру, будинок № 30</td>
              </tr>
              <tr>
                <td>email</td>
                <td>Почта для листуванню</td>
                <td>firma@gmail.com</td>
              </tr>
              <tr>
                <td>phone</td>
                <td>Контакнтий телефон</td>
                <td>+380996644888</td>
              </tr>
              <tr>
                <td>signatureName</td>
                <td>Підпис що буде в реквізитах</td>
                <td>Павло СТЕПАНЮК</td>
              </tr>
              <tr>
                <td>agreement.number</td>
                <td>Номер документу</td>
                <td>22-45/2025</td>
              </tr>
              <tr>
                <td>agreement.dateStart</td>
                <td>Дата договору</td>
                <td>08.06.2024</td>
              </tr>
              <tr>
                <td>agreement.dateEnd</td>
                <td>Дата закінчення договору</td>
                <td>Останній день цього року</td>
              </tr>
              <tr>
                <td>agreement.SubscriptionPrice</td>
                <td>Ціна абонентської плати</td>
                <td>650 грн. (Шістсот п'ятдесят гривень 00 копійок).</td>
              </tr>
              <tr>
                <td>agreement.OneHourPrice</td>
                <td>Ціна 1 години роботи</td>
                <td>500 грн. (п'ятсот грн. нуль коп.)</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

    </Container>
  );
};

export default Info;
