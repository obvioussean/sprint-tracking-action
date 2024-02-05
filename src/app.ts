import { Project, Roadmap } from './roadmap';
import { throttling } from '@octokit/plugin-throttling';
import { Octokit } from '@octokit/rest';

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

            octokit.log.info(`Retrying after ${retryAfter} seconds for the ${options.request.retryCount} time!`);

            return true;
        },
        onSecondaryRateLimit: (retryAfter: number, options: any, octokit: any) => {
            // does not retry, only logs a warning
            octokit.log.warn(
                `Abuse detected for request ${options.method} ${options.url}`
            );

            octokit.log.info(`Retrying after ${retryAfter} seconds for the ${options.request.retryCount} time!`);

            return true;
        },
    },
});
const graphql = octoKit.graphql;

(async () => {
    const project = new Project(graphql, "github", 3898, "Sprint", "Stream", "Sprint 74");
    await project.initialize();

    const roadmap = new Roadmap(graphql, project);

    await roadmap.createTrackingIssues("github", "security-center");
    await roadmap.updateTrackingIssues("github", "security-center");
})();