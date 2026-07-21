"use client";

import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

type WorkspaceTab =
  | "overview"
  | "identity"
  | "right_to_work"
  | "references"
  | "dbs"
  | "overseas"
  | "review";

type ProfileStatus =
  | "not_started"
  | "in_progress"
  | "awaiting_information"
  | "complete"
  | "failed"
  | "not_required";

type RiskLevel =
  | "not_assessed"
  | "low"
  | "medium"
  | "high"
  | "critical";

type ApplicationRecord = {
  id: string;
  application_reference: string;
  vacancy_id: string;
  candidate_id: string;
  current_stage_key: string;
  status: string;
};

type CandidateRecord = {
  id: string;
  candidate_reference: string;
  first_name: string;
  middle_names: string | null;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
};

type VacancyRecord = {
  id: string;
  vacancy_reference: string;
  title: string;
  department: string | null;
  location_name: string | null;
  regulated_role: boolean;
  safer_recruitment_required: boolean;
  requires_dbs: boolean;
  dbs_level: string | null;
  requires_driving: boolean;
  requires_qualification_checks: boolean;
  required_reference_count: number;
  overseas_check_required_if_applicable: boolean;
};

type SaferRecruitmentProfile = {
  id: string;
  organisation_id: string | null;
  application_id: string;
  vacancy_id: string;
  candidate_id: string;
  status: ProfileStatus;
  overall_risk_level: RiskLevel;
  overall_notes: string | null;
  review_required: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type IdentityCheck = {
  id: string;
  safer_recruitment_profile_id: string;
  document_type: string;
  document_number_masked: string | null;
  issuing_country: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
  verification_method: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  document_id: string | null;
};

type RightToWorkCheck = {
  id: string;
  safer_recruitment_profile_id: string;
  check_type: string;
  nationality: string | null;
  right_to_work_status: string;
  share_code_masked: string | null;
  check_date: string | null;
  expiry_date: string | null;
  follow_up_date: string | null;
  restriction_details: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
};

type ReferenceRecord = {
  id: string;
  safer_recruitment_profile_id: string;
  reference_number: number;
  referee_name: string;
  referee_job_title: string | null;
  organisation_name: string | null;
  email: string | null;
  phone: string | null;
  relationship_to_candidate: string | null;
  employment_start_date: string | null;
  employment_end_date: string | null;
  request_status: string;
  requested_at: string | null;
  received_at: string | null;
  concerns_declared: boolean;
  concerns_details: string | null;
  phone_verification_required: boolean;
  phone_verification_status: string;
  phone_verified_by: string | null;
  phone_verified_at: string | null;
  phone_verification_notes: string | null;
  outcome: string;
};

type DbsCheck = {
  id: string;
  safer_recruitment_profile_id: string;
  dbs_level: string;
  workforce_type: string | null;
  application_reference_masked: string | null;
  certificate_number_masked: string | null;
  application_date: string | null;
  certificate_issue_date: string | null;
  status: string;
  update_service_member: boolean;
  update_service_check_date: string | null;
  update_service_result: string | null;
  barred_list_checked: boolean;
  barred_list_result: string | null;
  certificate_seen_by: string | null;
  certificate_seen_at: string | null;
  disclosures_present: boolean;
  disclosures_summary: string | null;
  risk_assessment_required: boolean;
  risk_assessment_outcome: string | null;
  notes: string | null;
};

type OverseasCheck = {
  id: string;
  safer_recruitment_profile_id: string;
  country: string;
  reason_required: string | null;
  document_type: string | null;
  status: string;
  requested_at: string | null;
  received_at: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  verified_by: string | null;
  verified_at: string | null;
  concerns_details: string | null;
  alternative_evidence: string | null;
  notes: string | null;
};

type WorkspaceRecord = {
  profile: SaferRecruitmentProfile;
  application: ApplicationRecord | null;
  candidate: CandidateRecord | null;
  vacancy: VacancyRecord | null;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

type EditableInputProps = {
  label: string;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  type?: "text" | "date" | "email" | "tel" | "number";
  placeholder?: string;
  disabled?: boolean;
};

type EditableSelectProps = {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
};

const EMPTY_PROFILE_COUNTS = {
  identity: 0,
  rightToWork: 0,
  references: 0,
  dbs: 0,
  overseas: 0,
};

const tabLabels: Array<{ key: WorkspaceTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "identity", label: "Identity" },
  { key: "right_to_work", label: "Right to Work" },
  { key: "references", label: "References" },
  { key: "dbs", label: "DBS" },
  { key: "overseas", label: "Overseas Checks" },
  { key: "review", label: "Review & Decision" },
];

const profileStatusOptions = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "awaiting_information", label: "Awaiting information" },
  { value: "complete", label: "Complete" },
  { value: "failed", label: "Unable to complete" },
  { value: "not_required", label: "Not required" },
];

const riskOptions = [
  { value: "not_assessed", label: "Not assessed" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

function normaliseLabel(value: string | null | undefined) {
  if (!value) return "Not recorded";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not recorded";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function fullCandidateName(candidate: CandidateRecord | null) {
  if (!candidate) return "Candidate";

  return [
    candidate.first_name,
    candidate.middle_names,
    candidate.last_name,
  ]
    .filter(Boolean)
    .join(" ");
}

function getInitials(candidate: CandidateRecord | null) {
  if (!candidate) return "SR";

  return `${candidate.first_name?.[0] ?? ""}${
    candidate.last_name?.[0] ?? ""
  }`.toUpperCase();
}

function statusTone(status: string) {
  const normalised = status.toLowerCase();

  if (
    normalised.includes("complete") ||
    normalised.includes("verified") ||
    normalised.includes("satisfactory") ||
    normalised.includes("unrestricted")
  ) {
    return {
      background: "#F1F8F4",
      border: "#C7E3D1",
      colour: "#35634A",
    };
  }

  if (
    normalised.includes("concern") ||
    normalised.includes("failed") ||
    normalised.includes("rejected") ||
    normalised.includes("not_permitted") ||
    normalised.includes("unsatisfactory")
  ) {
    return {
      background: "#FCF2F4",
      border: "#E9C8D0",
      colour: "#8A4252",
    };
  }

  if (
    normalised.includes("awaiting") ||
    normalised.includes("pending") ||
    normalised.includes("review") ||
    normalised.includes("in_progress") ||
    normalised.includes("submitted")
  ) {
    return {
      background: "#FBF7EE",
      border: "#E8D9B6",
      colour: "#78613A",
    };
  }

  return {
    background: "#F7F1FC",
    border: "#DDCDEB",
    colour: "#6E5084",
  };
}

function percentageComplete(values: boolean[]) {
  if (values.length === 0) return 0;

  const completed = values.filter(Boolean).length;
  return Math.round((completed / values.length) * 100);
}

export default function DueDiligenceWorkspace() {
  const [records, setRecords] = useState<WorkspaceRecord[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");

  const [identityChecks, setIdentityChecks] = useState<IdentityCheck[]>([]);
  const [rightToWorkChecks, setRightToWorkChecks] = useState<
    RightToWorkCheck[]
  >([]);
  const [references, setReferences] = useState<ReferenceRecord[]>([]);
  const [dbsChecks, setDbsChecks] = useState<DbsCheck[]>([]);
  const [overseasChecks, setOverseasChecks] = useState<OverseasCheck[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const selectedRecord = useMemo(
    () =>
      records.find(
        (record) => record.profile.id === selectedProfileId
      ) ?? null,
    [records, selectedProfileId]
  );

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return records.filter((record) => {
      const candidateName = fullCandidateName(record.candidate).toLowerCase();
      const vacancyTitle = record.vacancy?.title?.toLowerCase() ?? "";
      const candidateReference =
        record.candidate?.candidate_reference?.toLowerCase() ?? "";
      const applicationReference =
        record.application?.application_reference?.toLowerCase() ?? "";

      const matchesSearch =
        !query ||
        candidateName.includes(query) ||
        vacancyTitle.includes(query) ||
        candidateReference.includes(query) ||
        applicationReference.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        record.profile.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: records.length,
      inProgress: records.filter(
        (record) => record.profile.status === "in_progress"
      ).length,
      awaiting: records.filter(
        (record) =>
          record.profile.status === "awaiting_information" ||
          record.profile.review_required
      ).length,
      complete: records.filter(
        (record) => record.profile.status === "complete"
      ).length,
      higherRisk: records.filter((record) =>
        ["high", "critical"].includes(record.profile.overall_risk_level)
      ).length,
    };
  }, [records]);

  const detailCounts = useMemo(() => {
    if (!selectedRecord) return EMPTY_PROFILE_COUNTS;

    return {
      identity: identityChecks.length,
      rightToWork: rightToWorkChecks.length,
      references: references.length,
      dbs: dbsChecks.length,
      overseas: overseasChecks.length,
    };
  }, [
    selectedRecord,
    identityChecks.length,
    rightToWorkChecks.length,
    references.length,
    dbsChecks.length,
    overseasChecks.length,
  ]);

  const completion = useMemo(() => {
    if (!selectedRecord) return 0;

    const vacancy = selectedRecord.vacancy;
    const requiredReferences = vacancy?.required_reference_count ?? 1;

    const identityComplete = identityChecks.some((check) =>
      ["verified", "not_applicable"].includes(check.status)
    );

    const rightToWorkComplete = rightToWorkChecks.some((check) =>
      [
        "unrestricted",
        "time_limited",
        "not_applicable",
      ].includes(check.right_to_work_status)
    );

    const referencesComplete =
      references.filter((reference) =>
        ["satisfactory", "not_applicable"].includes(reference.outcome)
      ).length >= requiredReferences;

    const dbsComplete =
      !vacancy?.requires_dbs ||
      dbsChecks.some((check) =>
        ["satisfactory", "not_required"].includes(check.status)
      );

    const overseasComplete =
      !vacancy?.overseas_check_required_if_applicable ||
      overseasChecks.length === 0 ||
      overseasChecks.every((check) =>
        ["verified", "not_required"].includes(check.status)
      );

    return percentageComplete([
      identityComplete,
      rightToWorkComplete,
      referencesComplete,
      dbsComplete,
      overseasComplete,
    ]);
  }, [
    selectedRecord,
    identityChecks,
    rightToWorkChecks,
    references,
    dbsChecks,
    overseasChecks,
  ]);

  const setSuccess = useCallback((message: string) => {
    setNotice({ type: "success", message });
  }, []);

  const setError = useCallback((message: string) => {
    setNotice({ type: "error", message });
  }, []);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    try {
      const { data: profiles, error: profileError } = await supabase
        .from("leo_talent_safer_recruitment_profiles")
        .select("*")
        .order("updated_at", { ascending: false });

      if (profileError) {
        throw profileError;
      }

      const profileRows = (profiles ?? []) as SaferRecruitmentProfile[];

      if (profileRows.length === 0) {
        setRecords([]);
        setSelectedProfileId(null);
        return;
      }

      const candidateIds = [
        ...new Set(profileRows.map((profile) => profile.candidate_id)),
      ];
      const vacancyIds = [
        ...new Set(profileRows.map((profile) => profile.vacancy_id)),
      ];
      const applicationIds = [
        ...new Set(profileRows.map((profile) => profile.application_id)),
      ];

      const [candidateResult, vacancyResult, applicationResult] =
        await Promise.all([
          supabase
            .from("leo_talent_candidates")
            .select(
              "id,candidate_reference,first_name,middle_names,last_name,preferred_name,email,phone,country"
            )
            .in("id", candidateIds),
          supabase
            .from("leo_talent_vacancies")
            .select(
              "id,vacancy_reference,title,department,location_name,regulated_role,safer_recruitment_required,requires_dbs,dbs_level,requires_driving,requires_qualification_checks,required_reference_count,overseas_check_required_if_applicable"
            )
            .in("id", vacancyIds),
          supabase
            .from("leo_talent_applications")
            .select(
              "id,application_reference,vacancy_id,candidate_id,current_stage_key,status"
            )
            .in("id", applicationIds),
        ]);

      if (candidateResult.error) throw candidateResult.error;
      if (vacancyResult.error) throw vacancyResult.error;
      if (applicationResult.error) throw applicationResult.error;

      const candidates = (candidateResult.data ?? []) as CandidateRecord[];
      const vacancies = (vacancyResult.data ?? []) as VacancyRecord[];
      const applications = (applicationResult.data ??
        []) as ApplicationRecord[];

      const candidateMap = new Map(
        candidates.map((candidate) => [candidate.id, candidate])
      );
      const vacancyMap = new Map(
        vacancies.map((vacancy) => [vacancy.id, vacancy])
      );
      const applicationMap = new Map(
        applications.map((application) => [application.id, application])
      );

      const assembled: WorkspaceRecord[] = profileRows.map((profile) => ({
        profile,
        candidate: candidateMap.get(profile.candidate_id) ?? null,
        vacancy: vacancyMap.get(profile.vacancy_id) ?? null,
        application: applicationMap.get(profile.application_id) ?? null,
      }));

      setRecords(assembled);

      setSelectedProfileId((current) => {
        const currentStillExists = assembled.some(
          (record) => record.profile.id === current
        );

        return currentStillExists ? current : assembled[0]?.profile.id ?? null;
      });
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The due diligence register could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [setError]);

  const loadSelectedProfileDetails = useCallback(
    async (profileId: string) => {
      setDetailLoading(true);
      setNotice(null);

      try {
        const [
          identityResult,
          rightToWorkResult,
          referencesResult,
          dbsResult,
          overseasResult,
        ] = await Promise.all([
          supabase
            .from("leo_talent_identity_checks")
            .select("*")
            .eq("safer_recruitment_profile_id", profileId)
            .order("created_at", { ascending: true }),
          supabase
            .from("leo_talent_right_to_work_checks")
            .select("*")
            .eq("safer_recruitment_profile_id", profileId)
            .order("created_at", { ascending: true }),
          supabase
            .from("leo_talent_references")
            .select("*")
            .eq("safer_recruitment_profile_id", profileId)
            .order("reference_number", { ascending: true }),
          supabase
            .from("leo_talent_dbs_checks")
            .select("*")
            .eq("safer_recruitment_profile_id", profileId)
            .order("created_at", { ascending: true }),
          supabase
            .from("leo_talent_overseas_checks")
            .select("*")
            .eq("safer_recruitment_profile_id", profileId)
            .order("created_at", { ascending: true }),
        ]);

        if (identityResult.error) throw identityResult.error;
        if (rightToWorkResult.error) throw rightToWorkResult.error;
        if (referencesResult.error) throw referencesResult.error;
        if (dbsResult.error) throw dbsResult.error;
        if (overseasResult.error) throw overseasResult.error;

        setIdentityChecks(
          (identityResult.data ?? []) as IdentityCheck[]
        );
        setRightToWorkChecks(
          (rightToWorkResult.data ?? []) as RightToWorkCheck[]
        );
        setReferences(
          (referencesResult.data ?? []) as ReferenceRecord[]
        );
        setDbsChecks((dbsResult.data ?? []) as DbsCheck[]);
        setOverseasChecks(
          (overseasResult.data ?? []) as OverseasCheck[]
        );
      } catch (error) {
        console.error(error);
        setError(
          error instanceof Error
            ? error.message
            : "The candidate checks could not be loaded."
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [setError]
  );

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!selectedProfileId) {
      setIdentityChecks([]);
      setRightToWorkChecks([]);
      setReferences([]);
      setDbsChecks([]);
      setOverseasChecks([]);
      return;
    }

    void loadSelectedProfileDetails(selectedProfileId);
  }, [selectedProfileId, loadSelectedProfileDetails]);

  async function updateProfile(
    changes: Partial<SaferRecruitmentProfile>,
    successMessage: string
  ) {
    if (!selectedRecord) return;

    setSaving(true);
    setNotice(null);

    try {
      const payload = {
        ...changes,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("leo_talent_safer_recruitment_profiles")
        .update(payload)
        .eq("id", selectedRecord.profile.id)
        .select("*")
        .single();

      if (error) throw error;

      setRecords((current) =>
        current.map((record) =>
          record.profile.id === selectedRecord.profile.id
            ? {
                ...record,
                profile: data as SaferRecruitmentProfile,
              }
            : record
        )
      );

      setSuccess(successMessage);
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The due diligence profile could not be updated."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createIdentityCheck() {
    if (!selectedRecord) return;

    setSaving(true);
    setNotice(null);

    try {
      const { data, error } = await supabase
        .from("leo_talent_identity_checks")
        .insert({
          organisation_id: selectedRecord.profile.organisation_id,
          safer_recruitment_profile_id: selectedRecord.profile.id,
          document_type: "Passport",
          status: "pending",
        })
        .select("*")
        .single();

      if (error) throw error;

      setIdentityChecks((current) => [
        ...current,
        data as IdentityCheck,
      ]);

      await updateProfile(
        { status: "in_progress" },
        "Identity check added."
      );
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The identity check could not be added."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveIdentityCheck(check: IdentityCheck) {
    setSaving(true);
    setNotice(null);

    try {
      const { data, error } = await supabase
        .from("leo_talent_identity_checks")
        .update({
          document_type: check.document_type,
          document_number_masked: check.document_number_masked || null,
          issuing_country: check.issuing_country || null,
          issue_date: check.issue_date || null,
          expiry_date: check.expiry_date || null,
          status: check.status,
          verification_method: check.verification_method || null,
          verified_by: check.verified_by || null,
          verified_at:
            check.status === "verified"
              ? check.verified_at || new Date().toISOString()
              : null,
          notes: check.notes || null,
        })
        .eq("id", check.id)
        .select("*")
        .single();

      if (error) throw error;

      setIdentityChecks((current) =>
        current.map((item) =>
          item.id === check.id ? (data as IdentityCheck) : item
        )
      );

      setSuccess("Identity check saved.");
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The identity check could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteIdentityCheck(id: string) {
    if (!window.confirm("Remove this identity check?")) return;

    setSaving(true);
    setNotice(null);

    try {
      const { error } = await supabase
        .from("leo_talent_identity_checks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setIdentityChecks((current) =>
        current.filter((item) => item.id !== id)
      );
      setSuccess("Identity check removed.");
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The identity check could not be removed."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createRightToWorkCheck() {
    if (!selectedRecord) return;

    setSaving(true);
    setNotice(null);

    try {
      const { data, error } = await supabase
        .from("leo_talent_right_to_work_checks")
        .insert({
          organisation_id: selectedRecord.profile.organisation_id,
          safer_recruitment_profile_id: selectedRecord.profile.id,
          check_type: "manual",
          right_to_work_status: "pending",
        })
        .select("*")
        .single();

      if (error) throw error;

      setRightToWorkChecks((current) => [
        ...current,
        data as RightToWorkCheck,
      ]);

      setSuccess("Right to work check added.");
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The right to work check could not be added."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveRightToWorkCheck(check: RightToWorkCheck) {
    setSaving(true);
    setNotice(null);

    try {
      const { data, error } = await supabase
        .from("leo_talent_right_to_work_checks")
        .update({
          check_type: check.check_type,
          nationality: check.nationality || null,
          right_to_work_status: check.right_to_work_status,
          share_code_masked: check.share_code_masked || null,
          check_date: check.check_date || null,
          expiry_date: check.expiry_date || null,
          follow_up_date: check.follow_up_date || null,
          restriction_details: check.restriction_details || null,
          verified_by: check.verified_by || null,
          verified_at: [
            "unrestricted",
            "time_limited",
          ].includes(check.right_to_work_status)
            ? check.verified_at || new Date().toISOString()
            : null,
          notes: check.notes || null,
        })
        .eq("id", check.id)
        .select("*")
        .single();

      if (error) throw error;

      setRightToWorkChecks((current) =>
        current.map((item) =>
          item.id === check.id ? (data as RightToWorkCheck) : item
        )
      );

      setSuccess("Right to work check saved.");
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The right to work check could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRightToWorkCheck(id: string) {
    if (!window.confirm("Remove this right to work check?")) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("leo_talent_right_to_work_checks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setRightToWorkChecks((current) =>
        current.filter((item) => item.id !== id)
      );
      setSuccess("Right to work check removed.");
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The right to work check could not be removed."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createReference() {
    if (!selectedRecord) return;

    const nextNumber =
      references.reduce(
        (highest, reference) =>
          Math.max(highest, reference.reference_number),
        0
      ) + 1;

    if (nextNumber > 5) {
      setError("A maximum of five references can be recorded.");
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const { data, error } = await supabase
        .from("leo_talent_references")
        .insert({
          organisation_id: selectedRecord.profile.organisation_id,
          safer_recruitment_profile_id: selectedRecord.profile.id,
          reference_number: nextNumber,
          referee_name: "New referee",
          request_status: "not_requested",
          phone_verification_required: true,
          phone_verification_status: "not_started",
          outcome: "pending",
        })
        .select("*")
        .single();

      if (error) throw error;

      setReferences((current) => [
        ...current,
        data as ReferenceRecord,
      ]);

      setSuccess(`Reference ${nextNumber} added.`);
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The reference could not be added."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveReference(reference: ReferenceRecord) {
    setSaving(true);
    setNotice(null);

    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("leo_talent_references")
        .update({
          referee_name: reference.referee_name.trim() || "Referee",
          referee_job_title: reference.referee_job_title || null,
          organisation_name: reference.organisation_name || null,
          email: reference.email || null,
          phone: reference.phone || null,
          relationship_to_candidate:
            reference.relationship_to_candidate || null,
          employment_start_date:
            reference.employment_start_date || null,
          employment_end_date: reference.employment_end_date || null,
          request_status: reference.request_status,
          requested_at:
            reference.request_status === "requested"
              ? reference.requested_at || now
              : reference.requested_at,
          received_at:
            reference.request_status === "received"
              ? reference.received_at || now
              : reference.received_at,
          concerns_declared: reference.concerns_declared,
          concerns_details: reference.concerns_details || null,
          phone_verification_required:
            reference.phone_verification_required,
          phone_verification_status:
            reference.phone_verification_status,
          phone_verified_by: reference.phone_verified_by || null,
          phone_verified_at:
            reference.phone_verification_status === "verified"
              ? reference.phone_verified_at || now
              : null,
          phone_verification_notes:
            reference.phone_verification_notes || null,
          outcome: reference.outcome,
        })
        .eq("id", reference.id)
        .select("*")
        .single();

      if (error) throw error;

      setReferences((current) =>
        current.map((item) =>
          item.id === reference.id
            ? (data as ReferenceRecord)
            : item
        )
      );

      setSuccess(`Reference ${reference.reference_number} saved.`);
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The reference could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteReference(id: string) {
    if (!window.confirm("Remove this reference record?")) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("leo_talent_references")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setReferences((current) =>
        current.filter((item) => item.id !== id)
      );
      setSuccess("Reference removed.");
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The reference could not be removed."
      );
    } finally {
      setSaving(false);
    }
  }
    async function createDbsCheck() {
    if (!selectedRecord) return;

    setSaving(true);
    setNotice(null);

    try {
      const { data, error } = await supabase
        .from("leo_talent_dbs_checks")
        .insert({
          organisation_id: selectedRecord.profile.organisation_id,
          safer_recruitment_profile_id: selectedRecord.profile.id,
          dbs_level: selectedRecord.vacancy?.dbs_level || "enhanced",
          status: selectedRecord.vacancy?.requires_dbs
            ? "application_required"
            : "not_required",
        })
        .select("*")
        .single();

      if (error) throw error;

      setDbsChecks((current) => [...current, data as DbsCheck]);
      setSuccess("DBS check added.");
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The DBS check could not be added."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveDbsCheck(check: DbsCheck) {
    setSaving(true);
    setNotice(null);

    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("leo_talent_dbs_checks")
        .update({
          dbs_level: check.dbs_level,
          workforce_type: check.workforce_type || null,
          application_reference_masked:
            check.application_reference_masked || null,
          certificate_number_masked:
            check.certificate_number_masked || null,
          application_date: check.application_date || null,
          certificate_issue_date: check.certificate_issue_date || null,
          status: check.status,
          update_service_member: check.update_service_member,
          update_service_check_date:
            check.update_service_check_date || null,
          update_service_result: check.update_service_result || null,
          barred_list_checked: check.barred_list_checked,
          barred_list_result: check.barred_list_result || null,
          certificate_seen_by: check.certificate_seen_by || null,
          certificate_seen_at: [
            "certificate_received",
            "review_required",
            "satisfactory",
            "concerns",
            "unsatisfactory",
          ].includes(check.status)
            ? check.certificate_seen_at || now
            : check.certificate_seen_at,
          disclosures_present: check.disclosures_present,
          disclosures_summary: check.disclosures_summary || null,
          risk_assessment_required: check.risk_assessment_required,
          risk_assessment_outcome:
            check.risk_assessment_outcome || null,
          notes: check.notes || null,
        })
        .eq("id", check.id)
        .select("*")
        .single();

      if (error) throw error;

      setDbsChecks((current) =>
        current.map((item) =>
          item.id === check.id ? (data as DbsCheck) : item
        )
      );

      setSuccess("DBS check saved.");
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The DBS check could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteDbsCheck(id: string) {
    if (!window.confirm("Remove this DBS check?")) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("leo_talent_dbs_checks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDbsChecks((current) =>
        current.filter((item) => item.id !== id)
      );
      setSuccess("DBS check removed.");
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The DBS check could not be removed."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createOverseasCheck() {
    if (!selectedRecord) return;

    setSaving(true);
    setNotice(null);

    try {
      const { data, error } = await supabase
        .from("leo_talent_overseas_checks")
        .insert({
          organisation_id: selectedRecord.profile.organisation_id,
          safer_recruitment_profile_id: selectedRecord.profile.id,
          country: selectedRecord.candidate?.country || "Not recorded",
          status: "not_started",
        })
        .select("*")
        .single();

      if (error) throw error;

      setOverseasChecks((current) => [
        ...current,
        data as OverseasCheck,
      ]);
      setSuccess("Overseas check added.");
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The overseas check could not be added."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveOverseasCheck(check: OverseasCheck) {
    setSaving(true);
    setNotice(null);

    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("leo_talent_overseas_checks")
        .update({
          country: check.country.trim() || "Not recorded",
          reason_required: check.reason_required || null,
          document_type: check.document_type || null,
          status: check.status,
          requested_at:
            check.status === "requested"
              ? check.requested_at || now
              : check.requested_at,
          received_at:
            ["received", "verified", "concerns"].includes(check.status)
              ? check.received_at || now
              : check.received_at,
          issue_date: check.issue_date || null,
          expiry_date: check.expiry_date || null,
          verified_by: check.verified_by || null,
          verified_at:
            check.status === "verified"
              ? check.verified_at || now
              : null,
          concerns_details: check.concerns_details || null,
          alternative_evidence: check.alternative_evidence || null,
          notes: check.notes || null,
        })
        .eq("id", check.id)
        .select("*")
        .single();

      if (error) throw error;

      setOverseasChecks((current) =>
        current.map((item) =>
          item.id === check.id ? (data as OverseasCheck) : item
        )
      );

      setSuccess("Overseas check saved.");
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The overseas check could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteOverseasCheck(id: string) {
    if (!window.confirm("Remove this overseas check?")) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("leo_talent_overseas_checks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setOverseasChecks((current) =>
        current.filter((item) => item.id !== id)
      );
      setSuccess("Overseas check removed.");
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The overseas check could not be removed."
      );
    } finally {
      setSaving(false);
    }
  }

  async function completeReview() {
    if (!selectedRecord) return;

    if (
      selectedRecord.profile.overall_risk_level === "not_assessed"
    ) {
      setError(
        "Record an overall risk position before completing the review."
      );
      return;
    }

    if (
      selectedRecord.profile.review_required &&
      !selectedRecord.profile.reviewed_by?.trim()
    ) {
      setError(
        "Record who completed the review before marking it complete."
      );
      return;
    }

    await updateProfile(
      {
        status: "complete",
        reviewed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      "Due diligence review completed."
    );
  }

  async function exportSelectedRecord() {
    if (!selectedRecord) return;

    const exportData = {
      exportedAt: new Date().toISOString(),
      candidate: selectedRecord.candidate,
      vacancy: selectedRecord.vacancy,
      application: selectedRecord.application,
      profile: selectedRecord.profile,
      checks: {
        identity: identityChecks,
        rightToWork: rightToWorkChecks,
        references,
        dbs: dbsChecks,
        overseas: overseasChecks,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fullCandidateName(selectedRecord.candidate)
      .replaceAll(" ", "-")
      .toLowerCase()}-due-diligence.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    setSuccess("Due diligence record exported.");
  }

  function updateIdentityLocal(
    id: string,
    changes: Partial<IdentityCheck>
  ) {
    setIdentityChecks((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      )
    );
  }

  function updateRightToWorkLocal(
    id: string,
    changes: Partial<RightToWorkCheck>
  ) {
    setRightToWorkChecks((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      )
    );
  }

  function updateReferenceLocal(
    id: string,
    changes: Partial<ReferenceRecord>
  ) {
    setReferences((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      )
    );
  }

  function updateDbsLocal(id: string, changes: Partial<DbsCheck>) {
    setDbsChecks((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      )
    );
  }

  function updateOverseasLocal(
    id: string,
    changes: Partial<OverseasCheck>
  ) {
    setOverseasChecks((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      )
    );
  }

  if (loading) {
    return (
      <WorkspaceShell>
        <EmptyState
          title="Loading due diligence"
          description="Leo is preparing the current due diligence register."
        />
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Leo Talent</p>
          <h1 style={styles.pageTitle}>Due diligence</h1>
          <p style={styles.pageDescription}>
            Record, verify and review identity, right to work,
            references, DBS and overseas checks before appointment.
          </p>
        </div>

        <div style={styles.headerActions}>
          <Button
            kind="secondary"
            onClick={() => void loadWorkspace()}
            disabled={loading || saving}
          >
            Refresh
          </Button>

          <Button
            onClick={() => void exportSelectedRecord()}
            disabled={!selectedRecord}
          >
            Export selected record
          </Button>
        </div>
      </div>

      {notice ? (
        <NoticeBanner notice={notice} onClose={() => setNotice(null)} />
      ) : null}

      <div style={styles.metricGrid}>
        <MetricCard
          label="Candidates in register"
          value={counts.total}
          description="Current due diligence profiles"
        />
        <MetricCard
          label="In progress"
          value={counts.inProgress}
          description="Checks currently being completed"
        />
        <MetricCard
          label="Awaiting review"
          value={counts.awaiting}
          description="Further information or review recorded"
        />
        <MetricCard
          label="Complete"
          value={counts.complete}
          description="Profiles marked complete"
        />
        <MetricCard
          label="Higher risk"
          value={counts.higherRisk}
          description="High or critical risk position"
        />
      </div>

      <div style={styles.controls}>
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search candidate, vacancy or reference"
          style={styles.searchInput}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          style={styles.select}
        >
          <option value="all">All statuses</option>
          {profileStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.workspaceGrid}>
        <aside style={styles.registerPanel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Candidate register</h2>
              <p style={styles.panelDescription}>
                {filteredRecords.length} record
                {filteredRecords.length === 1 ? "" : "s"} shown
              </p>
            </div>
          </div>

          <div style={styles.registerList}>
            {filteredRecords.length === 0 ? (
              <EmptyState
                title="No due diligence profiles"
                description="Profiles will appear here when an application enters pre-employment checks."
                compact
              />
            ) : (
              filteredRecords.map((record) => {
                const selected =
                  selectedProfileId === record.profile.id;

                return (
                  <button
                    key={record.profile.id}
                    type="button"
                    onClick={() => {
                      setSelectedProfileId(record.profile.id);
                      setActiveTab("overview");
                    }}
                    style={{
                      ...styles.registerItem,
                      ...(selected ? styles.registerItemSelected : {}),
                    }}
                  >
                    <div style={styles.avatar}>
                      {getInitials(record.candidate)}
                    </div>

                    <div style={styles.registerItemContent}>
                      <strong style={styles.registerName}>
                        {fullCandidateName(record.candidate)}
                      </strong>

                      <span style={styles.registerVacancy}>
                        {record.vacancy?.title ?? "Vacancy not found"}
                      </span>

                      <div style={styles.registerMeta}>
                        <StatusBadge status={record.profile.status} />
                        {record.profile.review_required ? (
                          <span style={styles.reviewMarker}>
                            Review needed
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main style={styles.detailPanel}>
          {!selectedRecord ? (
            <EmptyState
              title="Select a candidate"
              description="Choose a candidate from the register to manage their pre-employment checks."
            />
          ) : detailLoading ? (
            <EmptyState
              title="Loading candidate checks"
              description="Leo is preparing the due diligence workspace."
            />
          ) : (
            <>
              <div style={styles.candidateHeader}>
                <div style={styles.candidateIdentity}>
                  <div style={styles.largeAvatar}>
                    {getInitials(selectedRecord.candidate)}
                  </div>

                  <div>
                    <p style={styles.eyebrow}>
                      {selectedRecord.application?.application_reference ??
                        "Application"}
                    </p>

                    <h2 style={styles.candidateName}>
                      {fullCandidateName(selectedRecord.candidate)}
                    </h2>

                    <p style={styles.candidateSubtitle}>
                      {selectedRecord.vacancy?.title ??
                        "Vacancy not recorded"}
                      {selectedRecord.vacancy?.department
                        ? ` · ${selectedRecord.vacancy.department}`
                        : ""}
                      {selectedRecord.vacancy?.location_name
                        ? ` · ${selectedRecord.vacancy.location_name}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div style={styles.candidateHeaderRight}>
                  <StatusBadge status={selectedRecord.profile.status} />
                  <span style={styles.progressText}>
                    {completion}% checklist position
                  </span>
                </div>
              </div>

              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${completion}%`,
                  }}
                />
              </div>

              <div style={styles.tabBar}>
                {tabLabels.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      ...styles.tabButton,
                      ...(activeTab === tab.key
                        ? styles.tabButtonActive
                        : {}),
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={styles.tabContent}>
                {activeTab === "overview" ? (
                  <OverviewTab
                    record={selectedRecord}
                    detailCounts={detailCounts}
                    completion={completion}
                    saving={saving}
                    onStatusChange={(value) =>
                      void updateProfile(
                        { status: value as ProfileStatus },
                        "Profile status updated."
                      )
                    }
                    onRiskChange={(value) =>
                      void updateProfile(
                        { overall_risk_level: value as RiskLevel },
                        "Risk position updated."
                      )
                    }
                  />
                ) : null}

                {activeTab === "identity" ? (
                  <CheckSection
                    title="Identity checks"
                    description="Record the original identity documents examined and how the candidate’s identity was verified."
                    actionLabel="Add identity check"
                    onAction={() => void createIdentityCheck()}
                    empty={identityChecks.length === 0}
                    emptyText="No identity checks have been recorded."
                    disabled={saving}
                  >
                    {identityChecks.map((check, index) => (
                      <RecordCard
                        key={check.id}
                        title={`Identity check ${index + 1}`}
                        status={check.status}
                        onSave={() => void saveIdentityCheck(check)}
                        onDelete={() =>
                          void deleteIdentityCheck(check.id)
                        }
                        saving={saving}
                      >
                        <FormGrid>
                          <EditableInput
                            label="Document type"
                            value={check.document_type}
                            onChange={(value) =>
                              updateIdentityLocal(check.id, {
                                document_type: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Document number"
                            value={check.document_number_masked}
                            placeholder="Record only a masked reference"
                            onChange={(value) =>
                              updateIdentityLocal(check.id, {
                                document_number_masked: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Issuing country"
                            value={check.issuing_country}
                            onChange={(value) =>
                              updateIdentityLocal(check.id, {
                                issuing_country: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Issue date"
                            type="date"
                            value={check.issue_date}
                            onChange={(value) =>
                              updateIdentityLocal(check.id, {
                                issue_date: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Expiry date"
                            type="date"
                            value={check.expiry_date}
                            onChange={(value) =>
                              updateIdentityLocal(check.id, {
                                expiry_date: value,
                              })
                            }
                          />
                          <EditableSelect
                            label="Status"
                            value={check.status}
                            onChange={(value) =>
                              updateIdentityLocal(check.id, {
                                status: value,
                              })
                            }
                            options={[
                              { value: "pending", label: "Pending" },
                              { value: "verified", label: "Verified" },
                              { value: "rejected", label: "Rejected" },
                              { value: "expired", label: "Expired" },
                              {
                                value: "not_applicable",
                                label: "Not applicable",
                              },
                            ]}
                          />
                          <EditableInput
                            label="Verification method"
                            value={check.verification_method}
                            placeholder="Original document, digital check…"
                            onChange={(value) =>
                              updateIdentityLocal(check.id, {
                                verification_method: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Verified by"
                            value={check.verified_by}
                            onChange={(value) =>
                              updateIdentityLocal(check.id, {
                                verified_by: value,
                              })
                            }
                          />
                        </FormGrid>

                        <EditableTextArea
                          label="Notes"
                          value={check.notes}
                          onChange={(value) =>
                            updateIdentityLocal(check.id, {
                              notes: value,
                            })
                          }
                        />
                      </RecordCard>
                    ))}
                  </CheckSection>
                ) : null}

                {activeTab === "right_to_work" ? (
                  <CheckSection
                    title="Right to work"
                    description="Record the statutory right-to-work check, any restrictions and any required follow-up date."
                    actionLabel="Add right to work check"
                    onAction={() => void createRightToWorkCheck()}
                    empty={rightToWorkChecks.length === 0}
                    emptyText="No right to work check has been recorded."
                    disabled={saving}
                  >
                    {rightToWorkChecks.map((check, index) => (
                      <RecordCard
                        key={check.id}
                        title={`Right to work check ${index + 1}`}
                        status={check.right_to_work_status}
                        onSave={() =>
                          void saveRightToWorkCheck(check)
                        }
                        onDelete={() =>
                          void deleteRightToWorkCheck(check.id)
                        }
                        saving={saving}
                      >
                        <FormGrid>
                          <EditableSelect
                            label="Check type"
                            value={check.check_type}
                            onChange={(value) =>
                              updateRightToWorkLocal(check.id, {
                                check_type: value,
                              })
                            }
                            options={[
                              { value: "manual", label: "Manual" },
                              {
                                value: "online_share_code",
                                label: "Online share code",
                              },
                              {
                                value: "digital_identity",
                                label: "Digital identity",
                              },
                              {
                                value: "employer_checking_service",
                                label: "Employer Checking Service",
                              },
                              { value: "other", label: "Other" },
                            ]}
                          />
                          <EditableInput
                            label="Nationality"
                            value={check.nationality}
                            onChange={(value) =>
                              updateRightToWorkLocal(check.id, {
                                nationality: value,
                              })
                            }
                          />
                          <EditableSelect
                            label="Right to work position"
                            value={check.right_to_work_status}
                            onChange={(value) =>
                              updateRightToWorkLocal(check.id, {
                                right_to_work_status: value,
                              })
                            }
                            options={[
                              { value: "pending", label: "Pending" },
                              {
                                value: "unrestricted",
                                label: "Unrestricted",
                              },
                              {
                                value: "time_limited",
                                label: "Time limited",
                              },
                              {
                                value: "follow_up_required",
                                label: "Follow-up required",
                              },
                              {
                                value: "not_permitted",
                                label: "Not permitted",
                              },
                              {
                                value: "verification_failed",
                                label: "Verification failed",
                              },
                              {
                                value: "not_applicable",
                                label: "Not applicable",
                              },
                            ]}
                          />
                          <EditableInput
                            label="Share code"
                            value={check.share_code_masked}
                            placeholder="Masked reference only"
                            onChange={(value) =>
                              updateRightToWorkLocal(check.id, {
                                share_code_masked: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Check date"
                            type="date"
                            value={check.check_date}
                            onChange={(value) =>
                              updateRightToWorkLocal(check.id, {
                                check_date: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Permission expiry date"
                            type="date"
                            value={check.expiry_date}
                            onChange={(value) =>
                              updateRightToWorkLocal(check.id, {
                                expiry_date: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Follow-up date"
                            type="date"
                            value={check.follow_up_date}
                            onChange={(value) =>
                              updateRightToWorkLocal(check.id, {
                                follow_up_date: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Verified by"
                            value={check.verified_by}
                            onChange={(value) =>
                              updateRightToWorkLocal(check.id, {
                                verified_by: value,
                              })
                            }
                          />
                        </FormGrid>

                        <EditableTextArea
                          label="Restrictions"
                          value={check.restriction_details}
                          onChange={(value) =>
                            updateRightToWorkLocal(check.id, {
                              restriction_details: value,
                            })
                          }
                        />
                        <EditableTextArea
                          label="Notes"
                          value={check.notes}
                          onChange={(value) =>
                            updateRightToWorkLocal(check.id, {
                              notes: value,
                            })
                          }
                        />
                      </RecordCard>
                    ))}
                  </CheckSection>
                ) : null}

                {activeTab === "references" ? (
                  <CheckSection
                    title="References"
                    description={`This vacancy requires ${
                      selectedRecord.vacancy?.required_reference_count ?? 1
                    } reference${
                      (selectedRecord.vacancy?.required_reference_count ??
                        1) === 1
                        ? ""
                        : "s"
                    }. Record the request, response, verification and outcome separately.`}
                    actionLabel="Add reference"
                    onAction={() => void createReference()}
                    empty={references.length === 0}
                    emptyText="No references have been recorded."
                    disabled={saving || references.length >= 5}
                  >
                    {references.map((reference) => (
                      <RecordCard
                        key={reference.id}
                        title={`Reference ${reference.reference_number}`}
                        status={reference.outcome}
                        onSave={() => void saveReference(reference)}
                        onDelete={() =>
                          void deleteReference(reference.id)
                        }
                        saving={saving}
                      >
                        <FormGrid>
                          <EditableInput
                            label="Referee name"
                            value={reference.referee_name}
                            onChange={(value) =>
                              updateReferenceLocal(reference.id, {
                                referee_name: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Job title"
                            value={reference.referee_job_title}
                            onChange={(value) =>
                              updateReferenceLocal(reference.id, {
                                referee_job_title: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Business"
                            value={reference.organisation_name}
                            onChange={(value) =>
                              updateReferenceLocal(reference.id, {
                                organisation_name: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Relationship to candidate"
                            value={reference.relationship_to_candidate}
                            onChange={(value) =>
                              updateReferenceLocal(reference.id, {
                                relationship_to_candidate: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Email"
                            type="email"
                            value={reference.email}
                            onChange={(value) =>
                              updateReferenceLocal(reference.id, {
                                email: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Telephone"
                            type="tel"
                            value={reference.phone}
                            onChange={(value) =>
                              updateReferenceLocal(reference.id, {
                                phone: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Employment start"
                            type="date"
                            value={reference.employment_start_date}
                            onChange={(value) =>
                              updateReferenceLocal(reference.id, {
                                employment_start_date: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Employment end"
                            type="date"
                            value={reference.employment_end_date}
                            onChange={(value) =>
                              updateReferenceLocal(reference.id, {
                                employment_end_date: value,
                              })
                            }
                          />
                          <EditableSelect
                            label="Request status"
                            value={reference.request_status}
                            onChange={(value) =>
                              updateReferenceLocal(reference.id, {
                                request_status: value,
                              })
                            }
                            options={[
                              {
                                value: "not_requested",
                                label: "Not requested",
                              },
                              { value: "requested", label: "Requested" },
                              { value: "received", label: "Received" },
                              { value: "chased", label: "Chased" },
                              { value: "declined", label: "Declined" },
                              {
                                value: "unable_to_verify",
                                label: "Unable to verify",
                              },
                            ]}
                          />
                          <EditableSelect
                            label="Phone verification"
                            value={reference.phone_verification_status}
                            onChange={(value) =>
                              updateReferenceLocal(reference.id, {
                                phone_verification_status: value,
                              })
                            }
                            options={[
                              {
                                value: "not_started",
                                label: "Not started",
                              },
                              { value: "attempted", label: "Attempted" },
                              { value: "verified", label: "Verified" },
                              { value: "failed", label: "Failed" },
                              {
                                value: "not_required",
                                label: "Not required",
                              },
                            ]}
                          />
                          <EditableInput
                            label="Phone verified by"
                            value={reference.phone_verified_by}
                            onChange={(value) =>
                              updateReferenceLocal(reference.id, {
                                phone_verified_by: value,
                              })
                            }
                          />
                          <EditableSelect
                            label="Outcome"
                            value={reference.outcome}
                            onChange={(value) =>
                              updateReferenceLocal(reference.id, {
                                outcome: value,
                              })
                            }
                            options={[
                              { value: "pending", label: "Pending" },
                              {
                                value: "satisfactory",
                                label: "Satisfactory",
                              },
                              { value: "concerns", label: "Concerns" },
                              {
                                value: "unsatisfactory",
                                label: "Unsatisfactory",
                              },
                              { value: "withdrawn", label: "Withdrawn" },
                              {
                                value: "not_applicable",
                                label: "Not applicable",
                              },
                            ]}
                          />
                        </FormGrid>

                        <CheckboxField
                          label="The reference contains concerns"
                          checked={reference.concerns_declared}
                          onChange={(checked) =>
                            updateReferenceLocal(reference.id, {
                              concerns_declared: checked,
                            })
                          }
                        />

                        <EditableTextArea
                          label="Concerns or relevant details"
                          value={reference.concerns_details}
                          onChange={(value) =>
                            updateReferenceLocal(reference.id, {
                              concerns_details: value,
                            })
                          }
                        />

                        <EditableTextArea
                          label="Phone verification notes"
                          value={reference.phone_verification_notes}
                          onChange={(value) =>
                            updateReferenceLocal(reference.id, {
                              phone_verification_notes: value,
                            })
                          }
                        />
                      </RecordCard>
                    ))}
                  </CheckSection>
                ) : null}

                {activeTab === "dbs" ? (
                  <CheckSection
                    title="DBS checks"
                    description={
                      selectedRecord.vacancy?.requires_dbs
                        ? `This vacancy requires a ${normaliseLabel(
                            selectedRecord.vacancy.dbs_level
                          )} DBS check.`
                        : "This vacancy is not currently marked as requiring a DBS check."
                    }
                    actionLabel="Add DBS check"
                    onAction={() => void createDbsCheck()}
                    empty={dbsChecks.length === 0}
                    emptyText="No DBS check has been recorded."
                    disabled={saving}
                  >
                    {dbsChecks.map((check, index) => (
                      <RecordCard
                        key={check.id}
                        title={`DBS check ${index + 1}`}
                        status={check.status}
                        onSave={() => void saveDbsCheck(check)}
                        onDelete={() => void deleteDbsCheck(check.id)}
                        saving={saving}
                      >
                        <FormGrid>
                          <EditableSelect
                            label="DBS level"
                            value={check.dbs_level}
                            onChange={(value) =>
                              updateDbsLocal(check.id, {
                                dbs_level: value,
                              })
                            }
                            options={[
                              { value: "basic", label: "Basic" },
                              { value: "standard", label: "Standard" },
                              { value: "enhanced", label: "Enhanced" },
                              {
                                value: "enhanced_barred_list",
                                label: "Enhanced with barred list",
                              },
                            ]}
                          />
                          <EditableInput
                            label="Workforce type"
                            value={check.workforce_type}
                            placeholder="Child, adult or other workforce"
                            onChange={(value) =>
                              updateDbsLocal(check.id, {
                                workforce_type: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Application reference"
                            value={check.application_reference_masked}
                            placeholder="Masked reference"
                            onChange={(value) =>
                              updateDbsLocal(check.id, {
                                application_reference_masked: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Certificate number"
                            value={check.certificate_number_masked}
                            placeholder="Masked reference"
                            onChange={(value) =>
                              updateDbsLocal(check.id, {
                                certificate_number_masked: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Application date"
                            type="date"
                            value={check.application_date}
                            onChange={(value) =>
                              updateDbsLocal(check.id, {
                                application_date: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Certificate issue date"
                            type="date"
                            value={check.certificate_issue_date}
                            onChange={(value) =>
                              updateDbsLocal(check.id, {
                                certificate_issue_date: value,
                              })
                            }
                          />
                          <EditableSelect
                            label="Status"
                            value={check.status}
                            onChange={(value) =>
                              updateDbsLocal(check.id, {
                                status: value,
                              })
                            }
                            options={[
                              {
                                value: "not_started",
                                label: "Not started",
                              },
                              {
                                value: "application_required",
                                label: "Application required",
                              },
                              {
                                value: "application_submitted",
                                label: "Application submitted",
                              },
                              {
                                value: "awaiting_certificate",
                                label: "Awaiting certificate",
                              },
                              {
                                value: "certificate_received",
                                label: "Certificate received",
                              },
                              {
                                value: "review_required",
                                label: "Review required",
                              },
                              {
                                value: "satisfactory",
                                label: "Satisfactory",
                              },
                              { value: "concerns", label: "Concerns" },
                              {
                                value: "unsatisfactory",
                                label: "Unsatisfactory",
                              },
                              {
                                value: "not_required",
                                label: "Not required",
                              },
                            ]}
                          />
                          <EditableInput
                            label="Certificate seen by"
                            value={check.certificate_seen_by}
                            onChange={(value) =>
                              updateDbsLocal(check.id, {
                                certificate_seen_by: value,
                              })
                            }
                          />
                        </FormGrid>

                        <CheckboxField
                          label="Candidate is registered with the DBS Update Service"
                          checked={check.update_service_member}
                          onChange={(checked) =>
                            updateDbsLocal(check.id, {
                              update_service_member: checked,
                            })
                          }
                        />

                        <CheckboxField
                          label="Relevant barred list check completed"
                          checked={check.barred_list_checked}
                          onChange={(checked) =>
                            updateDbsLocal(check.id, {
                              barred_list_checked: checked,
                            })
                          }
                        />

                        <CheckboxField
                          label="The certificate contains disclosures"
                          checked={check.disclosures_present}
                          onChange={(checked) =>
                            updateDbsLocal(check.id, {
                              disclosures_present: checked,
                              risk_assessment_required: checked
                                ? true
                                : check.risk_assessment_required,
                            })
                          }
                        />

                        <CheckboxField
                          label="A suitability risk assessment is required"
                          checked={check.risk_assessment_required}
                          onChange={(checked) =>
                            updateDbsLocal(check.id, {
                              risk_assessment_required: checked,
                            })
                          }
                        />

                        <EditableTextArea
                          label="Disclosure summary"
                          value={check.disclosures_summary}
                          onChange={(value) =>
                            updateDbsLocal(check.id, {
                              disclosures_summary: value,
                            })
                          }
                        />

                        <EditableTextArea
                          label="Risk assessment outcome"
                          value={check.risk_assessment_outcome}
                          onChange={(value) =>
                            updateDbsLocal(check.id, {
                              risk_assessment_outcome: value,
                            })
                          }
                        />

                        <EditableTextArea
                          label="Notes"
                          value={check.notes}
                          onChange={(value) =>
                            updateDbsLocal(check.id, {
                              notes: value,
                            })
                          }
                        />
                      </RecordCard>
                    ))}
                  </CheckSection>
                ) : null}

                {activeTab === "overseas" ? (
                  <CheckSection
                    title="Overseas checks"
                    description="Record overseas criminal record or equivalent checks where the candidate’s history makes them relevant and obtainable."
                    actionLabel="Add overseas check"
                    onAction={() => void createOverseasCheck()}
                    empty={overseasChecks.length === 0}
                    emptyText="No overseas checks have been recorded."
                    disabled={saving}
                  >
                    {overseasChecks.map((check, index) => (
                      <RecordCard
                        key={check.id}
                        title={`Overseas check ${index + 1}`}
                        status={check.status}
                        onSave={() =>
                          void saveOverseasCheck(check)
                        }
                        onDelete={() =>
                          void deleteOverseasCheck(check.id)
                        }
                        saving={saving}
                      >
                        <FormGrid>
                          <EditableInput
                            label="Country"
                            value={check.country}
                            onChange={(value) =>
                              updateOverseasLocal(check.id, {
                                country: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Document or check type"
                            value={check.document_type}
                            onChange={(value) =>
                              updateOverseasLocal(check.id, {
                                document_type: value,
                              })
                            }
                          />
                          <EditableSelect
                            label="Status"
                            value={check.status}
                            onChange={(value) =>
                              updateOverseasLocal(check.id, {
                                status: value,
                              })
                            }
                            options={[
                              {
                                value: "not_started",
                                label: "Not started",
                              },
                              { value: "requested", label: "Requested" },
                              { value: "awaiting", label: "Awaiting" },
                              { value: "received", label: "Received" },
                              { value: "verified", label: "Verified" },
                              { value: "concerns", label: "Concerns" },
                              {
                                value: "unable_to_obtain",
                                label: "Unable to obtain",
                              },
                              {
                                value: "not_required",
                                label: "Not required",
                              },
                            ]}
                          />
                          <EditableInput
                            label="Issue date"
                            type="date"
                            value={check.issue_date}
                            onChange={(value) =>
                              updateOverseasLocal(check.id, {
                                issue_date: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Expiry date"
                            type="date"
                            value={check.expiry_date}
                            onChange={(value) =>
                              updateOverseasLocal(check.id, {
                                expiry_date: value,
                              })
                            }
                          />
                          <EditableInput
                            label="Verified by"
                            value={check.verified_by}
                            onChange={(value) =>
                              updateOverseasLocal(check.id, {
                                verified_by: value,
                              })
                            }
                          />
                        </FormGrid>

                        <EditableTextArea
                          label="Why the check is required"
                          value={check.reason_required}
                          onChange={(value) =>
                            updateOverseasLocal(check.id, {
                              reason_required: value,
                            })
                          }
                        />

                        <EditableTextArea
                          label="Concerns"
                          value={check.concerns_details}
                          onChange={(value) =>
                            updateOverseasLocal(check.id, {
                              concerns_details: value,
                            })
                          }
                        />

                        <EditableTextArea
                          label="Alternative evidence"
                          value={check.alternative_evidence}
                          onChange={(value) =>
                            updateOverseasLocal(check.id, {
                              alternative_evidence: value,
                            })
                          }
                        />

                        <EditableTextArea
                          label="Notes"
                          value={check.notes}
                          onChange={(value) =>
                            updateOverseasLocal(check.id, {
                              notes: value,
                            })
                          }
                        />
                      </RecordCard>
                    ))}
                  </CheckSection>
                ) : null}

                {activeTab === "review" ? (
                  <ReviewTab
                    record={selectedRecord}
                    completion={completion}
                    identityChecks={identityChecks}
                    rightToWorkChecks={rightToWorkChecks}
                    references={references}
                    dbsChecks={dbsChecks}
                    overseasChecks={overseasChecks}
                    saving={saving}
                    onProfileChange={(changes, message) =>
                      void updateProfile(changes, message)
                    }
                    onComplete={() => void completeReview()}
                  />
                ) : null}
              </div>
            </>
          )}
        </main>
      </div>
    </WorkspaceShell>
  );
}

function OverviewTab({
  record,
  detailCounts,
  completion,
  saving,
  onStatusChange,
  onRiskChange,
}: {
  record: WorkspaceRecord;
  detailCounts: typeof EMPTY_PROFILE_COUNTS;
  completion: number;
  saving: boolean;
  onStatusChange: (value: string) => void;
  onRiskChange: (value: string) => void;
}) {
  return (
    <div style={styles.sectionStack}>
      <SectionCard
        title="Current position"
        description="A clear summary of the candidate, vacancy and recorded check position."
      >
        <div style={styles.summaryGrid}>
          <SummaryItem
            label="Candidate reference"
            value={record.candidate?.candidate_reference ?? "Not recorded"}
          />
          <SummaryItem
            label="Application reference"
            value={
              record.application?.application_reference ?? "Not recorded"
            }
          />
          <SummaryItem
            label="Vacancy reference"
            value={record.vacancy?.vacancy_reference ?? "Not recorded"}
          />
          <SummaryItem
            label="Application stage"
            value={normaliseLabel(
              record.application?.current_stage_key
            )}
          />
          <SummaryItem
            label="Regulated role"
            value={record.vacancy?.regulated_role ? "Yes" : "No"}
          />
          <SummaryItem
            label="DBS required"
            value={
              record.vacancy?.requires_dbs
                ? normaliseLabel(record.vacancy.dbs_level)
                : "No"
            }
          />
          <SummaryItem
            label="Required references"
            value={String(record.vacancy?.required_reference_count ?? 1)}
          />
          <SummaryItem
            label="Last updated"
            value={formatDateTime(record.profile.updated_at)}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Checklist position"
        description="This is a working overview. Final suitability decisions remain with the authorised employer."
      >
        <div style={styles.checkSummaryGrid}>
          <CheckSummary
            label="Identity"
            value={`${detailCounts.identity} recorded`}
          />
          <CheckSummary
            label="Right to work"
            value={`${detailCounts.rightToWork} recorded`}
          />
          <CheckSummary
            label="References"
            value={`${detailCounts.references} recorded`}
          />
          <CheckSummary
            label="DBS"
            value={`${detailCounts.dbs} recorded`}
          />
          <CheckSummary
            label="Overseas"
            value={`${detailCounts.overseas} recorded`}
          />
          <CheckSummary
            label="Overall position"
            value={`${completion}%`}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Profile controls"
        description="Update the working status and overall risk position as evidence is received."
      >
        <FormGrid>
          <EditableSelect
            label="Profile status"
            value={record.profile.status}
            onChange={onStatusChange}
            options={profileStatusOptions}
            disabled={saving}
          />
          <EditableSelect
            label="Overall risk position"
            value={record.profile.overall_risk_level}
            onChange={onRiskChange}
            options={riskOptions}
            disabled={saving}
          />
        </FormGrid>
      </SectionCard>

      <LeoPanel>
        From the current record, the immediate priority is to make sure
        every required check is supported by evidence and that any
        inconsistency or concern is reviewed rather than treated as an
        automatic pass or failure. Recruitment decisions must remain
        evidence-based, proportionate and recorded.
      </LeoPanel>
    </div>
  );
}

function ReviewTab({
  record,
  completion,
  identityChecks,
  rightToWorkChecks,
  references,
  dbsChecks,
  overseasChecks,
  saving,
  onProfileChange,
  onComplete,
}: {
  record: WorkspaceRecord;
  completion: number;
  identityChecks: IdentityCheck[];
  rightToWorkChecks: RightToWorkCheck[];
  references: ReferenceRecord[];
  dbsChecks: DbsCheck[];
  overseasChecks: OverseasCheck[];
  saving: boolean;
  onProfileChange: (
    changes: Partial<SaferRecruitmentProfile>,
    message: string
  ) => void;
  onComplete: () => void;
}) {
  const requiredReferences = record.vacancy?.required_reference_count ?? 1;

  const checks = [
    {
      label: "Identity evidence",
      complete: identityChecks.some((check) =>
        ["verified", "not_applicable"].includes(check.status)
      ),
    },
    {
      label: "Right to work",
      complete: rightToWorkChecks.some((check) =>
        [
          "unrestricted",
          "time_limited",
          "not_applicable",
        ].includes(check.right_to_work_status)
      ),
    },
    {
      label: `Required references (${requiredReferences})`,
      complete:
        references.filter((reference) =>
          ["satisfactory", "not_applicable"].includes(
            reference.outcome
          )
        ).length >= requiredReferences,
    },
    {
      label: "DBS position",
      complete:
        !record.vacancy?.requires_dbs ||
        dbsChecks.some((check) =>
          ["satisfactory", "not_required"].includes(check.status)
        ),
    },
    {
      label: "Overseas check position",
      complete:
        overseasChecks.length === 0 ||
        overseasChecks.every((check) =>
          ["verified", "not_required"].includes(check.status)
        ),
    },
  ];

  return (
    <div style={styles.sectionStack}>
      <SectionCard
        title="Completion review"
        description="Review each requirement before recording the final due diligence position."
      >
        <div style={styles.reviewChecklist}>
          {checks.map((check) => (
            <div key={check.label} style={styles.reviewRow}>
              <span
                style={{
                  ...styles.checkIndicator,
                  ...(check.complete
                    ? styles.checkIndicatorComplete
                    : {}),
                }}
              >
                {check.complete ? "✓" : "–"}
              </span>
              <span style={styles.reviewLabel}>{check.label}</span>
              <StatusBadge
                status={
                  check.complete ? "complete" : "awaiting_information"
                }
              />
            </div>
          ))}
        </div>

        <div style={styles.reviewProgress}>
          Current checklist position: <strong>{completion}%</strong>
        </div>
      </SectionCard>

      <SectionCard
        title="Professional review"
        description="Record the reviewer, overall risk position and rationale. Avoid recording unnecessary sensitive detail."
      >
        <FormGrid>
          <EditableSelect
            label="Overall risk position"
            value={record.profile.overall_risk_level}
            onChange={(value) =>
              onProfileChange(
                { overall_risk_level: value as RiskLevel },
                "Risk position updated."
              )
            }
            options={riskOptions}
            disabled={saving}
          />

          <EditableInput
            label="Reviewed by"
            value={record.profile.reviewed_by}
            onChange={(value) =>
              onProfileChange(
                {
                  reviewed_by: value,
                  review_required: true,
                },
                "Reviewer updated."
              )
            }
            disabled={saving}
          />
        </FormGrid>

        <EditableTextArea
          label="Overall notes and decision rationale"
          value={record.profile.overall_notes}
          onChange={(value) =>
            onProfileChange(
              { overall_notes: value },
              "Review notes updated."
            )
          }
          disabled={saving}
        />

        <CheckboxField
          label="A further professional review is required before appointment"
          checked={record.profile.review_required}
          onChange={(checked) =>
            onProfileChange(
              { review_required: checked },
              "Review requirement updated."
            )
          }
          disabled={saving}
        />

        <div style={styles.reviewActions}>
          <Button
            kind="secondary"
            disabled={saving}
            onClick={() =>
              onProfileChange(
                {
                  status: "awaiting_information",
                  review_required: true,
                },
                "Profile marked as awaiting further information."
              )
            }
          >
            Await further information
          </Button>

          <Button disabled={saving} onClick={onComplete}>
            {saving ? "Saving…" : "Complete due diligence review"}
          </Button>
        </div>
      </SectionCard>

      <LeoPanel>
        Completing the checklist does not remove the need for professional
        judgement. Any discrepancy, disclosure, unexplained employment
        history or verification concern should be considered on its own
        facts, with the final decision and rationale recorded clearly.
      </LeoPanel>
    </div>
  );
}

function WorkspaceShell({ children }: { children: ReactNode }) {
  return <div style={styles.page}>{children}</div>;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>{title}</h3>
        {description ? (
          <p style={styles.sectionDescription}>{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function CheckSection({
  title,
  description,
  actionLabel,
  onAction,
  empty,
  emptyText,
  disabled,
  children,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  empty: boolean;
  emptyText: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={styles.sectionStack}>
      <div style={styles.checkSectionHeader}>
        <div>
          <h3 style={styles.sectionTitle}>{title}</h3>
          <p style={styles.sectionDescription}>{description}</p>
        </div>

        <Button onClick={onAction} disabled={disabled}>
          {actionLabel}
        </Button>
      </div>

      {empty ? (
        <EmptyState
          title="Nothing recorded yet"
          description={emptyText}
          compact
        />
      ) : (
        children
      )}
    </div>
  );
}

function RecordCard({
  title,
  status,
  onSave,
  onDelete,
  saving,
  children,
}: {
  title: string;
  status: string;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
  children: ReactNode;
}) {
  return (
    <section style={styles.recordCard}>
      <div style={styles.recordCardHeader}>
        <div>
          <h4 style={styles.recordCardTitle}>{title}</h4>
          <StatusBadge status={status} />
        </div>

        <div style={styles.recordActions}>
          <Button
            kind="danger"
            onClick={onDelete}
            disabled={saving}
          >
            Remove
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div style={styles.recordBody}>{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div style={styles.metricCard}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
      <span style={styles.metricDescription}>{description}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);

  return (
    <span
      style={{
        ...styles.statusBadge,
        background: tone.background,
        borderColor: tone.border,
        color: tone.colour,
      }}
    >
      {normaliseLabel(status)}
    </span>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.summaryItem}>
      <span style={styles.summaryLabel}>{label}</span>
      <strong style={styles.summaryValue}>{value}</strong>
    </div>
  );
}

function CheckSummary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.checkSummary}>
      <span style={styles.checkSummaryLabel}>{label}</span>
      <strong style={styles.checkSummaryValue}>{value}</strong>
    </div>
  );
}

function FormGrid({ children }: { children: ReactNode }) {
  return <div style={styles.formGrid}>{children}</div>;
}

function EditableInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
}: EditableInputProps) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        style={styles.input}
      />
    </label>
  );
}

function EditableSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: EditableSelectProps) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        style={styles.select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EditableTextArea({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={4}
        style={styles.textarea}
      />
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label style={styles.checkboxField}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        style={styles.checkbox}
      />
      <span>{label}</span>
    </label>
  );
}

function Button({
  children,
  onClick,
  disabled,
  kind = "primary",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  kind?: "primary" | "secondary" | "danger";
  type?: "button" | "submit";
}) {
  const kindStyle =
    kind === "secondary"
      ? styles.buttonSecondary
      : kind === "danger"
      ? styles.buttonDanger
      : styles.buttonPrimary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.button,
        ...kindStyle,
        ...(disabled ? styles.buttonDisabled : {}),
      }}
    >
      {children}
    </button>
  );
}

function LeoPanel({ children }: { children: ReactNode }) {
  return (
    <section style={styles.leoPanel}>
      <div style={styles.leoIcon}>✦</div>
      <div>
        <h3 style={styles.leoTitle}>Leo guidance</h3>
        <p style={styles.leoText}>{children}</p>
      </div>
    </section>
  );
}

function NoticeBanner({
  notice,
  onClose,
}: {
  notice: Notice;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        ...styles.notice,
        ...(notice.type === "error"
          ? styles.noticeError
          : styles.noticeSuccess),
      }}
    >
      <span>{notice.message}</span>
      <button type="button" onClick={onClose} style={styles.noticeClose}>
        ×
      </button>
    </div>
  );
}

function EmptyState({
  title,
  description,
  compact,
}: {
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.emptyState,
        ...(compact ? styles.emptyStateCompact : {}),
      }}
    >
      <div style={styles.emptyIcon}>✦</div>
      <h3 style={styles.emptyTitle}>{title}</h3>
      <p style={styles.emptyDescription}>{description}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100%",
    padding: "32px",
    background: "#FBF9FD",
    color: "#2F2933",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "24px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    color: "#6E5084",
    fontWeight: 700,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  pageTitle: {
    margin: "6px 0 8px",
    fontSize: "32px",
    lineHeight: 1.15,
    color: "#2F2933",
  },
  pageDescription: {
    margin: 0,
    maxWidth: "720px",
    color: "#6D6671",
    lineHeight: 1.6,
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },
  metricCard: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "18px",
    borderRadius: "18px",
    border: "1px solid #E8DFF0",
    background: "#FFFFFF",
    boxShadow: "0 8px 24px rgba(75, 52, 87, 0.04)",
  },
  metricLabel: {
    color: "#706879",
    fontSize: "13px",
    fontWeight: 600,
  },
  metricValue: {
    color: "#6E5084",
    fontSize: "28px",
    lineHeight: 1,
  },
  metricDescription: {
    color: "#8B8490",
    fontSize: "12px",
    lineHeight: 1.4,
  },
  controls: {
    display: "flex",
    gap: "12px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: "1 1 320px",
    minWidth: "220px",
    padding: "11px 13px",
    border: "1px solid #DCD3E2",
    borderRadius: "12px",
    background: "#FFFFFF",
    color: "#2F2933",
    outline: "none",
  },
  workspaceGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(270px, 340px) minmax(0, 1fr)",
    gap: "18px",
    alignItems: "start",
  },
  registerPanel: {
    background: "#FFFFFF",
    border: "1px solid #E8DFF0",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(75, 52, 87, 0.04)",
    position: "sticky",
    top: "20px",
  },
  panelHeader: {
    padding: "20px",
    borderBottom: "1px solid #EEE7F3",
  },
  panelTitle: {
    margin: 0,
    fontSize: "17px",
  },
  panelDescription: {
    margin: "5px 0 0",
    color: "#827A87",
    fontSize: "13px",
  },
  registerList: {
    maxHeight: "720px",
    overflowY: "auto",
  },
  registerItem: {
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "15px 18px",
    border: 0,
    borderBottom: "1px solid #F1ECF4",
    background: "#FFFFFF",
    textAlign: "left",
    cursor: "pointer",
  },
  registerItemSelected: {
    background: "#F7F1FC",
    boxShadow: "inset 4px 0 0 #6E5084",
  },
  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    background: "#EFE4F7",
    color: "#6E5084",
    fontWeight: 800,
    fontSize: "13px",
  },
  registerItemContent: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  registerName: {
    fontSize: "14px",
    color: "#342D38",
  },
  registerVacancy: {
    color: "#77707C",
    fontSize: "12px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  registerMeta: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginTop: "4px",
    flexWrap: "wrap",
  },
  reviewMarker: {
    color: "#78613A",
    fontSize: "11px",
    fontWeight: 700,
  },
  detailPanel: {
    minWidth: 0,
    background: "#FFFFFF",
    border: "1px solid #E8DFF0",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(75, 52, 87, 0.04)",
  },
  candidateHeader: {
    padding: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
  },
  candidateIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  largeAvatar: {
    width: "56px",
    height: "56px",
    borderRadius: "17px",
    display: "grid",
    placeItems: "center",
    background: "#EFE4F7",
    color: "#6E5084",
    fontWeight: 800,
    fontSize: "17px",
  },
  candidateName: {
    margin: "4px 0",
    fontSize: "23px",
    color: "#302A34",
  },
  candidateSubtitle: {
    margin: 0,
    color: "#77707C",
    fontSize: "13px",
  },
  candidateHeaderRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "7px",
  },
  progressText: {
    color: "#77707C",
    fontSize: "12px",
  },
  progressTrack: {
    height: "5px",
    background: "#F1EAF5",
  },
  progressFill: {
    height: "100%",
    background: "#6E5084",
    transition: "width 180ms ease",
  },
  tabBar: {
    display: "flex",
    gap: "4px",
    padding: "12px 18px 0",
    borderBottom: "1px solid #EDE7F1",
    overflowX: "auto",
  },
  tabButton: {
    border: 0,
    borderBottom: "3px solid transparent",
    background: "transparent",
    padding: "11px 12px",
    color: "#776F7C",
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontWeight: 600,
    fontSize: "13px",
  },
  tabButtonActive: {
    color: "#6E5084",
    borderBottomColor: "#6E5084",
  },
  tabContent: {
    padding: "24px",
  },
  sectionStack: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  sectionCard: {
    padding: "20px",
    border: "1px solid #E9E1EE",
    borderRadius: "17px",
    background: "#FFFFFF",
  },
  sectionHeader: {
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "17px",
    color: "#332C37",
  },
  sectionDescription: {
    margin: "6px 0 0",
    color: "#77707C",
    fontSize: "13px",
    lineHeight: 1.55,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
  },
  summaryItem: {
    padding: "14px",
    borderRadius: "13px",
    background: "#FAF7FC",
    border: "1px solid #EEE6F3",
  },
  summaryLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#837A88",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  summaryValue: {
    color: "#3C3441",
    fontSize: "13px",
    wordBreak: "break-word",
  },
  checkSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
  },
  checkSummary: {
    padding: "14px",
    border: "1px solid #E8DFED",
    borderRadius: "13px",
  },
  checkSummaryLabel: {
    display: "block",
    color: "#7A7280",
    fontSize: "12px",
  },
  checkSummaryValue: {
    display: "block",
    marginTop: "5px",
    color: "#6E5084",
    fontSize: "15px",
  },
  checkSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    flexWrap: "wrap",
  },
  recordCard: {
    border: "1px solid #E7DFEC",
    borderRadius: "17px",
    overflow: "hidden",
    background: "#FFFFFF",
  },
  recordCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    padding: "16px 18px",
    background: "#FAF7FC",
    borderBottom: "1px solid #E9E2EE",
    flexWrap: "wrap",
  },
  recordCardTitle: {
    margin: "0 0 7px",
    fontSize: "15px",
  },
  recordActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  recordBody: {
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "13px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    color: "#514956",
    fontSize: "13px",
  },
  fieldLabel: {
    fontWeight: 650,
    color: "#5E5663",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 11px",
    border: "1px solid #DCD3E2",
    borderRadius: "10px",
    background: "#FFFFFF",
    color: "#302A34",
    outline: "none",
  },
  select: {
    minWidth: "190px",
    boxSizing: "border-box",
    padding: "10px 11px",
    border: "1px solid #DCD3E2",
    borderRadius: "10px",
    background: "#FFFFFF",
    color: "#302A34",
    outline: "none",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 11px",
    border: "1px solid #DCD3E2",
    borderRadius: "10px",
    background: "#FFFFFF",
    color: "#302A34",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
  },
  checkboxField: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    padding: "11px 12px",
    background: "#FAF7FC",
    border: "1px solid #EBE3F0",
    borderRadius: "11px",
    color: "#514956",
    fontSize: "13px",
    cursor: "pointer",
  },
  checkbox: {
    marginTop: "2px",
    accentColor: "#6E5084",
  },
  statusBadge: {
    display: "inline-flex",
    width: "fit-content",
    alignItems: "center",
    padding: "4px 8px",
    border: "1px solid",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 750,
    lineHeight: 1,
  },
  button: {
    borderRadius: "10px",
    padding: "9px 13px",
    fontWeight: 700,
    fontSize: "12px",
    cursor: "pointer",
    transition: "opacity 150ms ease",
  },
  buttonPrimary: {
    border: "1px solid #6E5084",
    background: "#6E5084",
    color: "#FFFFFF",
  },
  buttonSecondary: {
    border: "1px solid #D8CBE1",
    background: "#FFFFFF",
    color: "#6E5084",
  },
  buttonDanger: {
    border: "1px solid #E6CBD2",
    background: "#FFFFFF",
    color: "#8A4252",
  },
  buttonDisabled: {
    opacity: 0.52,
    cursor: "not-allowed",
  },
  leoPanel: {
    display: "flex",
    gap: "13px",
    padding: "18px",
    borderRadius: "16px",
    border: "1px solid #DCCBE8",
    background: "#F7F1FC",
  },
  leoIcon: {
    width: "34px",
    height: "34px",
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    borderRadius: "11px",
    background: "#FFFFFF",
    color: "#6E5084",
    fontWeight: 800,
  },
  leoTitle: {
    margin: 0,
    color: "#5F4372",
    fontSize: "14px",
  },
  leoText: {
    margin: "5px 0 0",
    color: "#655A6B",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  reviewChecklist: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },
  reviewRow: {
    display: "grid",
    gridTemplateColumns: "30px minmax(0, 1fr) auto",
    alignItems: "center",
    gap: "10px",
    padding: "11px",
    border: "1px solid #E9E1EE",
    borderRadius: "11px",
  },
  checkIndicator: {
    width: "26px",
    height: "26px",
    display: "grid",
    placeItems: "center",
    borderRadius: "8px",
    background: "#F3EDF6",
    color: "#82728B",
    fontWeight: 800,
  },
  checkIndicatorComplete: {
    background: "#EDF7F1",
    color: "#3D6A50",
  },
  reviewLabel: {
    color: "#4C4451",
    fontSize: "13px",
    fontWeight: 600,
  },
  reviewProgress: {
    marginTop: "14px",
    padding: "12px",
    borderRadius: "11px",
    background: "#F7F1FC",
    color: "#66536F",
    fontSize: "13px",
  },
  reviewActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "9px",
    marginTop: "16px",
    flexWrap: "wrap",
  },
  notice: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    padding: "12px 14px",
    marginBottom: "18px",
    borderRadius: "12px",
    border: "1px solid",
    fontSize: "13px",
  },
  noticeSuccess: {
    background: "#F1F8F4",
    borderColor: "#C7E3D1",
    color: "#35634A",
  },
  noticeError: {
    background: "#FCF2F4",
    borderColor: "#E9C8D0",
    color: "#8A4252",
  },
  noticeClose: {
    border: 0,
    background: "transparent",
    color: "inherit",
    fontSize: "20px",
    lineHeight: 1,
    cursor: "pointer",
  },
  emptyState: {
    minHeight: "360px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    textAlign: "center",
  },
  emptyStateCompact: {
    minHeight: "180px",
  },
  emptyIcon: {
    width: "42px",
    height: "42px",
    display: "grid",
    placeItems: "center",
    borderRadius: "14px",
    background: "#F1E8F7",
    color: "#6E5084",
    fontSize: "18px",
  },
  emptyTitle: {
    margin: "13px 0 5px",
    fontSize: "16px",
  },
  emptyDescription: {
    maxWidth: "440px",
    margin: 0,
    color: "#7C7481",
    fontSize: "13px",
    lineHeight: 1.55,
  },
};