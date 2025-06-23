import * as core from "@actions/core";
import * as github from "@actions/github";
import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "@octokit/rest";
import { Project } from "./project";
import { Roadmap } from "./roadmap";

const ThrottledOctokit = Octokit.plugin(throttling);

async function run(): Promise<void> {
  const token = `${process.env.PAT_TOKEN}`;
  const octoKit = new ThrottledOctokit({
    auth: token,
    previews: ["cloak"],
    throttle: {
      onRateLimit: (retryAfter: number, options: any, octokit: any) => {
        octokit.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );

        octokit.log.info(
          `Retrying after ${retryAfter} seconds for the ${options.request.retryCount} time!`
        );

        return true;
      },
      onSecondaryRateLimit: (
        retryAfter: number,
        options: any,
        octokit: any
      ) => {
        // does not retry, only logs a warning
        octokit.log.warn(
          `Abuse detected for request ${options.method} ${options.url}`
        );

        octokit.log.info(
          `Retrying after ${retryAfter} seconds for the ${options.request.retryCount} time!`
        );

        return true;
      },
    },
  });
  const { graphql } = octoKit;

  const { owner, repo } = github.context.repo;
  const projectId = Number.parseInt(core.getInput("project-id"));
  const iterationField = core.getInput("iteration");
  const streamField = core.getInput("stream");

  const project = new Project(
    graphql,
    owner,
    projectId,
    iterationField,
    streamField
  );
  await project.initialize();

  const roadmap = new Roadmap(graphql, project);

  const trackingIssueLabel = core.getInput("tracking-issue-label");
  const createTrackingIssues = core.getBooleanInput("start-of-sprint");

  if (createTrackingIssues) {
    await roadmap.createTrackingIssue(owner, repo, trackingIssueLabel);
  } else {
    await roadmap.updateTrackingIssue(owner, repo, trackingIssueLabel);
  }
}

run();
