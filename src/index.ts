import * as core from '@actions/core';
import * as github from '@actions/github';
import { Project, Roadmap } from './roadmap';
import { throttling } from '@octokit/plugin-throttling';
import { Octokit } from '@octokit/rest';

const ThrottledOctokit = Octokit.plugin(throttling);

async function run(): Promise<void> {
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

    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;
    const iterationTitle = core.getInput('iteration');

    const project = new Project(graphql, owner, 3898, "Sprint", "Stream", iterationTitle);
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