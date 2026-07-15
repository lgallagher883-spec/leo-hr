export type EmployeeSummary = {
  id: number;
  name: string;
  start_date: string | null;
};

export type ProbationRecord = {
  id: number;
  employee_id: number;
  status: string;
  probation_start_date: string;
  standard_end_date: string;
  current_end_date: string;
  final_decision_deadline: string;
  extension_reason: string | null;
  extension_start_date: string | null;
  extension_end_date: string | null;
  final_outcome: string | null;
  final_outcome_date: string | null;
};

export type ProbationReview = {
  id: number;
  probation_id: number;
  employee_id: number;
  review_type: string;
  review_week: number | null;
  scheduled_date: string;
  completed_date: string | null;
  status: string;
  manager_name: string | null;
  attendees: string | null;
  employee_comments: string | null;
  manager_comments: string | null;
  progress_summary: string | null;
  support_required: string | null;
  agreed_actions: string | null;
};

export type FinalOutcome =
  | ""
  | "Permanent Employment"
  | "Extend Probation"
  | "Terminate Contract";