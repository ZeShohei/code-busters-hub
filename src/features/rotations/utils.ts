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
  substitutions: Substitution[],
) => {
  return substitutions.find(
    (substitution) =>
      substitution.teamMemberId === rotation.teamMemberId &&
      rangesOverlap(
        rotation.startDate,
        rotation.endDate,
        substitution.startDate,
        substitution.endDate,
      ),
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

  const substitution = getRotationSubstitution(rotation, substitutions);

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

  const substitution = getRotationSubstitution(rotation, substitutions);

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

interface GenerateRotationsOptions {
  teamMembers: TeamMember[];
  startDate: string;
  numberOfWeeks: number;
  type: RotationAssignment["type"];
  startIndex?: number;
}

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

  const firstMonday = getMonday(parseDate(startDate));

  return Array.from({ length: numberOfWeeks }, (_, weekIndex) => {
    const rotationStartDate = addDays(firstMonday, weekIndex * 7);

    const rotationEndDate = addDays(rotationStartDate, 6);

    const teamMemberIndex = (startIndex + weekIndex) % teamMembers.length;

    const teamMember = teamMembers[teamMemberIndex];

    return {
      id: `${type}-${weekIndex + 1}`,
      teamMemberId: teamMember.id,
      startDate: formatDate(rotationStartDate),
      endDate: formatDate(rotationEndDate),
      type,
    };
  });
};
