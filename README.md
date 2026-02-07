# One-Click Deployment Tool 🚀

A beginner-friendly, one-click deployment tool for web-based projects. This tool allows you to easily clone public GitHub repositories, build them locally, and deploy them to platforms like Netlify or Vercel (simulated) with a single click.

## Features ✨

- **One-Click Deploy**: Simply paste a GitHub URL and click deploy.
- **Local Cloning**: Automatically clones repositories to your local machine for inspection.
- **Smart Build Detection**: Detects `package.json` and runs build scripts automatically.
- **Deployment History**: Keeps track of all your past deployments with status and logs.
- **Live Logs**: Watch the deployment process in real-time with a terminal-like log viewer.
- **Clone Management**: View and manage locally cloned repositories.

## Getting Started 🛠️

### Prerequisites

- Node.js 18+ installed on your machine.
- Git installed and available in your system PATH.

### Installation

1.  **Clone this repository** (or download source):
    ```bash
    git clone <your-repo-url>
    cd one_click_deployment
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  **Open the application**:
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Usage 📖

1.  **Enter Repository URL**: Paste the HTTPS URL of a public GitHub repository (e.g., `https://github.com/username/project.git`).
2.  **Select Platform**: Choose between Vercel (Simulated) or Netlify.
3.  **Deploy**: Click the "Deploy" button.
4.  **Monitor**: Watch the logs as the tool clones, installs dependencies, builds, and deploys.
5.  **History**: Check the "Deployment History" table below to manage or visit your deployed sites.

## Project Structure 📂

- `src/lib/deployment.js`: Core logic for cloning, building, and deploying.
- `src/app/api`: Backend API routes for handling requests.
- `src/components`: UI components (Header, Form, StatusPanel, Tables).
- `data/`: Local JSON database storing history (ignored by git).
- `temp_deployments/`: Temporary folder for cloned repos (ignored by git).

## License

MIT
