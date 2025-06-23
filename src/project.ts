import {
  ProjectV2IterationFieldIteration,
  ProjectV2SingleSelectFieldOption,
} from "@octokit/graphql-schema";
import { Issues } from "./issues";
import {
  graphql,
  RoadmapItem,
  RoadmapItemConnection,
  RoadmapProject,
} from "./types";

export class Project {
  private issues: Issues;
  private roadmapProject?: RoadmapProject;
  private roadmapItems?: RoadmapItem[];

  constructor(
    private graphql: graphql,
    private organization: string,
    private project: number,
    private iterationField: string,
    private streamField: string
  ) {
    this.issues = new Issues(graphql);
  }

  async initialize(): Promise<void> {
    const query = `
            query ($owner: String!, $number: Int!, $iterationField: String!, $streamField: String!) {
                organization(login: $owner){
                    project: projectV2(number: $number) {
                        id
                        title
                        iterationField: field(name: $iterationField) {
                            __typename
                            ... on ProjectV2IterationField {
                                name
                                id
                                configuration {
                                    completedIterations {
                                        id
                                        startDate
                                        title
                                        duration
                                    }
                                    iterations {
                                        id
                                        startDate
                                        title
                                        duration
                                    }
                                }
                            }
                        }
                        streamField: field(name: $streamField) {
                            __typename
                            ... on ProjectV2SingleSelectField {
                                name
                                id
                                options {
                                    id
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

    const result = await this.graphql<{
      organization: { project: RoadmapProject };
    }>(query, {
      owner: this.organization,
      number: this.project,
      iterationField: this.iterationField,
      streamField: this.streamField,
    });

    this.roadmapProject = result.organization.project;
  }

  getCurrentIteration(): ProjectV2IterationFieldIteration {
    return this.roadmapProject!.iterationField.configuration.iterations[0];
  }

  getCurrentIterationName(): string {
    return this.getCurrentIteration().title;
  }

  getCurrentIterationId(): string {
    return this.getCurrentIteration().id;
  }

  getStreams(): ProjectV2SingleSelectFieldOption[] {
    return this.roadmapProject!.streamField.options;
  }

  getStreamId(stream: string): string {
    const option = this.roadmapProject!.streamField.options.find(
      (o) => o.name === stream
    );
    return option!.id;
  }

  async getStreamItems(stream: string): Promise<RoadmapItem[]> {
    const items = await this.getCurrentIterationItems();
    const streamId = this.getStreamId(stream);

    return items.filter((i) => {
      return i.stream?.optionId === streamId;
    });
  }

  async getOpenStreamItems(stream: string): Promise<RoadmapItem[]> {
    const items = await this.getStreamItems(stream);

    return items.filter((i) => {
      return i.content?.state === "OPEN";
    });
  }

  private async pageItems(
    query: string,
    cursor?: string
  ): Promise<RoadmapItem[]> {
    const items: RoadmapItem[] = [];

    const results = await this.graphql<{
      organization: { project: { items: RoadmapItemConnection } };
    }>(query, {
      owner: this.organization,
      number: this.project,
      iteration: this.iterationField,
      stream: this.streamField,
      cursor: cursor ?? null,
    });

    const { nodes, pageInfo } = results.organization.project.items;

    items.push(...(nodes as RoadmapItem[]));

    if (nodes!.length === 100 && cursor != pageInfo.endCursor) {
      const nextPage = await this.pageItems(query, pageInfo.endCursor!);
      items.push(...nextPage);
    }

    return items;
  }

  /**
   * Gets all items from the project board with the iteration and stream fields
   * that are assigned to the current iteration.
   *
   * @returns all items on the project board assigned to the current iteration.
   */
  private async getCurrentIterationItems(): Promise<RoadmapItem[]> {
    if (this.roadmapItems) {
      return this.roadmapItems;
    }

    const query = `
            query ($owner: String!, $number: Int!, $iteration: String!, $stream: String!, $cursor: String) {
                organization(login: $owner){
                    project: projectV2(number: $number) {
                        items(first: 100, after: $cursor) {
                            totalCount
                            pageInfo {
                                endCursor
                                hasNextPage
                            }
                            nodes {
                                id
                                iteration: fieldValueByName(name: $iteration) {
                                    __typename
                                    ... on ProjectV2ItemFieldIterationValue {
                                        iterationId
                                        title
                                    }
                                }
                                stream: fieldValueByName(name: $stream) {
                                    __typename
                                    ... on ProjectV2ItemFieldSingleSelectValue {
                                        optionId
                                        name
                                    }
                                }
                                content {
                                    ... on Issue {
                                        id
                                        number
                                        title
                                        state
                                        url
                                        labels(first:100) {
                                            nodes {
                                                id
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

    const iterationId = this.getCurrentIterationId();
    const items = await this.pageItems(query);

    this.roadmapItems = items.filter((i) => {
      // only returns items that are assigned to the current iteration
      return i.iteration?.iterationId === iterationId;
    });

    return this.roadmapItems;
  }
}
