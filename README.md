# Anmol

[![Open in GitHub Codespaces (Current Branch)](https://github.com/codespaces/badge.svg)](https://codespaces.new/anmol6656/Anmol?ref=arena/019f6fce-anmol)
[![Open in GitHub Codespaces (Main Branch)](https://img.shields.io/badge/Open%20in%20Codespaces-Main%20Branch-24292e?logo=github)](https://codespaces.new/anmol6656/Anmol?ref=main)

Welcome to the **Anmol** repository! This repository is configured with a fully customized GitHub Codespace (`.devcontainer`) ready for development.

---

## 🚀 How to Launch a Codespace

You can launch a fully configured, cloud-hosted VS Code environment directly from GitHub:

### Option 1: 1-Click Launch (Browser / VS Code)
Click one of the buttons below to create and open your Codespace immediately:

- **[Launch Codespace on `arena/019f6fce-anmol` (Current Working Branch)](https://codespaces.new/anmol6656/Anmol?ref=arena/019f6fce-anmol)**
- **[Launch Codespace on `main` Branch](https://codespaces.new/anmol6656/Anmol?ref=main)**

### Option 2: From the GitHub Repository UI
1. Go to the repository page on GitHub: [anmol6656/Anmol](https://github.com/anmol6656/Anmol)
2. Click the green **`<> Code`** button.
3. Switch to the **`Codespaces`** tab.
4. Click **`Create codespace on arena/019f6fce-anmol`** (or `main`).

### Option 3: From GitHub CLI (`gh`)
If you have the GitHub CLI installed on your local terminal, you can create and connect to your Codespace via command line:

```bash
# Create and open a codespace for the current branch
gh codespace create --repo anmol6656/Anmol --branch arena/019f6fce-anmol

# Or create a codespace for the main branch
gh codespace create --repo anmol6656/Anmol --branch main

# List your existing codespaces
gh codespace list
```

---

## 🛠️ Dev Container Configuration

Our `.devcontainer/devcontainer.json` pre-configures your environment with:
- **Base Image:** Microsoft Universal Dev Container (`universal:2`)
- **Languages:** Pre-installed and configured **Python 3** and **Node.js**
- **Tools:** **GitHub CLI (`gh`)**, **Git**, and common Linux utilities
- **VS Code Extensions:**
  - Python (`ms-python.python`)
  - Prettier (`esbenp.prettier-vscode`)
  - GitLens (`eamodio.gitlens`)
  - GitHub Pull Requests (`GitHub.vscode-pull-request-github`)
