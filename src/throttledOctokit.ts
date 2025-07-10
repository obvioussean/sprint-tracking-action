import { Octokit } from "@octokit/core";
import { throttling } from "@octokit/plugin-throttling";
import { RequestOptions } from "@octokit/types";

const ThrottledOctokit = Octokit.plugin(throttling);

export function getOctokit(token: string): Octokit {
  const octoKit = new ThrottledOctokit({
    auth: token,
    previews: ["cloak"],
    throttle: {
      onRateLimit: (
        retryAfter: number,
        options: RequestOptions,
        octokit: Octokit,
        retryCount: number
      ) => {
        octokit.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );

        octokit.log.info(
          `Retrying after ${retryAfter} seconds for the ${retryCount} time!`
        );

        return true;
      },
      onSecondaryRateLimit: (
        retryAfter: number,
        options: RequestOptions,
        octokit: Octokit,
        retryCount: number
      ) => {
        // does not retry, only logs a warning
        octokit.log.warn(
          `Abuse detected for request ${options.method} ${options.url}`
        );

        octokit.log.info(
          `Retrying after ${retryAfter} seconds for the ${retryCount} time!`
        );

        return true;
      },
    },
  });

  return octoKit;
}
