"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  organisationId: string;
};

type IdentityProfile = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  is_active: boolean;
  last_seen_at: string | null;
};

type Role = {
  id: string;
  role_key: string;
  name: string;
  description: string | null;
  role_level: number;
};

type MembershipRoleRecord = {
  id: string;
  membership_id: string;
  role_id: string;
  is_primary: boolean;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
};

type MembershipRole = MembershipRoleRecord & {
  role: Role | null;
};

type MembershipRecord = {
  id: string;
  organisation_id: string;
  user_id: string;
  membership_status: "invited" | "active" | "suspended" | "ended";
  membership_type: string;
  accepted_at: string | null;
  activated_at: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  ended_at: string | null;
  is_default_organisation: boolean;
  last_accessed_at: string | null;
  access_starts_at: string | null;
  access_ends_at: string | null;
  created_at: string;
};

type Membership = MembershipRecord & {
  profile: IdentityProfile | null;
  roles: MembershipRole[];
};

type Invitation = {
  id: string;
  email: string;
  role_id: string | null;
  role_name: string | null;
  status: "pending" | "accepted" | "cancelled" | "expired";
  invited_at: string;
  expires_at: string | null;
  invited_by_name: string | null;
};

type InvitationResponse = {
  invitations?: Invitation[];
  invitation?: Invitation;
  error?: string;
};

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function humanise(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function displayName(membership: Membership) {
  const profile = membership.profile;
  const composed = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return profile?.display_name?.trim() || composed || "Organisation user";
}

function primaryRole(membership: Membership) {
  return (
    membership.roles.find((item) => item.is_active && item.is_primary)?.role ??
    membership.roles.find((item) => item.is_active)?.role ??
    null
  );
}

function isOwner(membership: Membership) {
  return membership.roles.some(
    (item) => item.is_active && item.role?.role_key === "owner",
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function PeopleAccessWorkspace({ organisationId }: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [invitationActionId, setInvitationActionId] = useState<string | null>(
    null,
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("current");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [invitationError, setInvitationError] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [busyMembershipId, setBusyMembershipId] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    setInvitationError("");

    try {
      const response = await fetch(
        `/api/organisation/invitations?organisationId=${encodeURIComponent(
          organisationId,
        )}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      const payload = (await response.json()) as InvitationResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Invitations could not be loaded.");
      }

      setInvitations(payload.invitations ?? []);
    } catch (error) {
      setInvitations([]);
      setInvitationError(
        error instanceof Error
          ? error.message
          : "Invitations could not be loaded.",
      );
    }
  }, [organisationId]);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setPageError("");
    setNotice(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setPageError(
        userError?.message ||
          "You must be signed in to review organisation access.",
      );
      setLoading(false);
      return;
    }

    setCurrentUserId(user.id);

    const [membershipResult, roleResult] = await Promise.all([
      supabase
        .from("organisation_memberships")
        .select(
          [
            "id",
            "organisation_id",
            "user_id",
            "membership_status",
            "membership_type",
            "accepted_at",
            "activated_at",
            "suspended_at",
            "suspension_reason",
            "ended_at",
            "is_default_organisation",
            "last_accessed_at",
            "access_starts_at",
            "access_ends_at",
            "created_at",
          ].join(","),
        )
        .eq("organisation_id", organisationId)
        .order("created_at", { ascending: true }),
      supabase
        .from("roles")
        .select("id, role_key, name, description, role_level")
        .eq("is_assignable", true)
        .eq("is_active", true)
        .eq("is_archived", false)
        .or(`organisation_id.is.null,organisation_id.eq.${organisationId}`)
        .order("role_level", { ascending: false }),
    ]);

    if (membershipResult.error) {
      setPageError(membershipResult.error.message);
      setLoading(false);
      return;
    }

    if (roleResult.error) {
      setPageError(roleResult.error.message);
      setLoading(false);
      return;
    }

    const baseMemberships =
      (membershipResult.data ?? []) as unknown as MembershipRecord[];
    const roles = (roleResult.data as Role[] | null) ?? [];
    const userIds = [...new Set(baseMemberships.map((item) => item.user_id))];
    const membershipIds = baseMemberships.map((item) => item.id);

    const [profilesResult, assignmentsResult] = await Promise.all([
      userIds.length
        ? supabase
            .from("identity_profiles")
            .select(
              "id, display_name, first_name, last_name, job_title, is_active, last_seen_at",
            )
            .in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
      membershipIds.length
        ? supabase
            .from("membership_roles")
            .select(
              "id, membership_id, role_id, is_primary, is_active, starts_at, expires_at",
            )
            .in("membership_id", membershipIds)
            .eq("is_active", true)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (profilesResult.error) {
      setPageError(profilesResult.error.message);
      setLoading(false);
      return;
    }

    if (assignmentsResult.error) {
      setPageError(assignmentsResult.error.message);
      setLoading(false);
      return;
    }

    const profiles = new Map(
      ((profilesResult.data ?? []) as IdentityProfile[]).map((profile) => [
        profile.id,
        profile,
      ]),
    );

    const roleMap = new Map(roles.map((role) => [role.id, role]));

    const assignmentsByMembership = (
      (assignmentsResult.data ?? []) as MembershipRoleRecord[]
    ).reduce<Map<string, MembershipRole[]>>((map, assignment) => {
      const current = map.get(assignment.membership_id) ?? [];
      current.push({
        ...assignment,
        role: roleMap.get(assignment.role_id) ?? null,
      });
      map.set(assignment.membership_id, current);
      return map;
    }, new Map());

    setAvailableRoles(roles);
    setInviteRoleId((current) => current || roles[0]?.id || "");
    setMemberships(
      baseMemberships.map((membership) => ({
        ...membership,
        profile: profiles.get(membership.user_id) ?? null,
        roles: assignmentsByMembership.get(membership.id) ?? [],
      })),
    );

    await loadInvitations();
    setLoading(false);
  }, [loadInvitations, organisationId, supabase]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const counts = useMemo(
    () => ({
      active: memberships.filter((item) => item.membership_status === "active")
        .length,
      pending: invitations.filter((item) => item.status === "pending").length,
      suspended: memberships.filter(
        (item) => item.membership_status === "suspended",
      ).length,
      owners: memberships.filter(
        (item) => item.membership_status === "active" && isOwner(item),
      ).length,
    }),
    [invitations, memberships],
  );

  const filteredMemberships = useMemo(() => {
    const query = search.trim().toLowerCase();

    return memberships.filter((membership) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "current" &&
          membership.membership_status !== "ended") ||
        membership.membership_status === statusFilter;

      const role = primaryRole(membership);
      const haystack = [
        displayName(membership),
        membership.profile?.job_title,
        role?.name,
        membership.membership_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [memberships, search, statusFilter]);

  async function submitInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = inviteEmail.trim().toLowerCase();

    if (!isValidEmail(email)) {
      setNotice({
        type: "error",
        message: "Enter a valid email address.",
      });
      return;
    }

    if (!inviteRoleId) {
      setNotice({
        type: "error",
        message: "Choose the access role for this person.",
      });
      return;
    }

    setInviting(true);
    setNotice(null);

    try {
      const response = await fetch("/api/organisation/invitations", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisationId,
          email,
          roleId: inviteRoleId,
        }),
      });

      const payload = (await response.json()) as InvitationResponse;

      if (!response.ok) {
        throw new Error(payload.error || "The invitation could not be sent.");
      }

      setInviteEmail("");
      setInviteOpen(false);
      setNotice({
        type: "success",
        message: `Invitation sent to ${email}.`,
      });
      await loadInvitations();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "The invitation could not be sent.",
      });
    } finally {
      setInviting(false);
    }
  }

  async function invitationAction(
    invitation: Invitation,
    action: "resend" | "cancel",
  ) {
    if (
      action === "cancel" &&
      !window.confirm(`Cancel the invitation for ${invitation.email}?`)
    ) {
      return;
    }

    setInvitationActionId(invitation.id);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/organisation/invitations/${encodeURIComponent(invitation.id)}`,
        {
          method: action === "resend" ? "POST" : "DELETE",
          credentials: "same-origin",
          headers:
            action === "resend"
              ? {
                  "Content-Type": "application/json",
                }
              : undefined,
          body:
            action === "resend"
              ? JSON.stringify({ organisationId })
              : undefined,
        },
      );

      const payload = (await response.json()) as InvitationResponse;

      if (!response.ok) {
        throw new Error(
          payload.error ||
            (action === "resend"
              ? "The invitation could not be resent."
              : "The invitation could not be cancelled."),
        );
      }

      setNotice({
        type: "success",
        message:
          action === "resend"
            ? `Invitation resent to ${invitation.email}.`
            : `Invitation for ${invitation.email} has been cancelled.`,
      });
      await loadInvitations();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "The invitation action could not be completed.",
      });
    } finally {
      setInvitationActionId(null);
    }
  }

  async function changeRole(membership: Membership, nextRoleId: string) {
    const currentRole = primaryRole(membership);
    if (!nextRoleId || currentRole?.id === nextRoleId) return;

    if (isOwner(membership) && counts.owners <= 1) {
      setNotice({
        type: "error",
        message:
          "The final active organisation owner cannot be reassigned. Assign another owner first.",
      });
      return;
    }

    const nextRole = availableRoles.find((role) => role.id === nextRoleId);

    if (
      !nextRole ||
      !window.confirm(
        `Change ${displayName(membership)} to ${nextRole.name}?`,
      )
    ) {
      return;
    }

    setBusyMembershipId(membership.id);
    setNotice(null);

    const activeAssignments = membership.roles.filter((item) => item.is_active);

    for (const assignment of activeAssignments) {
      const { error } = await supabase
        .from("membership_roles")
        .update({
          is_active: false,
          is_primary: false,
          revoked_by: currentUserId,
          revoked_at: new Date().toISOString(),
          revocation_reason: `Replaced with ${nextRole.name} through Organisation access management.`,
        })
        .eq("id", assignment.id);

      if (error) {
        setNotice({ type: "error", message: error.message });
        setBusyMembershipId(null);
        return;
      }
    }

    const { error: assignmentError } = await supabase
      .from("membership_roles")
      .upsert(
        {
          membership_id: membership.id,
          role_id: nextRole.id,
          is_primary: true,
          is_active: true,
          starts_at: new Date().toISOString(),
          expires_at: null,
          assigned_by: currentUserId,
          assigned_at: new Date().toISOString(),
          assignment_reason:
            "Assigned through Organisation access management.",
          revoked_by: null,
          revoked_at: null,
          revocation_reason: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "membership_id,role_id" },
      );

    if (assignmentError) {
      setNotice({ type: "error", message: assignmentError.message });
      setBusyMembershipId(null);
      return;
    }

    setNotice({
      type: "success",
      message: `${displayName(membership)} now has the ${nextRole.name} role.`,
    });
    setBusyMembershipId(null);
    await loadWorkspace();
  }

  async function changeMembershipStatus(
    membership: Membership,
    nextStatus: "active" | "suspended" | "ended",
  ) {
    if (membership.user_id === currentUserId && nextStatus !== "active") {
      setNotice({
        type: "error",
        message: "You cannot suspend or end your own organisation access.",
      });
      return;
    }

    if (isOwner(membership) && counts.owners <= 1 && nextStatus !== "active") {
      setNotice({
        type: "error",
        message:
          "The final active organisation owner cannot be suspended or removed.",
      });
      return;
    }

    const action =
      nextStatus === "active"
        ? "reactivate"
        : nextStatus === "suspended"
          ? "suspend"
          : "end access for";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${displayName(membership)}?`,
      )
    ) {
      return;
    }

    let reason = "";

    if (nextStatus !== "active") {
      const enteredReason = window.prompt(
        nextStatus === "suspended"
          ? "Enter the reason for suspending access."
          : "Enter the reason for ending access.",
      );

      reason = enteredReason?.trim() ?? "";

      if (!reason) return;
    }

    setBusyMembershipId(membership.id);
    setNotice(null);

    const now = new Date().toISOString();
    const updates =
      nextStatus === "active"
        ? {
            membership_status: "active",
            accepted_at: membership.accepted_at ?? now,
            activated_at: membership.activated_at ?? now,
            suspended_at: null,
            suspended_by: null,
            suspension_reason: null,
            ended_at: null,
            ended_by: null,
            end_reason: null,
            updated_by: currentUserId,
          }
        : nextStatus === "suspended"
          ? {
              membership_status: "suspended",
              suspended_at: now,
              suspended_by: currentUserId,
              suspension_reason: reason,
              is_default_organisation: false,
              updated_by: currentUserId,
            }
          : {
              membership_status: "ended",
              ended_at: now,
              ended_by: currentUserId,
              end_reason: reason,
              is_default_organisation: false,
              updated_by: currentUserId,
            };

    const { error } = await supabase
      .from("organisation_memberships")
      .update(updates)
      .eq("id", membership.id)
      .eq("organisation_id", organisationId);

    if (error) {
      setNotice({ type: "error", message: error.message });
      setBusyMembershipId(null);
      return;
    }

    setNotice({
      type: "success",
      message:
        nextStatus === "active"
          ? `${displayName(membership)} has been reactivated.`
          : nextStatus === "suspended"
            ? `${displayName(membership)} has been suspended.`
            : `${displayName(membership)} no longer has organisation access.`,
    });

    setBusyMembershipId(null);
    await loadWorkspace();
  }

  if (loading) {
    return (
      <section className="workspace people-access-workspace">
        <div className="skeleton heading" />
        <div className="summary-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="skeleton summary" key={index} />
          ))}
        </div>
        <div className="skeleton table" />
        <style>{styles}</style>
      </section>
    );
  }

  if (pageError) {
    return (
      <section className="workspace people-access-workspace">
        <div className="state error" role="alert">
          <span aria-hidden="true">!</span>
          <h2>People and access could not be loaded</h2>
          <p>{pageError}</p>
          <button type="button" onClick={() => void loadWorkspace()}>
            Try again
          </button>
        </div>
        <style>{styles}</style>
      </section>
    );
  }

  return (
    <section className="workspace people-access-workspace">
      <header className="workspace-heading">
        <div>
          <p className="eyebrow">People &amp; Access</p>
          <h2>Organisation access</h2>
          <p>
            Invite people, assign roles and manage access to this organisation.
          </p>
        </div>

        <div className="heading-actions">
          <button
            className="secondary"
            type="button"
            onClick={() => void loadWorkspace()}
          >
            Refresh
          </button>
          <button
            className="primary"
            type="button"
            onClick={() => setInviteOpen((current) => !current)}
          >
            {inviteOpen ? "Close invitation" : "Invite person"}
          </button>
        </div>
      </header>

      {inviteOpen ? (
        <form className="invite-panel" onSubmit={submitInvitation}>
          <div className="invite-heading">
            <div>
              <p className="eyebrow">New invitation</p>
              <h3>Invite someone to LEO</h3>
              <p>
                Enter their work email and choose the role they should receive
                when the invitation is accepted.
              </p>
            </div>
          </div>

          <div className="invite-fields">
            <label>
              <span>Email address</span>
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="name@company.co.uk"
                autoComplete="email"
                disabled={inviting}
                required
              />
            </label>

            <label>
              <span>Organisation role</span>
              <select
                value={inviteRoleId}
                onChange={(event) => setInviteRoleId(event.target.value)}
                disabled={inviting}
                required
              >
                <option value="">Choose a role</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>

            <button className="primary send-button" type="submit" disabled={inviting}>
              {inviting ? "Sending..." : "Send invitation"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="summary-grid">
        <article>
          <span>Active users</span>
          <strong>{counts.active}</strong>
          <small>Current organisation members</small>
        </article>
        <article>
          <span>Pending invitations</span>
          <strong>{counts.pending}</strong>
          <small>Waiting to be accepted</small>
        </article>
        <article>
          <span>Suspended users</span>
          <strong>{counts.suspended}</strong>
          <small>Access temporarily blocked</small>
        </article>
        <article>
          <span>Organisation owners</span>
          <strong>{counts.owners}</strong>
          <small>Protected owner assignments</small>
        </article>
      </div>

      {notice ? (
        <div
          className={`notice ${notice.type}`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          {notice.message}
        </div>
      ) : null}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Invitations</p>
            <h3>Pending access invitations</h3>
          </div>
        </div>

        {invitationError ? (
          <div className="inline-error" role="alert">
            <strong>Invitations could not be loaded.</strong>
            <span>{invitationError}</span>
          </div>
        ) : invitations.filter((item) => item.status === "pending").length ===
          0 ? (
          <div className="empty-compact">
            <p>There are no pending invitations.</p>
          </div>
        ) : (
          <div className="invitation-list">
            {invitations
              .filter((item) => item.status === "pending")
              .map((invitation) => {
                const busy = invitationActionId === invitation.id;

                return (
                  <article className="invitation-row" key={invitation.id}>
                    <div>
                      <strong>{invitation.email}</strong>
                      <span>
                        {invitation.role_name || "Role pending"} · Sent{" "}
                        {formatDateTime(invitation.invited_at)}
                      </span>
                    </div>

                    <div className="actions">
                      <button
                        type="button"
                        className="link"
                        disabled={busy}
                        onClick={() =>
                          void invitationAction(invitation, "resend")
                        }
                      >
                        Resend
                      </button>
                      <button
                        type="button"
                        className="link danger"
                        disabled={busy}
                        onClick={() =>
                          void invitationAction(invitation, "cancel")
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </article>
                );
              })}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Current access</p>
            <h3>Organisation members</h3>
          </div>
        </div>

        <div className="toolbar">
          <label>
            <span className="sr-only">Search organisation users</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people, roles or status"
            />
          </label>

          <label>
            <span className="sr-only">Filter by membership status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="current">Current access</option>
              <option value="all">All records</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="ended">Ended</option>
            </select>
          </label>
        </div>

        {filteredMemberships.length === 0 ? (
          <div className="state">
            <span aria-hidden="true">✦</span>
            <h3>No matching access records</h3>
            <p>Change the search or status filter to review other people.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last activity</th>
                  <th>Access window</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredMemberships.map((membership) => {
                  const role = primaryRole(membership);
                  const busy = busyMembershipId === membership.id;

                  return (
                    <tr key={membership.id}>
                      <td>
                        <strong>{displayName(membership)}</strong>
                        <small>
                          {membership.profile?.job_title ||
                            humanise(membership.membership_type)}
                        </small>
                      </td>

                      <td>
                        {membership.membership_status === "active" ? (
                          <select
                            aria-label={`Role for ${displayName(membership)}`}
                            value={role?.id ?? ""}
                            disabled={busy}
                            onChange={(event) =>
                              void changeRole(membership, event.target.value)
                            }
                          >
                            <option value="">No role assigned</option>
                            {availableRoles.map((availableRole) => (
                              <option
                                key={availableRole.id}
                                value={availableRole.id}
                              >
                                {availableRole.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{role?.name ?? "No active role"}</span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`pill ${membership.membership_status}`}
                        >
                          {humanise(membership.membership_status)}
                        </span>
                      </td>

                      <td>
                        {formatDateTime(
                          membership.last_accessed_at ||
                            membership.profile?.last_seen_at ||
                            null,
                        )}
                      </td>

                      <td>
                        <span>
                          {membership.access_starts_at
                            ? formatDateTime(membership.access_starts_at)
                            : "Immediate"}
                        </span>
                        <small>
                          {membership.access_ends_at
                            ? `Ends ${formatDateTime(
                                membership.access_ends_at,
                              )}`
                            : "No scheduled end"}
                        </small>
                      </td>

                      <td>
                        <div className="actions">
                          {membership.membership_status === "active" ? (
                            <button
                              type="button"
                              className="link warning"
                              disabled={busy}
                              onClick={() =>
                                void changeMembershipStatus(
                                  membership,
                                  "suspended",
                                )
                              }
                            >
                              Suspend
                            </button>
                          ) : membership.membership_status === "suspended" ? (
                            <button
                              type="button"
                              className="link"
                              disabled={busy}
                              onClick={() =>
                                void changeMembershipStatus(
                                  membership,
                                  "active",
                                )
                              }
                            >
                              Reactivate
                            </button>
                          ) : null}

                          {membership.membership_status !== "ended" ? (
                            <button
                              type="button"
                              className="link danger"
                              disabled={busy}
                              onClick={() =>
                                void changeMembershipStatus(membership, "ended")
                              }
                            >
                              End access
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>{styles}</style>
    </section>
  );
}

const styles = `.people-access-workspace {
  display: grid;
  gap: 24px;
  color: #2f2635;
}

.people-access-workspace *,
.people-access-workspace *::before,
.people-access-workspace *::after {
  box-sizing: border-box;
}

.people-access-workspace .workspace-heading,
.people-access-workspace .panel-heading {
  display: flex;
  justify-content: space-between;
  gap: 28px;
  align-items: flex-start;
}

.people-access-workspace .workspace-heading {
  padding: 4px 2px 0;
}

.people-access-workspace .workspace-heading h2,
.people-access-workspace .panel-heading h3,
.people-access-workspace .invite-heading h3 {
  margin: 0;
  color: #2f2635;
  letter-spacing: -0.025em;
}

.people-access-workspace .workspace-heading h2 {
  font-size: clamp(1.65rem, 2vw, 2rem);
  line-height: 1.15;
}

.people-access-workspace .panel-heading h3,
.people-access-workspace .invite-heading h3 {
  font-size: 1.1rem;
  line-height: 1.3;
}

.people-access-workspace .workspace-heading p:not(.eyebrow),
.people-access-workspace .invite-heading p:not(.eyebrow),
.people-access-workspace .panel-heading p:not(.eyebrow) {
  margin: 9px 0 0;
  max-width: 760px;
  color: #716777;
  line-height: 1.65;
}

.people-access-workspace .eyebrow {
  margin: 0 0 8px;
  color: #6e5084;
  font-size: 0.74rem;
  font-weight: 850;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.people-access-workspace .heading-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.people-access-workspace button,
.people-access-workspace input,
.people-access-workspace select {
  font: inherit;
}

.people-access-workspace .primary,
.people-access-workspace .secondary,
.people-access-workspace .state button {
  min-height: 42px;
  padding: 0 17px;
  border-radius: 12px;
  font-weight: 800;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
  cursor: pointer;
}

.people-access-workspace .primary {
  border: 1px solid #6e5084;
  background: #6e5084;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(110, 80, 132, 0.16);
}

.people-access-workspace .primary:hover:not(:disabled) {
  background: #624676;
  border-color: #624676;
  box-shadow: 0 10px 22px rgba(110, 80, 132, 0.22);
  transform: translateY(-1px);
}

.people-access-workspace .secondary,
.people-access-workspace .state button {
  border: 1px solid #d9cbe2;
  background: #ffffff;
  color: #6e5084;
}

.people-access-workspace .secondary:hover:not(:disabled),
.people-access-workspace .state button:hover:not(:disabled) {
  border-color: #bca2cd;
  background: #faf7fc;
  transform: translateY(-1px);
}

.people-access-workspace .primary:focus-visible,
.people-access-workspace .secondary:focus-visible,
.people-access-workspace .state button:focus-visible,
.people-access-workspace .link:focus-visible,
.people-access-workspace input:focus-visible,
.people-access-workspace select:focus-visible {
  outline: 3px solid rgba(110, 80, 132, 0.18);
  outline-offset: 2px;
}

.people-access-workspace .primary:disabled,
.people-access-workspace .secondary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.people-access-workspace .invite-panel,
.people-access-workspace .panel {
  padding: 22px;
  border: 1px solid #e6ddea;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(75, 55, 84, 0.055);
}

.people-access-workspace .invite-panel {
  border-color: #ddcfe6;
  background:
    linear-gradient(135deg, rgba(247, 241, 252, 0.9), rgba(255, 255, 255, 0.98));
}

.people-access-workspace .invite-fields {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(220px, 0.8fr) auto;
  gap: 14px;
  align-items: end;
  margin-top: 20px;
}

.people-access-workspace .invite-fields label {
  display: grid;
  gap: 8px;
}

.people-access-workspace .invite-fields label span {
  color: #4b3f50;
  font-size: 0.84rem;
  font-weight: 800;
}

.people-access-workspace .invite-fields input,
.people-access-workspace .invite-fields select,
.people-access-workspace .toolbar input,
.people-access-workspace .toolbar select,
.people-access-workspace td select {
  width: 100%;
  min-height: 44px;
  border: 1px solid #d9cfdd;
  border-radius: 12px;
  background: #ffffff;
  padding: 0 13px;
  color: #332a37;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.people-access-workspace .invite-fields input:hover,
.people-access-workspace .invite-fields select:hover,
.people-access-workspace .toolbar input:hover,
.people-access-workspace .toolbar select:hover,
.people-access-workspace td select:hover {
  border-color: #c5b4ce;
}

.people-access-workspace .invite-fields input:focus,
.people-access-workspace .invite-fields select:focus,
.people-access-workspace .toolbar input:focus,
.people-access-workspace .toolbar select:focus,
.people-access-workspace td select:focus {
  border-color: #8a6b9f;
  box-shadow: 0 0 0 3px rgba(110, 80, 132, 0.1);
}

.people-access-workspace .send-button {
  white-space: nowrap;
}

.people-access-workspace .summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.people-access-workspace .summary-grid article {
  position: relative;
  min-height: 128px;
  overflow: hidden;
  padding: 20px;
  border: 1px solid #e6ddea;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(75, 55, 84, 0.055);
}

.people-access-workspace .summary-grid article::after {
  position: absolute;
  top: -34px;
  right: -34px;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: #f5eef9;
  content: "";
}

.people-access-workspace .summary-grid span,
.people-access-workspace .summary-grid small {
  position: relative;
  z-index: 1;
  display: block;
  color: #716777;
}

.people-access-workspace .summary-grid span {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.035em;
  text-transform: uppercase;
}

.people-access-workspace .summary-grid strong {
  position: relative;
  z-index: 1;
  display: block;
  margin: 9px 0 5px;
  color: #34293a;
  font-size: 1.9rem;
  line-height: 1;
}

.people-access-workspace .summary-grid small {
  font-size: 0.84rem;
  line-height: 1.45;
}

.people-access-workspace .notice {
  padding: 14px 16px;
  border: 1px solid transparent;
  border-radius: 14px;
  font-weight: 750;
  line-height: 1.5;
}

.people-access-workspace .notice.success {
  border-color: #cfe9da;
  background: #eef9f3;
  color: #246b46;
}

.people-access-workspace .notice.error,
.people-access-workspace .inline-error {
  border-color: #f1d0d6;
  background: #fff3f5;
  color: #963746;
}

.people-access-workspace .inline-error {
  display: grid;
  gap: 5px;
  padding: 14px 16px;
  border: 1px solid #f1d0d6;
  border-radius: 14px;
}

.people-access-workspace .empty-compact {
  padding: 24px;
  border: 1px dashed #d7c9df;
  border-radius: 16px;
  background: #fcfafc;
  color: #746a78;
  text-align: center;
}

.people-access-workspace .empty-compact p {
  margin: 0;
}

.people-access-workspace .invitation-list {
  display: grid;
  gap: 10px;
}

.people-access-workspace .invitation-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  padding: 15px 16px;
  border: 1px solid #ece5ee;
  border-radius: 14px;
  background: #ffffff;
}

.people-access-workspace .invitation-row strong,
.people-access-workspace .invitation-row span {
  display: block;
}

.people-access-workspace .invitation-row span {
  margin-top: 4px;
  color: #786e7c;
  font-size: 0.9rem;
}

.people-access-workspace .toolbar {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: end;
  margin: 18px 0;
  padding: 14px;
  border: 1px solid #e6ddea;
  border-radius: 16px;
  background: #faf8fb;
}

.people-access-workspace .toolbar label {
  display: grid;
  gap: 7px;
}

.people-access-workspace .toolbar label:first-child {
  flex: 1;
}

.people-access-workspace .toolbar label span {
  color: #5b4d60;
  font-size: 0.78rem;
  font-weight: 800;
}

.people-access-workspace .toolbar select {
  min-width: 200px;
}

.people-access-workspace .table-wrap {
  overflow: auto;
  border: 1px solid #e6ddea;
  border-radius: 17px;
  background: #ffffff;
}

.people-access-workspace table {
  width: 100%;
  min-width: 1040px;
  border-collapse: separate;
  border-spacing: 0;
}

.people-access-workspace th,
.people-access-workspace td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #eee7f0;
  vertical-align: middle;
}

.people-access-workspace th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #faf7fb;
  color: #685a6d;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.065em;
  text-transform: uppercase;
}

.people-access-workspace tbody tr {
  transition: background 140ms ease;
}

.people-access-workspace tbody tr:hover {
  background: #fdfbfe;
}

.people-access-workspace tbody tr:last-child td {
  border-bottom: 0;
}

.people-access-workspace td {
  color: #463b4a;
  font-size: 0.92rem;
}

.people-access-workspace td strong,
.people-access-workspace td small {
  display: block;
}

.people-access-workspace td strong {
  color: #302635;
  font-size: 0.94rem;
}

.people-access-workspace td small {
  margin-top: 4px;
  color: #817584;
  font-size: 0.8rem;
  line-height: 1.4;
}

.people-access-workspace .pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 850;
  line-height: 1;
}

.people-access-workspace .pill.active {
  background: #e7f7ee;
  color: #246b46;
}

.people-access-workspace .pill.invited {
  background: #f2ebf7;
  color: #6e5084;
}

.people-access-workspace .pill.suspended {
  background: #fff3dc;
  color: #8b5a13;
}

.people-access-workspace .pill.ended {
  background: #f0edf1;
  color: #6d6570;
}

.people-access-workspace .actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  align-items: center;
  white-space: nowrap;
}

.people-access-workspace .link {
  min-height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #6e5084;
  font-weight: 800;
  cursor: pointer;
}

.people-access-workspace .link:hover:not(:disabled) {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.people-access-workspace .link.warning {
  color: #8b5a13;
}

.people-access-workspace .link.danger {
  color: #a33f4c;
}

.people-access-workspace .link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.people-access-workspace .state {
  padding: 48px 26px;
  text-align: center;
  border: 1px dashed #d9cfdd;
  border-radius: 20px;
  background: #fcfafc;
}

.people-access-workspace .state > span {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: #f0e7f5;
  color: #6e5084;
  font-weight: 900;
}

.people-access-workspace .state h2,
.people-access-workspace .state h3 {
  margin: 0 0 8px;
}

.people-access-workspace .state p {
  margin: 0 auto 20px;
  max-width: 650px;
  color: #746a78;
  line-height: 1.6;
}

.people-access-workspace .state.error > span {
  background: #fff0f2;
  color: #9d3645;
}

.people-access-workspace .skeleton {
  border-radius: 16px;
  background: linear-gradient(
    90deg,
    #f3eef5 25%,
    #faf8fb 50%,
    #f3eef5 75%
  );
  background-size: 200% 100%;
  animation: peopleAccessPulse 1.4s infinite;
}

.people-access-workspace .skeleton.heading {
  width: min(70%, 720px);
  height: 78px;
}

.people-access-workspace .skeleton.summary {
  height: 128px;
}

.people-access-workspace .skeleton.table {
  height: 330px;
}

@keyframes peopleAccessPulse {
  to {
    background-position: -200% 0;
  }
}

.people-access-workspace .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 980px) {
  .people-access-workspace .invite-fields {
    grid-template-columns: 1fr 1fr;
  }

  .people-access-workspace .send-button {
    grid-column: 1 / -1;
  }

  .people-access-workspace .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .people-access-workspace .workspace-heading,
  .people-access-workspace .panel-heading,
  .people-access-workspace .invitation-row {
    display: grid;
  }

  .people-access-workspace .heading-actions {
    justify-content: flex-start;
  }

  .people-access-workspace .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .people-access-workspace .toolbar select {
    min-width: 0;
  }

  .people-access-workspace .invite-fields {
    grid-template-columns: 1fr;
  }

  .people-access-workspace .send-button {
    grid-column: auto;
  }

  .people-access-workspace .actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 560px) {
  .people-access-workspace {
    gap: 18px;
  }

  .people-access-workspace .invite-panel,
  .people-access-workspace .panel {
    padding: 18px;
    border-radius: 17px;
  }

  .people-access-workspace .summary-grid {
    grid-template-columns: 1fr;
  }

  .people-access-workspace .heading-actions {
    width: 100%;
  }

  .people-access-workspace .heading-actions .primary,
  .people-access-workspace .heading-actions .secondary {
    flex: 1;
  }
}
`;