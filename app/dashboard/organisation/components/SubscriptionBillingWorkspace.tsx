"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import uiStyles from "./SubscriptionBillingWorkspace.module.css";

type JsonRecord = Record<string, unknown>;

type OrganisationRecord = {
  id: string;
  name: string;
  employee_count_band: string | null;
  status: string | null;
};

type SubscriptionRecord = {
  id: string;
  organisation_id: string;
  plan_id: string | null;
  status: string;
  employee_count: number;
  current_period_starts_at: string | null;
  current_period_ends_at: string | null;
  provider_key: string | null;
  provider_customer_reference: string | null;
  provider_subscription_reference: string | null;
  cancellation_requested_at: string | null;
  cancelled_at: string | null;
  metadata: JsonRecord | null;
  created_at: string;
  updated_at: string;
};

type TrialRecord = {
  id: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  converted_at: string | null;
  ended_at: string | null;
  extension_count: number;
};

type EntitlementRecord = {
  id: string;
  access_status: string;
  employee_capacity: number | null;
  effective_from: string | null;
  effective_until: string | null;
  source: string;
};

type InvoiceRecord = {
  id: string;
  invoice_reference: string;
  status: string;
  currency_code: string;
  subtotal_pence: number;
  tax_pence: number;
  total_pence: number;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  hosted_invoice_url: string | null;
  invoice_document_path: string | null;
};

type BillingDetails = {
  companyName: string;
  billingEmail: string;
  billingContact: string;
  addressLine1: string;
  addressLine2: string;
  townOrCity: string;
  county: string;
  postcode: string;
  country: string;
  vatNumber: string;
  purchaseOrderReference: string;
};

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

const emptyBillingDetails: BillingDetails = {
  companyName: "",
  billingEmail: "",
  billingContact: "",
  addressLine1: "",
  addressLine2: "",
  townOrCity: "",
  county: "",
  postcode: "",
  country: "United Kingdom",
  vatNumber: "",
  purchaseOrderReference: "",
};

function asObject(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function parseBillingDetails(
  metadata: JsonRecord | null,
  organisationName: string,
): BillingDetails {
  const details = asObject(asObject(metadata).billing_details);

  return {
    companyName: textValue(details.company_name) || organisationName,
    billingEmail: textValue(details.billing_email),
    billingContact: textValue(details.billing_contact),
    addressLine1: textValue(details.address_line_1),
    addressLine2: textValue(details.address_line_2),
    townOrCity: textValue(details.town_or_city),
    county: textValue(details.county),
    postcode: textValue(details.postcode),
    country: textValue(details.country) || "United Kingdom",
    vatNumber: textValue(details.vat_number),
    purchaseOrderReference: textValue(details.purchase_order_reference),
  };
}

function formatDate(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMoney(valueInPence: number, currencyCode: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode || "GBP",
  }).format(valueInPence / 100);
}

function titleCase(value: string | null | undefined) {
  if (!value) return "Not available";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function planFromCapacity(capacity: number | null, trialActive: boolean) {
  if (trialActive) return "Free 7-day trial";
  if (capacity === null) return "Enterprise";
  if (capacity <= 50) return "Up to 50 employees";
  if (capacity <= 150) return "Up to 150 employees";
  if (capacity <= 250) return "Up to 250 employees";
  return "Enterprise";
}

function capacityFromBand(value: string | null) {
  switch (value) {
    case "up_to_50":
      return 50;
    case "up_to_150":
      return 150;
    case "up_to_250":
      return 250;
    case "over_250":
      return null;
    default:
      return null;
  }
}

function getBillingPortalUrl(metadata: JsonRecord | null) {
  const value = asObject(metadata).billing_portal_url;
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : null;
}

type SubscriptionBillingWorkspaceProps = {
  organisationId: string;
};

export default function SubscriptionBillingWorkspace({
  organisationId,
}: SubscriptionBillingWorkspaceProps) {
  const supabase = useMemo(() => createClient(), []);

  const [organisation, setOrganisation] = useState<OrganisationRecord | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [trial, setTrial] = useState<TrialRecord | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementRecord | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [activeEmployeeCount, setActiveEmployeeCount] = useState(0);
  const [billingDetails, setBillingDetails] =
    useState<BillingDetails>(emptyBillingDetails);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState<Notice>(null);

  const loadBilling = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setPageError("");
      setNotice(null);

      const [
        organisationResult,
        subscriptionResult,
        trialResult,
        entitlementResult,
        invoicesResult,
        employeesResult,
      ] = await Promise.all([
        supabase
          .from("organisations")
          .select("id, name, employee_count_band, status")
          .eq("id", organisationId)
          .maybeSingle(),
        supabase
          .from("leo_organisation_subscriptions")
          .select(
            "id, organisation_id, plan_id, status, employee_count, current_period_starts_at, current_period_ends_at, provider_key, provider_customer_reference, provider_subscription_reference, cancellation_requested_at, cancelled_at, metadata, created_at, updated_at",
          )
          .eq("organisation_id", organisationId)
          .maybeSingle(),
        supabase
          .from("leo_organisation_trials")
          .select(
            "id, status, starts_at, ends_at, converted_at, ended_at, extension_count",
          )
          .eq("organisation_id", organisationId)
          .maybeSingle(),
        supabase
          .from("leo_organisation_entitlements")
          .select(
            "id, access_status, employee_capacity, effective_from, effective_until, source",
          )
          .eq("organisation_id", organisationId)
          .maybeSingle(),
        supabase
          .from("leo_billing_invoices")
          .select(
            "id, invoice_reference, status, currency_code, subtotal_pence, tax_pence, total_pence, issued_at, due_at, paid_at, hosted_invoice_url, invoice_document_path",
          )
          .eq("organisation_id", organisationId)
          .order("issued_at", { ascending: false })
          .limit(100),
        supabase
          .from("employees")
          .select("id", { count: "exact", head: true })
          .eq("organisation_id", organisationId)
          .eq("status", "active"),
      ]);

      if (organisationResult.error) {
        setPageError(organisationResult.error.message);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!organisationResult.data) {
        setPageError("The organisation record could not be found.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const billingReadError =
        subscriptionResult.error ||
        trialResult.error ||
        entitlementResult.error ||
        invoicesResult.error;

      if (billingReadError) {
        setPageError(
          "You do not have permission to view billing for this organisation, or the billing records could not be loaded.",
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const nextOrganisation = organisationResult.data as OrganisationRecord;
      const nextSubscription = subscriptionResult.data as SubscriptionRecord | null;

      setOrganisation(nextOrganisation);
      setSubscription(nextSubscription);
      setTrial(trialResult.data as TrialRecord | null);
      setEntitlement(entitlementResult.data as EntitlementRecord | null);
      setInvoices((invoicesResult.data ?? []) as InvoiceRecord[]);
      setActiveEmployeeCount(employeesResult.count ?? 0);
      setBillingDetails(
        parseBillingDetails(nextSubscription?.metadata ?? null, nextOrganisation.name),
      );
      setLoading(false);
      setRefreshing(false);
    },
    [organisationId, supabase],
  );

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  async function handleSaveBillingDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!subscription) {
      setNotice({
        type: "error",
        message:
          "Billing details can be saved after a subscription record has been created.",
      });
      return;
    }

    if (!billingDetails.companyName.trim()) {
      setNotice({ type: "error", message: "Enter the billing company name." });
      return;
    }

    if (
      billingDetails.billingEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingDetails.billingEmail.trim())
    ) {
      setNotice({ type: "error", message: "Enter a valid billing email address." });
      return;
    }

    setSaving(true);
    setNotice(null);

    const currentMetadata = asObject(subscription.metadata);
    const nextMetadata = {
      ...currentMetadata,
      billing_details: {
        company_name: billingDetails.companyName.trim(),
        billing_email: billingDetails.billingEmail.trim(),
        billing_contact: billingDetails.billingContact.trim(),
        address_line_1: billingDetails.addressLine1.trim(),
        address_line_2: billingDetails.addressLine2.trim(),
        town_or_city: billingDetails.townOrCity.trim(),
        county: billingDetails.county.trim(),
        postcode: billingDetails.postcode.trim().toUpperCase(),
        country: billingDetails.country.trim(),
        vat_number: billingDetails.vatNumber.trim().toUpperCase(),
        purchase_order_reference:
          billingDetails.purchaseOrderReference.trim(),
      },
    };

    const { data, error } = await supabase
      .from("leo_organisation_subscriptions")
      .update({ metadata: nextMetadata })
      .eq("id", subscription.id)
      .select(
        "id, organisation_id, plan_id, status, employee_count, current_period_starts_at, current_period_ends_at, provider_key, provider_customer_reference, provider_subscription_reference, cancellation_requested_at, cancelled_at, metadata, created_at, updated_at",
      )
      .single();

    if (error) {
      setNotice({ type: "error", message: error.message });
      setSaving(false);
      return;
    }

    const updatedSubscription = data as SubscriptionRecord;
    setSubscription(updatedSubscription);
    setBillingDetails(
      parseBillingDetails(updatedSubscription.metadata, organisation?.name ?? ""),
    );
    setNotice({
      type: "success",
      message: "Billing details have been updated.",
    });
    setSaving(false);
  }

  if (loading) {
    return (
      <div className={uiStyles.workspace}>
        <div className="page-heading">
          <div>
            <p className="eyebrow">Organisation</p>
            <h1>Billing &amp; Subscription</h1>
            <p>Loading your subscription and billing information.</p>
          </div>
        </div>
        <section className="loading-card" aria-live="polite">
          <div className="loading-line loading-line-wide" />
          <div className="loading-line" />
          <div className="loading-line loading-line-short" />
        </section>
</div>
    );
  }

  if (pageError || !organisation) {
    return (
      <div className={uiStyles.workspace}>
        <div className="page-heading">
          <div>
            <p className="eyebrow">Organisation</p>
            <h1>Billing &amp; Subscription</h1>
            <p>Manage your organisation subscription and billing records.</p>
          </div>
        </div>
        <section className="state-card error-state" role="alert">
          <div className="state-icon">!</div>
          <div>
            <h2>Billing could not be loaded</h2>
            <p>{pageError || "The billing record is not available."}</p>
            <div className="state-actions">
              <button type="button" onClick={() => void loadBilling()}>
                Try again
              </button>
            </div>
          </div>
        </section>
</div>
    );
  }

  const now = new Date();
  const trialActive =
    trial?.status === "active" &&
    (!trial.ends_at || new Date(trial.ends_at).getTime() > now.getTime());

  const capacity =
    entitlement?.employee_capacity ??
    subscription?.employee_count ??
    capacityFromBand(organisation.employee_count_band);

  const planName = planFromCapacity(capacity, Boolean(trialActive));
  const billingPortalUrl = getBillingPortalUrl(subscription?.metadata ?? null);
  const nearLimit =
    capacity !== null && capacity > 0 && activeEmployeeCount >= capacity * 0.95;
  const atLimit = capacity !== null && activeEmployeeCount >= capacity;
  const status = entitlement?.access_status ?? subscription?.status ?? trial?.status ?? "inactive";

  return (
    <div className={uiStyles.workspace}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Organisation</p>
          <h1>Billing &amp; Subscription</h1>
          <p>Manage your subscription, billing information and invoices.</p>
        </div>
        <div className="heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadBilling(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {notice ? (
        <div
          className={`notice ${notice.type === "success" ? "notice-success" : "notice-error"}`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          <span>{notice.type === "success" ? "✓" : "!"}</span>
          <p>{notice.message}</p>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notice">
            ×
          </button>
        </div>
      ) : null}

      <section className="summary-grid" aria-label="Subscription summary">
        <article className="summary-card">
          <span className="summary-label">Current subscription</span>
          <strong>{planName}</strong>
          <small>Access to the complete LEO platform</small>
        </article>
        <article className="summary-card">
          <span className="summary-label">Subscription status</span>
          <strong>{titleCase(status)}</strong>
          <small>{trialActive ? "7-day trial access" : "Organisation access status"}</small>
        </article>
        <article className="summary-card">
          <span className="summary-label">Renewal or expiry</span>
          <strong>
            {formatDate(
              trialActive
                ? trial?.ends_at ?? null
                : subscription?.current_period_ends_at ?? entitlement?.effective_until ?? null,
            )}
          </strong>
          <small>{trialActive ? "Trial expiry date" : "Current billing period"}</small>
        </article>
        <article className="summary-card">
          <span className="summary-label">Billing frequency</span>
          <strong>{trialActive ? "Trial" : "Monthly"}</strong>
          <small>{subscription?.provider_key ? `${titleCase(subscription.provider_key)} billing` : "Provider-neutral billing"}</small>
        </article>
      </section>

      {(nearLimit || atLimit) && capacity !== null ? (
        <section className={`capacity-notice ${atLimit ? "capacity-critical" : ""}`}>
          <div>
            <span className="capacity-icon">{atLimit ? "!" : "↗"}</span>
          </div>
          <div>
            <h2>
              {atLimit
                ? "You have reached the employee limit for your current subscription."
                : "You are approaching the employee limit for your current subscription."}
            </h2>
            <p>
              {atLimit
                ? `To add more employees, you will need to increase your subscription beyond ${capacity} employees.`
                : `If your organisation grows beyond ${capacity} employees, you will need to increase your subscription before adding additional employees.`}
            </p>
          </div>
        </section>
      ) : null}

      <div className="content-grid">
        <section className="panel subscription-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Subscription</p>
              <h2>{planName}</h2>
            </div>
            <span className={`status-pill status-${status}`}>{titleCase(status)}</span>
          </div>

          <p className="panel-intro">
            Your subscription provides access to the complete LEO platform. Subscription levels are based only on organisation size.
          </p>

          <dl className="detail-list">
            <div>
              <dt>Organisation</dt>
              <dd>{organisation.name}</dd>
            </div>
            <div>
              <dt>Active employees</dt>
              <dd>{activeEmployeeCount.toLocaleString("en-GB")}</dd>
            </div>
            <div>
              <dt>Subscription level</dt>
              <dd>{capacity === null ? "Over 250 employees" : `Up to ${capacity} employees`}</dd>
            </div>
            <div>
              <dt>Current period started</dt>
              <dd>{formatDate(subscription?.current_period_starts_at ?? trial?.starts_at ?? null)}</dd>
            </div>
            <div>
              <dt>Current period ends</dt>
              <dd>{formatDate(subscription?.current_period_ends_at ?? trial?.ends_at ?? null)}</dd>
            </div>
            <div>
              <dt>Cancellation requested</dt>
              <dd>{formatDate(subscription?.cancellation_requested_at ?? null)}</dd>
            </div>
          </dl>

          <div className="button-row">
            {billingPortalUrl ? (
              <a href={billingPortalUrl} target="_blank" rel="noreferrer" className="primary-button">
                Manage subscription
              </a>
            ) : (
              <button type="button" className="primary-button" disabled title="A payment provider portal has not yet been connected.">
                Manage subscription
              </button>
            )}
            <span className="button-help">
              {billingPortalUrl
                ? "Subscription and payment changes open securely with the billing provider."
                : "Subscription changes will be available here when the secure payment provider is connected."}
            </span>
          </div>
        </section>

        <section className="panel payment-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Payment</p>
              <h2>Payment method</h2>
            </div>
          </div>

          <div className="payment-state">
            <div className="payment-mark">£</div>
            <div>
              <strong>{subscription?.provider_key ? `${titleCase(subscription.provider_key)} account` : "Secure payment provider"}</strong>
              <p>
                {subscription?.provider_customer_reference
                  ? `Customer reference ${subscription.provider_customer_reference}`
                  : "Payment details are held securely by the payment provider and are never stored directly in LEO."}
              </p>
            </div>
          </div>

          {billingPortalUrl ? (
            <a href={billingPortalUrl} target="_blank" rel="noreferrer" className="secondary-button full-width-button">
              Update payment method
            </a>
          ) : (
            <button type="button" className="secondary-button full-width-button" disabled>
              Update payment method
            </button>
          )}
        </section>
      </div>

      <section className="panel billing-details-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Billing information</p>
            <h2>Billing details</h2>
          </div>
        </div>
        <p className="panel-intro">
          These details are used for billing records and future invoices. They do not change the organisation profile shown elsewhere in LEO.
        </p>

        <form onSubmit={handleSaveBillingDetails}>
          <div className="form-grid">
            <label>
              <span>Company name</span>
              <input
                value={billingDetails.companyName}
                onChange={(event) =>
                  setBillingDetails((current) => ({
                    ...current,
                    companyName: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              <span>Billing email</span>
              <input
                type="email"
                value={billingDetails.billingEmail}
                onChange={(event) =>
                  setBillingDetails((current) => ({
                    ...current,
                    billingEmail: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Billing contact</span>
              <input
                value={billingDetails.billingContact}
                onChange={(event) =>
                  setBillingDetails((current) => ({
                    ...current,
                    billingContact: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>VAT number</span>
              <input
                value={billingDetails.vatNumber}
                onChange={(event) =>
                  setBillingDetails((current) => ({
                    ...current,
                    vatNumber: event.target.value,
                  }))
                }
              />
            </label>
            <label className="form-span-2">
              <span>Address line 1</span>
              <input
                value={billingDetails.addressLine1}
                onChange={(event) =>
                  setBillingDetails((current) => ({
                    ...current,
                    addressLine1: event.target.value,
                  }))
                }
              />
            </label>
            <label className="form-span-2">
              <span>Address line 2</span>
              <input
                value={billingDetails.addressLine2}
                onChange={(event) =>
                  setBillingDetails((current) => ({
                    ...current,
                    addressLine2: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Town or city</span>
              <input
                value={billingDetails.townOrCity}
                onChange={(event) =>
                  setBillingDetails((current) => ({
                    ...current,
                    townOrCity: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>County</span>
              <input
                value={billingDetails.county}
                onChange={(event) =>
                  setBillingDetails((current) => ({
                    ...current,
                    county: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Postcode</span>
              <input
                value={billingDetails.postcode}
                onChange={(event) =>
                  setBillingDetails((current) => ({
                    ...current,
                    postcode: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Country</span>
              <input
                value={billingDetails.country}
                onChange={(event) =>
                  setBillingDetails((current) => ({
                    ...current,
                    country: event.target.value,
                  }))
                }
              />
            </label>
            <label className="form-span-2">
              <span>Purchase order reference (optional)</span>
              <input
                value={billingDetails.purchaseOrderReference}
                onChange={(event) =>
                  setBillingDetails((current) => ({
                    ...current,
                    purchaseOrderReference: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={saving || !subscription}>
              {saving ? "Saving…" : "Save billing details"}
            </button>
            {!subscription ? (
              <p>Billing details can be saved once the organisation has an active subscription record.</p>
            ) : null}
          </div>
        </form>
      </section>

      <section className="panel invoice-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Billing history</p>
            <h2>Invoices</h2>
          </div>
          <span className="record-count">{invoices.length} record{invoices.length === 1 ? "" : "s"}</span>
        </div>

        {invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">▤</div>
            <div>
              <h3>No invoices are available</h3>
              <p>Invoices will appear here after the first bill is issued.</p>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="action-column">Document</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{formatDate(invoice.issued_at)}</td>
                    <td>
                      <strong>{invoice.invoice_reference}</strong>
                      {invoice.due_at ? <small>Due {formatDate(invoice.due_at)}</small> : null}
                    </td>
                    <td>{formatMoney(invoice.total_pence, invoice.currency_code)}</td>
                    <td>
                      <span className={`status-pill status-${invoice.status}`}>
                        {titleCase(invoice.status)}
                      </span>
                    </td>
                    <td className="action-column">
                      {invoice.hosted_invoice_url ? (
                        <a href={invoice.hosted_invoice_url} target="_blank" rel="noreferrer" className="table-link">
                          View invoice
                        </a>
                      ) : invoice.invoice_document_path ? (
                        <span className="document-held">Document held securely</span>
                      ) : (
                        <span className="muted">Not available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel plans-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Subscription levels</p>
            <h2>One complete platform</h2>
          </div>
        </div>
        <p className="panel-intro">
          Every paid subscription includes the complete LEO platform. Subscription levels change only according to organisation size.
        </p>

        <div className="plans-grid">
          {[
            { name: "Free trial", detail: "7 days", capacityValue: "trial" },
            { name: "Up to 50", detail: "Up to 50 employees", capacityValue: 50 },
            { name: "Up to 150", detail: "Up to 150 employees", capacityValue: 150 },
            { name: "Up to 250", detail: "Up to 250 employees", capacityValue: 250 },
            { name: "Over 250", detail: "Tailored organisation pricing", capacityValue: null },
          ].map((plan) => {
            const current =
              (plan.capacityValue === "trial" && trialActive) ||
              (!trialActive && plan.capacityValue === capacity);

            return (
              <article key={plan.name} className={`plan-card ${current ? "current-plan" : ""}`}>
                {current ? <span className="current-badge">Current subscription</span> : null}
                <h3>{plan.name}</h3>
                <p>{plan.detail}</p>
                <span>Complete platform included</span>
              </article>
            );
          })}
        </div>
      </section>
</div>
  );
}