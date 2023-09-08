"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssueHierarchyBuilder = void 0;
class IssueHierarchyBuilder {
    graphql;
    constructor(graphql) {
        this.graphql = graphql;
    }
    async getRepository(owner, name) {
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
        const result = await this.graphql(query, {
            owner,
            name,
        });
        return result.repository;
    }
    async getIssue(owner, name, number) {
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
          labels(first: 100) {
            totalCount
            nodes {
              id
              name
            }
          }
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
        const result = await this.graphql(query, {
            owner,
            name,
            number,
        });
        return result.repository.issueOrPullRequest;
    }
    async createIssue(repositoryId, title, body) {
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
        const result = await this.graphql(query, {
            input: {
                repositoryId: repositoryId,
                title,
                body,
            }
        });
        return result.createIssue.issue;
    }
    async removeExpandTrackingLabel(issue) {
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
        const result = await this.graphql(query, {
            input: {
                id: issue.id,
                labelIds: issue.labels?.nodes?.filter(label => label?.name !== "expand-tracking").map(label => label.id),
            }
        });
        return result.updateIssue.issue;
    }
    async getTrackedIssues(owner, name, number) {
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
        const result = await this.graphql(query, {
            owner,
            name,
            number,
        });
        const issue = result.repository.issueOrPullRequest;
        const issues = [];
        // GraphQL response will return an empty object if the item is not an issue
        if (!Object.hasOwn(issue, "number")) {
            return issues;
        }
        if (issue.trackedIssues.totalCount > 0) {
            for (const trackedIssue of issue.trackedIssues.nodes) {
                console.log(`Tracked issue: ${trackedIssue.number} - ${trackedIssue.title}`);
                issues.push(trackedIssue);
                const trackedIssues = await this.getTrackedIssues(trackedIssue.repository.owner.login, trackedIssue.repository.name, trackedIssue.number);
                issues.push(...(trackedIssues));
            }
            ;
        }
        return issues;
    }
    async getIssueHierarchy(owner, name, number) {
        const parentIssue = await this.getIssue(owner, name, number);
        const trackedIssues = await this.getTrackedIssues(owner, name, number);
        const deduped = trackedIssues.filter((issue, index, self) => self.findIndex(i => i.number === issue.number) === index);
        return {
            parent: parentIssue,
            issues: deduped,
        };
    }
    async createTrackingIssue(issueHierarchy) {
        const parentIssue = issueHierarchy.parent;
        const issues = issueHierarchy.issues;
        const issuesUrl = issues.map(issue => `${issue.repository.owner.login}/${issue.repository.name}#${issue.number}`);
        const taskListItems = issuesUrl.map(issueUrl => `- [ ] ${issueUrl}`).join("\n");
        const body = "```[tasklist]\n### Tasks\n" + taskListItems + "\n```";
        const repository = await this.getRepository(parentIssue.repository.owner.login, parentIssue.repository.name);
        const trackingIssue = await this.createIssue(repository.id, `Tracking issue for ${parentIssue.number} - ${parentIssue.title}`, body);
        if (trackingIssue != null) {
            // remove the `expand-tracking` label
            await this.removeExpandTrackingLabel(parentIssue);
        }
        return trackingIssue;
    }
}
exports.IssueHierarchyBuilder = IssueHierarchyBuilder;
//# sourceMappingURL=issues.js.map