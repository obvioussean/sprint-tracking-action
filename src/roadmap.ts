import { Issue, IssueConnection } from "@octokit/graphql-schema";
import { Issues } from "./issues";
import { Project } from "./project";
import { graphql, RoadmapItem } from "./types";

export class Roadmap {
  private issues: Issues;

  constructor(private graphql: graphql, private project: Project) {
    this.issues = new Issues(graphql);
  }

  async createTrackingIssue(
    owner: string,
    repo: string,
    label: string
  ): Promise<Issue> {
    const streams = this.project
      .getStreams()
      .filter((s) => s.name !== "Shield");
    const streamItemsMap = new Map<string, RoadmapItem[]>();
    for (const stream of streams) {
      const items = await this.project.getStreamItems(stream.name);
      if (items.length > 0) {
        streamItemsMap.set(stream.name, items);
      }
    }

    let body = "";
    if (streamItemsMap.size > 0) {
      streamItemsMap.forEach((streamItems, stream) => {
        const urls = streamItems
          .map((item) => `- ${item.content.url}`)
          .join("\n");
        body += `### Committed Tasks for ${stream}\n${urls}\n`;
      });
    }

    return await this.issues.createIssue(
      owner,
      repo,
      `${this.project!.getCurrentIterationName()} Commitments`,
      body,
      label
    );
  }

  async updateTrackingIssue(
    owner: string,
    repo: string,
    label: string
  ): Promise<void> {
    const trackingIssue = await this.findTrackingIssue(owner, repo, label);

    const streams = this.project
      .getStreams()
      .filter((s) => s.name !== "Shield");
    const streamItemsMap = new Map<string, RoadmapItem[]>();
    for (const stream of streams) {
      const items = await this.project.getStreamItems(stream.name);
      if (items.length > 0) {
        streamItemsMap.set(stream.name, items);
      }
    }

    let body = "";
    if (streamItemsMap.size > 0) {
      streamItemsMap.forEach((streamItems, stream) => {
        let urls = "";
        streamItems.forEach((item) => {
          const pulledIn = !trackingIssue.body.includes(item.content.url);
          if (pulledIn) {
            urls += `- ${item.content.url}\n`;
          }
        });

        if (urls.length > 0) {
          body += `### Added tasks for ${stream}\n${urls}\n`;
        } else {
          body += `### No new tasks added for ${stream}.\n`;
        }
      });
    }

    await this.issues.addIssueComment(trackingIssue, body);
  }

  private async findTrackingIssue(
    owner: string,
    repo: string,
    label: string
  ): Promise<Issue> {
    const query = `
            query($owner: String!, $repo: String!, $label: [String!]) {
                organization(login: $owner) {
                    repository(name: $repo) {
                        issues(first: 100, states:OPEN, labels: $label) {
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

    const result = await this.graphql<{
      organization: { repository: { issues: IssueConnection } };
    }>(query, {
      owner,
      repo,
      label,
    });

    const title = this.project!.getCurrentIterationName();

    return result.organization.repository.issues.nodes!.find((issue) =>
      issue!.title.startsWith(title)
    )!;
  }
}
