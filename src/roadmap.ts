import { CreateIssueInput, CreateIssuePayload, Issue, IssueConnection, ProjectV2, ProjectV2Item, ProjectV2ItemConnection, ProjectV2ItemFieldIterationValue, ProjectV2ItemFieldSingleSelectValue, ProjectV2IterationField, ProjectV2IterationFieldIteration, ProjectV2SingleSelectField, ProjectV2SingleSelectFieldOption, Repository, UpdateIssueInput, UpdateIssuePayload } from '@octokit/graphql-schema';
import { GraphQlResponse, RequestParameters } from '@octokit/graphql/dist-types/types';

type graphql = <ResponseData>(query: string, parameters?: RequestParameters) => GraphQlResponse<ResponseData>;

interface RoadmapProject extends ProjectV2 {
    id: string;
    title: string;
    iterationField: ProjectV2IterationField;
    streamField: ProjectV2SingleSelectField;
}

interface RoadmapItemConnection extends ProjectV2ItemConnection {
    nodes: RoadmapItem[];
}

interface RoadmapItem extends ProjectV2Item {
    content: Issue;
    iteration: ProjectV2ItemFieldIterationValue;
    stream: ProjectV2ItemFieldSingleSelectValue;
}

export class Project {
    private roadmapProject?: RoadmapProject;
    private itemsPromise?: Promise<RoadmapItem[]>;

    constructor(private graphql: graphql, private organization: string, private project: number, private iterationField: string, private streamField: string) { }

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

        const result = await this.graphql<{ organization: { project: RoadmapProject } }>(query, {
            owner: this.organization,
            number: this.project,
            iterationField: this.iterationField,
            streamField: this.streamField
        });

        this.roadmapProject = result.organization.project;
    }

    getCurrentIterationName(): string {
        return this.getIterations()[0].title;
    }

    getIterations(): ProjectV2IterationFieldIteration[] {
        return this.roadmapProject!.iterationField.configuration.iterations;
    }

    getStreams(): ProjectV2SingleSelectFieldOption[] {
        return this.roadmapProject!.streamField.options;
    }

    async getStreamItems(stream: string): Promise<RoadmapItem[]> {
        const items = await this.getItems();

        const iterationId = this.roadmapProject!.iterationField.configuration.iterations[0].id;
        const streamId = this.roadmapProject!.streamField.options.find((o) => o.name === stream)!.id;

        return items.filter((i) => {
            return i.stream?.optionId === streamId && i.iteration?.iterationId === iterationId;
        });
    }

    async getOpenStreamItems(stream: string): Promise<RoadmapItem[]> {
        const items = await this.getStreamItems(stream);

        return items.filter((i) => {
            return i.content?.state === 'OPEN';
        });
    }

    private async pageItems(query: string, cursor?: string): Promise<RoadmapItem[]> {
        const items: RoadmapItem[] = [];

        const results = await this.graphql<{ organization: { project: { items: RoadmapItemConnection } } }>(query, {
            owner: this.organization,
            number: this.project,
            iteration: this.iterationField,
            stream: this.streamField,
            cursor: cursor ?? null,
        });

        const { nodes, pageInfo } = results.organization.project.items;

        items.push(...nodes as RoadmapItem[]);

        if (nodes!.length === 100 && cursor != pageInfo.endCursor) {
            const nextPage = await this.pageItems(query, pageInfo.endCursor!);
            items.push(...nextPage);
        }

        return items;
    }

    /**
     * Gets all items from the project board with the iteration and stream fields
     *
     * @returns all items on the project board
     */
    private async getItems(): Promise<RoadmapItem[]> {
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

        const items = await this.pageItems(query);

        return items.filter((i) => {
            return !!i.content?.labels?.nodes?.every((l) => l!.name !== 'feature' && l!.name !== 'epic');
        });
    }
}

export class Roadmap {
    constructor(private graphql: graphql, private project: Project) { }

    async createTrackingIssues(owner: string, name: string): Promise<Issue[]> {
        const streams = this.project.getStreams().filter((s) => s.name !== 'Shield');
        const issues = await Promise.all(streams.map(async (stream): Promise<Issue | undefined> => {
            const items = await this.project.getStreamItems(stream.name);
            if (items.length > 0) {
                const trackingIssue = await this.createTrackingIssue(owner, name, stream.name, items);
                return trackingIssue;
            }
        }));

        return issues.filter((i) => i !== undefined) as Issue[];
    }

    async updateTrackingIssues(owner: string, name: string): Promise<void> {
        const trackingIssues = await this.findTrackingIssues(owner, name);
        const streams = this.project.getStreams().filter((s) => s.name !== 'Shield');
        await Promise.all(streams.map(async (stream) => {
            const trackingIssue = trackingIssues.find((i) => i.title === `${stream.name} - ${this.project?.getCurrentIterationName()}`);
            const items = await this.project.getOpenStreamItems(stream.name);
            if (trackingIssue && items.length > 0) {
                await this.updateTrackingIssue(owner, name, trackingIssue.number, items);
            }
        }));
    }

    private async createTrackingIssue(owner: string, name: string, stream: string, items: RoadmapItem[]): Promise<Issue> {
        const taskListItems = items.map(item => `- [ ] ${item.content.url}`).join("\n");
        const body = "```[tasklist]\n### Committed Tasks\n" + taskListItems + "\n```";

        const trackingIssue = await this.createIssue(owner, name, `${stream} - ${this.project?.getCurrentIterationName()}`, body);

        return trackingIssue;
    }

    private async updateTrackingIssue(owner: string, name: string, number: number, items: RoadmapItem[]): Promise<void> {
        const issue = await this.getIssue(owner, name, number);
        const taskListItems = items.map(item => `- [ ] ${item.content.url}`).join("\n");
        const body = issue.body + "\n" + "```[tasklist]\n### Remaining Tasks as of " + new Date().toLocaleDateString() + "\n" + taskListItems + "\n```";
        await this.updateIssue(issue, body);
    }

    private async findTrackingIssues(owner: string, name: string): Promise<Issue[]> {
        const query = `
            query($owner: String!, $name: String!) {
                organization(login: $owner) {
                    repository(name: $name) {
                        issues(first: 100, states:OPEN, labels:"sprint-tracking") {
                            nodes {
                                id
                                number
                                title
                                body
                            }
                        }
                    }
                }
            }
        `;

        const result = await this.graphql<{ organization: { repository: { issues: IssueConnection } } }>(query, {
            owner,
            name,
        });

        return result.organization.repository.issues.nodes as Issue[];
    }

    private async createIssue(owner: string, name: string, title: string, body: string): Promise<Issue> {
        const repository = await this.getRepository(owner, name);
        const query = `
        mutation CreateIssue($input: CreateIssueInput!) {
            createIssue(input: $input) {
                issue {
                    id
                    number
                }
            }
        }
        `;

        const result = await this.graphql<{ createIssue: CreateIssuePayload }>(
            query,
            {
                input: {
                    repositoryId: repository.id,
                    title,
                    body,
                    labelIds: ["LA_kwDOEK6vU88AAAABdiowYQ"], // sprint-tracking
                } as CreateIssueInput
            }
        );

        return result.createIssue.issue!;
    }

    private async updateIssue(issue: Issue, body: string): Promise<Issue> {
        const query = `
        mutation UpdateIssue($input: UpdateIssueInput!) {
          updateIssue(input: $input) {
            issue {
              id
              number
            }
          }
        }
      `;

        const result = await this.graphql<{ updateIssue: UpdateIssuePayload }>(
            query,
            {
                input: {
                    id: issue.id,
                    body,
                } as UpdateIssueInput
            }
        );

        return result.updateIssue.issue!;
    }

    private async getIssue(owner: string, name: string, number: number): Promise<Issue> {
        const query = `
        query ($owner: String!, $name: String!, $number: Int!) { 
            repository (owner: $owner, name: $name) { 
                issueOrPullRequest (number: $number) {
                    ... on Issue {
                        repository {
                            owner {
                                id
                                login
                            }
                            name
                        }
                        id
                        number
                        title
                        body
                    }
                }
            }
        }
            `;

        const result = await this.graphql<{ repository: { issueOrPullRequest: Issue } }>(query, {
            owner,
            name,
            number,
        });

        return result.repository.issueOrPullRequest;
    }

    private async getRepository(owner: string, name: string): Promise<Repository> {
        const query = `
        query ($owner: String!, $name: String!) { 
          repository (owner: $owner, name: $name) { 
            id
            owner {
              id
              login
            }
            name
          }
        }
            `;

        const result = await this.graphql<{ repository: Repository }>(query, {
            owner,
            name,
        });

        return result.repository;
    }
}