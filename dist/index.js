"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const roadmap_1 = require("./roadmap");
async function run() {
    const token = `${process.env.PAT_TOKEN}`;
    const graphql = github.getOctokit(token).graphql;
    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;
    const project = new roadmap_1.Project(graphql, owner, 3898, "Sprint", "Stream");
    await project.initialize();
    const roadmap = new roadmap_1.Roadmap(graphql, project);
    const createTrackingIssues = core.getBooleanInput('start-of-sprint');
    if (createTrackingIssues) {
        await roadmap.createTrackingIssues(owner, repo);
    }
    else {
        await roadmap.updateTrackingIssues(owner, repo);
    }
}
run();
//# sourceMappingURL=index.js.map