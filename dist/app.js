"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("@octokit/graphql");
const issues_1 = require("./issues");
const graphqlWithAuth = graphql_1.graphql.defaults({
    headers: {
        authorization: `token ${process.env.GITHUB_PASSWORD}`,
    },
});
(async () => {
    const ihb = new issues_1.IssueHierarchyBuilder(graphqlWithAuth);
    const issues = await ihb.getIssueHierarchy("github", "security-center", 3404);
    const issue = await ihb.createTrackingIssue(issues);
    console.log(JSON.stringify(issue));
})();
//# sourceMappingURL=app.js.map