import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "@octokit/rest";
import { Project } from "./project";
import { Roadmap } from "./roadmap";

const ThrottledOctokit = Octokit.plugin(throttling);

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
    onSecondaryRateLimit: (retryAfter: number, options: any, octokit: any) => {
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
