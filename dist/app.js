"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const roadmap_1 = require("./roadmap");
const plugin_throttling_1 = require("@octokit/plugin-throttling");
const rest_1 = require("@octokit/rest");
const ThrottledOctokit = rest_1.Octokit.plugin(plugin_throttling_1.throttling);
const token = `${process.env.PAT_TOKEN}`;
const octoKit = new ThrottledOctokit({
    auth: token,
    previews: ["cloak"],
    throttle: {
        onRateLimit: (retryAfter, options, octokit) => {
            octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
            octokit.log.info(`Retrying after ${retryAfter} seconds for the ${options.request.retryCount} time!`);
            return true;
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
            // does not retry, only logs a warning
            octokit.log.warn(`Abuse detected for request ${options.method} ${options.url}`);
            octokit.log.info(`Retrying after ${retryAfter} seconds for the ${options.request.retryCount} time!`);
            return true;
        },
    },
});
const graphql = octoKit.graphql;
(async () => {
    const project = new roadmap_1.Project(graphql, "github", 3898, "Sprint", "Stream", "Sprint 74");
    await project.initialize();
    const roadmap = new roadmap_1.Roadmap(graphql, project);
    await roadmap.createTrackingIssues("github", "security-center");
    await roadmap.updateTrackingIssues("github", "security-center");
})();
//# sourceMappingURL=app.js.map