import {
  Issue,
  ProjectV2,
  ProjectV2Item,
  ProjectV2ItemConnection,
  ProjectV2ItemFieldIterationValue,
  ProjectV2ItemFieldSingleSelectValue,
  ProjectV2IterationField,
  ProjectV2SingleSelectField,
} from "@octokit/graphql-schema";
import {
  GraphQlResponse,
  RequestParameters,
} from "@octokit/graphql/dist-types/types";

export type graphql = <ResponseData>(
  query: string,
  parameters?: RequestParameters
) => GraphQlResponse<ResponseData>;

export interface RoadmapProject extends ProjectV2 {
  id: string;
  title: string;
  iterationField: ProjectV2IterationField;
  streamField: ProjectV2SingleSelectField;
}

export interface RoadmapItemConnection extends ProjectV2ItemConnection {
  nodes: RoadmapItem[];
}

export interface RoadmapItem extends ProjectV2Item {
  content: Issue;
  iteration: ProjectV2ItemFieldIterationValue;
  stream: ProjectV2ItemFieldSingleSelectValue;
}
