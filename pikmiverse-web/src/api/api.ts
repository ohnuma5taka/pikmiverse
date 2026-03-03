import api from "./axios";
import type { Team } from "@/types/team.type";

export const getTeam = async (name: string): Promise<Team> => {
  const response = await api.get<Team>(`/teams/${name}`);
  return response.data;
};

export const getRank = async (
  name: string,
  wsId: string,
): Promise<{ score: number; rank: number }> => {
  const res = await api.get(`/teams/${name}/score/${wsId}`);
  return res.data;
};

export const getTargetScore = async (): Promise<number> => {
  return await api.get("/teams/target-score");
};

export const initData = async (): Promise<void> => {
  await api.post("/teams/init-data");
};

export const pikmiverse = async (command: string): Promise<void> => {
  await api.post(`/pikmiverse/${command}`);
};

export const sendPage = async (command: string): Promise<void> => {
  await api.post(`/page/${command}`);
};
