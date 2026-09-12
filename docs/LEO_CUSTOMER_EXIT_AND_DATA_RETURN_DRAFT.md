# Leo HR — Customer Exit and Data Return (Draft)

**Status:** Recommended procurement position; technical validation required  
**Last reviewed:** 12 September 2026

## Objective

Provide an orderly, secure exit without trapping the customer in Leo or retaining workforce data without a lawful reason.

## Proposed standard exit

1. An authorised Owner or nominated contract contact submits the closure/export request.
2. Leo verifies authority, scope, desired export and the contract end date.
3. Existing self-service exports remain available while the account is active.
4. Leo supplies the agreed structured export within 20 business days of a complete, verified request, subject to data volume and any separately scoped migration work.
5. The customer confirms receipt or raises a material export issue.
6. Customer access ends on the agreed termination date or after a proposed 30-day read-only exit window, whichever is documented in the call-off.
7. Production customer data is deleted or anonymised within 30 days after the later of contract end and completion of the agreed export, except where law or an unresolved dispute requires limited retention.
8. Residual backup copies follow the relevant managed provider's protected backup lifecycle and are not restored for ordinary business use after deletion.

## Export scope

The final technical schedule must identify which data can be supplied in:

- CSV or another structured, commonly used format;
- PDF/DOCX for human-readable case or document outputs;
- original uploaded file format where practicable;
- a secure transfer method proportionate to the data.

The repository currently evidences specific exports in parts of the product, but a single complete organisation export has not been verified. Until it is implemented and tested, procurement wording must describe a managed export service rather than claiming a one-click full export.

## Charges

Standard, proportionate export and account closure should be included in the subscription. Bespoke transformation, cleansing, mapping, migration into another system, onsite work or repeated exports may be separately scoped and charged with the customer's agreement.

## Security and audit

- verify the requester's authority;
- use a secure delivery method;
- avoid sending sensitive workforce data through ordinary unprotected email attachments;
- record the request, export, delivery, access closure and deletion decision;
- preserve only the minimum evidence needed to demonstrate completion.

## Validation before contractual use

- inventory all organisation-owned tables and storage objects;
- implement or document the managed full-export procedure;
- verify export completeness with synthetic test data;
- confirm Supabase/Vercel/provider backup deletion behaviour;
- align the timetable with the DPA, terms and call-off contract.

