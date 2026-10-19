# ATM Sentinel

ATM Sentinel is an academic prototype for monitoring ATM transactions and identifying unusual transaction patterns. It combines a React-based dashboard with machine-learning anomaly detection to help users explore transactions, review alerts, and understand ATM activity.

> **Important:** ATM Sentinel is a demonstration project, not a production banking security system. It uses synthetic transaction data and simulated ATM locations. It is not connected to live bank systems, and its alerts do not establish that fraud has occurred.

## Features

- **Dashboard:** Summary statistics for transactions and detected anomalies.
- **Transaction Explorer:** Browse and filter transaction records.
- **Anomaly Detection:** Review unusual transactions using precomputed Isolation Forest results.
- **Withdrawal Threshold Alerts:** Independently flag cash withdrawals of MWK 100,000 or more.
- **Analytics:** Explore transaction patterns and anomaly statistics.
- **Reports:** Export supported transaction and alert data to CSV.
- **ATM Network:** Explore simulated ATM locations and related transaction information.
- **Settings:** Configure supported dashboard preferences and alert visibility.
- **Model Information:** View information about the anomaly-detection approach and its results.

## Technology Stack

- React
- Vite
- Tailwind CSS
- JavaScript
- Python
- pandas
- NumPy
- scikit-learn
- Supabase client library

## How Anomaly Detection Works

ATM Sentinel uses the Isolation Forest machine-learning algorithm to identify transactions that appear unusual compared with the data used by the model.

The application also applies a separate withdrawal threshold rule. These are different mechanisms:

- **Model alert:** A transaction is flagged by the anomaly-detection results.
- **Threshold alert:** A cash withdrawal meets or exceeds MWK 100,000.

A transaction can trigger one mechanism without necessarily triggering the other.

The anomaly score represents unusualness; it is **not a probability that a transaction is fraudulent**. The system has not been validated as a real-world fraud detector using a verified, labelled banking dataset.

## Project Structure

```text
ATM-Sentinel/
├── dataset/          # Transaction dataset files
├── frontend/         # React and Vite application
├── ml/               # Machine-learning scripts
├── requirements.txt  # Python dependencies
├── .gitignore
└── README.md
```

## Requirements

Install the following before running the project:

- Python 3
- Node.js and npm
- Git (optional if you already have the project files)

## Run the Application

### 1. Open the project directory

Open a terminal in the root directory of the project.

If you cloned the repository, you can navigate to it using:

```bash
cd ATM-Sentinel
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local URL displayed in the terminal, usually `http://localhost:5173`.

### 4. Run frontend checks

From the `frontend` directory, run the commands supported by your project:

```bash
npm test
npm run lint
npm run build
```

Run these separately. If a script is not defined in `frontend/package.json`, its command will not work until the corresponding script is configured.

## Python Environment

The repository includes Python-related files and a `requirements.txt` file. To create a separate Python environment, run the following commands from the project root.

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

The precomputed anomaly results allow the frontend to display model results without necessarily running model training each time the application starts. Follow the machine-learning script's instructions if you need to regenerate those results.

## Data and Security

- Transaction data, anomaly results, and ATM locations used in the demonstration are synthetic.
- Do not upload real customer information, banking records, passwords, API keys, or private environment files.
- Use `.env.example` only as a template containing placeholder values and variable names, never real credentials.
- Any Supabase configuration or integration should be configured with appropriate access controls before deployment.

## Limitations

- No live bank or ATM transaction feed is connected.
- Anomaly alerts are not confirmed cases of fraud.
- Model performance on real banking transactions has not been established.
- ATM locations are simulated.
- CSV export is supported; PDF report export is not currently implemented.
- Production deployment, real-world model validation, and additional security testing are outside the scope of this prototype.

## Project Status

ATM Sentinel is an academic demonstration intended to explore transaction monitoring, anomaly detection, and dashboard-based analysis.

## Project Portfolio

View the project's portfolio and system overview:

[ATM Sentinel Portfolio](https://desire1515.github.io/ATM-Sentinel-Portfolio/)
