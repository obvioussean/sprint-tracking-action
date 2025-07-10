import { Project } from "./project";
import { Roadmap } from "./roadmap";
import { getOctokit } from "./throttledOctokit";

const token = `${process.env.PAT_TOKEN}`;
const { graphql } = getOctokit(token);
const owner = "github";
const repo = "copilot-voyager";

(async () => {
  const project = new Project(graphql, owner, 3898, "Sprint", "Stream");
  await project.initialize();

  const roadmap = new Roadmap(graphql, project);

  console.log(project.getCurrentIterationName());

  await roadmap.createTrackingIssue(owner, repo, "sprint-tracking");
  // await roadmap.updateTrackingIssue(owner, repo, "sprint-tracking");
})();
