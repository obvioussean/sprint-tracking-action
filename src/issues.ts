import {
  AddCommentInput,
  AddCommentPayload,
  CreateIssueInput,
  CreateIssuePayload,
  Issue,
  Repository,
  UpdateIssueInput,
  UpdateIssuePayload,
} from "@octokit/graphql-schema";
import { graphql } from "./types";

export class Issues {
  public constructor(private graphql: graphql) {}

  async createIssue(
    owner: string,
    repo: string,
    title: string,
    body: string,
    label?: string
  ): Promise<Issue> {
    const repository = await this.getRepository(owner, repo);
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

    const labelId = label
      ? await this.getLabelId(owner, repo, label)
      : undefined;
    const result = await this.graphql<{ createIssue: CreateIssuePayload }>(
      query,
      {
        input: {
          repositoryId: repository.id,
          title,
          body,
          labelIds: labelId ? [labelId] : undefined,
        } as CreateIssueInput,
      }
    );

    return result.createIssue.issue!;
  }

  async updateIssue(issue: Issue, body: string): Promise<Issue> {
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
        } as UpdateIssueInput,
      }
    );

    return result.updateIssue.issue!;
  }

  async getIssue(owner: string, name: string, number: number): Promise<Issue> {
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

    const result = await this.graphql<{
      repository: { issueOrPullRequest: Issue };
    }>(query, {
      owner,
      name,
      number,
    });

    return result.repository.issueOrPullRequest;
  }

  async addIssueComment(issue: Issue, comment: string): Promise<void> {
    const query = `
        mutation AddComment($input: AddCommentInput!) {
            addComment(input: $input) {
                clientMutationId
            }
        }
        `;

    await this.graphql<{ addComment: AddCommentPayload }>(query, {
      input: {
        subjectId: issue.id,
        body: comment,
      } as AddCommentInput,
    });
  }

  private async getRepository(
    owner: string,
    name: string
  ): Promise<Repository> {
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

  private async getLabelId(
    owner: string,
    repo: string,
    name: string
  ): Promise<string> {
    const query = `
        query ($owner: String!, $repo: String!, $label: String!) {
            organization(login: $owner) {
                repository(name: $repo) {
                    label(name: $label) {
                        id
                    }
                }
            }
        }
        `;

    const result = await this.graphql<{
      organization: { repository: { label: { id: string } } };
    }>(query, {
      owner,
      repo,
      label: name,
    });

    return result.organization.repository.label.id;
  }
}
