import api from "./axios";
import type { Team } from "@/types/team";

// GET /teams/{name}
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

// POST /init-data
export const initData = async (): Promise<void> => {
  await api.post("/init-data");
};
