import type { Absence, RotationAssignment, Substitution } from "@/types/team";

const rangesOverlap = (
  firstStartDate: string,
  firstEndDate: string,
  secondStartDate: string,
  secondEndDate: string,
) => {
  const firstStart = new Date(firstStartDate);
  const firstEnd = new Date(firstEndDate);

  const secondStart = new Date(secondStartDate);
  const secondEnd = new Date(secondEndDate);

  return firstStart <= secondEnd && secondStart <= firstEnd;
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
