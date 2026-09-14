# CareCheck integration

## Current position

Leo has a working CareCheck development integration for candidate DBS checks and a development Right to Work flow built on the same Candidate Invite and Status Pull services.

Production provider actions remain disabled until CareCheck issues Leo's production username, password and organisation reference.

## Confirmed endpoints

Development currently uses the CareCheck sandbox configured in the codebase.

Production endpoints confirmed by CareCheck:

- Candidate Invite: `https://www.matrixscreening.com/care/ws/candidateInviteService`
- Status Pull: `https://www.matrixscreening.com/care/ws/statusPullService`

Authentication is WS-Security UsernameToken using the Leo CareCheck environment variables.

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

1. CareCheck creates Leo's production account.
2. CareCheck supplies the production username/password.
3. CareCheck supplies Leo's production organisation reference.
4. Production secrets are added to the approved environment only.
5. A controlled production test is agreed and completed.
6. Automated polling is configured to respect the twice-daily recommendation.
7. Development-only controls/test routes are reviewed and removed or locked down.
8. No raw SOAP envelope, credential material or candidate personal data is written to application logs.

## Scope

Current agreed CareCheck scope:

- Basic DBS
- Standard DBS
- Enhanced DBS
- Remote Right to Work

Media/adverse-media checks are not part of the current Leo integration scope.
