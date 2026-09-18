import { describe, expect, it } from "@jest/globals";

import type { TeamMember } from "@/types/team";

import { T2_TEAM_ROTATION_ID, generateRotations } from "./utils";

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

describe("generateRotations", () => {
  describe("deployment", () => {
    it("alterniert zwischen T2 und Code Busters ohne die interne Personenrotation bei T2 weiterzuschalten", () => {
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

    it("kann mit einem Code-Busters-Slot beginnen", () => {
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

    it("erzeugt Deployments ausschließlich als einzelne Termine im 14-Tage-Abstand", () => {
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
  });

  describe("dispatcher", () => {
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
