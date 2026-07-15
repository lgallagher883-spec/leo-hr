"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  learningModuleId: number;
  assessmentRequired: boolean;
};

type AssessmentSettings = {
  id: number;
  learning_module_id: number;
  pass_mark: number;
  max_attempts: number;
  randomise_questions: boolean;
  show_correct_answers: boolean;
};

type AssessmentQuestion = {
  id: number;
  learning_module_id: number;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string | null;
  explanation: string | null;
  sequence_number: number;
  points: number;
  created_at: string;
  updated_at: string;
};

type FormMode = "create" | "edit";

const questionTypes = [
  "Multiple Choice",
  "True / False",
  "Short Answer",
];

export default function LearningAssessment({
  learningModuleId,
  assessmentRequired,
}: Props) {
  const [settingsId, setSettingsId] =
    useState<number | null>(null);

  const [passMark, setPassMark] =
    useState("80");

  const [maxAttempts, setMaxAttempts] =
    useState("3");

  const [
    randomiseQuestions,
    setRandomiseQuestions,
  ] = useState(false);

  const [
    showCorrectAnswers,
    setShowCorrectAnswers,
  ] = useState(true);

  const [questions, setQuestions] = useState<
    AssessmentQuestion[]
  >([]);

  const [
    selectedQuestionId,
    setSelectedQuestionId,
  ] = useState<number | null>(null);

  const [formMode, setFormMode] =
    useState<FormMode>("create");

  const [showQuestionForm, setShowQuestionForm] =
    useState(false);

  const [questionText, setQuestionText] =
    useState("");

  const [questionType, setQuestionType] =
    useState("Multiple Choice");

  const [optionsText, setOptionsText] =
    useState("");

  const [correctAnswer, setCorrectAnswer] =
    useState("");

  const [explanation, setExplanation] =
    useState("");

  const [points, setPoints] =
    useState("1");

  const [loading, setLoading] =
    useState(true);

  const [savingSettings, setSavingSettings] =
    useState(false);

  const [savingQuestion, setSavingQuestion] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    void loadAssessment();
  }, [learningModuleId]);

  async function loadAssessment() {
    setLoading(true);
    setErrorMessage("");

    const [
      settingsResult,
      questionsResult,
    ] = await Promise.all([
      supabase
        .from("learning_assessments")
        .select(
          `
          id,
          learning_module_id,
          pass_mark,
          max_attempts,
          randomise_questions,
          show_correct_answers
          `
        )
        .eq(
          "learning_module_id",
          learningModuleId
        )
        .maybeSingle(),

      supabase
        .from(
          "learning_assessment_questions"
        )
        .select(
          `
          id,
          learning_module_id,
          question_text,
          question_type,
          options,
          correct_answer,
          explanation,
          sequence_number,
          points,
          created_at,
          updated_at
          `
        )
        .eq(
          "learning_module_id",
          learningModuleId
        )
        .eq("is_archived", false)
        .order("sequence_number", {
          ascending: true,
        }),
    ]);

    if (settingsResult.error) {
      console.error(
        "Error loading assessment settings:",
        settingsResult.error
      );

      setErrorMessage(
        "The assessment settings could not be loaded."
      );

      setLoading(false);
      return;
    }

    if (questionsResult.error) {
      console.error(
        "Error loading assessment questions:",
        questionsResult.error
      );

      setErrorMessage(
        "The assessment questions could not be loaded."
      );

      setLoading(false);
      return;
    }

    if (settingsResult.data) {
      const settings =
        settingsResult.data as AssessmentSettings;

      setSettingsId(settings.id);

      setPassMark(
        String(settings.pass_mark)
      );

      setMaxAttempts(
        String(settings.max_attempts)
      );

      setRandomiseQuestions(
        settings.randomise_questions
      );

      setShowCorrectAnswers(
        settings.show_correct_answers
      );
    }

    setQuestions(
      (questionsResult.data ||
        []) as AssessmentQuestion[]
    );

    setLoading(false);
  }

  function resetQuestionForm() {
    setSelectedQuestionId(null);
    setFormMode("create");
    setQuestionText("");
    setQuestionType("Multiple Choice");
    setOptionsText("");
    setCorrectAnswer("");
    setExplanation("");
    setPoints("1");
    setErrorMessage("");
  }

  function openCreateQuestion() {
    resetQuestionForm();
    setMessage("");
    setShowQuestionForm(true);
  }

  function openEditQuestion(
    question: AssessmentQuestion
  ) {
    setSelectedQuestionId(question.id);
    setFormMode("edit");
    setQuestionText(
      question.question_text
    );
    setQuestionType(
      question.question_type
    );
    setOptionsText(
      question.options
        ? question.options.join("\n")
        : ""
    );
    setCorrectAnswer(
      question.correct_answer || ""
    );
    setExplanation(
      question.explanation || ""
    );
    setPoints(String(question.points));
    setMessage("");
    setErrorMessage("");
    setShowQuestionForm(true);
  }

  async function saveAssessmentSettings() {
    const numericPassMark =
      Number(passMark);

    const numericMaxAttempts =
      Number(maxAttempts);

    if (
      Number.isNaN(numericPassMark) ||
      numericPassMark < 0 ||
      numericPassMark > 100
    ) {
      setErrorMessage(
        "The pass mark must be between 0 and 100."
      );
      return;
    }

    if (
      Number.isNaN(numericMaxAttempts) ||
      numericMaxAttempts < 1
    ) {
      setErrorMessage(
        "Maximum attempts must be at least one."
      );
      return;
    }

    setSavingSettings(true);
    setMessage("");
    setErrorMessage("");

    const settingsData = {
      learning_module_id:
        learningModuleId,
      pass_mark: numericPassMark,
      max_attempts:
        numericMaxAttempts,
      randomise_questions:
        randomiseQuestions,
      show_correct_answers:
        showCorrectAnswers,
    };

    const { data, error } = settingsId
      ? await supabase
          .from("learning_assessments")
          .update(settingsData)
          .eq("id", settingsId)
          .select("id")
          .single()
      : await supabase
          .from("learning_assessments")
          .insert(settingsData)
          .select("id")
          .single();

    if (error || !data) {
      console.error(
        "Error saving assessment settings:",
        error
      );

      setErrorMessage(
        "The assessment settings could not be saved."
      );

      setSavingSettings(false);
      return;
    }

    setSettingsId(data.id);
    setMessage(
      "Assessment settings saved."
    );
    setSavingSettings(false);
  }

  async function saveQuestion() {
    if (!questionText.trim()) {
      setErrorMessage(
        "Enter the assessment question."
      );
      return;
    }

    const numericPoints =
      Number(points);

    if (
      Number.isNaN(numericPoints) ||
      numericPoints < 1
    ) {
      setErrorMessage(
        "Question points must be at least one."
      );
      return;
    }

    let options: string[] | null = null;

    if (
      questionType ===
      "Multiple Choice"
    ) {
      options = optionsText
        .split("\n")
        .map((option) =>
          option.trim()
        )
        .filter(Boolean);

      if (options.length < 2) {
        setErrorMessage(
          "Enter at least two answer options."
        );
        return;
      }

      if (!correctAnswer.trim()) {
        setErrorMessage(
          "Enter the correct answer."
        );
        return;
      }

      if (
        !options.some(
          (option) =>
            option.toLowerCase() ===
            correctAnswer
              .trim()
              .toLowerCase()
        )
      ) {
        setErrorMessage(
          "The correct answer must match one of the answer options."
        );
        return;
      }
    }

    if (
      questionType ===
        "True / False" &&
      !["true", "false"].includes(
        correctAnswer
          .trim()
          .toLowerCase()
      )
    ) {
      setErrorMessage(
        "The correct answer must be True or False."
      );
      return;
    }

    setSavingQuestion(true);
    setMessage("");
    setErrorMessage("");

    const questionData = {
      learning_module_id:
        learningModuleId,
      question_text:
        questionText.trim(),
      question_type:
        questionType,
      options,
      correct_answer:
        correctAnswer.trim() || null,
      explanation:
        explanation.trim() || null,
      points: numericPoints,
    };

    if (
      formMode === "edit" &&
      selectedQuestionId !== null
    ) {
      const { error } = await supabase
        .from(
          "learning_assessment_questions"
        )
        .update(questionData)
        .eq("id", selectedQuestionId);

      if (error) {
        console.error(
          "Error updating assessment question:",
          error
        );

        setErrorMessage(
          "The assessment question could not be updated."
        );

        setSavingQuestion(false);
        return;
      }

      setMessage(
        "Assessment question updated."
      );
    } else {
      const nextSequenceNumber =
        questions.length === 0
          ? 1
          : Math.max(
              ...questions.map(
                (question) =>
                  question.sequence_number
              )
            ) + 1;

      const { error } = await supabase
        .from(
          "learning_assessment_questions"
        )
        .insert({
          ...questionData,
          sequence_number:
            nextSequenceNumber,
        });

      if (error) {
        console.error(
          "Error creating assessment question:",
          error
        );

        setErrorMessage(
          "The assessment question could not be created."
        );

        setSavingQuestion(false);
        return;
      }

      setMessage(
        "Assessment question created."
      );
    }

    setSavingQuestion(false);
    setShowQuestionForm(false);
    resetQuestionForm();

    await loadAssessment();
  }

  async function moveQuestion(
    question: AssessmentQuestion,
    direction: -1 | 1
  ) {
    const currentIndex =
      questions.findIndex(
        (item) =>
          item.id === question.id
      );

    const targetIndex =
      currentIndex + direction;

    if (
      targetIndex < 0 ||
      targetIndex >= questions.length
    ) {
      return;
    }

    const targetQuestion =
      questions[targetIndex];

    const temporarySequence =
      Math.max(
        ...questions.map(
          (item) =>
            item.sequence_number
        )
      ) + 1000;

    const { error: temporaryError } =
      await supabase
        .from(
          "learning_assessment_questions"
        )
        .update({
          sequence_number:
            temporarySequence,
        })
        .eq("id", question.id);

    if (temporaryError) {
      setErrorMessage(
        "The question order could not be changed."
      );
      return;
    }

    const { error: targetError } =
      await supabase
        .from(
          "learning_assessment_questions"
        )
        .update({
          sequence_number:
            question.sequence_number,
        })
        .eq("id", targetQuestion.id);

    if (targetError) {
      await supabase
        .from(
          "learning_assessment_questions"
        )
        .update({
          sequence_number:
            question.sequence_number,
        })
        .eq("id", question.id);

      setErrorMessage(
        "The question order could not be changed."
      );
      return;
    }

    const { error: finalError } =
      await supabase
        .from(
          "learning_assessment_questions"
        )
        .update({
          sequence_number:
            targetQuestion.sequence_number,
        })
        .eq("id", question.id);

    if (finalError) {
      setErrorMessage(
        "The question order could not be changed."
      );
      return;
    }

    await loadAssessment();
  }

  async function archiveQuestion(
    question: AssessmentQuestion
  ) {
    const confirmed = window.confirm(
      `Archive this question?\n\n${question.question_text}`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from(
        "learning_assessment_questions"
      )
      .update({
        is_archived: true,
        archived_at:
          new Date().toISOString(),
      })
      .eq("id", question.id);

    if (error) {
      console.error(
        "Error archiving assessment question:",
        error
      );

      setErrorMessage(
        "The assessment question could not be archived."
      );

      return;
    }

    setMessage(
      "Assessment question archived."
    );

    await loadAssessment();
  }

  const totalPoints = questions.reduce(
    (total, question) =>
      total + question.points,
    0
  );

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>
            Assessment
          </h3>

          <p style={descriptionStyle}>
            Configure the completion assessment
            and build the questions employees must
            answer.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateQuestion}
          style={primaryButtonStyle}
        >
          Add Question
        </button>
      </div>

      {!assessmentRequired && (
        <div style={noticeStyle}>
          Assessment is not currently required
          for this learning resource. It can be
          enabled from the Overview workspace.
        </div>
      )}

      {errorMessage && (
        <div style={errorStyle}>
          {errorMessage}
        </div>
      )}

      {message && (
        <div style={messageStyle}>
          {message}
        </div>
      )}

      <div style={settingsPanelStyle}>
        <div style={settingsHeaderStyle}>
          <div>
            <h4 style={panelTitleStyle}>
              Assessment Settings
            </h4>

            <p
              style={
                panelDescriptionStyle
              }
            >
              Set the expected pass mark and
              how the assessment behaves.
            </p>
          </div>

          <div style={pointsSummaryStyle}>
            {questions.length} questions ·{" "}
            {totalPoints} points
          </div>
        </div>

        <div style={formGridStyle}>
          <FormField label="Pass mark">
            <div style={inputSuffixWrapperStyle}>
              <input
                type="number"
                min="0"
                max="100"
                value={passMark}
                onChange={(event) =>
                  setPassMark(
                    event.target.value
                  )
                }
                style={
                  suffixInputStyle
                }
              />

              <span style={inputSuffixStyle}>
                %
              </span>
            </div>
          </FormField>

          <FormField label="Maximum attempts">
            <input
              type="number"
              min="1"
              value={maxAttempts}
              onChange={(event) =>
                setMaxAttempts(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </FormField>
        </div>

        <div style={optionGridStyle}>
          <CheckboxField
            label="Randomise questions"
            description="Present the questions in a different order for each attempt."
            checked={randomiseQuestions}
            onChange={
              setRandomiseQuestions
            }
          />

          <CheckboxField
            label="Show correct answers"
            description="Show the correct answer after the employee completes the assessment."
            checked={showCorrectAnswers}
            onChange={
              setShowCorrectAnswers
            }
          />
        </div>

        <div style={settingsActionsStyle}>
          <button
            type="button"
            onClick={() =>
              void saveAssessmentSettings()
            }
            disabled={savingSettings}
            style={primaryButtonStyle}
          >
            {savingSettings
              ? "Saving..."
              : "Save Assessment Settings"}
          </button>
        </div>
      </div>

      {showQuestionForm && (
        <div style={questionFormStyle}>
          <div style={formHeaderStyle}>
            <div>
              <h4 style={panelTitleStyle}>
                {formMode === "edit"
                  ? "Edit Question"
                  : "Add Question"}
              </h4>

              <p
                style={
                  panelDescriptionStyle
                }
              >
                Record the question, answer
                options and any supporting
                explanation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowQuestionForm(false);
                resetQuestionForm();
              }}
              style={closeButtonStyle}
            >
              Close
            </button>
          </div>

          <FormField label="Question">
            <textarea
              value={questionText}
              onChange={(event) =>
                setQuestionText(
                  event.target.value
                )
              }
              placeholder="Enter the question employees must answer."
              style={textareaStyle}
            />
          </FormField>

          <div style={formGridStyle}>
            <FormField label="Question type">
              <select
                value={questionType}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setQuestionType(value);

                  if (
                    value ===
                    "True / False"
                  ) {
                    setOptionsText("");
                  }
                }}
                style={inputStyle}
              >
                {questionTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Points">
              <input
                type="number"
                min="1"
                value={points}
                onChange={(event) =>
                  setPoints(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>
          </div>

          {questionType ===
            "Multiple Choice" && (
            <FormField label="Answer options">
              <textarea
                value={optionsText}
                onChange={(event) =>
                  setOptionsText(
                    event.target.value
                  )
                }
                placeholder={
                  "Enter one option per line.\nFor example:\nRaise the alarm\nIgnore the alarm\nFinish the current task"
                }
                style={textareaStyle}
              />
            </FormField>
          )}

          <FormField label="Correct answer">
            {questionType ===
            "True / False" ? (
              <select
                value={correctAnswer}
                onChange={(event) =>
                  setCorrectAnswer(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  Select the correct answer
                </option>

                <option value="True">
                  True
                </option>

                <option value="False">
                  False
                </option>
              </select>
            ) : (
              <input
                type="text"
                value={correctAnswer}
                onChange={(event) =>
                  setCorrectAnswer(
                    event.target.value
                  )
                }
                placeholder={
                  questionType ===
                  "Multiple Choice"
                    ? "Enter the option exactly as written above"
                    : "Enter the expected answer"
                }
                style={inputStyle}
              />
            )}
          </FormField>

          <FormField label="Answer explanation">
            <textarea
              value={explanation}
              onChange={(event) =>
                setExplanation(
                  event.target.value
                )
              }
              placeholder="Optional explanation to help the employee understand the correct answer."
              style={textareaStyle}
            />
          </FormField>

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={() => {
                setShowQuestionForm(false);
                resetQuestionForm();
              }}
              disabled={savingQuestion}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                void saveQuestion()
              }
              disabled={savingQuestion}
              style={primaryButtonStyle}
            >
              {savingQuestion
                ? "Saving..."
                : formMode === "edit"
                  ? "Update Question"
                  : "Add Question"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={emptyStateStyle}>
          Loading assessment questions...
        </div>
      ) : questions.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>✦</div>

          <h4 style={emptyTitleStyle}>
            No assessment questions yet
          </h4>

          <p style={emptyDescriptionStyle}>
            Add the first question when this
            learning resource requires a knowledge
            check.
          </p>
        </div>
      ) : (
        <div style={questionListStyle}>
          {questions.map(
            (question, index) => (
              <div
                key={question.id}
                style={questionCardStyle}
              >
                <div style={questionNumberStyle}>
                  {index + 1}
                </div>

                <div style={questionContentStyle}>
                  <div style={questionHeaderStyle}>
                    <div>
                      <div style={questionTypeStyle}>
                        {question.question_type}
                      </div>

                      <h4 style={questionTitleStyle}>
                        {question.question_text}
                      </h4>
                    </div>

                    <div style={pointsStyle}>
                      {question.points}{" "}
                      {question.points === 1
                        ? "point"
                        : "points"}
                    </div>
                  </div>

                  {question.options &&
                    question.options.length >
                      0 && (
                      <div style={optionsListStyle}>
                        {question.options.map(
                          (
                            option,
                            optionIndex
                          ) => (
                            <div
                              key={`${question.id}-${optionIndex}`}
                              style={
                                optionStyle
                              }
                            >
                              {option}
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {question.correct_answer && (
                    <div style={answerStyle}>
                      <strong>
                        Correct answer:
                      </strong>{" "}
                      {
                        question.correct_answer
                      }
                    </div>
                  )}

                  {question.explanation && (
                    <div
                      style={
                        explanationStyle
                      }
                    >
                      {
                        question.explanation
                      }
                    </div>
                  )}

                  <div style={questionActionsStyle}>
                    <button
                      type="button"
                      onClick={() =>
                        void moveQuestion(
                          question,
                          -1
                        )
                      }
                      disabled={index === 0}
                      style={smallButtonStyle}
                    >
                      Move up
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void moveQuestion(
                          question,
                          1
                        )
                      }
                      disabled={
                        index ===
                        questions.length - 1
                      }
                      style={smallButtonStyle}
                    >
                      Move down
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openEditQuestion(
                          question
                        )
                      }
                      style={editButtonStyle}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void archiveQuestion(
                          question
                        )
                      }
                      style={smallButtonStyle}
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
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
      <label style={labelStyle}>
        {label}
      </label>

      {children}
    </div>
  );
}

function CheckboxField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={checkboxCardStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
      />

      <span>
        <span style={checkboxTitleStyle}>
          {label}
        </span>

        <span style={checkboxDescriptionStyle}>
          {description}
        </span>
      </span>
    </label>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "18px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const descriptionStyle: React.CSSProperties = {
  maxWidth: "740px",
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.5,
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

const noticeStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "15px",
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #E8DDF0",
  borderRadius: "10px",
  fontSize: "14px",
  lineHeight: 1.5,
};

const settingsPanelStyle: React.CSSProperties = {
  padding: "17px",
  marginBottom: "18px",
  border: "1px solid #E5E7EB",
  borderRadius: "13px",
  background: "#FFFFFF",
};

const settingsHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const panelDescriptionStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.45,
};

const pointsSummaryStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const formFieldStyle: React.CSSProperties = {
  marginTop: "15px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  boxSizing: "border-box",
  background: "#FFFFFF",
  fontSize: "14px",
};

const inputSuffixWrapperStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "stretch",
};

const suffixInputStyle: React.CSSProperties = {
  ...inputStyle,
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
};

const inputSuffixStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "0 12px",
  background: "#F9FAFB",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderLeft: "none",
  borderTopRightRadius: "10px",
  borderBottomRightRadius: "10px",
  fontWeight: 700,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "100px",
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.5,
};

const optionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "10px",
  marginTop: "15px",
};

const checkboxCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "12px",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  background: "#F9FAFB",
  cursor: "pointer",
};

const checkboxTitleStyle: React.CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
};

const checkboxDescriptionStyle: React.CSSProperties = {
  display: "block",
  marginTop: "3px",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.4,
};

const settingsActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "16px",
};

const questionFormStyle: React.CSSProperties = {
  padding: "17px",
  marginBottom: "18px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "13px",
};

const formHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
};

const closeButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: "#6B7280",
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
};

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "17px",
};

const emptyStateStyle: React.CSSProperties = {
  padding: "30px 20px",
  border: "1px dashed #D1D5DB",
  borderRadius: "13px",
  background: "#F9FAFB",
  color: "#6B7280",
  textAlign: "center",
};

const emptyIconStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "22px",
  marginBottom: "8px",
};

const emptyTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const emptyDescriptionStyle: React.CSSProperties = {
  margin: "7px 0 0",
  fontSize: "14px",
};

const questionListStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
};

const questionCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "14px",
  padding: "16px",
  border: "1px solid #E5E7EB",
  borderRadius: "13px",
  background: "#FFFFFF",
};

const questionNumberStyle: React.CSSProperties = {
  flexShrink: 0,
  width: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 800,
};

const questionContentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const questionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const questionTypeStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "11px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const questionTitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#111827",
  fontSize: "15px",
  lineHeight: 1.45,
};

const pointsStyle: React.CSSProperties = {
  padding: "5px 8px",
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const optionsListStyle: React.CSSProperties = {
  display: "grid",
  gap: "6px",
  marginTop: "11px",
};

const optionStyle: React.CSSProperties = {
  padding: "8px 10px",
  background: "#F9FAFB",
  borderRadius: "8px",
  color: "#4B5563",
  fontSize: "13px",
};

const answerStyle: React.CSSProperties = {
  marginTop: "10px",
  color: "#365C48",
  fontSize: "13px",
};

const explanationStyle: React.CSSProperties = {
  marginTop: "8px",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.5,
};

const questionActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap",
  marginTop: "12px",
};

const smallButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  padding: "7px 10px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

const editButtonStyle: React.CSSProperties = {
  ...smallButtonStyle,
  color: "#6E5084",
  border: "1px solid #CDB2E2",
};

const errorStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
  borderRadius: "10px",
};

const messageStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#F5FFF9",
  color: "#365C48",
  border: "1px solid #CFE8DA",
  borderRadius: "10px",
};