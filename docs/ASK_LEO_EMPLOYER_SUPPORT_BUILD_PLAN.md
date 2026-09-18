# Ask Leo Employer Support Build Plan

## Product Journey

Sign Up Or Sign In → Tell Leo Briefly What Is Happening → Pre-Purchase Assessment → Employer Chooses To Proceed → One-Off Payment → Payment Confirmed → Matter Created → Ask Leo Leads The Matter → Completion → Matter Bundle → Retention → Purge.

A Matter must never be created before payment is confirmed. The pre-purchase description may be stored against a pending purchase so the employer does not need to repeat it, but it is not a Matter and must not receive paid-Matter functionality.

## Pre-Purchase Assessment Standard

The assessment must feel friendly, helpful, professional and expert. It should leave a suitable employer understanding why having Ask Leo alongside them would be valuable without using pressure, fear or exaggerated claims.

Leo should:
* understand the broad employee-relations issue from the employer's own words;
* explain how Employer Support can guide the issue from beginning to documented completion;
* identify the kinds of legal, procedural and employee-relations risks Leo will help the employer consider;
* explain that Leo can prepare meetings, conversations, letters and documents and organise the Matter record;
* explain that the employer remains responsible for employee conversations and final decisions;
* explain that Leo helps the employer handle the Matter properly and with minimal risk, in line with the ACAS Code of Practice where applicable and current UK employment legislation;
* never guarantee compliance or a legal outcome;
* avoid giving away the complete substantive process before purchase;
* decline to sell Employer Support where the issue is outside scope.

## Non-Negotiable Architecture

One persistent Employer Support account may purchase multiple independent Matters. Every Matter has its own purchase, context, documents, messages, lifecycle and retention date. Context must not leak between Matters.

Employer Support reuses Leo authentication, organisation infrastructure and the professional Ask Leo engine, but has its own product entitlement and portal boundary. Employer Support-only users must not inherit full Leo functionality merely through organisation membership.

Stripe payment confirmation is the authority to provision exactly one Matter. Webhook processing must be idempotent.

The Matter Bundle excludes the Ask Leo working transcript. Matter deletion must purge linked messages, documents, storage and other Matter data without deleting the persistent employer account or unrelated Matters.

## Launch Pricing

Ask Leo Employer Support launches at **£99 per Matter** as a one-off payment with no subscription required. This is a launch price intended to reduce the barrier to trying a new service and build trust through the quality of the completed Matter experience.

Do not present a crossed-out higher price or make an unsupported saving claim. Existing purchased Matters retain the price paid. Review pricing for future new Matters using real conversion, Matter duration, AI cost, interaction/document volume, completion and full-Leo conversion data. The launch price remains £99 for new Matters unless Lindsay explicitly authorises a price change. Do not introduce an alternative price, crossed-out price, automatic price increase or configuration that can silently change the £99 launch amount. Price changes must never alter an already purchased Matter.
