import { Link } from "react-router-dom";
import { company } from "../../content/company";
import { Panel } from "../shared";

export default function SupportPage() {
  return (
    <>
      <h1>Support</h1>
      <div className="panel-grid panel-grid--2">
        <Panel title="Order-related requests">
          <p>
            For delivery, document, or order questions, open the order and use{" "}
            <strong>Raise a support request</strong> so our team has the full context.
          </p>
          <Link className="btn btn--primary" to="/customer/orders">Go to my orders</Link>
        </Panel>
        <Panel title="Contact us directly">
          <p>
            Phone: <a href={company.contact.phoneHref}>{company.contact.phone}</a>
            <br />
            WhatsApp: <a href={company.contact.whatsappHref}>{company.contact.whatsapp}</a>
            <br />
            Email: <a href={`mailto:${company.contact.email}`}>{company.contact.email}</a>
          </p>
          <p className="placeholder-note">{company.contact.businessHours}</p>
        </Panel>
      </div>
    </>
  );
}
