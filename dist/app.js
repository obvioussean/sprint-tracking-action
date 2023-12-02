"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("@octokit/graphql");
const roadmap_1 = require("./roadmap");
const graphqlWithAuth = graphql_1.graphql.defaults({
    headers: {
        authorization: `token ${process.env.GITHUB_PASSWORD}`,
    },
});
(async () => {
    const project = new roadmap_1.Project(graphqlWithAuth, "github", 3898, "Sprint", "Stream");
    await project.initialize();
    const roadmap = new roadmap_1.Roadmap(graphqlWithAuth, project);
    await roadmap.createTrackingIssues("github", "security-center");
    await roadmap.updateTrackingIssues("github", "security-center");
})();
//# sourceMappingURL=app.js.map