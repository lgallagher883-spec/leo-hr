# Leo HR — Core Role & Permission Matrix

**Source of truth reviewed:** deployed Supabase role_permissions  
**Last reviewed:** 11 September 2026

This document records the intended high-level permission boundaries for the four standard Leo roles.

Legend: ✓ = granted by default, — = not granted by default.

| Capability | Owner | Senior | Manager | Employee |
|---|:---:|:---:|:---:|:---:|
| Dashboard access | ✓ | ✓ | ✓ | ✓ |
| View all employees in permitted scope | ✓ | ✓ | ✓ | — |
| Manage employees in permitted scope | ✓ | ✓ | ✓ | — |
| Create employees | ✓ | ✓ | — | — |
| Export employees | ✓ | ✓ | — | — |
| View own employee record | ✓ | ✓ | ✓ | ✓ |
| Update own permitted employee details | ✓ | ✓ | ✓ | ✓ |
| View documents | ✓ | ✓ | ✓ | ✓ |
| Upload/manage documents | ✓ | ✓ | ✓ | — |
| Delete documents | ✓ | — | — | — |
| View Matters | ✓ | ✓ | ✓ | — |
| Create/manage ordinary Matters | ✓ | ✓ | ✓ | — |
| Export Matters | ✓ | ✓ | — | — |
| View/manage restricted Matters | ✓ | ✓ | — | — |
| View compliance workspace | ✓ | ✓ | ✓ | — |
| Manage compliance | ✓ | ✓ | ✓ | — |
| Approve/export compliance | ✓ | ✓ | — | — |
| View/complete own compliance | ✓ | ✓ | ✓ | ✓ |
| View HR Resources | ✓ | ✓ | ✓ | ✓ |
| Manage HR Resources / Leo Knowledge | ✓ | ✓ | — | — |
| View Leo Learn | ✓ | ✓ | ✓ | ✓ |
| Manage Leo Learn | ✓ | ✓ | — | — |
| Use own learning | ✓ | ✓ | ✓ | ✓ |
| View Talent | ✓ | ✓ | ✓ | — |
| Manage Talent | ✓ | ✓ | ✓ | — |
| Talent settings/export | ✓ | ✓ | — | — |
| View Connections | ✓ | ✓ | ✓ | — |
| Configure Connections | ✓ | ✓ | — | — |
| Fully manage/disconnect Connections | ✓ | — | — | — |
| View billing | ✓ | ✓ | — | — |
| Manage billing/subscription | ✓ | — | — | — |
| View SAR workspace | ✓ | ✓ | — | — |
| Manage/approve/export SARs | ✓ | ✓ | — | — |
| View audit logs | ✓ | ✓ | ✓ | — |
| View sensitive/export audit logs | ✓ | ✓ | — | — |
| View notifications | ✓ | ✓ | ✓ | ✓ |
| Send notifications | ✓ | ✓ | ✓ | — |
| Manage notification settings | ✓ | ✓ | — | — |
| Use Ask Leo | ✓ | ✓ | ✓ | ✓ |
| Administer Ask Leo | ✓ | — | — | — |
| View organisation information | ✓ | ✓ | ✓ | ✓ |
| Manage organisation | ✓ | — | — | — |

## Scope rule

A permission grant does not override organisation, employee, matter or other record-level scope. Leo must still resolve and enforce the correct organisation and record context server-side.

## Restricted data rule

Restricted/sensitive Matters, sensitive audit data, billing administration, organisation administration, connection administration and destructive document actions must remain more tightly controlled than ordinary view/manage permissions.

## Employee role principle

The Employee role is primarily self-service. Employee-level grants should not be interpreted as access to all workforce records.

## Review rule

Any new workspace or significant action should be added to this matrix before release and receive automated regression coverage for its intended role boundary.
