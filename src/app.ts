import { graphql } from '@octokit/graphql';
import { Project, Roadmap } from './roadmap';

const graphqlWithAuth = graphql.defaults({
    headers: {
        authorization: `token ${process.env.GITHUB_PASSWORD}`,
    },
});

(async () => {
    const project = new Project(graphqlWithAuth, "github", 3898, "Sprint", "Stream", "Sprint 74");
    await project.initialize();

    const roadmap = new Roadmap(graphqlWithAuth, project);

    await roadmap.createTrackingIssues("github", "security-center");
    await roadmap.updateTrackingIssues("github", "security-center");
})();