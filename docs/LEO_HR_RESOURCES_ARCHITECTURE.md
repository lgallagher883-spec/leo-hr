LEO HR Resources™ Architecture
Version: 1.0
Status: In Development
Owner: Leo HR
Last Updated: 12 July 2026
________________________________________
1. Purpose
LEO HR Resources™ is the organisational document intelligence layer within LEO KNOWLEDGE™.
Its purpose is to enable Leo to understand, use, maintain and strengthen an employer’s HR and employment framework over time.
HR Resources does not exist simply to store files.
It exists to transform organisational documents, templates, guidance, forms and training materials into structured organisational knowledge that Leo can retrieve and apply throughout the platform.
HR Resources enables Leo to move from general HR guidance to organisation-specific guidance.
Instead of saying:
“Generally, an employer should follow a fair disciplinary process.”
Leo should be able to say:
“Your Disciplinary Policy requires an investigation before a formal hearing. Based on the information recorded in this Matter, that stage has not yet been completed.”
The long-term objective is for Leo to function as an experienced HR Director who understands the organisation’s employment framework, identifies opportunities to strengthen it and offers practical help where documentation is missing, unclear or may benefit from review.
________________________________________
2. Guiding Principle
HR Resources does not exist to store documents. It exists to help Leo understand, maintain and strengthen an organisation’s employment framework over time.
Every HR Resources feature must support this principle.
The platform should never become a passive document repository.
It should progressively enable Leo to:
•	recognise organisational resources;
•	understand their purpose;
•	retrieve relevant content;
•	identify applicable provisions;
•	compare documents against trusted authority;
•	identify inconsistencies or areas for review;
•	offer to prepare improved versions;
•	create resources where none currently exist;
•	preserve previous versions for continuity and auditability;
•	use current organisational resources throughout Ask Leo, Matters, LEO DRAFT™ and LEO INSIGHT™.
________________________________________
3. Product Philosophy
LEO HR Resources™ should feel like showing a newly appointed HR Director how the organisation operates.
The wider organisational knowledge journey is:
Foundations
“Tell me about your business.”
Foundations give Leo a structured understanding of the organisation.
HR Resources
“Show me how your business actually works.”
HR Resources provide the documents, templates and materials that evidence the organisation’s formal arrangements.
Matters
“Let’s solve this problem together.”
Leo applies organisational knowledge to live workplace situations.
Organisation Memory
“I’ll remember what you’ve taught me.”
Organisation Memory preserves useful, approved organisational context that does not belong in Foundations or formal documents.
Together, these components should make Leo feel like a trusted HR Director who learns the organisation, rather than software that is configured once and then forgets how the organisation operates.
________________________________________
4. Position Within LEO KNOWLEDGE™
LEO KNOWLEDGE™ consists of three connected organisational knowledge layers:
LEO KNOWLEDGE™

├── Foundations
│   Structured organisational understanding
│
├── HR Resources
│   Organisational documents, evidence and governance materials
│
└── Organisation Memory
    Validated contextual learning over time
Each layer has a different purpose.
Foundations
Foundations contain structured organisational facts established through the Welcome Brief, manual updates and future validated learning.
Examples include:
•	workforce size;
•	probation arrangements;
•	holiday year;
•	management structure;
•	working patterns;
•	HR responsibility;
•	operating locations;
•	regulatory environment.
HR Resources
HR Resources contain formal organisational documents and supporting materials.
Examples include:
•	contracts;
•	policies;
•	procedures;
•	handbooks;
•	forms;
•	letters;
•	templates;
•	risk assessments;
•	training resources;
•	compliance documentation.
Organisation Memory
Organisation Memory will contain employer-approved contextual knowledge that is useful but does not belong in a formal Foundation field or document.
Examples include:
•	preferred management approaches;
•	informal escalation routes;
•	recurring working practices;
•	internal decision preferences;
•	organisational customs.
Organisation Memory must not be built as part of HR Resources Version 1.
________________________________________
5. Authority and Source Hierarchy
Foundations provide context.
HR Resources provide organisation-specific documentary authority.
However, organisational documents do not override higher legal or contractual authority.
Leo should apply the following hierarchy when evaluating organisational resources:
1.	Applicable UK legislation
2.	Binding contractual obligations
3.	Applicable case law principles
4.	ACAS Codes of Practice
5.	Applicable regulatory requirements
6.	Organisational policies
7.	Organisational procedures
8.	Internal guidance and templates
9.	Approved organisational practices
10.	Historical precedent
Where a document conflicts with a higher authority, Leo should identify the issue calmly and explain why the document may benefit from review.
Leo must never silently follow an organisational policy that appears unlawful or materially inconsistent with applicable authority.
Leo must also avoid presenting a document as defective merely because it uses different wording or structure from a standard Leo template.
The question is whether the document is appropriate, lawful, usable and aligned with the organisation’s circumstances.
________________________________________
6. Core Architectural Principles
6.1 Documents become organisational knowledge
Uploaded resources should not remain isolated files.
They should become retrievable organisational knowledge available to the wider Leo architecture.
6.2 Documents are not automatically assumed to be correct
An uploaded policy is evidence of the organisation’s current documented position.
It is not automatically evidence that the position is legally current, internally consistent or suitable for the organisation.
6.3 Leo never invents organisational documentation
Where a resource does not exist, Leo must not imply that it does.
Leo may explain general practice and offer to draft an appropriate resource.
6.4 Missing resources are not treated as failures
A missing document may be entirely reasonable depending on:
•	organisation size;
•	sector;
•	workforce composition;
•	regulatory environment;
•	operational activity;
•	risk exposure;
•	existing contractual arrangements.
Leo should recommend resources proportionately.
6.5 Recommendations must be organisation-specific
Leo should not present every possible policy to every employer.
Recommendations should reflect the employer’s Foundations, sector, workforce and activities.
6.6 Calm confidence
HR Resources should never use alarmist compliance language.
Leo should not create distress through aggressive warnings, red indicators or failure scores.
Leo should communicate as an experienced HR Director:
•	calmly;
•	clearly;
•	proportionately;
•	constructively;
•	without judgement.
6.7 Human approval remains essential
Leo may recommend, review and draft.
The employer remains responsible for approving and adopting organisational documents.
6.8 Historical versions must be preserved
Superseded documents should not be permanently overwritten.
Previous versions may remain relevant to:
•	historical Matters;
•	past decisions;
•	employee disputes;
•	policy interpretation;
•	audit trails;
•	legal proceedings.
6.9 Separation of concerns
The user interface displays resources.
LEO KNOWLEDGE™ retrieves and structures them.
LEO CORE™ reasons using them.
LEO DRAFT™ creates or updates them.
LEO INSIGHT™ identifies patterns and opportunities to strengthen the organisation’s framework.
HR reasoning must not be embedded directly inside UI pages.
________________________________________
7. Resource Scope
HR Resources should support more than policies.
A resource is any organisational material that helps Leo understand, support or evidence the employer’s people practices.
The Version 1 architecture should allow the resource catalogue to expand without requiring structural redesign.
________________________________________
8. Master Resource Categories
8.1 Employment Policies
Examples include:
•	Disciplinary Policy
•	Grievance Policy
•	Capability Policy
•	Performance Management Policy
•	Probation Policy
•	Attendance and Absence Policy
•	Annual Leave Policy
•	Flexible Working Policy
•	Family Leave Policy
•	Maternity Policy
•	Paternity Policy
•	Adoption Policy
•	Shared Parental Leave Policy
•	Parental Leave Policy
•	Parental Bereavement Leave Policy
•	Carer’s Leave Policy
•	Time Off for Dependants Policy
•	Compassionate Leave Policy
•	Equality, Diversity and Inclusion Policy
•	Anti-Harassment and Bullying Policy
•	Dignity at Work Policy
•	Whistleblowing Policy
•	Menopause Policy
•	Neurodiversity Policy or Guidance
•	Reasonable Adjustments Policy
•	Drugs and Alcohol Policy
•	Smoking and Vaping Policy
•	Dress Code Policy
•	Social Media Policy
•	Artificial Intelligence Usage Policy
•	IT Acceptable Use Policy
•	Mobile Phone Policy
•	Email and Communications Policy
•	Monitoring Policy
•	Home Working Policy
•	Hybrid Working Policy
•	Lone Working Policy
•	Driving on Business Policy
•	Company Vehicle Policy
•	Expenses Policy
•	Travel Policy
•	Overtime Policy
•	Pay Policy
•	Bonus and Incentive Policy
•	Training and Development Policy
•	Recruitment Policy
•	Safer Recruitment Policy
•	Right to Work Policy
•	DBS Policy
•	Health and Safety Policy
•	Wellbeing Policy
•	Safeguarding Policy
•	Data Protection and GDPR Policy
•	Privacy Policy
•	Confidentiality Policy
•	Security and Access Policy
•	Business Continuity Policy
•	Complaints and Feedback Policy
•	Noise and Behaviour Policy
•	Anti-Bribery and Corruption Policy
•	Anti-Money Laundering Policy
•	Modern Slavery Policy
•	Settlement Agreement Policy or Guidance
•	Redundancy Policy
•	TUPE Policy or Guidance
•	Subject Access Request Policy or Procedure
________________________________________
8.2 HR Procedures
Examples include:
•	Investigation Procedure
•	Disciplinary Procedure
•	Grievance Procedure
•	Appeal Procedure
•	Capability Procedure
•	Performance Improvement Procedure
•	Absence Management Procedure
•	Long-Term Absence Procedure
•	Return-to-Work Procedure
•	Probation Review Procedure
•	Flexible Working Procedure
•	Recruitment Procedure
•	Safer Recruitment Procedure
•	Onboarding Procedure
•	Right to Work Check Procedure
•	DBS Check Procedure
•	Driving Licence Check Procedure
•	Occupational Health Referral Procedure
•	Reasonable Adjustments Procedure
•	Redundancy Procedure
•	TUPE Procedure
•	Employee Consultation Procedure
•	Settlement Agreement Guidance
•	Subject Access Request Procedure
•	Data Breach Procedure
•	Safeguarding Reporting Procedure
•	Whistleblowing Procedure
•	Complaints Handling Procedure
•	Exit and Offboarding Procedure
•	Business Continuity Procedure
•	Security Incident Procedure
________________________________________
8.3 Contracts and Employment Documents
Examples include:
•	Employment Contract
•	Contract of Employment Template
•	Casual Worker Agreement
•	Zero-Hours Worker Agreement
•	Fixed-Term Contract
•	Apprenticeship Agreement
•	Director Service Agreement
•	Consultancy Agreement
•	Contractor Agreement
•	Volunteer Agreement
•	Offer Letter
•	Conditional Offer Letter
•	Job Description
•	Person Specification
•	Contract Variation Letter
•	Promotion Letter
•	Salary Increase Letter
•	Working Hours Agreement
•	Hybrid Working Agreement
•	Training Agreement
•	Deductions Agreement
•	Confidentiality Agreement
•	Restrictive Covenant Agreement
________________________________________
8.4 Handbooks and Manuals
Examples include:
•	Employee Handbook
•	Manager Handbook
•	Induction Handbook
•	Staff Manual
•	HR Manual
•	Operations Manual
•	Safeguarding Handbook
•	Health and Safety Handbook
•	Compliance Manual
________________________________________
8.5 Standard Letters and Templates
Examples include:
•	Investigation Invitation Letter
•	Disciplinary Invitation Letter
•	Disciplinary Outcome Letter
•	Warning Letter
•	Final Written Warning Letter
•	Dismissal Outcome Letter
•	Grievance Acknowledgement Letter
•	Grievance Meeting Invitation
•	Grievance Outcome Letter
•	Appeal Invitation Letter
•	Appeal Outcome Letter
•	Absence Review Invitation
•	Long-Term Absence Letter
•	Occupational Health Referral Letter
•	Probation Review Invitation
•	Probation Confirmation Letter
•	Probation Extension Letter
•	Probation Termination Letter
•	Performance Improvement Plan Template
•	Flexible Working Acknowledgement
•	Flexible Working Outcome Letter
•	Redundancy Consultation Letter
•	Redundancy Outcome Letter
•	Settlement Agreement Covering Letter
•	Resignation Acknowledgement
•	Termination Confirmation
•	Reference Template
•	New Starter Welcome Letter
•	Leaver Confirmation Letter
•	Meeting Notes Template
•	Investigation Report Template
•	Decision Rationale Template
•	Witness Statement Template
________________________________________
8.6 Forms
Examples include:
•	Holiday Request Form
•	Return-to-Work Form
•	Flexible Working Request Form
•	Grievance Form
•	Appeal Form
•	Investigation Notes Form
•	Witness Statement Form
•	Performance Review Form
•	Probation Review Form
•	Exit Interview Form
•	Medical Questionnaire
•	Occupational Health Consent Form
•	Wellness Action Plan Form
•	Reasonable Adjustments Form
•	New Starter Details Form
•	Name and Address Form
•	Bank Details Form
•	Emergency Contact Form
•	Starter Declaration
•	Right to Work Checklist
•	DBS Declaration
•	Driving Licence Declaration
•	Vehicle Use Declaration
•	Expenses Claim Form
•	Training Request Form
•	Training Evaluation Form
•	Incident Report Form
•	Accident Report Form
•	Basic Workplace Risk Assessment Form
•	Lone Working Risk Assessment
•	Display Screen Equipment Assessment
•	Safeguarding Concern Form
•	Complaints and Feedback Form
•	Data Subject Access Request Form
•	Data Breach Report Form
Sensitive information captured through completed forms must be stored in the appropriate employee or operational record system.
HR Resources should ordinarily store blank forms and organisational templates rather than completed employee records.
________________________________________
8.7 Risk Assessments and Compliance Documents
Examples include:
•	General Workplace Risk Assessment
•	Role-Specific Risk Assessment
•	Lone Working Risk Assessment
•	Driving for Work Risk Assessment
•	Young Worker Risk Assessment
•	New and Expectant Mother Risk Assessment
•	Display Screen Equipment Assessment
•	Stress Risk Assessment
•	Fire Risk Assessment
•	Safeguarding Risk Assessment
•	Equality Impact Assessment
•	Data Protection Impact Assessment
•	Business Continuity Plan
•	Emergency Response Plan
•	Corporate Manslaughter Risk Guidance
•	Compliance Checklist
•	Policy Review Schedule
•	Training Matrix
•	Regulatory Audit Checklist
Driving-related resources should recognise the employer’s responsibilities for employees who drive for work and the potential organisational consequences of inadequate vehicle, licence, insurance, fatigue or safety controls.
Leo should present this proportionately and avoid alarmist language.
________________________________________
8.8 Training and Learning Resources
Examples include:
•	Induction Training
•	Health and Safety Training
•	Safeguarding Training
•	Equality, Diversity and Inclusion Training
•	Anti-Harassment Training
•	Data Protection Training
•	Cybersecurity Training
•	Management Training
•	Disciplinary and Grievance Training
•	Recruitment and Interview Training
•	Safer Recruitment Training
•	Right to Work Training
•	DBS Training
•	Driving for Work Training
•	Wellbeing Training
•	Internal Learning Modules
•	Videos
•	Slide Decks
•	Workbooks
•	Standard Operating Procedures
•	Assessment Materials
•	Training Guides
HR Resources should support the future LEO Learn capability by allowing employers to upload their own internal learning materials.
________________________________________
8.9 Registers and Organisational Records
Examples include:
•	Training Register
•	Policy Register
•	Risk Assessment Register
•	Right to Work Register
•	DBS Register
•	Driving Check Register
•	Professional Registration Register
•	Asset Register
•	Data Processing Register
•	Incident Register
•	Complaints Register
•	Safeguarding Register
•	Business Continuity Review Log
•	Policy Review Log
Registers may require structured data functionality in addition to document storage.
They should not automatically be treated as ordinary policy documents.
________________________________________
8.10 Internal Guidance and Governance Materials
Examples include:
•	Manager Guidance Notes
•	Internal HR Guidance
•	Decision-Making Frameworks
•	Approval Routes
•	Escalation Guidance
•	Regulatory Guidance
•	Internal Compliance Notes
•	HR Operating Procedures
•	Standard Management Scripts
•	Frequently Asked Questions
•	Organisation Charts
•	Delegated Authority Documents
•	Settlement Agreement Guidance
•	Complaints and Feedback Guidance
________________________________________
9. Resource Lifecycle
Every organisational resource should follow a consistent lifecycle.
Created by Leo
or
Uploaded by Employer
        ↓
Stored Securely
        ↓
Identified
        ↓
Categorised
        ↓
Text and Metadata Extracted
        ↓
Indexed
        ↓
Linked to Relevant Knowledge Areas
        ↓
Available to Leo
        ↓
Reviewed or Compared Where Requested
        ↓
Updated or Replaced Where Approved
        ↓
Previous Version Preserved
        ↓
Archived When No Longer Current
Not every resource will pass through every stage immediately.
Version 1 may support only the early lifecycle stages, while preserving the architecture required for later capabilities.
________________________________________
10. Resource Origins
A resource may originate from:
•	employer upload;
•	authorised user upload;
•	Leo-generated draft;
•	approved Leo replacement;
•	system template;
•	migration from another system;
•	future external integration.
The origin must be recorded.
Leo-generated content must not be treated as formally adopted until the employer approves it.
________________________________________
11. Resource Status Language
Leo should use calm, supportive status language.
Recommended statuses include:
In Place
A current organisational resource has been uploaded or formally adopted.
Draft
The resource is being prepared and has not yet been approved.
Draft Available
Leo has prepared a draft for employer review.
Review Available
Leo can review the resource, but no review has yet been completed.
Review Suggested
There is a reasonable basis for suggesting that the resource be reviewed.
Under Review
The employer or Leo is actively reviewing the resource.
Update Available
An updated draft or recommended amendment is available.
Recommended
The resource may be appropriate for the organisation based on its Foundations or activities.
Planned
The employer has chosen to create or review the resource later.
Superseded
A newer version has replaced the resource.
Archived
The resource is retained for historical or audit purposes but is not currently active.
Not Currently Required
The resource has been considered but does not presently appear necessary for the organisation.
The interface should avoid status terms such as:
•	Failed
•	Non-Compliant
•	Critical Failure
•	Missing Mandatory Document
•	Danger
•	High-Risk Deficiency
Where a serious legal concern exists, Leo should still explain it clearly, but without creating unnecessary alarm.
________________________________________
12. Resource Metadata
Each resource should support structured metadata.
Core metadata should include:
•	organisation ID;
•	resource ID;
•	title;
•	resource category;
•	resource type;
•	document status;
•	current version;
•	original filename;
•	file format;
•	upload date;
•	uploaded by;
•	document origin;
•	effective date;
•	review date;
•	expiry date where relevant;
•	description;
•	extracted text availability;
•	indexing status;
•	active or archived state;
•	confidentiality classification;
•	linked Foundation areas;
•	linked reasoning modules;
•	linked Matters;
•	linked employees where appropriate;
•	source authority level;
•	review outcome;
•	replacement resource ID;
•	created timestamp;
•	updated timestamp.
Future metadata may include:
•	detected legislation references;
•	detected policy obligations;
•	confidence of categorisation;
•	review confidence;
•	document summary;
•	identified review areas;
•	approved organisational owner;
•	department applicability;
•	site applicability;
•	employee population applicability.
________________________________________
13. Automatic Categorisation
Leo should eventually identify the likely type of an uploaded resource.
Examples:
“I’ve identified this as your Disciplinary Policy.”
“This appears to be a template employment contract.”
“This looks like a return-to-work form.”
Categorisation must include a confidence measure.
Where confidence is low, Leo should ask the user to confirm the category rather than guessing.
The user must be able to correct the category.
Corrected categorisation should replace the initial classification and support future system improvement.
________________________________________
14. Document Indexing and Retrieval
Uploaded resources must become searchable and retrievable by LEO KNOWLEDGE™.
The retrieval architecture should support:
•	full-document retrieval;
•	section-level retrieval;
•	clause-level retrieval;
•	metadata filtering;
•	category filtering;
•	version filtering;
•	effective-date filtering;
•	organisation filtering;
•	Matter relevance;
•	employee relevance where appropriate;
•	authority ranking.
Future semantic retrieval may use document chunks and embeddings.
The architecture should not require embeddings for the first implementation.
The initial implementation may use:
•	extracted text;
•	structured metadata;
•	keyword search;
•	category search;
•	document type;
•	linked reasoning areas.
Retrieval results should always preserve:
•	resource title;
•	version;
•	source;
•	relevant section;
•	effective status;
•	authority level.
________________________________________
15. Linking HR Resources to Foundations
HR Resources should validate and enrich Foundations.
Example:
Foundation fact:
Probation period: six months
Uploaded contract template:
The probationary period is three months.
Leo should not silently overwrite either source.
Instead, the system should identify a discrepancy and distinguish:
•	what the Welcome Brief recorded;
•	what the document states;
•	which source has greater authority;
•	whether clarification is required.
A suitable response may be:
“Your Welcome Brief records a six-month probation period, while the uploaded contract template states three months. As the contract template is the stronger organisational source for contractual terms, I would normally use three months when advising from this document. It may be worth confirming whether the template reflects your current arrangements.”
Future Foundation updates may be offered, but should not be made without appropriate validation.
________________________________________
16. Resource Review Capability
Leo should eventually be able to review organisational resources against:
•	current legislation;
•	contractual requirements;
•	ACAS Codes and guidance;
•	applicable regulatory expectations;
•	organisational Foundations;
•	related organisational documents;
•	recognised HR practice;
•	LEO Philosophy™;
•	document usability and clarity.
A review should not simply produce a compliance score.
It should provide:
Overall View
A calm summary of whether the resource provides a workable framework.
Areas That Are Working Well
Recognition of useful or well-structured provisions.
Areas Worth Reviewing
Specific issues that may benefit from clarification or updating.
Why It Matters
A practical explanation of the legal, procedural or organisational relevance.
Suggested Action
A proportionate recommendation.
Leo Support
An offer to draft amendments or a revised version.
Example:
“Your Grievance Policy provides a clear formal process and includes an appeal stage. I have identified two areas that may be worth reviewing: the informal resolution section could be clearer, and the stated timescales may be difficult to apply consistently. I can prepare an updated draft while retaining your existing structure and tone.”
________________________________________
17. Discrepancy Detection
Leo should identify discrepancies between:
•	a resource and legislation;
•	a resource and ACAS guidance;
•	a resource and regulatory requirements;
•	two organisational policies;
•	a policy and a contract;
•	a policy and Foundations;
•	a policy and approved organisational practice;
•	an active document and a superseded version;
•	a template and the process described elsewhere.
Discrepancies should be assessed for materiality.
Not every wording difference is a meaningful conflict.
Leo should distinguish between:
•	stylistic differences;
•	optional best-practice improvements;
•	operational ambiguity;
•	internal inconsistency;
•	contractual inconsistency;
•	potential legal conflict;
•	material compliance concern.
Communication should remain calm and precise.
________________________________________
18. Drafting Updated Resources
Where a document may benefit from review, Leo should be able to offer practical support.
Example:
“Would you like me to prepare an updated version for your review?”
LEO DRAFT™ should eventually support:
•	targeted amendments;
•	tracked change summaries;
•	complete replacement drafts;
•	preservation of organisational language;
•	version comparison;
•	explanation of material changes;
•	policy-specific approval workflows.
Leo should avoid replacing the organisation’s voice with generic legal wording where the existing tone can reasonably be retained.
No updated resource becomes active automatically.
The employer must review and approve it.
________________________________________
19. Creating Resources for New and Growing Employers
HR Resources must work for organisations that do not already have an established HR framework.
An empty library should not feel like a failure.
Leo should use Foundations to understand:
•	the organisation’s size;
•	sector;
•	workforce;
•	working arrangements;
•	regulatory environment;
•	operational risks;
•	first employee or early growth stage;
•	current documentation.
Leo may then provide a proportionate starting framework.
Example:
“As you are preparing to employ your first member of staff, I would suggest starting with an employment contract, a basic employee handbook, disciplinary and grievance procedures, holiday and sickness arrangements, and the core health and safety information relevant to your workplace. I can help you create these in a sensible order.”
Leo should not overwhelm a startup with an indiscriminate list of every possible policy.
The goal is to help the employer build an appropriate framework gradually.
________________________________________
20. Organisation-Specific Recommendations
Recommendations should be based on organisational context.
Examples include:
Care, education or children’s services
Leo may recommend:
•	Safeguarding Policy
•	Safer Recruitment Policy
•	DBS Procedure
•	Whistleblowing Policy
•	LADO Guidance
•	Professional Registration Records
Organisations with employees who drive for work
Leo may recommend:
•	Driving on Business Policy
•	Driving Licence Check Procedure
•	Vehicle Declaration
•	Driving for Work Risk Assessment
•	Insurance Verification
•	Fatigue and Journey Planning Guidance
Remote or hybrid organisations
Leo may recommend:
•	Home Working Policy
•	Hybrid Working Policy
•	IT Acceptable Use Policy
•	Data Security Guidance
•	Display Screen Equipment Assessment
•	Lone Working Guidance
Early-stage employers
Leo may recommend:
•	Employment Contract
•	Employee Handbook
•	Disciplinary Procedure
•	Grievance Procedure
•	Holiday Arrangements
•	Sickness Reporting Arrangements
•	Basic Workplace Risk Assessment
•	Privacy Information
Recommendations should be explainable and proportionate.
________________________________________
21. HR Framework View
The user-facing HR Resources area should eventually present the organisation’s framework in calm, supportive language.
It should avoid punitive compliance scoring.
Suggested areas include:
In Place
Resources currently available to Leo.
Being Developed
Drafts or documents under review.
Suggested Next Resources
Resources Leo believes may be useful based on the organisation’s circumstances.
Worth Reviewing
Existing resources that may benefit from clarification or updating.
Recently Updated
Resources that have been reviewed or replaced.
Archived Resources
Historical versions preserved for continuity and audit.
The overall framework may use maturity language such as:
•	Getting Started
•	Building the Foundations
•	Developing Well
•	Well Established
•	Continuously Maintained
Any maturity indicator must be contextual.
It must not imply that every organisation requires every resource.
________________________________________
22. Leo Recommendations
Recommendations should be supportive and actionable.
Examples:
“Your Employee Handbook is in place and available to Leo.”
“Your Flexible Working Policy was last reviewed several years ago. It may still be suitable, but there have been legal developments since then. I can review it when convenient.”
“Based on your use of employees who drive between sites, a Driving on Business Policy may help clarify licence, insurance and vehicle safety responsibilities.”
“You do not currently appear to have a formal Grievance Policy. I can prepare a proportionate version suitable for an organisation of your size.”
Leo should not criticise the employer for incomplete documentation.
The purpose is to build confidence and support improvement.
________________________________________
23. User Interface Principles
The HR Resources page should feel:
•	calm;
•	spacious;
•	professional;
•	clear;
•	supportive;
•	easy to understand;
•	free from unnecessary technical terminology.
The primary action button should be:
Add Resources
The page should not use:
Upload Files
as the principal product language.
“Add Resources” reflects the wider range of organisational knowledge being provided to Leo.
Version 1 page areas may include:
•	page introduction;
•	Add Resources button;
•	resource search;
•	category filters;
•	resource library;
•	recent resources;
•	resource details;
•	calm status labels;
•	future placeholder for Leo Recommendations.
The interface should not expose complex indexing or AI-processing terminology unless needed for troubleshooting.
________________________________________
24. Security and Confidentiality
HR Resources may contain sensitive organisational and employment information.
The architecture must support:
•	organisation-level data isolation;
•	role-based access;
•	secure storage;
•	controlled downloads;
•	document access logs;
•	version history;
•	deletion controls;
•	retention controls;
•	confidentiality classifications;
•	future document-level permissions.
Documents containing employee-specific information must be handled carefully.
Blank forms and templates belong in HR Resources.
Completed forms may belong in:
•	employee records;
•	Matters;
•	medical records;
•	compliance registers;
•	training records;
•	other restricted data areas.
The system must avoid storing duplicate sensitive employee information merely for convenience.
________________________________________
25. Auditability
Every resource should maintain a traceable history.
The platform should eventually record:
•	who uploaded it;
•	when it was uploaded;
•	who changed its category;
•	when it became active;
•	which version was used;
•	what review was completed;
•	what changes Leo proposed;
•	who approved a replacement;
•	when it was superseded;
•	which Matters relied upon it.
Where Leo references a policy in a Matter, the relevant version should be preserved.
A later policy update must not rewrite the historical context of an earlier decision.
________________________________________
26. Relationship to Other LEO Components
LEO CORE™
Determines what organisational knowledge is required and uses retrieved resources within structured reasoning.
LEO KNOWLEDGE™
Stores, categorises, indexes and retrieves HR Resources.
HR Resources is a core layer of LEO KNOWLEDGE™.
LEO DRAFT™
Creates new resources and prepares updated versions where requested.
LEO INSIGHT™
Identifies trends such as:
•	frequently missing resources;
•	recurring policy conflicts;
•	overdue review patterns;
•	inconsistent document use;
•	repeated organisational knowledge gaps.
Matters
Use the relevant current or historically applicable resource version when guiding the employer through a workplace issue.
Foundations
Provide organisational context and receive validated enrichment from authoritative documents.
Organisation Memory
Stores approved contextual working practices that are not formalised in HR Resources.
________________________________________
27. Version 1 Scope
The first implementation should focus on establishing the foundation for future intelligence.
Version 1 should include:
•	HR Resources page;
•	Add Resources action;
•	secure document upload;
•	organisation-linked resource records;
•	core resource categories;
•	manual categorisation;
•	initial automatic categorisation where practical;
•	resource metadata;
•	basic resource statuses;
•	document library display;
•	resource search and filters;
•	active and archived state;
•	secure file retrieval;
•	architecture for future versioning;
•	architecture for future extracted text and indexing.
Version 1 does not need to complete every future intelligence capability.
________________________________________
28. Future Capabilities
Future development may include:
•	text extraction;
•	OCR where required;
•	automatic document categorisation;
•	document summaries;
•	clause extraction;
•	policy obligation extraction;
•	semantic search;
•	document embeddings;
•	resource-to-Foundation linking;
•	discrepancy detection;
•	cross-policy comparison;
•	legal and ACAS comparison;
•	regulator comparison;
•	policy review workflows;
•	draft amendment generation;
•	complete replacement drafting;
•	version comparison;
•	tracked change summaries;
•	policy approval workflows;
•	review reminders;
•	legislative change monitoring;
•	affected-resource identification;
•	organisation-specific resource recommendations;
•	HR framework maturity view;
•	Ask Leo document citations;
•	Matter-specific policy retrieval;
•	document usage audit;
•	training resource integration;
•	resource analytics through LEO INSIGHT™.
These capabilities should extend the approved architecture rather than replace it.
________________________________________
29. Non-Goals
HR Resources is not intended to become:
•	a generic cloud drive;
•	an uncontrolled document dump;
•	a replacement for all employee record systems;
•	an automatic legal certification service;
•	a system that changes employer policies without approval;
•	a compliance scoring tool designed to frighten users;
•	a substitute for appropriate legal review in high-risk or specialist matters.
Leo supports employers in understanding and strengthening their framework.
It does not guarantee that every document is legally perfect in every possible circumstance.
________________________________________
30. Success Standard
LEO HR Resources™ will be successful when an employer feels that Leo:
•	understands what documentation the organisation has;
•	knows which version is current;
•	uses the correct resources when providing guidance;
•	identifies inconsistencies without creating alarm;
•	explains why a resource may benefit from review;
•	offers practical drafting support;
•	helps new employers build their HR framework;
•	preserves organisational history;
•	becomes more useful as the organisation continues to teach it.
The experience should feel like working with an HR Director who understands the organisation’s policies, keeps an eye on what may need attention and is ready to help improve the framework when required.
________________________________________
31. Closing Principle
Leo does not simply hold an organisation’s HR documents. Leo learns from them, applies them, helps maintain them and supports the employer in strengthening its employment framework over time.
LEO HR Resources™ is therefore not merely a document feature.
It is a foundational part of the organisational intelligence, governance and trusted HR Director experience that defines the Leo platform.
