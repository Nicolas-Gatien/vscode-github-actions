import * as vscode from "vscode";
import { ActionsExplorerProvider } from "./explorer/provider";
import { initResources } from "./explorer/icons";
import { Workflow } from "./model";
import { join } from "path";
import { setPAT } from "./auth/pat";
import { getWorkflowUri } from "./workflow/workflow";
import { OctokitWithActions } from "./typings/api";
import { Protocol } from "./external/protocol";

export function activate(context: vscode.ExtensionContext) {
  initResources(context);

  // Actions Explorer
  const explorerTreeProvider = new ActionsExplorerProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "actionsExplorer",
      explorerTreeProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("explorer.refresh", () => {
      explorerTreeProvider.refresh();
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("explorer.openRun", args => {
      const url = args.url || args;
      vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(url));
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("explorer.openWorkflowFile", async args => {
      const wf: Workflow = args.wf;

      const fileUri = getWorkflowUri(wf.path);
      if (fileUri) {
        const textDocument = await vscode.workspace.openTextDocument(fileUri);
        vscode.window.showTextDocument(textDocument);
        return;
      }

      // File not found in workspace
      vscode.window.showErrorMessage(
        `Workflow ${wf.path} not found in current workspace`
      );
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("explorer.triggerRun", async args => {
      const event_type = await vscode.window.showInputBox({
        prompt: "Enter `event_type` to dispatch to the repository",
        value: "default"
      });
      if (event_type) {
        const repo: Protocol = args.repo;
        const client: OctokitWithActions = args.client;

        await client.repos.createDispatchEvent({
          owner: repo.owner,
          repo: repo.repositoryName,
          event_type,
          client_payload: {}
        });

        vscode.window.setStatusBarMessage(
          `GitHub Actions: Repository event '${event_type}' dispatched`,
          2000
        );
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("auth.login", async () => {
      const selection = await vscode.window.showQuickPick([
        "Enter PAT",
        "Use OAuth flow (coming soon)"
      ]);

      switch (selection) {
        case "Enter PAT":
          const token = await vscode.window.showInputBox({
            prompt: "Enter a GitHub PAT with `workflow` and `repo` scope:"
          });
          if (token) {
            await setPAT(token);
            explorerTreeProvider.refresh();
          }
          break;
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}