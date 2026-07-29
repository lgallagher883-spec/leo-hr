"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

export type CompanyDocumentFolder =
  | "Policy"
  | "Procedure"
  | "Employee Handbook"
  | "Contract"
  | "Offer Letter"
  | "Company Form"
  | "Risk Assessment"
  | "Health & Safety"
  | "Template"
  | "Other Document";

type CompanyDocument = {
  id: number | string;
  name: string;
  notes: string | null;
  document_type: CompanyDocumentFolder | string | null;
  file_name: string | null;
  file_path: string | null;
  file_url: string | null;
  created_at: string | null;
  updated_at?: string | null;
  status?: string | null;
  archived_at?: string | null;
  document_group_id?: string | null;
  version_number?: number | null;
  previous_version_id?: number | string | null;
  replaced_by_id?: number | string | null;
};

type UploadItem = {
  id: string;
  file: File;
  name: string;
};

type DialogState =
  | { type: "rename"; document: CompanyDocument }
  | { type: "edit"; document: CompanyDocument }
  | { type: "replace"; document: CompanyDocument }
  | { type: "move"; document: CompanyDocument }
  | { type: "versions"; document: CompanyDocument }
  | { type: "archive"; document: CompanyDocument }
  | { type: "delete"; document: CompanyDocument }
  | null;

type Notice =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

type CompanyDocumentsLibraryProps = {
  folder: CompanyDocumentFolder;
  title: string;
  singularLabel: string;
  pluralLabel: string;
  description: string;
  iconLetter?: string;
};

const COMPANY_DOCUMENT_FOLDERS: CompanyDocumentFolder[] = [
  "Policy",
  "Procedure",
  "Employee Handbook",
  "Contract",
  "Offer Letter",
  "Company Form",
  "Risk Assessment",
  "Health & Safety",
  "Template",
  "Other Document",
];

function formatDate(value: string | null | undefined) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getExtension(fileName: string | null | undefined) {
  if (!fileName?.includes(".")) return "";
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isSupportedFile(file: File) {
  return ["doc", "docx", "pdf"].includes(getExtension(file.name));
}

function isWord(fileName: string | null) {
  return ["doc", "docx"].includes(getExtension(fileName));
}

function isPdf(fileName: string | null) {
  return getExtension(fileName) === "pdf";
}

function fileNameWithoutExtension(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
}

function routeForFolder(folder: CompanyDocumentFolder) {
  const routes: Record<CompanyDocumentFolder, string> = {
    Policy: "policies",
    Procedure: "procedures",
    "Employee Handbook": "employee-handbook",
    Contract: "contracts",
    "Offer Letter": "offer-letters",
    "Company Form": "company-forms",
    "Risk Assessment": "risk-assessments",
    "Health & Safety": "health-and-safety",
    Template: "templates",
    "Other Document": "other-documents",
  };

  return `/dashboard/organisation/company-documents/${routes[folder]}`;
}

function getAskLeoHref(document: CompanyDocument, returnUrl: string) {
  const prompt = [
    `Please review our organisation document "${document.name}".`,
    document.notes ? `Organisation notes: ${document.notes}` : "",
    "Check whether it appears current, clear and consistent with current employment law and recognised HR practice in England and Wales.",
    "Identify outdated wording, legal developments, missing safeguards and any areas requiring attention.",
    "Do not replace, overwrite or amend the organisation's document automatically. Explain the recommended changes first.",
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    `/dashboard/ask-leo?prompt=${encodeURIComponent(prompt)}` +
    `&resourceTitle=${encodeURIComponent(document.name)}` +
    `&resourceType=${encodeURIComponent("Company document")}` +
    `&returnUrl=${encodeURIComponent(returnUrl)}`
  );
}

export default function CompanyDocumentsLibrary({
  folder,
  title,
  singularLabel,
  pluralLabel,
  description,
  iconLetter = title.charAt(0).toUpperCase(),
}: CompanyDocumentsLibraryProps) {
  const supabase = useMemo(() => createClient(), []);
  const db = supabase as any;

  const menuRef = useRef<HTMLDivElement | null>(null);

  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [versions, setVersions] = useState<CompanyDocument[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [uploadNotes, setUploadNotes] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const [dialogName, setDialogName] = useState("");
  const [dialogNotes, setDialogNotes] = useState("");
  const [dialogFolder, setDialogFolder] =
    useState<CompanyDocumentFolder>(folder);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);

  const returnUrl = routeForFolder(folder);

  useEffect(() => {
    void loadDocuments();
  }, [folder]);

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  async function loadDocuments() {
    setLoading(true);

    const { data, error } = await db
      .from("company_documents")
      .select(
        "id, name, notes, document_type, file_name, file_path, file_url, created_at, updated_at, status, archived_at, document_group_id, version_number, previous_version_id, replaced_by_id",
      )
      .eq("document_type", folder)
      .or("status.is.null,status.eq.active")
      .order("name", { ascending: true });

    if (error) {
      console.error("Company documents could not be loaded:", error);
      setDocuments([]);
      setNotice({
        type: "error",
        message:
          "Company documents could not be loaded. Run the Company Documents migration if this is the first time you are using the new library.",
      });
    } else {
      setDocuments((data ?? []) as CompanyDocument[]);
    }

    setLoading(false);
  }

  function resetUpload() {
    setUploadItems([]);
    setUploadNotes("");
    setShowUpload(false);
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const supported = selectedFiles.filter(isSupportedFile);
    const rejected = selectedFiles.length - supported.length;

    const items = supported.map((file, index) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
      file,
      name: fileNameWithoutExtension(file.name),
    }));

    setUploadItems(items);

    if (rejected > 0) {
      setNotice({
        type: "error",
        message: `${rejected} unsupported file${
          rejected === 1 ? " was" : "s were"
        } skipped. Only DOC, DOCX and PDF files are accepted.`,
      });
    } else {
      setNotice(null);
    }
  }

  function updateUploadName(id: string, name: string) {
    setUploadItems((current) =>
      current.map((item) => (item.id === id ? { ...item, name } : item)),
    );
  }

  function removeUploadItem(id: string) {
    setUploadItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (uploadItems.length === 0) {
      setNotice({
        type: "error",
        message: "Choose at least one Word or PDF document.",
      });
      return;
    }

    if (uploadItems.some((item) => !item.name.trim())) {
      setNotice({
        type: "error",
        message: "Every document needs a name.",
      });
      return;
    }

    setWorking(true);
    setNotice(null);

    let successful = 0;
    const failures: string[] = [];

    for (const item of uploadItems) {
      const path = `${folder
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(
        item.file.name,
      )}`;

      const uploadResult = await supabase.storage
        .from("company-documents")
        .upload(path, item.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadResult.error) {
        failures.push(item.file.name);
        continue;
      }

      const publicUrl = supabase.storage
        .from("company-documents")
        .getPublicUrl(path).data.publicUrl;

      const { error: insertError } = await db.from("company_documents").insert({
        name: item.name.trim(),
        notes: uploadNotes.trim() || null,
        document_type: folder,
        file_name: item.file.name,
        file_path: path,
        file_url: publicUrl,
        status: "active",
        version_number: 1,
      });

      if (insertError) {
        await supabase.storage.from("company-documents").remove([path]);
        failures.push(item.file.name);
      } else {
        successful += 1;
      }
    }

    setWorking(false);

    if (successful > 0) {
      resetUpload();
      await loadDocuments();
    }

    if (failures.length === 0) {
      setNotice({
        type: "success",
        message: `${successful} ${successful === 1 ? singularLabel : pluralLabel} uploaded successfully.`,
      });
    } else {
      setNotice({
        type: successful > 0 ? "success" : "error",
        message: `${successful} uploaded successfully. ${failures.length} failed: ${failures.join(
          ", ",
        )}.`,
      });
    }
  }

  function openDialog(nextDialog: NonNullable<DialogState>) {
    setOpenMenuId(null);
    setDialog(nextDialog);
    setDialogName(nextDialog.document.name);
    setDialogNotes(nextDialog.document.notes ?? "");
    setDialogFolder(
      (nextDialog.document.document_type as CompanyDocumentFolder) ?? folder,
    );
    setReplacementFile(null);

    if (nextDialog.type === "versions") {
      void loadVersionHistory(nextDialog.document);
    }
  }

  function closeDialog() {
    if (working) return;
    setDialog(null);
    setVersions([]);
    setReplacementFile(null);
  }

  async function updateDocument(
    document: CompanyDocument,
    changes: Record<string, unknown>,
    successMessage: string,
  ) {
    setWorking(true);

    const { error } = await db
      .from("company_documents")
      .update({
        ...changes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.id);

    setWorking(false);

    if (error) {
      console.error("Company document update failed:", error);
      setNotice({
        type: "error",
        message: "The document could not be updated.",
      });
      return;
    }

    closeDialog();
    setNotice({ type: "success", message: successMessage });
    await loadDocuments();
  }

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog || dialog.type !== "rename") return;

    const name = dialogName.trim();
    if (!name) return;

    await updateDocument(dialog.document, { name }, "Document renamed.");
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog || dialog.type !== "edit") return;

    const name = dialogName.trim();
    if (!name) return;

    await updateDocument(
      dialog.document,
      {
        name,
        notes: dialogNotes.trim() || null,
      },
      "Document details updated.",
    );
  }

  async function handleMove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog || dialog.type !== "move") return;

    await updateDocument(
      dialog.document,
      { document_type: dialogFolder },
      `Document moved to ${dialogFolder}.`,
    );
  }

  async function handleArchive() {
    if (!dialog || dialog.type !== "archive") return;

    await updateDocument(
      dialog.document,
      {
        status: "archived",
        archived_at: new Date().toISOString(),
      },
      "Document moved to the archive.",
    );
  }

  async function handleDelete() {
    if (!dialog || dialog.type !== "delete") return;

    setWorking(true);

    if (dialog.document.file_path) {
      const { error: storageError } = await supabase.storage
        .from("company-documents")
        .remove([dialog.document.file_path]);

      if (storageError) {
        console.error("Stored document could not be removed:", storageError);
      }
    }

    const { error } = await db
      .from("company_documents")
      .delete()
      .eq("id", dialog.document.id);

    setWorking(false);

    if (error) {
      setNotice({
        type: "error",
        message: "The document could not be deleted.",
      });
      return;
    }

    closeDialog();
    setNotice({ type: "success", message: "Document deleted." });
    await loadDocuments();
  }

  async function handleReplace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog || dialog.type !== "replace") return;

    if (!replacementFile || !isSupportedFile(replacementFile)) {
      setNotice({
        type: "error",
        message: "Choose a DOC, DOCX or PDF replacement document.",
      });
      return;
    }

    setWorking(true);
    const current = dialog.document;

    const path = `${folder
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(
      replacementFile.name,
    )}`;

    const uploadResult = await supabase.storage
      .from("company-documents")
      .upload(path, replacementFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadResult.error) {
      setWorking(false);
      setNotice({
        type: "error",
        message: "The replacement document could not be uploaded.",
      });
      return;
    }

    const publicUrl = supabase.storage
      .from("company-documents")
      .getPublicUrl(path).data.publicUrl;

    const groupId = current.document_group_id ?? crypto.randomUUID();
    const nextVersion = (current.version_number ?? 1) + 1;

    const { data: replacement, error: insertError } = await db
      .from("company_documents")
      .insert({
        name: current.name,
        notes: current.notes,
        document_type: current.document_type ?? folder,
        file_name: replacementFile.name,
        file_path: path,
        file_url: publicUrl,
        status: "active",
        document_group_id: groupId,
        version_number: nextVersion,
        previous_version_id: current.id,
      })
      .select("id")
      .single();

    if (insertError || !replacement) {
      await supabase.storage.from("company-documents").remove([path]);
      setWorking(false);
      setNotice({
        type: "error",
        message: "The replacement document record could not be created.",
      });
      return;
    }

    const { error: archiveError } = await db
      .from("company_documents")
      .update({
        status: "archived",
        archived_at: new Date().toISOString(),
        document_group_id: groupId,
        version_number: current.version_number ?? 1,
        replaced_by_id: replacement.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.id);

    if (archiveError) {
      await db.from("company_documents").delete().eq("id", replacement.id);
      await supabase.storage.from("company-documents").remove([path]);
      setWorking(false);
      setNotice({
        type: "error",
        message:
          "The existing document could not be archived, so no replacement was made.",
      });
      return;
    }

    setWorking(false);
    closeDialog();
    setNotice({
      type: "success",
      message:
        "Document replaced. The previous version has been retained in the archive.",
    });
    await loadDocuments();
  }

  async function loadVersionHistory(document: CompanyDocument) {
    setVersions([]);

    if (!document.document_group_id) {
      setVersions([document]);
      return;
    }

    const { data, error } = await db
      .from("company_documents")
      .select(
        "id, name, notes, document_type, file_name, file_path, file_url, created_at, updated_at, status, archived_at, document_group_id, version_number, previous_version_id, replaced_by_id",
      )
      .eq("document_group_id", document.document_group_id)
      .order("version_number", { ascending: false });

    if (error) {
      setNotice({
        type: "error",
        message: "Version history could not be loaded.",
      });
      return;
    }

    setVersions((data ?? []) as CompanyDocument[]);
  }

  const visibleDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      if (!query) return true;
      return `${document.name} ${document.notes ?? ""}`
        .toLowerCase()
        .includes(query);
    });
  }, [documents, search]);

  return (
    <main className="documents-page">
      <div className="page-shell">
        <Link className="back-link" href="/dashboard/organisation">
          ← Back to Organisation
        </Link>

        <section className="hero">
          <div>
            <p className="eyebrow">Company Documents</p>
            <h1>{title}</h1>
            <p className="hero-copy">{description}</p>
          </div>

          <div className="hero-badge">
            <span className="hero-count">{documents.length}</span>
            <span className="hero-count-label">
              {documents.length === 1 ? singularLabel : pluralLabel}
            </span>
          </div>
        </section>

        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${pluralLabel.toLowerCase()}...`}
              aria-label={`Search ${pluralLabel.toLowerCase()}`}
            />
          </div>

          <button
            className="upload-button"
            type="button"
            onClick={() => {
              setNotice(null);
              setShowUpload((current) => !current);
            }}
          >
            <span aria-hidden="true">＋</span>
            Upload {pluralLabel.toLowerCase()}
          </button>
        </div>

        {showUpload ? (
          <section className="upload-panel">
            <div className="panel-heading">
              <div>
                <p className="section-eyebrow">Add company documents</p>
                <h2>Upload {pluralLabel.toLowerCase()}</h2>
                <p>
                  Select one or several Word or PDF documents. Each file will be
                  stored as a separate organisation document.
                </p>
              </div>

              <button
                className="close-button"
                type="button"
                onClick={resetUpload}
                aria-label="Close upload form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <label className="field">
                <span>Documents</span>
                <input
                  type="file"
                  accept=".doc,.docx,.pdf"
                  multiple
                  onChange={handleFiles}
                  disabled={working}
                />
                <small>Accepted file types: DOC, DOCX and PDF.</small>
              </label>

              {uploadItems.length > 0 ? (
                <div className="upload-queue">
                  {uploadItems.map((item) => (
                    <div className="queue-row" key={item.id}>
                      <div className="queue-file">
                        <strong>{item.file.name}</strong>
                        <span>
                          {(item.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>

                      <input
                        value={item.name}
                        onChange={(event) =>
                          updateUploadName(item.id, event.target.value)
                        }
                        aria-label={`Document name for ${item.file.name}`}
                        maxLength={180}
                        disabled={working}
                      />

                      <button
                        type="button"
                        onClick={() => removeUploadItem(item.id)}
                        disabled={working}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <label className="field">
                <span>Notes for this batch</span>
                <textarea
                  value={uploadNotes}
                  onChange={(event) => setUploadNotes(event.target.value)}
                  placeholder="Optional notes applied to every document in this upload"
                  maxLength={600}
                  disabled={working}
                />
              </label>

              <div className="form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={resetUpload}
                  disabled={working}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={working || uploadItems.length === 0}
                >
                  {working
                    ? "Uploading..."
                    : `Upload ${uploadItems.length || ""} ${
                        uploadItems.length === 1
                          ? singularLabel
                          : pluralLabel
                      }`}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {notice ? (
          <div className={`inline-notice ${notice.type}`} role="status">
            {notice.message}
          </div>
        ) : null}

        <section className="library-panel">
          <div className="library-header">
            <div>
              <p className="section-eyebrow">Organisation library</p>
              <h2>{title} documents</h2>
            </div>
            <span className="result-count">
              {visibleDocuments.length}{" "}
              {visibleDocuments.length === 1 ? "document" : "documents"}
            </span>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="loading-mark" />
              <h2>Loading documents</h2>
            </div>
          ) : visibleDocuments.length > 0 ? (
            <div className="document-list">
              {visibleDocuments.map((document) => (
                <article className="document-row" key={document.id}>
                  <div className="document-main">
                    <span className="document-icon">{iconLetter}</span>
                    <div>
                      <h3>{document.name}</h3>
                      {document.notes ? <p>{document.notes}</p> : null}
                      <span className="updated-label">
                        Uploaded {formatDate(document.created_at)}
                        {document.version_number &&
                        document.version_number > 1
                          ? ` · Version ${document.version_number}`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="document-actions">
                    {document.file_url ? (
                      <a
                        className="document-action"
                        href={document.file_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Preview
                      </a>
                    ) : (
                      <button className="document-action" disabled>
                        Preview
                      </button>
                    )}

                    {document.file_url && isWord(document.file_name) ? (
                      <a
                        className="document-action"
                        href={document.file_url}
                        download={document.file_name ?? undefined}
                      >
                        Word
                      </a>
                    ) : (
                      <button className="document-action" disabled>
                        Word
                      </button>
                    )}

                    {document.file_url && isPdf(document.file_name) ? (
                      <a
                        className="document-action"
                        href={document.file_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        PDF
                      </a>
                    ) : (
                      <button className="document-action" disabled>
                        PDF
                      </button>
                    )}

                    <Link
                      className="document-action ask-action"
                      href={getAskLeoHref(document, returnUrl)}
                    >
                      <span aria-hidden="true">✦</span>
                      Ask Leo
                    </Link>

                    <div
                      className="more-wrap"
                      ref={openMenuId === document.id ? menuRef : null}
                    >
                      <button
                        className="more-button"
                        type="button"
                        aria-label={`More actions for ${document.name}`}
                        aria-expanded={openMenuId === document.id}
                        onClick={() =>
                          setOpenMenuId((current) =>
                            current === document.id ? null : document.id,
                          )
                        }
                      >
                        ⋯
                      </button>

                      {openMenuId === document.id ? (
                        <div className="more-menu">
                          <button
                            type="button"
                            onClick={() =>
                              openDialog({ type: "rename", document })
                            }
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              openDialog({ type: "edit", document })
                            }
                          >
                            Edit details
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              openDialog({ type: "replace", document })
                            }
                          >
                            Replace document
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              openDialog({ type: "move", document })
                            }
                          >
                            Move to another folder
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              openDialog({ type: "versions", document })
                            }
                          >
                            View version history
                          </button>
                          <div className="menu-divider" />
                          <button
                            type="button"
                            onClick={() =>
                              openDialog({ type: "archive", document })
                            }
                          >
                            Archive document
                          </button>
                          <button
                            className="danger-action"
                            type="button"
                            onClick={() =>
                              openDialog({ type: "delete", document })
                            }
                          >
                            Delete document
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">{iconLetter}</div>
              <h2>
                {search
                  ? `No matching ${pluralLabel.toLowerCase()} found`
                  : `No ${pluralLabel.toLowerCase()} have been added yet`}
              </h2>
              <p>
                {search
                  ? "Try a different document name or clear the search."
                  : `Select Upload ${pluralLabel.toLowerCase()} to add the organisation's first document.`}
              </p>
              {!search ? (
                <button
                  className="empty-upload-button"
                  type="button"
                  onClick={() => setShowUpload(true)}
                >
                  Upload first {singularLabel.toLowerCase()}
                </button>
              ) : null}
            </div>
          )}
        </section>

        <section className="review-note">
          <span aria-hidden="true">✦</span>
          <div>
            <strong>Make document reviews easier</strong>
            <p>
              Use Ask Leo beside a document to check whether it remains current.
              LEO can highlight outdated wording, legal developments and areas
              requiring attention without automatically replacing the
              organisation&apos;s document.
            </p>
          </div>
        </section>
      </div>

      {dialog ? (
        <div className="modal-backdrop" role="presentation">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-dialog-title"
          >
            <div className="modal-heading">
              <div>
                <p className="section-eyebrow">Company document</p>
                <h2 id="document-dialog-title">
                  {dialog.type === "rename" && "Rename document"}
                  {dialog.type === "edit" && "Edit document details"}
                  {dialog.type === "replace" && "Replace document"}
                  {dialog.type === "move" && "Move document"}
                  {dialog.type === "versions" && "Version history"}
                  {dialog.type === "archive" && "Archive document"}
                  {dialog.type === "delete" && "Delete document"}
                </h2>
              </div>
              <button
                className="close-button"
                type="button"
                onClick={closeDialog}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            {dialog.type === "rename" ? (
              <form onSubmit={handleRename}>
                <label className="field">
                  <span>Document name</span>
                  <input
                    value={dialogName}
                    onChange={(event) => setDialogName(event.target.value)}
                    maxLength={180}
                    required
                  />
                </label>
                <ModalActions working={working} onCancel={closeDialog} />
              </form>
            ) : null}

            {dialog.type === "edit" ? (
              <form onSubmit={handleEdit}>
                <label className="field">
                  <span>Document name</span>
                  <input
                    value={dialogName}
                    onChange={(event) => setDialogName(event.target.value)}
                    maxLength={180}
                    required
                  />
                </label>
                <label className="field">
                  <span>Notes</span>
                  <textarea
                    value={dialogNotes}
                    onChange={(event) => setDialogNotes(event.target.value)}
                    maxLength={600}
                  />
                </label>
                <ModalActions working={working} onCancel={closeDialog} />
              </form>
            ) : null}

            {dialog.type === "replace" ? (
              <form onSubmit={handleReplace}>
                <p className="modal-copy">
                  The current document will be moved to the archive and retained
                  in version history. The replacement will become the active
                  document.
                </p>
                <label className="field">
                  <span>Replacement document</span>
                  <input
                    type="file"
                    accept=".doc,.docx,.pdf"
                    onChange={(event) =>
                      setReplacementFile(event.target.files?.[0] ?? null)
                    }
                    required
                  />
                </label>
                <ModalActions
                  working={working}
                  onCancel={closeDialog}
                  submitLabel="Replace document"
                />
              </form>
            ) : null}

            {dialog.type === "move" ? (
              <form onSubmit={handleMove}>
                <label className="field">
                  <span>Move to</span>
                  <select
                    value={dialogFolder}
                    onChange={(event) =>
                      setDialogFolder(
                        event.target.value as CompanyDocumentFolder,
                      )
                    }
                  >
                    {COMPANY_DOCUMENT_FOLDERS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <ModalActions
                  working={working}
                  onCancel={closeDialog}
                  submitLabel="Move document"
                />
              </form>
            ) : null}

            {dialog.type === "versions" ? (
              <div className="version-list">
                {versions.length > 0 ? (
                  versions.map((version) => (
                    <div className="version-row" key={version.id}>
                      <div>
                        <strong>
                          Version {version.version_number ?? 1}
                          {version.status === "active" ? " · Current" : ""}
                        </strong>
                        <span>
                          {formatDate(version.updated_at ?? version.created_at)}
                        </span>
                      </div>
                      {version.file_url ? (
                        <a
                          href={version.file_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="modal-copy">Loading version history...</p>
                )}
              </div>
            ) : null}

            {dialog.type === "archive" ? (
              <>
                <p className="modal-copy">
                  Archive <strong>{dialog.document.name}</strong>? It will no
                  longer appear in the active library or LEO&apos;s active
                  document reviews.
                </p>
                <ModalActions
                  working={working}
                  onCancel={closeDialog}
                  onConfirm={handleArchive}
                  submitLabel="Archive document"
                />
              </>
            ) : null}

            {dialog.type === "delete" ? (
              <>
                <p className="modal-copy">
                  Permanently delete <strong>{dialog.document.name}</strong>?
                  This removes the record and stored file and cannot be undone.
                </p>
                <ModalActions
                  working={working}
                  onCancel={closeDialog}
                  onConfirm={handleDelete}
                  submitLabel="Delete permanently"
                  danger
                />
              </>
            ) : null}
          </section>
        </div>
      ) : null}

      <style jsx>{`
        .documents-page {
          min-height: 100%;
          padding: 32px;
          background: linear-gradient(180deg, #fbf8fd 0%, #ffffff 42%);
          color: #334155;
        }

        .page-shell {
          max-width: 1220px;
          margin: 0 auto;
        }

        :global(.back-link) {
          display: inline-flex;
          margin-bottom: 24px;
          color: #6e5084;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 28px;
          align-items: end;
          padding: 34px;
          border: 1px solid #eadff0;
          border-radius: 24px;
          background: #ffffff;
          box-shadow: 0 16px 45px rgba(91, 66, 106, 0.07);
        }

        .eyebrow,
        .section-eyebrow {
          margin: 0 0 8px;
          color: #8a6a9e;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        h1 {
          margin: 0;
          color: #6e5084;
          font-size: clamp(34px, 5vw, 52px);
          font-weight: 500;
          letter-spacing: -0.035em;
        }

        .hero-copy {
          max-width: 790px;
          margin: 14px 0 0;
          color: #64748b;
          font-size: 17px;
          line-height: 1.7;
        }

        .hero-badge {
          min-width: 145px;
          padding: 18px 20px;
          border-radius: 18px;
          background: #f7f1fc;
          text-align: center;
        }

        .hero-count {
          display: block;
          color: #6e5084;
          font-size: 32px;
          font-weight: 700;
        }

        .hero-count-label {
          color: #80678f;
          font-size: 13px;
        }

        .toolbar {
          display: grid;
          grid-template-columns: minmax(280px, 1fr) auto;
          gap: 16px;
          margin-top: 26px;
        }

        .search-wrap {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 17px;
          top: 50%;
          transform: translateY(-50%);
          color: #90759f;
        }

        .search-input {
          width: 100%;
          height: 52px;
          box-sizing: border-box;
          padding: 0 18px 0 46px;
          border: 1px solid #dfd4e5;
          border-radius: 14px;
          background: #ffffff;
          color: #334155;
          font: inherit;
          outline: none;
        }

        .upload-button,
        .primary-button,
        .empty-upload-button {
          display: inline-flex;
          min-height: 52px;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 20px;
          border: 1px solid #6e5084;
          border-radius: 14px;
          background: #6e5084;
          color: #ffffff;
          font: inherit;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
        }

        .upload-panel,
        .library-panel {
          margin-top: 22px;
          padding: 26px;
          border: 1px solid #eadff0;
          border-radius: 20px;
          background: #ffffff;
        }

        .panel-heading,
        .library-header,
        .modal-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
        }

        .panel-heading h2,
        .library-header h2,
        .modal-heading h2 {
          margin: 0;
          color: #6e5084;
          font-size: 24px;
          font-weight: 550;
        }

        .panel-heading p:not(.section-eyebrow) {
          margin: 7px 0 0;
          color: #64748b;
        }

        .close-button {
          width: 38px;
          height: 38px;
          border: 1px solid #e2d9e6;
          border-radius: 11px;
          background: #ffffff;
          color: #6e5084;
          font-size: 24px;
          cursor: pointer;
        }

        .field {
          display: grid;
          gap: 8px;
          margin-top: 20px;
        }

        .field > span {
          color: #4b3d52;
          font-size: 13px;
          font-weight: 750;
        }

        .field input,
        .field textarea,
        .field select,
        .queue-row input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d9cedd;
          border-radius: 12px;
          background: #ffffff;
          color: #334155;
          font: inherit;
          outline: none;
        }

        .field input,
        .field select,
        .queue-row input {
          min-height: 47px;
          padding: 0 13px;
        }

        .field input[type="file"] {
          padding: 10px 12px;
        }

        .field textarea {
          min-height: 90px;
          padding: 12px 13px;
          resize: vertical;
        }

        .field small {
          color: #7b7180;
        }

        .upload-queue {
          display: grid;
          gap: 10px;
          margin-top: 18px;
        }

        .queue-row {
          display: grid;
          grid-template-columns: minmax(190px, 1fr) minmax(220px, 1fr) auto;
          gap: 12px;
          align-items: center;
          padding: 12px;
          border: 1px solid #eee7f1;
          border-radius: 13px;
          background: #fcfafc;
        }

        .queue-file {
          display: grid;
          gap: 3px;
          min-width: 0;
        }

        .queue-file strong {
          overflow: hidden;
          font-size: 13px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .queue-file span {
          color: #7b7180;
          font-size: 11px;
        }

        .queue-row button {
          border: 0;
          background: transparent;
          color: #6e5084;
          font-weight: 700;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
        }

        .secondary-button {
          min-height: 46px;
          padding: 0 17px;
          border: 1px solid #d9cedd;
          border-radius: 12px;
          background: #ffffff;
          color: #6e5084;
          font: inherit;
          font-weight: 750;
          cursor: pointer;
        }

        .primary-button {
          min-height: 46px;
          border-radius: 12px;
        }

        .inline-notice {
          margin-top: 18px;
          padding: 13px 15px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
        }

        .inline-notice.success {
          background: #edf8f1;
          color: #315f46;
        }

        .inline-notice.error {
          background: #fff1f3;
          color: #913947;
        }

        .library-panel {
          min-height: 440px;
          margin-top: 26px;
        }

        .library-header {
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee7f1;
        }

        .result-count {
          color: #8b7896;
          font-size: 13px;
        }

        .document-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 24px;
          align-items: center;
          padding: 22px 2px;
          border-bottom: 1px solid #eee7f1;
        }

        .document-main {
          display: flex;
          gap: 14px;
          min-width: 0;
        }

        .document-icon,
        .empty-icon {
          display: grid;
          flex: 0 0 auto;
          width: 42px;
          height: 42px;
          place-items: center;
          border-radius: 12px;
          background: #f4edf8;
          color: #6e5084;
          font-weight: 800;
        }

        .document-main h3 {
          margin: 1px 0 0;
          color: #6e5084;
          font-size: 18px;
        }

        .document-main p {
          margin: 8px 0 0;
          color: #64748b;
          line-height: 1.55;
        }

        .updated-label {
          display: inline-block;
          margin-top: 10px;
          color: #7d6989;
          font-size: 11px;
          font-weight: 700;
        }

        .document-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
        }

        :global(.document-action),
        .more-button {
          display: inline-flex;
          min-height: 40px;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 14px;
          border: 1px solid #dfd4e5;
          border-radius: 11px;
          background: #ffffff;
          color: #6e5084;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }

        :global(.ask-action) {
          border-color: #6e5084;
          background: #6e5084;
          color: #ffffff;
        }

        .more-wrap {
          position: relative;
        }

        .more-button {
          width: 42px;
          padding: 0;
          font-size: 20px;
        }

        .more-menu {
          position: absolute;
          z-index: 20;
          top: calc(100% + 7px);
          right: 0;
          display: grid;
          min-width: 220px;
          padding: 7px;
          border: 1px solid #dfd4e5;
          border-radius: 13px;
          background: #ffffff;
          box-shadow: 0 16px 38px rgba(63, 45, 74, 0.15);
        }

        .more-menu button {
          padding: 10px 11px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #4b3d52;
          text-align: left;
          cursor: pointer;
        }

        .more-menu button:hover {
          background: #f7f1fc;
        }

        .more-menu .danger-action {
          color: #963848;
        }

        .menu-divider {
          height: 1px;
          margin: 6px 4px;
          background: #eee7f1;
        }

        .empty-state {
          display: flex;
          min-height: 330px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .empty-icon {
          width: 62px;
          height: 62px;
          margin-bottom: 18px;
          border-radius: 18px;
          font-size: 26px;
        }

        .empty-state h2 {
          margin: 0;
          color: #6e5084;
          font-size: 24px;
          font-weight: 500;
        }

        .empty-state p {
          max-width: 620px;
          margin: 12px 0 0;
          color: #718096;
          line-height: 1.7;
        }

        .empty-upload-button {
          min-height: 44px;
          margin-top: 18px;
        }

        .loading-mark {
          width: 44px;
          height: 44px;
          margin-bottom: 18px;
          border: 4px solid #eadff0;
          border-top-color: #6e5084;
          border-radius: 50%;
          animation: spin 800ms linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .review-note {
          display: flex;
          gap: 14px;
          margin-top: 26px;
          padding: 20px 22px;
          border: 1px solid #dcece4;
          border-radius: 16px;
          background: #f5fff9;
        }

        .review-note strong {
          color: #536f62;
        }

        .review-note p {
          margin: 4px 0 0;
          color: #658073;
          font-size: 14px;
          line-height: 1.6;
        }

        .modal-backdrop {
          position: fixed;
          z-index: 100;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 22px;
          background: rgba(40, 30, 46, 0.46);
        }

        .modal {
          width: min(600px, 100%);
          max-height: 90vh;
          overflow: auto;
          padding: 25px;
          border-radius: 19px;
          background: #ffffff;
          box-shadow: 0 24px 70px rgba(38, 27, 44, 0.26);
        }

        .modal-copy {
          margin: 18px 0 0;
          color: #64748b;
          line-height: 1.65;
        }

        .version-list {
          display: grid;
          gap: 10px;
          margin-top: 20px;
        }

        .version-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 13px;
          border: 1px solid #eee7f1;
          border-radius: 12px;
        }

        .version-row div {
          display: grid;
          gap: 4px;
        }

        .version-row span {
          color: #7b7180;
          font-size: 12px;
        }

        .version-row a {
          color: #6e5084;
          font-weight: 700;
          text-decoration: none;
        }

        @media (max-width: 900px) {
          .documents-page {
            padding: 20px;
          }

          .hero,
          .toolbar,
          .document-row,
          .queue-row {
            grid-template-columns: 1fr;
          }

          .document-actions,
          .form-actions {
            justify-content: flex-start;
          }
        }
      `}</style>
    </main>
  );
}

function ModalActions({
  working,
  onCancel,
  onConfirm,
  submitLabel = "Save changes",
  danger = false,
}: {
  working: boolean;
  onCancel: () => void;
  onConfirm?: () => void;
  submitLabel?: string;
  danger?: boolean;
}) {
  return (
    <div className="modal-actions">
      <button
        className="modal-secondary"
        type="button"
        onClick={onCancel}
        disabled={working}
      >
        Cancel
      </button>
      <button
        className={danger ? "modal-danger" : "modal-primary"}
        type={onConfirm ? "button" : "submit"}
        onClick={onConfirm}
        disabled={working}
      >
        {working ? "Working..." : submitLabel}
      </button>

      <style jsx>{`
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 24px;
        }

        button {
          min-height: 44px;
          padding: 0 16px;
          border-radius: 11px;
          font: inherit;
          font-weight: 750;
          cursor: pointer;
        }

        .modal-secondary {
          border: 1px solid #d9cedd;
          background: #ffffff;
          color: #6e5084;
        }

        .modal-primary {
          border: 1px solid #6e5084;
          background: #6e5084;
          color: #ffffff;
        }

        .modal-danger {
          border: 1px solid #963848;
          background: #963848;
          color: #ffffff;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}