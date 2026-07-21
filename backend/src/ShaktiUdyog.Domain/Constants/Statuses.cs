namespace ShaktiUdyog.Domain.Constants;

/// <summary>
/// Workflow status values. Stored as strings for readability in the database
/// and reports; values match docs/shakti-udyog-requirements.md exactly.
/// </summary>
public static class RfqStatuses
{
    public const string Draft = "Draft";
    public const string Submitted = "Submitted";
    public const string Received = "Received";
    public const string UnderReview = "Under Review";
    public const string WaitingForCustomer = "Waiting for Customer";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string Quoted = "Quoted";
    public const string Accepted = "Accepted";
    public const string Declined = "Declined";
    public const string Expired = "Expired";
    public const string Cancelled = "Cancelled";

    public static readonly IReadOnlyList<string> All =
        [Draft, Submitted, Received, UnderReview, WaitingForCustomer, Approved, Rejected,
         Quoted, Accepted, Declined, Expired, Cancelled];

    /// <summary>
    /// Valid transitions keyed by current status. Returns the set of statuses
    /// reachable from the given status. An empty set means no transitions are valid.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, IReadOnlySet<string>> ValidTransitions =
        new Dictionary<string, IReadOnlySet<string>>
        {
            [Draft] = new HashSet<string> { Submitted, Cancelled },
            [Submitted] = new HashSet<string> { Received, Cancelled },
            [Received] = new HashSet<string> { UnderReview, Rejected, Cancelled },
            [UnderReview] = new HashSet<string> { WaitingForCustomer, Approved, Rejected, Cancelled },
            [WaitingForCustomer] = new HashSet<string> { UnderReview, Rejected, Cancelled },
            [Approved] = new HashSet<string> { Quoted, Cancelled },
            [Rejected] = new HashSet<string> { },  // Terminal — no transitions out
            [Quoted] = new HashSet<string> { Accepted, Declined, Expired, Cancelled },
            [Accepted] = new HashSet<string> { },  // Terminal — becomes an order
            [Declined] = new HashSet<string> { },  // Terminal
            [Expired] = new HashSet<string> { },   // Terminal
            [Cancelled] = new HashSet<string> { },  // Terminal
        };

    /// <summary>Returns true when the transition from <paramref name="from"/> to <paramref name="to"/> is allowed.</summary>
    public static bool IsValidTransition(string from, string to) =>
        ValidTransitions.TryGetValue(from, out var next) && next.Contains(to);
}

public static class QuotationStatuses
{
    public const string Draft = "Draft";
    public const string PendingApproval = "Pending Approval";
    public const string Approved = "Approved";
    public const string Issued = "Issued";
    public const string Viewed = "Viewed";
    public const string Accepted = "Accepted";
    public const string Declined = "Declined";
    public const string Expired = "Expired";
    public const string Cancelled = "Cancelled";

    public static readonly IReadOnlyList<string> All =
        [Draft, PendingApproval, Approved, Issued, Viewed, Accepted, Declined, Expired, Cancelled];

    public static readonly IReadOnlyDictionary<string, IReadOnlySet<string>> ValidTransitions =
        new Dictionary<string, IReadOnlySet<string>>
        {
            [Draft] = new HashSet<string> { PendingApproval, Cancelled },
            [PendingApproval] = new HashSet<string> { Approved, Draft, Cancelled },
            [Approved] = new HashSet<string> { Issued, Cancelled },
            [Issued] = new HashSet<string> { Viewed, Accepted, Declined, Expired, Cancelled },
            [Viewed] = new HashSet<string> { Accepted, Declined, Expired, Cancelled },
            [Accepted] = new HashSet<string> { },  // Terminal — becomes an order
            [Declined] = new HashSet<string> { },   // Terminal
            [Expired] = new HashSet<string> { },    // Terminal
            [Cancelled] = new HashSet<string> { },  // Terminal
        };

    public static bool IsValidTransition(string from, string to) =>
        ValidTransitions.TryGetValue(from, out var next) && next.Contains(to);
}

/// <summary>Customer-visible order statuses (requirements §18).</summary>
public static class OrderStatuses
{
    public const string Confirmed = "confirmed";
    public const string PatternDevelopment = "pattern_development";
    public const string Production = "production";
    public const string QualityCheck = "quality_check";
    public const string Packed = "packed";
    public const string ReadyToDispatch = "ready_to_dispatch";
    public const string Dispatched = "dispatched";
    public const string Delivered = "delivered";
    public const string OnHold = "on_hold";
    public const string Cancelled = "cancelled";
    public const string Returned = "returned";
    public const string Closed = "closed";

    /// <summary>Ordered progression used for the tracking timeline (OnHold is out-of-band).</summary>
    public static readonly IReadOnlyList<string> Progression =
        [Confirmed, PatternDevelopment, Production, QualityCheck, Packed, ReadyToDispatch, Dispatched, Delivered];

    public static readonly IReadOnlyDictionary<string, IReadOnlySet<string>> ValidTransitions =
        new Dictionary<string, IReadOnlySet<string>>
        {
            [Confirmed] = new HashSet<string> { PatternDevelopment, OnHold, Cancelled },
            [PatternDevelopment] = new HashSet<string> { Production, OnHold, Cancelled },
            [Production] = new HashSet<string> { QualityCheck, OnHold, Cancelled },
            [QualityCheck] = new HashSet<string> { Packed, OnHold, Cancelled },
            [Packed] = new HashSet<string> { ReadyToDispatch, OnHold, Cancelled },
            [ReadyToDispatch] = new HashSet<string> { Dispatched, OnHold, Cancelled },
            [Dispatched] = new HashSet<string> { Delivered, Cancelled },
            [Delivered] = new HashSet<string> { Closed, Returned },
            [OnHold] = new HashSet<string> { Confirmed, PatternDevelopment, Production, QualityCheck, Packed, ReadyToDispatch, Cancelled },
            [Cancelled] = new HashSet<string> { },
            [Returned] = new HashSet<string> { },
            [Closed] = new HashSet<string> { },
        };

    public static bool IsValidTransition(string from, string to) =>
        ValidTransitions.TryGetValue(from, out var next) && next.Contains(to);

    public static readonly IReadOnlyDictionary<string, (string Label, string Description)> Labels =
        new Dictionary<string, (string, string)>
        {
            [Confirmed] = ("Order Confirmed", "Your order has been accepted and is being planned."),
            [PatternDevelopment] = ("Pattern / Tooling in Progress", "Required pattern or tooling work is underway."),
            [Production] = ("In Production", "Your castings are being produced."),
            [QualityCheck] = ("Quality Inspection", "The order is undergoing agreed quality checks."),
            [Packed] = ("Packed", "Your order has been packed for dispatch."),
            [ReadyToDispatch] = ("Ready to Dispatch", "Your order is ready and awaiting dispatch arrangements."),
            [Dispatched] = ("Dispatched", "Your shipment is on its way."),
            [Delivered] = ("Delivered", "Delivery has been confirmed."),
            [OnHold] = ("Action Required", "We need information or approval from you before the order can proceed."),
            [Cancelled] = ("Cancelled", "This order has been cancelled."),
            [Returned] = ("Returned", "This order has been returned."),
            [Closed] = ("Closed", "This order has been completed."),
        };
}

public static class InvoiceStatuses
{
    public const string Draft = "Draft";
    public const string Issued = "Issued";
    public const string PartiallyPaid = "Partially Paid";
    public const string Paid = "Paid";
    public const string Overdue = "Overdue";
    public const string Cancelled = "Cancelled";
    public const string CreditNoteIssued = "Credit Note Issued";

    public static readonly IReadOnlyList<string> All =
        [Draft, Issued, PartiallyPaid, Paid, Overdue, Cancelled, CreditNoteIssued];
}

public static class PaymentStatuses
{
    public const string PendingVerification = "Pending Verification";
    public const string Verified = "Verified";
    public const string Rejected = "Rejected";

    public static readonly IReadOnlyList<string> All = [PendingVerification, Verified, Rejected];
}

public static class DocumentCategories
{
    public const string InspectionReport = "Inspection Report";
    public const string Invoice = "Invoice";
    public const string PackingList = "Packing List";
    public const string Certificate = "Certificate";
    public const string DeliveryChallan = "Delivery Challan";
    public const string Drawing = "Drawing";

    public static readonly IReadOnlyList<string> All =
        [InspectionReport, Invoice, PackingList, Certificate, DeliveryChallan, Drawing];
}

public static class NotificationTypes
{
    public const string Rfq = "RFQ";
    public const string Quotation = "Quotation";
    public const string Order = "Order";
    public const string Invoice = "Invoice";
    public const string General = "General";
}
