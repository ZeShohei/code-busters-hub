import type {
  Absence,
  RotationAssignment,
  RotationResolution,
  Substitution,
  TeamMember,
} from "@/types/team";

/*
 * T2 ist bewusst kein TeamMember in unserer Datenbank.
 *
 * Für die generierte Deployment-Rotation verwenden wir
 * lediglich eine stabile technische ID.
 */
export const T2_TEAM_ROTATION_ID = "__t2-team__";

export const T2_TEAM_NAME = "T2 Team";

export const isT2TeamRotation = (rotation: RotationAssignment) => {
  return (
    rotation.type === "deployment" &&
    rotation.teamMemberId === T2_TEAM_ROTATION_ID
  );
};

export const getRotationAssigneeName = (
  teamMemberId: string,
  teamMembers: TeamMember[],
) => {
  if (teamMemberId === T2_TEAM_ROTATION_ID) {
    return T2_TEAM_NAME;
  }

  return (
    teamMembers.find((member) => member.id === teamMemberId)?.displayName ??
    "Unbekannt"
  );
};

const rangesOverlap = (
  firstStartDate: string,
  firstEndDate: string,
  secondStartDate: string,
  secondEndDate: string,
) => {
  return firstStartDate <= secondEndDate && secondStartDate <= firstEndDate;
};

export const getRotationAbsence = (
  rotation: RotationAssignment,
  absences: Absence[],
) => {
  /*
   * Das T2 Team gehört nicht zu unserer Benutzerverwaltung
   * und besitzt deshalb auch keine Abwesenheiten.
   */
  if (isT2TeamRotation(rotation)) {
    return undefined;
  }

  return absences.find(
    (absence) =>
      absence.teamMemberId === rotation.teamMemberId &&
      rangesOverlap(
        rotation.startDate,
        rotation.endDate,
        absence.startDate,
        absence.endDate,
      ),
  );
};

export const getRotationSubstitution = (
  rotation: RotationAssignment,
  absences: Absence[],
  substitutions: Substitution[],
) => {
  const absence = getRotationAbsence(rotation, absences);

  if (!absence) {
    return undefined;
  }

  return substitutions.find(
    (substitution) => substitution.absenceId === absence.id,
  );
};

export const getEffectiveRotationTeamMemberId = (
  rotation: RotationAssignment,
  absences: Absence[],
  substitutions: Substitution[],
) => {
  const absence = getRotationAbsence(rotation, absences);

  if (!absence) {
    return rotation.teamMemberId;
  }

  const substitution = substitutions.find(
    (item) => item.absenceId === absence.id,
  );

  return substitution?.substituteTeamMemberId ?? rotation.teamMemberId;
};

export const resolveRotation = (
  rotation: RotationAssignment,
  absences: Absence[],
  substitutions: Substitution[],
): RotationResolution => {
  const absence = getRotationAbsence(rotation, absences);

  if (!absence) {
    return {
      status: "regular",
      assignedTeamMemberId: rotation.teamMemberId,
      effectiveTeamMemberId: rotation.teamMemberId,
    };
  }

  const substitution = substitutions.find(
    (item) => item.absenceId === absence.id,
  );

  if (!substitution) {
    return {
      status: "uncovered",
      assignedTeamMemberId: rotation.teamMemberId,
      effectiveTeamMemberId: rotation.teamMemberId,
    };
  }

  return {
    status: "substitution",
    assignedTeamMemberId: rotation.teamMemberId,
    effectiveTeamMemberId: substitution.substituteTeamMemberId,
  };
};

const parseLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, amount: number) => {
  const result = new Date(date);

  result.setDate(result.getDate() + amount);

  return result;
};

const getMonday = (date: Date) => {
  const result = new Date(date);

  const day = result.getDay();

  const diffToMonday = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diffToMonday);

  return result;
};

const getThursdayOnOrAfter = (date: Date) => {
  const result = new Date(date);

  const currentDay = result.getDay();

  const thursday = 4;

  const daysUntilThursday = (thursday - currentDay + 7) % 7;

  result.setDate(result.getDate() + daysUntilThursday);

  return result;
};

interface GenerateRotationsOptions {
  teamMembers: TeamMember[];
  startDate: string;
  numberOfWeeks: number;
  type: RotationAssignment["type"];
  startIndex?: number;
  deploymentStartsWithT2?: boolean;
}

interface GenerateTypedRotationsOptions {
  teamMembers: TeamMember[];
  startDate: string;
  numberOfWeeks: number;
  startIndex: number;
  deploymentStartsWithT2: boolean;
}

const generateDispatcherRotations = ({
  teamMembers,
  startDate,
  numberOfWeeks,
  startIndex,
}: GenerateTypedRotationsOptions): RotationAssignment[] => {
  const firstMonday = getMonday(parseLocalDate(startDate));

  return Array.from(
    {
      length: numberOfWeeks,
    },
    (_, weekIndex) => {
      const rotationStartDate = addDays(firstMonday, weekIndex * 7);

      const rotationEndDate = addDays(rotationStartDate, 6);

      const teamMemberIndex = (startIndex + weekIndex) % teamMembers.length;

      const teamMember = teamMembers[teamMemberIndex];

      const startDateString = formatLocalDate(rotationStartDate);

      return {
        id: `dispatcher-${startDateString}-${teamMember.id}`,
        teamMemberId: teamMember.id,
        startDate: startDateString,
        endDate: formatLocalDate(rotationEndDate),
        type: "dispatcher",
      };
    },
  );
};

const generateDeploymentRotations = ({
  teamMembers,
  startDate,
  numberOfWeeks,
  startIndex,
  deploymentStartsWithT2,
}: GenerateTypedRotationsOptions): RotationAssignment[] => {
  const configStartDate = parseLocalDate(startDate);

  const endExclusive = addDays(configStartDate, numberOfWeeks * 7);

  const firstDeploymentDate = getThursdayOnOrAfter(configStartDate);

  const rotations: RotationAssignment[] = [];

  let deploymentDate = firstDeploymentDate;

  /*
   * Zählt alle Deployment-Slots:
   *
   * Slot 0
   * Slot 1
   * Slot 2
   * ...
   *
   * Jeder Slot liegt 14 Tage auseinander.
   */
  let deploymentSlotIndex = 0;

  /*
   * Wird ausschließlich dann erhöht,
   * wenn Code Busters an der Reihe ist.
   *
   * Ein T2-Slot verbraucht also KEINEN
   * Eintrag aus der internen Personenrotation.
   */
  let codeBustersDeploymentIndex = 0;

  while (deploymentDate < endExclusive) {
    const date = formatLocalDate(deploymentDate);

    const isT2Slot = deploymentStartsWithT2
      ? deploymentSlotIndex % 2 === 0
      : deploymentSlotIndex % 2 === 1;

    if (isT2Slot) {
      rotations.push({
        id: `deployment-${date}-t2`,
        teamMemberId: T2_TEAM_ROTATION_ID,
        startDate: date,
        endDate: date,
        type: "deployment",
        deploymentKind: "regular",
      });
    } else {
      const teamMemberIndex =
        (startIndex + codeBustersDeploymentIndex) % teamMembers.length;

      const teamMember = teamMembers[teamMemberIndex];

      rotations.push({
        id: `deployment-${date}-${teamMember.id}`,
        teamMemberId: teamMember.id,
        startDate: date,
        endDate: date,
        type: "deployment",
        deploymentKind: "regular",
      });

      codeBustersDeploymentIndex += 1;
    }

    /*
     * Der nächste Deployment-Termin ist
     * immer 14 Tage später.
     */
    deploymentDate = addDays(deploymentDate, 14);

    deploymentSlotIndex += 1;
  }

  return rotations;
};

export const generateRotations = ({
  teamMembers,
  startDate,
  numberOfWeeks,
  type,
  startIndex = 0,
  deploymentStartsWithT2 = false,
}: GenerateRotationsOptions): RotationAssignment[] => {
  if (teamMembers.length === 0 || numberOfWeeks <= 0) {
    return [];
  }

  const generatorOptions: GenerateTypedRotationsOptions = {
    teamMembers,
    startDate,
    numberOfWeeks,
    startIndex,
    deploymentStartsWithT2,
  };

  if (type === "deployment") {
    return generateDeploymentRotations(generatorOptions);
  }

  return generateDispatcherRotations(generatorOptions);
};
