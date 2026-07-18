"use client";

import {
  AlertCircle,
  CalendarClock,
  Car,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Gauge,
  History,
  Loader2,
  LockKeyhole,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type VehicleDetailsMode =
  | "candidate"
  | "employee";

export type VehicleOwnershipType =
  | ""
  | "employee_owned"
  | "company_owned"
  | "company_leased"
  | "salary_sacrifice"
  | "rental"
  | "pool_vehicle"
  | "other";

export type VehicleStatus =
  | "not_assessed"
  | "awaiting_details"
  | "awaiting_evidence"
  | "under_review"
  | "approved"
  | "follow_up_required"
  | "suspended"
  | "expired"
  | "not_required";

export type VehicleFuelType =
  | ""
  | "petrol"
  | "diesel"
  | "electric"
  | "hybrid"
  | "plug_in_hybrid"
  | "hydrogen"
  | "lpg"
  | "other";

export type VehicleBodyType =
  | ""
  | "car"
  | "van"
  | "motorcycle"
  | "minibus"
  | "lorry"
  | "specialist_vehicle"
  | "other";

export type VehicleEvidenceType =
  | "registration_document"
  | "insurance"
  | "mot"
  | "vehicle_tax"
  | "service_record"
  | "lease_agreement"
  | "rental_agreement"
  | "roadworthiness_check"
  | "damage_record"
  | "other";

export type VehicleEvidence = {
  id: string;
  evidenceType: VehicleEvidenceType;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  filePath?: string;
  uploadedAt: string;
  uploadedBy?: string;
  description?: string;
  current: boolean;
};

export type VehicleInspectionHistoryEntry = {
  id: string;
  inspectedAt: string;
  inspectedBy: string;
  status: VehicleStatus;
  mileage?: number | null;
  roadworthy?: boolean;
  defectsFound?: boolean;
  defectsSummary?: string;
  followUpDate?: string;
  notes?: string;
};

export type VehicleDetailsValue = {
  status: VehicleStatus;

  vehicleRequiredForRole: boolean;
  vehicleUsedForBusiness: boolean;
  primaryBusinessVehicle: boolean;
  vehicleCurrentlyInUse: boolean;

  ownershipType: VehicleOwnershipType;
  allocatedToPerson: boolean;
  allocationStartDate: string;
  allocationEndDate: string;

  registrationNumber: string;
  make: string;
  model: string;
  bodyType: VehicleBodyType;
  colour: string;
  yearOfManufacture: number | null;
  fuelType: VehicleFuelType;
  numberOfSeats: number | null;

  vehicleIdentificationNumber: string;
  fleetReference: string;
  leaseReference: string;

  currentMileage: number | null;
  mileageRecordedDate: string;
  annualMileageEstimate: number | null;
  businessMileageEstimate: number | null;

  insuranceVerified: boolean;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceStartDate: string;
  insuranceExpiryDate: string;
  businessUseCovered: boolean;
  permittedDrivers: string;

  motRequired: boolean;
  motVerified: boolean;
  motExpiryDate: string;

  vehicleTaxVerified: boolean;
  vehicleTaxExpiryDate: string;

  serviceRequired: boolean;
  lastServiceDate: string;
  nextServiceDate: string;
  serviceMileageInterval: number | null;
  nextServiceMileage: number | null;

  roadworthinessConfirmed: boolean;
  roadworthinessCheckDate: string;
  roadworthinessCheckedBy: string;

  defectsReported: boolean;
  defectsSummary: string;
  vehicleUseSuspended: boolean;
  suspensionReason: string;
  suspensionDate: string;

  accidentOrDamageRecorded: boolean;
  accidentOrDamageSummary: string;

  telematicsInstalled: boolean;
  trackerReference: string;

  parkingPermitRequired: boolean;
  parkingPermitReference: string;
  parkingPermitExpiryDate: string;

  congestionOrCleanAirRegistered: boolean;
  cleanAirNotes: string;

  nextReviewDate: string;
  notes: string;

  evidence: VehicleEvidence[];
  inspectionHistory: VehicleInspectionHistoryEntry[];
};

export type VehicleDetailsPermissions = {
  canView: boolean;
  canEdit: boolean;

  canViewRegistrationNumber: boolean;
  canEditRegistrationNumber: boolean;

  canViewVIN: boolean;
  canEditVIN: boolean;

  canViewInsuranceInformation: boolean;
  canEditInsuranceInformation: boolean;

  canViewTrackerInformation: boolean;
  canEditTrackerInformation: boolean;

  canViewAccidentInformation: boolean;
  canEditAccidentInformation: boolean;

  canApproveVehicle: boolean;
  canSuspendVehicleUse: boolean;

  canViewEvidence: boolean;
  canUploadEvidence: boolean;
  canDeleteEvidence: boolean;

  canViewHistory: boolean;
};

export type VehicleDetailsAuditEvent = {
  action:
    | "vehicle_edit_started"
    | "vehicle_edit_cancelled"
    | "vehicle_saved"
    | "vehicle_evidence_selected"
    | "vehicle_evidence_removed"
    | "vehicle_inspection_recorded"
    | "vehicle_approved"
    | "vehicle_use_suspended"
    | "vehicle_use_reinstated";
  mode: VehicleDetailsMode;
  recordId?: string | number;
  changedFields?: string[];
  evidenceId?: string;
  occurredAt: string;
};

export type VehicleDetailsSavePayload = {
  value: VehicleDetailsValue;
  changedFields: string[];
  newFiles: Array<{
    file: File;
    evidenceType: VehicleEvidenceType;
  }>;
  removedEvidenceIds: string[];
};

export type VehicleDetailsProps = {
  mode: VehicleDetailsMode;
  value?: Partial<VehicleDetailsValue>;
  recordId?: string | number;
  recordLabel?: string;
  permissions?: Partial<VehicleDetailsPermissions>;

  saving?: boolean;
  disabled?: boolean;
  startInEditMode?: boolean;

  errorMessage?: string | null;
  successMessage?: string | null;

  headerActions?: ReactNode;

  onSave?: (
    payload: VehicleDetailsSavePayload,
  ) => Promise<void> | void;

  onCancel?: () => void;

  onAudit?: (
    event: VehicleDetailsAuditEvent,
  ) => Promise<void> | void;
};

type ValidationErrors = Partial<
  Record<keyof VehicleDetailsValue, string>
>;

type PendingFile = {
  id: string;
  file: File;
  evidenceType: VehicleEvidenceType;
};

const EMPTY_VALUE: VehicleDetailsValue = {
  status: "not_assessed",

  vehicleRequiredForRole: false,
  vehicleUsedForBusiness: false,
  primaryBusinessVehicle: false,
  vehicleCurrentlyInUse: false,

  ownershipType: "",
  allocatedToPerson: false,
  allocationStartDate: "",
  allocationEndDate: "",

  registrationNumber: "",
  make: "",
  model: "",
  bodyType: "",
  colour: "",
  yearOfManufacture: null,
  fuelType: "",
  numberOfSeats: null,

  vehicleIdentificationNumber: "",
  fleetReference: "",
  leaseReference: "",

  currentMileage: null,
  mileageRecordedDate: "",
  annualMileageEstimate: null,
  businessMileageEstimate: null,

  insuranceVerified: false,
  insuranceProvider: "",
  insurancePolicyNumber: "",
  insuranceStartDate: "",
  insuranceExpiryDate: "",
  businessUseCovered: false,
  permittedDrivers: "",

  motRequired: false,
  motVerified: false,
  motExpiryDate: "",

  vehicleTaxVerified: false,
  vehicleTaxExpiryDate: "",

  serviceRequired: false,
  lastServiceDate: "",
  nextServiceDate: "",
  serviceMileageInterval: null,
  nextServiceMileage: null,

  roadworthinessConfirmed: false,
  roadworthinessCheckDate: "",
  roadworthinessCheckedBy: "",

  defectsReported: false,
  defectsSummary: "",
  vehicleUseSuspended: false,
  suspensionReason: "",
  suspensionDate: "",

  accidentOrDamageRecorded: false,
  accidentOrDamageSummary: "",

  telematicsInstalled: false,
  trackerReference: "",

  parkingPermitRequired: false,
  parkingPermitReference: "",
  parkingPermitExpiryDate: "",

  congestionOrCleanAirRegistered: false,
  cleanAirNotes: "",

  nextReviewDate: "",
  notes: "",

  evidence: [],
  inspectionHistory: [],
};

const DEFAULT_PERMISSIONS: VehicleDetailsPermissions =
  {
    canView: true,
    canEdit: true,

    canViewRegistrationNumber: true,
    canEditRegistrationNumber: true,

    canViewVIN: true,
    canEditVIN: true,

    canViewInsuranceInformation: true,
    canEditInsuranceInformation: true,

    canViewTrackerInformation: true,
    canEditTrackerInformation: true,

    canViewAccidentInformation: true,
    canEditAccidentInformation: true,

    canApproveVehicle: true,
    canSuspendVehicleUse: true,

    canViewEvidence: true,
    canUploadEvidence: true,
    canDeleteEvidence: true,

    canViewHistory: true,
  };

const STATUS_OPTIONS: Array<{
  value: VehicleStatus;
  label: string;
}> = [
  {
    value: "not_assessed",
    label: "Not assessed",
  },
  {
    value: "awaiting_details",
    label: "Awaiting details",
  },
  {
    value: "awaiting_evidence",
    label: "Awaiting evidence",
  },
  {
    value: "under_review",
    label: "Under review",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "follow_up_required",
    label: "Follow-up required",
  },
  {
    value: "suspended",
    label: "Use suspended",
  },
  {
    value: "expired",
    label: "Expired",
  },
  {
    value: "not_required",
    label: "Not required",
  },
];

const OWNERSHIP_OPTIONS: Array<{
  value: VehicleOwnershipType;
  label: string;
}> = [
  {
    value: "",
    label: "Select ownership type",
  },
  {
    value: "employee_owned",
    label: "Employee owned",
  },
  {
    value: "company_owned",
    label: "Company owned",
  },
  {
    value: "company_leased",
    label: "Company leased",
  },
  {
    value: "salary_sacrifice",
    label: "Salary sacrifice",
  },
  {
    value: "rental",
    label: "Rental vehicle",
  },
  {
    value: "pool_vehicle",
    label: "Pool vehicle",
  },
  {
    value: "other",
    label: "Other",
  },
];

const BODY_TYPE_OPTIONS: Array<{
  value: VehicleBodyType;
  label: string;
}> = [
  {
    value: "",
    label: "Select vehicle type",
  },
  {
    value: "car",
    label: "Car",
  },
  {
    value: "van",
    label: "Van",
  },
  {
    value: "motorcycle",
    label: "Motorcycle",
  },
  {
    value: "minibus",
    label: "Minibus",
  },
  {
    value: "lorry",
    label: "Lorry",
  },
  {
    value: "specialist_vehicle",
    label: "Specialist vehicle",
  },
  {
    value: "other",
    label: "Other",
  },
];

const FUEL_TYPE_OPTIONS: Array<{
  value: VehicleFuelType;
  label: string;
}> = [
  {
    value: "",
    label: "Select fuel type",
  },
  {
    value: "petrol",
    label: "Petrol",
  },
  {
    value: "diesel",
    label: "Diesel",
  },
  {
    value: "electric",
    label: "Electric",
  },
  {
    value: "hybrid",
    label: "Hybrid",
  },
  {
    value: "plug_in_hybrid",
    label: "Plug-in hybrid",
  },
  {
    value: "hydrogen",
    label: "Hydrogen",
  },
  {
    value: "lpg",
    label: "LPG",
  },
  {
    value: "other",
    label: "Other",
  },
];

const EVIDENCE_TYPE_OPTIONS: Array<{
  value: VehicleEvidenceType;
  label: string;
}> = [
  {
    value: "registration_document",
    label: "Registration document",
  },
  {
    value: "insurance",
    label: "Insurance",
  },
  {
    value: "mot",
    label: "MOT",
  },
  {
    value: "vehicle_tax",
    label: "Vehicle tax",
  },
  {
    value: "service_record",
    label: "Service record",
  },
  {
    value: "lease_agreement",
    label: "Lease agreement",
  },
  {
    value: "rental_agreement",
    label: "Rental agreement",
  },
  {
    value: "roadworthiness_check",
    label: "Roadworthiness check",
  },
  {
    value: "damage_record",
    label: "Accident or damage record",
  },
  {
    value: "other",
    label: "Other",
  },
];

function normaliseValue(
  value?: Partial<VehicleDetailsValue>,
): VehicleDetailsValue {
  return {
    ...EMPTY_VALUE,
    ...value,
    evidence: value?.evidence ?? [],
    inspectionHistory:
      value?.inspectionHistory ?? [],
  };
}

function normaliseComparableValue(
  value: VehicleDetailsValue,
): VehicleDetailsValue {
  return {
    ...value,

    registrationNumber:
      value.registrationNumber
        .trim()
        .toUpperCase(),

    make: value.make.trim(),
    model: value.model.trim(),
    colour: value.colour.trim(),

    vehicleIdentificationNumber:
      value.vehicleIdentificationNumber
        .trim()
        .toUpperCase(),

    fleetReference:
      value.fleetReference.trim(),

    leaseReference:
      value.leaseReference.trim(),

    insuranceProvider:
      value.insuranceProvider.trim(),

    insurancePolicyNumber:
      value.insurancePolicyNumber.trim(),

    permittedDrivers:
      value.permittedDrivers.trim(),

    roadworthinessCheckedBy:
      value.roadworthinessCheckedBy.trim(),

    defectsSummary:
      value.defectsSummary.trim(),

    suspensionReason:
      value.suspensionReason.trim(),

    accidentOrDamageSummary:
      value.accidentOrDamageSummary.trim(),

    trackerReference:
      value.trackerReference.trim(),

    parkingPermitReference:
      value.parkingPermitReference.trim(),

    cleanAirNotes:
      value.cleanAirNotes.trim(),

    notes: value.notes.trim(),
  };
}

function getChangedFields(
  original: VehicleDetailsValue,
  current: VehicleDetailsValue,
): string[] {
  const originalNormalised =
    normaliseComparableValue(original);

  const currentNormalised =
    normaliseComparableValue(current);

  const comparableKeys: Array<
    keyof VehicleDetailsValue
  > = [
    "status",

    "vehicleRequiredForRole",
    "vehicleUsedForBusiness",
    "primaryBusinessVehicle",
    "vehicleCurrentlyInUse",

    "ownershipType",
    "allocatedToPerson",
    "allocationStartDate",
    "allocationEndDate",

    "registrationNumber",
    "make",
    "model",
    "bodyType",
    "colour",
    "yearOfManufacture",
    "fuelType",
    "numberOfSeats",

    "vehicleIdentificationNumber",
    "fleetReference",
    "leaseReference",

    "currentMileage",
    "mileageRecordedDate",
    "annualMileageEstimate",
    "businessMileageEstimate",

    "insuranceVerified",
    "insuranceProvider",
    "insurancePolicyNumber",
    "insuranceStartDate",
    "insuranceExpiryDate",
    "businessUseCovered",
    "permittedDrivers",

    "motRequired",
    "motVerified",
    "motExpiryDate",

    "vehicleTaxVerified",
    "vehicleTaxExpiryDate",

    "serviceRequired",
    "lastServiceDate",
    "nextServiceDate",
    "serviceMileageInterval",
    "nextServiceMileage",

    "roadworthinessConfirmed",
    "roadworthinessCheckDate",
    "roadworthinessCheckedBy",

    "defectsReported",
    "defectsSummary",
    "vehicleUseSuspended",
    "suspensionReason",
    "suspensionDate",

    "accidentOrDamageRecorded",
    "accidentOrDamageSummary",

    "telematicsInstalled",
    "trackerReference",

    "parkingPermitRequired",
    "parkingPermitReference",
    "parkingPermitExpiryDate",

    "congestionOrCleanAirRegistered",
    "cleanAirNotes",

    "nextReviewDate",
    "notes",
  ];

  return comparableKeys.filter(
    (key) =>
      originalNormalised[key] !==
      currentNormalised[key],
  );
}

function validateValue(
  value: VehicleDetailsValue,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const vehicleRelevant =
    value.vehicleRequiredForRole ||
    value.vehicleUsedForBusiness ||
    value.vehicleCurrentlyInUse ||
    value.allocatedToPerson;

  if (
    vehicleRelevant &&
    value.status === "not_required"
  ) {
    errors.status =
      "A vehicle in use cannot be marked as not required.";
  }

  if (
    vehicleRelevant &&
    !value.ownershipType
  ) {
    errors.ownershipType =
      "Select the vehicle ownership type.";
  }

  if (
    vehicleRelevant &&
    !value.registrationNumber.trim()
  ) {
    errors.registrationNumber =
      "Enter the vehicle registration number.";
  }

  if (
    vehicleRelevant &&
    !value.make.trim()
  ) {
    errors.make =
      "Enter the vehicle manufacturer.";
  }

  if (
    vehicleRelevant &&
    !value.model.trim()
  ) {
    errors.model =
      "Enter the vehicle model.";
  }

  if (
    value.yearOfManufacture !== null &&
    (value.yearOfManufacture < 1900 ||
      value.yearOfManufacture >
        new Date().getFullYear() + 1)
  ) {
    errors.yearOfManufacture =
      "Enter a valid year of manufacture.";
  }

  if (
    value.numberOfSeats !== null &&
    (value.numberOfSeats < 1 ||
      value.numberOfSeats > 100)
  ) {
    errors.numberOfSeats =
      "Enter a valid number of seats.";
  }

  if (
    value.allocationStartDate &&
    value.allocationEndDate &&
    value.allocationEndDate <
      value.allocationStartDate
  ) {
    errors.allocationEndDate =
      "The allocation end date cannot be before the start date.";
  }

  if (
    value.insuranceVerified &&
    !value.insuranceExpiryDate
  ) {
    errors.insuranceExpiryDate =
      "Enter the insurance expiry date.";
  }

  if (
    value.insuranceStartDate &&
    value.insuranceExpiryDate &&
    value.insuranceExpiryDate <
      value.insuranceStartDate
  ) {
    errors.insuranceExpiryDate =
      "The insurance expiry date cannot be before the start date.";
  }

  if (
    value.vehicleUsedForBusiness &&
    !value.businessUseCovered
  ) {
    errors.businessUseCovered =
      "Confirm that the insurance covers the required business use.";
  }

  if (
    value.motRequired &&
    value.motVerified &&
    !value.motExpiryDate
  ) {
    errors.motExpiryDate =
      "Enter the MOT expiry date.";
  }

  if (
    value.serviceRequired &&
    !value.nextServiceDate &&
    value.nextServiceMileage === null
  ) {
    errors.nextServiceDate =
      "Enter either the next service date or next service mileage.";
  }

  if (
    value.roadworthinessConfirmed &&
    !value.roadworthinessCheckDate
  ) {
    errors.roadworthinessCheckDate =
      "Enter the roadworthiness check date.";
  }

  if (
    value.roadworthinessConfirmed &&
    !value.roadworthinessCheckedBy.trim()
  ) {
    errors.roadworthinessCheckedBy =
      "Enter who completed the roadworthiness check.";
  }

  if (
    value.defectsReported &&
    !value.defectsSummary.trim()
  ) {
    errors.defectsSummary =
      "Record the defects identified.";
  }

  if (
    value.vehicleUseSuspended &&
    !value.suspensionReason.trim()
  ) {
    errors.suspensionReason =
      "Record why use of the vehicle was suspended.";
  }

  if (
    value.vehicleUseSuspended &&
    !value.suspensionDate
  ) {
    errors.suspensionDate =
      "Enter the suspension date.";
  }

  if (
    value.accidentOrDamageRecorded &&
    !value.accidentOrDamageSummary.trim()
  ) {
    errors.accidentOrDamageSummary =
      "Record concise details of the accident or damage.";
  }

  if (
    value.telematicsInstalled &&
    !value.trackerReference.trim()
  ) {
    errors.trackerReference =
      "Enter the tracker or telematics reference.";
  }

  if (
    value.parkingPermitRequired &&
    !value.parkingPermitReference.trim()
  ) {
    errors.parkingPermitReference =
      "Enter the parking permit reference.";
  }

  return errors;
}

function formatDate(value?: string): string {
  if (!value) {
    return "Not recorded";
  }

  const parsed = new Date(
    `${value}T00:00:00`,
  );

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(
  value: string,
): string {
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

function formatFileSize(
  fileSizeBytes: number,
): string {
  if (fileSizeBytes < 1024) {
    return `${fileSizeBytes} B`;
  }

  if (fileSizeBytes < 1024 * 1024) {
    return `${(
      fileSizeBytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    fileSizeBytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatNumber(
  value: number | null,
): string {
  if (value === null) {
    return "";
  }

  return new Intl.NumberFormat(
    "en-GB",
  ).format(value);
}

function getStatusLabel(
  value: VehicleStatus,
): string {
  return (
    STATUS_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? value
  );
}

function getOwnershipLabel(
  value: VehicleOwnershipType,
): string {
  return (
    OWNERSHIP_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? "Not recorded"
  );
}

function getBodyTypeLabel(
  value: VehicleBodyType,
): string {
  return (
    BODY_TYPE_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? "Not recorded"
  );
}

function getFuelTypeLabel(
  value: VehicleFuelType,
): string {
  return (
    FUEL_TYPE_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? "Not recorded"
  );
}

function getEvidenceTypeLabel(
  value: VehicleEvidenceType,
): string {
  return (
    EVIDENCE_TYPE_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? value
  );
}

function getStatusAppearance(
  status: VehicleStatus,
): {
  background: string;
  border: string;
  color: string;
  icon: ReactNode;
} {
  switch (status) {
    case "approved":
      return {
        background: "#F2FAF5",
        border: "#CFE6D8",
        color: "#4E765F",
        icon: <CheckCircle2 size={14} />,
      };

    case "awaiting_details":
    case "awaiting_evidence":
    case "under_review":
    case "follow_up_required":
      return {
        background: "#FBF8F2",
        border: "#E7DCC6",
        color: "#806C46",
        icon: <Clock3 size={14} />,
      };

    case "suspended":
    case "expired":
      return {
        background: "#FFF7F8",
        border: "#E8CBD2",
        color: "#8B4E5D",
        icon: <AlertCircle size={14} />,
      };

    case "not_required":
      return {
        background: "#F5F4F6",
        border: "#DFDBE2",
        color: "#6F6773",
        icon: <Check size={14} />,
      };

    case "not_assessed":
    default:
      return {
        background: "#F8F5FA",
        border: "#E1D8E6",
        color: "#746A79",
        icon: <ShieldCheck size={14} />,
      };
  }
}

function FieldLabel({
  children,
  required,
  sensitive,
}: {
  children: ReactNode;
  required?: boolean;
  sensitive?: boolean;
}) {
  return (
    <label style={styles.fieldLabel}>
      <span>{children}</span>

      {required ? (
        <span style={styles.requiredMark}>
          *
        </span>
      ) : null}

      {sensitive ? (
        <span style={styles.sensitiveLabel}>
          <LockKeyhole size={11} />
          Restricted
        </span>
      ) : null}
    </label>
  );
}

function FieldError({
  message,
}: {
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="alert"
      style={styles.fieldError}
    >
      <AlertCircle size={12} />
      {message}
    </p>
  );
}

function ReadOnlyValue({
  value,
  fallback = "Not recorded",
  restricted = false,
}: {
  value?: string;
  fallback?: string;
  restricted?: boolean;
}) {
  if (restricted) {
    return (
      <span style={styles.restrictedValue}>
        <LockKeyhole size={13} />
        Restricted
      </span>
    );
  }

  return (
    <span
      style={{
        ...styles.readOnlyValue,
        ...(!value
          ? styles.readOnlyEmpty
          : {}),
      }}
    >
      {value || fallback}
    </span>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <header style={styles.sectionHeader}>
      <span style={styles.sectionIcon}>
        {icon}
      </span>

      <div>
        <h3 style={styles.sectionTitle}>
          {title}
        </h3>

        <p style={styles.sectionDescription}>
          {description}
        </p>
      </div>
    </header>
  );
}

function CheckboxField({
  checked,
  label,
  description,
  disabled,
  onChange,
}: {
  checked: boolean;
  label: string;
  description?: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={styles.checkboxCard}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        disabled={disabled}
      />

      <span>
        <strong style={styles.checkboxTitle}>
          {label}
        </strong>

        {description ? (
          <span
            style={
              styles.checkboxDescription
            }
          >
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export default function VehicleDetails({
  mode,
  value,
  recordId,
  recordLabel,
  permissions,
  saving = false,
  disabled = false,
  startInEditMode = false,
  errorMessage,
  successMessage,
  headerActions,
  onSave,
  onCancel,
  onAudit,
}: VehicleDetailsProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [
    selectedEvidenceType,
    setSelectedEvidenceType,
  ] =
    useState<VehicleEvidenceType>(
      "registration_document",
    );

  const resolvedPermissions = useMemo(
    () => ({
      ...DEFAULT_PERMISSIONS,
      ...permissions,
    }),
    [permissions],
  );

  const suppliedValue = useMemo(
    () => normaliseValue(value),
    [value],
  );

  const [originalValue, setOriginalValue] =
    useState<VehicleDetailsValue>(
      suppliedValue,
    );

  const [draft, setDraft] =
    useState<VehicleDetailsValue>(
      suppliedValue,
    );

  const [editing, setEditing] = useState(
    startInEditMode &&
      resolvedPermissions.canEdit,
  );

  const [
    validationErrors,
    setValidationErrors,
  ] = useState<ValidationErrors>({});

  const [
    pendingFiles,
    setPendingFiles,
  ] = useState<PendingFile[]>([]);

  const [
    removedEvidenceIds,
    setRemovedEvidenceIds,
  ] = useState<string[]>([]);

  const [localSaving, setLocalSaving] =
    useState(false);

  const isSaving = saving || localSaving;
  const isDisabled =
    disabled || isSaving;

  useEffect(() => {
    setOriginalValue(suppliedValue);
    setDraft(suppliedValue);
    setValidationErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
  }, [suppliedValue]);

  const changedFields = useMemo(
    () =>
      getChangedFields(
        originalValue,
        draft,
      ),
    [draft, originalValue],
  );

  const isDirty =
    changedFields.length > 0 ||
    pendingFiles.length > 0 ||
    removedEvidenceIds.length > 0;

  const statusAppearance =
    getStatusAppearance(draft.status);

  const visibleEvidence =
    draft.evidence.filter(
      (item) =>
        !removedEvidenceIds.includes(
          item.id,
        ),
    );

  async function recordAudit(
    action:
      VehicleDetailsAuditEvent["action"],
    options?: {
      changedFields?: string[];
      evidenceId?: string;
    },
  ) {
    if (!onAudit) {
      return;
    }

    await onAudit({
      action,
      mode,
      recordId,
      changedFields:
        options?.changedFields,
      evidenceId: options?.evidenceId,
      occurredAt: new Date().toISOString(),
    });
  }

  function updateField<
    Key extends keyof VehicleDetailsValue,
  >(
    key: Key,
    nextValue: VehicleDetailsValue[Key],
  ) {
    setDraft((current) => ({
      ...current,
      [key]: nextValue,
    }));

    setValidationErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const nextErrors = {
        ...current,
      };

      delete nextErrors[key];

      return nextErrors;
    });
  }

  async function beginEditing() {
    if (
      !resolvedPermissions.canEdit ||
      isDisabled
    ) {
      return;
    }

    setEditing(true);

    await recordAudit(
      "vehicle_edit_started",
    );
  }

  async function cancelEditing() {
    setDraft(originalValue);
    setValidationErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
    setEditing(false);

    onCancel?.();

    await recordAudit(
      "vehicle_edit_cancelled",
    );
  }

  function resetChanges() {
    setDraft(originalValue);
    setValidationErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
  }

  async function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFiles = Array.from(
      event.target.files ?? [],
    );

    if (selectedFiles.length === 0) {
      return;
    }

    const allowedFiles =
      selectedFiles.filter(
        (file) =>
          file.size <=
          15 * 1024 * 1024,
      );

    setPendingFiles((current) => [
      ...current,
      ...allowedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        evidenceType:
          selectedEvidenceType,
      })),
    ]);

    await recordAudit(
      "vehicle_evidence_selected",
    );

    event.target.value = "";
  }

  function removePendingFile(
    id: string,
  ) {
    setPendingFiles((current) =>
      current.filter(
        (item) => item.id !== id,
      ),
    );
  }

  async function removeExistingEvidence(
    evidenceId: string,
  ) {
    if (
      !resolvedPermissions.canDeleteEvidence ||
      isDisabled
    ) {
      return;
    }

    setRemovedEvidenceIds((current) => [
      ...current,
      evidenceId,
    ]);

    await recordAudit(
      "vehicle_evidence_removed",
      {
        evidenceId,
      },
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !resolvedPermissions.canEdit ||
      isDisabled ||
      !onSave
    ) {
      return;
    }

    const errors =
      validateValue(draft);

    if (
      Object.keys(errors).length > 0
    ) {
      setValidationErrors(errors);
      return;
    }

    const cleanValue =
      normaliseComparableValue(draft);

    const fields = getChangedFields(
      originalValue,
      cleanValue,
    );

    if (
      fields.length === 0 &&
      pendingFiles.length === 0 &&
      removedEvidenceIds.length === 0
    ) {
      setEditing(false);
      return;
    }

    try {
      setLocalSaving(true);

      await onSave({
        value: cleanValue,
        changedFields: fields,
        newFiles: pendingFiles.map(
          (item) => ({
            file: item.file,
            evidenceType:
              item.evidenceType,
          }),
        ),
        removedEvidenceIds,
      });

      setOriginalValue(cleanValue);
      setDraft(cleanValue);
      setPendingFiles([]);
      setRemovedEvidenceIds([]);
      setValidationErrors({});
      setEditing(false);

      await recordAudit(
        "vehicle_saved",
        {
          changedFields: fields,
        },
      );

      if (
        fields.some((field) =>
          [
            "roadworthinessConfirmed",
            "roadworthinessCheckDate",
            "roadworthinessCheckedBy",
            "currentMileage",
            "defectsReported",
            "defectsSummary",
          ].includes(field),
        )
      ) {
        await recordAudit(
          "vehicle_inspection_recorded",
          {
            changedFields: fields,
          },
        );
      }

      if (
        fields.includes("status") &&
        cleanValue.status === "approved"
      ) {
        await recordAudit(
          "vehicle_approved",
          {
            changedFields: fields,
          },
        );
      }

      if (
        fields.includes(
          "vehicleUseSuspended",
        )
      ) {
        await recordAudit(
          cleanValue.vehicleUseSuspended
            ? "vehicle_use_suspended"
            : "vehicle_use_reinstated",
          {
            changedFields: fields,
          },
        );
      }
    } finally {
      setLocalSaving(false);
    }
  }

  if (
    !resolvedPermissions.canView
  ) {
    return (
      <section
        style={styles.accessCard}
      >
        <span style={styles.accessIcon}>
          <LockKeyhole size={20} />
        </span>

        <div>
          <h2
            style={styles.accessTitle}
          >
            Vehicle information is
            restricted
          </h2>

          <p
            style={styles.accessText}
          >
            Your current permission level
            does not allow access to this
            record.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.card}>
      <header
        style={styles.cardHeader}
      >
        <div style={styles.identity}>
          <span
            style={styles.identityIcon}
          >
            <Car size={21} />
          </span>

          <div style={{ minWidth: 0 }}>
            <div
              style={styles.titleRow}
            >
              <h2
                style={styles.cardTitle}
              >
                Vehicle
              </h2>

              <span
                style={{
                  ...styles.statusBadge,
                  background:
                    statusAppearance.background,
                  borderColor:
                    statusAppearance.border,
                  color:
                    statusAppearance.color,
                }}
              >
                {statusAppearance.icon}
                {getStatusLabel(
                  draft.status,
                )}
              </span>
            </div>

            <p
              style={styles.cardSubtitle}
            >
              {recordLabel ||
                (mode === "candidate"
                  ? "Candidate record"
                  : "Employee record")}

              {recordId !== undefined
                ? ` · Record ${String(
                    recordId,
                  )}`
                : ""}
            </p>
          </div>
        </div>

        <div
          style={styles.headerActions}
        >
          {headerActions}

          {!editing &&
          resolvedPermissions.canEdit ? (
            <button
              type="button"
              style={
                styles.secondaryButton
              }
              onClick={beginEditing}
              disabled={isDisabled}
            >
              <Pencil size={15} />
              Edit vehicle
            </button>
          ) : null}
        </div>
      </header>

      {errorMessage ? (
        <div
          role="alert"
          style={styles.errorBanner}
        >
          <AlertCircle size={17} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          style={styles.successBanner}
        >
          <Check size={17} />
          <span>{successMessage}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div style={styles.content}>
          <section
            style={styles.section}
          >
            <SectionHeader
              icon={<Car size={18} />}
              title="Vehicle use and allocation"
              description="Record why the vehicle is held, how it is used and whether it is allocated to this person."
            />

            <div
              style={styles.formGrid}
            >
              <div style={styles.field}>
                <FieldLabel>
                  Vehicle status
                </FieldLabel>

                {editing ? (
                  <>
                    <select
                      value={draft.status}
                      onChange={(event) =>
                        updateField(
                          "status",
                          event.target
                            .value as VehicleStatus,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.status
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={
                        isDisabled ||
                        (draft.status ===
                          "approved" &&
                          !resolvedPermissions.canApproveVehicle)
                      }
                    >
                      {STATUS_OPTIONS.map(
                        (option) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>

                    <FieldError
                      message={
                        validationErrors.status
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={getStatusLabel(
                      draft.status,
                    )}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Ownership type
                </FieldLabel>

                {editing ? (
                  <>
                    <select
                      value={
                        draft.ownershipType
                      }
                      onChange={(event) =>
                        updateField(
                          "ownershipType",
                          event.target
                            .value as VehicleOwnershipType,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.ownershipType
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    >
                      {OWNERSHIP_OPTIONS.map(
                        (option) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>

                    <FieldError
                      message={
                        validationErrors.ownershipType
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={getOwnershipLabel(
                      draft.ownershipType,
                    )}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Allocation start date
                </FieldLabel>

                {editing ? (
                  <input
                    type="date"
                    value={
                      draft.allocationStartDate
                    }
                    onChange={(event) =>
                      updateField(
                        "allocationStartDate",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={
                      isDisabled ||
                      !draft.allocatedToPerson
                    }
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.allocationStartDate
                        ? formatDate(
                            draft.allocationStartDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Allocation end date
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="date"
                      value={
                        draft.allocationEndDate
                      }
                      onChange={(event) =>
                        updateField(
                          "allocationEndDate",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.allocationEndDate
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={
                        isDisabled ||
                        !draft.allocatedToPerson
                      }
                    />

                    <FieldError
                      message={
                        validationErrors.allocationEndDate
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.allocationEndDate
                        ? formatDate(
                            draft.allocationEndDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>
            </div>

            <div
              style={styles.checkboxGrid}
            >
              {editing ? (
                <>
                  <CheckboxField
                    checked={
                      draft.vehicleRequiredForRole
                    }
                    label="Vehicle required for the role"
                    description="Access to this vehicle or another suitable vehicle is required."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "vehicleRequiredForRole",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.vehicleUsedForBusiness
                    }
                    label="Used for business purposes"
                    description="The vehicle is used for journeys undertaken on behalf of the organisation."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "vehicleUsedForBusiness",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.primaryBusinessVehicle
                    }
                    label="Primary business vehicle"
                    description="This is the person’s main vehicle for business journeys."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "primaryBusinessVehicle",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.vehicleCurrentlyInUse
                    }
                    label="Vehicle currently in use"
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "vehicleCurrentlyInUse",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.allocatedToPerson
                    }
                    label="Allocated to this person"
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "allocatedToPerson",
                        checked,
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <ReadOnlyValue
                    value={
                      draft.vehicleRequiredForRole
                        ? "Vehicle required for role"
                        : "Vehicle not required for role"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.vehicleUsedForBusiness
                        ? "Used for business"
                        : "Business use not recorded"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.primaryBusinessVehicle
                        ? "Primary business vehicle"
                        : "Not marked as primary"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.vehicleCurrentlyInUse
                        ? "Currently in use"
                        : "Not currently in use"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.allocatedToPerson
                        ? "Allocated to this person"
                        : "Not allocated"
                    }
                  />
                </>
              )}
            </div>
          </section>

          <section
            style={styles.section}
          >
            <SectionHeader
              icon={
                <ClipboardCheck size={18} />
              }
              title="Vehicle identity"
              description="Record the core vehicle information needed for identification, insurance, maintenance and fleet control."
            />

            <div
              style={styles.formGrid}
            >
              <div style={styles.field}>
                <FieldLabel
                  required
                  sensitive
                >
                  Registration number
                </FieldLabel>

                {!resolvedPermissions.canViewRegistrationNumber ? (
                  <ReadOnlyValue
                    restricted
                  />
                ) : editing &&
                  resolvedPermissions.canEditRegistrationNumber ? (
                  <>
                    <input
                      type="text"
                      value={
                        draft.registrationNumber
                      }
                      onChange={(event) =>
                        updateField(
                          "registrationNumber",
                          event.target.value.toUpperCase(),
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.registrationNumber
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.registrationNumber
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.registrationNumber
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel required>
                  Make
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="text"
                      value={draft.make}
                      onChange={(event) =>
                        updateField(
                          "make",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.make
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.make
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={draft.make}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel required>
                  Model
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="text"
                      value={draft.model}
                      onChange={(event) =>
                        updateField(
                          "model",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.model
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.model
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={draft.model}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Vehicle type
                </FieldLabel>

                {editing ? (
                  <select
                    value={draft.bodyType}
                    onChange={(event) =>
                      updateField(
                        "bodyType",
                        event.target
                          .value as VehicleBodyType,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  >
                    {BODY_TYPE_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                ) : (
                  <ReadOnlyValue
                    value={getBodyTypeLabel(
                      draft.bodyType,
                    )}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Colour
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={draft.colour}
                    onChange={(event) =>
                      updateField(
                        "colour",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.colour}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Year of manufacture
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="number"
                      min={1900}
                      max={
                        new Date().getFullYear() +
                        1
                      }
                      value={
                        draft.yearOfManufacture ??
                        ""
                      }
                      onChange={(event) =>
                        updateField(
                          "yearOfManufacture",
                          event.target.value ===
                            ""
                            ? null
                            : Number(
                                event.target.value,
                              ),
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.yearOfManufacture
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.yearOfManufacture
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.yearOfManufacture !==
                      null
                        ? String(
                            draft.yearOfManufacture,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Fuel type
                </FieldLabel>

                {editing ? (
                  <select
                    value={draft.fuelType}
                    onChange={(event) =>
                      updateField(
                        "fuelType",
                        event.target
                          .value as VehicleFuelType,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  >
                    {FUEL_TYPE_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                ) : (
                  <ReadOnlyValue
                    value={getFuelTypeLabel(
                      draft.fuelType,
                    )}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Number of seats
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={
                        draft.numberOfSeats ??
                        ""
                      }
                      onChange={(event) =>
                        updateField(
                          "numberOfSeats",
                          event.target.value ===
                            ""
                            ? null
                            : Number(
                                event.target.value,
                              ),
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.numberOfSeats
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.numberOfSeats
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.numberOfSeats !==
                      null
                        ? String(
                            draft.numberOfSeats,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel sensitive>
                  Vehicle identification number
                </FieldLabel>

                {!resolvedPermissions.canViewVIN ? (
                  <ReadOnlyValue
                    restricted
                  />
                ) : editing &&
                  resolvedPermissions.canEditVIN ? (
                  <input
                    type="text"
                    value={
                      draft.vehicleIdentificationNumber
                    }
                    onChange={(event) =>
                      updateField(
                        "vehicleIdentificationNumber",
                        event.target.value.toUpperCase(),
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.vehicleIdentificationNumber
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Fleet reference
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={
                      draft.fleetReference
                    }
                    onChange={(event) =>
                      updateField(
                        "fleetReference",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.fleetReference
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Lease or rental reference
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={
                      draft.leaseReference
                    }
                    onChange={(event) =>
                      updateField(
                        "leaseReference",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.leaseReference
                    }
                  />
                )}
              </div>
            </div>
          </section>

          <section
            style={styles.section}
          >
            <SectionHeader
              icon={<Gauge size={18} />}
              title="Mileage"
              description="Record current mileage and estimated annual or business use to support servicing and fleet oversight."
            />

            <div
              style={styles.formGrid}
            >
              <div style={styles.field}>
                <FieldLabel>
                  Current mileage
                </FieldLabel>

                {editing ? (
                  <input
                    type="number"
                    min={0}
                    value={
                      draft.currentMileage ??
                      ""
                    }
                    onChange={(event) =>
                      updateField(
                        "currentMileage",
                        event.target.value ===
                          ""
                          ? null
                          : Number(
                              event.target.value,
                            ),
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={formatNumber(
                      draft.currentMileage,
                    )}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Mileage recorded date
                </FieldLabel>

                {editing ? (
                  <input
                    type="date"
                    value={
                      draft.mileageRecordedDate
                    }
                    onChange={(event) =>
                      updateField(
                        "mileageRecordedDate",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.mileageRecordedDate
                        ? formatDate(
                            draft.mileageRecordedDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Estimated annual mileage
                </FieldLabel>

                {editing ? (
                  <input
                    type="number"
                    min={0}
                    value={
                      draft.annualMileageEstimate ??
                      ""
                    }
                    onChange={(event) =>
                      updateField(
                        "annualMileageEstimate",
                        event.target.value ===
                          ""
                          ? null
                          : Number(
                              event.target.value,
                            ),
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={formatNumber(
                      draft.annualMileageEstimate,
                    )}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Estimated business mileage
                </FieldLabel>

                {editing ? (
                  <input
                    type="number"
                    min={0}
                    value={
                      draft.businessMileageEstimate ??
                      ""
                    }
                    onChange={(event) =>
                      updateField(
                        "businessMileageEstimate",
                        event.target.value ===
                          ""
                          ? null
                          : Number(
                              event.target.value,
                            ),
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={formatNumber(
                      draft.businessMileageEstimate,
                    )}
                  />
                )}
              </div>
            </div>
          </section>
                    <section style={styles.section}>
            <SectionHeader
              icon={<ShieldCheck size={18} />}
              title="Insurance and permitted use"
              description="Confirm that the vehicle is insured for the intended use and record the relevant policy details."
            />

            {!resolvedPermissions.canViewInsuranceInformation ? (
              <div style={styles.restrictedPanel}>
                <LockKeyhole size={17} />

                <div>
                  <strong>
                    Insurance information is restricted
                  </strong>

                  <p>
                    Your current permission level does not
                    allow access to vehicle insurance details.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div style={styles.checkboxGrid}>
                  {editing &&
                  resolvedPermissions.canEditInsuranceInformation ? (
                    <>
                      <CheckboxField
                        checked={draft.insuranceVerified}
                        label="Insurance verified"
                        description="Current insurance evidence has been reviewed."
                        disabled={isDisabled}
                        onChange={(checked) =>
                          updateField(
                            "insuranceVerified",
                            checked,
                          )
                        }
                      />

                      <CheckboxField
                        checked={draft.businessUseCovered}
                        label="Business use covered"
                        description="The policy covers the business use required by the role."
                        disabled={isDisabled}
                        onChange={(checked) =>
                          updateField(
                            "businessUseCovered",
                            checked,
                          )
                        }
                      />
                    </>
                  ) : (
                    <>
                      <ReadOnlyValue
                        value={
                          draft.insuranceVerified
                            ? "Insurance verified"
                            : "Insurance not verified"
                        }
                      />

                      <ReadOnlyValue
                        value={
                          draft.businessUseCovered
                            ? "Business use covered"
                            : "Business use not confirmed"
                        }
                      />
                    </>
                  )}
                </div>

                <FieldError
                  message={
                    validationErrors.businessUseCovered
                  }
                />

                <div style={styles.formGrid}>
                  <div style={styles.field}>
                    <FieldLabel>
                      Insurance provider
                    </FieldLabel>

                    {editing &&
                    resolvedPermissions.canEditInsuranceInformation ? (
                      <input
                        type="text"
                        value={draft.insuranceProvider}
                        onChange={(event) =>
                          updateField(
                            "insuranceProvider",
                            event.target.value,
                          )
                        }
                        style={styles.input}
                        disabled={isDisabled}
                      />
                    ) : (
                      <ReadOnlyValue
                        value={draft.insuranceProvider}
                      />
                    )}
                  </div>

                  <div style={styles.field}>
                    <FieldLabel sensitive>
                      Policy number
                    </FieldLabel>

                    {editing &&
                    resolvedPermissions.canEditInsuranceInformation ? (
                      <input
                        type="text"
                        value={
                          draft.insurancePolicyNumber
                        }
                        onChange={(event) =>
                          updateField(
                            "insurancePolicyNumber",
                            event.target.value,
                          )
                        }
                        style={styles.input}
                        disabled={isDisabled}
                      />
                    ) : (
                      <ReadOnlyValue
                        value={
                          draft.insurancePolicyNumber
                        }
                      />
                    )}
                  </div>

                  <div style={styles.field}>
                    <FieldLabel>
                      Insurance start date
                    </FieldLabel>

                    {editing &&
                    resolvedPermissions.canEditInsuranceInformation ? (
                      <input
                        type="date"
                        value={
                          draft.insuranceStartDate
                        }
                        onChange={(event) =>
                          updateField(
                            "insuranceStartDate",
                            event.target.value,
                          )
                        }
                        style={styles.input}
                        disabled={isDisabled}
                      />
                    ) : (
                      <ReadOnlyValue
                        value={
                          draft.insuranceStartDate
                            ? formatDate(
                                draft.insuranceStartDate,
                              )
                            : ""
                        }
                      />
                    )}
                  </div>

                  <div style={styles.field}>
                    <FieldLabel>
                      Insurance expiry date
                    </FieldLabel>

                    {editing &&
                    resolvedPermissions.canEditInsuranceInformation ? (
                      <>
                        <input
                          type="date"
                          value={
                            draft.insuranceExpiryDate
                          }
                          onChange={(event) =>
                            updateField(
                              "insuranceExpiryDate",
                              event.target.value,
                            )
                          }
                          style={{
                            ...styles.input,
                            ...(validationErrors.insuranceExpiryDate
                              ? styles.inputError
                              : {}),
                          }}
                          disabled={isDisabled}
                        />

                        <FieldError
                          message={
                            validationErrors.insuranceExpiryDate
                          }
                        />
                      </>
                    ) : (
                      <ReadOnlyValue
                        value={
                          draft.insuranceExpiryDate
                            ? formatDate(
                                draft.insuranceExpiryDate,
                              )
                            : ""
                        }
                      />
                    )}
                  </div>

                  <div
                    style={{
                      ...styles.field,
                      gridColumn: "1 / -1",
                    }}
                  >
                    <FieldLabel>
                      Permitted drivers
                    </FieldLabel>

                    {editing &&
                    resolvedPermissions.canEditInsuranceInformation ? (
                      <textarea
                        value={draft.permittedDrivers}
                        onChange={(event) =>
                          updateField(
                            "permittedDrivers",
                            event.target.value,
                          )
                        }
                        rows={4}
                        style={styles.textarea}
                        disabled={isDisabled}
                        placeholder="Record named drivers, driver groups or relevant restrictions."
                      />
                    ) : (
                      <ReadOnlyValue
                        value={draft.permittedDrivers}
                        fallback="No permitted driver details recorded"
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<ClipboardCheck size={18} />}
              title="MOT, vehicle tax and roadworthiness"
              description="Record statutory checks and confirm that the vehicle is safe and roadworthy for continued use."
            />

            <div style={styles.checkboxGrid}>
              {editing ? (
                <>
                  <CheckboxField
                    checked={draft.motRequired}
                    label="MOT required"
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "motRequired",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={draft.motVerified}
                    label="MOT verified"
                    description="Current MOT evidence has been checked."
                    disabled={
                      isDisabled ||
                      !draft.motRequired
                    }
                    onChange={(checked) =>
                      updateField(
                        "motVerified",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.vehicleTaxVerified
                    }
                    label="Vehicle tax verified"
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "vehicleTaxVerified",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.roadworthinessConfirmed
                    }
                    label="Roadworthiness confirmed"
                    description="A current roadworthiness check has been completed."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "roadworthinessConfirmed",
                        checked,
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <ReadOnlyValue
                    value={
                      draft.motRequired
                        ? draft.motVerified
                          ? "MOT required and verified"
                          : "MOT required but not verified"
                        : "MOT not required"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.vehicleTaxVerified
                        ? "Vehicle tax verified"
                        : "Vehicle tax not verified"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.roadworthinessConfirmed
                        ? "Roadworthiness confirmed"
                        : "Roadworthiness not confirmed"
                    }
                  />
                </>
              )}
            </div>

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel>
                  MOT expiry date
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="date"
                      value={draft.motExpiryDate}
                      onChange={(event) =>
                        updateField(
                          "motExpiryDate",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.motExpiryDate
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={
                        isDisabled ||
                        !draft.motRequired
                      }
                    />

                    <FieldError
                      message={
                        validationErrors.motExpiryDate
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.motExpiryDate
                        ? formatDate(
                            draft.motExpiryDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Vehicle tax expiry date
                </FieldLabel>

                {editing ? (
                  <input
                    type="date"
                    value={
                      draft.vehicleTaxExpiryDate
                    }
                    onChange={(event) =>
                      updateField(
                        "vehicleTaxExpiryDate",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.vehicleTaxExpiryDate
                        ? formatDate(
                            draft.vehicleTaxExpiryDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Roadworthiness check date
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="date"
                      value={
                        draft.roadworthinessCheckDate
                      }
                      onChange={(event) =>
                        updateField(
                          "roadworthinessCheckDate",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.roadworthinessCheckDate
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={
                        isDisabled ||
                        !draft.roadworthinessConfirmed
                      }
                    />

                    <FieldError
                      message={
                        validationErrors.roadworthinessCheckDate
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.roadworthinessCheckDate
                        ? formatDate(
                            draft.roadworthinessCheckDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Roadworthiness checked by
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="text"
                      value={
                        draft.roadworthinessCheckedBy
                      }
                      onChange={(event) =>
                        updateField(
                          "roadworthinessCheckedBy",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.roadworthinessCheckedBy
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={
                        isDisabled ||
                        !draft.roadworthinessConfirmed
                      }
                    />

                    <FieldError
                      message={
                        validationErrors.roadworthinessCheckedBy
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.roadworthinessCheckedBy
                    }
                  />
                )}
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<Wrench size={18} />}
              title="Servicing and maintenance"
              description="Track service dates and mileage thresholds so maintenance is completed before the vehicle becomes overdue."
            />

            <div style={styles.checkboxGrid}>
              {editing ? (
                <CheckboxField
                  checked={draft.serviceRequired}
                  label="Scheduled servicing required"
                  description="The vehicle is subject to planned servicing or maintenance intervals."
                  disabled={isDisabled}
                  onChange={(checked) =>
                    updateField(
                      "serviceRequired",
                      checked,
                    )
                  }
                />
              ) : (
                <ReadOnlyValue
                  value={
                    draft.serviceRequired
                      ? "Scheduled servicing required"
                      : "No servicing requirement recorded"
                  }
                />
              )}
            </div>

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel>
                  Last service date
                </FieldLabel>

                {editing ? (
                  <input
                    type="date"
                    value={draft.lastServiceDate}
                    onChange={(event) =>
                      updateField(
                        "lastServiceDate",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={
                      isDisabled ||
                      !draft.serviceRequired
                    }
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.lastServiceDate
                        ? formatDate(
                            draft.lastServiceDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Next service date
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="date"
                      value={draft.nextServiceDate}
                      onChange={(event) =>
                        updateField(
                          "nextServiceDate",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.nextServiceDate
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={
                        isDisabled ||
                        !draft.serviceRequired
                      }
                    />

                    <FieldError
                      message={
                        validationErrors.nextServiceDate
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.nextServiceDate
                        ? formatDate(
                            draft.nextServiceDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Service mileage interval
                </FieldLabel>

                {editing ? (
                  <input
                    type="number"
                    min={0}
                    value={
                      draft.serviceMileageInterval ??
                      ""
                    }
                    onChange={(event) =>
                      updateField(
                        "serviceMileageInterval",
                        event.target.value === ""
                          ? null
                          : Number(
                              event.target.value,
                            ),
                      )
                    }
                    style={styles.input}
                    disabled={
                      isDisabled ||
                      !draft.serviceRequired
                    }
                  />
                ) : (
                  <ReadOnlyValue
                    value={formatNumber(
                      draft.serviceMileageInterval,
                    )}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Next service mileage
                </FieldLabel>

                {editing ? (
                  <input
                    type="number"
                    min={0}
                    value={
                      draft.nextServiceMileage ??
                      ""
                    }
                    onChange={(event) =>
                      updateField(
                        "nextServiceMileage",
                        event.target.value === ""
                          ? null
                          : Number(
                              event.target.value,
                            ),
                      )
                    }
                    style={styles.input}
                    disabled={
                      isDisabled ||
                      !draft.serviceRequired
                    }
                  />
                ) : (
                  <ReadOnlyValue
                    value={formatNumber(
                      draft.nextServiceMileage,
                    )}
                  />
                )}
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<AlertCircle size={18} />}
              title="Defects and suspension"
              description="Record known defects and prevent continued use where the vehicle is unsafe, non-compliant or awaiting repair."
            />

            <div style={styles.checkboxGrid}>
              {editing ? (
                <>
                  <CheckboxField
                    checked={draft.defectsReported}
                    label="Defects reported"
                    description="A defect, warning light or roadworthiness concern has been identified."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "defectsReported",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.vehicleUseSuspended
                    }
                    label="Vehicle use suspended"
                    description="The vehicle must not be used for work until reinstated."
                    disabled={
                      isDisabled ||
                      !resolvedPermissions.canSuspendVehicleUse
                    }
                    onChange={(checked) => {
                      updateField(
                        "vehicleUseSuspended",
                        checked,
                      );

                      if (checked) {
                        updateField(
                          "status",
                          "suspended",
                        );
                        updateField(
                          "vehicleCurrentlyInUse",
                          false,
                        );
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <ReadOnlyValue
                    value={
                      draft.defectsReported
                        ? "Defects reported"
                        : "No defects reported"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.vehicleUseSuspended
                        ? "Vehicle use suspended"
                        : "Vehicle use not suspended"
                    }
                  />
                </>
              )}
            </div>

            <div style={styles.formGrid}>
              <div
                style={{
                  ...styles.field,
                  gridColumn: "1 / -1",
                }}
              >
                <FieldLabel>
                  Defects summary
                </FieldLabel>

                {editing ? (
                  <>
                    <textarea
                      value={draft.defectsSummary}
                      onChange={(event) =>
                        updateField(
                          "defectsSummary",
                          event.target.value,
                        )
                      }
                      rows={4}
                      style={{
                        ...styles.textarea,
                        ...(validationErrors.defectsSummary
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={
                        isDisabled ||
                        !draft.defectsReported
                      }
                      placeholder="Record the defect, when it was identified and any immediate action taken."
                    />

                    <FieldError
                      message={
                        validationErrors.defectsSummary
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={draft.defectsSummary}
                    fallback="No defects recorded"
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Suspension date
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="date"
                      value={draft.suspensionDate}
                      onChange={(event) =>
                        updateField(
                          "suspensionDate",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.suspensionDate
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={
                        isDisabled ||
                        !draft.vehicleUseSuspended ||
                        !resolvedPermissions.canSuspendVehicleUse
                      }
                    />

                    <FieldError
                      message={
                        validationErrors.suspensionDate
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.suspensionDate
                        ? formatDate(
                            draft.suspensionDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div
                style={{
                  ...styles.field,
                  gridColumn: "1 / -1",
                }}
              >
                <FieldLabel>
                  Suspension reason
                </FieldLabel>

                {editing &&
                resolvedPermissions.canSuspendVehicleUse ? (
                  <>
                    <textarea
                      value={draft.suspensionReason}
                      onChange={(event) =>
                        updateField(
                          "suspensionReason",
                          event.target.value,
                        )
                      }
                      rows={4}
                      style={{
                        ...styles.textarea,
                        ...(validationErrors.suspensionReason
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={
                        isDisabled ||
                        !draft.vehicleUseSuspended
                      }
                      placeholder="Record why use is suspended and what must happen before reinstatement."
                    />

                    <FieldError
                      message={
                        validationErrors.suspensionReason
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={draft.suspensionReason}
                    fallback="No suspension reason recorded"
                  />
                )}
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<AlertCircle size={18} />}
              title="Accident or damage record"
              description="Record concise factual information about accidents or vehicle damage while maintaining appropriate access controls."
            />

            {!resolvedPermissions.canViewAccidentInformation ? (
              <div style={styles.restrictedPanel}>
                <LockKeyhole size={17} />

                <div>
                  <strong>
                    Accident and damage information is
                    restricted
                  </strong>

                  <p>
                    Your current permission level does not
                    allow access to this section.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div style={styles.checkboxGrid}>
                  {editing &&
                  resolvedPermissions.canEditAccidentInformation ? (
                    <CheckboxField
                      checked={
                        draft.accidentOrDamageRecorded
                      }
                      label="Accident or damage recorded"
                      description="An accident, collision, loss or damage event has been recorded for this vehicle."
                      disabled={isDisabled}
                      onChange={(checked) =>
                        updateField(
                          "accidentOrDamageRecorded",
                          checked,
                        )
                      }
                    />
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.accidentOrDamageRecorded
                          ? "Accident or damage recorded"
                          : "No accident or damage recorded"
                      }
                    />
                  )}
                </div>

                <div style={styles.field}>
                  <FieldLabel sensitive>
                    Accident or damage summary
                  </FieldLabel>

                  {editing &&
                  resolvedPermissions.canEditAccidentInformation ? (
                    <>
                      <textarea
                        value={
                          draft.accidentOrDamageSummary
                        }
                        onChange={(event) =>
                          updateField(
                            "accidentOrDamageSummary",
                            event.target.value,
                          )
                        }
                        rows={5}
                        style={{
                          ...styles.textarea,
                          ...(validationErrors.accidentOrDamageSummary
                            ? styles.inputError
                            : {}),
                        }}
                        disabled={
                          isDisabled ||
                          !draft.accidentOrDamageRecorded
                        }
                        placeholder="Record the date, factual circumstances, damage and follow-up action."
                      />

                      <FieldError
                        message={
                          validationErrors.accidentOrDamageSummary
                        }
                      />
                    </>
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.accidentOrDamageSummary
                      }
                      fallback="No accident or damage details recorded"
                    />
                  )}
                </div>
              </>
            )}
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<Gauge size={18} />}
              title="Telematics, parking and clean-air requirements"
              description="Record operational references that may be needed for tracking, parking or regulated travel zones."
            />

            <div style={styles.checkboxGrid}>
              {editing ? (
                <>
                  <CheckboxField
                    checked={
                      draft.telematicsInstalled
                    }
                    label="Telematics or tracker installed"
                    disabled={
                      isDisabled ||
                      !resolvedPermissions.canEditTrackerInformation
                    }
                    onChange={(checked) =>
                      updateField(
                        "telematicsInstalled",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.parkingPermitRequired
                    }
                    label="Parking permit required"
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "parkingPermitRequired",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.congestionOrCleanAirRegistered
                    }
                    label="Congestion or clean-air registration"
                    description="The vehicle is registered or approved for relevant travel zones."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "congestionOrCleanAirRegistered",
                        checked,
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <ReadOnlyValue
                    value={
                      draft.telematicsInstalled
                        ? "Telematics installed"
                        : "No telematics recorded"
                    }
                    restricted={
                      !resolvedPermissions.canViewTrackerInformation
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.parkingPermitRequired
                        ? "Parking permit required"
                        : "Parking permit not required"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.congestionOrCleanAirRegistered
                        ? "Clean-air or congestion registration recorded"
                        : "No clean-air registration recorded"
                    }
                  />
                </>
              )}
            </div>

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel sensitive>
                  Tracker reference
                </FieldLabel>

                {!resolvedPermissions.canViewTrackerInformation ? (
                  <ReadOnlyValue restricted />
                ) : editing &&
                  resolvedPermissions.canEditTrackerInformation ? (
                  <>
                    <input
                      type="text"
                      value={draft.trackerReference}
                      onChange={(event) =>
                        updateField(
                          "trackerReference",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.trackerReference
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={
                        isDisabled ||
                        !draft.telematicsInstalled
                      }
                    />

                    <FieldError
                      message={
                        validationErrors.trackerReference
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={draft.trackerReference}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Parking permit reference
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="text"
                      value={
                        draft.parkingPermitReference
                      }
                      onChange={(event) =>
                        updateField(
                          "parkingPermitReference",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.parkingPermitReference
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={
                        isDisabled ||
                        !draft.parkingPermitRequired
                      }
                    />

                    <FieldError
                      message={
                        validationErrors.parkingPermitReference
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.parkingPermitReference
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Parking permit expiry date
                </FieldLabel>

                {editing ? (
                  <input
                    type="date"
                    value={
                      draft.parkingPermitExpiryDate
                    }
                    onChange={(event) =>
                      updateField(
                        "parkingPermitExpiryDate",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={
                      isDisabled ||
                      !draft.parkingPermitRequired
                    }
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.parkingPermitExpiryDate
                        ? formatDate(
                            draft.parkingPermitExpiryDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div
                style={{
                  ...styles.field,
                  gridColumn: "1 / -1",
                }}
              >
                <FieldLabel>
                  Clean-air or congestion notes
                </FieldLabel>

                {editing ? (
                  <textarea
                    value={draft.cleanAirNotes}
                    onChange={(event) =>
                      updateField(
                        "cleanAirNotes",
                        event.target.value,
                      )
                    }
                    rows={4}
                    style={styles.textarea}
                    disabled={isDisabled}
                    placeholder="Record registrations, exemptions, restrictions or operational notes."
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.cleanAirNotes}
                    fallback="No clean-air or congestion notes recorded"
                  />
                )}
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<CalendarClock size={18} />}
              title="Review and notes"
              description="Set the next review date and record concise operational notes relevant to this vehicle."
            />

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel>
                  Next review date
                </FieldLabel>

                {editing ? (
                  <input
                    type="date"
                    value={draft.nextReviewDate}
                    onChange={(event) =>
                      updateField(
                        "nextReviewDate",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.nextReviewDate
                        ? formatDate(
                            draft.nextReviewDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div
                style={{
                  ...styles.field,
                  gridColumn: "1 / -1",
                }}
              >
                <FieldLabel>
                  Vehicle notes
                </FieldLabel>

                {editing ? (
                  <textarea
                    value={draft.notes}
                    onChange={(event) =>
                      updateField(
                        "notes",
                        event.target.value,
                      )
                    }
                    rows={5}
                    style={styles.textarea}
                    disabled={isDisabled}
                    placeholder="Add concise factual notes."
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.notes}
                    fallback="No notes recorded"
                  />
                )}
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<FileText size={18} />}
              title="Supporting evidence"
              description="Store registration, insurance, MOT, service, lease and roadworthiness evidence securely."
            />

            {!resolvedPermissions.canViewEvidence ? (
              <div style={styles.restrictedPanel}>
                <LockKeyhole size={17} />

                <div>
                  <strong>
                    Vehicle evidence is restricted
                  </strong>

                  <p>
                    Your current permission level does not
                    allow access to this evidence.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div style={styles.evidenceList}>
                  {visibleEvidence.length === 0 &&
                  pendingFiles.length === 0 ? (
                    <div style={styles.emptyState}>
                      <FileText size={22} />

                      <strong>
                        No evidence uploaded
                      </strong>

                      <span>
                        Upload documents used to verify and
                        maintain this vehicle record.
                      </span>
                    </div>
                  ) : null}

                  {visibleEvidence.map((item) => (
                    <article
                      key={item.id}
                      style={styles.evidenceCard}
                    >
                      <span
                        style={
                          styles.evidenceFileIcon
                        }
                      >
                        <FileText size={17} />
                      </span>

                      <div
                        style={{
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <strong
                          style={
                            styles.evidenceFileName
                          }
                        >
                          {item.fileName}
                        </strong>

                        <span
                          style={
                            styles.evidenceTypeLabel
                          }
                        >
                          {getEvidenceTypeLabel(
                            item.evidenceType,
                          )}
                        </span>

                        <span
                          style={styles.evidenceMeta}
                        >
                          {formatFileSize(
                            item.fileSizeBytes,
                          )}
                          {" · "}
                          Uploaded{" "}
                          {formatDateTime(
                            item.uploadedAt,
                          )}
                          {item.uploadedBy
                            ? ` by ${item.uploadedBy}`
                            : ""}
                        </span>
                      </div>

                      {editing &&
                      resolvedPermissions.canDeleteEvidence ? (
                        <button
                          type="button"
                          style={styles.iconButton}
                          onClick={() =>
                            removeExistingEvidence(
                              item.id,
                            )
                          }
                          disabled={isDisabled}
                          aria-label={`Remove ${item.fileName}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : null}
                    </article>
                  ))}

                  {pendingFiles.map((item) => (
                    <article
                      key={item.id}
                      style={{
                        ...styles.evidenceCard,
                        borderStyle: "dashed",
                        background: "#FBF8FC",
                      }}
                    >
                      <span
                        style={
                          styles.evidenceFileIcon
                        }
                      >
                        <Upload size={17} />
                      </span>

                      <div
                        style={{
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <strong
                          style={
                            styles.evidenceFileName
                          }
                        >
                          {item.file.name}
                        </strong>

                        <span
                          style={
                            styles.evidenceTypeLabel
                          }
                        >
                          {getEvidenceTypeLabel(
                            item.evidenceType,
                          )}
                        </span>

                        <span
                          style={styles.evidenceMeta}
                        >
                          {formatFileSize(
                            item.file.size,
                          )}
                          {" · "}
                          Awaiting save
                        </span>
                      </div>

                      <button
                        type="button"
                        style={styles.iconButton}
                        onClick={() =>
                          removePendingFile(
                            item.id,
                          )
                        }
                        disabled={isDisabled}
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <X size={15} />
                      </button>
                    </article>
                  ))}
                </div>

                {editing &&
                resolvedPermissions.canUploadEvidence ? (
                  <div style={styles.uploadArea}>
                    <select
                      value={selectedEvidenceType}
                      onChange={(event) =>
                        setSelectedEvidenceType(
                          event.target
                            .value as VehicleEvidenceType,
                        )
                      }
                      style={styles.uploadSelect}
                      disabled={isDisabled}
                    >
                      {EVIDENCE_TYPE_OPTIONS.map(
                        (option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleFileSelection}
                      style={{ display: "none" }}
                    />

                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={isDisabled}
                    >
                      <Plus size={15} />
                      Add evidence
                    </button>

                    <span style={styles.uploadHelp}>
                      PDF, image or Word document. Maximum
                      15 MB per file.
                    </span>
                  </div>
                ) : null}
              </>
            )}
          </section>
                   {resolvedPermissions.canViewHistory ? (
            <section style={styles.section}>
              <SectionHeader
                icon={<History size={18} />}
                title="Inspection history"
                description="Preserve previous vehicle inspections, mileage readings, defects and follow-up actions."
              />

              {draft.inspectionHistory.length === 0 ? (
                <div style={styles.emptyState}>
                  <History size={22} />

                  <strong>
                    No previous inspections recorded
                  </strong>

                  <span>
                    Inspection history will appear here
                    after vehicle checks are saved.
                  </span>
                </div>
              ) : (
                <div style={styles.historyList}>
                  {draft.inspectionHistory.map(
                    (entry) => (
                      <article
                        key={entry.id}
                        style={styles.historyCard}
                      >
                        <span
                          style={styles.historyMarker}
                        >
                          <ClipboardCheck size={14} />
                        </span>

                        <div style={{ flex: 1 }}>
                          <div
                            style={styles.historyHeader}
                          >
                            <strong>
                              {getStatusLabel(
                                entry.status,
                              )}
                            </strong>

                            <span>
                              {formatDateTime(
                                entry.inspectedAt,
                              )}
                            </span>
                          </div>

                          <p style={styles.historyText}>
                            Inspected by{" "}
                            {entry.inspectedBy}.
                          </p>

                          {entry.mileage !== undefined &&
                          entry.mileage !== null ? (
                            <p style={styles.historyText}>
                              Mileage recorded:{" "}
                              {formatNumber(
                                entry.mileage,
                              )}
                              .
                            </p>
                          ) : null}

                          {entry.roadworthy !==
                          undefined ? (
                            <p style={styles.historyText}>
                              {entry.roadworthy
                                ? "Roadworthiness confirmed."
                                : "Roadworthiness not confirmed."}
                            </p>
                          ) : null}

                          {entry.defectsFound !==
                          undefined ? (
                            <p style={styles.historyText}>
                              {entry.defectsFound
                                ? "Defects were identified."
                                : "No defects were identified."}
                            </p>
                          ) : null}

                          {entry.defectsSummary ? (
                            <p style={styles.historyNotes}>
                              {entry.defectsSummary}
                            </p>
                          ) : null}

                          {entry.followUpDate ? (
                            <p style={styles.historyText}>
                              Follow-up due{" "}
                              {formatDate(
                                entry.followUpDate,
                              )}
                              .
                            </p>
                          ) : null}

                          {entry.notes ? (
                            <p style={styles.historyNotes}>
                              {entry.notes}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}
            </section>
          ) : null}
        </div>

        {editing ? (
          <footer style={styles.footer}>
            <div style={styles.changeSummary}>
              {isDirty ? (
                <>
                  <span style={styles.unsavedDot} />
                  Unsaved changes
                </>
              ) : (
                <>
                  <Check size={14} />
                  No unsaved changes
                </>
              )}
            </div>

            <div style={styles.footerActions}>
              <button
                type="button"
                style={styles.tertiaryButton}
                onClick={resetChanges}
                disabled={!isDirty || isDisabled}
              >
                <RotateCcw size={14} />
                Reset
              </button>

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={cancelEditing}
                disabled={isDisabled}
              >
                <X size={15} />
                Cancel
              </button>

              <button
                type="submit"
                style={styles.primaryButton}
                disabled={
                  !isDirty ||
                  isDisabled ||
                  !onSave
                }
              >
                {isSaving ? (
                  <Loader2
                    size={15}
                    className="leo-shared-spin"
                  />
                ) : (
                  <Save size={15} />
                )}

                {isSaving
                  ? "Saving..."
                  : "Save vehicle record"}
              </button>
            </div>
          </footer>
        ) : null}
      </form>

      <style>
        {`
          @keyframes leo-shared-spin {
            to {
              transform: rotate(360deg);
            }
          }

          .leo-shared-spin {
            animation: leo-shared-spin 0.8s linear infinite;
          }

          button:disabled,
          input:disabled,
          select:disabled,
          textarea:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }

          input[type="checkbox"] {
            accent-color: #6E5084;
          }

          @media (max-width: 720px) {
            .leo-vehicle-responsive-footer {
              align-items: stretch;
            }
          }
        `}
      </style>
    </section>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  card: {
    overflow: "hidden",
    border: "1px solid #E7DDED",
    borderRadius: "18px",
    background: "#FFFFFF",
    boxShadow:
      "0 12px 32px rgba(71, 49, 81, 0.05)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "18px",
    padding: "20px 22px",
    borderBottom: "1px solid #EEE5F2",
    background:
      "linear-gradient(135deg, #FFFFFF 0%, #FCF9FE 100%)",
  },

  identity: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    minWidth: 0,
  },

  identityIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "42px",
    height: "42px",
    flex: "0 0 auto",
    borderRadius: "13px",
    background: "#F2EAF7",
    color: "#6E5084",
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "9px",
  },

  cardTitle: {
    margin: 0,
    color: "#342B38",
    fontSize: "17px",
    fontWeight: 800,
  },

  cardSubtitle: {
    margin: "4px 0 0",
    color: "#847789",
    fontSize: "12px",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    border: "1px solid",
    borderRadius: "999px",
    padding: "5px 8px",
    fontSize: "10px",
    fontWeight: 800,
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "9px",
  },

  content: {
    display: "grid",
    gap: "18px",
    padding: "22px",
  },

  section: {
    display: "grid",
    gap: "17px",
    padding: "20px",
    border: "1px solid #ECE4F0",
    borderRadius: "15px",
    background: "#FFFFFF",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
  },

  sectionIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    flex: "0 0 auto",
    borderRadius: "10px",
    background: "#F5EFF8",
    color: "#6E5084",
  },

  sectionTitle: {
    margin: 0,
    color: "#403545",
    fontSize: "14px",
    fontWeight: 800,
  },

  sectionDescription: {
    margin: "4px 0 0",
    color: "#8B7F90",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "17px",
  },

  checkboxGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "12px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    minWidth: 0,
  },

  fieldLabel: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "5px",
    color: "#594D5E",
    fontSize: "11px",
    fontWeight: 750,
  },

  requiredMark: {
    color: "#8E5F72",
  },

  sensitiveLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    marginLeft: "3px",
    borderRadius: "999px",
    background: "#F3EEF5",
    color: "#75687A",
    padding: "3px 6px",
    fontSize: "9px",
    fontWeight: 750,
  },

  input: {
    width: "100%",
    minHeight: "42px",
    boxSizing: "border-box",
    border: "1px solid #DCCFE3",
    borderRadius: "10px",
    outline: "none",
    background: "#FFFFFF",
    color: "#3F3543",
    padding: "10px 11px",
    font: "inherit",
    fontSize: "12px",
  },

  inputError: {
    borderColor: "#B97988",
    boxShadow:
      "0 0 0 3px rgba(185, 121, 136, 0.10)",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    border: "1px solid #DCCFE3",
    borderRadius: "10px",
    outline: "none",
    background: "#FFFFFF",
    color: "#3F3543",
    padding: "11px",
    font: "inherit",
    fontSize: "12px",
    lineHeight: 1.55,
  },

  uploadSelect: {
    minHeight: "38px",
    border: "1px solid #DCCFE3",
    borderRadius: "9px",
    outline: "none",
    background: "#FFFFFF",
    color: "#3F3543",
    padding: "8px 10px",
    font: "inherit",
    fontSize: "11px",
  },

  checkboxCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    minHeight: "64px",
    boxSizing: "border-box",
    border: "1px solid #DED3E4",
    borderRadius: "10px",
    background: "#FAF7FC",
    color: "#55495A",
    padding: "11px",
    fontSize: "11px",
    cursor: "pointer",
  },

  checkboxTitle: {
    display: "block",
    color: "#55495A",
    fontSize: "11px",
  },

  checkboxDescription: {
    display: "block",
    marginTop: "3px",
    color: "#8B7F90",
    fontSize: "10px",
    lineHeight: 1.4,
  },

  readOnlyValue: {
    display: "flex",
    alignItems: "center",
    minHeight: "42px",
    boxSizing: "border-box",
    border: "1px solid #EEE7F1",
    borderRadius: "10px",
    background: "#FBF9FC",
    color: "#4D414F",
    padding: "10px 11px",
    fontSize: "12px",
    lineHeight: 1.45,
    whiteSpace: "pre-wrap",
  },

  readOnlyEmpty: {
    color: "#A094A5",
    fontStyle: "italic",
  },

  restrictedValue: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    minHeight: "42px",
    boxSizing: "border-box",
    border: "1px solid #EEE7F1",
    borderRadius: "10px",
    background: "#F8F5F9",
    color: "#847888",
    padding: "10px 11px",
    fontSize: "11px",
    fontWeight: 700,
  },

  fieldError: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    margin: 0,
    color: "#9A5668",
    fontSize: "10px",
    lineHeight: 1.4,
  },

  restrictedPanel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    border: "1px solid #E5DDE9",
    borderRadius: "11px",
    background: "#F9F6FA",
    color: "#746978",
    padding: "13px",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  evidenceList: {
    display: "grid",
    gap: "9px",
  },

  evidenceCard: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    border: "1px solid #E7DFEB",
    borderRadius: "11px",
    background: "#FFFFFF",
    padding: "11px",
  },

  evidenceFileIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    flex: "0 0 auto",
    borderRadius: "9px",
    background: "#F3EDF7",
    color: "#6E5084",
  },

  evidenceFileName: {
    display: "block",
    overflow: "hidden",
    color: "#4A3E4E",
    fontSize: "11px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  evidenceTypeLabel: {
    display: "inline-flex",
    marginTop: "4px",
    borderRadius: "999px",
    background: "#F2ECF6",
    color: "#6E5084",
    padding: "3px 7px",
    fontSize: "9px",
    fontWeight: 750,
  },

  evidenceMeta: {
    display: "block",
    marginTop: "4px",
    color: "#8B7F90",
    fontSize: "10px",
  },

  uploadArea: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },

  uploadHelp: {
    color: "#8C8091",
    fontSize: "10px",
  },

  historyList: {
    display: "grid",
    gap: "12px",
  },

  historyCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    padding: "12px 0",
    borderBottom: "1px solid #F0EAF2",
  },

  historyMarker: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    flex: "0 0 auto",
    borderRadius: "999px",
    background: "#F1EAF5",
    color: "#6E5084",
  },

  historyHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "8px",
    color: "#4A3D4E",
    fontSize: "11px",
  },

  historyText: {
    margin: "5px 0 0",
    color: "#7D7182",
    fontSize: "10px",
    lineHeight: 1.5,
  },

  historyNotes: {
    margin: "7px 0 0",
    borderRadius: "8px",
    background: "#FAF7FC",
    color: "#675A6C",
    padding: "8px",
    fontSize: "10px",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },

  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: "6px",
    minHeight: "130px",
    boxSizing: "border-box",
    border: "1px dashed #DDD2E3",
    borderRadius: "12px",
    background: "#FCFAFD",
    color: "#887C8D",
    padding: "20px",
    textAlign: "center",
    fontSize: "11px",
  },

  errorBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    margin: "18px 22px 0",
    border: "1px solid #E8CBD2",
    borderRadius: "11px",
    background: "#FFF7F8",
    color: "#8B4E5D",
    padding: "11px 13px",
    fontSize: "11px",
  },

  successBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    margin: "18px 22px 0",
    border: "1px solid #CFE6D8",
    borderRadius: "11px",
    background: "#F5FCF8",
    color: "#527460",
    padding: "11px 13px",
    fontSize: "11px",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "14px",
    padding: "16px 22px",
    borderTop: "1px solid #EEE6F1",
    background: "#FCFAFD",
  },

  changeSummary: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: "#7C7081",
    fontSize: "11px",
    fontWeight: 650,
  },

  unsavedDot: {
    width: "7px",
    height: "7px",
    borderRadius: "999px",
    background: "#8A6B9D",
  },

  footerActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    minHeight: "38px",
    border: "1px solid #6E5084",
    borderRadius: "9px",
    background: "#6E5084",
    color: "#FFFFFF",
    padding: "8px 13px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    minHeight: "38px",
    border: "1px solid #DCCFE3",
    borderRadius: "9px",
    background: "#FFFFFF",
    color: "#6E5084",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  tertiaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    minHeight: "38px",
    border: 0,
    borderRadius: "9px",
    background: "transparent",
    color: "#766A7A",
    padding: "8px 10px",
    fontSize: "11px",
    fontWeight: 750,
    cursor: "pointer",
  },

  iconButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    flex: "0 0 auto",
    border: "1px solid #E4DBE8",
    borderRadius: "9px",
    background: "#FFFFFF",
    color: "#766A7A",
    cursor: "pointer",
  },

  accessCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "13px",
    border: "1px solid #E6DCEB",
    borderRadius: "16px",
    background: "#FBF8FC",
    padding: "20px",
  },

  accessIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    flex: "0 0 auto",
    borderRadius: "11px",
    background: "#F0E8F4",
    color: "#6E5084",
  },

  accessTitle: {
    margin: 0,
    color: "#493C4E",
    fontSize: "14px",
    fontWeight: 800,
  },

  accessText: {
    margin: "5px 0 0",
    color: "#827687",
    fontSize: "11px",
    lineHeight: 1.5,
  },
}; 