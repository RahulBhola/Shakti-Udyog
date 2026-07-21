
export default function AdminReportsPage() {
  const reports = ["Customer Report", "RFQ Report", "Quotation Report", "Order Report", "Invoice Report", "Payment Report", "Production Report", "Shipment Report", "Support Report", "Audit Report"];
  return (
    <>
      <h1>Reports</h1>
      <div className="services-grid">
        {reports.map((r) => (
          <div key={r} className="service-card">
            <h3>{r}</h3>
            <p className="placeholder-note">Filtering, export, and scheduling — coming in a later milestone.</p>
          </div>
        ))}
      </div>
    </>
  );
}
