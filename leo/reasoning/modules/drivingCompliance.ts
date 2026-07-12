import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runDrivingComplianceReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "driving",
      "drive for work",
      "driving for work",
      "company vehicle",
      "company car",
      "company van",
      "pool car",
      "personal vehicle for work",
      "own car for work",
      "grey fleet",
      "business mileage",
      "mileage claim",
      "driving licence",
      "licence check",
      "penalty points",
      "driving ban",
      "disqualified driver",
      "insurance",
      "business use insurance",
      "mot",
      "vehicle tax",
      "roadworthiness",
      "vehicle check",
      "daily vehicle check",
      "accident",
      "road traffic accident",
      "vehicle incident",
      "mobile phone while driving",
      "fatigue",
      "driver tiredness",
      "journey planning",
      "drivers hours",
      "tachograph",
      "medical fitness to drive",
      "eyesight",
      "safety critical driving",
    ],

    strongKeywords: [
      "driving licence expired",
      "employee disqualified from driving",
      "no business use insurance",
      "driving without insurance",
      "invalid driving licence",
      "failed licence check",
      "serious driving offence",
      "company vehicle accident",
      "driving while using mobile phone",
      "unsafe vehicle",
      "vehicle not roadworthy",
      "drivers hours breach",
      "tachograph breach",
      "medical condition affecting driving",
    ],

    intentMatches: [
      "driving_compliance",
      "driving_for_work",
      "vehicle_compliance",
      "licence_check",
      "road_safety",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Driving Compliance",

    triggered,

    issues: triggered
      ? [
          "The matter concerns an employee who drives, rides or uses a vehicle as part of their work.",
          "The employer should assess the driver, the vehicle and the journey rather than treating a valid licence as the only requirement.",
          "Driving for work creates health and safety, insurance, licensing and operational risks.",
          `Driving compliance reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "Health and safety law applies to driving and riding for work in the same way that it applies to work at a fixed workplace.",
          "The employer should manage risks connected with the driver, vehicle and journey.",
          "The employee must hold the correct and valid category of driving licence for the vehicle and duties they perform.",
          "The employer may check a driver's licence record using the official DVLA service with the driver's permission and check code.",
          "The employer should verify relevant penalty points, endorsements, restrictions and disqualifications.",
          "A privately owned vehicle used for work must have valid insurance covering business use, a valid MOT where required and be maintained in a safe condition.",
          "Company and privately owned vehicles used for work should be roadworthy, appropriately maintained and suitable for the task.",
          "The employer should consider whether the worker is medically fit to drive, including eyesight, fatigue, medication and relevant health conditions.",
          "Journey schedules should not encourage speeding, unsafe hours, excessive fatigue or breaches of drivers' hours requirements.",
          "Where statutory drivers' hours or tachograph rules apply, the employer must organise work so drivers can comply and must retain and monitor the required records.",
          "Driving-related personal information, including licence and medical records, must be handled securely and only for legitimate purposes.",
          "A driving offence, loss of licence or accident should not automatically result in dismissal without first considering the role requirements, evidence, alternatives and a fair process.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Driving compliance should apply to company vehicles, pool vehicles and employees using their own vehicles for business journeys.",
          "The frequency of licence and vehicle checks should reflect the level of risk, mileage, role and driving history.",
          "Employees should be required to report new penalty points, disqualification, medical restrictions, accidents and changes to insurance promptly.",
          "Managers should not create unrealistic schedules that pressure employees to drive unsafely.",
          "Journey planning should consider distance, breaks, weather, road conditions and overnight stays.",
          "Vehicle defects should be reported promptly and unsafe vehicles removed from use.",
          "Driving incidents should be reviewed to identify training, vehicle, workload or journey-planning causes rather than only individual blame.",
          "Mileage and expenses rules should be clear where employees use personal vehicles.",
          "Where driving is essential to the role, the employer should plan how loss of licence or temporary medical restriction will be managed.",
          "Leo Talent and employee records should eventually track licence checks, restrictions, insurance, MOT, training and review dates.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's driving-for-work, company-vehicle and business-travel policies.",
          "Check rules covering licence checks, insurance, MOT, vehicle maintenance and employee-owned vehicles.",
          "Review mobile-phone, alcohol and drugs, fatigue, accident-reporting and health and safety policies.",
          "Confirm who is responsible for checking licences and vehicle documents.",
          "Check the process for employees to report penalty points, disqualifications, medical issues and accidents.",
          "Review mileage, expenses, fuel-card and vehicle-allocation procedures.",
          "Check whether driver training, assessments or additional authorisation are required for particular vehicles.",
          "Review disciplinary and capability procedures where the employee may no longer be able to fulfil an essential driving requirement.",
          "Confirm whether statutory drivers' hours, tachograph or operator-licensing rules apply.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "Is driving an essential part of the role or only occasional?",
          "What type and category of vehicle does the employee drive?",
          "Is the vehicle company-owned, hired, pooled or privately owned?",
          "Has the employee's driving licence been checked?",
          "Does the employee hold the correct licence category?",
          "Are there any penalty points, endorsements, restrictions or disqualifications?",
          "When was the most recent licence check completed?",
          "Does the employee have business-use insurance where using a private vehicle?",
          "Is the vehicle taxed, insured, MOT-compliant where required and roadworthy?",
          "Are daily or periodic vehicle checks completed?",
          "Has the employee reported any medical condition, medication, eyesight issue or fatigue concern?",
          "Has the employee received suitable driver training or assessment?",
          "Has there been an accident, near miss or driving complaint?",
          "Was the journey schedule realistic and safe?",
          "Do statutory drivers' hours, working-time or tachograph rules apply?",
          "Has the employee failed to disclose a driving offence or change in status?",
          "Could alternative duties, transport or temporary adjustments be considered?",
          "What does the contract say about the requirement to hold a driving licence?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Confirm whether driving is essential to the role and identify the vehicles and journeys involved.",
          "Obtain the employee's permission and use the official DVLA process to check their licence record.",
          "Verify that the licence is valid, appropriate for the vehicle and free from relevant disqualification or restriction.",
          "Set a proportionate review schedule for repeat licence checks.",
          "Require employees to report new points, disqualification, medical restrictions and accidents immediately.",
          "For privately owned vehicles used for work, obtain evidence of business-use insurance, MOT where required and roadworthiness.",
          "Ensure company and pool vehicles are maintained, inspected and removed from use where unsafe.",
          "Carry out a driving-for-work risk assessment covering the driver, vehicle and journey.",
          "Review workloads and schedules so they do not create unsafe driving pressure or fatigue.",
          "Provide training, instruction or driver assessment where the role or risk requires it.",
          "Investigate accidents and near misses fairly and identify underlying causes.",
          "Where licence loss or medical restriction affects the role, review the contract, medical evidence, alternatives and possible adjustments before taking formal action.",
          "Where statutory drivers' hours rules apply, retain and monitor the required records and organise work so compliance is possible.",
          "Keep secure records of licence checks, vehicle evidence, restrictions, training, incidents and decisions.",
        ]
      : [],
  };
}