"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ProfileSection from "./ProfileSection";
import SaveButton from "./SaveButton";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type EmployeeNotesProps = {
  employeeId: number;
};

type Note = {
  id: number;
  note: string;
  created_at: string;
};

export default function EmployeeNotes({ employeeId }: EmployeeNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadNotes() {
    const { data, error } = await supabase
      .from("employee_notes")
      .select("id, note, created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading employee notes:", error);
      setLoading(false);
      return;
    }

    setNotes(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadNotes();
  }, [employeeId]);

  async function saveNote() {
    if (!newNote.trim()) {
      setMessage("Please enter a note before saving.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("employee_notes").insert([
      {
        employee_id: employeeId,
        note: newNote.trim(),
      },
    ]);

    if (error) {
      console.error("Error saving employee note:", error);
      setMessage("Note could not be saved.");
      setSaving(false);
      return;
    }

    setNewNote("");
    setMessage("Note saved.");
    setSaving(false);
    loadNotes();
  }

  function startEditing(note: Note) {
    setEditingNoteId(note.id);
    setEditingText(note.note);
    setMessage("");
  }

  function cancelEditing() {
    setEditingNoteId(null);
    setEditingText("");
  }

  async function saveEditedNote(noteId: number) {
    if (!editingText.trim()) {
      setMessage("Note cannot be empty.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("employee_notes")
      .update({ note: editingText.trim() })
      .eq("id", noteId);

    if (error) {
      console.error("Error updating employee note:", error);
      setMessage("Note could not be updated.");
      setSaving(false);
      return;
    }

    setEditingNoteId(null);
    setEditingText("");
    setMessage("Note updated.");
    setSaving(false);
    loadNotes();
  }

  return (
    <ProfileSection title="Notes">
      <p style={{ color: "#6B7280", fontSize: "14px", marginTop: 0 }}>
        Add internal HR notes for this employee. Notes are saved as a history
        and can be opened and edited.
      </p>

      <textarea
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        placeholder="Write an internal note..."
        style={textAreaStyle}
      />

      <SaveButton onClick={saveNote} disabled={saving}>
        {saving ? "Saving..." : "Save note"}
      </SaveButton>

      {message && (
        <div style={{ marginTop: "10px", color: "#6B7280", fontSize: "14px" }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: "22px" }}>
        <div style={{ fontWeight: 800, marginBottom: "10px" }}>
          Note history
        </div>

        {loading ? (
          <div style={{ color: "#6B7280" }}>Loading notes...</div>
        ) : notes.length === 0 ? (
          <div style={{ color: "#6B7280" }}>No notes yet.</div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {notes.map((note) => (
              <div key={note.id} style={noteCardStyle}>
                {editingNoteId === note.id ? (
                  <>
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      style={textAreaStyle}
                    />

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => saveEditedNote(note.id)}
                        disabled={saving}
                        style={smallDarkButtonStyle}
                      >
                        Save changes
                      </button>

                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        style={smallLightButtonStyle}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        marginBottom: "8px",
                        color: "#111827",
                      }}
                    >
                      {note.note}
                    </div>

                    <div style={{ color: "#6B7280", fontSize: "12px" }}>
                      {new Date(note.created_at).toLocaleString("en-GB")}
                    </div>

                    <button
                      onClick={() => startEditing(note)}
                      style={smallLightButtonStyle}
                    >
                      Open / edit note
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileSection>
  );
}

const textAreaStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: "110px",
  padding: "10px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  marginBottom: "10px",
};

const noteCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px",
  background: "#F9FAFB",
};

const smallDarkButtonStyle: React.CSSProperties = {
  marginTop: "10px",
  background: "#111827",
  color: "#fff",
  border: "none",
  padding: "7px 10px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "13px",
};

const smallLightButtonStyle: React.CSSProperties = {
  marginTop: "10px",
  background: "#fff",
  color: "#374151",
  border: "1px solid #e5e7eb",
  padding: "7px 10px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "13px",
};