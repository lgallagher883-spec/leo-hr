"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ORGANISATION_ID =
  "default-organisation";

type SourceTable =
  | "policy_register"
  | "company_documents";

type ResourceAction =
  | "prepare"
  | "replace"
  | "archive"
  | "restore"
  | "delete";

type RegisterItem = {
  id: number;
  name: string;
  register_type: string;
  category: string | null;
  next_review_date: string | null;
  responsible_person: string | null;
  notes: string | null;
  file_name: string | null;
  file_path: string | null;
  file_url: string | null;
  created_at?: string | null;
  is_archived: boolean;
  archived_at: string | null;
  version_number: number;
  updated_at: string | null;
};

type CompanyDocument = {
  id: number;
  name: string;
  document_type: string | null;
  category: string | null;
  responsible_person: string | null;
  notes: string | null;
  file_name: string | null;
  file_path: string | null;
  file_url: string | null;
  created_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  version_number: number;
  updated_at: string | null;
};

type ResourceVersion = {
  id: string;
  version_number: number;
  resource_name: string;
  resource_type: string | null;
  category: string | null;
  responsible_person: string | null;
  review_date: string | null;
  notes: string | null;
  file_name: string | null;
  file_path: string | null;
  file_url: string | null;
  replaced_at: string;
};

type KnowledgeResourceStatus = {
  key: string;
  sourceTable: string;
  sourceRecordId: number;
  sectionCount: number;
  activeSectionCount: number;
  lastPreparedAt: string | null;
};

type DisplayResource = {
  key: string;
  recordId: number;
  sourceTable: SourceTable;

  name: string;
  type: string;
  category: string | null;

  reviewDate: string | null;
  responsiblePerson: string | null;
  uploadedDate: string | null;

  notes: string | null;

  fileName: string | null;
  filePath: string | null;
  fileUrl: string | null;

  isArchived: boolean;
  archivedAt: string | null;

  versionNumber: number;
  updatedAt: string | null;

  knowledgeSectionCount: number;
  activeKnowledgeSectionCount: number;
  lastPreparedAt: string | null;
};

const resourceTypes = [
  ["Policy", "Policies"],
  ["Procedure", "Procedures"],
  ["Contract", "Contracts"],
  ["Handbook", "Handbooks"],
  ["Template", "Templates"],
  ["Form", "Forms"],
  [
    "Risk Assessment",
    "Risk Assessments",
  ],
  ["Training", "Training"],
  ["Guidance", "Guidance"],
  ["Register", "Registers"],
] as const;

export default function PoliciesPage() {
  const [items, setItems] = useState<
    RegisterItem[]
  >([]);

  const [documents, setDocuments] =
    useState<CompanyDocument[]>([]);

  const [
    knowledgeStatuses,
    setKnowledgeStatuses,
  ] = useState<
    Record<string, KnowledgeResourceStatus>
  >({});

  const [loading, setLoading] =
    useState(true);

  const [activeWorkspace, setActiveWorkspace] =
    useState<"library" | "organisation">("library");

  const [activeTab, setActiveTab] =
    useState("Policy");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [registerType, setRegisterType] =
    useState("Policy");

  const [name, setName] = useState("");

  const [category, setCategory] =
    useState("");

  const [
    nextReviewDate,
    setNextReviewDate,
  ] = useState("");

  const [
    responsiblePerson,
    setResponsiblePerson,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [
    actionInProgress,
    setActionInProgress,
  ] = useState<string | null>(null);

  const [
    versionsResource,
    setVersionsResource,
  ] = useState<DisplayResource | null>(
    null
  );

  const [
    resourceVersions,
    setResourceVersions,
  ] = useState<ResourceVersion[]>([]);

  const [
    loadingVersions,
    setLoadingVersions,
  ] = useState(false);

  const [
    replacementResource,
    setReplacementResource,
  ] = useState<DisplayResource | null>(
    null
  );

  const [
    replacementFile,
    setReplacementFile,
  ] = useState<File | null>(null);

  useEffect(() => {
    loadResources();
  }, []);

  async function loadResources() {
    setLoading(true);

    try {
      const [resourcesResponse, knowledgeResponse] =
        await Promise.all([
          fetch("/api/hr-resources", {
            method: "GET",
            cache: "no-store",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }),

          fetch(
            `/api/knowledge/resources?organisationId=${encodeURIComponent(
              ORGANISATION_ID
            )}`,
            {
              cache: "no-store",
            }
          ),
        ]);

      const resourcesResult =
        await resourcesResponse
          .json()
          .catch(() => null);

      if (
        !resourcesResponse.ok ||
        !resourcesResult?.success
      ) {
        throw new Error(
          resourcesResult?.error ||
            "HR resources could not be loaded."
        );
      }

      setItems(
        Array.isArray(
          resourcesResult.items
        )
          ? (resourcesResult.items as RegisterItem[])
          : []
      );

      setDocuments(
        Array.isArray(
          resourcesResult.documents
        )
          ? (resourcesResult.documents as CompanyDocument[])
          : []
      );

      if (knowledgeResponse.ok) {
        const knowledgeResult =
          await knowledgeResponse.json();

        const statuses: Record<
          string,
          KnowledgeResourceStatus
        > = {};

        if (
          knowledgeResult.success &&
          Array.isArray(
            knowledgeResult.resources
          )
        ) {
          for (const status of
            knowledgeResult.resources) {
            statuses[status.key] =
              status;
          }
        }

        setKnowledgeStatuses(statuses);
      } else {
        console.warn(
          "Resource knowledge status could not be loaded."
        );

        setKnowledgeStatuses({});
      }
    } catch (error) {
      console.error(
        "Could not load HR Resources:",
        error
      );

      setItems([]);
      setDocuments([]);
      setKnowledgeStatuses({});
    } finally {
      setLoading(false);
    }
  }

  async function uploadItem() {
    if (!name.trim()) {
      alert(
        "Please enter a resource name."
      );
      return;
    }

    if (!file) {
      alert(
        "Please choose a resource to upload."
      );
      return;
    }

    setUploading(true);

    try {
      const resourceName =
        name.trim();

      const resourceType =
        registerType;

      const originalFileName =
        file.name;

      const safeFileName =
        originalFileName.replace(
          /[^a-zA-Z0-9.-]/g,
          "_"
        );

      const folderName =
        resourceType
          .toLowerCase()
          .replaceAll(" ", "-");

      const filePath =
        `${folderName}/${Date.now()}-${safeFileName}`;

      const uploadResult =
        await supabase.storage
          .from("policy-documents")
          .upload(filePath, file);

      if (uploadResult.error) {
        console.error(
          uploadResult.error
        );

        alert(
          "Resource could not be uploaded."
        );

        return;
      }

      const publicUrlResult =
        supabase.storage
          .from("policy-documents")
          .getPublicUrl(filePath);

      const fileUrl =
        publicUrlResult.data.publicUrl;

      const {
        data: savedResource,
        error: saveError,
      } = await supabase
        .from("policy_register")
        .insert({
          name: resourceName,

          register_type:
            resourceType,

          category:
            category.trim() || null,

          next_review_date:
            nextReviewDate || null,

          responsible_person:
            responsiblePerson.trim() ||
            null,

          status: "Current",

          notes:
            notes.trim() || null,

          file_name:
            originalFileName,

          file_path: filePath,

          file_url: fileUrl,

          is_archived: false,

          archived_at: null,
        })
        .select("id")
        .single();

      if (
        saveError ||
        !savedResource
      ) {
        console.error(saveError);

        alert(
          "Resource record could not be saved."
        );

        return;
      }

      const isDocx =
        originalFileName
          .toLowerCase()
          .endsWith(".docx");

      if (isDocx) {
        try {
          const knowledgeResponse =
            await fetch(
              "/api/knowledge/process",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  documentId:
                    `policy-register-${savedResource.id}`,

                  organisationId:
                    ORGANISATION_ID,

                  fileName:
                    originalFileName,

                  fileUrl,

                  sourceTable:
                    "policy_register",

                  sourceRecordId:
                    savedResource.id,
                }),
              }
            );

          const knowledgeResult =
            await knowledgeResponse.json();

          if (
            !knowledgeResponse.ok ||
            !knowledgeResult.success
          ) {
            console.error(
              "Resource uploaded, but Leo could not prepare it:",
              knowledgeResult
            );

            alert(
              "The resource was uploaded successfully. Leo could not prepare its contents yet, but the file remains safely stored."
            );
          } else {
            alert(
              `Resource added successfully. ${knowledgeResult.storedChunkCount} knowledge sections are now ready for Leo.`
            );
          }
        } catch (
          knowledgeError
        ) {
          console.error(
            "Resource uploaded, but knowledge preparation failed:",
            knowledgeError
          );

          alert(
            "The resource was uploaded successfully. Leo could not prepare its contents yet, but the file remains safely stored."
          );
        }
      } else {
        alert(
          "Resource added successfully. Automatic knowledge preparation currently supports DOCX files."
        );
      }

      resetForm();

      setActiveTab(
        resourceType
      );

      await loadResources();
    } finally {
      setUploading(false);
    }
  }

  async function chooseReplacement(
    resource: DisplayResource
  ) {
    const input =
      document.createElement("input");

    input.type = "file";

    input.accept =
      ".doc,.docx,.pdf,.txt,.xlsx,.xls,.csv,.ppt,.pptx";

    input.onchange = async (event) => {
      const target =
        event.target as HTMLInputElement;

      const selectedFile =
        target.files?.[0];

      if (!selectedFile) {
        return;
      }

      const confirmed =
        window.confirm(
          `Replace "${resource.name}" with "${selectedFile.name}"?\n\nThe current version will be preserved in version history. The new version will become active and, if it is a DOCX file, Leo will prepare it automatically.`
        );

      if (!confirmed) {
        return;
      }

      setReplacementResource(resource);
      setReplacementFile(selectedFile);

      const actionKey =
        `${resource.key}:replace`;

      setActionInProgress(actionKey);

      try {
        const safeFileName =
          selectedFile.name.replace(
            /[^a-zA-Z0-9.-]/g,
            "_"
          );

        const folderName =
          resource.type
            .toLowerCase()
            .replaceAll(" ", "-");

        const newFilePath =
          `${folderName}/versions/${Date.now()}-${safeFileName}`;

        const storageBucket =
          resource.sourceTable ===
          "policy_register"
            ? "policy-documents"
            : "company-documents";

        const uploadResult =
          await supabase.storage
            .from(storageBucket)
            .upload(
              newFilePath,
              selectedFile
            );

        if (uploadResult.error) {
          console.error(
            "Replacement upload failed:",
            uploadResult.error
          );

          alert(
            "The replacement file could not be uploaded."
          );

          return;
        }

        const publicUrlResult =
          supabase.storage
            .from(storageBucket)
            .getPublicUrl(
              newFilePath
            );

        const newFileUrl =
          publicUrlResult.data.publicUrl;

        const response = await fetch(
          "/api/knowledge/resources/manage",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              action: "replace",

              sourceTable:
                resource.sourceTable,

              sourceRecordId:
                resource.recordId,

              organisationId:
                ORGANISATION_ID,

              documentId:
                buildDocumentId(
                  resource
                ),

              newFileName:
                selectedFile.name,

              newFilePath,

              newFileUrl,
            }),
          }
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          console.error(
            "Resource replacement failed:",
            result
          );

          alert(
            result.error ||
              "The resource could not be replaced."
          );

          return;
        }

        const knowledgeMessage =
          result.knowledgePrepared
            ? ` ${result.storedChunkCount || 0} knowledge sections are ready for Leo.`
            : result.warning
              ? ` ${result.warning}`
              : "";

        alert(
          `${result.message}${knowledgeMessage}`
        );

        setReplacementResource(null);
        setReplacementFile(null);

        await loadResources();
      } catch (error) {
        console.error(
          "Resource replacement failed:",
          error
        );

        alert(
          "The resource could not be replaced."
        );
      } finally {
        setActionInProgress(null);
      }
    };

    input.click();
  }

  async function loadVersions(
    resource: DisplayResource
  ) {
    setVersionsResource(resource);
    setResourceVersions([]);
    setLoadingVersions(true);

    try {
      const response = await fetch(
        `/api/knowledge/resources/versions?sourceTable=${encodeURIComponent(
          resource.sourceTable
        )}&sourceRecordId=${encodeURIComponent(
          String(resource.recordId)
        )}`,
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.error ??
            "Version history could not be loaded."
        );

        setVersionsResource(null);
        return;
      }

      setResourceVersions(
        Array.isArray(result.versions)
          ? result.versions
          : []
      );
    } catch (error) {
      console.error(
        "Version history could not be loaded:",
        error
      );

      alert(
        "Version history could not be loaded."
      );

      setVersionsResource(null);
    } finally {
      setLoadingVersions(false);
    }
  }

  async function manageResource(
    resource: DisplayResource,
    action: ResourceAction
  ) {
    const actionKey =
      `${resource.key}:${action}`;

    setActionInProgress(actionKey);

    try {
      const response = await fetch(
        "/api/knowledge/resources/manage",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action,

            sourceTable:
              resource.sourceTable,

            sourceRecordId:
              resource.recordId,

            organisationId:
              ORGANISATION_ID,

            fileName:
              resource.fileName,

            fileUrl:
              resource.fileUrl,

            filePath:
              resource.filePath,

            documentId:
              buildDocumentId(
                resource
              ),
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        console.error(
          "Resource action failed:",
          result
        );

        alert(
          result.error ||
            "Leo could not complete that action."
        );

        return;
      }

      if (action === "prepare") {
        alert(
          `${result.message} ${result.storedChunkCount || 0} knowledge sections are now available.`
        );
      } else {
        alert(result.message);
      }

      await loadResources();

      if (
        action === "archive"
      ) {
        const remainingInTab =
          activeResources.filter(
            (item) =>
              item.type ===
                activeTab &&
              item.key !==
                resource.key
          );

        if (
          remainingInTab.length ===
            0 &&
          activeTab !==
            "Archived"
        ) {
          setSearchQuery("");
        }
      }

      if (
        action === "restore" ||
        action === "delete"
      ) {
        setActiveTab(
          "Archived"
        );
      }
    } catch (error) {
      console.error(
        "Resource action failed:",
        error
      );

      alert(
        "Leo could not complete that action."
      );
    } finally {
      setActionInProgress(null);
    }
  }

  function resetForm() {
    setName("");
    setCategory("");
    setNextReviewDate("");
    setResponsiblePerson("");
    setNotes("");
    setFile(null);
    setShowForm(false);
  }

  const allResources =
    useMemo<DisplayResource[]>(
      () => [
        ...items.map((item) => {
          const knowledgeKey =
            `policy_register:${item.id}`;

          const knowledgeStatus =
            knowledgeStatuses[
              knowledgeKey
            ];

          return {
            key:
              `register-${item.id}`,

            recordId: item.id,

            sourceTable:
              "policy_register" as const,

            name: item.name,

            type:
              item.register_type,

            category:
              item.category,

            reviewDate:
              item.next_review_date,

            responsiblePerson:
              item.responsible_person,

            uploadedDate:
              item.created_at || null,

            notes: item.notes,

            fileName:
              item.file_name,

            filePath:
              item.file_path,

            fileUrl:
              item.file_url,

            isArchived:
              item.is_archived ||
              false,

            archivedAt:
              item.archived_at ||
              null,

            versionNumber:
              item.version_number || 1,

            updatedAt:
              item.updated_at || null,

            knowledgeSectionCount:
              knowledgeStatus
                ?.sectionCount || 0,

            activeKnowledgeSectionCount:
              knowledgeStatus
                ?.activeSectionCount ||
              0,

            lastPreparedAt:
              knowledgeStatus
                ?.lastPreparedAt ||
              null,
          };
        }),

        ...documents.map(
          (document) => {
            const knowledgeKey =
              `company_documents:${document.id}`;

            const knowledgeStatus =
              knowledgeStatuses[
                knowledgeKey
              ];

            return {
              key:
                `document-${document.id}`,

              recordId:
                document.id,

              sourceTable:
                "company_documents" as const,

              name:
                document.name,

              type:
                document.document_type ||
                "Uncategorised",

              category:
                document.category,

              reviewDate: null,

              responsiblePerson:
                document.responsible_person,

              uploadedDate:
                document.created_at,

              notes:
                document.notes,

              fileName:
                document.file_name,

              filePath:
                document.file_path,

              fileUrl:
                document.file_url,

              isArchived:
                document.is_archived ||
                false,

              archivedAt:
                document.archived_at ||
                null,

              versionNumber:
                document.version_number ||
                1,

              updatedAt:
                document.updated_at ||
                null,

              knowledgeSectionCount:
                knowledgeStatus
                  ?.sectionCount || 0,

              activeKnowledgeSectionCount:
                knowledgeStatus
                  ?.activeSectionCount ||
                0,

              lastPreparedAt:
                knowledgeStatus
                  ?.lastPreparedAt ||
                null,
            };
          }
        ),
      ],
      [
        items,
        documents,
        knowledgeStatuses,
      ]
    );

  const activeResources =
    useMemo(
      () =>
        allResources.filter(
          (resource) =>
            !resource.isArchived
        ),
      [allResources]
    );

  const archivedResources =
    useMemo(
      () =>
        allResources.filter(
          (resource) =>
            resource.isArchived
        ),
      [allResources]
    );

  const visibleResources =
    useMemo(() => {
      const normalisedSearch =
        searchQuery
          .trim()
          .toLowerCase();

      const sourceResources =
        activeTab === "Archived"
          ? archivedResources
          : activeResources.filter(
              (resource) =>
                resource.type ===
                activeTab
            );

      if (!normalisedSearch) {
        return sourceResources;
      }

      return sourceResources.filter(
        (resource) => {
          const searchable = [
            resource.name,
            resource.type,
            resource.category,
            resource.fileName,
            resource.responsiblePerson,
            resource.notes,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            normalisedSearch
          );
        }
      );
    }, [
      activeTab,
      activeResources,
      archivedResources,
      searchQuery,
    ]);

  const uncategorisedResources =
    activeResources.filter(
      (resource) =>
        resource.type ===
        "Uncategorised"
    );

  function countResources(
    type: string
  ) {
    return activeResources.filter(
      (resource) =>
        resource.type === type
    ).length;
  }

  const totalResourceCount =
    activeResources.length;

  const readyResourceCount =
    activeResources.filter(
      (resource) =>
        resource.activeKnowledgeSectionCount >
        0
    ).length;

  const reviewSuggestedCount =
    activeResources.filter(
      (resource) =>
        getStatus(
          resource.reviewDate
        ) === "Review suggested"
    ).length;

  if (activeWorkspace === "library") {
    return (
      <ResourcesHome
        organisationResourceCount={totalResourceCount}
        readyForLeoCount={readyResourceCount}
        reviewSuggestedCount={reviewSuggestedCount}
        onOpenOrganisationResources={() =>
          setActiveWorkspace("organisation")
        }
      />
    );
  }

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            HR Resources
          </h1>

          <p style={subtitleStyle}>
            Help Leo understand how
            your organisation operates
            by adding policies,
            contracts, handbooks,
            forms, training materials
            and other HR resources.
          </p>
        </div>

        <div style={headerActionsStyle}>
          <button
            type="button"
            onClick={() =>
              setActiveWorkspace("library")
            }
            style={secondaryButtonStyle}
          >
            Back to library
          </button>

          <button
            onClick={() => {
              if (
                activeTab !==
                  "Uncategorised" &&
                activeTab !==
                  "Archived"
              ) {
                setRegisterType(
                  activeTab
                );
              }

              setShowForm(
                !showForm
              );
            }}
            style={primaryButtonStyle}
          >
            + Add Resources
          </button>
        </div>
      </div>

      <div style={overviewCardStyle}>
        <div style={overviewHeaderStyle}>
          <div>
            <h2
              style={
                overviewTitleStyle
              }
            >
              HR Resources Overview
            </h2>

            <p
              style={
                overviewTextStyle
              }
            >
              Your HR Resources
              help Leo understand how
              your organisation
              operates. Resources
              prepared for Leo can be
              used when answering
              questions and supporting
              workplace Matters.
            </p>
          </div>

          <div style={overviewSummaryStyle}>
            <SummaryItem
              label="Total resources"
              value={
                totalResourceCount
              }
            />

            <SummaryItem
              label="Ready for Leo"
              value={
                readyResourceCount
              }
            />

            <SummaryItem
              label="Reviews suggested"
              value={
                reviewSuggestedCount
              }
            />

            <SummaryItem
              label="Archived"
              value={
                archivedResources.length
              }
            />
          </div>
        </div>

        <div style={overviewGridStyle}>
          <OverviewItem
            label="Policies"
            value={countResources(
              "Policy"
            )}
          />

          <OverviewItem
            label="Risk Assessments"
            value={countResources(
              "Risk Assessment"
            )}
          />

          <OverviewItem
            label="Contracts"
            value={countResources(
              "Contract"
            )}
          />

          <OverviewItem
            label="Handbooks"
            value={countResources(
              "Handbook"
            )}
          />

          <OverviewItem
            label="Forms"
            value={countResources(
              "Form"
            )}
          />

          <OverviewItem
            label="Training"
            value={countResources(
              "Training"
            )}
          />
        </div>
      </div>

      {showForm && (
        <div style={cardStyle}>
          <div style={formHeaderStyle}>
            <div>
              <h2
                style={
                  sectionTitleStyle
                }
              >
                Add Resource
              </h2>

              <p
                style={
                  formDescriptionStyle
                }
              >
                Upload an existing
                organisational resource.
                DOCX files are prepared
                automatically so Leo can
                use their contents.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              style={
                closeButtonStyle
              }
            >
              Close
            </button>
          </div>

          <div style={formGridStyle}>
            <Field label="Type">
              <select
                value={registerType}
                onChange={(event) =>
                  setRegisterType(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                {resourceTypes.map(
                  ([type, label]) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Name">
              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                style={inputStyle}
                placeholder="e.g. Grievance Policy"
              />
            </Field>

            <Field label="Resource">
              <input
                type="file"
                onChange={(event) =>
                  setFile(
                    event.target.files?.[0] ||
                      null
                  )
                }
                style={inputStyle}
                accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv,.ppt,.pptx"
              />
            </Field>

            <Field label="Category">
              <input
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                style={inputStyle}
                placeholder="e.g. Employee Relations"
              />
            </Field>

            <Field label="Next Review Date">
              <input
                type="date"
                value={
                  nextReviewDate
                }
                onChange={(event) =>
                  setNextReviewDate(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Responsible Person">
              <input
                value={
                  responsiblePerson
                }
                onChange={(event) =>
                  setResponsiblePerson(
                    event.target.value
                  )
                }
                style={inputStyle}
                placeholder="e.g. Lindsay Gallagher"
              />
            </Field>

            <Field label="Notes">
              <input
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                style={inputStyle}
                placeholder="Optional notes"
              />
            </Field>
          </div>

          <div style={formActionsStyle}>
            <button
              onClick={uploadItem}
              disabled={uploading}
              style={{
                ...primaryButtonStyle,
                opacity:
                  uploading
                    ? 0.7
                    : 1,
              }}
            >
              {uploading
                ? "Adding resource..."
                : "Add Resource"}
            </button>

            <button
              onClick={resetForm}
              style={
                secondaryButtonStyle
              }
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {versionsResource && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "16px",
            padding: "18px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                {versionsResource.name} versions
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#6B7280",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                The current document remains active.
                Previous versions are preserved here
                for viewing, printing and audit history.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setVersionsResource(null);
                setResourceVersions([]);
              }}
              style={secondaryButtonStyle}
            >
              Close
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                padding: "14px",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                background: "#F7F1FC",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  Version {versionsResource.versionNumber}
                  {" — Current"}
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "12px",
                    color: "#6B7280",
                  }}
                >
                  {versionsResource.fileName ||
                    "Current resource"}
                </div>
              </div>

              {versionsResource.fileUrl && (
                <a
                  href={versionsResource.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={primaryActionStyle}
                >
                  View / Print
                </a>
              )}
            </div>

            {loadingVersions ? (
              <div
                style={{
                  padding: "16px",
                  color: "#6B7280",
                  fontSize: "13px",
                }}
              >
                Loading previous versions...
              </div>
            ) : resourceVersions.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  border: "1px dashed #D1D5DB",
                  borderRadius: "12px",
                  color: "#6B7280",
                  fontSize: "13px",
                }}
              >
                No previous versions have been preserved yet.
              </div>
            ) : (
              resourceVersions.map((version) => (
                <div
                  key={version.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "12px",
                    background: "#FFFFFF",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      Version {version.version_number}
                    </div>

                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        color: "#6B7280",
                      }}
                    >
                      {version.file_name ||
                        "Previous resource"}
                      {" · Replaced "}
                      {formatDateTime(
                        version.replaced_at
                      )}
                    </div>
                  </div>

                  {version.file_url ? (
                    <a
                      href={version.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={secondaryActionStyle}
                    >
                      View / Print
                    </a>
                  ) : (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#9CA3AF",
                      }}
                    >
                      File unavailable
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div style={libraryToolbarStyle}>
        <div style={tabWrapStyle}>
          {resourceTypes.map(
            ([type, label]) => (
              <button
                key={type}
                onClick={() => {
                  setActiveTab(type);
                  setSearchQuery("");
                }}
                style={tabStyle(
                  activeTab === type
                )}
              >
                {label}
              </button>
            )
          )}

          {uncategorisedResources.length >
            0 && (
            <button
              onClick={() => {
                setActiveTab(
                  "Uncategorised"
                );

                setSearchQuery("");
              }}
              style={tabStyle(
                activeTab ===
                  "Uncategorised"
              )}
            >
              Other Resources
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab(
                "Archived"
              );

              setSearchQuery("");
            }}
            style={tabStyle(
              activeTab ===
                "Archived"
            )}
          >
            Archived
            {archivedResources.length >
              0
              ? ` (${archivedResources.length})`
              : ""}
          </button>
        </div>

        <input
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(
              event.target.value
            )
          }
          style={searchInputStyle}
          placeholder="Search resources..."
        />
      </div>

      {loading ? (
        <div style={cardStyle}>
          <div style={emptyStyle}>
            Loading resources...
          </div>
        </div>
      ) : visibleResources.length ===
        0 ? (
        <div style={emptyCardStyle}>
          <h3 style={emptyTitleStyle}>
            {activeTab ===
            "Archived"
              ? "No archived resources"
              : `No ${getResourceLabel(
                  activeTab
                ).toLowerCase()} found`}
          </h3>

          <p style={emptyTextStyle}>
            {activeTab ===
            "Archived"
              ? "Resources you archive will remain preserved here and can be restored later."
              : "Add a resource when convenient, or ask Leo to help create one in a future development phase."}
          </p>
        </div>
      ) : (
        <div style={resourceGridStyle}>
          {visibleResources.map(
            (resource) => (
              <ResourceCard
                key={resource.key}

                resource={resource}

                actionInProgress={
                  actionInProgress
                }

                onPrepare={() =>
                  manageResource(
                    resource,
                    "prepare"
                  )
                }

                onReplace={() =>
                  chooseReplacement(
                    resource
                  )
                }

                onVersions={() =>
                  loadVersions(
                    resource
                  )
                }

                onArchive={() => {
                  const confirmed =
                    window.confirm(
                      `Archive "${resource.name}"?\n\nThe resource, file and knowledge history will be preserved, but Leo will stop using it in active guidance.`
                    );

                  if (confirmed) {
                    manageResource(
                      resource,
                      "archive"
                    );
                  }
                }}

                onRestore={() => {
                  const confirmed =
                    window.confirm(
                      `Restore "${resource.name}"?\n\nThe resource will return to the active library and its preserved knowledge will become available to Leo again.`
                    );

                  if (confirmed) {
                    manageResource(
                      resource,
                      "restore"
                    );
                  }
                }}

                onDelete={() => {
                  const firstConfirmation =
                    window.confirm(
                      `Permanently delete "${resource.name}"?\n\nThis will remove the resource record, stored file and all Leo knowledge created from it. This cannot be undone.`
                    );

                  if (!firstConfirmation) {
                    return;
                  }

                  const typedConfirmation =
                    window.prompt(
                      `Type DELETE to permanently remove "${resource.name}".`
                    );

                  if (
                    typedConfirmation ===
                    "DELETE"
                  ) {
                    manageResource(
                      resource,
                      "delete"
                    );
                  } else if (
                    typedConfirmation !==
                    null
                  ) {
                    alert(
                      "The resource was not deleted because DELETE was not entered exactly."
                    );
                  }
                }}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function ResourcesHome({
  organisationResourceCount,
  readyForLeoCount,
  reviewSuggestedCount,
  onOpenOrganisationResources,
}: {
  organisationResourceCount: number;
  readyForLeoCount: number;
  reviewSuggestedCount: number;
  onOpenOrganisationResources: () => void;
}) {
  const [librarySearch, setLibrarySearch] =
    useState("");

  const categories = [
    {
      title: "Letters",
      description:
        "Professional letters for common employment situations and workplace processes.",
      marker: "L",
      slug: "letters",
    },
    {
      title: "Forms",
      description:
        "Practical forms for recording decisions, meetings, requests and actions.",
      marker: "F",
      slug: "forms",
    },
    {
      title: "Guides",
      description:
        "Clear, practical guidance to help managers handle HR matters confidently.",
      marker: "G",
      slug: "guides",
    },
    {
      title: "Checklists",
      description:
        "Step-by-step checks that help keep important processes complete and consistent.",
      marker: "C",
      slug: "checklists",
    },
    {
      title: "Toolkits",
      description:
        "Connected resource packs for managing more involved workplace situations.",
      marker: "T",
      slug: "toolkits",
    },
    {
      title: "Factsheets",
      description:
        "Concise explanations of key employment rights, duties and good practice.",
      marker: "F",
      slug: "factsheets",
    },
  ];

  const normalisedSearch = librarySearch
    .trim()
    .toLowerCase();

  const visibleCategories = categories.filter(
    (category) =>
      !normalisedSearch ||
      `${category.title} ${category.description}`
        .toLowerCase()
        .includes(normalisedSearch)
  );

  return (
    <div style={resourcesHomeStyle}>
      <section style={resourcesHeroStyle}>
        <div style={resourcesHeroCopyStyle}>
          <div style={resourcesEyebrowStyle}>
            HR Resources
          </div>

          <h1 style={resourcesHeroTitleStyle}>
            Practical HR support, ready when you need it.
          </h1>

          <p style={resourcesHeroTextStyle}>
            Browse LEO&apos;s professional resource library or open your organisation&apos;s own policies, contracts, handbooks and documents.
          </p>

          <div style={resourcesSearchWrapStyle}>
            <input
              value={librarySearch}
              onChange={(event) =>
                setLibrarySearch(event.target.value)
              }
              style={resourcesSearchStyle}
              placeholder="Search letters, forms, guides, checklists and more..."
              aria-label="Search HR Resources"
            />
          </div>
        </div>

        <div style={resourcesHeroPanelStyle}>
          <div style={resourcesHeroPanelLabelStyle}>
            Your organisation
          </div>

          <div style={resourcesHeroMetricStyle}>
            {organisationResourceCount}
          </div>

          <div style={resourcesHeroMetricLabelStyle}>
            organisation resources
          </div>

          {(readyForLeoCount > 0 || reviewSuggestedCount > 0) && (
            <div style={resourcesHeroSmallStatsStyle}>
              {readyForLeoCount > 0 && (
                <span>{readyForLeoCount} ready for Leo</span>
              )}
              {reviewSuggestedCount > 0 && (
                <span>{reviewSuggestedCount} reviews suggested</span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onOpenOrganisationResources}
            style={resourcesHeroButtonStyle}
          >
            Open organisation resources
          </button>
        </div>
      </section>

      <section style={resourcesSectionStyle}>
        <div style={resourcesSectionHeadingStyle}>
          <h2 style={resourcesSectionTitleStyle}>
            Browse the library
          </h2>
        </div>

        {visibleCategories.length === 0 ? (
          <div style={resourcesNoResultsStyle}>
            No resource categories match your search yet.
          </div>
        ) : (
          <div style={resourcesCategoryGridStyle}>
            {visibleCategories.map((category) => (
              <button
                key={category.title}
                type="button"
                onClick={() => {
                  window.location.href = `/dashboard/policies/${category.slug}`;
                }}
                style={resourcesCategoryCardStyle}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = "translateY(-3px)";
                  event.currentTarget.style.boxShadow =
                    "0 12px 30px rgba(71, 49, 82, 0.10)";
                  event.currentTarget.style.borderColor = "#CDB2E2";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "translateY(0)";
                  event.currentTarget.style.boxShadow = "none";
                  event.currentTarget.style.borderColor = "#E8DFEB";
                }}
              >
                <div style={resourcesCategoryTopRowStyle}>
                  <div style={resourcesCategoryMarkerStyle}>
                    {category.marker}
                  </div>
                  <span style={resourcesCategoryChevronStyle}>→</span>
                </div>

                <div>
                  <h3 style={resourcesCategoryTitleStyle}>
                    {category.title}
                  </h3>
                  <p style={resourcesCategoryTextStyle}>
                    {category.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section style={resourcesBottomGridStyle}>
        <article style={resourcesFeatureCardStyle}>
          <div style={resourcesFeatureEyebrowStyle}>
            Organisation resources
          </div>
          <h2 style={resourcesFeatureTitleStyle}>
            Your own HR documents, preserved and connected to Leo.
          </h2>
          <p style={resourcesFeatureTextStyle}>
            Upload and manage policies, contracts, handbooks, procedures, forms and other company documents. Version history, review dates and knowledge preparation remain exactly where you need them.
          </p>
          <button
            type="button"
            onClick={onOpenOrganisationResources}
            style={primaryButtonStyle}
          >
            Manage organisation resources
          </button>
        </article>

        <article style={resourcesAskLeoCardStyle}>
          <div style={resourcesFeatureEyebrowStyle}>
            Ask Leo
          </div>
          <h2 style={resourcesFeatureTitleStyle}>
            Turn guidance into action.
          </h2>
          <p style={resourcesFeatureTextStyle}>
            Each published resource can connect to Ask Leo so the guidance can be applied to the organisation and situation in front of you.
          </p>
          <a
            href="/dashboard/ask-leo"
            style={resourcesSecondaryLinkStyle}
          >
            Open Ask Leo
          </a>
        </article>
      </section>

      <section style={resourcesCurrentCardStyle}>
        <div style={resourcesCurrentIconStyle}>↻</div>
        <div>
          <div style={resourcesFeatureEyebrowStyle}>
            Keeping resources current
          </div>
          <h2 style={resourcesCurrentTitleStyle}>
            Professionally maintained as guidance changes.
          </h2>
          <p style={resourcesCurrentTextStyle}>
            LEO Resources are reviewed against employment legislation, official guidance and recognised HR practice. Published resources can carry a version number, last reviewed date, next review date, review status, change summary, categories, tags and related resources.
          </p>
        </div>
      </section>
    </div>
  );
}

function ResourceCard({
  resource,
  actionInProgress,
  onPrepare,
  onReplace,
  onVersions,
  onArchive,
  onRestore,
  onDelete,
}: {
  resource: DisplayResource;

  actionInProgress:
    | string
    | null;

  onPrepare: () => void;
  onReplace: () => void;
  onVersions: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const knowledgeReady =
    resource.activeKnowledgeSectionCount >
    0;

  const hasPreservedKnowledge =
    resource.knowledgeSectionCount >
    0;

  const canPrepare =
    !resource.isArchived &&
    !knowledgeReady &&
    Boolean(
      resource.fileName
        ?.toLowerCase()
        .endsWith(".docx")
    ) &&
    Boolean(resource.fileUrl);

  const reviewStatus =
    getStatus(
      resource.reviewDate
    );

  const askLeoPrompt =
    `Please help me understand and apply our ${resource.name}.`;

  const prepareLoading =
    actionInProgress ===
    `${resource.key}:prepare`;

  const replaceLoading =
    actionInProgress ===
    `${resource.key}:replace`;

  const archiveLoading =
    actionInProgress ===
    `${resource.key}:archive`;

  const restoreLoading =
    actionInProgress ===
    `${resource.key}:restore`;

  const deleteLoading =
    actionInProgress ===
    `${resource.key}:delete`;

  const anyActionLoading =
    prepareLoading ||
    replaceLoading ||
    archiveLoading ||
    restoreLoading ||
    deleteLoading;

  return (
    <article style={resourceCardStyle}>
      <div style={resourceCardHeaderStyle}>
        <div>
          <div style={resourceTypeStyle}>
            {getSingularResourceLabel(
              resource.type
            )}
          </div>

          <h3 style={resourceNameStyle}>
            {resource.name}
          </h3>

          <div style={resourceMetaStyle}>
            {resource.category ||
              resource.fileName ||
              "Organisational resource"}
          </div>

          <div style={versionTextStyle}>
            Version {resource.versionNumber}
          </div>
        </div>

        <span
          style={
            resource.isArchived
              ? archivedBadgeStyle
              : knowledgeReady
                ? readyBadgeStyle
                : storedBadgeStyle
          }
        >
          {resource.isArchived
            ? "Archived"
            : knowledgeReady
              ? "Ready for Leo"
              : "Stored"}
        </span>
      </div>

      <div style={resourceDetailsGridStyle}>
        <ResourceDetail
          label="Knowledge"
          value={
            resource.isArchived &&
            hasPreservedKnowledge
              ? `${resource.knowledgeSectionCount} sections preserved`
              : knowledgeReady
                ? `${resource.activeKnowledgeSectionCount} sections available`
                : canPrepare
                  ? "Preparation available"
                  : "File safely stored"
          }
        />

        <ResourceDetail
          label={
            resource.isArchived
              ? "Archived"
              : "Review"
          }
          value={
            resource.isArchived
              ? resource.archivedAt
                ? formatDateTime(
                    resource.archivedAt
                  )
                : "Preserved"
              : reviewStatus
          }
        />

        <ResourceDetail
          label="Responsible person"
          value={
            resource.responsiblePerson ||
            "Not assigned"
          }
        />

        <ResourceDetail
          label="Last prepared"
          value={
            resource.lastPreparedAt
              ? formatDateTime(
                  resource.lastPreparedAt
                )
              : "Not yet prepared"
          }
        />
      </div>

      {resource.notes && (
        <div style={notesStyle}>
          {resource.notes}
        </div>
      )}

      <div style={resourceActionsStyle}>
        {resource.fileUrl && (
          <a
            href={resource.fileUrl}
            target="_blank"
            rel="noreferrer"
            style={primaryActionStyle}
          >
            View
          </a>
        )}

        {!resource.isArchived &&
          canPrepare && (
            <button
              type="button"
              disabled={
                anyActionLoading
              }
              style={{
                ...secondaryActionStyle,

                opacity:
                  anyActionLoading
                    ? 0.65
                    : 1,
              }}
              onClick={onPrepare}
            >
              {prepareLoading
                ? "Preparing..."
                : "Prepare for Leo"}
            </button>
          )}

        {!resource.isArchived &&
          knowledgeReady && (
            <a
              href={`/dashboard/ask-leo?prompt=${encodeURIComponent(
                askLeoPrompt
              )}`}
              style={secondaryActionStyle}
            >
              Ask Leo
            </a>
          )}

        {!resource.isArchived && (
          <>
            <button
              type="button"
              style={secondaryActionStyle}
              onClick={() => {
                alert(
                  "Leo Review will be connected during Phase 3. The resource and its knowledge are already preserved."
                );
              }}
            >
              Review
            </button>

            <button
              type="button"
              disabled={anyActionLoading}
              style={{
                ...secondaryActionStyle,

                opacity:
                  anyActionLoading
                    ? 0.65
                    : 1,
              }}
              onClick={onReplace}
            >
              {replaceLoading
                ? "Replacing..."
                : "Replace"}
            </button>

            <button
              type="button"
              disabled={anyActionLoading}
              style={{
                ...secondaryActionStyle,

                opacity:
                  anyActionLoading
                    ? 0.65
                    : 1,
              }}
              onClick={onVersions}
            >
              Versions
            </button>

            <button
              type="button"
              disabled={
                anyActionLoading
              }
              style={{
                ...quietActionStyle,

                opacity:
                  anyActionLoading
                    ? 0.65
                    : 1,
              }}
              onClick={onArchive}
            >
              {archiveLoading
                ? "Archiving..."
                : "Archive"}
            </button>
          </>
        )}

        {resource.isArchived && (
          <>
            <button
              type="button"
              disabled={anyActionLoading}
              style={{
                ...secondaryActionStyle,

                opacity:
                  anyActionLoading
                    ? 0.65
                    : 1,
              }}
              onClick={onVersions}
            >
              Versions
            </button>

            <button
              type="button"
              disabled={
                anyActionLoading
              }
              style={{
                ...secondaryActionStyle,

                opacity:
                  anyActionLoading
                    ? 0.65
                    : 1,
              }}
              onClick={onRestore}
            >
              {restoreLoading
                ? "Restoring..."
                : "Restore"}
            </button>

            <button
              type="button"
              disabled={
                anyActionLoading
              }
              style={{
                ...deleteActionStyle,

                opacity:
                  anyActionLoading
                    ? 0.65
                    : 1,
              }}
              onClick={onDelete}
            >
              {deleteLoading
                ? "Deleting..."
                : "Delete permanently"}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function ResourceDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={resourceDetailStyle}>
      <div
        style={
          resourceDetailLabelStyle
        }
      >
        {label}
      </div>

      <div
        style={
          resourceDetailValueStyle
        }
      >
        {value}
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={summaryItemStyle}>
      <div style={summaryValueStyle}>
        {value}
      </div>

      <div style={summaryLabelStyle}>
        {label}
      </div>
    </div>
  );
}

function OverviewItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={overviewItemStyle}>
      <div
        style={
          overviewItemLabelStyle
        }
      >
        {label}
      </div>

      <div
        style={
          overviewItemValueStyle
        }
      >
        {value}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      {children}
    </div>
  );
}

function buildDocumentId(
  resource: DisplayResource
) {
  if (
    resource.sourceTable ===
    "policy_register"
  ) {
    return `policy-register-${resource.recordId}`;
  }

  return `company-document-${resource.recordId}`;
}

function getResourceLabel(
  type: string
) {
  if (type === "Uncategorised") {
    return "Other resources";
  }

  const match =
    resourceTypes.find(
      ([resourceType]) =>
        resourceType === type
    );

  return match
    ? match[1]
    : type;
}

function getSingularResourceLabel(
  type: string
) {
  if (type === "Uncategorised") {
    return "Resource";
  }

  return type;
}

function getStatus(
  dateString: string | null
) {
  if (!dateString) {
    return "Review available";
  }

  const today = new Date();

  const reviewDate =
    new Date(dateString);

  today.setHours(0, 0, 0, 0);

  reviewDate.setHours(
    0,
    0,
    0,
    0
  );

  const differenceInDays =
    Math.ceil(
      (reviewDate.getTime() -
        today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

  if (differenceInDays < 0) {
    return "Review suggested";
  }

  if (differenceInDays <= 30) {
    return "Review approaching";
  }

  return "In place";
}

function formatDateTime(
  dateString: string | null
) {
  if (!dateString) {
    return "—";
  }

  return new Date(
    dateString
  ).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const headerStyle:
  React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "20px",
};

const titleStyle:
  React.CSSProperties = {
  fontSize: "30px",
  fontWeight: 800,
  margin: 0,
  color: "#111827",
};

const subtitleStyle:
  React.CSSProperties = {
  color: "#6B7280",
  fontSize: "14px",
  marginTop: "6px",
  maxWidth: "760px",
  lineHeight: 1.6,
};

const overviewCardStyle:
  React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "16px",
  padding: "22px",
  marginBottom: "20px",
};

const overviewHeaderStyle:
  React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "24px",
  flexWrap: "wrap",
};

const overviewTitleStyle:
  React.CSSProperties = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 800,
  color: "#111827",
};

const overviewTextStyle:
  React.CSSProperties = {
  marginTop: "8px",
  color: "#6B7280",
  lineHeight: 1.6,
  maxWidth: "700px",
};

const overviewSummaryStyle:
  React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const summaryItemStyle:
  React.CSSProperties = {
  minWidth: "110px",
  padding: "12px 14px",
  borderRadius: "12px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
};

const summaryValueStyle:
  React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 800,
  color: "#111827",
};

const summaryLabelStyle:
  React.CSSProperties = {
  marginTop: "3px",
  fontSize: "12px",
  color: "#6B7280",
};

const overviewGridStyle:
  React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "12px",
  marginTop: "20px",
};

const overviewItemStyle:
  React.CSSProperties = {
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  padding: "14px",
};

const overviewItemLabelStyle:
  React.CSSProperties = {
  fontSize: "13px",
  color: "#6B7280",
  marginBottom: "6px",
};

const overviewItemValueStyle:
  React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 800,
  color: "#111827",
};

const cardStyle:
  React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "16px",
  padding: "18px",
  marginBottom: "18px",
};

const formHeaderStyle:
  React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
};

const sectionTitleStyle:
  React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 800,
  margin: 0,
  color: "#111827",
};

const formDescriptionStyle:
  React.CSSProperties = {
  marginTop: "6px",
  marginBottom: 0,
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.5,
};

const closeButtonStyle:
  React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#6B7280",
  cursor: "pointer",
  fontWeight: 700,
};

const formGridStyle:
  React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginTop: "16px",
};

const formActionsStyle:
  React.CSSProperties = {
  display: "flex",
  gap: "10px",
  marginTop: "16px",
};

const labelStyle:
  React.CSSProperties = {
  fontSize: "13px",
  color: "#374151",
  fontWeight: 600,
};

const inputStyle:
  React.CSSProperties = {
  width: "100%",
  padding: "10px",
  marginTop: "6px",
  borderRadius: "10px",
  border: "1px solid #E5E7EB",
  boxSizing: "border-box",
};

const primaryButtonStyle:
  React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle:
  React.CSSProperties = {
  background: "#FFFFFF",
  color: "#374151",
  border: "1px solid #E5E7EB",
  padding: "10px 14px",
  borderRadius: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

const libraryToolbarStyle:
  React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const tabWrapStyle:
  React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

function tabStyle(
  active: boolean
): React.CSSProperties {
  return {
    background: active
      ? "#F7F1FC"
      : "#FFFFFF",

    color: active
      ? "#6E5084"
      : "#374151",

    border:
      "1px solid #E5E7EB",

    borderRadius: "999px",
    padding: "8px 12px",
    fontWeight: 700,
    cursor: "pointer",
  };
}

const searchInputStyle:
  React.CSSProperties = {
  minWidth: "250px",
  padding: "9px 12px",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  background: "#FFFFFF",
  color: "#111827",
};

const resourceGridStyle:
  React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(340px, 1fr))",
  gap: "16px",
};

const resourceCardStyle:
  React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "16px",
  padding: "18px",
};

const resourceCardHeaderStyle:
  React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
  marginBottom: "16px",
};

const resourceTypeStyle:
  React.CSSProperties = {
  color: "#6E5084",
  fontSize: "11px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "5px",
};

const resourceNameStyle:
  React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 800,
  color: "#111827",
};

const resourceMetaStyle:
  React.CSSProperties = {
  marginTop: "5px",
  fontSize: "13px",
  color: "#6B7280",
};

const versionTextStyle:
  React.CSSProperties = {
  marginTop: "5px",
  fontSize: "12px",
  color: "#6E5084",
  fontWeight: 700,
};

const readyBadgeStyle:
  React.CSSProperties = {
  display: "inline-block",
  padding: "5px 9px",
  borderRadius: "999px",
  background: "#F7F1FC",
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const storedBadgeStyle:
  React.CSSProperties = {
  display: "inline-block",
  padding: "5px 9px",
  borderRadius: "999px",
  background: "#F9FAFB",
  color: "#6B7280",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
  border: "1px solid #E5E7EB",
};

const archivedBadgeStyle:
  React.CSSProperties = {
  display: "inline-block",
  padding: "5px 9px",
  borderRadius: "999px",
  background: "#F3F4F6",
  color: "#4B5563",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
  border: "1px solid #E5E7EB",
};

const resourceDetailsGridStyle:
  React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "10px",
  marginBottom: "16px",
};

const resourceDetailStyle:
  React.CSSProperties = {
  background: "#F9FAFB",
  border: "1px solid #F3F4F6",
  borderRadius: "12px",
  padding: "11px",
};

const resourceDetailLabelStyle:
  React.CSSProperties = {
  fontSize: "12px",
  color: "#6B7280",
  marginBottom: "5px",
};

const resourceDetailValueStyle:
  React.CSSProperties = {
  fontSize: "13px",
  color: "#111827",
  fontWeight: 700,
  lineHeight: 1.4,
};

const notesStyle:
  React.CSSProperties = {
  padding: "11px 12px",
  marginBottom: "16px",
  background: "#FCFCFD",
  borderRadius: "10px",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.5,
};

const resourceActionsStyle:
  React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const primaryActionStyle:
  React.CSSProperties = {
  display: "inline-block",
  background: "#6E5084",
  color: "#FFFFFF",
  border: "1px solid #6E5084",
  borderRadius: "8px",
  padding: "7px 10px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 700,
  textDecoration: "none",
};

const secondaryActionStyle:
  React.CSSProperties = {
  display: "inline-block",
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  padding: "7px 10px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 700,
  textDecoration: "none",
};

const quietActionStyle:
  React.CSSProperties = {
  display: "inline-block",
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  padding: "7px 10px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 700,
};

const deleteActionStyle:
  React.CSSProperties = {
  display: "inline-block",
  background: "#FFFFFF",
  color: "#7F1D1D",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  padding: "7px 10px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 700,
};

const emptyCardStyle:
  React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "16px",
  padding: "28px",
  textAlign: "center",
};

const emptyTitleStyle:
  React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "17px",
};

const emptyTextStyle:
  React.CSSProperties = {
  marginTop: "7px",
  marginBottom: 0,
  color: "#6B7280",
  fontSize: "13px",
};

const emptyStyle:
  React.CSSProperties = {
  color: "#6B7280",
};

const resourcesHomeStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
};

const resourcesHeroStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.45fr) minmax(300px, 0.55fr)",
  gap: "20px",
  marginBottom: "22px",
};

const resourcesHeroCopyStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #F7F1FC 0%, #FFFFFF 68%)",
  border: "1px solid #E4D8EA",
  borderRadius: "22px",
  padding: "34px",
};

const resourcesEyebrowStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: "10px",
};

const resourcesHeroTitleStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: "760px",
  color: "#6E5084",
  fontSize: "clamp(30px, 4vw, 48px)",
  lineHeight: 1.12,
  letterSpacing: "-0.025em",
  fontWeight: 600,
};

const resourcesHeroTextStyle: React.CSSProperties = {
  maxWidth: "760px",
  margin: "16px 0 0",
  color: "#6D6371",
  fontSize: "16px",
  lineHeight: 1.65,
};

const resourcesSearchWrapStyle: React.CSSProperties = {
  marginTop: "24px",
};

const resourcesSearchStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "52px",
  boxSizing: "border-box",
  border: "1px solid #D8CBDE",
  borderRadius: "14px",
  background: "#FFFFFF",
  padding: "0 16px",
  color: "#2F2635",
  fontSize: "15px",
  boxShadow: "0 8px 24px rgba(70, 51, 79, 0.05)",
};

const resourcesHeroPanelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  borderRadius: "22px",
  padding: "28px",
  background: "#6E5084",
  color: "#FFFFFF",
};

const resourcesHeroPanelLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  opacity: 0.8,
};

const resourcesHeroMetricStyle: React.CSSProperties = {
  marginTop: "14px",
  fontSize: "52px",
  lineHeight: 1,
  fontWeight: 850,
};

const resourcesHeroMetricLabelStyle: React.CSSProperties = {
  marginTop: "6px",
  fontSize: "14px",
  fontWeight: 700,
};

const resourcesHeroSmallStatsStyle: React.CSSProperties = {
  display: "grid",
  gap: "7px",
  marginTop: "18px",
  paddingTop: "18px",
  borderTop: "1px solid rgba(255,255,255,0.22)",
  fontSize: "13px",
  opacity: 0.9,
};

const resourcesHeroButtonStyle: React.CSSProperties = {
  minHeight: "44px",
  marginTop: "22px",
  border: "1px solid rgba(255,255,255,0.35)",
  borderRadius: "12px",
  background: "#FFFFFF",
  color: "#6E5084",
  fontWeight: 800,
  cursor: "pointer",
};

const resourcesSectionStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5DCE8",
  borderRadius: "20px",
  padding: "24px",
  marginBottom: "20px",
};

const resourcesSectionHeadingStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "18px",
};

const resourcesSectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#6E5084",
  fontSize: "24px",
  fontWeight: 600,
};

const resourcesSectionTextStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#746A78",
  lineHeight: 1.55,
};

const resourcesCategoryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "14px",
};

const resourcesCategoryCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  minHeight: "190px",
  border: "1px solid #E8DFEB",
  borderRadius: "17px",
  background: "#FCFAFD",
  padding: "20px",
  textAlign: "left",
  cursor: "pointer",
  transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
  font: "inherit",
};

const resourcesCategoryMarkerStyle: React.CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#F0E7F5",
  color: "#6E5084",
  fontWeight: 850,
  fontSize: "16px",
};

const resourcesCategoryTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#6E5084",
  fontSize: "18px",
  fontWeight: 600,
};

const resourcesCategoryTextStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#746A78",
  fontSize: "14px",
  lineHeight: 1.55,
};

const resourcesNoResultsStyle: React.CSSProperties = {
  padding: "30px",
  border: "1px dashed #D8CBDE",
  borderRadius: "16px",
  textAlign: "center",
  color: "#746A78",
};

const resourcesBottomGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "18px",
};

const resourcesFeatureCardStyle: React.CSSProperties = {
  border: "1px solid #E5DCE8",
  borderRadius: "20px",
  background: "#FFFFFF",
  padding: "24px",
};

const resourcesAskLeoCardStyle: React.CSSProperties = {
  border: "1px solid #DCEBE4",
  borderRadius: "20px",
  background: "#F5FFF9",
  padding: "24px",
};

const resourcesFeatureEyebrowStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
};

const resourcesFeatureTitleStyle: React.CSSProperties = {
  margin: "9px 0 0",
  color: "#6E5084",
  fontSize: "22px",
  lineHeight: 1.3,
  fontWeight: 600,
};

const resourcesFeatureTextStyle: React.CSSProperties = {
  margin: "12px 0 20px",
  color: "#746A78",
  fontSize: "14px",
  lineHeight: 1.6,
};

const resourcesSecondaryLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "42px",
  padding: "0 14px",
  border: "1px solid #CDB2E2",
  borderRadius: "11px",
  background: "#FFFFFF",
  color: "#6E5084",
  textDecoration: "none",
  fontWeight: 800,
};

const resourcesCategoryTopRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const resourcesCategoryChevronStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "22px",
  fontWeight: 500,
};

const resourcesBackButtonStyle: React.CSSProperties = {
  marginBottom: "16px",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#6E5084",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const resourcesCategoryPageStyle: React.CSSProperties = {
  border: "1px solid #E5DCE8",
  borderRadius: "22px",
  background: "#FFFFFF",
  padding: "30px",
};

const resourcesCategoryPageHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "18px",
};

const resourcesCategoryMarkerLargeStyle: React.CSSProperties = {
  width: "58px",
  height: "58px",
  flex: "0 0 58px",
  borderRadius: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#F0E7F5",
  color: "#6E5084",
  fontSize: "20px",
  fontWeight: 700,
};

const resourcesCategoryPageTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#6E5084",
  fontSize: "34px",
  lineHeight: 1.15,
  fontWeight: 600,
};

const resourcesCategoryPageTextStyle: React.CSSProperties = {
  maxWidth: "720px",
  margin: "10px 0 0",
  color: "#746A78",
  fontSize: "15px",
  lineHeight: 1.6,
};

const resourcesEmptyLibraryStyle: React.CSSProperties = {
  marginTop: "28px",
  padding: "28px",
  border: "1px dashed #D8CBDE",
  borderRadius: "16px",
  background: "#FCFAFD",
};

const resourcesEmptyLibraryTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#6E5084",
  fontSize: "18px",
  fontWeight: 600,
};

const resourcesEmptyLibraryTextStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#746A78",
  fontSize: "14px",
  lineHeight: 1.6,
};

const resourcesCurrentCardStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "52px minmax(0, 1fr)",
  gap: "18px",
  marginTop: "18px",
  border: "1px solid #E4D8EA",
  borderRadius: "20px",
  background: "linear-gradient(135deg, #F7F1FC 0%, #FFFFFF 72%)",
  padding: "24px",
};

const resourcesCurrentIconStyle: React.CSSProperties = {
  width: "52px",
  height: "52px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#FFFFFF",
  border: "1px solid #E4D8EA",
  color: "#6E5084",
  fontSize: "24px",
};

const resourcesCurrentTitleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#6E5084",
  fontSize: "22px",
  lineHeight: 1.3,
  fontWeight: 600,
};

const resourcesCurrentTextStyle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#746A78",
  fontSize: "14px",
  lineHeight: 1.65,
};

const resourcesCurrentNoteStyle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#6E5084",
  fontSize: "13px",
  lineHeight: 1.55,
};

const headerActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};