import * as vscode from "vscode";
import {GitHubRepoContext} from "../../git/repository";
import {Environment} from "../../model";
import {EmptyNode} from "./emptyNode";
import {SecretNode} from "./secretNode";

export class EnvironmentSecretsNode extends vscode.TreeItem {
  constructor(public readonly gitHubRepoContext: GitHubRepoContext, public readonly environment: Environment) {
    super("Secrets", vscode.TreeItemCollapsibleState.Collapsed);

    this.iconPath = new vscode.ThemeIcon("lock");
  }

  async getSecrets(): Promise<(SecretNode | EmptyNode)[]> {
    const secrets = await this.gitHubRepoContext.client.paginate(
      this.gitHubRepoContext.client.actions.listEnvironmentSecrets,
      {
        repository_id: this.gitHubRepoContext.id,
        environment_name: this.environment.name,
        per_page: 100
      },
      response => response.data.map(s => new SecretNode(this.gitHubRepoContext, s, this.environment))
    );

    if (!secrets || secrets.length === 0) {
      return [new EmptyNode("No environment secrets defined")];
    }

    return secrets;
  }
}