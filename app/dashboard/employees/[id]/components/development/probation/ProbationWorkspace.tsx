"use client";

import { useEffect, useState } from "react";
import {
  FinalOutcome,
  EmployeeSummary,
  ProbationRecord,
  ProbationReview,
} from "./types";
import {
  addDays,
  addMonths,
  formatDate,
  getTodayDate,
} from "./probationHelpers";
import ProbationDocuments from "./ProbationDocuments";
import EmployeeLifecycleIntelligence from "../../EmployeeLifecycleIntelligence";

type Props = {
  employeeId: number;
};

type ProbationApiResponse = {
  success?: boolean;
  employee?: EmployeeSummary;
  probation?: ProbationRecord | null;
  reviews?: ProbationReview[];
  review?: ProbationReview;
  error?: string;
};

export default function ProbationWorkspace({
  employeeId,
}: Props) {
  const [employee, setEmployee] =
    useState<EmployeeSummary | null>(null);

  const [probation, setProbation] =
    useState<ProbationRecord | null>(null);

  const [reviews, setReviews] =
    useState<ProbationReview[]>([]);

  const [selectedReview, setSelectedReview] =
    useState<ProbationReview | null>(null);

  const [loading, setLoading] = useState(true);
  const [showStartForm, setShowStartForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [starting, setStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadProbationWorkspace();
  }, [employeeId]);

  async function loadProbationWorkspace() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/employees/${employeeId}/probation`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = (await response.json().catch(() => null)) as
        | ProbationApiResponse
        | null;

      if (!response.ok || !result?.success || !result.employee) {
        throw new Error(
          result?.error ||
            "The probation workspace could not be loaded."
        );
      }

      setEmployee(result.employee);
      setProbation(result.probation || null);
      setReviews(
        Array.isArray(result.reviews)
          ? result.reviews
          : []
      );

      if (result.employee.start_date) {
        setStartDate(result.employee.start_date);
      }
    } catch (error) {
      console.error("Error loading probation workspace:", error);
      setEmployee(null);
      setProbation(null);
      setReviews([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The probation workspace could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  async function startProbation() {
    if (!startDate) {
      setErrorMessage("Enter the probation start date.");
      return;
    }

    setStarting(true);
    setErrorMessage("");

    const standardEndDate = addMonths(startDate, 3);
    const finalDecisionDeadline = addMonths(startDate, 5);

    try {
      const response = await fetch(
        `/api/employees/${employeeId}/probation`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            action: "start",
            startDate,
            standardEndDate,
            finalDecisionDeadline,
          }),
        }
      );

      const result = (await response.json().catch(() => null)) as
        | ProbationApiResponse
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error ||
            "The probation record could not be created."
        );
      }

      setShowStartForm(false);
      await loadProbationWorkspace();
    } catch (error) {
      console.error("Error creating probation:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The probation record could not be created."
      );
    } finally {
      setStarting(false);
    }
  }


  if (loading) {
    return (
      <div style={loadingStyle}>
        Loading probation...
      </div>
    );
  }

  return (
    <div>
      <div style={workspaceHeaderStyle}>
        <div>
          <h3 style={workspaceTitleStyle}>Probation</h3>

          <p style={workspaceDescriptionStyle}>
            Manage the employee’s structured probation period,
            reviews, documents and final outcome.
          </p>
        </div>

        {!probation && !showStartForm && (
          <button
            type="button"
            onClick={() => setShowStartForm(true)}
            style={primaryButtonStyle}
          >
            Start Probation
          </button>
        )}
      </div>

      {errorMessage && (
        <div style={errorStyle}>{errorMessage}</div>
      )}

      <EmployeeLifecycleIntelligence
        employeeId={employeeId}
        lifecycleContext="probation"
        defaultPrompt="Draft a probation checkpoint communication with current progress, support measures and the next formal decision point."
      />

      {!probation && showStartForm && (
        <div style={formPanelStyle}>
          <h4 style={formTitleStyle}>
            Start Probation
          </h4>

          <p style={formDescriptionStyle}>
            Leo will create the standard three-month
            probation period and schedule reviews at weeks
            2, 4, 8 and 12.
          </p>

          <label style={labelStyle}>
            Probation start date
          </label>

          <input
            type="date"
            value={startDate}
            onChange={(event) =>
              setStartDate(event.target.value)
            }
            style={inputStyle}
          />

          <div style={datePreviewStyle}>
            <DatePreview
              label="Initial Check-in"
              value={
                startDate
                  ? formatDate(addDays(startDate, 14))
                  : "Not set"
              }
            />

            <DatePreview
              label="First Review"
              value={
                startDate
                  ? formatDate(addDays(startDate, 28))
                  : "Not set"
              }
            />

            <DatePreview
              label="Progress Review"
              value={
                startDate
                  ? formatDate(addDays(startDate, 56))
                  : "Not set"
              }
            />

            <DatePreview
              label="Final Review"
              value={
                startDate
                  ? formatDate(addDays(startDate, 84))
                  : "Not set"
              }
            />
          </div>

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={() => setShowStartForm(false)}
              disabled={starting}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => void startProbation()}
              disabled={starting}
              style={primaryButtonStyle}
            >
              {starting
                ? "Creating Probation..."
                : "Create Probation"}
            </button>
          </div>
        </div>
      )}

      {!probation && !showStartForm && (
        <div style={emptyStateStyle}>
          <div style={emptyStateIconStyle}>✦</div>

          <h4 style={emptyStateTitleStyle}>
            No probation record has been created
          </h4>

          <p style={emptyStateDescriptionStyle}>
            Leo’s standard probation period is three months,
            supported by reviews at weeks 2, 4, 8 and 12.
          </p>
        </div>
      )}

      {probation && (
        <>
          <div style={probationSummaryGridStyle}>
            <SummaryCard
              label="Status"
              value={probation.status}
            />

            <SummaryCard
              label="Start Date"
              value={formatDate(
                probation.probation_start_date
              )}
            />

            <SummaryCard
              label="Standard End Date"
              value={formatDate(
                probation.standard_end_date
              )}
            />

            <SummaryCard
              label="Final Decision Deadline"
              value={formatDate(
                probation.final_decision_deadline
              )}
            />
          </div>

          <div style={reviewListStyle}>
            {reviews.map((review) => {
              const isFinalReview =
                review.review_type === "Final Review";

              return (
                <button
                  key={review.id}
                  type="button"
                  onClick={() =>
                    setSelectedReview(review)
                  }
                  style={
                    isFinalReview
                      ? finalReviewButtonStyle
                      : reviewButtonStyle
                  }
                >
                  <div>
                    {isFinalReview && (
                      <div
                        style={decisionReviewLabelStyle}
                      >
                        Decision Review
                      </div>
                    )}

                    <div style={reviewTypeStyle}>
                      {review.review_type}
                    </div>

                    {isFinalReview && (
                      <div
                        style={
                          finalReviewDescriptionStyle
                        }
                      >
                        Confirm permanent employment,
                        extend probation or terminate the
                        contract.
                      </div>
                    )}

                    <div style={reviewDateStyle}>
                      Scheduled:{" "}
                      {formatDate(
                        review.scheduled_date
                      )}
                    </div>

                    {review.completed_date && (
                      <div
                        style={actualReviewDateStyle}
                      >
                        Review held:{" "}
                        {formatDate(
                          review.completed_date
                        )}
                      </div>
                    )}
                  </div>

                  <div style={reviewStatusStyle}>
                    {review.status}
                  </div>
                </button>
              );
            })}
          </div>

        {selectedReview &&
  selectedReview.review_type !== "Final Review" && (
    <StandardProbationReviewForm
      employeeId={employeeId}
      review={selectedReview}
      onClose={() => setSelectedReview(null)}
      onSaved={async () => {
        setSelectedReview(null);
        await loadProbationWorkspace();
      }}
    />
  )}

{selectedReview &&
  selectedReview.review_type === "Final Review" && (
    <FinalProbationReviewForm
      employeeId={employeeId}
      review={selectedReview}
      probation={probation}
      employeeName={employee?.name || "Employee"}
      onClose={() => setSelectedReview(null)}
      onSaved={async () => {
        setSelectedReview(null);
        await loadProbationWorkspace();
      }}
    />
  )}

<ProbationDocuments
  employeeId={employeeId}
  probation={probation}
  reviews={reviews}
/>
        </>
      )}
    </div>
  );
}

function StandardProbationReviewForm({
  employeeId,
  review,
  onClose,
  onSaved,
}: {
  employeeId: number;
  review: ProbationReview;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [actualReviewDate, setActualReviewDate] =
    useState(
      review.completed_date || getTodayDate()
    );

  const [managerName, setManagerName] = useState(
    review.manager_name || ""
  );

  const [attendees, setAttendees] = useState(
    review.attendees || ""
  );

  const [progressSummary, setProgressSummary] =
    useState(review.progress_summary || "");

  const [employeeComments, setEmployeeComments] =
    useState(review.employee_comments || "");

  const [managerComments, setManagerComments] =
    useState(review.manager_comments || "");

  const [supportRequired, setSupportRequired] =
    useState(review.support_required || "");

  const [agreedActions, setAgreedActions] =
    useState(review.agreed_actions || "");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  async function saveReview() {
    if (!actualReviewDate) {
      setErrorMessage(
        "Enter the actual date the review took place."
      );
      return;
    }

    if (!managerName.trim()) {
      setErrorMessage("Enter the manager’s name.");
      return;
    }

    if (!progressSummary.trim()) {
      setErrorMessage("Provide a review summary.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/employees/${employeeId}/probation`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            action: "save_review",
            reviewId: review.id,
            completedDate: actualReviewDate,
            managerName: managerName.trim(),
            attendees,
            progressSummary: progressSummary.trim(),
            employeeComments,
            managerComments,
            supportRequired,
            agreedActions,
          }),
        }
      );

      const result = (await response.json().catch(() => null)) as
        | ProbationApiResponse
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error ||
            "The probation review could not be saved."
        );
      }

      await onSaved();
    } catch (error) {
      console.error("Error saving probation review:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The probation review could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <div style={reviewFormPanelStyle}>
      <ReviewFormHeader
        title={review.review_type}
        scheduledDate={review.scheduled_date}
        onClose={onClose}
      />

      {errorMessage && (
        <div style={errorStyle}>{errorMessage}</div>
      )}

      <div style={formGridStyle}>
        <FormField label="Actual review date">
          <input
            type="date"
            value={actualReviewDate}
            onChange={(event) =>
              setActualReviewDate(
                event.target.value
              )
            }
            style={inputStyle}
          />
        </FormField>

        <FormField label="Manager">
          <input
            type="text"
            value={managerName}
            onChange={(event) =>
              setManagerName(event.target.value)
            }
            style={inputStyle}
          />
        </FormField>
      </div>

      <FormField label="Attendees">
        <input
          type="text"
          value={attendees}
          onChange={(event) =>
            setAttendees(event.target.value)
          }
          style={fullWidthInputStyle}
        />
      </FormField>

      <FormField label="Review summary">
        <textarea
          value={progressSummary}
          onChange={(event) =>
            setProgressSummary(event.target.value)
          }
          style={textareaStyle}
        />
      </FormField>

      <FormField label="Employee comments">
        <textarea
          value={employeeComments}
          onChange={(event) =>
            setEmployeeComments(
              event.target.value
            )
          }
          style={textareaStyle}
        />
      </FormField>

      <FormField label="Manager comments">
        <textarea
          value={managerComments}
          onChange={(event) =>
            setManagerComments(
              event.target.value
            )
          }
          style={textareaStyle}
        />
      </FormField>

      <FormField label="Support required">
        <textarea
          value={supportRequired}
          onChange={(event) =>
            setSupportRequired(
              event.target.value
            )
          }
          style={textareaStyle}
        />
      </FormField>

      <FormField label="Agreed actions">
        <textarea
          value={agreedActions}
          onChange={(event) =>
            setAgreedActions(event.target.value)
          }
          style={textareaStyle}
        />
      </FormField>

      <FormActions
        saving={saving}
        onCancel={onClose}
        onSave={() => void saveReview()}
        saveLabel={
          review.status === "Completed"
            ? "Update Review"
            : "Complete Review"
        }
      />
    </div>
  );
}

function FinalProbationReviewForm({
  employeeId,
  review,
  probation,
  employeeName,
  onClose,
  onSaved,
}: {
  employeeId: number;
  review: ProbationReview;
  probation: ProbationRecord;
  employeeName: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [actualReviewDate, setActualReviewDate] =
    useState(
      review.completed_date || getTodayDate()
    );

  const [managerName, setManagerName] = useState(
    review.manager_name || ""
  );

  const [attendees, setAttendees] = useState(
    review.attendees || ""
  );

  const [progressSummary, setProgressSummary] =
    useState(review.progress_summary || "");

  const [employeeComments, setEmployeeComments] =
    useState(review.employee_comments || "");

  const [managerComments, setManagerComments] =
    useState(review.manager_comments || "");

  const [finalOutcome, setFinalOutcome] =
    useState<FinalOutcome>("");

  const [extensionReason, setExtensionReason] =
    useState("");

  const [extensionSupport, setExtensionSupport] =
    useState("");

  const [terminationReason, setTerminationReason] =
    useState("");

  const [supportSummary, setSupportSummary] =
    useState("");

  const [evidenceSummary, setEvidenceSummary] =
    useState("");

  const [employeeResponse, setEmployeeResponse] =
    useState("");

  const [noticeArrangements, setNoticeArrangements] =
    useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  async function saveFinalReview() {
    if (!actualReviewDate) {
      setErrorMessage(
        "Enter the actual date the Final Review took place."
      );
      return;
    }

    if (!managerName.trim()) {
      setErrorMessage("Enter the manager’s name.");
      return;
    }

    if (!progressSummary.trim()) {
      setErrorMessage(
        "Provide a brief Final Review summary."
      );
      return;
    }

    if (!finalOutcome) {
      setErrorMessage(
        "Select the final employment outcome."
      );
      return;
    }

    if (
      finalOutcome === "Extend Probation" &&
      (!extensionReason.trim() ||
        !extensionSupport.trim())
    ) {
      setErrorMessage(
        "Record why probation is being extended and the support that will be provided."
      );
      return;
    }

    if (
      finalOutcome === "Terminate Contract" &&
      (!terminationReason.trim() ||
        !supportSummary.trim() ||
        !evidenceSummary.trim() ||
        !employeeResponse.trim() ||
        !noticeArrangements.trim())
    ) {
      setErrorMessage(
        "Complete each brief termination summary before recording the decision."
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const extensionEndDate = addMonths(
      probation.standard_end_date,
      1
    );

    try {
      const response = await fetch(
        `/api/employees/${employeeId}/probation`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            action: "final_outcome",
            probationId: probation.id,
            reviewId: review.id,
            completedDate: actualReviewDate,
            managerName: managerName.trim(),
            attendees,
            progressSummary: progressSummary.trim(),
            employeeComments,
            managerComments,
            finalOutcome,
            extensionReason,
            extensionSupport,
            extensionEndDate,
            terminationReason,
            supportSummary,
            evidenceSummary,
            employeeResponse,
            noticeArrangements,
            employeeName,
          }),
        }
      );

      const result = (await response.json().catch(() => null)) as
        | ProbationApiResponse
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error ||
            "The Final Review could not be saved."
        );
      }

      await onSaved();
    } catch (error) {
      console.error("Error saving Final Review:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The Final Review could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }


  const extensionEndDate = addMonths(
    probation.standard_end_date,
    1
  );

  return (
    <div style={finalReviewPanelStyle}>
      <div style={decisionReviewLabelStyle}>
        Decision Review
      </div>

      <ReviewFormHeader
        title="Final Review"
        scheduledDate={review.scheduled_date}
        onClose={onClose}
      />

      <p style={finalReviewIntroStyle}>
        Record the final review conversation and
        confirm the employee’s employment outcome.
      </p>

      {errorMessage && (
        <div style={errorStyle}>{errorMessage}</div>
      )}

      <div style={formGridStyle}>
        <FormField label="Actual review date">
          <input
            type="date"
            value={actualReviewDate}
            onChange={(event) =>
              setActualReviewDate(
                event.target.value
              )
            }
            style={inputStyle}
          />
        </FormField>

        <FormField label="Manager">
          <input
            type="text"
            value={managerName}
            onChange={(event) =>
              setManagerName(event.target.value)
            }
            style={inputStyle}
          />
        </FormField>
      </div>

      <FormField label="Attendees">
        <input
          type="text"
          value={attendees}
          onChange={(event) =>
            setAttendees(event.target.value)
          }
          style={fullWidthInputStyle}
        />
      </FormField>

      <FormField label="Final Review summary">
        <textarea
          value={progressSummary}
          onChange={(event) =>
            setProgressSummary(event.target.value)
          }
          style={textareaStyle}
        />
      </FormField>

      <FormField label="Employee comments">
        <textarea
          value={employeeComments}
          onChange={(event) =>
            setEmployeeComments(
              event.target.value
            )
          }
          style={textareaStyle}
        />
      </FormField>

      <FormField label="Manager comments">
        <textarea
          value={managerComments}
          onChange={(event) =>
            setManagerComments(
              event.target.value
            )
          }
          style={textareaStyle}
        />
      </FormField>

      <div style={decisionPanelStyle}>
        <h4 style={decisionTitleStyle}>
          Employment Decision
        </h4>

        <FormField label="Outcome">
          <select
            value={finalOutcome}
            onChange={(event) =>
              setFinalOutcome(
                event.target
                  .value as FinalOutcome
              )
            }
            style={selectStyle}
          >
            <option value="">
              Select an outcome
            </option>
            <option value="Permanent Employment">
              Permanent Employment
            </option>
            <option value="Extend Probation">
              Extend Probation
            </option>
            <option value="Terminate Contract">
              Terminate Contract
            </option>
          </select>
        </FormField>

        {finalOutcome ===
          "Permanent Employment" && (
          <div style={outcomeInformationStyle}>
            Permanent employment will be confirmed
            from{" "}
            <strong>
              {formatDate(actualReviewDate)}
            </strong>
            .
          </div>
        )}

        {finalOutcome ===
          "Extend Probation" && (
          <>
            <div
              style={outcomeInformationStyle}
            >
              Probation will be extended for four
              weeks until{" "}
              <strong>
                {formatDate(extensionEndDate)}
              </strong>
              .
            </div>

            <FormField label="Reason for extension">
              <textarea
                value={extensionReason}
                onChange={(event) =>
                  setExtensionReason(
                    event.target.value
                  )
                }
                style={textareaStyle}
              />
            </FormField>

            <FormField label="Support during the extension">
              <textarea
                value={extensionSupport}
                onChange={(event) =>
                  setExtensionSupport(
                    event.target.value
                  )
                }
                style={textareaStyle}
              />
            </FormField>
          </>
        )}

        {finalOutcome ===
          "Terminate Contract" && (
          <>
            <div style={terminationNoticeStyle}>
              The detailed probation history remains
              within the earlier reviews. Record a
              brief decision summary below.
              Probation documents must already have
              been uploaded.
            </div>

            <FormField label="Reason for terminating the contract">
              <textarea
                value={terminationReason}
                onChange={(event) =>
                  setTerminationReason(
                    event.target.value
                  )
                }
                style={textareaStyle}
              />
            </FormField>

            <FormField label="Support provided">
              <textarea
                value={supportSummary}
                onChange={(event) =>
                  setSupportSummary(
                    event.target.value
                  )
                }
                style={textareaStyle}
              />
            </FormField>

            <FormField label="Evidence considered">
              <textarea
                value={evidenceSummary}
                onChange={(event) =>
                  setEvidenceSummary(
                    event.target.value
                  )
                }
                style={textareaStyle}
              />
            </FormField>

            <FormField label="Employee response">
              <textarea
                value={employeeResponse}
                onChange={(event) =>
                  setEmployeeResponse(
                    event.target.value
                  )
                }
                style={textareaStyle}
              />
            </FormField>

            <FormField label="Notice arrangements">
              <textarea
                value={noticeArrangements}
                onChange={(event) =>
                  setNoticeArrangements(
                    event.target.value
                  )
                }
                style={textareaStyle}
              />
            </FormField>
          </>
        )}
      </div>

      <FormActions
        saving={saving}
        onCancel={onClose}
        onSave={() =>
          void saveFinalReview()
        }
        saveLabel="Record Final Outcome"
      />
    </div>
  );
}

function ReviewFormHeader({
  title,
  scheduledDate,
  onClose,
}: {
  title: string;
  scheduledDate: string;
  onClose: () => void;
}) {
  return (
    <div style={reviewFormHeaderStyle}>
      <div>
        <h4 style={formTitleStyle}>{title}</h4>

        <p style={formDescriptionStyle}>
          Scheduled for{" "}
          {formatDate(scheduledDate)}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        style={closeButtonStyle}
      >
        Close
      </button>
    </div>
  );
}

function FormActions({
  saving,
  onCancel,
  onSave,
  saveLabel,
}: {
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div style={formActionsStyle}>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        style={secondaryButtonStyle}
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        style={{
          ...primaryButtonStyle,
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? "Saving..." : saveLabel}
      </button>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={formFieldStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={summaryCardStyle}>
      <div style={summaryLabelStyle}>
        {label}
      </div>
      <div style={summaryValueStyle}>
        {value}
      </div>
    </div>
  );
}

function DatePreview({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={datePreviewItemStyle}>
      <div style={datePreviewLabelStyle}>
        {label}
      </div>
      <div style={datePreviewValueStyle}>
        {value}
      </div>
    </div>
  );
}

const workspaceHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "20px",
};

const workspaceTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const workspaceDescriptionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const loadingStyle: React.CSSProperties = {
  padding: "28px",
  color: "#6B7280",
  textAlign: "center",
};

const errorStyle: React.CSSProperties = {
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "18px",
};

const formPanelStyle: React.CSSProperties = {
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
  padding: "20px",
};

const formTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const formDescriptionStyle: React.CSSProperties = {
  margin: "8px 0 18px",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "320px",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  background: "#FFFFFF",
  fontSize: "14px",
  boxSizing: "border-box",
};

const fullWidthInputStyle: React.CSSProperties = {
  ...inputStyle,
  maxWidth: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  maxWidth: "420px",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "100px",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  background: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "14px",
  lineHeight: 1.5,
  resize: "vertical",
  boxSizing: "border-box",
};

const datePreviewStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "10px",
  marginTop: "18px",
};

const datePreviewItemStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  padding: "12px",
};

const datePreviewLabelStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
  marginBottom: "5px",
};

const datePreviewValueStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: 700,
};

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "20px",
};

const emptyStateStyle: React.CSSProperties = {
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
  padding: "32px 20px",
  textAlign: "center",
};

const emptyStateIconStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "24px",
  marginBottom: "10px",
};

const emptyStateTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const emptyStateDescriptionStyle: React.CSSProperties = {
  maxWidth: "560px",
  margin: "10px auto 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const probationSummaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "12px",
  marginBottom: "18px",
};

const summaryCardStyle: React.CSSProperties = {
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "12px",
  padding: "14px",
};

const summaryLabelStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
  marginBottom: "6px",
};

const summaryValueStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "15px",
  fontWeight: 700,
};

const reviewListStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const reviewButtonStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  padding: "14px",
  textAlign: "left",
  cursor: "pointer",
};

const finalReviewButtonStyle: React.CSSProperties = {
  ...reviewButtonStyle,
  background: "#FBF8FD",
  border: "2px solid #CDB2E2",
  padding: "16px",
};

const decisionReviewLabelStyle: React.CSSProperties = {
  display: "inline-block",
  color: "#6E5084",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: "6px",
};

const reviewTypeStyle: React.CSSProperties = {
  color: "#111827",
  fontWeight: 700,
};

const finalReviewDescriptionStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "13px",
  marginTop: "5px",
};

const reviewDateStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "13px",
  marginTop: "5px",
};

const actualReviewDateStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "13px",
  fontWeight: 600,
  marginTop: "4px",
};

const reviewStatusStyle: React.CSSProperties = {
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const reviewFormPanelStyle: React.CSSProperties = {
  marginTop: "18px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
  padding: "20px",
};

const finalReviewPanelStyle: React.CSSProperties = {
  marginTop: "18px",
  background: "#FBF8FD",
  border: "2px solid #CDB2E2",
  borderRadius: "14px",
  padding: "20px",
};

const reviewFormHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
};

const closeButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: "#6B7280",
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const formFieldStyle: React.CSSProperties = {
  marginTop: "16px",
};

const finalReviewIntroStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.6,
  margin: "0 0 18px",
};

const decisionPanelStyle: React.CSSProperties = {
  marginTop: "22px",
  background: "#FFFFFF",
  border: "1px solid #CDB2E2",
  borderRadius: "14px",
  padding: "18px",
};

const decisionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#6E5084",
};

const outcomeInformationStyle: React.CSSProperties = {
  marginTop: "16px",
  padding: "13px",
  background: "#F7F1FC",
  borderRadius: "10px",
  color: "#4B5563",
  fontSize: "14px",
  lineHeight: 1.6,
};

const terminationNoticeStyle: React.CSSProperties = {
  marginTop: "16px",
  padding: "13px",
  background: "#FFF7ED",
  border: "1px solid #FED7AA",
  borderRadius: "10px",
  color: "#9A3412",
  fontSize: "14px",
  lineHeight: 1.6,
};