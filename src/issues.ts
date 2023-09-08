import { CreateIssueInput, CreateIssuePayload, Issue, Repository } from '@octokit/graphql-schema';
import { GraphQlResponse, RequestParameters } from '@octokit/graphql/dist-types/types';

type graphql = <ResponseData>(query: string, parameters?: RequestParameters) => GraphQlResponse<ResponseData>;

export interface IssueHierarchy {
  parent: Issue;
  issues: Issue[];
}

export class IssueHierarchyBuilder {
  constructor(private graphql: graphql) { }

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
          number
          title
          trackedIssues (first:100) {
            totalCount
            nodes {
              id
              number
              title
              repository {
                owner {
                  id
                  login
                }
                name
              }
            }
          }
          trackedInIssues (first: 100) {
            totalCount
            nodes {
              id
              number
              title
              repository {
                owner {
                  id
                  login
                }
                name
              }
            }
          }
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

  private async getTrackedIssues(owner: string, name: string, number: number): Promise<Issue[]> {
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
          number
          title
          trackedIssues (first:100) {
            totalCount
            nodes {
              id
              number
              title
              repository {
                owner {
                  id
                  login
                }
                name
              }
            }
          }
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

    const issue = result.repository.issueOrPullRequest;

    const issues: Issue[] = [];

    // GraphQL response will return an empty object if the item is not an issue
    if (!Object.hasOwn(issue, "number")) {
      return issues;
    }

    if (issue.trackedIssues.totalCount > 0) {
      for (const trackedIssue of issue.trackedIssues.nodes!) {
        console.log(`Tracked issue: ${trackedIssue!.number} - ${trackedIssue!.title}`);
        issues.push(trackedIssue!);
        const trackedIssues = await this.getTrackedIssues(trackedIssue!.repository.owner.login, trackedIssue!.repository.name, trackedIssue!.number);
        issues.push(...(trackedIssues));
      };
    }

    return issues;
  }

  public async getIssueHierarchy(owner: string, name: string, number: number): Promise<IssueHierarchy> {
    const parentIssue = await this.getIssue(owner, name, number);
    const trackedIssues = await this.getTrackedIssues(owner, name, number);
    const deduped = trackedIssues.filter((issue, index, self) => self.findIndex(i => i.number === issue.number) === index);

    return {
      parent: parentIssue,
      issues: deduped,
    };
  }


  public async createTrackingIssue(issueHierarchy: IssueHierarchy): Promise<Issue> {
    const parentIssue = issueHierarchy.parent;
    const issues = issueHierarchy.issues;
    const issuesUrl = issues.map(issue => `${issue.repository.owner.login}/${issue.repository.name}#${issue.number}`);
    const taskListItems = issuesUrl.map(issueUrl => `- [ ] ${issueUrl}`).join("\n");
    const body = "```[tasklist]\n### Tasks\n" + taskListItems + "\n```";

    const repository = await this.getRepository(parentIssue.repository.owner.login, parentIssue.repository.name);

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
          title: `Tracking issue for ${parentIssue.number} - ${parentIssue.title}`,
          body,
        } as CreateIssueInput
      }
    );

    return result.createIssue.issue!;
  }
}