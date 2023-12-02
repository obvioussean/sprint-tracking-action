import * as core from '@actions/core';
import * as github from '@actions/github';
import { Project, Roadmap } from './roadmap';


async function run(): Promise<void> {
    const token = `${process.env.PAT_TOKEN}`;
    const graphql = github.getOctokit(token).graphql;

    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;

    const project = new Project(graphql, owner, 3898, "Sprint", "Stream");
    await project.initialize();

    const roadmap = new Roadmap(graphql, project);

    const createTrackingIssues = core.getBooleanInput('start-of-sprint');

    if (createTrackingIssues) {
        await roadmap.createTrackingIssues(owner, repo);
    } else {
        await roadmap.updateTrackingIssues(owner, repo);
    }
}

run();