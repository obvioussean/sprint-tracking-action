import * as core from '@actions/core';
import * as github from '@actions/github';
import { IssueHierarchyBuilder } from './issues';


async function run(): Promise<void> {
    const token = `${process.env.PAT_TOKEN}`;
    const graphql = github.getOctokit(token).graphql;

    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;
    const number = github.context.payload.issue!.number;

    const labels = github.context.payload.issue!.labels.map(l => l.name);
    if (labels.any(l => l === 'expand-tracking')) {
        const ihb = new IssueHierarchyBuilder(graphql);
        const issues = await ihb.getIssueHierarchy(owner, repo, number);
        const issue = await ihb.createTrackingIssue(issues);
        core.info(JSON.stringify(issue));
    }
}

run();