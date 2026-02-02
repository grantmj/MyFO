import { apiFetch } from "./client";

export interface ExampleItem {
  id: string;
  [key: string]: unknown;
}

export interface GetExampleResponse {
  items: ExampleItem[];
}

export interface CreateExampleResponse {
  created: boolean;
  item: ExampleItem;
  id: string;
}

export function getExample(): Promise<GetExampleResponse> {
  return apiFetch("/api/v1/example");
}

export function createExample(payload: Record<string, unknown>): Promise<CreateExampleResponse> {
  return apiFetch("/api/v1/example", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
