"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type JsonRecord = Record<string, unknown>;

type MembershipRecord = {
  organisation_id: string;
};

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

export default function BillingPage() {
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

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setPageError(
          userError?.message ||
            "Your billing information could not be loaded because you are not signed in.",
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let membership: MembershipRecord | null = null;

      const legacyMembershipResult = await supabase
        .from("organisation_memberships")
        .select("organisation_id")
        .eq("user_id", user.id)
        .eq("membership_status", "active")
        .order("is_default_organisation", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (legacyMembershipResult.data?.organisation_id) {
        membership = legacyMembershipResult.data as MembershipRecord;
      } else {
        const identityMembershipResult = await (supabase as any)
  .from("identity_organisation_memberships")
          .select("organisation_id")
          .eq("user_id", user.id)
          .eq("membership_status", "active")
          .order("is_default_organisation", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (identityMembershipResult.error) {
          setPageError(
            legacyMembershipResult.error?.message ||
              identityMembershipResult.error.message,
          );
          setLoading(false);
          setRefreshing(false);
          return;
        }

        membership = identityMembershipResult.data as MembershipRecord | null;
      }

      if (!membership?.organisation_id) {
        setPageError("No active organisation is linked to your account.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const organisationId = membership.organisation_id;

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
    [supabase],
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
      <main className="billing-page">
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
        <style jsx>{styles}</style>
      </main>
    );
  }

  if (pageError || !organisation) {
    return (
      <main className="billing-page">
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
              <Link href="/dashboard/organisation">Return to Organisation</Link>
            </div>
          </div>
        </section>
        <style jsx>{styles}</style>
      </main>
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
    <main className="billing-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Organisation</p>
          <h1>Billing &amp; Subscription</h1>
          <p>Manage your subscription, billing information and invoices.</p>
        </div>
        <div className="heading-actions">
          <Link href="/dashboard/organisation" className="secondary-button">
            Organisation overview
          </Link>
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

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  .billing-page {
    --leo-purple: #6e5084;
    --leo-purple-dark: #523b63;
    --leo-purple-soft: #f7f1fc;
    --leo-jade: #f5fff9;
    --leo-border: #e8deee;
    --leo-text: #2f2933;
    --leo-muted: #6f6674;
    min-height: 100%;
    padding: 28px;
    background: #fbf9fc;
    color: var(--leo-text);
  }

  .page-heading {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  .eyebrow,
  .section-kicker {
    margin: 0 0 6px;
    color: var(--leo-purple);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  h1,
  h2,
  h3,
  p {
    margin-top: 0;
  }

  h1 {
    margin-bottom: 8px;
    font-size: clamp(30px, 4vw, 42px);
    line-height: 1.05;
    letter-spacing: -0.035em;
  }

  .page-heading p:last-child {
    margin-bottom: 0;
    color: var(--leo-muted);
  }

  .heading-actions,
  .button-row,
  .state-actions,
  .form-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  button,
  a {
    font: inherit;
  }

  .primary-button,
  .secondary-button,
  .state-actions button,
  .state-actions a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 10px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 750;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  }

  .primary-button,
  .state-actions button {
    border: 1px solid var(--leo-purple);
    background: var(--leo-purple);
    color: white;
  }

  .secondary-button,
  .state-actions a {
    border: 1px solid var(--leo-border);
    background: white;
    color: var(--leo-purple-dark);
  }

  .primary-button:not(:disabled):hover,
  .secondary-button:not(:disabled):hover,
  .state-actions button:hover,
  .state-actions a:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(82, 59, 99, 0.1);
  }

  button:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }

  .notice {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    margin-bottom: 20px;
    border: 1px solid;
    border-radius: 14px;
  }

  .notice p {
    margin: 0;
  }

  .notice button {
    border: 0;
    background: transparent;
    font-size: 22px;
    cursor: pointer;
  }

  .notice-success {
    background: #f0fbf5;
    border-color: #bfe5cf;
    color: #225f40;
  }

  .notice-error {
    background: #fff5f5;
    border-color: #f0caca;
    color: #8a3030;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }

  .summary-card,
  .panel,
  .state-card,
  .loading-card {
    border: 1px solid var(--leo-border);
    border-radius: 18px;
    background: white;
    box-shadow: 0 9px 28px rgba(77, 55, 90, 0.055);
  }

  .summary-card {
    min-width: 0;
    padding: 18px;
  }

  .summary-label {
    display: block;
    margin-bottom: 12px;
    color: var(--leo-muted);
    font-size: 13px;
    font-weight: 700;
  }

  .summary-card strong {
    display: block;
    overflow-wrap: anywhere;
    margin-bottom: 6px;
    font-size: 20px;
    line-height: 1.2;
  }

  .summary-card small {
    color: var(--leo-muted);
  }

  .capacity-notice {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 14px;
    margin-bottom: 20px;
    padding: 18px;
    border: 1px solid #ead7a0;
    border-radius: 16px;
    background: #fffaf0;
  }

  .capacity-critical {
    border-color: #efc2c2;
    background: #fff5f5;
  }

  .capacity-icon {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: white;
    font-weight: 900;
  }

  .capacity-notice h2 {
    margin-bottom: 5px;
    font-size: 17px;
  }

  .capacity-notice p {
    margin-bottom: 0;
    color: var(--leo-muted);
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.85fr);
    gap: 20px;
    margin-bottom: 20px;
  }

  .panel {
    padding: 22px;
    margin-bottom: 20px;
  }

  .content-grid .panel {
    margin-bottom: 0;
  }

  .panel-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 14px;
  }

  .panel-heading h2 {
    margin-bottom: 0;
    font-size: 22px;
    letter-spacing: -0.02em;
  }

  .panel-intro {
    max-width: 820px;
    margin-bottom: 20px;
    color: var(--leo-muted);
    line-height: 1.65;
  }

  .status-pill,
  .current-badge,
  .record-count {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
  }

  .status-pill {
    background: var(--leo-purple-soft);
    color: var(--leo-purple-dark);
  }

  .status-active,
  .status-paid,
  .status-trial {
    background: #eaf8ef;
    color: #24633f;
  }

  .status-past_due,
  .status-open,
  .status-grace {
    background: #fff4d8;
    color: #795a12;
  }

  .status-cancelled,
  .status-expired,
  .status-suspended,
  .status-uncollectible {
    background: #fcecec;
    color: #8d3232;
  }

  .detail-list {
    margin: 0 0 20px;
    border-top: 1px solid #efe8f2;
  }

  .detail-list > div {
    display: grid;
    grid-template-columns: minmax(160px, 0.8fr) minmax(0, 1.2fr);
    gap: 18px;
    padding: 13px 0;
    border-bottom: 1px solid #efe8f2;
  }

  .detail-list dt {
    color: var(--leo-muted);
  }

  .detail-list dd {
    margin: 0;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .button-help {
    max-width: 470px;
    color: var(--leo-muted);
    font-size: 13px;
    line-height: 1.5;
  }

  .payment-state {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid var(--leo-border);
    border-radius: 14px;
    background: var(--leo-purple-soft);
  }

  .payment-mark {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: white;
    color: var(--leo-purple);
    font-weight: 900;
  }

  .payment-state p {
    margin: 5px 0 0;
    color: var(--leo-muted);
    font-size: 13px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .full-width-button {
    width: 100%;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .form-grid label {
    display: grid;
    gap: 7px;
    min-width: 0;
  }

  .form-grid label span {
    font-size: 13px;
    font-weight: 750;
  }

  .form-grid input {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 11px 12px;
    border: 1px solid #ddd0e4;
    border-radius: 11px;
    background: #fff;
    color: var(--leo-text);
    outline: none;
  }

  .form-grid input:focus {
    border-color: var(--leo-purple);
    box-shadow: 0 0 0 3px rgba(110, 80, 132, 0.12);
  }

  .form-span-2 {
    grid-column: span 2;
  }

  .form-actions {
    margin-top: 20px;
  }

  .form-actions p {
    margin: 0;
    color: var(--leo-muted);
    font-size: 13px;
  }

  .record-count {
    background: #f4f1f5;
    color: var(--leo-muted);
  }

  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }

  table {
    width: 100%;
    min-width: 760px;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 14px 12px;
    border-bottom: 1px solid #eee7f1;
    text-align: left;
    vertical-align: middle;
  }

  th {
    color: var(--leo-muted);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  td strong,
  td small {
    display: block;
  }

  td small {
    margin-top: 4px;
    color: var(--leo-muted);
  }

  .action-column {
    text-align: right;
  }

  .table-link {
    color: var(--leo-purple);
    font-weight: 800;
    text-decoration: none;
  }

  .document-held,
  .muted {
    color: var(--leo-muted);
    font-size: 13px;
  }

  .empty-state,
  .state-card {
    display: flex;
    gap: 15px;
    align-items: flex-start;
  }

  .empty-state {
    padding: 22px;
    border: 1px dashed #d9cadd;
    border-radius: 14px;
    background: #fcf9fd;
  }

  .empty-state h3,
  .state-card h2 {
    margin-bottom: 6px;
  }

  .empty-state p,
  .state-card p {
    margin-bottom: 0;
    color: var(--leo-muted);
  }

  .empty-icon,
  .state-icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 42px;
    height: 42px;
    border-radius: 13px;
    background: var(--leo-purple-soft);
    color: var(--leo-purple);
    font-weight: 900;
  }

  .state-card {
    padding: 24px;
  }

  .state-actions {
    margin-top: 16px;
  }

  .error-state {
    border-color: #efcdcd;
  }

  .plans-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }

  .plan-card {
    position: relative;
    min-width: 0;
    min-height: 150px;
    padding: 18px;
    border: 1px solid var(--leo-border);
    border-radius: 15px;
    background: #fff;
  }

  .plan-card.current-plan {
    border-color: var(--leo-purple);
    background: var(--leo-purple-soft);
    box-shadow: inset 0 0 0 1px var(--leo-purple);
  }

  .current-badge {
    margin-bottom: 15px;
    background: var(--leo-purple);
    color: white;
  }

  .plan-card h3 {
    margin-bottom: 8px;
    font-size: 17px;
  }

  .plan-card p {
    margin-bottom: 22px;
    color: var(--leo-muted);
    font-size: 13px;
  }

  .plan-card > span:last-child {
    color: var(--leo-purple-dark);
    font-size: 12px;
    font-weight: 800;
  }

  .loading-card {
    padding: 24px;
  }

  .loading-line {
    height: 14px;
    width: 55%;
    margin-bottom: 14px;
    border-radius: 999px;
    background: linear-gradient(90deg, #eee8f1, #f8f5f9, #eee8f1);
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite linear;
  }

  .loading-line-wide {
    width: 78%;
  }

  .loading-line-short {
    width: 32%;
    margin-bottom: 0;
  }

  @keyframes shimmer {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }

  @media (max-width: 1180px) {
    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .plans-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 860px) {
    .billing-page {
      padding: 20px;
    }

    .page-heading,
    .content-grid {
      display: block;
    }

    .heading-actions {
      margin-top: 18px;
    }

    .content-grid .panel:first-child {
      margin-bottom: 20px;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .form-span-2 {
      grid-column: auto;
    }

    .plans-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .billing-page {
      padding: 16px;
    }

    .summary-grid,
    .plans-grid {
      grid-template-columns: 1fr;
    }

    .heading-actions > *,
    .button-row > *,
    .form-actions > * {
      width: 100%;
    }

    .detail-list > div {
      grid-template-columns: 1fr;
      gap: 5px;
    }

    .panel {
      padding: 18px;
    }
  }
`;