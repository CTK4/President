export type PartyId = "democrat" | "republican" | "independent";
export type ChamberControl = PartyId | "split";
export type ElectionType = "midterm" | "presidential";
export type PersonaMode = "off" | "realistic" | "chaotic" | "social";
export type EventGenerationMode = "classic" | "hybrid" | "dynamic";
export type Pacing = "monthly" | "weekly";
export type BillAction = "support" | "oppose" | "negotiate" | "pressure" | "sign" | "veto" | "let_die";
export type CourtNominationStrategy = "consensus" | "ideological" | "historic";
export type TurnType =
  | "major_event"
  | "minor_event"
  | "agenda_month"
  | "crisis_followup"
  | "election_month"
  | "legislative_deadline"
  | "foreign_policy_window";

export type AgendaActionCategory =
  | "domestic_policy"
  | "economic_policy"
  | "legislation"
  | "executive_action"
  | "judicial_legal_strategy"
  | "foreign_policy"
  | "national_security"
  | "communications"
  | "cabinet_personnel"
  | "campaign_party_building";

export type PolicyVehicle =
  | "legislation"
  | "executive_order"
  | "agency_rulemaking"
  | "budget_request"
  | "public_campaign"
  | "diplomatic_action"
  | "military_action"
  | "covert_operation"
  | "judicial_nomination"
  | "personnel_action";

export type CovertOperationType =
  | "intelligence_collection"
  | "cyber_disruption"
  | "counterterror_disruption"
  | "hostage_recovery_support"
  | "support_friendly_opposition"
  | "sabotage_hostile_capability"
  | "asset_exfiltration"
  | "regime_destabilization";

export type MilitaryActionType =
  | "show_of_force"
  | "deploy_carrier_group"
  | "airstrike"
  | "limited_missile_strike"
  | "special_operations_raid"
  | "no_fly_zone"
  | "peacekeeping_deployment"
  | "humanitarian_intervention"
  | "evacuation_operation"
  | "counterterror_campaign"
  | "troop_surge"
  | "full_invasion"
  | "withdrawal";

export type CovertOutcome =
  | "clean_success"
  | "partial_success"
  | "failure_no_exposure"
  | "failure_with_exposure"
  | "success_with_exposure"
  | "blowback"
  | "congressional_leak"
  | "civilian_harm_scandal";

export type MilitaryOutcome =
  | "deterrence_success"
  | "target_destroyed"
  | "limited_success"
  | "mission_failure"
  | "casualties_sustained"
  | "civilian_harm"
  | "retaliation"
  | "regional_escalation"
  | "quagmire"
  | "negotiated_settlement";

export type StrategicActionStatus = "proposed" | "active" | "completed" | "exposed" | "cancelled";
export type AgendaProjectStatus = "active" | "blocked" | "completed" | "cancelled";
export type AuthorizationLevel = "presidential_finding" | "nsc_review" | "cabinet_level" | "agency_discretion";
export type CongressionalAuthorization = "clear" | "ambiguous" | "none" | "opposed";

export type Effect = {
  target: string;
  amount: number;
};

export type Party = {
  id: PartyId;
  name: string;
  shortName: string;
  color: string;
  ideology: number;
  coalition: string[];
};

export type Scenario = {
  id: string;
  title: string;
  category: string;
  startDate: string;
  description: string;
  startingApproval: number;
  congressControl: ChamberControl;
  courtLean: number;
  economy: Economy;
  eventIds: string[];
  tags: string[];
};

export type President = {
  name: string;
  gender: string;
  party: PartyId;
  age: number;
  ethnicity: string;
  religion: string;
  maritalStatus: string;
  education: string;
  wealth: string;
  background: string;
  militaryService: string;
  scandalHistory: string;
  homeRegion: string;
  homeState?: string;
  communicationStyle: string;
  ideology: string;
  mandateStrength: string;
  traits: string[];
};

export type VicePresident = {
  id: string;
  name: string;
  ageBand: "40s" | "50s" | "60s" | "70s";
  gender: string;
  region: string;
  ideology: string;
  background: string;
  biography: string;
  competence: number;
  loyalty: number;
  ambition: number;
  publicAppeal: number;
  senateSkill: number;
  scandalRisk: number;
  portfolio?: string;
  approval: number;
};

export type Congress = {
  house: {
    seats: Record<PartyId, number>;
    control: ChamberControl;
    speakerRelationship: number;
  };
  senate: {
    seats: Record<PartyId, number>;
    control: ChamberControl;
    majorityLeaderRelationship: number;
    filibusterThreshold: number;
  };
  committeeObstruction: number;
  cooperation: number;
};

export type Justice = {
  id: string;
  name: string;
  ideology: number;
  age: number;
  health: number;
  appointedBy: PartyId;
  judicialPhilosophy: "originalist" | "textualist" | "living_constitutionalist" | "pragmatist" | "institutionalist";
  legitimacyConcern: number;
  retirementChance: number;
  chief?: boolean;
};

export type SupremeCourtVacancy = {
  id: string;
  previousJusticeName: string;
  previousIdeology: number;
  openedMonth: number;
  reason: "retirement" | "death" | "elevation";
  chief: boolean;
};

export type SupremeCourt = {
  justices: Justice[];
  legitimacy: number;
};

export type CabinetMember = {
  id: string;
  name: string;
  office: string;
  competence: number;
  loyalty: number;
  ideology: number;
  mediaSkill: number;
  scandalRisk: number;
  agencyControl: number;
  relationshipWithPresident: number;
  fatigue: number;
};

export type InstitutionalOfficial = {
  id: string;
  office: string;
  name: string;
  competence: number;
  loyalty: number;
  ideology: number;
  independence: number;
  monthsRemaining?: number;
  removable: boolean;
  firingCost: number;
};

export type Economy = {
  gdpGrowth: number;
  unemployment: number;
  inflation: number;
  interestRates: number;
  deficit: number;
  nationalDebt: number;
  consumerConfidence: number;
  stockMarket: number;
  wageGrowth: number;
  housingAffordability: number;
  gasPrices: number;
  poverty: number;
};

export type ForeignActor = {
  id: string;
  name: string;
  relationship: number;
  tension: number;
  tradeImportance: number;
  militaryRisk: number;
  humanRightsPressure: number;
};

export type StateApproval = {
  name: string;
  abbreviation: string;
  electoralVotes: number;
  partisanLean: number;
  approval: number;
  economySensitivity: number;
  socialIssueSensitivity: number;
  foreignPolicySensitivity: number;
  demographicProfile: string[];
  turnout: number;
  governorParty: PartyId;
  senateDelegation: PartyId[];
};

export type Stakeholder = {
  id: string;
  name: string;
  approval: number;
  power: number;
  issuePriorities: string[];
  ideology: number;
  patience: number;
  donationCapacity: number;
  mobilizationCapacity: number;
  mediaInfluence: number;
};

export type Persona = {
  id: string;
  name: string;
  demographics: string[];
  ideology: number;
  topIssues: string[];
  approval: number;
  trust: number;
  reactionStyle: string;
  weight: number;
};

export type ResponseOption = {
  id: string;
  title: string;
  style: "institutional" | "bold" | "compromise";
  text: string;
  effects: Effect[];
  tags: string[];
  risk: number;
};

export type ScenarioEvent = {
  id: string;
  title: string;
  dateWindow: string;
  description: string;
  issueTags: string[];
  severity: number;
  urgency: number;
  affectedGroups: string[];
  affectedStates: string[];
  responseOptions: ResponseOption[];
  allowCustomResponse: boolean;
  historicalNotes?: string;
};

export type ParsedPolicy = {
  tags: string[];
  tone: "cautious" | "moderate" | "combative" | "empathetic" | "technocratic";
  ideologyScore: number;
  assertiveness: number;
  legalityRisk: number;
  fiscalCost: number;
  implementationComplexity: number;
};

export type PlayerResponse =
  | { kind: "suggested"; optionId: string }
  | { kind: "custom"; text: string };

export type AgendaResources = {
  whiteHouseBandwidth: number;
  congressionalCapital: number;
  mediaAttention: number;
  agencyCapacity: number;
  politicalCapital: number;
};

export type AgendaProject = {
  id: string;
  title: string;
  category: AgendaActionCategory;
  vehicle: PolicyVehicle;
  objective: string;
  progress: number;
  monthlyCost: Partial<AgendaResources>;
  blockers: string[];
  status: AgendaProjectStatus;
  startedMonth: number;
  expectedDurationMonths: number;
};

export type AdvisorReview = {
  advisor: string;
  stance: "supportive" | "cautious" | "opposed";
  note: string;
};

export type FutureConsequence =
  | "leaks"
  | "oversight_investigations"
  | "diplomatic_fallout"
  | "retaliation"
  | "scandal_seeds"
  | "war_fatigue"
  | "congressional_hearings"
  | "cabinet_resignations";

export type CovertOperation = {
  id: string;
  operationType: CovertOperationType;
  targetActorId: string;
  objective: string;
  authorizationLevel: AuthorizationLevel;
  successChance: number;
  exposureRisk: number;
  blowbackRisk: number;
  legalRisk: number;
  diplomaticRisk: number;
  civilianHarmRisk: number;
  durationMonths: number;
  status: StrategicActionStatus;
  startedMonth: number;
  outcome?: CovertOutcome;
  advisorReview: AdvisorReview[];
  futureConsequences: FutureConsequence[];
};

export type MilitaryAction = {
  id: string;
  actionType: MilitaryActionType;
  targetActorId: string;
  objective: string;
  legalBasis: string;
  congressionalAuthorization: CongressionalAuthorization;
  alliedSupport: number;
  escalationRisk: number;
  casualtyRisk: number;
  civilianHarmRisk: number;
  successChance: number;
  publicSupport: number;
  warPowersRisk: number;
  warPowersClock?: number;
  status: StrategicActionStatus;
  startedMonth: number;
  outcome?: MilitaryOutcome;
  advisorReview: AdvisorReview[];
  futureConsequences: FutureConsequence[];
};

export type ThreatMatrixEntry = {
  actorId: string;
  threatLevel: number;
  intelligenceConfidence: number;
};

export type NationalSecurityState = {
  activeDeployments: MilitaryAction[];
  covertOperations: CovertOperation[];
  warPowersClock: number | null;
  militaryReadiness: number;
  casualties: number;
  alliedSupport: number;
  threatMatrix: ThreatMatrixEntry[];
  intelligenceConfidence: number;
  pendingNscDecisions: string[];
};

export type ActionResultDetails = {
  actionVehicle: PolicyVehicle;
  objective: string;
  legalBasis: string;
  successFailure: string;
  publicVisibility: "low" | "medium" | "high";
  congressReaction: string;
  alliedReaction: string;
  adversaryReaction: string;
  institutionalRisk: string;
  futureRisks: FutureConsequence[];
  timelineEntryId: string;
};

export type AgendaActionInput = {
  category: AgendaActionCategory;
  vehicle: PolicyVehicle;
  objective: string;
};

export type CovertOperationInput = {
  operationType: CovertOperationType;
  targetActorId: string;
  objective: string;
  authorizationLevel: AuthorizationLevel;
  durationMonths: number;
};

export type MilitaryActionInput = {
  actionType: MilitaryActionType;
  targetActorId: string;
  objective: string;
  legalBasis: string;
  congressionalAuthorization: CongressionalAuthorization;
};

export type Bill = {
  id: string;
  title: string;
  issueArea: string;
  sponsorParty: PartyId;
  status: "introduced" | "house_passed" | "senate_passed" | "on_desk" | "signed" | "vetoed" | "failed";
  houseSupport: number;
  senateSupport: number;
  publicSupport: number;
  stakeholderEffects: Effect[];
  economyEffects: Effect[];
  requiresFilibusterOverride: boolean;
};

export type CourtCase = {
  id: string;
  title: string;
  challengedPolicyId: string;
  constitutionalIssue: string;
  lowerCourtStatus: string;
  plaintiffType: "state" | "private_party" | "congress" | "civil_rights_group" | "business_group";
  governmentWinChance: number;
  decisionMonth: number;
  stakes: Effect[];
  status: "pending" | "upheld" | "narrowed" | "paused" | "struck_down" | "remanded";
};

export type Crisis = {
  id: string;
  type: string;
  severity: number;
  duration: number;
  publicFear: number;
  institutionalConfidence: number;
  federalResponseQuality: number;
  stateCooperation: number;
  mediaPressure: number;
  deathTollOrDamage: number;
  economicImpact: number;
};

export type Scandal = {
  id: string;
  type: string;
  stage: "rumor" | "media_story" | "inquiry" | "special_counsel" | "hearings" | "report" | "impeachment" | "resolved";
  truthLevel: number;
  evidenceStrength: number;
  mediaIntensity: number;
  oppositionAggression: number;
  partyDefense: number;
  publicFatigue: number;
  legalExposure: number;
};

export type MediaState = {
  tone: number;
  headlines: {
    left: string;
    center: string;
    right: string;
    social: string;
  };
  narrative: string;
};

export type ApprovalState = {
  overall: number;
  party: number;
  opposition: number;
  independent: number;
  enthusiasm: number;
  trust: number;
  competence: number;
  honesty: number;
  strength: number;
  empathy: number;
};

export type TimelineEntry = {
  id: string;
  month: number;
  dateLabel: string;
  title: string;
  decisionText: string;
  effectsSummary: string[];
  approvalBefore: number;
  approvalAfter: number;
  tags: string[];
};

export type LegacyScore = {
  total: number;
  title: string;
  categories: Array<{ name: string; score: number }>;
  ending: string;
};

export type GameSettings = {
  economicSimulation: boolean;
  checksAndBalances: boolean;
  personaMode: PersonaMode;
  socialEngineeringMode: boolean;
  eventGeneration: EventGenerationMode;
  warMode: boolean;
  pacing: Pacing;
  aiFlavorText: boolean;
};

export type GameStatus =
  | "setup"
  | "governing"
  | "midterm"
  | "reelection"
  | "completed"
  | "defeated"
  | "removed"
  | "resigned"
  | "vp_succession";

export type GameState = {
  schemaVersion: number;
  id: string;
  scenarioId: string;
  currentMonth: number;
  currentDate: string;
  currentTurnType: TurnType;
  president: President;
  vicePresident: VicePresident;
  congress: Congress;
  supremeCourt: SupremeCourt;
  cabinet: CabinetMember[];
  institutionalOfficials: InstitutionalOfficial[];
  economy: Economy;
  foreignRelations: ForeignActor[];
  states: StateApproval[];
  stakeholders: Stakeholder[];
  personas: Persona[];
  media: MediaState;
  currentEvent: ScenarioEvent;
  schedule: string[];
  pendingBills: Bill[];
  pendingCases: CourtCase[];
  pendingCourtVacancies?: SupremeCourtVacancy[];
  agendaResources: AgendaResources;
  agendaProjects: AgendaProject[];
  nationalSecurity: NationalSecurityState;
  activeCrises: Crisis[];
  scandals: Scandal[];
  timeline: TimelineEntry[];
  approval: ApprovalState;
  legacy: LegacyScore;
  settings: GameSettings;
  seed: string;
  status: GameStatus;
  lastResolution?: TurnResolutionSummary;
  lastActionResult?: ActionResultDetails;
};

export type TurnResolutionSummary = {
  parsedPolicy: ParsedPolicy;
  approvalDelta: number;
  congressDelta: number;
  courtRiskDelta: number;
  cabinetDelta: number;
  economyDelta: Partial<Economy>;
  stakeholderDeltas: Record<string, number>;
  personaDeltas: Record<string, number>;
  mediaToneDelta: number;
};

export type TurnResolution = {
  game: GameState;
  effects: TurnResolutionSummary;
  reactions: string[];
};

export type ElectionResult = {
  type: ElectionType;
  game: GameState;
  winner: PartyId;
  playerWon: boolean;
  electoralVotes?: Record<PartyId, number>;
  popularVote?: Record<PartyId, number>;
  houseSeats: number;
  senateSeats: number;
};

export type NewGameConfig = {
  seed?: string;
  scenarioId: string;
  presidentName: string;
  partyId: PartyId;
  background: string;
  gender?: string;
  age?: number;
  ethnicity?: string;
  religion?: string;
  maritalStatus?: string;
  education?: string;
  wealth?: string;
  militaryService?: string;
  scandalHistory?: string;
  homeRegion?: string;
  communicationStyle?: string;
  ideology?: string;
  mandateStrength?: string;
  vicePresidentId?: string;
  vicePresidentPortfolio?: string;
  settings?: Partial<GameSettings>;
};
