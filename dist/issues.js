"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssueHierarchyBuilder = void 0;
var IssueHierarchyBuilder = /** @class */ (function () {
    function IssueHierarchyBuilder(graphql) {
        this.graphql = graphql;
    }
    IssueHierarchyBuilder.prototype.getRepository = function (owner, name) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n    query ($owner: String!, $name: String!) { \n      repository (owner: $owner, name: $name) { \n        id\n        owner {\n          id\n          login\n        }\n        name\n      }\n    }\n        ";
                        return [4 /*yield*/, this.graphql(query, {
                                owner: owner,
                                name: name,
                            })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.repository];
                }
            });
        });
    };
    IssueHierarchyBuilder.prototype.getIssue = function (owner, name, number) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n    query ($owner: String!, $name: String!, $number: Int!) { \n      repository (owner: $owner, name: $name) { \n        issueOrPullRequest (number: $number) {\n        ... on Issue {\n          repository {\n            owner {\n              id\n              login\n            }\n            name\n          }\n          number\n          title\n          trackedIssues (first:100) {\n            totalCount\n            nodes {\n              id\n              number\n              title\n              repository {\n                owner {\n                  id\n                  login\n                }\n                name\n              }\n            }\n          }\n          trackedInIssues (first: 100) {\n            totalCount\n            nodes {\n              id\n              number\n              title\n              repository {\n                owner {\n                  id\n                  login\n                }\n                name\n              }\n            }\n          }\n        }\n      }\n      }\n    }\n        ";
                        return [4 /*yield*/, this.graphql(query, {
                                owner: owner,
                                name: name,
                                number: number,
                            })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.repository.issueOrPullRequest];
                }
            });
        });
    };
    IssueHierarchyBuilder.prototype.getTrackedIssues = function (owner, name, number) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result, issue, issues, _a, _b, trackedIssue, trackedIssues, e_1_1;
            var e_1, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        query = "\n    query ($owner: String!, $name: String!, $number: Int!) { \n      repository (owner: $owner, name: $name) { \n        issueOrPullRequest (number: $number) {\n        ... on Issue {\n          repository {\n            owner {\n              id\n              login\n            }\n            name\n          }\n          number\n          title\n          trackedIssues (first:100) {\n            totalCount\n            nodes {\n              id\n              number\n              title\n              repository {\n                owner {\n                  id\n                  login\n                }\n                name\n              }\n            }\n          }\n        }\n      }\n      }\n    }\n        ";
                        return [4 /*yield*/, this.graphql(query, {
                                owner: owner,
                                name: name,
                                number: number,
                            })];
                    case 1:
                        result = _d.sent();
                        issue = result.repository.issueOrPullRequest;
                        issues = [];
                        // GraphQL response will return an empty object if the item is not an issue
                        if (!Object.hasOwn(issue, "number")) {
                            return [2 /*return*/, issues];
                        }
                        if (!(issue.trackedIssues.totalCount > 0)) return [3 /*break*/, 10];
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 7, 8, 9]);
                        _a = __values(issue.trackedIssues.nodes), _b = _a.next();
                        _d.label = 3;
                    case 3:
                        if (!!_b.done) return [3 /*break*/, 6];
                        trackedIssue = _b.value;
                        console.log("Tracked issue: ".concat(trackedIssue.number, " - ").concat(trackedIssue.title));
                        issues.push(trackedIssue);
                        return [4 /*yield*/, this.getTrackedIssues(trackedIssue.repository.owner.login, trackedIssue.repository.name, trackedIssue.number)];
                    case 4:
                        trackedIssues = _d.sent();
                        issues.push.apply(issues, __spreadArray([], __read((trackedIssues)), false));
                        _d.label = 5;
                    case 5:
                        _b = _a.next();
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 9];
                    case 8:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 9:
                        ;
                        _d.label = 10;
                    case 10: return [2 /*return*/, issues];
                }
            });
        });
    };
    IssueHierarchyBuilder.prototype.getIssueHierarchy = function (owner, name, number) {
        return __awaiter(this, void 0, void 0, function () {
            var parentIssue, trackedIssues, deduped;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getIssue(owner, name, number)];
                    case 1:
                        parentIssue = _a.sent();
                        return [4 /*yield*/, this.getTrackedIssues(owner, name, number)];
                    case 2:
                        trackedIssues = _a.sent();
                        deduped = trackedIssues.filter(function (issue, index, self) { return self.findIndex(function (i) { return i.number === issue.number; }) === index; });
                        return [2 /*return*/, {
                                parent: parentIssue,
                                issues: deduped,
                            }];
                }
            });
        });
    };
    IssueHierarchyBuilder.prototype.createTrackingIssue = function (issueHierarchy) {
        return __awaiter(this, void 0, void 0, function () {
            var parentIssue, issues, issuesUrl, taskListItems, body, repository, query, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        parentIssue = issueHierarchy.parent;
                        issues = issueHierarchy.issues;
                        issuesUrl = issues.map(function (issue) { return "".concat(issue.repository.owner.login, "/").concat(issue.repository.name, "#").concat(issue.number); });
                        taskListItems = issuesUrl.map(function (issueUrl) { return "- [ ] ".concat(issueUrl); }).join("\n");
                        body = "```[tasklist]\n### Tasks\n" + taskListItems + "\n```";
                        return [4 /*yield*/, this.getRepository(parentIssue.repository.owner.login, parentIssue.repository.name)];
                    case 1:
                        repository = _a.sent();
                        query = "\n    mutation CreateIssue($input: CreateIssueInput!) {\n      createIssue(input: $input) {\n        issue {\n          id\n          number\n        }\n      }\n    }\n  ";
                        return [4 /*yield*/, this.graphql(query, {
                                input: {
                                    repositoryId: repository.id,
                                    title: "Tracking issue for ".concat(parentIssue.number, " - ").concat(parentIssue.title),
                                    body: body,
                                }
                            })];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.createIssue.issue];
                }
            });
        });
    };
    return IssueHierarchyBuilder;
}());
exports.IssueHierarchyBuilder = IssueHierarchyBuilder;
//# sourceMappingURL=issues.js.map