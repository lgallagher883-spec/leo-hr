# CareCheck integration

## Current position

Leo has a working CareCheck development integration for candidate DBS checks and a development Right to Work flow built on the same Candidate Invite and Status Pull services.

The per-organisation connection flow is implemented. Production provider actions remain explicitly disabled until authenticated production SOAP and the controlled production workflow are verified.

## Confirmed customer account model

CareCheck confirmed on 28 September 2026 that Leo HR customers may register for their own CareCheck accounts and connect those independent accounts through Leo HR.

The production model is therefore:

- Each employer registers directly with CareCheck.
- Each employer remains the CareCheck customer for its own applications and billing.
- Leo HR acts as the software integration/interface.
- CareCheck credentials and organisation references are resolved per Leo organisation.
- Leo's own CareCheck account must never be used as a fallback for customer production checks.
- Existing candidate/application data remains scoped by Leo `organisation_id`.

Global `CARECHECK_*` environment variables are retained only for Leo's development sandbox. Customer production checks resolve the authenticated employer's encrypted CareCheck connection and never fall back to Leo's credentials.

## Confirmed endpoints

Development currently uses the CareCheck sandbox configured in the codebase.

Production endpoints confirmed by CareCheck:

- Candidate Invite: `https://www.matrixscreening.com/care/ws/candidateInviteService`
- Status Pull: `https://www.matrixscreening.com/care/ws/statusPullService`

Authentication is WS-Security UsernameToken. Development may use Leo sandbox environment variables; customer production actions use the authenticated employer's encrypted CareCheck credentials resolved from its Leo organisation connection.

## Candidate Invite codes

CareCheck Candidate Invite WSDL and provider confirmation establish these values:

### DBS checkType

- Basic DBS: `Y`
- Standard DBS: `XS`
- Enhanced DBS: `XE`

### Right to Work

- `checkType=D`
- `type=RTW`

The Candidate Invite WSDL describes `D` as DIGITAL_RIGHT_TO_WORK_CHECK and `RTW` as the standalone Right to Work invite type.

## Official Status Pull lifecycle

The Status Pull WSDL defines the following status codes:

- `INVITE_SENT` — Invite sent to candidate
- `AWAITING_DIGITAL_ID` — Awaiting Digital ID result
- `FORM_READY` — Submitted by applicant, ready for processing
- `FORM_COMPLETE` — Ready for Registered Body countersignature
- `FORM_AUTHORISED` — Countersigned, ready for sending to checking authority
- `APP_SENT` — Sent to checking authority
- `APP_RECEIVED` — Received by checking authority
- `APP_REJECTED` — Rejected by checking authority, correction/resubmission required
- `APP_COMPLETE` — Completed by checking authority, result available
- `APP_WITHDRAWN` — Withdrawn from eBulkPlus
- `FORM_INVALID` — Invalid and not sent to checking authority
- `AWAITING_MEDIA_CHECK` — Awaiting media check

Leo maps these deterministically rather than relying on keyword matching.

## Status Pull result data

Leo's parser supports the provider fields relevant to the agreed integration scope, including:

- ApplicationReference
- ExternalRef
- StatusCode / StatusDescription
- IsCurrentStatus
- DBSReference
- DisclosureType
- ResultType
- RiskAssessment
- CertificateNo
- CertificateIssueDate
- CertificateReceivedDate
- CertificateSeenDate
- WithdrawalReason / WithdrawalDate
- WorkingWithVulnerableAdults
- WorkingWithChildren
- Workforce
- DigitalIDCheckStatus / DigitalIDCheckDate
- RtwCheckStatus / RtwCheckDate

For DBS, `ResultType=false` means a clear result. `ResultType=true` means a non-clear result requiring assessment. Leo must not turn a non-clear result into an automated suitability decision.

For Right to Work, provider completion does not automatically mark the person as verified. Leo preserves the provider status/result and leaves the employer's final verification record explicit.

## Polling and rate limits

CareCheck recommends:

- Leave at least a few seconds between API requests.
- Poll application updates no more than twice per day in production.

The Status Pull WSDL supports up to 200 application status requests in one request, which should be used for efficient production polling rather than issuing one request per application.

## Production activation checklist

Before production actions are enabled:

1. Each employer that wants the integration registers directly with CareCheck.
2. Leo's organisation-specific connection flow stores/resolves that employer's CareCheck connection without exposing credentials to normal organisation records or client-side code. Implemented.
3. DBS and Right to Work routes resolve the authenticated Leo organisation before any provider request. Implemented.
4. Global Leo sandbox credentials are not permitted as a production customer fallback. Implemented.
5. A controlled production test is agreed and completed with an independently registered CareCheck customer account.
6. Automated polling is configured to respect the twice-daily recommendation.
7. Development-only controls/test routes are reviewed and removed or locked down. Implemented for the current test routes.
8. No raw SOAP envelope, credential material or candidate personal data is written to application logs. Implemented in the CareCheck SOAP layer.
9. Owner/Senior-only connection management and tenant-isolation tests are completed before production activation.

## Scope

Current agreed CareCheck scope:

- Basic DBS
- Standard DBS
- Enhanced DBS
- Remote Right to Work

Media/adverse-media checks are not part of the current Leo integration scope.
