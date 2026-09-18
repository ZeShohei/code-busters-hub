import type {
  Absence,
  RotationAssignment,
  RotationResolution,
  Substitution,
  TeamMember,
} from "@/types/team";

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

const parseDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const formatDate = (date: Date) => {
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

  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);

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
}

interface GenerateTypedRotationsOptions {
  teamMembers: TeamMember[];
  startDate: string;
  numberOfWeeks: number;
  startIndex: number;
}

const generateDispatcherRotations = ({
  teamMembers,
  startDate,
  numberOfWeeks,
  startIndex,
}: GenerateTypedRotationsOptions): RotationAssignment[] => {
  const firstMonday = getMonday(parseDate(startDate));

  return Array.from(
    {
      length: numberOfWeeks,
    },
    (_, weekIndex) => {
      const rotationStartDate = addDays(firstMonday, weekIndex * 7);

      const rotationEndDate = addDays(rotationStartDate, 6);

      const teamMemberIndex = (startIndex + weekIndex) % teamMembers.length;

      const teamMember = teamMembers[teamMemberIndex];

      const startDateString = formatDate(rotationStartDate);

      return {
        id: `dispatcher-${startDateString}-${teamMember.id}`,
        teamMemberId: teamMember.id,
        startDate: startDateString,
        endDate: formatDate(rotationEndDate),
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
}: GenerateTypedRotationsOptions): RotationAssignment[] => {
  const configStartDate = parseDate(startDate);

  const endExclusive = addDays(configStartDate, numberOfWeeks * 7);

  const firstDeploymentDate = getThursdayOnOrAfter(configStartDate);

  const rotations: RotationAssignment[] = [];

  let deploymentDate = firstDeploymentDate;
  let deploymentIndex = 0;

  while (deploymentDate < endExclusive) {
    const teamMemberIndex = (startIndex + deploymentIndex) % teamMembers.length;

    const teamMember = teamMembers[teamMemberIndex];

    const date = formatDate(deploymentDate);

    rotations.push({
      id: `deployment-${date}-${teamMember.id}`,
      teamMemberId: teamMember.id,
      startDate: date,
      endDate: date,
      type: "deployment",
      deploymentKind: "regular",
    });

    deploymentDate = addDays(deploymentDate, 14);

    deploymentIndex += 1;
  }

  return rotations;
};

export const generateRotations = ({
  teamMembers,
  startDate,
  numberOfWeeks,
  type,
  startIndex = 0,
}: GenerateRotationsOptions): RotationAssignment[] => {
  if (teamMembers.length === 0 || numberOfWeeks <= 0) {
    return [];
  }

  const generatorOptions: GenerateTypedRotationsOptions = {
    teamMembers,
    startDate,
    numberOfWeeks,
    startIndex,
  };

  if (type === "deployment") {
    return generateDeploymentRotations(generatorOptions);
  }

  return generateDispatcherRotations(generatorOptions);
};
