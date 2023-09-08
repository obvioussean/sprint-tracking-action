import { graphql } from '@octokit/graphql';
import { IssueHierarchyBuilder } from './issues';

const graphqlWithAuth = graphql.defaults({
    headers: {
        authorization: `token ${process.env.GITHUB_PASSWORD}`,
    },
});

(async () => {
    const ihb = new IssueHierarchyBuilder(graphqlWithAuth);
    const issues = await ihb.getIssueHierarchy("github", "security-center", 3404);
    const issue = await ihb.createTrackingIssue(issues);
    console.log(JSON.stringify(issue));
})();