import * as core from "@actions/core";
import * as github from "@actions/github";
import { Project } from "./project";
import { Roadmap } from "./roadmap";
import { getOctokit } from "./throttledOctokit";

async function run(): Promise<void> {
  const token = `${process.env.PAT_TOKEN}`;
  const { graphql } = getOctokit(token);
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
