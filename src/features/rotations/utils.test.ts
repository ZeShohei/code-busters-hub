import type { TeamMember } from "@/types/team";

import {
  T2_TEAM_ROTATION_ID,
  generateRotations,
  getRotationAssigneeName,
  isT2TeamRotation,
  resolveRotation,
} from "./utils";

const teamMembers: TeamMember[] = [
  {
    id: "stefan",
    firstName: "Stefan",
    lastName: "Bozkurt",
    displayName: "Stefan Bozkurt",
    email: "stefan@example.com",
    username: "stefan",
    active: true,
    role: "member",
  },
  {
    id: "shpetim",
    firstName: "Shpetim",
    lastName: "Islami",
    displayName: "Shpetim Islami",
    email: "shpetim@example.com",
    username: "shpetim",
    active: true,
    role: "member",
  },
  {
    id: "denis",
    firstName: "Denis",
    lastName: "Fejzic",
    displayName: "Denis Fejzic",
    email: "denis@example.com",
    username: "denis",
    active: true,
    role: "admin",
  },
];

describe("Rotationslogik", () => {
  describe("Deployment", () => {
    it("alterniert zwischen T2 und Code Busters", () => {
      const rotations = generateRotations({
        teamMembers,
        startDate: "2026-09-21",
        numberOfWeeks: 16,
        type: "deployment",
        startIndex: 0,
        deploymentStartsWithT2: true,
      });

      expect(
        rotations.map((rotation) => ({
          date: rotation.startDate,
          teamMemberId: rotation.teamMemberId,
        })),
      ).toEqual([
        {
          date: "2026-09-24",
          teamMemberId: T2_TEAM_ROTATION_ID,
        },
        {
          date: "2026-10-08",
          teamMemberId: "stefan",
        },
        {
          date: "2026-10-22",
          teamMemberId: T2_TEAM_ROTATION_ID,
        },
        {
          date: "2026-11-05",
          teamMemberId: "shpetim",
        },
        {
          date: "2026-11-19",
          teamMemberId: T2_TEAM_ROTATION_ID,
        },
        {
          date: "2026-12-03",
          teamMemberId: "denis",
        },
        {
          date: "2026-12-17",
          teamMemberId: T2_TEAM_ROTATION_ID,
        },
        {
          date: "2026-12-31",
          teamMemberId: "stefan",
        },
      ]);
    });

    it("schaltet die Code-Busters-Person bei einem T2-Slot nicht weiter", () => {
      const rotations = generateRotations({
        teamMembers,
        startDate: "2026-09-21",
        numberOfWeeks: 8,
        type: "deployment",
        startIndex: 1,
        deploymentStartsWithT2: true,
      });

      expect(rotations.map((rotation) => rotation.teamMemberId)).toEqual([
        T2_TEAM_ROTATION_ID,
        "shpetim",
        T2_TEAM_ROTATION_ID,
        "denis",
      ]);
    });

    it("kann bewusst mit Code Busters statt T2 beginnen", () => {
      const rotations = generateRotations({
        teamMembers,
        startDate: "2026-09-21",
        numberOfWeeks: 10,
        type: "deployment",
        startIndex: 1,
        deploymentStartsWithT2: false,
      });

      expect(rotations.map((rotation) => rotation.teamMemberId)).toEqual([
        "shpetim",
        T2_TEAM_ROTATION_ID,
        "denis",
        T2_TEAM_ROTATION_ID,
        "stefan",
      ]);
    });

    it("erzeugt reguläre Deployments alle 14 Tage am Donnerstag", () => {
      const rotations = generateRotations({
        teamMembers,
        startDate: "2026-09-21",
        numberOfWeeks: 8,
        type: "deployment",
        startIndex: 0,
        deploymentStartsWithT2: true,
      });

      expect(
        rotations.map((rotation) => ({
          startDate: rotation.startDate,
          endDate: rotation.endDate,
        })),
      ).toEqual([
        {
          startDate: "2026-09-24",
          endDate: "2026-09-24",
        },
        {
          startDate: "2026-10-08",
          endDate: "2026-10-08",
        },
        {
          startDate: "2026-10-22",
          endDate: "2026-10-22",
        },
        {
          startDate: "2026-11-05",
          endDate: "2026-11-05",
        },
      ]);
    });

    it("setzt das erste Deployment auf den nächsten Donnerstag", () => {
      const rotations = generateRotations({
        teamMembers,
        startDate: "2026-09-25",
        numberOfWeeks: 4,
        type: "deployment",
        startIndex: 0,
        deploymentStartsWithT2: true,
      });

      expect(rotations[0]?.startDate).toBe("2026-10-01");
    });

    it("erkennt einen T2-Slot eindeutig", () => {
      const rotations = generateRotations({
        teamMembers,
        startDate: "2026-09-21",
        numberOfWeeks: 4,
        type: "deployment",
        startIndex: 0,
        deploymentStartsWithT2: true,
      });

      expect(isT2TeamRotation(rotations[0])).toBe(true);

      expect(isT2TeamRotation(rotations[1])).toBe(false);
    });

    it("zeigt T2 mit dem korrekten Namen an", () => {
      expect(getRotationAssigneeName(T2_TEAM_ROTATION_ID, teamMembers)).toBe(
        "T2 Team",
      );
    });

    it("behandelt T2 auch ohne Abwesenheitsdaten als regulär besetzt", () => {
      const rotations = generateRotations({
        teamMembers,
        startDate: "2026-09-21",
        numberOfWeeks: 4,
        type: "deployment",
        startIndex: 0,
        deploymentStartsWithT2: true,
      });

      const t2Rotation = rotations[0];

      const resolution = resolveRotation(t2Rotation, [], []);

      expect(resolution).toEqual({
        status: "regular",
        assignedTeamMemberId: T2_TEAM_ROTATION_ID,
        effectiveTeamMemberId: T2_TEAM_ROTATION_ID,
      });
    });

    it("verwendet bei Abwesenheit eines Code-Busters-Mitglieds dessen Vertretung", () => {
      const rotations = generateRotations({
        teamMembers,
        startDate: "2026-09-21",
        numberOfWeeks: 4,
        type: "deployment",
        startIndex: 0,
        deploymentStartsWithT2: true,
      });

      const stefanDeployment = rotations[1];

      const resolution = resolveRotation(
        stefanDeployment,
        [
          {
            id: "absence-stefan",
            teamMemberId: "stefan",
            startDate: "2026-10-08",
            endDate: "2026-10-08",
            type: "vacation",
          },
        ],
        [
          {
            id: "substitution-stefan",
            absenceId: "absence-stefan",
            teamMemberId: "stefan",
            substituteTeamMemberId: "shpetim",
            startDate: "2026-10-08",
            endDate: "2026-10-08",
          },
        ],
      );

      expect(resolution).toEqual({
        status: "substitution",
        assignedTeamMemberId: "stefan",
        effectiveTeamMemberId: "shpetim",
      });
    });
  });

  describe("Dispatcher", () => {
    it("behält die wöchentliche Dispatcher-Rotation bei", () => {
      const rotations = generateRotations({
        teamMembers,
        startDate: "2026-09-23",
        numberOfWeeks: 4,
        type: "dispatcher",
        startIndex: 0,
      });

      expect(
        rotations.map((rotation) => ({
          startDate: rotation.startDate,
          endDate: rotation.endDate,
          teamMemberId: rotation.teamMemberId,
        })),
      ).toEqual([
        {
          startDate: "2026-09-21",
          endDate: "2026-09-27",
          teamMemberId: "stefan",
        },
        {
          startDate: "2026-09-28",
          endDate: "2026-10-04",
          teamMemberId: "shpetim",
        },
        {
          startDate: "2026-10-05",
          endDate: "2026-10-11",
          teamMemberId: "denis",
        },
        {
          startDate: "2026-10-12",
          endDate: "2026-10-18",
          teamMemberId: "stefan",
        },
      ]);
    });
  });
});
