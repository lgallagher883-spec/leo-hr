# Leo HR — Subprocessor Register (Draft for Verification)

**Supplier:** LEO HR LTD  
**Last reviewed:** 12 September 2026

This is a working register, not yet a contractual subprocessor notice. Each entry must be verified against the live production configuration and current provider terms before publication.

| Provider | Purpose | Data involved | Use | Verification required |
| --- | --- | --- | --- | --- |
| Vercel | Application hosting, deployment and runtime | Application requests and operational metadata; customer data processed by hosted functions where applicable | Core | Contracting entity, processing locations, transfer mechanism, retention |
| Supabase | Database, authentication and object storage | Account, organisation, employee and HR records; authentication and stored documents | Core | Project region, contracting entity, backups, retention, transfer mechanism |
| OpenAI | AI-assisted features | Prompts and selected organisation/HR context sent by Leo for enabled AI functions | Core for AI features | API data controls, retention, processing location and contractual terms |
| Stripe | Subscription billing | Customer/account and transaction metadata; payment data handled by Stripe | Core for paid subscriptions | Contracting entity, data categories and transfer mechanism |
| Brevo | Transactional email delivery | Recipient address, message metadata and message content required for delivery | Core where configured | Confirm live sender, retention, processing locations and DPA |
| Help Scout | Customer support and help-centre services | Support contact details, messages and attachments supplied in support interactions | Core support | Confirm beacon/mailbox configuration, retention and processing locations |
| DocuSign | Electronic signature workflows | Documents and signer/contact information selected by the customer | Optional | Confirm production status, data flow and customer activation |
| Microsoft | Customer-authorised workspace integration | Data selected or accessed through the enabled Microsoft connection | Optional | Confirm scopes, services, retention and controller/processor roles |
| Google | Customer-authorised workspace integration | Data selected or accessed through the enabled Google connection | Optional | Confirm scopes, services, retention and controller/processor roles |
| Zoom | Customer-authorised meeting integration | Meeting and account metadata needed for the enabled workflow | Optional | Confirm production status, scopes and data flow |
| CareCheck | DBS/right-to-work integration | Candidate/employee identity and screening data selected for checks | Optional / pending | Do not publish as live until integration and contract are complete |

## Publication controls

- Distinguish core subprocessors from optional providers activated by a customer.
- Include notification arrangements for material additions or replacements in the DPA.
- Keep processing purpose, location and transfer safeguards aligned with each provider's current legal terms.
- Do not describe an integration under development as a live subprocessor.

