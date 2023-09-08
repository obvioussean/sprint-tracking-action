import * as core from '@actions/core';
import * as github from '@actions/github';
import { IssueHierarchyBuilder } from './issues';
import { Label } from '@octokit/graphql-schema';


async function run(): Promise<void> {
    const token = `${process.env.PAT_TOKEN}`;
    const graphql = github.getOctokit(token).graphql;

    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;
    const number = github.context.payload.issue!.number;

    const labels = github.context.payload.issue!.labels.map((l: Label) => l.name);
    if (labels.filter((l: string) => l === 'expand-tracking').length > 0) {
        const ihb = new IssueHierarchyBuilder(graphql);
        const issues = await ihb.getIssueHierarchy(owner, repo, number);
        const issue = await ihb.createTrackingIssue(issues);
        core.info(JSON.stringify(issue));
    }
}

run();