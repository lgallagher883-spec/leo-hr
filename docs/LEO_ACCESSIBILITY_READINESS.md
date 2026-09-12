# Leo HR — Accessibility Readiness

**Status:** Assessment plan; no conformance claim  
**Target:** WCAG 2.2 AA  
**Last reviewed:** 12 September 2026

## Procurement position

Leo does not currently claim independently verified WCAG 2.2 AA conformance. Public-sector buyers may require evidence that the browser-based employee and employer service is accessible. A product-specific assessment and statement should therefore be completed before a G-Cloud submission.

## Assessment scope

Test representative journeys across desktop, narrow/mobile viewports, keyboard-only use and screen-reader use:

1. registration, sign-in, password recovery and invitation acceptance;
2. dashboard and primary navigation;
3. employee list, profile, forms and document access;
4. employee self-service and My Employment;
5. leave/absence and probation workflows;
6. Matters and Ask Leo chat;
7. Compliance, SAR Requests and Audit Logs;
8. HR Resources and document outputs;
9. Talent and onboarding workflows;
10. Organisation, Foundations, Connections and Billing.

## Evidence checklist

| Area | Checks | Status |
| --- | --- | --- |
| Keyboard | Logical order, visible focus, no keyboard traps, operable dialogs/menus | Test required |
| Screen readers | Landmarks, headings, labels, names/roles/values, live status/error announcements | Test required |
| Forms | Programmatic labels, instructions, error identification, recovery and autocomplete | Test required |
| Contrast | Text, controls, focus indicators, status colours and disabled states | Test required |
| Reflow | Usable at 320 CSS px and high zoom without hidden actions or two-dimensional scrolling where avoidable | Test required |
| Text | Resize, spacing overrides, plain language and meaningful link/button names | Test required |
| Motion/time | Reduced-motion support and adjustable/appropriate time limits | Test required |
| Documents | Accessibility of essential PDFs, exports, forms and templates | Test required |
| Authentication | Accessible authentication without unnecessary cognitive tests or barriers | Test required |
| AI/chat | Reading order, streaming announcements, input/send controls and error recovery | Test required |

## Testing method

- automated testing across representative routes;
- manual keyboard and 200%/400% zoom checks;
- Windows/NVDA plus Chrome or Edge screen-reader checks;
- mobile screen-reader checks where proportionate;
- documented issue severity, owner and remediation target;
- retest material fixes before publishing the statement.

Automated tools alone are not sufficient evidence of conformance.

## Accessibility statement inputs

The final public statement should record:

- the service and parts covered;
- the claimed conformance status, based on completed testing;
- known non-accessible content and relevant WCAG criteria;
- planned fixes and dates;
- any properly assessed disproportionate-burden position;
- how to request information in an alternative format;
- how to report an accessibility problem;
- escalation/enforcement information appropriate to the buyer's use;
- preparation date, review date and testing method.

## Immediate actions

1. Run the scoped assessment against a controlled test organisation containing synthetic data.
2. Fix critical blockers affecting authentication, navigation, forms and employee self-service first.
3. Record remaining issues openly; do not publish a blanket conformance claim.
4. Publish and regularly review the product-specific accessibility statement.
5. Build accessibility regression checks into future releases.

